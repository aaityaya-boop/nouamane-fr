import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, 'reviews.moderate');
    if (!auth.authorized) return auth.response!;
    const { id } = await params;
    const reviewId = parseInt(id, 10);
    const body = await request.json();

    const existing = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.author !== undefined) updateData.author = body.author.trim();
    if (body.city !== undefined) updateData.city = body.city.trim();
    if (body.rating !== undefined) updateData.rating = Math.min(5, Math.max(1, parseInt(body.rating, 10)));
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.comment !== undefined) updateData.comment = body.comment.trim();
    if (body.verified !== undefined) updateData.verified = Boolean(body.verified);
    if (body.productSlug !== undefined && body.productSlug !== existing.productSlug) {
      updateData.productSlug = body.productSlug;
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            brandLabel: true,
          }
        }
      }
    });

    // Recalculate stats for productSlug (and previous productSlug if changed)
    const slugsToRecalc = new Set([existing.productSlug, updatedReview.productSlug]);
    for (const slug of slugsToRecalc) {
      const allReviews = await prisma.review.findMany({ where: { productSlug: slug } });
      const count = allReviews.length;
      const avg = count > 0 ? allReviews.reduce((acc, r) => acc + r.rating, 0) / count : 0;
      await prisma.product.update({
        where: { slug },
        data: {
          rating: Math.round(avg * 10) / 10,
          reviewCount: count,
        }
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'avis' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, 'reviews.moderate');
    if (!auth.authorized) return auth.response!;
    const { id } = await params;
    const reviewId = parseInt(id, 10);

    const existing = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id: reviewId }
    });

    // Recalculate stats for product
    const allReviews = await prisma.review.findMany({ where: { productSlug: existing.productSlug } });
    const count = allReviews.length;
    const avg = count > 0 ? allReviews.reduce((acc, r) => acc + r.rating, 0) / count : 0;
    await prisma.product.update({
      where: { slug: existing.productSlug },
      data: {
        rating: Math.round(avg * 10) / 10,
        reviewCount: count,
      }
    }).catch(console.error);

    return NextResponse.json({ success: true, message: 'Avis supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
