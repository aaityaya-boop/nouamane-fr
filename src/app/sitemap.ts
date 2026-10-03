import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nayparfum.ma';

  const [products, brands, blogPosts] = await Promise.all([
    prisma.product.findMany({
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

  // 1. Static Core & Category Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/fr`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/fr/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/fr/shop/men`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fr/shop/women`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fr/shop/unisex`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fr/shop/oriental`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fr/testeurs`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/fr/testeurs/men`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fr/testeurs/women`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fr/parfums-originaux`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fr/master-copier`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/fr/coffrets`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/fr/decouverte`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/fr/brands`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/fr/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // 2. Dynamic Product Pages
  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/fr/product/${product.slug}`,
    lastModified: product.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 3. Dynamic Brand Pages
  const brandUrls: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${baseUrl}/fr/brands/${brand.slug}`,
    lastModified: brand.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  // 4. Dynamic Published Blog Post Pages
  const blogUrls: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/fr/blog/${post.slug}`,
    lastModified: post.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...productUrls,
    ...brandUrls,
    ...blogUrls,
  ];
}
