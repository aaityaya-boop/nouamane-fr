import React from 'react';
import prisma from '@/lib/prisma';
import SitemapClient from './SitemapClient';

export const dynamic = 'force-dynamic';

export default async function SitemapEnginePage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nayparfum.ma';

  const [status, productsCount, brandsCount, blogCount, sampleProducts, sampleBrands, sampleBlogs] = await Promise.all([
    prisma.seoSitemapStatus.findFirst(),
    prisma.product.count(),
    prisma.brand.count(),
    prisma.blogPost.count({ where: { status: 'published' } }),
    prisma.product.findMany({
      select: { slug: true, updatedAt: true },
      take: 60,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.brand.findMany({
      select: { slug: true, updatedAt: true },
      take: 30,
      orderBy: { name: 'asc' },
    }),
    prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true },
      take: 30,
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const staticUrls = [
    { url: `${baseUrl}/fr`, category: 'RAYONS', priority: 1.0, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/shop`, category: 'RAYONS', priority: 0.95, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/shop/men`, category: 'RAYONS', priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/shop/women`, category: 'RAYONS', priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/shop/unisex`, category: 'RAYONS', priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/shop/oriental`, category: 'RAYONS', priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/testeurs`, category: 'RAYONS', priority: 0.95, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/testeurs/men`, category: 'RAYONS', priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/testeurs/women`, category: 'RAYONS', priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/parfums-originaux`, category: 'RAYONS', priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/master-copier`, category: 'RAYONS', priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/fr/coffrets`, category: 'RAYONS', priority: 0.85, changeFrequency: 'weekly' },
    { url: `${baseUrl}/fr/decouverte`, category: 'RAYONS', priority: 0.85, changeFrequency: 'weekly' },
    { url: `${baseUrl}/fr/brands`, category: 'RAYONS', priority: 0.85, changeFrequency: 'weekly' },
    { url: `${baseUrl}/fr/blog`, category: 'BLOG', priority: 0.9, changeFrequency: 'daily' },
  ];

  const productUrls = sampleProducts.map((p) => ({
    url: `${baseUrl}/fr/product/${p.slug}`,
    category: 'PRODUITS',
    priority: 0.85,
    changeFrequency: 'weekly',
  }));

  const brandUrls = sampleBrands.map((b) => ({
    url: `${baseUrl}/fr/brands/${b.slug}`,
    category: 'MARQUES',
    priority: 0.75,
    changeFrequency: 'weekly',
  }));

  const blogUrls = sampleBlogs.map((b) => ({
    url: `${baseUrl}/fr/blog/${b.slug}`,
    category: 'BLOG',
    priority: 0.8,
    changeFrequency: 'weekly',
  }));

  const sampleUrls = [
    ...staticUrls,
    ...productUrls,
    ...brandUrls,
    ...blogUrls,
  ];

  const serializedStatus = status
    ? {
        id: status.id,
        sitemapUrl: status.sitemapUrl,
        httpStatus: status.httpStatus,
        isValid: status.isValid,
        urlCount: status.urlCount,
        lastCheckedAt: status.lastCheckedAt ? status.lastCheckedAt.toISOString() : null,
        errorMessage: status.errorMessage,
      }
    : null;

  return (
    <SitemapClient
      initialStatus={serializedStatus}
      productsCount={productsCount}
      brandsCount={brandsCount}
      blogCount={blogCount}
      staticCount={staticUrls.length}
      sampleUrls={sampleUrls}
    />
  );
}
