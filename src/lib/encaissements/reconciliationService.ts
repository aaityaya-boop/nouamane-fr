import prisma from '@/lib/prisma';

export interface CalculatedOrderEncaissement {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingCity: string;
  orderStatus: string;
  createdAt: string;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  carrierId: string | null;
  carrierName: string;
  carrierCode: string | null;
  trackingNumber: string | null;
  grossAmount: number; // Montant TTC de la commande
  shippingFeeChargedToCustomer: number; // Frais facturés au client (ex: 35 DH)
  codExpectedAmount: number; // Montant attendu à la livraison
  codCollectedAmount: number | null; // Montant réellement encaissé par le livreur
  carrierFee: number | null; // Frais réels déduits par le transporteur
  adjustmentsTotal: number; // Total des ajustements/litiges (+ ou -)
  netDueToNay: number; // Montant net dû = codCollected - carrierFee + adjustments
  paidConfirmed: number; // Somme des versements confirmés affectés
  paidDraft: number; // Somme des versements brouillon affectés
  remainingBalance: number; // Solde restant dû = netDueToNay - paidConfirmed
  expectedPayoutDate: string | null;
  isOverdue: boolean;
  encaissementStatus: 'AWAITING_PAYOUT' | 'PARTIALLY_PAID' | 'SETTLED' | 'PENDING_DELIVERY' | 'DISCREPANCY' | 'INCOMPLETE_DATA' | 'CANCELLED_REFUSED';
  reconciliationNotes: string | null;
  allocations: Array<{
    id: string;
    payoutId: string;
    payoutReference: string;
    payoutDate: string;
    payoutStatus: string;
    allocatedAmount: number;
    carrierFeeDeducted: number;
  }>;
  adjustments: Array<{
    id: string;
    type: string;
    amount: number;
    reason: string;
    createdAt: string;
  }>;
}

/**
 * Ensures default Moroccan carriers exist in the database without creating fake data.
 */
export async function seedDefaultCarriersIfEmpty() {
  try {
    const count = await prisma.carrier.count();
    if (count === 0) {
      const defaultCarriers = [
        { name: 'Amana Express (Poste Maroc)', code: 'AMANA', defaultFee: 35, payoutTermsDays: 7, contactPhone: '080 200 60 60' },
        { name: 'Cathedis Express', code: 'CATHEDIS', defaultFee: 35, payoutTermsDays: 7, contactPhone: '05 22 00 00 00' },
        { name: 'Ozgur Transport', code: 'OZGUR', defaultFee: 35, payoutTermsDays: 7, contactPhone: '05 20 00 00 00' },
        { name: 'Livreur Interne NAY', code: 'INTERNAL', defaultFee: 0, payoutTermsDays: 1, contactPhone: '+212 663-380011' },
        { name: 'Autre Messagerie', code: 'OTHER', defaultFee: 35, payoutTermsDays: 7 },
      ];

      for (const c of defaultCarriers) {
        await prisma.carrier.upsert({
          where: { code: c.code },
          create: c,
          update: {},
        });
      }
    }
  } catch (error) {
    console.error('Error seeding carriers:', error);
  }
}

/**
 * Calculates the exact mathematical encaissement breakdown for an order.
 */
