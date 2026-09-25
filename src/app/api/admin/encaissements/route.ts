import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';
import { seedDefaultCarriersIfEmpty, calculateOrderEncaissement } from '@/lib/encaissements/reconciliationService';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'finance.view_revenue')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    // Ensure default carriers exist
    await seedDefaultCarriersIfEmpty();

    const { searchParams } = new URL(request.url);
    const dateRange = Number(searchParams.get('days') || 0); // 0 = all time
    const carrierId = searchParams.get('carrierId');
    const statusFilter = searchParams.get('status');

    // Fetch carriers
    const carriers = await prisma.carrier.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    // Date filter clause
    let dateWhereClause: any = {};
    if (dateRange > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - dateRange);
      dateWhereClause = { createdAt: { gte: cutoff } };
    }

    // Fetch orders with allocations and carrier info
    const orders = await prisma.order.findMany({
      where: {
        ...dateWhereClause,
        ...(carrierId && carrierId !== 'ALL' ? { carrierId } : {}),
      },
      include: {
        carrier: true,
        payoutAllocations: {
          include: {
            payout: true,
          },
        },
        adjustments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all payouts with allocations
    const payouts = await prisma.carrierPayout.findMany({
      include: {
        carrier: true,
        allocations: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerName: true,
                total: true,
                status: true,
              },
            },
          },
        },
        adjustments: true,
      },
      orderBy: { receivedAt: 'desc' },
    });

    // Calculate each order's encaissement state
    const calculatedOrders = orders.map((o) => calculateOrderEncaissement(o));

    // Filter by status if specified
    const filteredOrders = statusFilter && statusFilter !== 'ALL'
      ? calculatedOrders.filter((o) => o.encaissementStatus === statusFilter)
      : calculatedOrders;

    // Calculate High-Precision Real KPIs
    // 1. Total Solde Restant à Recevoir (sur commandes livrées/en attente de versement)
    const totalRemainingDue = calculatedOrders
      .filter((o) => o.encaissementStatus !== 'CANCELLED_REFUSED')
      .reduce((sum, o) => sum + Math.max(0, o.remainingBalance), 0);

    // 2. Total Versements Confirmés Reçus (en banque)
    const confirmedPayoutsInPeriod = payouts.filter((p) => {
      if (p.status !== 'CONFIRMED') return false;
      if (dateRange === 0) return true;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - dateRange);
      return new Date(p.receivedAt) >= cutoff;
    });

    const totalConfirmedReceived = confirmedPayoutsInPeriod.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 3. Montants Échus Non Réglés (Overdue)
    const overdueOrders = calculatedOrders.filter((o) => o.isOverdue);
    const totalOverdueAmount = overdueOrders.reduce((sum, o) => sum + Math.max(0, o.remainingBalance), 0);

    // 4. Dossiers à vérifier (Discrepancies & Incomplete Data)
    const issuesCount = calculatedOrders.filter(
      (o) => o.encaissementStatus === 'DISCREPANCY' || o.encaissementStatus === 'INCOMPLETE_DATA'
    ).length;

    // 5. Per-carrier aggregation
    const carrierBalances: Record<string, {
      carrierId: string;
      carrierName: string;
      carrierCode: string;
      deliveredOrdersCount: number;
      grossDueTotal: number;
      carrierFeesTotal: number;
      netDueTotal: number;
      paidConfirmedTotal: number;
      remainingBalanceTotal: number;
      overdueOrdersCount: number;
    }> = {};

    carriers.forEach((c) => {
      carrierBalances[c.id] = {
        carrierId: c.id,
        carrierName: c.name,
        carrierCode: c.code,
        deliveredOrdersCount: 0,
        grossDueTotal: 0,
        carrierFeesTotal: 0,
        netDueTotal: 0,
        paidConfirmedTotal: 0,
        remainingBalanceTotal: 0,
        overdueOrdersCount: 0,
      };
    });

    calculatedOrders.forEach((o) => {
      const cId = o.carrierId;
      if (cId && carrierBalances[cId] && o.encaissementStatus !== 'CANCELLED_REFUSED') {
        if (['delivered', 'completed', 'livre'].includes(o.orderStatus.toLowerCase())) {
          carrierBalances[cId].deliveredOrdersCount += 1;
        }
        carrierBalances[cId].grossDueTotal += o.codCollectedAmount ?? o.grossAmount;
        carrierBalances[cId].carrierFeesTotal += o.carrierFee ?? 0;
        carrierBalances[cId].netDueTotal += o.netDueToNay;
        carrierBalances[cId].paidConfirmedTotal += o.paidConfirmed;
        carrierBalances[cId].remainingBalanceTotal += Math.max(0, o.remainingBalance);
        if (o.isOverdue) {
          carrierBalances[cId].overdueOrdersCount += 1;
        }
      }
    });

    // Recent audit logs
    const auditLogs = await prisma.encaissementAuditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      orders: filteredOrders,
      allOrdersCount: calculatedOrders.length,
      payouts,
      carriers,
      auditLogs,
      kpis: {
        totalRemainingDue: Math.round(totalRemainingDue * 100) / 100,
        totalConfirmedReceived: Math.round(totalConfirmedReceived * 100) / 100,
        confirmedPayoutsCount: confirmedPayoutsInPeriod.length,
        totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
        overdueOrdersCount: overdueOrders.length,
        issuesCount,
        carrierBalances: Object.values(carrierBalances),
      },
    });
  } catch (error) {
    console.error('Error fetching encaissements:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des encaissements.' }, { status: 500 });
  }
}
