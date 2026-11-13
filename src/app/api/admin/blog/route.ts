import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(request, ['marketing.view', 'marketing.manage_seo']);
    if (errorResponse) return errorResponse;

    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requirePermission(request, 'marketing.manage_seo');
    if (errorResponse) return errorResponse;

    const data = await request.json();
    let slug = (data.slug || 'article')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check slug collision
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: data.title || 'Nouvel Article',
        excerpt: data.excerpt || '',
        content: data.content || '',
        coverImage: data.coverImage || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80',
        author: data.author || 'NAY Parfums',
        status: data.status || 'draft',
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        category: data.category || 'Guides',
        tags: typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags || []),
        ctaText: data.ctaText || null,
        ctaLink: data.ctaLink || null,
        relatedProductSlugs: typeof data.relatedProductSlugs === 'string' ? data.relatedProductSlugs : JSON.stringify(data.relatedProductSlugs || []),
      }
    });
    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: 500 });
  }
}
