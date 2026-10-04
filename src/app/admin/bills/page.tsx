import React from 'react';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { redirect } from 'next/navigation';
import BillsClient from './BillsClient';
import {
  parseBillMetadata,
  checkIsOverdue,
  getDaysRemaining,
  UnifiedBillItem,
} from '@/lib/billsHelper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminBillsPage() {
  const currentAdmin = await getAuthenticatedAdmin();
  if (!currentAdmin) {
    redirect('/admin/login');
  }

  let bills: UnifiedBillItem[] = [];
  let suppliers: any[] = [];
  let stats = {
    totalPendingMAD: 0,
    pendingCount: 0,
    overdueCount: 0,
    dueSoonCount: 0,
    paidThisMonthMAD: 0,
    paidCount: 0,
    employeeDepositCount: 0,
  };

  try {
    // 1. Fetch employee bills
    const rawExpenses = await prisma.adminExpense.findMany({
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

    // 2. Fetch purchase orders
    const rawOrders = await prisma.supplierPurchaseOrder.findMany({
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

    // 3. Fetch suppliers
    const rawSuppliers = await prisma.supplier.findMany({
      where: { status: { in: ['ACTIVE', 'VIP', 'PENDING'] } },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
      },
      orderBy: { name: 'asc' },
    });
    suppliers = JSON.parse(JSON.stringify(rawSuppliers));

    // Map employee bills
    for (const exp of rawExpenses) {
      const meta = parseBillMetadata(exp.description);
      const isPaid = meta?.status === 'PAID' || exp.description?.includes('[STATUS:PAID]');
      const status: 'PENDING' | 'PAID' | 'CANCELLED' = meta?.status || (isPaid ? 'PAID' : 'PENDING');
      const dueDateStr = meta?.dueDate || null;
      const isOverdue = checkIsOverdue(dueDateStr, status);
      const daysRemaining = getDaysRemaining(dueDateStr);

      bills.push({
        id: exp.id,
        source: 'EMPLOYEE_BILL',
        title: exp.title,
        vendor: meta?.vendor || exp.title.replace('Facture ', '').split(' - ')[0] || 'Fournisseur / Prestataire',
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
      });
    }

    // Map purchase orders
    for (const po of rawOrders) {
      const chargeAmount = Number(po.chargeAmountMAD) || Number(po.totalAmount) || 0;
      const status: 'PENDING' | 'PAID' | 'CANCELLED' =
        po.paymentStatus === 'PAID' ? 'PAID' : po.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING';
      const dueDateStr = po.paymentDueDate ? po.paymentDueDate.toISOString().slice(0, 10) : null;
      const isOverdue = checkIsOverdue(dueDateStr, status);
      const daysRemaining = getDaysRemaining(dueDateStr);

      bills.push({
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
      });
    }

    // Sort bills: PENDING first, then by date
    bills.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      if (a.status === 'PENDING' && b.status === 'PENDING') {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Compute stats
    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    for (const b of bills) {
      if (b.source === 'EMPLOYEE_BILL') {
        stats.employeeDepositCount++;
      }

      if (b.status === 'PENDING') {
        stats.pendingCount++;
        stats.totalPendingMAD += b.amountMAD;
        if (b.isOverdue) stats.overdueCount++;
        if (b.daysRemaining !== null && b.daysRemaining >= 0 && b.daysRemaining <= 7) {
          stats.dueSoonCount++;
        }
      } else if (b.status === 'PAID') {
        stats.paidCount++;
        const paidDate = b.paidAt ? new Date(b.paidAt) : new Date(b.createdAt);
        if (paidDate >= startOfCurrentMonth) {
          stats.paidThisMonthMAD += b.amountMAD;
        }
      }
    }
  } catch (error) {
    console.error('Error loading bills in AdminBillsPage:', error);
  }

  return (
    <div className="p-4 md:p-8 max-w-[1700px] mx-auto text-slate-900 animate-fadeIn">
      <BillsClient
        initialBills={bills}
        initialSuppliers={suppliers}
        initialStats={stats}
        currentUser={{
          id: currentAdmin.id,
          name: currentAdmin.name,
          role: currentAdmin.role,
        }}
      />
    </div>
  );
}
