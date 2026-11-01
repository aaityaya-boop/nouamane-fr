import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import PerfumeFinderClient from './PerfumeFinderClient';
import { Product } from '@/lib/products';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'fr';
  const isArabic = locale === 'ar';

  return {
    title: isArabic
      ? 'المستشار العطري الذكي — اختر عطرك المثالي | NAY Parfum'
      : 'Trouver Mon Parfum — Recommandations Personnalisées | NAY Parfum Maroc',
    description: isArabic
      ? 'استبيان ذكي وسريع لاكتشاف العطر والتستر الأنسب لذوقك ومناسباتك من بين تشكيلة NAY Parfum بالمغرب.'
      : 'Découvrez la fragrance idéale adaptée à vos goûts, occasions et budget grâce au conseiller interactif NAY Parfum Maroc.',
    alternates: {
      canonical: `https://nayparfum.ma/${locale}/perfume-finder`,
    },
  };
}

export default async function PerfumeFinderPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'fr';

  // Fetch all published products from Prisma
  const dbProducts = await prisma.product.findMany({
    where: { published: true },
    orderBy: { name: 'asc' },
  });

  const parsedProducts: Product[] = dbProducts.map((p: any) => ({
    ...p,
    images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    notes: typeof p.notes === 'string' ? JSON.parse(p.notes) : p.notes,
    sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
    tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
  }));

  return <PerfumeFinderClient products={parsedProducts} locale={locale} />;
}
