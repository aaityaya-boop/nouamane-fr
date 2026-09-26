import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const now = new Date();
    // Active visitors window: 90 seconds (paired with 30s heartbeat)
    const ninetySecondsAgo = new Date(now.getTime() - 90 * 1000);
    const maxFutureThreshold = new Date(now.getTime() + 10 * 1000);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Auto-fix any stuck records where lastSeen is in the future
    await prisma.visitor.updateMany({
      where: {
        lastSeen: { gt: maxFutureThreshold }
      },
      data: {
        lastSeen: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
    });

    const [activeVisitorsCount, todayVisitorsCount, recentPageViews, activeCarts] = await Promise.all([
      prisma.visitor.count({
        where: {
          lastSeen: {
            gte: ninetySecondsAgo,
            lte: maxFutureThreshold
          }
        }
      }),
      prisma.visitor.count({
        where: {
          lastSeen: {
            gte: startOfDay,
            lte: maxFutureThreshold
          }
        }
      }),
      prisma.pageView.findMany({
        where: {
          createdAt: { lte: maxFutureThreshold }
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { visitor: true }
      }),
      prisma.liveCartSession.count({
        where: {
          lastActivity: { gte: new Date(now.getTime() - 15 * 60000) },
          totalValue: { gt: 0 }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      activeVisitorsCount,
      todayVisitorsCount,
      recentPageViews,
      activeCarts,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching live stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
