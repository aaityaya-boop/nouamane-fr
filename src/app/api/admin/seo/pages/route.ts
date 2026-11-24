import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission, requirePermission } from '@/lib/auth/rbac/serverGuard';
import { evaluateProductSeo } from '@/lib/seo/realAudit';

export async function GET(req: Request) {
  try {
    const auth = await requireAnyPermission(req, ['marketing.view', 'marketing.manage_seo']);
    if (!auth.authorized) return auth.response!;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    const products = await prisma.product.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { brandLabel: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        seo: true,
      },
      orderBy: { id: 'asc' },
      take: 250,
    });

    const data = products.map((p) => {
      const audit = evaluateProductSeo(p);
      return {
        id: p.id,
        name: p.name,
        brand: p.brandLabel || 'NAY',
        slug: p.slug,
        url: `/products/${p.slug}`,
        price: p.price,
        seoTitle: audit.effectiveTitle,
        metaDescription: audit.effectiveDescription,
        focusKeyword: audit.effectiveFocusKeyword,
        seoScore: audit.score,
        issues: audit.issues,
        canonicalUrl: p.seo?.canonicalUrl || `https://nayparfum.ma/products/${p.slug}`,
        hasSchema: p.seo?.schemaEnabled ?? true,
        lastOptimizedAt: p.seo?.lastOptimizedAt || p.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Failed to fetch SEO pages:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requirePermission(req, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const body = await req.json();
    const { productId, seoTitle, metaDescription, focusKeyword } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const audit = evaluateProductSeo({
      ...product,
      seo: {
        seoTitle,
        metaDescription,
        focusKeyword,
        canonicalUrl: `https://nayparfum.ma/products/${product.slug}`,
        schemaEnabled: true,
      },
    });

    const updated = await prisma.productSeo.upsert({
      where: { productId: Number(productId) },
      update: {
        seoTitle: seoTitle || undefined,
        metaDescription: metaDescription || undefined,
        focusKeyword: focusKeyword || undefined,
        seoScore: audit.score,
        lastOptimizedAt: new Date(),
      },
      create: {
        productId: Number(productId),
        seoTitle: seoTitle || audit.effectiveTitle,
        metaDescription: metaDescription || audit.effectiveDescription,
        focusKeyword: focusKeyword || audit.effectiveFocusKeyword,
        seoScore: audit.score,
        lastOptimizedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      score: audit.score,
      issues: audit.issues,
    });
  } catch (error) {
    console.error('Failed to update product SEO:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
