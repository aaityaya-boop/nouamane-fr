import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';
import { parseCarrierCsv } from '@/lib/encaissements/reconciliationService';

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'finance.manage_encaissements')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      carrierId,
      csvContent,
      fileName = 'releve_transporteur.csv',
      mode = 'PREVIEW', // 'PREVIEW' or 'CONFIRM'
      payoutReference,
      paymentMethod = 'BANK_TRANSFER',
      matchedRowsToCommit = [], // Used when mode === 'CONFIRM'
    } = body;

    if (!carrierId) {
      return NextResponse.json({ error: 'Veuillez sélectionner un transporteur.' }, { status: 400 });
    }

    const carrier = await prisma.carrier.findUnique({ where: { id: carrierId } });
    if (!carrier) {
      return NextResponse.json({ error: 'Transporteur introuvable.' }, { status: 404 });
    }

    // --- MODE: PREVIEW ---
    if (mode === 'PREVIEW') {
      if (!csvContent || typeof csvContent !== 'string') {
        return NextResponse.json({ error: 'Contenu CSV manquant ou invalide.' }, { status: 400 });
      }

      const rawRows = parseCarrierCsv(csvContent);
      if (rawRows.length === 0) {
        return NextResponse.json({ error: 'Le fichier CSV ne contient aucune ligne valide ou exploitable.' }, { status: 400 });
      }

      // Fetch all orders with allocations
      const dbOrders = await prisma.order.findMany({
        include: {
          carrier: true,
          payoutAllocations: {
            include: { payout: true },
          },
        },
      });

      // Build quick lookup maps
      const orderByNumberMap = new Map<string, any>();
      const orderByTrackingMap = new Map<string, any>();

      dbOrders.forEach((o) => {
        if (o.orderNumber) {
          orderByNumberMap.set(o.orderNumber.trim().toUpperCase(), o);
        }
        if (o.trackingNumber) {
          orderByTrackingMap.set(o.trackingNumber.trim().toUpperCase(), o);
        }
      });

      const parsedResults: any[] = [];
      let matchedCount = 0;
      let discrepancyCount = 0;
      let unmatchedCount = 0;
      let alreadySettledCount = 0;
      let totalAmountParsed = 0;

      for (let idx = 0; idx < rawRows.length; idx++) {
        const row = rawRows[idx];

        // Flexible key search
        const getVal = (keys: string[]) => {
          for (const k of keys) {
            const foundKey = Object.keys(row).find((rk) => rk.includes(k));
            if (foundKey && row[foundKey]) return row[foundKey].trim();
          }
          return '';
        };

        const trackingRaw = getVal(['tracking', 'suivi', 'envoi', 'awb', 'code']);
        const orderNumRaw = getVal(['commande', 'order', 'cmd', 'ref', 'client']);
        const amountRaw = getVal(['montant', 'total', 'crbt', 'cod', 'encaiss', 'net', 'prix']);
        const feeRaw = getVal(['frais', 'port', 'commission', 'taxe', 'cout']);
        const dateRaw = getVal(['date', 'livraison', 'jour']);

        // Parse amount (support French "150,00" -> 150.00)
        const cleanAmountStr = amountRaw.replace(/\s/g, '').replace(',', '.');
        const amountParsed = parseFloat(cleanAmountStr) || 0;

        const cleanFeeStr = feeRaw.replace(/\s/g, '').replace(',', '.');
        const feeParsed = cleanFeeStr ? parseFloat(cleanFeeStr) || 0 : (carrier.defaultFee ?? 35);

        totalAmountParsed += amountParsed;

        // Try to match order
        let matchedOrder: any = null;
        let matchType = 'NONE';

        if (trackingRaw && orderByTrackingMap.has(trackingRaw.toUpperCase())) {
          matchedOrder = orderByTrackingMap.get(trackingRaw.toUpperCase());
          matchType = 'TRACKING_EXACT';
        } else if (orderNumRaw && orderByNumberMap.has(orderNumRaw.toUpperCase())) {
          matchedOrder = orderByNumberMap.get(orderNumRaw.toUpperCase());
          matchType = 'ORDER_NUMBER_EXACT';
        }

        if (matchedOrder) {
          const totalPaid = (matchedOrder.payoutAllocations || [])
            .filter((a: any) => a.payout?.status === 'CONFIRMED')
            .reduce((sum: number, a: any) => sum + (Number(a.allocatedAmount) || 0), 0);

          const expectedNet = Math.max(0, matchedOrder.total - feeParsed);
          const remainingDue = Math.max(0, expectedNet - totalPaid);

          let status = 'MATCHED';
          let discrepancyReason = '';

          if (remainingDue <= 0 && totalPaid > 0) {
            status = 'ALREADY_SETTLED';
            alreadySettledCount++;
          } else if (Math.abs(amountParsed - matchedOrder.total) > 2 && amountParsed > 0) {
            status = 'DISCREPANCY';
            discrepancyReason = `Écart constaté : montant relevé (${amountParsed} MAD) vs montant commande (${matchedOrder.total} MAD).`;
            discrepancyCount++;
          } else {
            matchedCount++;
          }

          parsedResults.push({
            rowIndex: idx + 1,
            rawRow: row,
            trackingNumber: trackingRaw || matchedOrder.trackingNumber || 'Non renseigné',
            orderNumber: matchedOrder.orderNumber,
            orderId: matchedOrder.id,
            customerName: matchedOrder.customerName,
            orderTotal: matchedOrder.total,
            statementAmount: amountParsed,
            carrierFee: feeParsed,
            netToPay: Math.max(0, (amountParsed || matchedOrder.total) - feeParsed),
            deliveryDate: dateRaw || null,
            status,
            matchType,
            discrepancyReason,
            remainingDue,
          });
        } else {
          unmatchedCount++;
          parsedResults.push({
            rowIndex: idx + 1,
            rawRow: row,
            trackingNumber: trackingRaw || 'Inconnu',
            orderNumber: orderNumRaw || 'Inconnu',
            orderId: null,
            customerName: 'Non trouvé dans NAY',
            orderTotal: 0,
            statementAmount: amountParsed,
            carrierFee: feeParsed,
            netToPay: Math.max(0, amountParsed - feeParsed),
            deliveryDate: dateRaw || null,
            status: 'UNMATCHED',
            matchType: 'NONE',
            discrepancyReason: 'Aucune commande trouvée avec cette référence ou ce numéro de suivi.',
            remainingDue: 0,
          });
        }
      }

      return NextResponse.json({
        success: true,
        summary: {
          totalRows: rawRows.length,
          matchedCount,
          discrepancyCount,
          alreadySettledCount,
          unmatchedCount,
          totalAmountParsed: Math.round(totalAmountParsed * 100) / 100,
        },
        rows: parsedResults,
      });
    }

    // --- MODE: CONFIRM & COMMIT ---
    if (mode === 'CONFIRM') {
      if (!payoutReference || !payoutReference.trim()) {
        return NextResponse.json({ error: 'Veuillez saisir une référence pour ce versement (ex: VIR-AMANA-2026-09).' }, { status: 400 });
      }

      if (!Array.isArray(matchedRowsToCommit) || matchedRowsToCommit.length === 0) {
        return NextResponse.json({ error: 'Aucune ligne valide sélectionnée pour enregistrement.' }, { status: 400 });
      }

      // Check reference uniqueness
      const existing = await prisma.carrierPayout.findUnique({
        where: { reference: payoutReference.trim() },
      });
      if (existing) {
        return NextResponse.json({ error: `La référence de versement "${payoutReference}" existe déjà.` }, { status: 409 });
      }

      const totalCommitAmount = matchedRowsToCommit.reduce((sum: number, r: any) => sum + (Number(r.netToPay) || 0), 0);

      // Execute atomic commit inside transaction
      const transactionResult = await prisma.$transaction(async (tx) => {
        // 1. Create Payout
        const payout = await tx.carrierPayout.create({
          data: {
            carrierId,
            reference: payoutReference.trim(),
            amount: totalCommitAmount,
            receivedAt: new Date(),
            paymentMethod,
            status: 'CONFIRMED',
            notes: `Rapprochement automatique importé depuis le relevé CSV "${fileName}" (${matchedRowsToCommit.length} lignes).`,
            createdById: admin.id,
            createdByName: admin.name,
            confirmedById: admin.id,
            confirmedByName: admin.name,
          },
        });

        // 2. Create Allocations & Update Orders
        for (const item of matchedRowsToCommit) {
          if (item.orderId && item.netToPay > 0) {
            await tx.carrierPayoutAllocation.create({
              data: {
                payoutId: payout.id,
                orderId: item.orderId,
                allocatedAmount: Number(item.netToPay),
                carrierFeeDeducted: Number(item.carrierFee) || 0,
                notes: `Rapprochement CSV relevé ${fileName}`,
              },
            });

            // Update order status to delivered if it wasn't
            await tx.order.update({
              where: { id: item.orderId },
              data: {
                carrierId,
                carrierName: carrier.name,
                trackingNumber: item.trackingNumber && item.trackingNumber !== 'Non renseigné' ? item.trackingNumber : undefined,
                status: 'delivered',
                deliveredAt: item.deliveryDate ? new Date(item.deliveryDate) : new Date(),
                codCollectedAmount: Number(item.statementAmount) || undefined,
                carrierFee: Number(item.carrierFee) || undefined,
                encaissementStatus: 'SETTLED',
              },
            });
          }
        }

        // 3. Record Statement Import summary
        const statementImport = await tx.carrierStatementImport.create({
          data: {
            carrierId,
            fileName,
            totalRows: matchedRowsToCommit.length,
            matchedRows: matchedRowsToCommit.length,
            discrepancyRows: 0,
            unmatchedRows: 0,
            totalAmount: totalCommitAmount,
            status: 'COMPLETED',
            summary: JSON.stringify({
              payoutId: payout.id,
              reference: payout.reference,
              rowsCount: matchedRowsToCommit.length,
            }),
            importedById: admin.id,
            importedByName: admin.name,
          },
        });

        // 4. Record Audit Log
        await tx.encaissementAuditLog.create({
          data: {
            action: 'IMPORT_CSV',
            entityType: 'IMPORT',
            entityId: statementImport.id,
            userId: admin.id,
            userName: admin.name,
            details: `Import CSV du relevé "${fileName}" pour ${carrier.name} validé : Versement "${payout.reference}" de ${totalCommitAmount.toLocaleString('fr-FR')} MAD créé couvrant ${matchedRowsToCommit.length} commandes.`,
            newValue: JSON.stringify({ payoutReference: payout.reference, totalAmount: totalCommitAmount }),
          },
        });

        return { payout, statementImport };
      });

      return NextResponse.json({
        success: true,
        result: transactionResult,
        message: `Rapprochement validé avec succès ! Versement "${payoutReference}" créé pour un montant total de ${totalCommitAmount.toLocaleString('fr-FR')} MAD.`,
      });
    }

    return NextResponse.json({ error: 'Mode non supporté.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error importing carrier CSV:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors du traitement du fichier CSV.' }, { status: 500 });
  }
}
