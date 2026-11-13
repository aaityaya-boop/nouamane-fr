import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncAdSpendToAdminExpense } from '@/lib/ads/ad-sync-service';
import { requirePermission, requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['marketing.view', 'marketing.manage_campaigns']);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    const where: any = {};
    if (platform && platform !== 'ALL') where.platform = platform;
    if (status && status !== 'ALL') where.status = status;

    const campaigns = await prisma.adCampaign.findMany({
      where,
      orderBy: { totalSpend: 'desc' },
      include: {
        integration: {
          select: { accountName: true, status: true },
        },
      },
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    console.error('Error fetching ad campaigns:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requirePermission(req, 'marketing.manage_campaigns');
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const {
      name,
      platform,
      dailyBudget,
      totalSpend,
      conversions,
      conversionValue,
      impressions,
      clicks,
      status,
      objective,
      targetAudience,
    } = body;

    if (!name || !platform) {
      return NextResponse.json(
        { success: false, error: 'Nom de campagne et Plateforme requis' },
        { status: 400 }
      );
    }

    const spendMAD = parseFloat(totalSpend || '0');
    const revenueMAD = parseFloat(conversionValue || '0');
    const purchases = parseInt(conversions || '0', 10);
    const cpaMAD = purchases > 0 ? parseFloat((spendMAD / purchases).toFixed(2)) : 0;
    const roas = spendMAD > 0 && revenueMAD > 0 ? parseFloat((revenueMAD / spendMAD).toFixed(2)) : 0;

    let recommendation = 'LEARNING';
    if (roas >= 4.0 && purchases >= 3) recommendation = 'SCALE';
    else if (roas >= 2.0) recommendation = 'OPTIMIZE';
    else if (spendMAD > 250 && roas < 1.6) recommendation = 'PAUSE';

    const campaign = await prisma.adCampaign.create({
      data: {
        name,
        platform,
        dailyBudget: dailyBudget ? parseFloat(dailyBudget) : 0,
        totalSpend: spendMAD,
        impressions: impressions ? parseInt(impressions, 10) : 0,
        clicks: clicks ? parseInt(clicks, 10) : 0,
        ctr: clicks && impressions ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
        cpc: clicks && spendMAD ? parseFloat((spendMAD / clicks).toFixed(2)) : 0,
        conversions: purchases,
        conversionValue: revenueMAD,
        cpa: cpaMAD,
        roas,
        recommendation,
        status: status || 'ACTIVE',
        objective: objective || 'CONVERSIONS',
        targetAudience: targetAudience || null,
        lastSyncedAt: new Date(),
      },
    });

    // Also auto-sync to Finance if spend > 0
    if (spendMAD > 0) {
      await syncAdSpendToAdminExpense(platform, spendMAD);
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error('Error creating ad campaign:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
