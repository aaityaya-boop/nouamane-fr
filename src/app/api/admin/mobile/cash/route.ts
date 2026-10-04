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

    const roleUpper = (admin.role || '').toUpperCase();
    const isOwner = roleUpper === 'OWNER' || roleUpper === 'CO_OWNER' || roleUpper === 'SUPER_ADMIN';
    const canViewCash = isOwner || hasPermission(admin, 'finance.view_revenue');

    if (!canViewCash) {
      return NextResponse.json(
        { error: 'Accès restreint. Le suivi de la caisse et des encaissements est réservé aux propriétaires.' },
        { status: 403 }
      );
    }

    // Fetch orders with courier and timeline events
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        timeline: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    // Courier groupings
    const couriersMap = new Map<
      string,
      {
        courier: string;
        ordersCount: number;
        shippedPendingCount: number;
        shippedPendingAmount: number;
        deliveredCount: number;
        deliveredAmount: number;
        returnedCount: number;
        returnedAmount: number;
        orders: Array<{
          id: string;
          orderNumber: string;
          customerName: string;
          city: string;
          total: number;
          status: string;
          trackingNumber?: string | null;
          createdAt: string;
        }>;
      }
    >();

    let totalDeliveredAmount = 0;
    let totalPendingWithCourier = 0;
    let totalReturnedAmount = 0;

    for (const o of orders) {
      // Find carrier from timeline
      const carrierEvent = o.timeline.find((t) => t.carrier);
      const carrierName = carrierEvent?.carrier || 'Livreur Principal (Standard)';
      const trackingNumber = carrierEvent?.trackingNumber || null;

      const existing = couriersMap.get(carrierName) || {
        courier: carrierName,
        ordersCount: 0,
        shippedPendingCount: 0,
        shippedPendingAmount: 0,
        deliveredCount: 0,
        deliveredAmount: 0,
        returnedCount: 0,
        returnedAmount: 0,
        orders: [],
      };

      existing.ordersCount++;
      const orderTotal = Number(o.total) || 0;

      if (o.status === 'delivered') {
        existing.deliveredCount++;
        existing.deliveredAmount += orderTotal;
        totalDeliveredAmount += orderTotal;
      } else if (o.status === 'shipped') {
        existing.shippedPendingCount++;
        existing.shippedPendingAmount += orderTotal;
        totalPendingWithCourier += orderTotal;
      } else if (o.status === 'refused' || o.status === 'returned') {
        existing.returnedCount++;
        existing.returnedAmount += orderTotal;
        totalReturnedAmount += orderTotal;
      }

      if (existing.orders.length < 15) {
        existing.orders.push({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          city: o.shippingCity,
          total: orderTotal,
          status: o.status,
          trackingNumber,
          createdAt: o.createdAt.toISOString(),
        });
      }

      couriersMap.set(carrierName, existing);
    }

    const couriersList = Array.from(couriersMap.values());

    return NextResponse.json({
      success: true,
      summary: {
        deliveredCollected: totalDeliveredAmount,
        pendingWithCouriers: totalPendingWithCourier,
        returnedValue: totalReturnedAmount,
        totalInCirculation: totalDeliveredAmount + totalPendingWithCourier,
      },
      couriers: couriersList,
    });
  } catch (error: any) {
    console.error('[Cash API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors du calcul de la caisse' },
      { status: 500 }
    );
  }
}
