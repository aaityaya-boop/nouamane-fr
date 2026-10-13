import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function createSectionCopies(source: any, pendingSections: any) {
  if (!pendingSections) return;
  const targetKeys: Array<{ key: 'tester' | 'original' | 'masterCopy'; section: 'tester' | 'original' | 'master-copier' }> = [
    { key: 'tester', section: 'tester' },
    { key: 'original', section: 'original' },
    { key: 'masterCopy', section: 'master-copier' },
  ];

  for (const { key, section } of targetKeys) {
    const draft = pendingSections[key];
    if (!draft || !draft.enabled) continue;

    let isTester = section === 'tester';
    let subcategory = source.subcategory;
    let subcategoryLabel = source.subcategoryLabel;
    let slugSuffix = section === 'tester' ? 'tester' : section === 'original' ? 'original' : 'master-copy';
    let price = typeof draft.price === 'number' && draft.price > 0 ? draft.price : source.price;
    let stock = typeof draft.stock === 'number' ? draft.stock : 10;

    if (section === 'master-copier') {
      isTester = false;
      subcategory = 'master-copier';
      subcategoryLabel = 'Master Copy 1:1';
    } else if (section === 'original') {
      isTester = false;
      if (subcategory === 'master-copier' || subcategory === 'coffrets') {
        subcategory = 'floral';
        subcategoryLabel = 'Floral';
      }
    } else if (section === 'tester') {
      isTester = true;
      if (subcategory === 'master-copier' || subcategory === 'coffrets') {
        subcategory = 'floral';
        subcategoryLabel = 'Floral';
      }
    }

    const cleanBaseSlug = source.slug
      .replace(/-(tester|original|master-copy|master-copier|coffret)(-\d+)?$/g, '')
      .replace(/-+$/, '');

    let candidateSlug = `${cleanBaseSlug}-${slugSuffix}`;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: candidateSlug } })) {
      candidateSlug = `${cleanBaseSlug}-${slugSuffix}-${counter}`;
      counter++;
    }

    const prefix = section === 'tester' ? 'TST' : section === 'original' ? 'ORI' : 'MST';
    const candidateSku = `NAY-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    await prisma.product.create({
      data: {
        slug: candidateSlug,
        sku: candidateSku,
        name: source.name,
        brandId: source.brandId,
        brandLabel: source.brandLabel,
        gender: source.gender,
        subcategory,
        subcategoryLabel,
        tagline: source.tagline || '',
        description: source.description || '',
        longDescription: source.longDescription || '',
        ingredients: source.ingredients || '',
        bottleColor: source.bottleColor || 'transparent',
        bottleColorLabel: source.bottleColorLabel || 'Transparent',
        bottleMaterial: source.bottleMaterial || 'glass',
        bottleMaterialLabel: source.bottleMaterialLabel || 'Verre',
        perfectSeason: source.perfectSeason || 'Toutes Saisons',
        images: typeof source.images === 'string' ? source.images : JSON.stringify(source.images || []),
        notes: typeof source.notes === 'string' ? source.notes : JSON.stringify(source.notes || { top: [], heart: [], base: [] }),
        sizes: typeof source.sizes === 'string' ? source.sizes : JSON.stringify(source.sizes || []),
        tags: typeof source.tags === 'string' ? source.tags : JSON.stringify(source.tags || []),
        price,
        originalPrice: source.originalPrice,
        testerPrice: section === 'tester' ? price : source.testerPrice,
        rating: source.rating || 5.0,
        reviewCount: source.reviewCount || 0,
        releaseDate: new Date().toISOString(),
        inStock: stock > 0,
        stock,
        isTester,
        published: true,
      },
    }).catch((err) => console.error('Failed to auto-create section copy:', err));
  }
}

export async function GET(request: Request) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Convert arrays/objects to JSON strings for SQLite
    const data = {
      slug: body.slug,
      sku: body.sku || null,
      name: body.name,
      brandId: body.brand,
      brandLabel: body.brandLabel || body.brand,
      gender: body.gender,
      subcategory: body.subcategory,
      subcategoryLabel: body.subcategoryLabel || body.subcategory,
      tagline: body.tagline || '',
      description: body.description || '',
      longDescription: body.longDescription || '',
      ingredients: body.ingredients || '',
      bottleColor: body.bottleColor || 'transparent',
      bottleColorLabel: body.bottleColorLabel || 'Transparent',
      bottleMaterial: body.bottleMaterial || 'glass',
      bottleMaterialLabel: body.bottleMaterialLabel || 'Verre',
      perfectSeason: body.perfectSeason || 'Toutes Saisons',
      images: JSON.stringify(body.images || []),
      notes: JSON.stringify(body.notes || { top: [], heart: [], base: [] }),
      sizes: JSON.stringify(body.sizes || []),
      tags: JSON.stringify(body.tags || []),
      price: parseFloat(body.price),
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
      testerPrice: body.testerPrice ? parseFloat(body.testerPrice) : null,
      rating: parseFloat(body.rating || 5),
      reviewCount: parseInt(body.reviewCount || 0, 10),
      releaseDate: new Date().toISOString(),
      inStock: body.inStock !== undefined ? body.inStock : true,
      stock: body.stock !== undefined ? parseInt(body.stock, 10) : (body.inStock === false ? 0 : 10),
      isTester: body.isTester !== undefined ? body.isTester : false,
      published: body.published !== undefined ? body.published : true,
    };

    const newProduct = await prisma.product.create({
      data,
    });

    if (body.pendingSections) {
      await createSectionCopies(newProduct, body.pendingSections);
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
