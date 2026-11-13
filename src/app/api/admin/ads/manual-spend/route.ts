import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncAdSpendToAdminExpense } from '@/lib/ads/ad-sync-service';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['marketing.manage_campaigns', 'finance.add_expense']);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { platform, date, spend, impressions, clicks, conversions, revenue, notes } = body;

    if (!platform || spend === undefined) {
      return NextResponse.json(
        { success: false, error: 'Plateforme et Montant dépensé (MAD) requis' },
        { status: 400 }
      );
    }

    const spendMAD = parseFloat(spend);
    const revenueMAD = parseFloat(revenue || '0');
    const orders = parseInt(conversions || '0', 10);
    const roas = spendMAD > 0 && revenueMAD > 0 ? parseFloat((revenueMAD / spendMAD).toFixed(2)) : 0;
    const cpa = orders > 0 ? parseFloat((spendMAD / orders).toFixed(2)) : 0;
    const clicksCount = parseInt(clicks || '0', 10);
    const cpc = clicksCount > 0 ? parseFloat((spendMAD / clicksCount).toFixed(2)) : 0;

    const spendDate = date ? new Date(date) : new Date();
    spendDate.setHours(0, 0, 0, 0);

    const record = await prisma.adDailySpend.create({
      data: {
        platform,
        date: spendDate,
        spend: spendMAD,
        impressions: impressions ? parseInt(impressions, 10) : 0,
        clicks: clicksCount,
        conversions: orders,
        revenue: revenueMAD,
        roas,
        cpa,
        cpc,
        notes: notes || null,
        syncedFromApi: false,
        syncedToExpenses: true,
      },
    });

    // Auto-sync into AdminExpense for Finance P&L
    await syncAdSpendToAdminExpense(platform, spendMAD, spendDate);

    return NextResponse.json({
      success: true,
      record,
      message: `Dépense de ${spendMAD} MAD enregistrée et synchronisée avec la Finance.`,
    });
  } catch (error: any) {
    console.error('Error logging manual spend:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
