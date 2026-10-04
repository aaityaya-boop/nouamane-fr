import prisma from '@/lib/prisma';

export interface UnifiedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cleanPhone: string;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  ordersCount: number;
  deliveredOrdersCount: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  createdAt: Date;
  isVip: boolean;
  tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'STANDARD';
  source: 'COMMANDE' | 'COMPTE' | 'COMMANDE_ET_COMPTE';
  recentOrderNumber: string | null;
  recentOrderStatus?: string | null;
  ordersList?: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: Date;
  }>;
}

export function normalizeMoroccanPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('00212')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) return '212' + digits.slice(1);
  if (digits.startsWith('212')) return digits;
  if (digits.length === 9) return '212' + digits;
  return digits;
}

export async function getUnifiedCustomers(): Promise<UnifiedCustomer[]> {
  const [allOrders, allCustomers] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.findMany({
      include: { 
        orders: { orderBy: { createdAt: 'desc' } },
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Map to group by normalized phone or email
  const map = new Map<
    string,
    {
      customer?: typeof allCustomers[0];
      orders: typeof allOrders;
      phoneKeys: Set<string>;
      emailKeys: Set<string>;
    }
  >();

  // Helper to find existing group key by phone or email
  const findExistingKey = (phoneKey: string, emailKey: string): string | null => {
    for (const [key, data] of map.entries()) {
      if (phoneKey && data.phoneKeys.has(phoneKey)) return key;
      if (emailKey && data.emailKeys.has(emailKey)) return key;
    }
    return null;
  };

  // 1. Process all registered Customers
  for (const c of allCustomers) {
    const phoneKey = normalizeMoroccanPhone(c.phone);
    const emailKey = (c.email || '').toLowerCase().trim();
    const existingKey = findExistingKey(phoneKey, emailKey);
    const primaryKey = existingKey || phoneKey || emailKey || `cust_${c.id}`;

    if (!map.has(primaryKey)) {
      const phoneSet = new Set<string>();
      if (phoneKey) phoneSet.add(phoneKey);
      const emailSet = new Set<string>();
      if (emailKey) emailSet.add(emailKey);

      map.set(primaryKey, {
        customer: c,
        orders: [],
        phoneKeys: phoneSet,
        emailKeys: emailSet,
      });
    } else {
      const entry = map.get(primaryKey)!;
      entry.customer = c;
      if (phoneKey) entry.phoneKeys.add(phoneKey);
      if (emailKey) entry.emailKeys.add(emailKey);
    }
  }

  // 2. Process all Orders (including guest checkouts by phone & email)
  for (const o of allOrders) {
    const phoneKey = normalizeMoroccanPhone(o.customerPhone);
    const emailKey = (o.customerEmail || '').toLowerCase().trim();
    const existingKey = findExistingKey(phoneKey, emailKey);
    const primaryKey = existingKey || phoneKey || emailKey || `order_${o.id}`;

    if (!map.has(primaryKey)) {
      const phoneSet = new Set<string>();
      if (phoneKey) phoneSet.add(phoneKey);
      const emailSet = new Set<string>();
      if (emailKey) emailSet.add(emailKey);

      map.set(primaryKey, {
        orders: [o],
        phoneKeys: phoneSet,
        emailKeys: emailSet,
      });
    } else {
      const entry = map.get(primaryKey)!;
      if (!entry.orders.some((eo) => eo.id === o.id)) {
        entry.orders.push(o);
      }
      if (phoneKey) entry.phoneKeys.add(phoneKey);
      if (emailKey) entry.emailKeys.add(emailKey);
    }
  }

  // 3. Assemble unified customer objects
  const unified: UnifiedCustomer[] = [];

  for (const [key, data] of map.entries()) {
    const c = data.customer;
    const orders = data.orders;

    // Latest order info if exists
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestOrder = orders.length > 0 ? orders[0] : null;

    const name = (c?.name || latestOrder?.customerName || 'Client NAY').trim();
    const email = (c?.email || latestOrder?.customerEmail || '').trim();
    const phone = c?.phone || latestOrder?.customerPhone || null;
    const cleanPhone = normalizeMoroccanPhone(phone);
    const city = latestOrder?.shippingCity || c?.city || null;
    const address = latestOrder?.shippingAddress || c?.address || null;
    const postalCode = latestOrder?.shippingPostalCode || c?.postalCode || null;

    const ordersCount = orders.length;
    const validOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refused');
    const deliveredOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'completed');
    const deliveredOrdersCount = deliveredOrders.length;

    // Total spent from all valid orders
    const totalSpent = validOrders.reduce((sum, o) => sum + o.total, 0);

    const lastOrderDate = latestOrder ? new Date(latestOrder.createdAt) : c ? new Date(c.createdAt) : null;
    const createdAt = c ? new Date(c.createdAt) : latestOrder ? new Date(latestOrder.createdAt) : new Date();

    // VIP calculation
    let tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'STANDARD' = 'STANDARD';
    if (totalSpent >= 5000 || ordersCount >= 5) {
      tier = 'DIAMOND';
    } else if (totalSpent >= 2500 || ordersCount >= 3) {
      tier = 'GOLD';
    } else if (totalSpent >= 1000 || ordersCount >= 2) {
      tier = 'SILVER';
    }

    const isVip = tier !== 'STANDARD';

    const isDirectOrder = c?.tags?.some((t) => t.tag === 'Commande Directe');
    let source: 'COMMANDE' | 'COMPTE' | 'COMMANDE_ET_COMPTE' = 'COMMANDE';
    if (c && orders.length > 0 && !isDirectOrder) {
      source = 'COMMANDE_ET_COMPTE';
    } else if (c && orders.length === 0) {
      source = 'COMPTE';
    } else {
      source = 'COMMANDE';
    }

    unified.push({
      id: c?.id || `cmd_${cleanPhone || email.replace(/[^a-zA-Z0-9]/g, '_') || latestOrder?.id || key}`,
      name,
      email,
      phone,
      cleanPhone,
      city,
      address,
      postalCode,
      ordersCount,
      deliveredOrdersCount,
      totalSpent,
      lastOrderDate,
      createdAt,
      isVip,
      tier,
      source,
      recentOrderNumber: latestOrder?.orderNumber || null,
      recentOrderStatus: latestOrder?.status || null,
      ordersList: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status,
        createdAt: new Date(o.createdAt),
      })),
    });
  }

  // Sort by totalSpent desc, then ordersCount desc, then lastOrderDate desc
  return unified.sort((a, b) => {
    if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent;
    if (b.ordersCount !== a.ordersCount) return b.ordersCount - a.ordersCount;
    const dateA = a.lastOrderDate ? a.lastOrderDate.getTime() : 0;
    const dateB = b.lastOrderDate ? b.lastOrderDate.getTime() : 0;
    return dateB - dateA;
  });
}
