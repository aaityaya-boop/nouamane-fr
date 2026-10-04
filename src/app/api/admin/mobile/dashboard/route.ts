import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, yesterday, 7days, 30days, all

    const roleUpper = (admin.role || '').toUpperCase();
    const isOwner = roleUpper === 'OWNER' || roleUpper === 'CO_OWNER' || roleUpper === 'SUPER_ADMIN';
    const canViewFinancials = isOwner || hasPermission(admin, 'dashboard.view_financials') || hasPermission(admin, 'finance.view_revenue');

    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    } else if (period === '7days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build query where filter for period
    const orderDateFilter: any = {};
    if (startDate) orderDateFilter.gte = startDate;
    if (endDate) orderDateFilter.lte = endDate;

    const periodWhere = Object.keys(orderDateFilter).length > 0 ? { createdAt: orderDateFilter } : {};

    // 1. Fetch period orders + all-time high-level stats in parallel
    const [periodOrders, allOrdersCount, lowStockProducts, recentTimeline] = await Promise.all([
      prisma.order.findMany({
        where: periodWhere,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count(),
      prisma.product.findMany({
        where: {
          OR: [{ stock: { lte: 3 } }, { inStock: false }],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          stock: true,
          inStock: true,
          price: true,
          images: true,
          sku: true,
        },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
      prisma.orderTimelineEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          order: {
            select: {
              orderNumber: true,
              customerName: true,
              total: true,
            },
          },
        },
      }),
    ]);

    // 2. Metrics calculation
    const validOrders = periodOrders.filter(
      (o) => o.status !== 'annule' && o.status !== 'cancelled' && o.status !== 'refused' && o.status !== 'returned'
    );

    const periodRevenue = canViewFinancials
      ? validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
      : null;

    const deliveredOrders = periodOrders.filter((o) => o.status === 'delivered');
    const deliveredRevenue = canViewFinancials
      ? deliveredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
      : null;

    const aov = canViewFinancials && validOrders.length > 0
      ? Math.round(periodRevenue! / validOrders.length)
      : 0;

    // Order status breakdown for period
    const counts = {
      total: periodOrders.length,
      pending: periodOrders.filter((o) => o.status === 'pending' || o.status === 'en-attente' || o.status === 'unconfirmed').length,
      confirmed: periodOrders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length,
      shipped: periodOrders.filter((o) => o.status === 'shipped').length,
      delivered: deliveredOrders.length,
      refused: periodOrders.filter((o) => o.status === 'refused').length,
      returned: periodOrders.filter((o) => o.status === 'returned').length,
      cancelled: periodOrders.filter((o) => o.status === 'cancelled' || o.status === 'annule').length,
    };

    // COD Pending Collection (Cash in circulation with couriers)
    const codPendingOrders = periodOrders.filter((o) => o.status === 'shipped' || o.status === 'confirmed');
    const codPendingAmount = canViewFinancials
      ? codPendingOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
      : null;

    // Best-selling products aggregation
    const productSalesMap = new Map<string, { id?: number; name: string; quantity: number; revenue: number }>();
    for (const order of validOrders) {
      try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        if (Array.isArray(items)) {
          for (const item of items) {
            const key = item.name || `Product-${item.id}`;
            const existing = productSalesMap.get(key) || {
              id: item.id,
              name: key,
              quantity: 0,
              revenue: 0,
            };
            const q = Number(item.quantity) || 1;
            const p = Number(item.price) || 0;
            existing.quantity += q;
            existing.revenue += q * p;
            productSalesMap.set(key, existing);
          }
        }
      } catch {}
    }

    const bestSellers = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      period,
      metrics: {
        revenue: periodRevenue,
        deliveredRevenue,
        aov,
        ordersCount: counts.total,
        allTimeOrdersCount: allOrdersCount,
        counts,
        codPending: {
          count: codPendingOrders.length,
          amount: codPendingAmount,
        },
      },
      lowStock: {
        count: lowStockProducts.length,
        items: lowStockProducts.map((p) => ({
          ...p,
          firstImage: (() => {
            try {
              const arr = JSON.parse(p.images);
              return Array.isArray(arr) ? arr[0] : null;
            } catch {
              return null;
            }
          })(),
        })),
      },
      bestSellers,
      recentActivity: recentTimeline.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        actorName: t.actorName,
        carrier: t.carrier,
        trackingNumber: t.trackingNumber,
        status: t.status,
        createdAt: t.createdAt,
        orderNumber: t.order?.orderNumber,
        orderTotal: t.order?.total,
        customerName: t.order?.customerName,
      })),
      permissions: {
        canViewFinancials,
        isOwner,
      },
    });
  } catch (error: any) {
    console.error('[Mobile Dashboard API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors du chargement du tableau de bord' },
      { status: 500 }
    );
  }
}
