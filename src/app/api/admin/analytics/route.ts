import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

interface DateRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
}

function resolveDateRanges(period: string, customStart?: string | null, customEnd?: string | null): DateRange {
  const now = new Date();
  let start = new Date();
  let end = new Date(now);

  switch (period) {
    case 'today': {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const diffMs = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - diffMs);
      return { start, end, prevStart, prevEnd, label: "Aujourd'hui" };
    }
    case 'yesterday': {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      const prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0, 0);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 23, 59, 59, 999);
      return { start, end, prevStart, prevEnd, label: 'Hier' };
    }
    case '7d': {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start, end, prevStart, prevEnd, label: '7 derniers jours' };
    }
    case 'this_month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const diffMs = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - diffMs);
      return { start, end, prevStart, prevEnd, label: 'Ce mois-ci' };
    }
    case '90d': {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { start, end, prevStart, prevEnd, label: '90 derniers jours' };
    }
    case 'year': {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      const prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
      return { start, end, prevStart, prevEnd, label: 'Cette année' };
    }
    case 'all': {
      start = new Date(2020, 0, 1);
      const prevStart = new Date(2019, 0, 1);
      const prevEnd = new Date(2019, 11, 31);
      return { start, end, prevStart, prevEnd, label: "Tout l'historique" };
    }
    case 'custom': {
      if (customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        const diffMs = Math.max(86400000, end.getTime() - start.getTime());
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - diffMs);
        return { start, end, prevStart, prevEnd, label: 'Personnalisé' };
      }
      // Fallback 30d
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start, end, prevStart, prevEnd, label: '30 derniers jours' };
    }
    case '30d':
    default: {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start, end, prevStart, prevEnd, label: '30 derniers jours' };
    }
  }
}

