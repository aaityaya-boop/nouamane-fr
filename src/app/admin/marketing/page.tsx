import React from 'react';
import prisma from '@/lib/prisma';
import { getUnifiedCustomers } from '@/lib/unifiedCustomers';
import { getUnifiedAbandonedCarts, getAbandonedCartsStats } from '@/lib/abandonedCartsService';
import MarketingOverviewClient, {
  MonthlyRetentionPoint,
  StudioContact,
} from './MarketingOverviewClient';

export const dynamic = 'force-dynamic';

export default async function MarketingDashboardPage() {
  const [
    allCustomers,
    abandonedStats,
    allUnifiedCarts,
    campaigns,
    liveSessions,
    activePromos,
    settingsRow,
  ] = await Promise.all([
    getUnifiedCustomers(),
    getAbandonedCartsStats(),
    getUnifiedAbandonedCarts(12),
    prisma.marketingCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.liveCartSession.findMany({
      where: {
        lastActivity: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        items: { not: '[]' },
      },
    }),
    prisma.promoCode.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.marketingSettings.findFirst({
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  let totalRevenue = 0;
  let repeatRevenue = 0;
  let newCustomers = 0;
  let returningCustomers = 0;
  let vipCount = 0;
  let diamondCount = 0;
  let goldCount = 0;
  let silverCount = 0;
  let atRiskCount = 0;
  let inactiveCount = 0;
  let totalDeliveredOrders = 0;
  let withPhoneCount = 0;

  const nowMs = Date.now();
  const cityAgg = new Map<string, { count: number; revenue: number }>();

  // Prepare last 6 months bucket map
  const monthBuckets: Array<{ key: string; label: string; newRevenue: number; repeatRevenue: number; ordersCount: number }> = [];
  const monthMap = new Map<string, number>();
  const baseDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    monthMap.set(key, monthBuckets.length);
    monthBuckets.push({
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1).replace('.', ''),
      newRevenue: 0,
      repeatRevenue: 0,
      ordersCount: 0,
    });
  }

  const studioContacts: StudioContact[] = [];

  for (const c of allCustomers) {
    if (c.phone) withPhoneCount++;
    totalRevenue += c.totalSpent;
    const count = c.ordersCount;
    totalDeliveredOrders += c.deliveredOrdersCount;

    if (count === 1) newCustomers++;
    if (count > 1) {
      returningCustomers++;
      repeatRevenue += c.totalSpent;
    }

    if (c.isVip) {
      vipCount++;
      if (c.tier === 'DIAMOND') diamondCount++;
      else if (c.tier === 'GOLD') goldCount++;
      else if (c.tier === 'SILVER') silverCount++;
    }

    const daysSince = c.lastOrderDate
      ? Math.floor((nowMs - new Date(c.lastOrderDate).getTime()) / (1000 * 3600 * 24))
      : 999;

    if (count > 0 && daysSince > 90 && daysSince <= 180) atRiskCount++;
    if (count > 0 && daysSince > 180) inactiveCount++;

    // City attribution
    if (c.city && c.city.trim()) {
      const cityName = c.city.trim();
      const prev = cityAgg.get(cityName) || { count: 0, revenue: 0 };
      cityAgg.set(cityName, {
        count: prev.count + 1,
        revenue: prev.revenue + c.totalSpent,
      });
    }

    // Populate monthly retention revenue trend (oldest order = new acquisition, subsequent orders = repeat retention)
    if (c.ordersList && c.ordersList.length > 0) {
      const chronological = [...c.ordersList]
        .filter((o) => o.status !== 'cancelled' && o.status !== 'refused')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      chronological.forEach((ord, idx) => {
        const od = new Date(ord.createdAt);
        const mk = `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, '0')}`;
        const bucketIdx = monthMap.get(mk);
        if (bucketIdx !== undefined) {
          const b = monthBuckets[bucketIdx];
          b.ordersCount += 1;
          if (idx === 0) {
            b.newRevenue += Math.round(ord.total);
          } else {
            b.repeatRevenue += Math.round(ord.total);
          }
        }
      });
    }

    // Build Studio contact entry
    if (c.cleanPhone && c.cleanPhone.length >= 9) {
      let segment: StudioContact['segment'] = 'PROSPECT';
      if (c.isVip) segment = 'VIP';
      else if (count > 0 && daysSince > 180) segment = 'INACTIVE';
      else if (count > 0 && daysSince > 90) segment = 'AT_RISK';
      else if (count === 1) segment = 'ONE_TIME';

      studioContacts.push({
        id: c.id,
        name: c.name,
        phone: c.phone,
        cleanPhone: c.cleanPhone,
        city: c.city,
        totalSpent: Math.round(c.totalSpent),
        ordersCount: c.ordersCount,
        tier: c.tier,
        daysSinceLastOrder: daysSince,
        segment,
      });
    }
  }

  const aov =
    totalDeliveredOrders > 0
      ? Math.round(totalRevenue / totalDeliveredOrders)
      : newCustomers + returningCustomers > 0
      ? Math.round(totalRevenue / (newCustomers + returningCustomers))
      : 0;
  const cltv = allCustomers.length > 0 ? Math.round(totalRevenue / allCustomers.length) : 0;
  const repeatRate =
    allCustomers.length > 0 ? ((returningCustomers / allCustomers.length) * 100).toFixed(1) : '0';
  const repeatRevShare =
    totalRevenue > 0 ? ((repeatRevenue / totalRevenue) * 100).toFixed(1) : '0';

  const topCities = Array.from(cityAgg.entries())
    .map(([city, stat]) => ({ city, count: stat.count, revenue: Math.round(stat.revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const monthlyTrend: MonthlyRetentionPoint[] = monthBuckets.map((b) => ({
    label: b.label,
    newRevenue: b.newRevenue,
    repeatRevenue: b.repeatRevenue,
    ordersCount: b.ordersCount,
  }));

  const recentAbandonedCarts = allUnifiedCarts.slice(0, 6).map((cart) => {
    let parsedItems: Array<{ name: string; quantity?: number; price?: number }> = [];
    try {
      parsedItems = JSON.parse(cart.cartItems || '[]');
    } catch {
      parsedItems = [];
    }
    const minutesSince = Math.max(
      0,
      Math.floor((nowMs - new Date(cart.lastActivity).getTime()) / 60000)
    );
    return {
      id: cart.id,
      cartValue: Math.round(cart.cartValue),
      lastActivity: cart.lastActivity,
      minutesSince,
      items: Array.isArray(parsedItems) ? parsedItems : [],
      customer: {
        id: cart.customer.id,
        name: cart.customer.name,
        phone: cart.customer.phone,
        email: cart.customer.email,
        city: cart.customer.city,
      },
    };
  });

  const liveCartsValue = liveSessions.reduce((acc, s) => acc + s.totalValue, 0);

  return (
    <MarketingOverviewClient
      kpis={{
        totalCustomers: allCustomers.length,
        withPhoneCount,
        newCustomers,
        returningCustomers,
        repeatRate,
        totalRevenue: Math.round(totalRevenue),
        repeatRevenue: Math.round(repeatRevenue),
        repeatRevShare,
        cltv,
        aov,
        abandonedCartsCount: abandonedStats.abandonedCarts,
        recoverableMAD: Math.round(abandonedStats.totalValue),
        liveSessionsCount: liveSessions.length,
        liveCartsValue: Math.round(liveCartsValue),
      }}
      segments={{
        vipCount,
        diamondCount,
        goldCount,
        silverCount,
        atRiskCount,
        inactiveCount,
        oneTimeCount: newCustomers,
        hotCartsCount: abandonedStats.hotCarts,
      }}
      monthlyTrend={monthlyTrend}
      topCities={topCities}
      studioContacts={studioContacts}
      recentAbandonedCarts={recentAbandonedCarts}
      initialCampaigns={campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        channel: c.channel,
        type: c.type,
        audience: c.audience,
        status: c.status,
        message: c.message,
        createdAt: c.createdAt.toISOString(),
      }))}
      initialPromos={activePromos.map((p) => ({
        id: p.id,
        code: p.code,
        type: p.type,
        value: p.value,
        usageCount: p.usageCount,
        isActive: p.isActive,
      }))}
      initialSettings={{
        whatsappConfigured: settingsRow?.whatsappConfigured ?? true,
        emailConfigured: settingsRow?.emailConfigured ?? true,
        automationEnabled: settingsRow?.automationEnabled ?? true,
      }}
    />
  );
}
