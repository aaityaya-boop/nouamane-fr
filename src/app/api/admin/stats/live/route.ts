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
    // In active e-commerce presence, active users are those seen within the last 3 minutes (with 45s heartbeat)
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60000);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [activeVisitorsCount, todayVisitorsCount, recentPageViews, activeCarts] = await Promise.all([
      prisma.visitor.count({
        where: { lastSeen: { gte: threeMinutesAgo } }
      }),
      prisma.visitor.count({
        where: { lastSeen: { gte: startOfDay } }
      }),
      prisma.pageView.findMany({
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
