import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(tester|testeur|original|authentique|master\s*copy|edp|edt|parfum|eau\s+de\s+parfum|eau\s+de\s+toilette)\b/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * GET /api/admin/products/sections?name=...&brand=...&currentId=...
 * Finds all existing editions for a given perfume across catalog sections:
 * - tester: isTester === true && subcategory not in ['master-copier', 'coffrets']
 * - original: isTester === false && subcategory not in ['master-copier', 'coffrets']
 * - masterCopy: subcategory === 'master-copier'
 * - coffret: subcategory === 'coffrets'
 */
export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || '';
    const brand = searchParams.get('brand') || '';
    const currentId = searchParams.get('currentId') ? parseInt(searchParams.get('currentId')!, 10) : null;

    if (!name.trim()) {
      return NextResponse.json({
        tester: null,
        original: null,
        masterCopy: null,
        coffret: null,
      });
    }

    const normTarget = normalizeName(name);

    // Fetch products of same brand or similar name
    const candidateProducts = await prisma.product.findMany({
      where: brand ? { brandId: brand } : undefined,
      select: {
        id: true,
        slug: true,
        name: true,
        brandId: true,
        brandLabel: true,
        price: true,
        originalPrice: true,
        stock: true,
        inStock: true,
        isTester: true,
        subcategory: true,
        subcategoryLabel: true,
      },
    });

    const matches = candidateProducts.filter((p) => {
      const normP = normalizeName(p.name);
      return (
        normP === normTarget ||
        normP.includes(normTarget) ||
        normTarget.includes(normP) ||
        (p.id === currentId)
      );
    });

    const tester = matches.find((p) => p.isTester && p.subcategory !== 'master-copier' && p.subcategory !== 'coffrets') || null;
    const original = matches.find((p) => !p.isTester && p.subcategory !== 'master-copier' && p.subcategory !== 'coffrets') || null;
    const masterCopy = matches.find((p) => p.subcategory === 'master-copier') || null;
    const coffret = matches.find((p) => p.subcategory === 'coffrets') || null;

    return NextResponse.json({
      tester: tester ? { id: tester.id, slug: tester.slug, price: tester.price, stock: tester.stock, inStock: tester.inStock, name: tester.name } : null,
      original: original ? { id: original.id, slug: original.slug, price: original.price, stock: original.stock, inStock: original.inStock, name: original.name } : null,
      masterCopy: masterCopy ? { id: masterCopy.id, slug: masterCopy.slug, price: masterCopy.price, stock: masterCopy.stock, inStock: masterCopy.inStock, name: masterCopy.name } : null,
      coffret: coffret ? { id: coffret.id, slug: coffret.slug, price: coffret.price, stock: coffret.stock, inStock: coffret.inStock, name: coffret.name } : null,
    });
  } catch (error) {
    console.error('Error fetching perfume editions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/admin/products/sections
 * Duplicates a product into a specified target section with independent stock & price.
 * Body: { sourceProductId, targetSection: 'tester' | 'original' | 'master-copier' | 'coffrets', price?, stock? }
 */
export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceProductId, targetSection, price, stock, originalPrice } = body;

    if (!sourceProductId || !targetSection) {
      return NextResponse.json({ error: 'sourceProductId et targetSection requis' }, { status: 400 });
    }

    const source = await prisma.product.findUnique({
      where: { id: parseInt(sourceProductId, 10) },
    });

    if (!source) {
      return NextResponse.json({ error: 'Produit source introuvable' }, { status: 404 });
    }

    // Determine target settings
    let isTester = false;
    let subcategory = source.subcategory;
    let subcategoryLabel = source.subcategoryLabel;
    let slugSuffix = '';
    let defaultPrice = source.price;
    let defaultStock = typeof stock === 'number' ? stock : 10;

    if (targetSection === 'tester') {
      isTester = true;
      if (subcategory === 'master-copier' || subcategory === 'coffrets') {
        subcategory = 'floral';
        subcategoryLabel = 'Floral';
      }
      slugSuffix = 'tester';
      defaultPrice = typeof price === 'number' && price > 0 ? price : Math.min(source.price, 299);
    } else if (targetSection === 'original') {
      isTester = false;
      if (subcategory === 'master-copier' || subcategory === 'coffrets') {
        subcategory = 'floral';
        subcategoryLabel = 'Floral';
      }
      slugSuffix = 'original';
      defaultPrice = typeof price === 'number' && price > 0 ? price : (source.originalPrice || Math.round(source.price * 1.5) || 500);
    } else if (targetSection === 'master-copier') {
      isTester = false;
      subcategory = 'master-copier';
      subcategoryLabel = 'Master Copy 1:1';
      slugSuffix = 'master-copy';
      defaultPrice = typeof price === 'number' && price > 0 ? price : 350;
    } else if (targetSection === 'coffrets') {
      isTester = false;
      subcategory = 'coffrets';
      subcategoryLabel = 'Coffret Cadeau';
      slugSuffix = 'coffret';
      defaultPrice = typeof price === 'number' && price > 0 ? price : (source.originalPrice || source.price + 100);
    } else {
      return NextResponse.json({ error: 'Section invalide' }, { status: 400 });
    }

    // Generate unique slug
    const cleanBaseSlug = source.slug
      .replace(/-(tester|original|master-copy|master-copier|coffret)(-\d+)?$/g, '')
      .replace(/-+$/, '');
    
    let candidateSlug = `${cleanBaseSlug}-${slugSuffix}`;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: candidateSlug } })) {
      candidateSlug = `${cleanBaseSlug}-${slugSuffix}-${counter}`;
      counter++;
    }

    // Generate unique SKU
    const prefix = targetSection === 'tester' ? 'TST' : targetSection === 'original' ? 'ORI' : targetSection === 'master-copier' ? 'MST' : 'COF';
    const candidateSku = `NAY-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProduct = await prisma.product.create({
      data: {
        slug: candidateSlug,
        sku: candidateSku,
        name: source.name,
        brandId: source.brandId,
        brandLabel: source.brandLabel,
        gender: source.gender,
        subcategory,
        subcategoryLabel,
        tagline: source.tagline,
        description: source.description,
        longDescription: source.longDescription,
        ingredients: source.ingredients,
        bottleColor: source.bottleColor,
        bottleColorLabel: source.bottleColorLabel,
        bottleMaterial: source.bottleMaterial,
        bottleMaterialLabel: source.bottleMaterialLabel,
        perfectSeason: source.perfectSeason,
        images: source.images,
        notes: source.notes,
        sizes: source.sizes,
        tags: source.tags,
        price: defaultPrice,
        originalPrice: typeof originalPrice === 'number' ? originalPrice : source.originalPrice,
        testerPrice: targetSection === 'tester' ? defaultPrice : source.testerPrice,
        rating: source.rating || 5.0,
        reviewCount: source.reviewCount || 0,
        releaseDate: new Date().toISOString(),
        inStock: defaultStock > 0,
        stock: defaultStock,
        isTester,
        published: true,
      },
    });

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: `Fiche créée avec succès dans le rayon ${targetSection === 'tester' ? 'Testeurs' : targetSection === 'original' ? 'Parfums Originaux' : targetSection === 'master-copier' ? 'Master Copy' : 'Coffrets'}.`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating product to section:', error);
    return NextResponse.json({ error: 'Échec de la duplication vers la section' }, { status: 500 });
  }
}
