import React from 'react';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';
import { seedDefaultCarriersIfEmpty, calculateOrderEncaissement } from '@/lib/encaissements/reconciliationService';
import EncaissementsClient from './EncaissementsClient';

export const dynamic = 'force-dynamic';

export default async function EncaissementsPage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin || !hasPermission(admin, 'finance.view_revenue')) {
    redirect('/admin');
  }

  // Ensure default carriers exist
  await seedDefaultCarriersIfEmpty();

  // Fetch carriers
  const carriers = await prisma.carrier.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });

  // Fetch all orders with relations
  const orders = await prisma.order.findMany({
    include: {
      carrier: true,
      payoutAllocations: {
        include: {
          payout: true,
        },
      },
      adjustments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch payouts with allocations
  const payouts = await prisma.carrierPayout.findMany({
    include: {
      carrier: true,
      allocations: {
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              total: true,
              status: true,
            },
          },
        },
      },
      adjustments: true,
    },
    orderBy: { receivedAt: 'desc' },
  });

  // Calculate encaissement breakdown for all orders
  const calculatedOrders = orders.map((o) => calculateOrderEncaissement(o));

  // Serialize dates for client
  const serializedPayouts = payouts.map((p) => ({
    ...p,
    receivedAt: p.receivedAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    allocations: p.allocations.map((al) => ({
      ...al,
      createdAt: al.createdAt.toISOString(),
      updatedAt: al.updatedAt.toISOString(),
    })),
    adjustments: p.adjustments.map((ad) => ({
      ...ad,
      createdAt: ad.createdAt.toISOString(),
    })),
  }));

  const serializedCarriers = carriers.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  // Fetch audit logs
  const auditLogs = await prisma.encaissementAuditLog.findMany({
    take: 30,
    orderBy: { createdAt: 'desc' },
  });

  const serializedAuditLogs = auditLogs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <div className="p-3 sm:p-6 max-w-[1650px] mx-auto text-neutral-900 space-y-6">
      <EncaissementsClient
        initialOrders={calculatedOrders}
        initialPayouts={serializedPayouts as any}
        initialCarriers={serializedCarriers as any}
        initialAuditLogs={serializedAuditLogs as any}
        currentUser={{
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        }}
      />
    </div>
  );
}
