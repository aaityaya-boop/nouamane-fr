import React from 'react';
import prisma from '@/lib/prisma';
import AffiliatesClient, { AffiliateRow } from './AffiliatesClient';

export const dynamic = 'force-dynamic';

export default async function AffiliatesPage() {
  const [affiliates, affiliateOrders] = await Promise.all([
    prisma.affiliate.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            clicks: true,
            leadsList: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: {
        affiliateCode: { not: null },
        status: { notIn: ['cancelled', 'refused'] },
      },
      select: {
        affiliateCode: true,
        total: true,
      },
    }),
  ]);

  const orderRevenueByCode = new Map<string, { count: number; total: number }>();
  for (const o of affiliateOrders) {
    const key = (o.affiliateCode || '').trim().toUpperCase();
    if (!key) continue;
    const prev = orderRevenueByCode.get(key) || { count: 0, total: 0 };
    orderRevenueByCode.set(key, {
      count: prev.count + 1,
      total: prev.total + (o.total || 0),
    });
  }

  const rows: AffiliateRow[] = affiliates.map((a) => {
    const orderStat = orderRevenueByCode.get(a.code.toUpperCase());
    const realSales = Math.max(a.sales || 0, a._count.orders || 0, orderStat?.count || 0);
    const realRevenue = Math.max(a.revenueGenerated || 0, orderStat?.total || 0);
    const realVisits = Math.max(a.visits || 0, a._count.clicks || 0);
    const realLeads = Math.max(a.leads || 0, a._count.leadsList || 0);

    return {
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      instagram: a.instagram,
      code: a.code,
      commissionType: a.commissionType,
      commissionRate: a.commissionRate,
      fixedPerOrder: a.fixedPerOrder,
      payPerVisit: a.payPerVisit,
      payPerLead: a.payPerLead,
      monthlyRetainer: a.monthlyRetainer,
      visits: realVisits,
      leads: realLeads,
      sales: realSales,
      revenueGenerated: Math.round(realRevenue),
      commissionEarned: Math.round(a.commissionEarned || 0),
      commissionPaid: Math.round(a.commissionPaid || 0),
      isActive: (a.status || 'ACTIVE').toUpperCase() === 'ACTIVE',
    };
  });

  const totalRevenue = rows.reduce((sum, a) => sum + a.revenueGenerated, 0);
  const totalCommissions = rows.reduce((sum, a) => sum + a.commissionEarned, 0);
  const totalPaid = rows.reduce((sum, a) => sum + a.commissionPaid, 0);
  const totalPending = Math.max(0, totalCommissions - totalPaid);
  const totalVisits = rows.reduce((sum, a) => sum + a.visits, 0);
  const totalSales = rows.reduce((sum, a) => sum + a.sales, 0);
  const totalLeads = rows.reduce((sum, a) => sum + a.leads, 0);

  return (
    <AffiliatesClient
      affiliates={rows}
      stats={{
        totalRevenue,
        totalCommissions,
        totalPaid,
        totalPending,
        totalVisits,
        totalSales,
        totalLeads,
      }}
    />
  );
}
