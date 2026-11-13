import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(request: Request) {
  try {
    const auth = await requirePermission(request, 'reviews.view');
    if (!auth.authorized) return auth.response!;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('q')?.trim() || '';
    const ratingFilter = searchParams.get('rating');
    const verifiedFilter = searchParams.get('verified');
    const productSlug = searchParams.get('productSlug');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const recentOnly = searchParams.get('recentOnly') === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { author: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { productSlug: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (ratingFilter && ratingFilter !== 'all') {
      where.rating = parseInt(ratingFilter, 10);
    }

    if (verifiedFilter === 'true') {
      where.verified = true;
    } else if (verifiedFilter === 'false') {
      where.verified = false;
    }

    if (productSlug && productSlug !== 'all') {
      where.productSlug = productSlug;
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (recentOnly) {
      where.createdAt = { gte: sevenDaysAgo };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sortBy === 'rating-high') orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
    else if (sortBy === 'rating-low') orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
    else if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

    const skip = (page - 1) * limit;

    const [reviews, totalCount, statsAll, productsList, recentCount, latestSpotlight] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              brandLabel: true,
              price: true,
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
      prisma.review.groupBy({
        by: ['rating', 'verified'],
        _count: { _all: true },
      }),
      prisma.product.findMany({
        where: { published: true },
        select: { slug: true, name: true, brandLabel: true },
        orderBy: { name: 'asc' }
      }),
      prisma.review.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      }),
      prisma.review.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: true, brandLabel: true }
          }
        }
      })
    ]);

    // Calculate aggregated stats
    let totalReviews = 0;
    let verifiedCount = 0;
    let pendingCount = 0;
    let ratingSum = 0;
    let positiveCount = 0;
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const s of statsAll) {
      const count = s._count._all;
      totalReviews += count;
      ratingSum += s.rating * count;
      ratingDist[s.rating] = (ratingDist[s.rating] || 0) + count;
      if (s.rating >= 4) positiveCount += count;
      if (s.verified) {
        verifiedCount += count;
      } else {
        pendingCount += count;
      }
    }

    const avgRating = totalReviews > 0 ? +(ratingSum / totalReviews).toFixed(2) : 5.0;
    const csatPercentage = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 100;

    return NextResponse.json({
      reviews,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: {
        totalReviews,
        verifiedCount,
        pendingCount,
        avgRating,
        ratingDist,
        recentCount,
        csatPercentage,
      },
      latestSpotlight,
      productsList,
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePermission(request, 'reviews.moderate');
    if (!auth.authorized) return auth.response!;
    const body = await request.json();
    const { author, city, productSlug, rating, title, comment, verified } = body;

    if (!author || !productSlug || !rating || !title || !comment) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { slug: productSlug }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
    }

    const newReview = await prisma.review.create({
      data: {
        productSlug,
        author: author.trim(),
        city: city?.trim() || 'Maroc',
        rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
        title: title.trim(),
        comment: comment.trim(),
        verified: Boolean(verified),
      },
      include: { product: true }
    });

    // Recalculate product rating & reviewCount
    const allReviews = await prisma.review.findMany({
      where: { productSlug }
    });
    const reviewCount = allReviews.length;
    const avg = reviewCount > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;

    await prisma.product.update({
      where: { slug: productSlug },
      data: {
        rating: Math.round(avg * 10) / 10,
        reviewCount,
      }
    });

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'avis' }, { status: 500 });
  }
}
