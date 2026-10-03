import React from 'react';
import prisma from '@/lib/prisma';
import BlogForm from '../[id]/BlogForm';

export const dynamic = 'force-dynamic';

export default async function NewBlogPost() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      brandId: true,
      brandLabel: true,
      images: true,
      price: true
    },
    orderBy: { name: 'asc' }
  });

  return <BlogForm initialData={null} dbProducts={products} />;
}
