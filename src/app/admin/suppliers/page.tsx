import React from 'react';
import prisma from '@/lib/prisma';
import SuppliersClient, { SupplierItem, PurchaseOrderItem } from './SuppliersClient';
import { syncAllPurchaseOrdersExpenses } from '@/lib/syncSupplierExpenses';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import {
  parseBillMetadata,
  checkIsOverdue,
  getDaysRemaining,
  UnifiedBillItem,
} from '@/lib/billsHelper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSuppliersPage() {
  const currentAdmin = await getAuthenticatedAdmin();

  let suppliers: SupplierItem[] = [];
  let purchaseOrders: PurchaseOrderItem[] = [];
  let dbProducts: any[] = [];
  let initialBills: UnifiedBillItem[] = [];

  try {
    // Automatically keep expenses in sync with Finance & CA Net
    await syncAllPurchaseOrdersExpenses().catch(err => console.warn('Background expense sync error:', err));
    const rawSuppliers = await prisma.supplier.findMany({
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    suppliers = JSON.parse(JSON.stringify(rawSuppliers));

    const rawOrders = await prisma.supplierPurchaseOrder.findMany({
      include: {
        supplier: {
          select: {
            name: true,
            code: true,
            city: true,
            phone: true,
            email: true,
            taxId: true,
            address: true,
            bankName: true,
            bankRib: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    purchaseOrders = JSON.parse(JSON.stringify(rawOrders));

    // Also fetch employee-deposited bills
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

    for (const exp of rawExpenses) {
      const meta = parseBillMetadata(exp.description);
      const isPaid = meta?.status === 'PAID' || exp.description?.includes('[STATUS:PAID]');
      const status: 'PENDING' | 'PAID' | 'CANCELLED' = meta?.status || (isPaid ? 'PAID' : 'PENDING');
      const dueDateStr = meta?.dueDate || null;
      const isOverdue = checkIsOverdue(dueDateStr, status);
      const daysRemaining = getDaysRemaining(dueDateStr);

      initialBills.push({
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
      });
    }

    const rawProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        brandLabel: true,
        price: true,
        stock: true,
        images: true,
        subcategory: true,
        subcategoryLabel: true
      },
      orderBy: { stock: 'asc' }
    });

    dbProducts = JSON.parse(JSON.stringify(rawProducts));
  } catch (error) {
    console.error('Error loading suppliers from database:', error);
  }

  return (
    <div className="p-4 md:p-8 max-w-[1700px] mx-auto text-slate-900 animate-fadeIn">
      <SuppliersClient
        initialSuppliers={suppliers}
        initialPurchaseOrders={purchaseOrders}
        dbProducts={dbProducts}
        initialBills={initialBills}
        currentUser={currentAdmin ? {
          id: currentAdmin.id,
          name: currentAdmin.name,
          role: currentAdmin.role,
        } : undefined}
      />
    </div>
  );
}
