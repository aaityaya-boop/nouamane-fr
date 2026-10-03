import React from 'react';
import prisma from '@/lib/prisma';
import BlogListClient from './BlogListClient';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const [posts, productsCount] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count()
  ]);

  // Serialize dates to prevent SSR hydration serialization warnings
  const serializedPosts = posts.map(p => ({
    ...p,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : new Date().toISOString(),
    createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
  }));

  return (
    <BlogListClient 
      initialPosts={serializedPosts} 
      totalProductsCount={productsCount} 
    />
  );
}
