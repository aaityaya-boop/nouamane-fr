import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { filterCatalog, buildAdaptiveQueue, parseNotes } from '@/lib/scentMatch/engine';
import { ScentMatchFilters, QueueProduct } from '@/lib/scentMatch/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const gender = (searchParams.get('gender') || 'all') as ScentMatchFilters['gender'];
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 250;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 650;
    const family = (searchParams.get('family') || 'all') as ScentMatchFilters['family'];
    const season = (searchParams.get('season') || 'all') as ScentMatchFilters['season'];
    const occasion = (searchParams.get('occasion') || 'all') as ScentMatchFilters['occasion'];
    const personality = (searchParams.get('personality') || 'all') as ScentMatchFilters['personality'];
    const seedParam = searchParams.get('seed');
    const seed = seedParam ? parseInt(seedParam, 10) : 42;

    const filters: ScentMatchFilters = {
      gender,
      minPrice,
      maxPrice,
      family,
      season,
      occasion,
      personality
    };

    // Load session if exists to get previous swipes
    let likedIds: number[] = [];
    let passedIds: number[] = [];
    let savedIds: number[] = [];

    if (sessionId) {
      const session = await prisma.scentMatchSession.findUnique({
        where: { sessionId }
      });
      if (session) {
        likedIds = JSON.parse(session.likedProductIds || '[]').map(Number);
        passedIds = JSON.parse(session.passedProductIds || '[]').map(Number);
        savedIds = JSON.parse(session.savedProductIds || '[]').map(Number);
      }
    }

    // Fetch published products from DB
    const dbProducts = await prisma.product.findMany({
      where: {
        published: true,
        inStock: true
      },
      select: {
        id: true,
        slug: true,
        name: true,
        brandLabel: true,
        brandId: true,
        gender: true,
        price: true,
        originalPrice: true,
        images: true,
        notes: true,
        tags: true,
        subcategoryLabel: true,
        perfectSeason: true,
        inStock: true,
        tagline: true,
        description: true
      }
    });

    // Transform DB products to QueueProducts
    const queueProducts: QueueProduct[] = dbProducts.map((p) => {
      let images: string[] = [];
      try {
        images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
      } catch {
        images = [p.images as any];
      }
      if (!Array.isArray(images) || images.length === 0) {
        images = ['/images/placeholder-perfume.png'];
      }

      const notesParsed = parseNotes(p.notes);

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brandLabel: p.brandLabel || 'Maison NAY',
        brandId: p.brandId,
        gender: p.gender,
        price: p.price,
        originalPrice: p.originalPrice,
        images,
        notes: {
          top: notesParsed.top,
          heart: notesParsed.heart,
          base: notesParsed.base
        },
        subcategoryLabel: p.subcategoryLabel || 'Signature',
        perfectSeason: p.perfectSeason || 'Toutes Saisons',
        inStock: p.inStock,
        tagline: p.tagline,
        description: p.description
      };
    });

    // Apply strict hard filters
    const eligible = filterCatalog(queueProducts, filters);

    // Apply intelligent adaptive queue ordering (includes all eligible products without artificial truncation)
    const queue = buildAdaptiveQueue({
      eligibleProducts: eligible,
      likedIds,
      passedIds,
      savedIds,
      seed
    });

    return NextResponse.json({
      success: true,
      totalEligible: eligible.length,
      queue,
      likedCount: likedIds.length,
      passedCount: passedIds.length,
      savedCount: savedIds.length
    });
  } catch (error) {
    console.error('Error in /api/scent-match/queue:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
