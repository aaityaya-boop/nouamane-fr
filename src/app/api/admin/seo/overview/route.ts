import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(req: Request) {
  try {
    const auth = await requireAnyPermission(req, ['marketing.view', 'marketing.manage_seo']);
    if (!auth.authorized) return auth.response!;
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '28', 10);
    const dateCutoff = new Date();
    dateCutoff.setDate(dateCutoff.getDate() - days);

    const records = await prisma.seoSearchConsoleDaily.findMany({
      where: {
        date: {
          gte: dateCutoff,
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    let totalClicks = 0;
    let totalImpressions = 0;
    let totalPosition = 0;

    const chartData = records.map(r => {
      totalClicks += r.clicks;
      totalImpressions += r.impressions;
      totalPosition += r.position;
      
      return {
        date: r.date.toISOString().split('T')[0],
        clicks: r.clicks,
        impressions: r.impressions
      };
    });

    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
    const avgPosition = records.length > 0 ? (totalPosition / records.length).toFixed(1) : 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          clicks: totalClicks,
          impressions: totalImpressions,
          ctr: avgCtr,
          position: avgPosition
        },
        chart: chartData
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
