import React from 'react';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ConceptCClient from './ConceptCClient';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Concept C — NAY Signature Boutique | NAY Parfum Prototype",
    description: "Prototype C: Signature Moroccan luxury perfumery boutique with arched framing and controlled NAY blue accents.",
    robots: { index: false, follow: false },
  };
}

export default async function PrototypeConceptCPage({ 
  params 
}: { 
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = locale || 'fr';

  let dbProducts: any[] = [];
  let brandsDb: any[] = [];

  try {
    const res = await Promise.all([
      prisma.product.findMany({
        where: { published: true },
        select: {
          id: true,
          sku: true,
          name: true,
          slug: true,
          brandId: true,
          brandLabel: true,
          gender: true,
          subcategory: true,
          subcategoryLabel: true,
          price: true,
          originalPrice: true,
          images: true,
          sizes: true,
          tags: true,
          rating: true,
          reviewCount: true,
          inStock: true,
          stock: true,
          perfectSeason: true,
          releaseDate: true,
          isTester: true,
        }
      }),
      prisma.brand.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        }
      }),
    ]);
    dbProducts = res[0] || [];
    brandsDb = res[1] || [];
  } catch (err) {
    console.warn('Database error in Prototype C:', err);
  }

  return (
    <ConceptCClient 
      products={dbProducts} 
      brands={brandsDb} 
    />
  );
}