export function calculateOrderEncaissement(order: any): CalculatedOrderEncaissement {
  const isDelivered = ['delivered', 'completed', 'livre'].includes(order.status?.toLowerCase());
  const isCancelledOrRefused = ['returned', 'refused', 'cancelled', 'annule', 'refuse', 'retourne'].includes(order.status?.toLowerCase());

  // 1. Gross Order Amount
  const grossAmount = Number(order.total) || 0;
  const shippingFeeCharged = Number(order.shippingCost) || 0;

  // 2. COD expected at delivery
  const codExpectedAmount = isCancelledOrRefused ? 0 : grossAmount;

  // 3. COD collected by courier
  let codCollectedAmount: number | null = null;
  if (order.codCollectedAmount !== null && order.codCollectedAmount !== undefined) {
    codCollectedAmount = Number(order.codCollectedAmount);
  } else if (isDelivered) {
    // If order was marked delivered without custom override, full total was collected by courier
    codCollectedAmount = grossAmount;
  } else if (isCancelledOrRefused) {
    codCollectedAmount = 0;
  }

  // 4. Carrier fee deducted by courier
  let carrierFee: number | null = null;
  if (order.carrierFee !== null && order.carrierFee !== undefined) {
    carrierFee = Number(order.carrierFee);
  } else if (isDelivered || isCancelledOrRefused) {
    carrierFee = order.carrier?.defaultFee ?? 35;
  }

  // 5. Adjustments total
  const adjustments = order.adjustments || [];
  const adjustmentsTotal = adjustments.reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0);

  // 6. Net amount due from carrier to NAY
  let netDueToNay = 0;
  if (isCancelledOrRefused) {
    // For refused/returned, no cash is due to NAY, carrier may bill return fee
    netDueToNay = 0;
  } else if (codCollectedAmount !== null) {
    netDueToNay = Math.max(0, codCollectedAmount - (carrierFee || 0) + adjustmentsTotal);
  } else {
    netDueToNay = Math.max(0, codExpectedAmount - (carrierFee || 35) + adjustmentsTotal);
  }

  // 7. Payout allocations breakdown
  const allocations = order.payoutAllocations || [];
  let paidConfirmed = 0;
  let paidDraft = 0;

  const formattedAllocations = allocations.map((al: any) => {
    const isConfirmed = al.payout?.status === 'CONFIRMED';
    const amount = Number(al.allocatedAmount) || 0;
    if (isConfirmed) {
      paidConfirmed += amount;
    } else if (al.payout?.status === 'DRAFT') {
      paidDraft += amount;
    }

    return {
      id: al.id,
      payoutId: al.payoutId,
      payoutReference: al.payout?.reference || 'N/A',
      payoutDate: al.payout?.receivedAt ? new Date(al.payout.receivedAt).toISOString() : new Date().toISOString(),
      payoutStatus: al.payout?.status || 'CONFIRMED',
      allocatedAmount: amount,
      carrierFeeDeducted: Number(al.carrierFeeDeducted) || 0,
    };
  });

  // 8. Remaining Balance
  const remainingBalance = isCancelledOrRefused ? 0 : Math.round((netDueToNay - paidConfirmed) * 100) / 100;

  // 9. Due date calculation
  let expectedPayoutDate: string | null = null;
  let isOverdue = false;

  if (order.expectedPayoutDate) {
    expectedPayoutDate = new Date(order.expectedPayoutDate).toISOString();
    if (new Date(order.expectedPayoutDate) < new Date() && remainingBalance > 0 && isDelivered) {
      isOverdue = true;
    }
  } else if (order.deliveredAt || isDelivered) {
    const delDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt || order.createdAt);
    const terms = order.carrier?.payoutTermsDays ?? 7;
    const dueDate = new Date(delDate);
    dueDate.setDate(dueDate.getDate() + terms);
    expectedPayoutDate = dueDate.toISOString();
    if (dueDate < new Date() && remainingBalance > 0) {
      isOverdue = true;
    }
  }

  // 10. Reconciliation Status determination
  let encaissementStatus: CalculatedOrderEncaissement['encaissementStatus'] = 'PENDING_DELIVERY';

  if (isCancelledOrRefused) {
    encaissementStatus = 'CANCELLED_REFUSED';
  } else if (!isDelivered) {
    encaissementStatus = 'PENDING_DELIVERY';
  } else if (codCollectedAmount === null) {
    encaissementStatus = 'INCOMPLETE_DATA';
  } else if (codCollectedAmount < grossAmount && Math.abs(grossAmount - codCollectedAmount) > 1) {
    encaissementStatus = 'DISCREPANCY';
  } else if (remainingBalance <= 0 && paidConfirmed > 0) {
    encaissementStatus = 'SETTLED';
  } else if (paidConfirmed > 0 && remainingBalance > 0) {
    encaissementStatus = 'PARTIALLY_PAID';
  } else {
    encaissementStatus = 'AWAITING_PAYOUT';
  }

  const formattedAdjustments = adjustments.map((a: any) => ({
    id: a.id,
    type: a.type,
    amount: Number(a.amount) || 0,
    reason: a.reason,
    createdAt: new Date(a.createdAt).toISOString(),
  }));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    shippingCity: order.shippingCity,
    orderStatus: order.status,
    createdAt: new Date(order.createdAt).toISOString(),
    dispatchedAt: order.dispatchedAt ? new Date(order.dispatchedAt).toISOString() : null,
    deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : (isDelivered ? new Date(order.updatedAt).toISOString() : null),
    carrierId: order.carrierId || null,
    carrierName: order.carrier?.name || order.carrierName || 'Non assigné',
    carrierCode: order.carrier?.code || null,
    trackingNumber: order.trackingNumber || null,
    grossAmount,
    shippingFeeChargedToCustomer: shippingFeeCharged,
    codExpectedAmount,
    codCollectedAmount,
    carrierFee,
    adjustmentsTotal,
    netDueToNay,
    paidConfirmed,
    paidDraft,
    remainingBalance,
    expectedPayoutDate,
    isOverdue,
    encaissementStatus,
    reconciliationNotes: order.reconciliationNotes || null,
    allocations: formattedAllocations,
    adjustments: formattedAdjustments,
  };
}

/**
 * Parses and maps CSV lines from carrier statement files.
 * Supports comma and semicolon delimiters, French float strings ("150,50"), and UTF-8.
 */
export function parseCarrierCsv(csvContent: string): Array<Record<string, string>> {
  const lines = csvContent.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Detect delimiter (, or ;)
  const firstLine = lines[0];
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

  const parseCsvLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_]/g, ''));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < 2) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}
