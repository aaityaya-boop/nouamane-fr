import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Config
    const config = await prisma.scentMatchConfig.findFirst({
      where: { id: 1 }
    });

    // 2. Aggregate session stats
    const totalSessions = await prisma.scentMatchSession.count();
    const completedSessions = await prisma.scentMatchSession.count({
      where: { status: 'COMPLETED' }
    });

    const sessionAggregates = await prisma.scentMatchSession.aggregate({
      _sum: {
        totalSwipes: true,
        totalLikes: true,
        totalPasses: true,
        totalSaves: true
      }
    });

    const totalSwipes = sessionAggregates._sum.totalSwipes || 0;
    const totalLikes = sessionAggregates._sum.totalLikes || 0;
    const totalPasses = sessionAggregates._sum.totalPasses || 0;
    const totalSaves = sessionAggregates._sum.totalSaves || 0;

    const likeRate = totalLikes + totalPasses > 0
      ? Math.round((totalLikes / (totalLikes + totalPasses)) * 100)
      : 0;

    const completionRate = totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

    // 3. Device breakdown
    const desktopSessions = await prisma.scentMatchSession.count({
      where: { deviceType: 'desktop' }
    });
    const mobileSessions = await prisma.scentMatchSession.count({
      where: { deviceType: 'mobile' }
    });

    // 4. Top Liked Products from ScentMatchEvent
    const likeEvents = await prisma.scentMatchEvent.groupBy({
      by: ['productId'],
      where: {
        eventType: 'LIKE',
        productId: { not: null }
      },
      _count: {
        productId: true
      },
      orderBy: {
        _count: {
          productId: 'desc'
        }
      },
      take: 10
    });

    const passEvents = await prisma.scentMatchEvent.groupBy({
      by: ['productId'],
      where: {
        eventType: 'PASS',
        productId: { not: null }
      },
      _count: {
        productId: true
      }
    });
    const passMap = new Map<number, number>();
    passEvents.forEach((pe) => {
      if (pe.productId) passMap.set(pe.productId, pe._count.productId);
    });

    const productIds = likeEvents.map((le) => le.productId!).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        brandLabel: true,
        price: true,
        images: true,
        inStock: true,
        subcategoryLabel: true
      }
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const topLikedProducts = likeEvents.map((le) => {
      const p = productMap.get(le.productId!);
      const likes = le._count.productId;
      const passes = passMap.get(le.productId!) || 0;
      const total = likes + passes;
      const rate = total > 0 ? Math.round((likes / total) * 100) : 100;

      let image = '/images/placeholder-perfume.png';
      if (p?.images) {
        try {
          const parsed = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
          if (Array.isArray(parsed) && parsed.length > 0) image = parsed[0];
        } catch {
          image = p.images as any;
        }
      }

      return {
        id: le.productId!,
        name: p?.name || 'Parfum inconnu',
        brandLabel: p?.brandLabel || 'Maison NAY',
        price: p?.price || 0,
        subcategoryLabel: p?.subcategoryLabel || 'Signature',
        image,
        inStock: p?.inStock ?? true,
        likeCount: likes,
        passCount: passes,
        likeRate: rate
      };
    });

    // 5. Recent Results
    const recentResults = await prisma.scentMatchResult.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        session: {
          select: {
            participantName: true,
            deviceType: true,
            totalLikes: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        config: config || { isEnabled: true, recommendedSwipes: 10, minSwipesForAnalysis: 3 },
        metrics: {
          totalSessions,
          completedSessions,
          totalSwipes,
          totalLikes,
          totalPasses,
          totalSaves,
          likeRate,
          completionRate,
          desktopSessions,
          mobileSessions
        },
        topLikedProducts,
        recentResults: recentResults.map((r) => ({
          id: r.id,
          shareToken: r.shareToken,
          personalityTitle: r.personalityTitle,
          participantName: r.session?.participantName || 'Visiteur',
          deviceType: r.session?.deviceType || 'desktop',
          totalLikes: r.session?.totalLikes || 0,
          createdAt: r.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error in /api/scent-match/admin GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { isEnabled, recommendedSwipes, minSwipesForAnalysis, allowEarlyFinish } = body;

    const updated = await prisma.scentMatchConfig.upsert({
      where: { id: 1 },
      update: {
        ...(typeof isEnabled === 'boolean' ? { isEnabled } : {}),
        ...(typeof recommendedSwipes === 'number' ? { recommendedSwipes } : {}),
        ...(typeof minSwipesForAnalysis === 'number' ? { minSwipesForAnalysis } : {}),
        ...(typeof allowEarlyFinish === 'boolean' ? { allowEarlyFinish } : {})
      },
      create: {
        id: 1,
        isEnabled: isEnabled ?? true,
        recommendedSwipes: recommendedSwipes ?? 10,
        minSwipesForAnalysis: minSwipesForAnalysis ?? 3,
        allowEarlyFinish: allowEarlyFinish ?? true
      }
    });

    return NextResponse.json({
      success: true,
      config: updated
    });
  } catch (error) {
    console.error('Error in /api/scent-match/admin POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
