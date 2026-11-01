import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Product } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids');

  if (!ids) {
    return NextResponse.json({ products: [] });
  }

  const idArray = ids
    .split(',')
    .map((id) => parseInt(id, 10))
    .filter((id) => !isNaN(id));

  if (idArray.length === 0) {
    return NextResponse.json({ products: [] });
  }

  try {
    const rawProducts = await prisma.product.findMany({
      where: {
        id: { in: idArray },
        published: true,
      },
    });

    const mappedProducts: Product[] = rawProducts.map((p) => {
      let images: string[] = [];
      let notes = { top: [], heart: [], base: [] };
      let sizes = [];
      let tags: any[] = [];

      try {
        images = JSON.parse(p.images);
      } catch {}
      try {
        notes = JSON.parse(p.notes);
      } catch {}
      try {
        sizes = JSON.parse(p.sizes);
      } catch {}
      try {
        tags = JSON.parse(p.tags);
      } catch {}

      return {
        id: p.id,
        slug: p.slug,
        sku: p.sku,
        published: p.published,
        name: p.name,
        brand: p.brandId as any,
        brandLabel: p.brandLabel || p.brandId,
        gender: p.gender as any,
        subcategory: p.subcategory as any,
        subcategoryLabel: p.subcategoryLabel || p.subcategory,
        tagline: p.tagline,
        price: p.price,
        originalPrice: p.originalPrice ?? undefined,
        description: p.description,
        longDescription: p.longDescription,
        images: Array.isArray(images) && images.length > 0 ? images : ['/placeholder.jpg'],
        notes,
        ingredients: p.ingredients,
        sizes,
        bottleColor: p.bottleColor as any,
        bottleColorLabel: p.bottleColorLabel,
        bottleMaterial: p.bottleMaterial as any,
        bottleMaterialLabel: p.bottleMaterialLabel,
        rating: p.rating,
        reviewCount: p.reviewCount,
        releaseDate: p.releaseDate,
        tags,
        inStock: p.inStock,
        stock: p.stock,
        perfectSeason: p.perfectSeason as any,
        isTester: p.isTester ?? false,
      };
    });

    // Preserve the original requested order (newest viewed first)
    const sortedProducts = idArray
      .map((id) => mappedProducts.find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ products: sortedProducts });
  } catch (error) {
    console.error('Recent products error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