function normalizeCity(rawCity?: string | null): string {
  if (!rawCity) return 'Autre / Inconnu';
  const clean = rawCity.trim().toLowerCase();
  if (clean.includes('casa')) return 'Casablanca';
  if (clean.includes('rabat')) return 'Rabat';
  if (clean.includes('marrak') || clean.includes('marrakech')) return 'Marrakech';
  if (clean.includes('tang') || clean.includes('tanger')) return 'Tanger';
  if (clean.includes('fes') || clean.includes('fès')) return 'Fès';
  if (clean.includes('agadir')) return 'Agadir';
  if (clean.includes('oujda')) return 'Oujda';
  if (clean.includes('kenitra') || clean.includes('kénitra')) return 'Kénitra';
  if (clean.includes('tetouan') || clean.includes('tétouan')) return 'Tétouan';
  if (clean.includes('meknes') || clean.includes('meknès')) return 'Meknès';
  if (clean.includes('sale') || clean.includes('salé')) return 'Salé';
  if (clean.includes('nador')) return 'Nador';
  if (clean.includes('mohamm') || clean.includes('mohammedia')) return 'Mohammédia';
  if (clean.includes('el jadida') || clean.includes('jadida')) return 'El Jadida';
  if (clean.includes('berrechid')) return 'Berrechid';
  if (clean.includes('safi')) return 'Safi';
  if (clean.includes('beni mellal')) return 'Béni Mellal';
  if (clean.includes('temara') || clean.includes('témara')) return 'Témara';

  // Capitalize first letter
  return rawCity.trim().charAt(0).toUpperCase() + rawCity.trim().slice(1);
}

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const { start, end, prevStart, prevEnd, label } = resolveDateRanges(period, customStart, customEnd);

    // ── 1. Fetch Current & Previous Period Orders ────────────────────────────
    const [currentOrders, prevOrders, catalogProducts] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: prevStart, lte: prevEnd } },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          brandLabel: true,
          subcategoryLabel: true,
          gender: true,
          price: true,
          stock: true,
          inStock: true,
          images: true,
          isTester: true,
        },
      }),
    ]);

    // Fast product lookup map
    const productBySlug = new Map<string, typeof catalogProducts[0]>();
    catalogProducts.forEach((p) => {
      productBySlug.set(p.slug.toLowerCase(), p);
    });

    // ── 2. Calculate Core KPIs ───────────────────────────────────────────────
    let currentGrossRevenue = 0;
    let currentDeliveredRevenue = 0;
    let currentInTransitRevenue = 0;
    let currentLostRevenue = 0;
    let currentDeliveredOrders = 0;
    let currentPendingOrders = 0;
    let currentRefusedOrReturnedOrders = 0;
    let currentTotalBottlesSold = 0;

    const currentCustomerMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      city: string;
      orderCount: number;
      totalSpent: number;
      deliveredCount: number;
      refusedCount: number;
      lastOrderDate: Date;
    }>();

    const currentCityMap = new Map<string, {
      city: string;
      orders: number;
      revenue: number;
      delivered: number;
      refused: number;
    }>();

    const currentProductSalesMap = new Map<string, {
      slug: string;
      name: string;
      brandLabel: string;
      category: string;
      image: string;
      unitsSold: number;
      revenue: number;
      orderCount: number;
      stock: number;
      inStock: boolean;
      price: number;
    }>();

    const brandSalesMap = new Map<string, { name: string; revenue: number; units: number }>();
    const categorySalesMap = new Map<string, { name: string; revenue: number; units: number }>();
    const bottleSizeMap = new Map<string, { size: string; count: number }>();
    const statusCountsMap: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      shipped: 0,
      delivered: 0,
      refused: 0,
      returned: 0,
      cancelled: 0,
    };

    const peakHours = new Array(24).fill(0);
    const peakDays = [
      { name: 'Dimanche', orders: 0 },
      { name: 'Lundi', orders: 0 },
      { name: 'Mardi', orders: 0 },
      { name: 'Mercredi', orders: 0 },
      { name: 'Jeudi', orders: 0 },
      { name: 'Vendredi', orders: 0 },
      { name: 'Samedi', orders: 0 },
    ];

    currentOrders.forEach((order) => {
      const st = (order.status || 'pending').toLowerCase();
      if (statusCountsMap[st] !== undefined) {
        statusCountsMap[st] += 1;
      } else {
        statusCountsMap[st] = 1;
      }

      const isCancelledOrRefused = st === 'cancelled' || st === 'refused' || st === 'returned';
      currentGrossRevenue += order.total || 0;

      if (st === 'delivered') {
        currentDeliveredRevenue += order.total || 0;
        currentDeliveredOrders += 1;
      } else if (st === 'shipped') {
        currentInTransitRevenue += order.total || 0;
      } else if (st === 'refused' || st === 'returned') {
        currentLostRevenue += order.total || 0;
        currentRefusedOrReturnedOrders += 1;
      } else if (st === 'pending' || st === 'confirmed' || st === 'preparing') {
        currentPendingOrders += 1;
      }

      // Hour and Day metrics
      const orderDate = new Date(order.createdAt);
      peakHours[orderDate.getHours()] += 1;
      peakDays[orderDate.getDay()].orders += 1;

      // Customer Aggregation
      const custKey = (order.customerPhone || order.customerEmail || order.customerName).trim().toLowerCase();
      if (custKey) {
        const existingCust = currentCustomerMap.get(custKey) || {
          name: order.customerName || 'Client',
          email: order.customerEmail || '',
          phone: order.customerPhone || '',
          city: normalizeCity(order.shippingCity),
          orderCount: 0,
          totalSpent: 0,
          deliveredCount: 0,
          refusedCount: 0,
          lastOrderDate: orderDate,
        };
        existingCust.orderCount += 1;
        existingCust.totalSpent += order.total || 0;
        if (st === 'delivered') existingCust.deliveredCount += 1;
        if (st === 'refused' || st === 'returned') existingCust.refusedCount += 1;
        if (orderDate > existingCust.lastOrderDate) existingCust.lastOrderDate = orderDate;
        currentCustomerMap.set(custKey, existingCust);
      }

      // City Aggregation
      const normCity = normalizeCity(order.shippingCity);
      const existingCity = currentCityMap.get(normCity) || {
        city: normCity,
        orders: 0,
        revenue: 0,
        delivered: 0,
        refused: 0,
      };
      existingCity.orders += 1;
      existingCity.revenue += order.total || 0;
      if (st === 'delivered') existingCity.delivered += 1;
      if (st === 'refused' || st === 'returned') existingCity.refused += 1;
      currentCityMap.set(normCity, existingCity);

      // Parse Items
      let itemsList: any[] = [];
      try {
        itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch {
        itemsList = [];
      }

      itemsList.forEach((it: any) => {
        const qty = Number(it.quantity) || 1;
        const itemPrice = Number(it.price) || 0;
        const itemSlug = (it.slug || it.product?.slug || '').toLowerCase();
        const itemName = it.name || it.product?.name || 'Parfum NAY';
        const catalogP = productBySlug.get(itemSlug);

        currentTotalBottlesSold += qty;

        // Size stats
        const sizeStr = it.size || it.selectedSize || '100ml';
        const curSize = bottleSizeMap.get(sizeStr) || { size: sizeStr, count: 0 };
        curSize.count += qty;
        bottleSizeMap.set(sizeStr, curSize);

        // Product stats
        const prodKey = itemSlug || itemName.toLowerCase();
        const curProd = currentProductSalesMap.get(prodKey) || {
          slug: itemSlug || `p-${prodKey}`,
          name: catalogP?.name || itemName,
          brandLabel: catalogP?.brandLabel || 'NAY Parfums',
          category: catalogP?.subcategoryLabel || (catalogP?.isTester ? 'Testeur' : 'Parfum Original'),
          image: (catalogP?.images ? (() => { try { return JSON.parse(catalogP.images)[0]; } catch { return catalogP.images; } })() : it.image) || '',
          unitsSold: 0,
          revenue: 0,
          orderCount: 0,
          stock: catalogP?.stock ?? 10,
          inStock: catalogP?.inStock ?? true,
          price: catalogP?.price || itemPrice,
        };
        curProd.unitsSold += qty;
        curProd.revenue += itemPrice * qty;
        curProd.orderCount += 1;
        currentProductSalesMap.set(prodKey, curProd);

        // Brand stats
        const brandKey = curProd.brandLabel || 'NAY Parfums';
        const curBrand = brandSalesMap.get(brandKey) || { name: brandKey, revenue: 0, units: 0 };
        curBrand.revenue += itemPrice * qty;
        curBrand.units += qty;
        brandSalesMap.set(brandKey, curBrand);

        // Category stats
        const catKey = curProd.category || 'Parfums';
        const curCat = categorySalesMap.get(catKey) || { name: catKey, revenue: 0, units: 0 };
        curCat.revenue += itemPrice * qty;
        curCat.units += qty;
        categorySalesMap.set(catKey, curCat);
      });
    });

    // Previous period stats
    let prevGrossRevenue = 0;
    let prevDeliveredOrders = 0;
    prevOrders.forEach((order) => {
      prevGrossRevenue += order.total || 0;
      if (order.status === 'delivered') prevDeliveredOrders += 1;
    });

    const currentTotalOrders = currentOrders.length;
    const prevTotalOrders = prevOrders.length;
    const currentAov = currentTotalOrders > 0 ? Math.round(currentGrossRevenue / currentTotalOrders) : 0;
    const prevAov = prevTotalOrders > 0 ? Math.round(prevGrossRevenue / prevTotalOrders) : 0;

    // Delivery Rate
    const processedOrders = currentDeliveredOrders + currentRefusedOrReturnedOrders;
    const currentDeliveryRate = processedOrders > 0 ? Math.round((currentDeliveredOrders / processedOrders) * 100) : 0;

    // Repeat customers
    const allCustomersList = Array.from(currentCustomerMap.values());
    const repeatCustomersCount = allCustomersList.filter((c) => c.orderCount >= 2).length;
    const repeatCustomerRate = allCustomersList.length > 0 ? Math.round((repeatCustomersCount / allCustomersList.length) * 100) : 0;

    // ── 3. Web Traffic & Funnel Metrics ───────────────────────────────────────
    const [totalVisitorsCount, totalPageViewsCount, productViewsList, cartViewsList, checkoutViewsList, recentVisitors] = await Promise.all([
      prisma.visitor.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.pageView.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.pageView.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          OR: [
            { pathname: { contains: '/product/' } },
            { pathname: { contains: '/parfum/' } },
            { pathname: { contains: '/testeur' } },
            { pathname: { contains: '/coffret' } },
          ],
        },
        select: { visitorId: true },
        distinct: ['visitorId'],
      }),
      prisma.pageView.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          pathname: { contains: '/cart' },
        },
        select: { visitorId: true },
        distinct: ['visitorId'],
      }),
      prisma.pageView.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          pathname: { contains: '/checkout' },
        },
        select: { visitorId: true },
        distinct: ['visitorId'],
      }),
      prisma.pageView.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { device: true, referrer: true },
        take: 1500,
      }),
    ]);

    // Device breakdown
    const deviceMap: Record<string, number> = { Mobile: 0, Desktop: 0, Tablette: 0 };
    // Referrer breakdown
    const referrerMap: Record<string, number> = {};

    recentVisitors.forEach((pv) => {
      const dev = (pv.device || 'Mobile').toLowerCase();
      if (dev.includes('desk') || dev.includes('pc') || dev.includes('mac')) {
        deviceMap.Desktop += 1;
      } else if (dev.includes('tab')) {
        deviceMap.Tablette += 1;
      } else {
        deviceMap.Mobile += 1;
      }

      const ref = pv.referrer || 'Direct';
      let refGroup = 'Direct';
      const refLower = ref.toLowerCase();
      if (refLower.includes('google')) refGroup = 'Google (SEO & Ads)';
      else if (refLower.includes('instagram') || refLower.includes('ig')) refGroup = 'Instagram';
      else if (refLower.includes('facebook') || refLower.includes('fb')) refGroup = 'Facebook';
      else if (refLower.includes('tiktok')) refGroup = 'TikTok';
      else if (refLower.includes('whatsapp') || refLower.includes('wa.me')) refGroup = 'WhatsApp';
      else if (refLower.includes('snapchat')) refGroup = 'Snapchat';
      else if (ref !== 'Direct' && ref !== '') refGroup = 'Sites Référents';

      referrerMap[refGroup] = (referrerMap[refGroup] || 0) + 1;
    });

    const globalConversionRate = totalVisitorsCount > 0 ? Number(((currentTotalOrders / totalVisitorsCount) * 100).toFixed(2)) : 0;

    // Funnel Steps
    const funnelSteps = [
      { name: '1. Visiteurs Uniques', value: totalVisitorsCount || 1, count: totalVisitorsCount, rate: 100 },
      { name: '2. Fiches Parfums Vues', value: productViewsList.length, count: productViewsList.length, rate: totalVisitorsCount > 0 ? Math.round((productViewsList.length / totalVisitorsCount) * 100) : 0 },
      { name: '3. Ajouts au Panier', value: cartViewsList.length, count: cartViewsList.length, rate: productViewsList.length > 0 ? Math.round((cartViewsList.length / productViewsList.length) * 100) : 0 },
      { name: '4. Passages en Caisse', value: checkoutViewsList.length, count: checkoutViewsList.length, rate: cartViewsList.length > 0 ? Math.round((checkoutViewsList.length / cartViewsList.length) * 100) : 0 },
      { name: '5. Commandes Validées', value: currentTotalOrders, count: currentTotalOrders, rate: checkoutViewsList.length > 0 ? Math.round((currentTotalOrders / checkoutViewsList.length) * 100) : 0 },
      { name: '6. Commandes Livrées (COD)', value: currentDeliveredOrders, count: currentDeliveredOrders, rate: currentTotalOrders > 0 ? Math.round((currentDeliveredOrders / currentTotalOrders) * 100) : 0 },
    ];

    // ── 4. Build Time-Series Chart Data ──────────────────────────────────────
    const timeSeriesMap = new Map<string, { label: string; date: string; revenue: number; orders: number }>();
    const isHourly = period === 'today' || period === 'yesterday';

    if (isHourly) {
      for (let h = 0; h < 24; h += 2) {
        const hLabel = `${String(h).padStart(2, '0')}:00`;
        timeSeriesMap.set(hLabel, { label: hLabel, date: hLabel, revenue: 0, orders: 0 });
      }
      currentOrders.forEach((o) => {
        const oHour = new Date(o.createdAt).getHours();
        const bucketHour = Math.floor(oHour / 2) * 2;
        const bucketLabel = `${String(bucketHour).padStart(2, '0')}:00`;
        if (timeSeriesMap.has(bucketLabel)) {
          const item = timeSeriesMap.get(bucketLabel)!;
          item.revenue += o.total || 0;
          item.orders += 1;
        }
      });
    } else {
      // Daily buckets
      const daysCount = Math.min(60, Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));
      for (let d = daysCount; d >= 0; d--) {
        const curD = new Date(end.getTime() - d * 24 * 60 * 60 * 1000);
        const dKey = curD.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        if (!timeSeriesMap.has(dKey)) {
          timeSeriesMap.set(dKey, { label: dKey, date: dKey, revenue: 0, orders: 0 });
        }
      }
      currentOrders.forEach((o) => {
        const dKey = new Date(o.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        if (timeSeriesMap.has(dKey)) {
          const item = timeSeriesMap.get(dKey)!;
          item.revenue += o.total || 0;
          item.orders += 1;
        }
      });
    }

    const timeSeriesChart = Array.from(timeSeriesMap.values());

    // ── 5. Rank & Format Best-Sellers, Cities, Customers ─────────────────────
    const topProducts = Array.from(currentProductSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    const cityBreakdown = Array.from(currentCityMap.values())
      .sort((a, b) => b.orders - a.orders)
      .map((c) => ({
        ...c,
        deliveryRate: (c.delivered + c.refused) > 0 ? Math.round((c.delivered / (c.delivered + c.refused)) * 100) : 100,
        share: currentTotalOrders > 0 ? Math.round((c.orders / currentTotalOrders) * 100) : 0,
      }))
      .slice(0, 15);

    const topCustomers = allCustomersList
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 15);

    const brandBreakdown = Array.from(brandSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const categoryBreakdown = Array.from(categorySalesMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    const bottleSizes = Array.from(bottleSizeMap.values())
      .sort((a, b) => b.count - a.count);

    // Low stock / out of stock popular perfumes
    const lowStockAlerts = catalogProducts
      .filter((p) => p.stock <= 4)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brandLabel: p.brandLabel,
        stock: p.stock,
        inStock: p.inStock,
        price: p.price,
        image: (() => { try { return JSON.parse(p.images)[0]; } catch { return p.images; } })(),
      }))
      .slice(0, 8);

    // Evolution deltas (% comparison)
    const calcDelta = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const deltas = {
      revenue: calcDelta(currentGrossRevenue, prevGrossRevenue),
      orders: calcDelta(currentTotalOrders, prevTotalOrders),
      aov: calcDelta(currentAov, prevAov),
      delivered: calcDelta(currentDeliveredOrders, prevDeliveredOrders),
    };

    return NextResponse.json({
      success: true,
      period: {
        id: period,
        label,
        start: start.toISOString(),
        end: end.toISOString(),
      },
      kpi: {
        grossRevenue: Math.round(currentGrossRevenue),
        deliveredRevenue: Math.round(currentDeliveredRevenue),
        inTransitRevenue: Math.round(currentInTransitRevenue),
        lostRevenue: Math.round(currentLostRevenue),
        totalOrders: currentTotalOrders,
        deliveredOrders: currentDeliveredOrders,
        pendingOrders: currentPendingOrders,
        refusedOrReturnedOrders: currentRefusedOrReturnedOrders,
        deliveryRate: currentDeliveryRate,
        aov: currentAov,
        totalBottlesSold: currentTotalBottlesSold,
        uniqueCustomers: allCustomersList.length,
        repeatCustomerRate,
        visitorsCount: totalVisitorsCount,
        pageViewsCount: totalPageViewsCount,
        conversionRate: globalConversionRate,
        deltas,
      },
      charts: {
        timeSeries: timeSeriesChart,
        funnel: funnelSteps,
        peakHours,
        peakDays,
        devices: [
          { name: 'Mobile', value: deviceMap.Mobile },
          { name: 'Ordinateur (Desktop)', value: deviceMap.Desktop },
          { name: 'Tablette', value: deviceMap.Tablette },
        ],
        trafficSources: Object.entries(referrerMap).map(([name, value]) => ({ name, value })),
        brands: brandBreakdown,
        categories: categoryBreakdown,
        bottleSizes,
      },
      perfumes: {
        bestSellers: topProducts,
        lowStockAlerts,
      },
      clients: {
        topCustomers,
        cities: cityBreakdown,
        newVsReturning: [
          { name: 'Nouveaux Acheteurs', value: Math.max(0, allCustomersList.length - repeatCustomersCount) },
          { name: 'Clients Récurrents (Fidèles)', value: repeatCustomersCount },
        ],
      },
      logistics: {
        statusDistribution: statusCountsMap,
        codHealth: {
          encaisse: Math.round(currentDeliveredRevenue),
          enTransit: Math.round(currentInTransitRevenue),
          perdu: Math.round(currentLostRevenue),
        },
      },
    });
  } catch (error: any) {
    console.error('[Admin Analytics API Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors du calcul des statistiques' },
      { status: 500 }
    );
  }
}
