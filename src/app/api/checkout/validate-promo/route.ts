import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nouamane_super_secret_key_2024'
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, items, subtotal } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code promo requis' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const promo = await prisma.promoCode.findUnique({
      where: { code: cleanCode }
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json({ error: 'Code promo invalide ou inactif' }, { status: 400 });
    }

    // 🔒 Check if account creation is obligatory for this promo code
    const requiresAccount = promo.requiresAccount ?? true;
    let authenticatedCustomer: any = null;

    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload?.id) {
          authenticatedCustomer = await prisma.customer.findUnique({
            where: { id: payload.id as string },
            select: { id: true, name: true, email: true }
          });
        }
      } catch {
        authenticatedCustomer = null;
      }
    }

    if (requiresAccount && !authenticatedCustomer) {
      return NextResponse.json({
        error: 'La création d\'un compte Maison NAY est obligatoire pour activer et utiliser ce code promo.',
        requiresAccount: true,
        code: promo.code,
        promoPreview: {
          code: promo.code,
          type: promo.type,
          value: promo.value,
          description: promo.description,
        }
      }, { status: 403 });
    }

    // Check expiration
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Ce code promo a expiré' }, { status: 400 });
    }

    // Check max uses
    if (promo.maxUses && promo.usageCount >= promo.maxUses) {
      return NextResponse.json({ error: 'Ce code promo a atteint sa limite d\'utilisation' }, { status: 400 });
    }

    // Parse product IDs & categories
    let parsedProductIds: number[] = [];
    let parsedCategories: string[] = [];
    if (promo.productIds) {
      try {
        parsedProductIds = JSON.parse(promo.productIds);
      } catch {
        parsedProductIds = [];
      }
    }
    if (promo.categories) {
      try {
        parsedCategories = JSON.parse(promo.categories);
      } catch {
        parsedCategories = [];
      }
    }

    // Check minimum order amount if subtotal provided
    if (promo.minOrderAmount && typeof subtotal === 'number' && subtotal < promo.minOrderAmount) {
      return NextResponse.json({
        error: `Ce code nécessite un panier minimum de ${promo.minOrderAmount} MAD (actuel: ${subtotal.toFixed(0)} MAD)`
      }, { status: 400 });
    }

    // Check minimum quantity / item count if required (e.g. more than 2 perfumes = min 3)
    const totalQuantity = Array.isArray(items)
      ? items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0)
      : 0;

    if (promo.minQuantity && promo.minQuantity > 0 && totalQuantity < promo.minQuantity) {
      const requiredMore = promo.minQuantity - 1;
      return NextResponse.json({
        error: `Ce code promo est valable uniquement si vous commandez plus de ${requiredMore} parfum${requiredMore > 1 ? 's' : ''} (minimum ${promo.minQuantity} flacons requis, actuel : ${totalQuantity}).`
      }, { status: 400 });
    }

    // Check category eligibility if applicable
    if (promo.applicableScope === 'CATEGORIES' && parsedCategories.length > 0) {
      const allProducts = await prisma.product.findMany({
        select: { id: true, gender: true, subcategory: true, subcategoryLabel: true, brandLabel: true, brandId: true }
      });

      const matchingIds = allProducts.filter(p => {
        const pGender = (p.gender || '').toLowerCase();
        const pSub = (p.subcategory || '').toLowerCase();
        const pBrand = (p.brandLabel || '').toLowerCase();

        return parsedCategories.some(cat => {
          const c = cat.toLowerCase();
          if (c === 'men') return pGender === 'men' || pGender === 'homme';
          if (c === 'women') return pGender === 'women' || pGender === 'femme';
          if (c === 'unisex') return pGender === 'unisex' || pGender === 'unisexe';
          if (c === 'oriental') return pSub === 'arabic';
          if (c === 'testers' || c === 'testeurs' || c === 'originaux') return pSub !== 'arabic';
          if (c === 'coffrets') return pSub === 'coffrets';
          if (pBrand === c || pBrand.toLowerCase() === c) return true;
          return false;
        });
      }).map(p => p.id);

      parsedProductIds = matchingIds;

      if (Array.isArray(items) && items.length > 0) {
        const targetIds = new Set(matchingIds);
        const hasEligible = items.some((item: any) => targetIds.has(Number(item.id)));
        if (!hasEligible) {
          return NextResponse.json({
            error: 'Ce code promo est uniquement valable sur certaines catégories qui ne sont pas dans votre panier.'
          }, { status: 400 });
        }
      }
    }

    // Check specific products eligibility if items are provided
    if (promo.applicableScope === 'SPECIFIC_PRODUCTS' && parsedProductIds.length > 0 && Array.isArray(items) && items.length > 0) {
      const targetIds = new Set(parsedProductIds.map(Number));
      const hasEligibleProduct = items.some((item: any) => targetIds.has(Number(item.id)));
      
      if (!hasEligibleProduct) {
        return NextResponse.json({
          error: 'Ce code promo est uniquement valable sur une sélection de parfums qui ne sont pas dans votre panier.'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      applicableScope: promo.applicableScope,
      categories: parsedCategories,
      productIds: parsedProductIds,
      minOrderAmount: promo.minOrderAmount,
      minQuantity: promo.minQuantity || 0,
      description: promo.description,
      requiresAccount: Boolean(promo.requiresAccount),
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json({ error: 'Erreur lors de la validation du code promo' }, { status: 500 });
  }
}
