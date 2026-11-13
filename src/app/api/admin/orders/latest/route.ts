import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(request, ['orders.view', 'dashboard.view']);
    if (errorResponse) return errorResponse;

    const latestOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ order: latestOrder });
  } catch (error) {
    console.error('Error fetching latest order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
