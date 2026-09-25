import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const deals = await prisma.specialDeal.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });

    const allProducts = await prisma.product.findMany({
      select: { id: true, gender: true, subcategory: true, subcategoryLabel: true, brandLabel: true, brandId: true }
    });

    const formatted = deals.map((d) => {
      let parsedCategories: string[] = [];
      let parsedProductIds: number[] = [];
      let parsedGiftProductIds: number[] = [];
      if (d.categories) {
        try {
          parsedCategories = JSON.parse(d.categories);
        } catch {}
      }
      if (d.productIds) {
        try {
          parsedProductIds = JSON.parse(d.productIds);
        } catch {}
      }
      if (d.freeGiftProductIds) {
        try {
          parsedGiftProductIds = JSON.parse(d.freeGiftProductIds);
        } catch {}
      }

      if (d.applicableScope === 'CATEGORIES' && parsedCategories.length > 0) {
        parsedProductIds = allProducts.filter(p => {
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
      }

      return {
        ...d,
        categories: parsedCategories,
        productIds: parsedProductIds,
        freeGiftProductIds: parsedGiftProductIds,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      subtitle,
      badgeText,
      dealType = 'BUY_X_GET_Y_FREE',
      buyQuantity = 2,
      getQuantity = 1,
      discountPercent = 100,
      bundlePrice,
      applicableScope = 'ALL',
      categories = [],
      productIds = [],
      isAutomatic = true,
      promoCode,
      freeShipping = false,
      freeGiftName,
      freeGiftType = 'CLIENT_CHOICE_TESTERS',
      freeGiftProductIds = [],
      priority = 0,
      isActive = true,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Le titre de l\'offre est obligatoire' }, { status: 400 });
    }

    const cleanCategories = Array.isArray(categories) ? categories.map(String) : [];
    const cleanProductIds = Array.isArray(productIds) ? productIds.map(Number).filter(id => !isNaN(id)) : [];
    const cleanGiftProductIds = Array.isArray(freeGiftProductIds) ? freeGiftProductIds.map(Number).filter(id => !isNaN(id)) : [];

    const newDeal = await prisma.specialDeal.create({
      data: {
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : null,
        badgeText: badgeText ? badgeText.trim() : null,
        dealType,
        buyQuantity: parseInt(buyQuantity, 10) || 2,
        getQuantity: parseInt(getQuantity, 10) || 1,
        discountPercent: parseFloat(discountPercent) || 100,
        bundlePrice: bundlePrice ? parseFloat(bundlePrice) : null,
        applicableScope,
        categories: applicableScope === 'CATEGORIES' ? JSON.stringify(cleanCategories) : null,
        productIds: applicableScope === 'SPECIFIC_PRODUCTS' ? JSON.stringify(cleanProductIds) : null,
        isAutomatic: Boolean(isAutomatic),
        promoCode: promoCode ? promoCode.trim().toUpperCase() : null,
        freeShipping: Boolean(freeShipping),
        freeGiftName: freeGiftName ? freeGiftName.trim() : null,
        freeGiftType: freeGiftType || 'CLIENT_CHOICE_TESTERS',
        freeGiftProductIds: cleanGiftProductIds.length > 0 ? JSON.stringify(cleanGiftProductIds) : null,
        priority: parseInt(priority, 10) || 0,
        isActive: Boolean(isActive),
      }
    });

    return NextResponse.json({
      ...newDeal,
      categories: cleanCategories,
      productIds: cleanProductIds,
      freeGiftProductIds: cleanGiftProductIds,
    });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'offre' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive, priority, isAutomatic, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (typeof isAutomatic === 'boolean') updateData.isAutomatic = isAutomatic;
    if (typeof priority === 'number') updateData.priority = priority;
    if (rest.title) updateData.title = rest.title;
    if (rest.subtitle !== undefined) updateData.subtitle = rest.subtitle;
    if (rest.badgeText !== undefined) updateData.badgeText = rest.badgeText;
    if (rest.dealType) updateData.dealType = rest.dealType;
    if (rest.buyQuantity) updateData.buyQuantity = parseInt(rest.buyQuantity, 10);
    if (rest.getQuantity) updateData.getQuantity = parseInt(rest.getQuantity, 10);
    if (rest.discountPercent !== undefined) updateData.discountPercent = parseFloat(rest.discountPercent);
    if (rest.bundlePrice !== undefined) updateData.bundlePrice = rest.bundlePrice ? parseFloat(rest.bundlePrice) : null;
    if (rest.applicableScope) updateData.applicableScope = rest.applicableScope;
    if (Array.isArray(rest.categories)) updateData.categories = JSON.stringify(rest.categories);
    if (Array.isArray(rest.productIds)) updateData.productIds = JSON.stringify(rest.productIds.map(Number));
    if (typeof rest.freeShipping === 'boolean') updateData.freeShipping = rest.freeShipping;
    if (rest.freeGiftName !== undefined) updateData.freeGiftName = rest.freeGiftName;
    if (rest.freeGiftType !== undefined) updateData.freeGiftType = rest.freeGiftType;
    if (Array.isArray(rest.freeGiftProductIds)) updateData.freeGiftProductIds = JSON.stringify(rest.freeGiftProductIds.map(Number));
    if (rest.dealType) updateData.dealType = rest.dealType;
    if (rest.buyQuantity) updateData.buyQuantity = parseInt(rest.buyQuantity, 10);
    if (rest.getQuantity) updateData.getQuantity = parseInt(rest.getQuantity, 10);
    if (rest.discountPercent !== undefined) updateData.discountPercent = parseFloat(rest.discountPercent);
    if (rest.bundlePrice !== undefined) updateData.bundlePrice = rest.bundlePrice ? parseFloat(rest.bundlePrice) : null;
    if (rest.applicableScope) updateData.applicableScope = rest.applicableScope;
    if (Array.isArray(rest.categories)) updateData.categories = JSON.stringify(rest.categories);
    if (Array.isArray(rest.productIds)) updateData.productIds = JSON.stringify(rest.productIds.map(Number));
    if (typeof rest.freeShipping === 'boolean') updateData.freeShipping = rest.freeShipping;
    if (rest.freeGiftName !== undefined) updateData.freeGiftName = rest.freeGiftName;

    const updated = await prisma.specialDeal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await prisma.specialDeal.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
