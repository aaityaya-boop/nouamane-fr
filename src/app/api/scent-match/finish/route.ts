import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { calculateScentDNA, parseNotes } from '@/lib/scentMatch/engine';
import { QueueProduct } from '@/lib/scentMatch/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const session = await prisma.scentMatchSession.findUnique({
      where: { sessionId },
      include: { result: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const likedIds: number[] = JSON.parse(session.likedProductIds || '[]');
    const passedIds: number[] = JSON.parse(session.passedProductIds || '[]');
    const savedIds: number[] = JSON.parse(session.savedProductIds || '[]');

    // Fetch all catalog products for matching
    const dbProducts = await prisma.product.findMany({
      where: { published: true, inStock: true },
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
        subcategoryLabel: true,
        perfectSeason: true,
        inStock: true,
        tagline: true,
        description: true
      }
    });

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

    // Generate or keep shareToken
    const shareToken = session.result?.shareToken || `nay-${crypto.randomBytes(8).toString('hex')}`;

    // Compute DNA & top matches
    const analysis = calculateScentDNA({
      sessionId,
      shareToken,
      allProducts: queueProducts,
      likedIds,
      passedIds,
      savedIds
    });

    // Save or update result
    await prisma.scentMatchResult.upsert({
      where: { sessionId },
      update: {
        shareToken,
        personalityKey: analysis.personality.key,
        personalityTitle: analysis.personality.titleFr,
        personalityDescription: analysis.personality.descriptionFr,
        dnaScores: JSON.stringify(analysis.dnaScores),
        favoriteNotes: JSON.stringify(analysis.favoriteNotes),
        topMatches: JSON.stringify(analysis.topMatches)
      },
      create: {
        sessionId,
        shareToken,
        personalityKey: analysis.personality.key,
        personalityTitle: analysis.personality.titleFr,
        personalityDescription: analysis.personality.descriptionFr,
        dnaScores: JSON.stringify(analysis.dnaScores),
        favoriteNotes: JSON.stringify(analysis.favoriteNotes),
        topMatches: JSON.stringify(analysis.topMatches)
      }
    });

    // Update session status
    await prisma.scentMatchSession.update({
      where: { sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Log event
    await prisma.scentMatchEvent.create({
      data: {
        sessionId,
        eventType: 'FINISH',
        metadata: JSON.stringify({
          personality: analysis.personality.key,
          totalLikes: likedIds.length,
          totalPasses: passedIds.length
        })
      }
    });

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error in /api/scent-match/finish:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
