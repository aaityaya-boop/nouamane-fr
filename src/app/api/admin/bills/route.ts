import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { logAdminActivity } from '@/lib/activityLogger';
import {
  parseBillMetadata,
  encodeBillDescription,
  checkIsOverdue,
  getDaysRemaining,
  UnifiedBillItem,
  BillMetadata,
} from '@/lib/billsHelper';
import { syncPurchaseOrderExpense } from '@/lib/syncSupplierExpenses';
import { createAdminNotification } from '@/lib/notificationService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/bills - Fetch all bills (employee deposits + purchase orders)
export async function GET(req: Request) {
  try {
    const currentAdmin = await getAuthenticatedAdmin(req);
    if (!currentAdmin) {
      return NextResponse.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, { status: 401 });
    }
    if (currentAdmin.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Compte inactif.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'ALL'; // ALL, PENDING, PAID, OVERDUE

    // 1. Fetch Employee-submitted bills from AdminExpense
    const expenses = await prisma.adminExpense.findMany({
      where: {
        OR: [
          { description: { contains: '[BILL_META:' } },
          { description: { contains: '[FACTURE_A_PAYER]' } },
          { title: { startsWith: 'Facture ' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    // 2. Fetch Supplier Purchase Orders
    const purchaseOrders = await prisma.supplierPurchaseOrder.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch active suppliers list for form suggestions
    const suppliers = await prisma.supplier.findMany({
      where: { status: { in: ['ACTIVE', 'VIP', 'PENDING'] } },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        phone: true,
        city: true,
      },
      orderBy: { name: 'asc' },
    });

    const unifiedBills: UnifiedBillItem[] = [];

    // Map Employee Bills
    for (const exp of expenses) {
      const meta = parseBillMetadata(exp.description);
      const isPaid = meta?.status === 'PAID' || exp.description?.includes('[STATUS:PAID]');
      const status: 'PENDING' | 'PAID' | 'CANCELLED' = meta?.status || (isPaid ? 'PAID' : 'PENDING');
      const dueDateStr = meta?.dueDate || null;
      const isOverdue = checkIsOverdue(dueDateStr, status);
      const daysRemaining = getDaysRemaining(dueDateStr);

      unifiedBills.push({
        id: exp.id,
        source: 'EMPLOYEE_BILL',
        title: exp.title,
        vendor: meta?.vendor || exp.title.replace('Facture ', '').split(' - ')[0] || 'Prestataire / Fournisseur',
        invoiceNumber: meta?.invoiceNumber || '',
        amountMAD: exp.amount,
        category: exp.category,
        dueDate: dueDateStr,
        invoiceDate: exp.date ? exp.date.toISOString().slice(0, 10) : null,
        status,
        isOverdue,
        daysRemaining,
        invoiceUrl: exp.receiptUrl || null,
        receiptUrl: meta?.paymentVoucherUrl || null,
        paymentMethod: meta?.paymentMethod || exp.paymentMethod || null,
        paidAt: meta?.paidAt || null,
        createdById: exp.createdById,
        creatorName: exp.creatorName || exp.creator?.name || 'Collaborateur',
        creatorRole: meta?.creatorRole || exp.creator?.role || 'Employé',
        createdAt: exp.createdAt.toISOString(),
        notes: meta?.notes || exp.description?.replace(/\[BILL_META:.*?\]/, '').trim() || null,
        rawExpense: exp,
      });
    }

    // Map Purchase Orders (as bills)
    for (const po of purchaseOrders) {
      const chargeAmount = Number(po.chargeAmountMAD) || Number(po.totalAmount) || 0;
      const status: 'PENDING' | 'PAID' | 'CANCELLED' =
        po.paymentStatus === 'PAID' ? 'PAID' : po.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING';
      const dueDateStr = po.paymentDueDate ? po.paymentDueDate.toISOString().slice(0, 10) : null;
      const isOverdue = checkIsOverdue(dueDateStr, status);
      const daysRemaining = getDaysRemaining(dueDateStr);

      unifiedBills.push({
        id: po.id,
        source: 'PURCHASE_ORDER',
        title: `Bon de Commande ${po.orderNumber} (${po.supplier?.name || 'Fournisseur'})`,
        vendor: po.supplier?.name || 'Fournisseur',
        invoiceNumber: po.invoiceNumber || po.orderNumber,
        amountMAD: chargeAmount,
        category: 'SUPPLIES',
        dueDate: dueDateStr,
        invoiceDate: po.createdAt ? po.createdAt.toISOString().slice(0, 10) : null,
        status,
        isOverdue,
        daysRemaining,
        invoiceUrl: po.invoiceUrl || null,
        receiptUrl: po.receiptUrl || null,
        paymentMethod: po.paymentMethod || null,
        paidAt: po.paidAt ? po.paidAt.toISOString() : null,
        createdById: null,
        creatorName: 'Direction Achats & Logistique',
        creatorRole: 'Achats NAY',
        createdAt: po.createdAt.toISOString(),
        notes: po.notes || null,
        rawPurchaseOrder: po,
      });
    }

    // Sort unified bills:
    // PENDING first (sorted by nearest due date), then PAID (sorted by latest paid date)
    unifiedBills.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      if (a.status === 'PENDING' && b.status === 'PENDING') {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Compute Metrics & KPIs
    let totalPendingMAD = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let dueSoonCount = 0;
    let paidThisMonthMAD = 0;
    let paidCount = 0;
    let employeeDepositCount = 0;

    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    for (const bill of unifiedBills) {
      if (bill.source === 'EMPLOYEE_BILL') {
        employeeDepositCount++;
      }

      if (bill.status === 'PENDING') {
        pendingCount++;
        totalPendingMAD += bill.amountMAD;
        if (bill.isOverdue) overdueCount++;
        if (bill.daysRemaining !== null && bill.daysRemaining >= 0 && bill.daysRemaining <= 7) {
          dueSoonCount++;
        }
      } else if (bill.status === 'PAID') {
        paidCount++;
        const paidDate = bill.paidAt ? new Date(bill.paidAt) : new Date(bill.createdAt);
        if (paidDate >= startOfCurrentMonth) {
          paidThisMonthMAD += bill.amountMAD;
        }
      }
    }

    // Apply Filter if requested
    let filteredBills = unifiedBills;
    if (statusFilter === 'PENDING') {
      filteredBills = unifiedBills.filter((b) => b.status === 'PENDING');
    } else if (statusFilter === 'PAID') {
      filteredBills = unifiedBills.filter((b) => b.status === 'PAID');
    } else if (statusFilter === 'OVERDUE') {
      filteredBills = unifiedBills.filter((b) => b.status === 'PENDING' && b.isOverdue);
    }

    return NextResponse.json({
      success: true,
      bills: filteredBills,
      allBillsCount: unifiedBills.length,
      suppliers,
      stats: {
        totalPendingMAD,
        pendingCount,
        overdueCount,
        dueSoonCount,
        paidThisMonthMAD,
        paidCount,
        employeeDepositCount,
      },
      currentUser: {
        id: currentAdmin.id,
        name: currentAdmin.name,
        role: currentAdmin.role,
      },
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des factures à payer' }, { status: 500 });
  }
}

// POST /api/admin/bills - Deposit a new bill to pay (Accessible to ALL employees)
export async function POST(req: Request) {
  try {
    const currentAdmin = await getAuthenticatedAdmin(req);
    if (!currentAdmin) {
      return NextResponse.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, { status: 401 });
    }
    if (currentAdmin.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Compte inactif.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      vendor,
      invoiceNumber = '',
      amount,
      dueDate,
      invoiceDate,
      category = 'SUPPLIES',
      invoiceUrl = '',
      notes = '',
    } = body;

    if (!vendor || typeof vendor !== 'string' || !vendor.trim()) {
      return NextResponse.json({ error: 'Le nom du fournisseur ou prestataire est requis.' }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Le montant de la facture doit être un nombre supérieur à 0 MAD.' }, { status: 400 });
    }

    const cleanVendor = vendor.trim();
    const cleanInvoiceNum = (invoiceNumber || '').trim();
    const cleanCategory = (category || 'SUPPLIES').toUpperCase();
    const cleanNotes = (notes || '').trim();

    // Prepare metadata
    const metadata: BillMetadata = {
      type: 'EMPLOYEE_BILL',
      status: 'PENDING',
      vendor: cleanVendor,
      invoiceNumber: cleanInvoiceNum || undefined,
      dueDate: dueDate || undefined,
      notes: cleanNotes || undefined,
      creatorRole: currentAdmin.role,
    };

    const title = `Facture ${cleanVendor}${cleanInvoiceNum ? ` (${cleanInvoiceNum})` : ''}`;
    const description = encodeBillDescription(metadata, cleanNotes);

    const expenseDate = invoiceDate ? new Date(invoiceDate) : new Date();

    const createdExpense = await prisma.adminExpense.create({
      data: {
        title,
        category: cleanCategory,
        amount: parsedAmount,
        date: expenseDate,
        description,
        receiptUrl: invoiceUrl || null,
        paymentMethod: 'BANK_TRANSFER',
        recurring: 'ONE_TIME',
        createdById: currentAdmin.id,
        creatorName: currentAdmin.name,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    // Log Activity
    await logAdminActivity({
      req,
      userId: currentAdmin.id,
      userName: currentAdmin.name,
      userEmail: currentAdmin.email,
      action: 'ADD_EXPENSE',
      entityType: 'ORDER',
      entityId: createdExpense.id,
      description: `Dépôt d'une facture à payer : "${title}" (${parsedAmount} MAD, Échéance: ${dueDate || 'N/A'}) par ${currentAdmin.name} (${currentAdmin.role})`,
      newValue: {
        title,
        amount: parsedAmount,
        vendor: cleanVendor,
        invoiceNumber: cleanInvoiceNum,
        dueDate,
        invoiceUrl,
      },
    });

    createAdminNotification({
      type: 'FINANCE',
      title: 'Facture à valider 💳',
      message: `${cleanVendor || title} : ${parsedAmount} DH déposé par ${currentAdmin.name}`,
      link: '/admin/bills',
      metadata: { billId: createdExpense.id, amount: parsedAmount, vendor: cleanVendor },
    }).catch(() => {});

    const isOverdue = checkIsOverdue(dueDate, 'PENDING');
    const daysRemaining = getDaysRemaining(dueDate);

    const responseBill: UnifiedBillItem = {
      id: createdExpense.id,
      source: 'EMPLOYEE_BILL',
      title: createdExpense.title,
      vendor: cleanVendor,
      invoiceNumber: cleanInvoiceNum,
      amountMAD: createdExpense.amount,
      category: createdExpense.category,
      dueDate: dueDate || null,
      invoiceDate: invoiceDate || null,
      status: 'PENDING',
      isOverdue,
      daysRemaining,
      invoiceUrl: createdExpense.receiptUrl,
      receiptUrl: null,
      paymentMethod: createdExpense.paymentMethod,
      paidAt: null,
      createdById: currentAdmin.id,
      creatorName: currentAdmin.name,
      creatorRole: currentAdmin.role,
      createdAt: createdExpense.createdAt.toISOString(),
      notes: cleanNotes || null,
      rawExpense: createdExpense,
    };

    return NextResponse.json({
      success: true,
      message: 'Facture déposée avec succès dans l’échéancier des règlements !',
      bill: responseBill,
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ error: 'Erreur lors du dépôt de la facture' }, { status: 500 });
  }
}

// PATCH /api/admin/bills - Mark bill as paid or update details
export async function PATCH(req: Request) {
  try {
    const currentAdmin = await getAuthenticatedAdmin(req);
    if (!currentAdmin) {
      return NextResponse.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, { status: 401 });
    }
    if (currentAdmin.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Compte inactif.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, source, action = 'MARK_PAID', paymentMethod = 'VIREMENT', paidAt, paymentVoucherUrl = '', notes = '' } = body;

    if (!id || !source) {
      return NextResponse.json({ error: 'Identifiant et source de la facture requis' }, { status: 400 });
    }

    const effectivePaidAt = paidAt ? new Date(paidAt) : new Date();

    if (source === 'EMPLOYEE_BILL') {
      const expense = await prisma.adminExpense.findUnique({ where: { id } });
      if (!expense) {
        return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
      }

      if (action === 'MARK_PAID') {
        const currentMeta = parseBillMetadata(expense.description) || {
          type: 'EMPLOYEE_BILL',
          status: 'PENDING',
          vendor: expense.title,
        };

        const updatedMeta: BillMetadata = {
          ...currentMeta,
          status: 'PAID',
          paidAt: effectivePaidAt.toISOString(),
          paidBy: currentAdmin.name,
          paymentMethod,
          paymentVoucherUrl: paymentVoucherUrl || currentMeta.paymentVoucherUrl || undefined,
        };

        const updatedDescription = encodeBillDescription(updatedMeta, notes || currentMeta.notes);

        // Map paymentMethod to AdminExpense standard
        let mappedMethod = 'BANK_TRANSFER';
        if (paymentMethod === 'ESPECES') mappedMethod = 'CASH';
        else if (paymentMethod === 'CHEQUE') mappedMethod = 'CHECK';
        else if (paymentMethod === 'CARTE') mappedMethod = 'CREDIT_CARD';
        else if (paymentMethod === 'VIREMENT') mappedMethod = 'BANK_TRANSFER';

        const updated = await prisma.adminExpense.update({
          where: { id },
          data: {
            description: updatedDescription,
            paymentMethod: mappedMethod,
            receiptUrl: paymentVoucherUrl || expense.receiptUrl, // Update or keep original invoice
          },
        });

        // Log Activity
        await logAdminActivity({
          req,
          userId: currentAdmin.id,
          userName: currentAdmin.name,
          userEmail: currentAdmin.email,
          action: 'UPDATE_EXPENSE',
          entityType: 'ORDER',
          entityId: id,
          description: `Règlement validé pour la facture "${expense.title}" (-${expense.amount} MAD, Mode: ${paymentMethod}) par ${currentAdmin.name}`,
        });

        return NextResponse.json({
          success: true,
          message: 'Facture marquée comme réglée avec succès.',
          bill: updated,
        });
      }
    } else if (source === 'PURCHASE_ORDER') {
      const po = await prisma.supplierPurchaseOrder.findUnique({ where: { id } });
      if (!po) {
        return NextResponse.json({ error: 'Bon de commande introuvable' }, { status: 404 });
      }

      if (action === 'MARK_PAID') {
        const chargeAmount = Number(po.chargeAmountMAD) || Number(po.totalAmount) || 0;

        const updatedPo = await prisma.supplierPurchaseOrder.update({
          where: { id },
          data: {
            paymentStatus: 'PAID',
            paidAmount: chargeAmount,
            paidAt: effectivePaidAt,
            paymentMethod,
            receiptUrl: paymentVoucherUrl || po.receiptUrl,
          },
        });

        // Auto-sync with Finance & CA Net
        await syncPurchaseOrderExpense(id).catch((e) => console.warn('Sync PO expense error:', e));

        // Log Activity
        await logAdminActivity({
          req,
          userId: currentAdmin.id,
          userName: currentAdmin.name,
          userEmail: currentAdmin.email,
          action: 'UPDATE_ORDER',
          entityType: 'ORDER',
          entityId: id,
          description: `Règlement validé pour le bon de commande "${po.orderNumber}" (-${chargeAmount} MAD) par ${currentAdmin.name}`,
        });

        return NextResponse.json({
          success: true,
          message: 'Bon de commande marqué comme réglé avec succès.',
          order: updatedPo,
        });
      }
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la facture' }, { status: 500 });
  }
}

// DELETE /api/admin/bills - Cancel or delete a bill
export async function DELETE(req: Request) {
  try {
    const currentAdmin = await getAuthenticatedAdmin(req);
    if (!currentAdmin) {
      return NextResponse.json({ error: 'Session expirée. Veuillez vous reconnecter.' }, { status: 401 });
    }
    if (currentAdmin.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Compte inactif.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const source = searchParams.get('source') || 'EMPLOYEE_BILL';

    if (!id) {
      return NextResponse.json({ error: 'Identifiant requis' }, { status: 400 });
    }

    if (source === 'EMPLOYEE_BILL') {
      const expense = await prisma.adminExpense.findUnique({ where: { id } });
      if (!expense) {
        return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
      }

      await prisma.adminExpense.delete({ where: { id } });

      await logAdminActivity({
        req,
        userId: currentAdmin.id,
        userName: currentAdmin.name,
        userEmail: currentAdmin.email,
        action: 'DELETE_EXPENSE',
        entityType: 'ORDER',
        entityId: id,
        description: `Suppression de la facture à payer "${expense.title}" (-${expense.amount} MAD) par ${currentAdmin.name}`,
      });

      return NextResponse.json({ success: true, message: 'Facture supprimée avec succès.' });
    }

    return NextResponse.json({ error: 'Seules les factures déposées peuvent être supprimées depuis cet écran.' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de la facture' }, { status: 500 });
  }
}
