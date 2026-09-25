import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'finance.manage_encaissements')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      carrierId,
      carrierName,
      trackingNumber,
      dispatchedAt,
      deliveredAt,
      carrierFee,
      codCollectedAmount,
      expectedPayoutDate,
      reconciliationNotes,
    } = body;

    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: { carrier: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
    }

    let carrierObj: any = null;
    if (carrierId) {
      carrierObj = await prisma.carrier.findUnique({ where: { id: carrierId } });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          carrierId: carrierId !== undefined ? (carrierId || null) : undefined,
          carrierName: carrierObj?.name || carrierName || (carrierId === null ? null : undefined),
          trackingNumber: trackingNumber !== undefined ? (trackingNumber?.trim() || null) : undefined,
          dispatchedAt: dispatchedAt !== undefined ? (dispatchedAt ? new Date(dispatchedAt) : null) : undefined,
          deliveredAt: deliveredAt !== undefined ? (deliveredAt ? new Date(deliveredAt) : null) : undefined,
          carrierFee: carrierFee !== undefined ? (carrierFee === null ? null : Number(carrierFee)) : undefined,
          codCollectedAmount: codCollectedAmount !== undefined ? (codCollectedAmount === null ? null : Number(codCollectedAmount)) : undefined,
          expectedPayoutDate: expectedPayoutDate !== undefined ? (expectedPayoutDate ? new Date(expectedPayoutDate) : null) : undefined,
          reconciliationNotes: reconciliationNotes !== undefined ? (reconciliationNotes || null) : undefined,
        },
      });

      await tx.encaissementAuditLog.create({
        data: {
          action: 'UPDATE_ORDER_COD',
          entityType: 'ORDER',
          entityId: order.id,
          userId: admin.id,
          userName: admin.name,
          details: `Données d'encaissement de la commande #${order.orderNumber} mises à jour (Transporteur: ${order.carrierName || 'N/A'}, Tracking: ${order.trackingNumber || 'N/A'}, COD: ${order.codCollectedAmount ?? order.total} MAD, Frais: ${order.carrierFee ?? 'Standard'} MAD).`,
          oldValue: JSON.stringify({
            carrier: currentOrder.carrierName,
            tracking: currentOrder.trackingNumber,
            cod: currentOrder.codCollectedAmount,
            fee: currentOrder.carrierFee,
          }),
          newValue: JSON.stringify({
            carrier: order.carrierName,
            tracking: order.trackingNumber,
            cod: order.codCollectedAmount,
            fee: order.carrierFee,
          }),
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      order: updated,
      message: 'Données d\'encaissement enregistrées avec succès.',
    });
  } catch (error: any) {
    console.error('Error updating order encaissement:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour de la commande.' }, { status: 500 });
  }
}
