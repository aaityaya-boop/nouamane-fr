import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`product_review:${clientIp}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Trop d’avis envoyés récemment. Veuillez patienter.' }, { status: 429 });
    }

    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const body = await request.json();

    const { author, city, rating, title, comment } = body;

    if (
      !author ||
      !rating ||
      !title ||
      !comment ||
      typeof author !== 'string' ||
      typeof title !== 'string' ||
      typeof comment !== 'string'
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedRating = Math.min(5, Math.max(1, parseInt(String(rating), 10) || 5));

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { slug: decodedSlug }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create review
    await prisma.review.create({
      data: {
        productSlug: decodedSlug,
        author: author.trim().slice(0, 80),
        city: typeof city === 'string' && city.trim() ? city.trim().slice(0, 60) : 'Maroc',
        rating: parsedRating,
        title: title.trim().slice(0, 140),
        comment: comment.trim().slice(0, 2000),
      }
    });

    // Update product rating and review count
    const allReviews = await prisma.review.findMany({
      where: { productSlug: decodedSlug }
    });

    const newReviewCount = allReviews.length;
    const newRating = newReviewCount > 0 
      ? allReviews.reduce((acc, rev) => acc + rev.rating, 0) / newReviewCount
      : 0;

    await prisma.product.update({
      where: { slug: decodedSlug },
      data: {
        rating: Math.round(newRating * 10) / 10, // Round to 1 decimal place
        reviewCount: newReviewCount
      }
    });

    return NextResponse.json({ success: true, message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    return NextResponse.json({ error: 'Failed to add review' }, { status: 500 });
  }
}
