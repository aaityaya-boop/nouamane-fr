import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'finance.view_revenue')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const payout = await prisma.carrierPayout.findUnique({
      where: { id },
      include: {
        carrier: true,
        allocations: {
          include: {
            order: true,
          },
        },
        adjustments: true,
      },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Versement introuvable.' }, { status: 404 });
    }

    return NextResponse.json(payout);
  } catch (error) {
    console.error('Error fetching payout details:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération du versement.' }, { status: 500 });
  }
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
    const { status, reference, amount, receivedAt, paymentMethod, receiptUrl, notes, allocations } = body;

    const existingPayout = await prisma.carrierPayout.findUnique({
      where: { id },
      include: { carrier: true },
    });

    if (!existingPayout) {
      return NextResponse.json({ error: 'Versement introuvable.' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If allocations are provided, replace them
      if (Array.isArray(allocations)) {
        const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (Number(a.allocatedAmount) || 0), 0);
        const payoutAmount = amount !== undefined ? Number(amount) : existingPayout.amount;

        if (totalAllocated > payoutAmount) {
          throw new Error(`Le montant total affecté (${totalAllocated} MAD) dépasse le montant du versement (${payoutAmount} MAD).`);
        }

        // Delete old allocations and create new ones
        await tx.carrierPayoutAllocation.deleteMany({ where: { payoutId: id } });

        for (const alloc of allocations) {
          const allocAmount = Number(alloc.allocatedAmount);
          if (allocAmount > 0) {
            await tx.carrierPayoutAllocation.create({
              data: {
                payoutId: id,
                orderId: alloc.orderId,
                allocatedAmount: allocAmount,
                carrierFeeDeducted: Number(alloc.carrierFeeDeducted) || 0,
                notes: alloc.notes || null,
              },
            });
          }
        }
      }

      const payout = await tx.carrierPayout.update({
        where: { id },
        data: {
          status: status !== undefined ? status : undefined,
          reference: reference !== undefined ? reference.trim() : undefined,
          amount: amount !== undefined ? Number(amount) : undefined,
          receivedAt: receivedAt !== undefined ? new Date(receivedAt) : undefined,
          paymentMethod: paymentMethod !== undefined ? paymentMethod : undefined,
          receiptUrl: receiptUrl !== undefined ? receiptUrl : undefined,
          notes: notes !== undefined ? notes : undefined,
          confirmedById: status === 'CONFIRMED' ? admin.id : existingPayout.confirmedById,
          confirmedByName: status === 'CONFIRMED' ? admin.name : existingPayout.confirmedByName,
        },
      });

      await tx.encaissementAuditLog.create({
        data: {
          action: status && status !== existingPayout.status ? `SET_PAYOUT_${status}` : 'UPDATE_PAYOUT',
          entityType: 'PAYOUT',
          entityId: payout.id,
          userId: admin.id,
          userName: admin.name,
          details: `Versement "${payout.reference}" mis à jour (Montant: ${payout.amount} MAD, Statut: ${payout.status}).`,
          oldValue: JSON.stringify({ amount: existingPayout.amount, status: existingPayout.status }),
          newValue: JSON.stringify({ amount: payout.amount, status: payout.status }),
        },
      });

      return payout;
    });

    return NextResponse.json({
      success: true,
      payout: updated,
      message: 'Versement mis à jour avec succès.',
    });
  } catch (error: any) {
    console.error('Error updating payout:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour du versement.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'finance.manage_encaissements')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const existingPayout = await prisma.carrierPayout.findUnique({
      where: { id },
    });

    if (!existingPayout) {
      return NextResponse.json({ error: 'Versement introuvable.' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.carrierPayoutAllocation.deleteMany({ where: { payoutId: id } });
      await tx.carrierAdjustment.deleteMany({ where: { payoutId: id } });
      await tx.carrierPayout.delete({ where: { id } });

      await tx.encaissementAuditLog.create({
        data: {
          action: 'DELETE_PAYOUT',
          entityType: 'PAYOUT',
          entityId: id,
          userId: admin.id,
          userName: admin.name,
          details: `Versement "${existingPayout.reference}" (${existingPayout.amount} MAD) supprimé.`,
          oldValue: JSON.stringify(existingPayout),
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Versement supprimé avec succès.' });
  } catch (error) {
    console.error('Error deleting payout:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du versement.' }, { status: 500 });
  }
}
