import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';
import {
  evaluateProductSeo,
  buildOptimalSeoTitle,
  buildOptimalMetaDescription,
} from '@/lib/seo/realAudit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const auth = await requireAnyPermission(req, ['marketing.manage_seo', 'marketing.view']);
    if (!auth.authorized) return auth.response!;

    const products = await prisma.product.findMany({
      include: { seo: true },
    });

    let updatedCount = 0;

    for (const product of products) {
      const audit = evaluateProductSeo(product);
      if (audit.score >= 90 && product.seo?.seoTitle && product.seo?.metaDescription) {
        continue;
      }

      const brand = product.brandLabel || 'Maison NAY';
      const seoTitle =
        product.seo?.seoTitle && product.seo.seoTitle.length >= 30 && product.seo.seoTitle.length <= 68
          ? product.seo.seoTitle
          : buildOptimalSeoTitle(product.name, brand);
      const metaDescription =
        product.seo?.metaDescription &&
        product.seo.metaDescription.length >= 110 &&
        product.seo.metaDescription.length <= 168
          ? product.seo.metaDescription
          : buildOptimalMetaDescription(product.name, brand, product.price);
      const focusKeyword =
        product.seo?.focusKeyword || `${product.name.toLowerCase()} prix maroc`;
      const secondaryKeywords =
        product.seo?.secondaryKeywords ||
        `${product.name.toLowerCase()} testeur, parfum ${brand.toLowerCase()} maroc, acheter ${product.name.toLowerCase()} casablanca`;

      const recomputed = evaluateProductSeo({
        ...product,
        seo: {
          seoTitle,
          metaDescription,
          focusKeyword,
          canonicalUrl: `https://nayparfum.ma/products/${product.slug}`,
          schemaEnabled: true,
        },
      });

      await prisma.productSeo.upsert({
        where: { productId: product.id },
        update: {
          seoTitle,
          metaDescription,
          focusKeyword,
          secondaryKeywords,
          canonicalUrl: `https://nayparfum.ma/products/${product.slug}`,
          ogTitle: seoTitle,
          ogDescription: metaDescription,
          schemaEnabled: true,
          seoScore: recomputed.score,
          aiGenerated: true,
          lastOptimizedAt: new Date(),
        },
        create: {
          productId: product.id,
          seoTitle,
          metaDescription,
          focusKeyword,
          secondaryKeywords,
          canonicalUrl: `https://nayparfum.ma/products/${product.slug}`,
          ogTitle: seoTitle,
          ogDescription: metaDescription,
          schemaEnabled: true,
          seoScore: recomputed.score,
          aiGenerated: true,
          lastOptimizedAt: new Date(),
        },
      });
      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      totalAudited: products.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur optimisation bulk SEO';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
