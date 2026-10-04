import prisma from '@/lib/prisma';

export interface UnifiedAbandonedCart {
  id: string;
  sessionId: string;
  cartValue: number;
  status: 'ACTIVE' | 'ABANDONED';
  lastActivity: string;
  cartItems: string;
  itemsCount: number;
  hasContact: boolean;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
  };
}

export interface AbandonedCartsStats {
  totalCarts: number;
  totalValue: number;
  hotCarts: number;
  abandonedCarts: number;
  activeSessions: number;
  withContactCount: number;
  avgValue: number;
}

/**
 * Retrieves all real active and abandoned carts across LiveCartSession and AbandonedCart.
 * Filters out completed/ordered carts and carts with 0 value or empty items.
 */
export async function getUnifiedAbandonedCarts(limit = 100): Promise<UnifiedAbandonedCart[]> {
  const now = Date.now();

  // 1. Fetch from liveCartSession (real website shopping sessions)
  const sessions = await prisma.liveCartSession.findMany({
    where: {
      status: { not: 'COMPLETED' },
      items: { not: '[]' },
      totalValue: { gt: 0 }
    },
    include: {
      customer: true
    },
    orderBy: {
      lastActivity: 'desc'
    },
    take: limit
  });

  // 2. Fetch from legacy abandonedCart table (if any)
  const legacyCarts = await prisma.abandonedCart.findMany({
    where: {
      status: { in: ['ABANDONED', 'ACTIVE'] },
      cartValue: { gt: 0 }
    },
    include: {
      customer: true
    },
    orderBy: {
      lastActivity: 'desc'
    },
    take: 30
  });

  const seenIds = new Set<string>();
  const unified: UnifiedAbandonedCart[] = [];

  // Process live sessions
  for (const s of sessions) {
    let parsedItems: any[] = [];
    try {
      parsedItems = JSON.parse(s.items);
    } catch {
      continue;
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0 || s.totalValue <= 0) {
      continue;
    }

    const minSince = Math.floor((now - new Date(s.lastActivity).getTime()) / 60000);
    const isAbandoned = minSince > 60;

    const phone = s.customer?.phone || s.customerPhone || null;
    const name = s.customer?.name || s.customerName || 'Visiteur Boutique';
    const email = s.customer?.email || s.customerEmail || '';
    const city = s.customer?.city || s.customerCity || null;

    seenIds.add(s.sessionId);

    unified.push({
      id: s.id,
      sessionId: s.sessionId,
      cartValue: Math.round(s.totalValue),
      status: isAbandoned ? 'ABANDONED' : 'ACTIVE',
      lastActivity: s.lastActivity.toISOString(),
      cartItems: s.items,
      itemsCount: parsedItems.length,
      hasContact: Boolean(phone && phone.trim().length >= 8),
      customer: {
        id: s.customerId || s.sessionId,
        name,
        email,
        phone,
        city
      }
    });
  }

  // Process legacy carts not already included
  for (const c of legacyCarts) {
    if (seenIds.has(c.id)) continue;

    let parsedItems: any[] = [];
    try {
      parsedItems = JSON.parse(c.cartItems);
    } catch {
      continue;
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0 || c.cartValue <= 0) {
      continue;
    }

    const minSince = Math.floor((now - new Date(c.lastActivity).getTime()) / 60000);
    const isAbandoned = minSince > 60;
    const phone = c.customer?.phone || null;

    unified.push({
      id: c.id,
      sessionId: c.id,
      cartValue: Math.round(c.cartValue),
      status: isAbandoned ? 'ABANDONED' : 'ACTIVE',
      lastActivity: c.lastActivity.toISOString(),
      cartItems: c.cartItems,
      itemsCount: parsedItems.length,
      hasContact: Boolean(phone && phone.trim().length >= 8),
      customer: {
        id: c.customer.id,
        name: c.customer.name,
        email: c.customer.email,
        phone: c.customer.phone,
        city: c.customer.city
      }
    });
  }

  // Sort descending by last activity
  unified.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

  return unified;
}

/**
 * Computes consolidated abandoned cart KPI metrics.
 */
export async function getAbandonedCartsStats(): Promise<AbandonedCartsStats> {
  const carts = await getUnifiedAbandonedCarts(500);
  const now = Date.now();

  const totalCarts = carts.length;
  const totalValue = carts.reduce((acc, c) => acc + c.cartValue, 0);

  const hotCarts = carts.filter(c => {
    const hours = (now - new Date(c.lastActivity).getTime()) / (1000 * 3600);
    return hours <= 24;
  }).length;

  const abandonedCarts = carts.filter(c => c.status === 'ABANDONED').length;
  const activeSessions = carts.filter(c => c.status === 'ACTIVE').length;
  const withContactCount = carts.filter(c => c.hasContact).length;
  const avgValue = totalCarts > 0 ? Math.round(totalValue / totalCarts) : 0;

  return {
    totalCarts,
    totalValue,
    hotCarts,
    abandonedCarts,
    activeSessions,
    withContactCount,
    avgValue
  };
}
