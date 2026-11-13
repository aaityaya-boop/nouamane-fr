import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, requireAnyPermission } from '@/lib/auth/rbac/serverGuard';
import { recordStatusTransition, generateFallbackTimeline } from '@/lib/orders/timeline';
import { createAdminNotification } from '@/lib/notificationService';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requirePermission(request, 'orders.view');
    if (errorResponse) return errorResponse;

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
    const { user: admin, errorResponse } = await requireAnyPermission(request, [
      'orders.edit',
      'orders.change_status',
      'orders.confirm',
      'orders.prepare',
      'orders.cancel',
      'orders.refund',
    ]);
    if (errorResponse || !admin) return errorResponse!;

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

    const effectiveTotal = total !== undefined ? Number(total) : currentOrder.total;
    let computedPaymentStatus = body.paymentStatus;
    let parsedPaidAmount: number | undefined = undefined;

    if (body.paidAmount !== undefined) {
      parsedPaidAmount = Math.max(0, Number(body.paidAmount) || 0);
      if (!computedPaymentStatus) {
        if (parsedPaidAmount >= effectiveTotal && effectiveTotal > 0) {
          computedPaymentStatus = 'paid';
        } else if (parsedPaidAmount > 0) {
          computedPaymentStatus = 'partial';
        } else {
          computedPaymentStatus = 'unpaid';
        }
      }

      // Record payment event in timeline if changed
      if (parsedPaidAmount !== (currentOrder.paidAmount || 0)) {
        const remaining = Math.max(0, effectiveTotal - parsedPaidAmount);
        const paymentTitle = parsedPaidAmount >= effectiveTotal
          ? 'Commande intégralement réglée'
          : parsedPaidAmount > 0
          ? `Acompte enregistré : ${parsedPaidAmount} MAD`
          : 'Paiement à la livraison';
        await prisma.orderTimelineEvent.create({
          data: {
            orderId: currentOrder.id,
            status: status || currentOrder.status,
            title: paymentTitle,
            description: `Montant encaissé : ${parsedPaidAmount} MAD. Solde restant à la livraison : ${remaining} MAD.${body.advancePaymentMethod ? ` Mode : ${body.advancePaymentMethod}.` : ''}${body.paymentNotes ? ` Note : ${body.paymentNotes}` : ''}`,
            actorName: admin?.name || actorNameOverride || 'Admin NAY',
            actorRole: admin?.role || 'STAFF',
            metadata: JSON.stringify({
              paidAmount: parsedPaidAmount,
              remaining,
              advancePaymentMethod: body.advancePaymentMethod,
            }),
          },
        }).catch((err) => console.error('Error logging payment timeline:', err));
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(customerName && { customerName }),
        ...(city && { shippingCity: city }),
        ...(total !== undefined && { total: Number(total) }),
        ...(parsedPaidAmount !== undefined && { paidAmount: parsedPaidAmount }),
        ...(computedPaymentStatus && { paymentStatus: computedPaymentStatus }),
        ...(body.advancePaymentMethod !== undefined && { advancePaymentMethod: body.advancePaymentMethod }),
        ...(body.paymentNotes !== undefined && { paymentNotes: body.paymentNotes }),
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

export async function DELETE(request: Request) {
  try {
    const { user: admin, errorResponse } = await requirePermission(request, 'orders.delete');
    if (errorResponse || !admin) return errorResponse!;

    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const id = body.id || searchParams.get('id');
    const ids: string[] = body.ids || (id ? [id] : []);
    const deleteTestOnly = body.deleteTestOnly || searchParams.get('deleteTestOnly') === 'true';

    let targetIds: string[] = [];

    if (deleteTestOnly) {
      // Find all test/fake orders in the DB
      const allOrders = await prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          shippingAddress: true,
          status: true,
        },
      });

      const testOrders = allOrders.filter((order) => {
        const name = (order.customerName || '').toLowerCase();
        const email = (order.customerEmail || '').toLowerCase();
        const num = (order.orderNumber || '').toUpperCase();
        const phone = (order.customerPhone || '').replace(/\D/g, '');
        const addr = (order.shippingAddress || '').toLowerCase();

        return (
          name.includes('test') ||
          name.includes('fake') ||
          name.includes('essai') ||
          name.includes('demo') ||
          email.includes('test') ||
          email.includes('fake') ||
          email.includes('example.com') ||
          num.includes('TEST') ||
          phone === '0000000000' ||
          phone === '0600000000' ||
          phone === '123456789' ||
          addr.includes('test address') ||
          addr.includes('adresse test') ||
          order.status === 'test'
        );
      });

      targetIds = testOrders.map((o) => o.id);
    } else {
      targetIds = ids;
    }

    if (!targetIds || targetIds.length === 0) {
      return NextResponse.json({ error: 'Aucune commande à supprimer trouvée.' }, { status: 400 });
    }

    // Perform transaction delete
    await prisma.$transaction(async (tx) => {
      // Delete timeline events
      await tx.orderTimelineEvent.deleteMany({
        where: { orderId: { in: targetIds } },
      });
      // Delete claim refunds associated with these orders
      await tx.claimRefund.deleteMany({
        where: { orderId: { in: targetIds } },
      });
      // Delete claims associated
      await tx.claimTicket.deleteMany({
        where: { orderId: { in: targetIds } },
      });
      // Delete the orders
      await tx.order.deleteMany({
        where: { id: { in: targetIds } },
      });
    });

    // Notify audit
    createAdminNotification({
      type: 'ORDER',
      title: 'Suppression de commandes 🗑️',
      message: `${targetIds.length} commande(s) ${deleteTestOnly ? 'test / factice(s)' : ''} ont été définitivement supprimées par ${admin?.name || 'Admin'}.`,
      link: '/admin/orders',
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      deletedCount: targetIds.length,
      deletedIds: targetIds,
    });
  } catch (error) {
    console.error('Error deleting order(s):', error);
    return NextResponse.json({ error: 'Échec de la suppression des commandes' }, { status: 500 });
  }
}
