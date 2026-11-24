import React from 'react';
import prisma from '@/lib/prisma';
import { PRODUCTS } from '@/lib/products';
import LandingPagesManagerClient from './LandingPagesManagerClient';

export const dynamic = 'force-dynamic';

export interface CatalogPickerItem {
  slug: string;
  name: string;
  brandLabel: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  category: string;
}

export default async function LandingPagesList() {
  const [pages, dbProducts] = await Promise.all([
    prisma.landingPage.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 150,
    }),
  ]);

  const seen = new Set<string>();
  const catalogProducts: CatalogPickerItem[] = [];

  for (const p of dbProducts) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    let imageUrl = '';
    try {
      const parsed = JSON.parse(p.images || '[]');
      if (Array.isArray(parsed) && parsed[0]) imageUrl = String(parsed[0]);
    } catch {
      imageUrl = '';
    }
    catalogProducts.push({
      slug: p.slug,
      name: p.name,
      brandLabel: p.brandLabel || 'Maison NAY',
      price: p.price,
      originalPrice: p.originalPrice || Math.round(p.price * 1.35),
      imageUrl,
      category: p.subcategoryLabel || 'Parfum',
    });
  }

  for (const p of PRODUCTS) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    catalogProducts.push({
      slug: p.slug,
      name: p.name,
      brandLabel: p.brandLabel || 'Maison NAY',
      price: p.price,
      originalPrice: p.originalPrice || Math.round(p.price * 1.35),
      imageUrl: p.images?.[0] || '',
      category: p.subcategoryLabel || 'Parfum',
    });
  }

  return (
    <LandingPagesManagerClient
      initialPages={pages.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        deadline: p.deadline ? p.deadline.toISOString() : null,
      }))}
      catalogProducts={catalogProducts}
    />
  );
}
