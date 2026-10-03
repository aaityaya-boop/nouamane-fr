import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { getStartOfDayGMT } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const now = new Date();

    const [activeVisitorsRes, todayVisitorsRes, recentPageViews, activeCarts] = await Promise.all([
      // 2-minute active window evaluated directly on database server
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int as count 
        FROM "Visitor" 
        WHERE "lastSeen" >= NOW() - INTERVAL '2 minutes'
      `,
      // Today visitors in Casablanca timezone evaluated on database
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int as count 
        FROM "Visitor" 
        WHERE "lastSeen" >= date_trunc('day', NOW() AT TIME ZONE 'Africa/Casablanca') AT TIME ZONE 'Africa/Casablanca'
      `,
      // 6 most recent real pageviews
      prisma.pageView.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { visitor: true }
      }),
      prisma.liveCartSession.count({
        where: {
          lastActivity: { gte: new Date(Date.now() - 15 * 60000) },
          totalValue: { gt: 0 }
        }
      })
    ]);

    const activeVisitorsCount = Number(activeVisitorsRes[0]?.count || 0);
    const todayVisitorsCount = Number(todayVisitorsRes[0]?.count || 0);

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
