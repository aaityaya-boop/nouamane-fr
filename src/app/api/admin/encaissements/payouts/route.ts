import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'finance.manage_encaissements')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      carrierId,
      reference,
      receivedAt,
      amount,
      paymentMethod = 'BANK_TRANSFER',
      status = 'CONFIRMED',
      receiptUrl,
      notes,
      allocations = [], // [{ orderId, allocatedAmount, carrierFeeDeducted }]
    } = body;

    if (!carrierId || !reference || amount === undefined || amount <= 0) {
      return NextResponse.json(
        { error: 'Veuillez renseigner le transporteur, une référence unique et un montant valide.' },
        { status: 400 }
      );
    }

    // Verify carrier exists
    const carrier = await prisma.carrier.findUnique({ where: { id: carrierId } });
    if (!carrier) {
      return NextResponse.json({ error: 'Transporteur introuvable.' }, { status: 404 });
    }

    // Verify reference uniqueness
    const existingRef = await prisma.carrierPayout.findUnique({ where: { reference: reference.trim() } });
    if (existingRef) {
      return NextResponse.json(
        { error: `Un versement avec la référence "${reference}" existe déjà.` },
        { status: 409 }
      );
    }

    // Validate allocations sum
    const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (Number(a.allocatedAmount) || 0), 0);
    if (totalAllocated > Number(amount)) {
      return NextResponse.json(
        { error: `Le montant total affecté (${totalAllocated.toLocaleString('fr-FR')} MAD) dépasse le montant du versement (${Number(amount).toLocaleString('fr-FR')} MAD).` },
        { status: 400 }
      );
    }

    // Execute atomic creation inside Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.carrierPayout.create({
        data: {
          carrierId,
          reference: reference.trim(),
          receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
          amount: Number(amount),
          paymentMethod,
          status,
          receiptUrl: receiptUrl || null,
          notes: notes || null,
          createdById: admin.id,
          createdByName: admin.name,
          confirmedById: status === 'CONFIRMED' ? admin.id : null,
          confirmedByName: status === 'CONFIRMED' ? admin.name : null,
        },
      });

      // Create allocations if provided
      if (allocations.length > 0) {
        for (const alloc of allocations) {
          const allocAmount = Number(alloc.allocatedAmount);
          if (allocAmount > 0) {
            await tx.carrierPayoutAllocation.create({
              data: {
                payoutId: payout.id,
                orderId: alloc.orderId,
                allocatedAmount: allocAmount,
                carrierFeeDeducted: Number(alloc.carrierFeeDeducted) || 0,
                notes: alloc.notes || null,
              },
            });

            // Update order carrier if not already set
            await tx.order.update({
              where: { id: alloc.orderId },
              data: {
                carrierId: carrierId,
                carrierName: carrier.name,
              },
            });
          }
        }
      }

      // Record audit log
      await tx.encaissementAuditLog.create({
        data: {
          action: status === 'CONFIRMED' ? 'CONFIRM_PAYOUT' : 'CREATE_PAYOUT',
          entityType: 'PAYOUT',
          entityId: payout.id,
          userId: admin.id,
          userName: admin.name,
          details: `Versement de ${Number(amount).toLocaleString('fr-FR')} MAD (${carrier.name}, Réf: ${payout.reference}) enregistré avec ${allocations.length} commande(s) affectée(s).`,
          newValue: JSON.stringify({ amount, carrier: carrier.name, status, allocationsCount: allocations.length }),
        },
      });

      return payout;
    });

    return NextResponse.json({
      success: true,
      payout: result,
      message: 'Versement enregistré avec succès.',
    });
  } catch (error: any) {
    console.error('Error creating carrier payout:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'enregistrement du versement.' },
      { status: 500 }
    );
  }
}
