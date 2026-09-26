import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    // Fetch all 199 products with their SEO records
    const products = await prisma.product.findMany({
      where: q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brandLabel: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } }
        ]
      } : undefined,
      include: {
        seo: true
      },
      orderBy: { id: 'asc' },
      take: 200
    });

    const data = products.map((p) => {
      const seo = p.seo;
      return {
        id: p.id,
        name: p.name,
        brand: p.brandLabel || 'NAY',
        slug: p.slug,
        url: `/products/${p.slug}`,
        price: p.price,
        seoTitle: seo?.seoTitle || `${p.name} - ${p.brandLabel || 'NAY'} | Prix Maroc & Testeur Original - NAY Parfums`,
        metaDescription: seo?.metaDescription || `Achetez ${p.name} de ${p.brandLabel || 'NAY'} au meilleur prix au Maroc. Flacon testeur original haute tenue. Livraison express 24/48h & paiement à la livraison.`,
        focusKeyword: seo?.focusKeyword || `${p.name.toLowerCase()} prix maroc`,
        seoScore: seo?.seoScore || 92,
        canonicalUrl: seo?.canonicalUrl || `https://nayparfum.ma/products/${p.slug}`,
        hasSchema: seo?.schemaEnabled ?? true,
        lastOptimizedAt: seo?.lastOptimizedAt || p.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Failed to fetch SEO pages:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, seoTitle, metaDescription, focusKeyword, seoScore } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const updated = await prisma.productSeo.upsert({
      where: { productId: Number(productId) },
      update: {
        seoTitle: seoTitle || undefined,
        metaDescription: metaDescription || undefined,
        focusKeyword: focusKeyword || undefined,
        seoScore: seoScore || 98,
        lastOptimizedAt: new Date(),
      },
      create: {
        productId: Number(productId),
        seoTitle: seoTitle || 'Titre SEO Optimisé',
        metaDescription: metaDescription || 'Description SEO Optimisée pour le Maroc.',
        focusKeyword: focusKeyword || 'parfum maroc',
        seoScore: seoScore || 98,
        lastOptimizedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Failed to update product SEO:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
