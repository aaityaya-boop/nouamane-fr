import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'orders.edit')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      action, // 'REQUEST' | 'CONFIRM' | 'CANCEL'
      refundId,
      amount,
      reason,
      paymentMethod = 'VIREMENT_BANCAIRE',
      transactionReference,
      effectiveDate,
      receiptUrl,
      notes,
    } = body;

    const claim = await prisma.claimTicket.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Dossier SAV introuvable.' }, { status: 404 });
    }

    // 1. REQUEST REFUND (PENDING)
    if (action === 'REQUEST') {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: 'Veuillez saisir un montant de remboursement valide (> 0 MAD).' }, { status: 400 });
      }

      if (!reason?.trim()) {
        return NextResponse.json({ error: 'Veuillez préciser le motif du remboursement.' }, { status: 400 });
      }

      // Check max refundable
      const existingCompleted = await prisma.claimRefund.findMany({
        where: {
          orderId: claim.orderId,
          status: 'COMPLETED',
        },
      });
      const sumCompleted = existingCompleted.reduce((sum, r) => sum + r.amount, 0);
      const remainingLimit = Math.max(0, claim.order.total - sumCompleted);

      if (parsedAmount > remainingLimit + 0.01) {
        return NextResponse.json(
          { error: `Le montant (${parsedAmount} MAD) dépasse le solde remboursable de la commande (${remainingLimit} MAD).` },
          { status: 400 }
        );
      }

      const newRefund = await prisma.$transaction(async (tx) => {
        const refund = await tx.claimRefund.create({
          data: {
            claimId: id,
            orderId: claim.orderId,
            amount: parsedAmount,
            reason: reason.trim(),
            paymentMethod,
            transactionReference: transactionReference?.trim() || null,
            status: 'PENDING',
            receiptUrl: receiptUrl || null,
            notes: notes ? notes.trim() : null,
          },
        });

        await tx.claimEvent.create({
          data: {
            claimId: id,
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            type: 'REFUND_REQUESTED',
            title: `Remboursement demandé : ${parsedAmount} MAD`,
            description: `Motif : "${reason.trim()}" (Mode : ${paymentMethod}). En attente de confirmation/paiement effectif.`,
            metadata: JSON.stringify({ refundId: refund.id, amount: parsedAmount, paymentMethod }),
          },
        });

        return refund;
      });

      return NextResponse.json({ success: true, refund: newRefund, message: 'Demande de remboursement enregistrée.' });
    }

    // 2. CONFIRM REFUND (COMPLETED)
    if (action === 'CONFIRM') {
      if (!refundId) {
        return NextResponse.json({ error: 'ID du remboursement requis.' }, { status: 400 });
      }

      const existingRefund = await prisma.claimRefund.findUnique({ where: { id: refundId } });
      if (!existingRefund || existingRefund.claimId !== id) {
        return NextResponse.json({ error: 'Remboursement introuvable dans ce dossier.' }, { status: 404 });
      }

      if (existingRefund.status === 'COMPLETED') {
        return NextResponse.json({ error: 'Ce remboursement est déjà marqué comme effectué.' }, { status: 400 });
      }

      const refundAmount = amount !== undefined ? Number(amount) : existingRefund.amount;
      const refundReason = reason !== undefined ? reason.trim() : existingRefund.reason;
      const refMethod = paymentMethod !== undefined ? paymentMethod : existingRefund.paymentMethod;
      const refTx = transactionReference !== undefined ? transactionReference.trim() : existingRefund.transactionReference;

      // Check max refundable
      const otherCompleted = await prisma.claimRefund.findMany({
        where: {
          orderId: claim.orderId,
          status: 'COMPLETED',
          id: { not: refundId },
        },
      });
      const sumOtherCompleted = otherCompleted.reduce((sum, r) => sum + r.amount, 0);
      const remainingLimit = Math.max(0, claim.order.total - sumOtherCompleted);

      if (refundAmount > remainingLimit + 0.01) {
        return NextResponse.json(
          { error: `Le montant (${refundAmount} MAD) dépasse le plafond remboursable (${remainingLimit} MAD).` },
          { status: 400 }
        );
      }

      const confirmedRefund = await prisma.$transaction(async (tx) => {
        // Create matching entry in AdminExpense to integrate with Finance module
        const expense = await tx.adminExpense.create({
          data: {
            title: `Remboursement SAV #${claim.ticketNumber} - Commande #${claim.order.orderNumber}`,
            category: 'OTHER',
            amount: refundAmount,
            date: effectiveDate ? new Date(effectiveDate) : new Date(),
            description: `Remboursement client ${claim.customerName}. Motif: ${refundReason}. Réf tx: ${refTx || 'N/A'}`,
            receiptUrl: receiptUrl || existingRefund.receiptUrl || null,
            paymentMethod: refMethod === 'VIREMENT_BANCAIRE' ? 'BANK_TRANSFER' : refMethod === 'ESPECES' ? 'CASH' : 'OTHER',
            createdById: admin.id,
            creatorName: admin.name,
          },
        });

        const refund = await tx.claimRefund.update({
          where: { id: refundId },
          data: {
            amount: refundAmount,
            reason: refundReason,
            paymentMethod: refMethod,
            transactionReference: refTx || null,
            status: 'COMPLETED',
            effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
            receiptUrl: receiptUrl || existingRefund.receiptUrl || null,
            notes: notes !== undefined ? notes : existingRefund.notes,
            confirmedById: admin.id,
            confirmedByName: admin.name,
            confirmedAt: new Date(),
            expenseId: expense.id,
          },
        });

        await tx.claimEvent.create({
          data: {
            claimId: id,
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            type: 'REFUND_COMPLETED',
            title: `Remboursement exécuté : ${refundAmount} MAD`,
            description: `Confirmé par ${admin.name}. Mode: ${refMethod}, Réf: ${refTx || 'N/A'}. Enregistré en comptabilité (-${refundAmount} MAD).`,
            metadata: JSON.stringify({ refundId: refund.id, amount: refundAmount, expenseId: expense.id }),
          },
        });

        await tx.adminActivityLog.create({
          data: {
            userId: admin.id,
            userName: admin.name,
            userEmail: admin.email,
            action: 'CONFIRM_SAV_REFUND',
            entityType: 'ORDER',
            entityId: claim.orderId,
            description: `Confirmation remboursement SAV ${claim.ticketNumber} : ${refundAmount} MAD (${claim.customerName})`,
          },
        });

        return refund;
      });

      return NextResponse.json({
        success: true,
        refund: confirmedRefund,
        message: 'Remboursement confirmé et répercuté dans la comptabilité NAY.',
      });
    }

    // 3. CANCEL REFUND
    if (action === 'CANCEL') {
      if (!refundId) {
        return NextResponse.json({ error: 'ID du remboursement requis.' }, { status: 400 });
      }

      const existingRefund = await prisma.claimRefund.findUnique({ where: { id: refundId } });
      if (!existingRefund || existingRefund.claimId !== id) {
        return NextResponse.json({ error: 'Remboursement introuvable dans ce dossier.' }, { status: 404 });
      }

      const cancelled = await prisma.$transaction(async (tx) => {
        // If an expense was linked, delete it so finance is clean
        if (existingRefund.expenseId) {
          await tx.adminExpense.deleteMany({ where: { id: existingRefund.expenseId } });
        }

        const refund = await tx.claimRefund.update({
          where: { id: refundId },
          data: {
            status: 'CANCELLED',
            expenseId: null,
          },
        });

        await tx.claimEvent.create({
          data: {
            claimId: id,
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            type: 'STATUS_CHANGE',
            title: `Remboursement annulé : ${existingRefund.amount} MAD`,
            description: `Annulé par ${admin.name}.`,
          },
        });

        return refund;
      });

      return NextResponse.json({ success: true, refund: cancelled, message: 'Remboursement annulé.' });
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing SAV refund:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors du traitement du remboursement.' }, { status: 500 });
  }
}
