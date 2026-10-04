import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { syncPurchaseOrderExpense, deletePurchaseOrderExpense } from '@/lib/syncSupplierExpenses';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      supplierId, 
      items = [], 
      subtotalAmountMAD = 0,
      shippingCostMAD = 0,
      taxAmountMAD = 0,
      totalAmount = 0,
      chargeAmountMAD = 0,
      currency = 'MAD',
      invoiceNumber, 
      invoiceUrl,
      receiptUrl,
      carrierName,
      trackingNumber,
      deliveryExpectedAt, 
      paymentDueDate,
      paidAt,
      notes, 
      status = 'PENDING',
      paymentStatus = 'UNPAID',
      paymentMethod = 'VIREMENT',
      paidAmount = 0,
      qualityInspectionStatus = 'PENDING',
      qualityInspectionNotes
    } = data;

    if (!supplierId) {
      return NextResponse.json({ error: 'Fournisseur obligatoire' }, { status: 400 });
    }

    // Generate Order Number: BC-YYYY-XXX
    const year = new Date().getFullYear();
    const count = await prisma.supplierPurchaseOrder.count();
    const orderNumber = `BC-${year}-${String(count + 1).padStart(3, '0')}`;

    const finalCharge = Number(chargeAmountMAD) || Number(totalAmount) || 0;

    const purchaseOrder = await prisma.supplierPurchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        items: typeof items === 'string' ? items : JSON.stringify(items),
        subtotalAmountMAD: Number(subtotalAmountMAD) || 0,
        shippingCostMAD: Number(shippingCostMAD) || 0,
        taxAmountMAD: Number(taxAmountMAD) || 0,
        totalAmount: finalCharge,
        chargeAmountMAD: finalCharge,
        currency: currency || 'MAD',
        status,
        paymentStatus,
        paidAmount: Number(paidAmount) || 0,
        paymentMethod: paymentMethod || 'VIREMENT',
        paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
        paidAt: paidAt ? new Date(paidAt) : null,
        carrierName: carrierName || null,
        trackingNumber: trackingNumber || null,
        invoiceNumber: invoiceNumber || null,
        invoiceUrl: invoiceUrl || null,
        receiptUrl: receiptUrl || null,
        qualityInspectionStatus: qualityInspectionStatus || 'PENDING',
        qualityInspectionNotes: qualityInspectionNotes || null,
        deliveryExpectedAt: deliveryExpectedAt ? new Date(deliveryExpectedAt) : null,
        notes: notes || null
      },
      include: {
        supplier: {
          select: {
            name: true,
            code: true,
            city: true,
            phone: true,
            taxId: true,
            bankName: true,
            bankRib: true
          }
        }
      }
    });

    // Update supplier aggregate metrics if charge is defined
    if (finalCharge > 0) {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (supplier) {
        await prisma.supplier.update({
          where: { id: supplierId },
          data: {
            totalOrdersCount: supplier.totalOrdersCount + 1,
            totalSpendMAD: supplier.totalSpendMAD + finalCharge,
            lastOrderDate: new Date()
          }
        });
      }
    } else {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (supplier) {
        await prisma.supplier.update({
          where: { id: supplierId },
          data: {
            totalOrdersCount: supplier.totalOrdersCount + 1,
            lastOrderDate: new Date()
          }
        });
      }
    }

    // Synchronize directly with AdminExpense to reflect in Charges & CA Net
    try {
      await syncPurchaseOrderExpense(purchaseOrder.id);
    } catch (syncErr) {
      console.warn('Expense sync warning on PO create:', syncErr);
    }

    return NextResponse.json({ success: true, purchaseOrder });
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la création de la commande fournisseur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      id, 
      status, 
      paymentStatus, 
      paidAmount, 
      paymentMethod,
      paidAt,
      chargeAmountMAD,
      totalAmount,
      receivedAt, 
      receiptUrl,
      invoiceNumber,
      invoiceUrl,
      qualityInspectionStatus,
      qualityInspectionNotes,
      carrierName,
      trackingNumber,
      notes 
    } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (paidAmount !== undefined) updateData.paidAmount = Number(paidAmount);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null;
    if (chargeAmountMAD !== undefined) {
      updateData.chargeAmountMAD = Number(chargeAmountMAD);
      updateData.totalAmount = Number(chargeAmountMAD);
    }
    if (totalAmount !== undefined && chargeAmountMAD === undefined) {
      updateData.totalAmount = Number(totalAmount);
      updateData.chargeAmountMAD = Number(totalAmount);
    }
    if (receivedAt !== undefined) updateData.receivedAt = receivedAt ? new Date(receivedAt) : null;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber;
    if (invoiceUrl !== undefined) updateData.invoiceUrl = invoiceUrl;
    if (qualityInspectionStatus !== undefined) updateData.qualityInspectionStatus = qualityInspectionStatus;
    if (qualityInspectionNotes !== undefined) updateData.qualityInspectionNotes = qualityInspectionNotes;
    if (carrierName !== undefined) updateData.carrierName = carrierName;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.supplierPurchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: {
          select: {
            name: true,
            code: true,
            city: true,
            phone: true,
            taxId: true,
            bankName: true,
            bankRib: true
          }
        }
      }
    });

    // Synchronize directly with AdminExpense to reflect in Charges & CA Net
    try {
      await syncPurchaseOrderExpense(updated.id);
    } catch (syncErr) {
      console.warn('Expense sync warning on PO update:', syncErr);
    }

    return NextResponse.json({ success: true, purchaseOrder: updated });
  } catch (error: any) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const po = await prisma.supplierPurchaseOrder.findUnique({
      where: { id },
      select: { id: true, orderNumber: true, supplierId: true, chargeAmountMAD: true, totalAmount: true }
    });

    if (!po) {
      return NextResponse.json({ error: 'Bon de commande introuvable' }, { status: 404 });
    }

    // Delete linked expense in Finance
    await deletePurchaseOrderExpense(po.orderNumber);

    // Delete the purchase order
    await prisma.supplierPurchaseOrder.delete({
      where: { id }
    });

    // Recalculate supplier stats
    const remainingOrders = await prisma.supplierPurchaseOrder.findMany({
      where: { supplierId: po.supplierId }
    });
    const newSpend = remainingOrders.reduce((sum, o) => sum + (o.chargeAmountMAD || o.totalAmount || 0), 0);
    await prisma.supplier.update({
      where: { id: po.supplierId },
      data: {
        totalOrdersCount: remainingOrders.length,
        totalSpendMAD: newSpend
      }
    });

    return NextResponse.json({ success: true, message: 'Bon de commande supprimé avec succès' });
  } catch (error: any) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la suppression' }, { status: 500 });
  }
}
