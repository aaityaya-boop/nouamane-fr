import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'orders.view')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      take: 30,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        shippingCity: true,
        shippingAddress: true,
        status: true,
        total: true,
        items: true,
        createdAt: true,
        claims: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            categoryLabel: true,
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders for SAV:', error);
    return NextResponse.json({ error: 'Erreur lors de la recherche des commandes.' }, { status: 500 });
  }
}
