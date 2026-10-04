import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { recordStatusTransition, generateFallbackTimeline } from '@/lib/orders/timeline';
import { createAdminNotification } from '@/lib/notificationService';

export async function GET(request: Request) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach enriched timeline (falling back to generated progression if legacy order has 0 timeline events)
    const enrichedOrders = orders.map((order) => {
      const timeline = order.timeline && order.timeline.length > 0
        ? order.timeline
        : generateFallbackTimeline(order);
      return {
        ...order,
        timeline,
      };
    });

    return NextResponse.json(enrichedOrders);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    const body = await request.json();
    const { id, status, customerName, city, total, carrier, trackingNumber, customNote, actorNameOverride } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: { timeline: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Logic for Stock update
    if (status && status !== currentOrder.status) {
      const oldStatus = currentOrder.status;
      const newStatus = status;

      if (oldStatus !== 'delivered' && newStatus === 'delivered') {
        // Withdraw stock
        const items = JSON.parse(currentOrder.items || '[]');
        for (const item of items) {
          const productSlug = item.product?.slug || item.slug;
          const qty = item.quantity || 1;
          if (productSlug) {
            const p = await prisma.product.findUnique({ where: { slug: productSlug } });
            if (p) {
              const newStock = Math.max(0, p.stock - qty);
              await prisma.product.update({
                where: { id: p.id },
                data: { stock: newStock, inStock: newStock > 0 },
              });
            }
          }
        }
      } else if (oldStatus === 'delivered' && (newStatus === 'returned' || newStatus === 'refused')) {
        // Restore stock
        const items = JSON.parse(currentOrder.items || '[]');
        for (const item of items) {
          const productSlug = item.product?.slug || item.slug;
          const qty = item.quantity || 1;
          if (productSlug) {
            const p = await prisma.product.findUnique({ where: { slug: productSlug } });
            if (p) {
              const newStock = p.stock + qty;
              await prisma.product.update({
                where: { id: p.id },
                data: { stock: newStock, inStock: newStock > 0 },
              });
            }
          }
        }
      }

      // Record timeline transition event
      const effectiveActor = admin || (actorNameOverride ? {
        id: 'manual',
        name: actorNameOverride,
        role: 'STAFF',
        jobTitle: 'Équipe NAY',
        status: 'ACTIVE',
        avatar: null,
      } as any : null);

      await recordStatusTransition({
        orderId: currentOrder.id,
        oldStatus,
        newStatus,
        actor: effectiveActor,
        carrier,
        trackingNumber,
        customNote,
      });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(customerName && { customerName }),
        ...(city && { shippingCity: city }),
        ...(total !== undefined && { total: Number(total) }),
      },
      include: {
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (status && (status.toLowerCase().includes('cancel') || status.toLowerCase().includes('annul'))) {
      createAdminNotification({
        type: 'ORDER',
        title: `Commande Annulée #${updated.orderNumber} ❌`,
        message: `La commande #${updated.orderNumber} (${updated.customerName}) a été annulée.`,
        link: '/admin/orders',
        metadata: { orderId: updated.id, orderNumber: updated.orderNumber },
      }).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating admin order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
