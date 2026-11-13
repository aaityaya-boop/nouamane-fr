import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { REVIEWS } from '@/lib/reviews';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await requirePermission(request, 'settings.manage_security');
    if (errorResponse || !user) return errorResponse!;

    if (user.role !== 'OWNER' && user.role !== 'CO_OWNER') {
      return NextResponse.json(
        { error: 'Seuls les fondateurs (OWNER) peuvent exécuter cette opération.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
      return NextResponse.json(
        { error: 'Les opérations de seed sont désactivées en production.', code: 'PRODUCTION_SEED_DISABLED' },
        { status: 403 }
      );
    }

    let count = 0;
    
    for (const review of REVIEWS) {
      // Check if product exists before creating review to avoid foreign key errors
      const productExists = await prisma.product.findUnique({
        where: { slug: review.productSlug }
      });
      
      if (productExists) {
        await prisma.review.create({
          data: {
            productSlug: review.productSlug,
            author: review.author,
            city: review.city,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            verified: review.verified,
            createdAt: new Date(review.createdAt),
          }
        });
        count++;
      }
    }

    return NextResponse.json({ success: true, message: `Seeded ${count} reviews` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to seed reviews' }, { status: 500 });
  }
}
