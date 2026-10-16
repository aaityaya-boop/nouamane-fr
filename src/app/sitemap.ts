import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

// Revalidate sitemap hourly for rapid indexing of new catalog items and Phase 5 SEO editorial guides
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nayparfum.ma';

  const [products, brands, blogPosts] = await Promise.all([
    prisma.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true }
    }),
    prisma.brand.findMany({
      select: { slug: true, updatedAt: true }
    }),
    prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true }
    })
  ]);

  const now = new Date();

  const makeAlternates = (frPath: string, arPath: string) => ({
    languages: {
      'fr-MA': `${baseUrl}${frPath}`,
      'ar-MA': `${baseUrl}${arPath}`,
      'x-default': `${baseUrl}${frPath}`,
    }
  });

  // 1. Static Core & Category Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/fr`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: makeAlternates('/fr', '/ar'),
    },
    {
      url: `${baseUrl}/fr/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
      alternates: makeAlternates('/fr/shop', '/ar/shop'),
    },
    {
      url: `${baseUrl}/fr/shop/men`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: makeAlternates('/fr/shop/men', '/ar/shop/men'),
    },
    {
      url: `${baseUrl}/fr/shop/women`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: makeAlternates('/fr/shop/women', '/ar/shop/women'),
    },
    {
      url: `${baseUrl}/fr/shop/unisex`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: makeAlternates('/fr/shop/unisex', '/ar/shop/unisex'),
    },
    {
      url: `${baseUrl}/fr/testeurs`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
      alternates: makeAlternates('/fr/testeurs', '/ar/testeurs'),
    },
    {
      url: `${baseUrl}/fr/testeurs/men`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: makeAlternates('/fr/testeurs/men', '/ar/testeurs/men'),
    },
    {
      url: `${baseUrl}/fr/testeurs/women`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: makeAlternates('/fr/testeurs/women', '/ar/testeurs/women'),
    },
    {
      url: `${baseUrl}/fr/testeurs/unisex`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: makeAlternates('/fr/testeurs/unisex', '/ar/testeurs/unisex'),
    },
    {
      url: `${baseUrl}/fr/parfums-originaux`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: makeAlternates('/fr/parfums-originaux', '/ar/parfums-originaux'),
    },
    {
      url: `${baseUrl}/fr/parfums-orientaux`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: makeAlternates('/fr/parfums-orientaux', '/ar/parfums-orientaux'),
    },
    {
      url: `${baseUrl}/fr/coffrets`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
      alternates: makeAlternates('/fr/coffrets', '/ar/coffrets'),
    },
    {
      url: `${baseUrl}/fr/decouverte`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
      alternates: makeAlternates('/fr/decouverte', '/ar/decouverte'),
    },
    {
      url: `${baseUrl}/fr/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: makeAlternates('/fr/blog', '/ar/blog'),
    },
  ];

  // 2. Dynamic Product Pages
  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/fr/product/${encodeURIComponent(product.slug)}`,
    lastModified: product.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.85,
    alternates: makeAlternates(
      `/fr/product/${encodeURIComponent(product.slug)}`,
      `/ar/product/${encodeURIComponent(product.slug)}`
    ),
  }));

  // 3. Dynamic Brand Pages
  const brandUrls: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${baseUrl}/fr/brands/${encodeURIComponent(brand.slug)}`,
    lastModified: brand.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.75,
    alternates: makeAlternates(
      `/fr/brands/${encodeURIComponent(brand.slug)}`,
      `/ar/brands/${encodeURIComponent(brand.slug)}`
    ),
  }));

  // 4. Dynamic Published Blog Post Pages
  const blogUrls: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/fr/blog/${encodeURIComponent(post.slug)}`,
    lastModified: post.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
    alternates: makeAlternates(
      `/fr/blog/${encodeURIComponent(post.slug)}`,
      `/ar/blog/${encodeURIComponent(post.slug)}`
    ),
  }));

  return [
    ...staticRoutes,
    ...productUrls,
    ...brandUrls,
    ...blogUrls,
  ];
}
