import React from 'react';
import prisma from '@/lib/prisma';
import SuppliersClient, { SupplierItem, PurchaseOrderItem } from './SuppliersClient';
import { syncAllPurchaseOrdersExpenses } from '@/lib/syncSupplierExpenses';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSuppliersPage() {
  let suppliers: SupplierItem[] = [];
  let purchaseOrders: PurchaseOrderItem[] = [];
  let dbProducts: any[] = [];

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
      />
    </div>
  );
}
