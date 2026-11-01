import React from 'react';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import WishlistClient from './WishlistClient';
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
    title: isArabic ? 'عطوري المفضلة | NAY Parfum' : 'Mes Favoris | NAY Parfum Maroc',
    description: isArabic
      ? 'قائمة عطورك وتستراتك المفضلة لدى NAY Parfum بالمغرب.'
      : 'Retrouvez votre sélection de parfums et testeurs de luxe favoris chez NAY Parfum Maroc.',
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'fr';

  // Fetch all published products from Prisma to ensure live prices & stock
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

  return <WishlistClient products={parsedProducts} locale={locale} />;
}
