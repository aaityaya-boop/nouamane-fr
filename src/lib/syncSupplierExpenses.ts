import prisma from '@/lib/prisma';

export async function syncPurchaseOrderExpense(orderId: string) {
  try {
    const po = await prisma.supplierPurchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        supplier: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    if (!po) return null;

    const chargeAmount = Number(po.chargeAmountMAD) || Number(po.totalAmount) || 0;
    const supplierName = po.supplier?.name || 'Fournisseur';
    const refTag = `[BC_REF:${po.orderNumber}]`;

    // Find any existing AdminExpense record linked to this Purchase Order
    const existingExpense = await prisma.adminExpense.findFirst({
      where: {
        OR: [
          { description: { contains: refTag } },
          { title: { contains: po.orderNumber } }
        ]
      }
    });

    // Map payment method to standard AdminExpense payment method
    let mappedMethod = 'BANK_TRANSFER';
    if (po.paymentMethod === 'ESPECES') mappedMethod = 'CASH';
    else if (po.paymentMethod === 'CHEQUE') mappedMethod = 'CHECK';
    else if (po.paymentMethod === 'CARTE') mappedMethod = 'CREDIT_CARD';
    else if (po.paymentMethod === 'EFFET') mappedMethod = 'OTHER';

    const attachmentUrl = po.receiptUrl || po.invoiceUrl || null;
    const expenseDate = po.paidAt ? new Date(po.paidAt) : (po.createdAt ? new Date(po.createdAt) : new Date());

    if (chargeAmount > 0 && po.status !== 'CANCELLED') {
      const expenseData = {
        title: `Commande Fournisseur ${supplierName} (${po.orderNumber})`,
        category: 'SUPPLIES',
        amount: chargeAmount,
        date: expenseDate,
        description: `${refTag} Approvisionnement Stock • Fournisseur: ${supplierName} • N° Facture: ${po.invoiceNumber || 'N/A'} • Statut: ${po.status} • Règlement: ${po.paymentStatus}`,
        receiptUrl: attachmentUrl,
        paymentMethod: mappedMethod,
        recurring: 'ONE_TIME'
      };

      if (existingExpense) {
        return await prisma.adminExpense.update({
          where: { id: existingExpense.id },
          data: expenseData
        });
      } else {
        return await prisma.adminExpense.create({
          data: expenseData
        });
      }
    } else if (existingExpense) {
      // If charge is reset to 0 or order cancelled, delete the linked expense to keep finance figures accurate
      return await prisma.adminExpense.delete({
        where: { id: existingExpense.id }
      });
    }

    return null;
  } catch (error) {
    console.error(`[syncPurchaseOrderExpense] Error syncing PO ${orderId}:`, error);
    return null;
  }
}

export async function deletePurchaseOrderExpense(orderNumber: string) {
  try {
    const refTag = `[BC_REF:${orderNumber}]`;
    const existing = await prisma.adminExpense.findFirst({
      where: {
        OR: [
          { description: { contains: refTag } },
          { title: { contains: orderNumber } }
        ]
      }
    });

    if (existing) {
      await prisma.adminExpense.delete({
        where: { id: existing.id }
      });
    }
  } catch (error) {
    console.error(`[deletePurchaseOrderExpense] Error deleting expense for ${orderNumber}:`, error);
  }
}

export async function syncAllPurchaseOrdersExpenses() {
  try {
    const purchaseOrders = await prisma.supplierPurchaseOrder.findMany({
      select: { id: true }
    });

    let syncedCount = 0;
    for (const po of purchaseOrders) {
      const res = await syncPurchaseOrderExpense(po.id);
      if (res) syncedCount++;
    }

    return { total: purchaseOrders.length, synced: syncedCount };
  } catch (error) {
    console.error('[syncAllPurchaseOrdersExpenses] Bulk sync error:', error);
    return { total: 0, synced: 0, error };
  }
}
