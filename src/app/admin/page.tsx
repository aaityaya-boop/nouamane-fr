import React from 'react';
import { 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  MapPin, 
  ArrowRight, 
  ArrowUpRight, 
  LineChart, 
  Clock, 
  CheckCircle2, 
  Phone, 
  Truck, 
  RotateCcw,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  CheckSquare,
  Archive,
  Compass,
  Zap,
  Globe2,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  Filter,
  Calendar,
  Layers
} from 'lucide-react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import TrafficChart from './components/TrafficChart';
import LiveOnlineVisitorsCard from './components/LiveOnlineVisitorsCard';
import LiveActivityStream from './components/LiveActivityStream';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';
import { 
  formatDateGMT, 
  formatTimeGMT, 
  formatDateTimeGMT, 
  getStartOfDayGMT, 
  getStartOfYesterdayGMT 
} from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const admin = await getAuthenticatedAdmin();
  const canViewRevenue = admin ? hasPermission(admin, 'finance.view_revenue') : false;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const productsCount = await prisma.product.count();

  // 1. Financial & Order Metrics (Valid Paying Orders)
  const validOrders = orders.filter(
    (o) => o.status !== 'annule' && o.status !== 'refused' && o.status !== 'returned'
  );
  const totalRevenue = validOrders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
  const totalOrders = orders.length;

  // Real Average Order Value (Panier Moyen) calculated on valid orders
  const averageOrderValue = validOrders.length > 0 
    ? totalRevenue / validOrders.length 
    : (totalOrders > 0 ? totalRevenue / totalOrders : 0);
  
  // Delivered / Collected revenue
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const deliveredRevenue = deliveredOrders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);

  // Unique customers
  const uniqueEmails = new Set(orders.map((o) => o.customerEmail).filter(Boolean));
  const totalCustomers = uniqueEmails.size;

  // Order counts per status
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'en-attente').length;
  const unconfirmedCount = orders.filter((o) => o.status === 'unconfirmed').length;
  const processingCount = orders.filter((o) => o.status === 'processing' || o.status === 'confirmed').length;
  const shippedCount = orders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const returnedCount = orders.filter((o) => o.status === 'refused' || o.status === 'returned').length;

  // Operational Performance Rates
  const confirmedCount = processingCount + shippedCount + deliveredCount;
  const dispatchedCount = shippedCount + deliveredCount + returnedCount;

  const tauxConfirmation = totalOrders > 0 ? ((confirmedCount / totalOrders) * 100).toFixed(1) : '0';
  const tauxNonConfirmation = totalOrders > 0 ? ((unconfirmedCount / totalOrders) * 100).toFixed(1) : '0';
  const tauxLivraisonGlobal = totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(1) : '0';
  const tauxLivraisonExpedie = dispatchedCount > 0 
    ? ((deliveredCount / dispatchedCount) * 100).toFixed(1) 
    : (confirmedCount > 0 ? ((deliveredCount / confirmedCount) * 100).toFixed(1) : '0');
  const tauxRetourGlobal = totalOrders > 0 ? ((returnedCount / totalOrders) * 100).toFixed(1) : '0';
  const tauxRetourExpedie = dispatchedCount > 0 ? ((returnedCount / dispatchedCount) * 100).toFixed(1) : '0';

  // 2. Real Time Comparisons (7-Day & 24h Windows in UTC / GMT+0)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const activeCutoff = new Date(now.getTime() - 2 * 60 * 1000); // 2-minute active window for live presence
  const startOfDay = getStartOfDayGMT(now);
  const startOfYesterday = getStartOfYesterdayGMT(now);

  // Real Revenue 7 Days vs Previous 7 Days
  const last7DaysOrders = orders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo);
  const prev7DaysOrders = orders.filter(
    (o) => new Date(o.createdAt) >= fourteenDaysAgo && new Date(o.createdAt) < sevenDaysAgo
  );

  const last7DaysRevenue = last7DaysOrders
    .filter((o) => o.status !== 'annule' && o.status !== 'refused' && o.status !== 'returned')
    .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const prev7DaysRevenue = prev7DaysOrders
    .filter((o) => o.status !== 'annule' && o.status !== 'refused' && o.status !== 'returned')
    .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  let revenueGrowthText = '0% vs 7j';
  let isRevenueGrowthPositive = true;
  if (prev7DaysRevenue > 0) {
    const diff = ((last7DaysRevenue - prev7DaysRevenue) / prev7DaysRevenue) * 100;
    revenueGrowthText = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs 7j`;
    isRevenueGrowthPositive = diff >= 0;
  } else if (last7DaysRevenue > 0) {
    revenueGrowthText = '+100% vs 7j';
    isRevenueGrowthPositive = true;
  }

  // Real Order Volume 7 Days vs Previous 7 Days
  const last7DaysOrdersCount = last7DaysOrders.length;
  const prev7DaysOrdersCount = prev7DaysOrders.length;
  let ordersGrowthText = '0% vs 7j';
  let isOrdersGrowthPositive = true;
  if (prev7DaysOrdersCount > 0) {
    const diff = ((last7DaysOrdersCount - prev7DaysOrdersCount) / prev7DaysOrdersCount) * 100;
    ordersGrowthText = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs 7j`;
    isOrdersGrowthPositive = diff >= 0;
  } else if (last7DaysOrdersCount > 0) {
    ordersGrowthText = '+100% vs 7j';
    isOrdersGrowthPositive = true;
  }

  // Real Active & Today Visitors evaluated on database server
  const [activeVisitorsRes, todayVisitorsRes, yesterdayVisitorsRes] = await Promise.all([
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count 
      FROM "Visitor" 
      WHERE "lastSeen" >= NOW() - INTERVAL '2 minutes'
    `,
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count 
      FROM "Visitor" 
      WHERE "lastSeen" >= date_trunc('day', NOW() AT TIME ZONE 'Africa/Casablanca') AT TIME ZONE 'Africa/Casablanca'
    `,
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count 
      FROM "Visitor" 
      WHERE "lastSeen" >= (date_trunc('day', NOW() AT TIME ZONE 'Africa/Casablanca') - INTERVAL '1 day') AT TIME ZONE 'Africa/Casablanca'
        AND "lastSeen" < date_trunc('day', NOW() AT TIME ZONE 'Africa/Casablanca') AT TIME ZONE 'Africa/Casablanca'
    `
  ]);

  const activeVisitorsCount = Number(activeVisitorsRes[0]?.count || 0);
  const todayVisitorsCount = Number(todayVisitorsRes[0]?.count || 0);
  const yesterdayVisitorsCount = Number(yesterdayVisitorsRes[0]?.count || 0);

  let visitorsGrowthText = 'Aujourd’hui';
  let isVisitorsGrowthPositive = true;
  if (yesterdayVisitorsCount > 0) {
    const diff = ((todayVisitorsCount - yesterdayVisitorsCount) / yesterdayVisitorsCount) * 100;
    visitorsGrowthText = `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}% vs hier`;
    isVisitorsGrowthPositive = diff >= 0;
  } else if (todayVisitorsCount > 0) {
    visitorsGrowthText = '+100% vs hier';
    isVisitorsGrowthPositive = true;
  }

  const totalVisitorsCount = await prisma.visitor.count();
  const tauxConversionVisiteurs = totalVisitorsCount > 0 
    ? ((totalOrders / totalVisitorsCount) * 100).toFixed(1) 
    : '0';

  const recentPageViews = await prisma.pageView.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { visitor: true }
  });

  // Top Moroccan Cities (filter out unknown/empty)
  const rawVisitorsByCity = await prisma.visitor.groupBy({
    by: ['city'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 8,
    where: { city: { not: null } }
  });

  const visitorsByCity = rawVisitorsByCity
    .filter(c => c.city && c.city.trim() !== '' && c.city.toLowerCase() !== 'unknown' && c.city.toLowerCase() !== 'inconnu')
    .slice(0, 5);
  
  const totalTopCityVisits = visitorsByCity.reduce((sum, c) => sum + c._count.id, 0);

  const formatMAD = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: 'MAD', 
      maximumFractionDigits: 0 
    }).format(amount).replace('MAD', '').trim() + ' MAD';
  };

  // 7-Day Chart Data
  const pageViews7Days = await prisma.pageView.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, visitorId: true }
  });

  const chartDataMap = new Map();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = formatDateGMT(d, { weekday: 'short', day: '2-digit' });
    chartDataMap.set(dateStr, { name: dateStr, views: 0, visitors: new Set() });
  }

  pageViews7Days.forEach((pv: any) => {
    const dateStr = formatDateGMT(pv.createdAt, { weekday: 'short', day: '2-digit' });
    if (chartDataMap.has(dateStr)) {
      const data = chartDataMap.get(dateStr);
      data.views += 1;
      data.visitors.add(pv.visitorId);
    }
  });

  const chartData = Array.from(chartDataMap.values()).map(d => ({
    name: d.name,
    Vues: d.views,
    Visiteurs: d.visitors.size
  }));

  // Top Acquisition Referrers
  const topReferrers = await prisma.pageView.groupBy({
    by: ['referrer'],
    _count: { id: true },
    where: { createdAt: { gte: sevenDaysAgo }, referrer: { not: null } },
    orderBy: { _count: { id: 'desc' } },
    take: 4
  });

  const adminName = admin?.name || 'Administrateur';
  const adminFirstName = adminName.split(' ')[0];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 font-sans text-slate-900 dark:text-slate-100">
      
      {/* ── 1. REFINED EXECUTIVE HEADER ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-[#222227]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-400">
              NAY Parfums • Boutique en Ligne
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Boutique en direct
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {canViewRevenue ? `Bonjour, ${adminFirstName}` : `Espace Confirmation & Suivi • ${adminFirstName}`}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {canViewRevenue 
              ? 'Pilotage exécutif, indicateurs de ventes et performance logistique en temps réel.'
              : 'Validation téléphonique des commandes, suivi des livraisons et satisfaction client.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <ShoppingBag size={14} className="text-slate-300 dark:text-sky-100" />
            <span>Commandes ({pendingOrders + unconfirmedCount} à traiter)</span>
          </Link>
          <Link
            href="/admin/tasks"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#121215] dark:hover:bg-[#18181d] border border-slate-200 dark:border-[#222227] text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <CheckSquare size={13} className="text-slate-500 dark:text-slate-400" />
            <span>Missions</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#121215] dark:hover:bg-[#18181d] border border-slate-200 dark:border-[#222227] text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white shadow-xs transition-all cursor-pointer"
            title="Voir la vitrine publique"
          >
            <span>Vitrine</span>
            <ExternalLink size={12} className="text-slate-400 dark:text-slate-400" />
          </Link>
        </div>
      </div>

      {/* ── 2. EXECUTIVE METRIC KPI CARDS ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canViewRevenue ? (
          <>
            {/* KPI 1: Revenue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Chiffre d&apos;Affaires Net</span>
                <span className="text-amber-600 bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                  <DollarSign size={15} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                {formatMAD(totalRevenue)}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Panier moyen : <strong className="text-slate-800 font-semibold">{formatMAD(averageOrderValue)}</strong></span>
                <span className={`font-semibold text-[11px] px-1.5 py-0.5 rounded border ${
                  isRevenueGrowthPositive 
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                    : 'text-rose-600 bg-rose-50 border-rose-100'
                }`}>
                  {revenueGrowthText}
                </span>
              </div>
            </div>

            {/* KPI 2: Total Orders */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Volume Commandes</span>
                <span className="text-sky-600 bg-sky-50 p-1.5 rounded-lg border border-sky-100">
                  <ShoppingBag size={15} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                {totalOrders}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span><strong className="text-slate-800 font-semibold">{confirmedCount}</strong> confirmées ({tauxConfirmation}%)</span>
                <span className={`font-semibold text-[11px] px-1.5 py-0.5 rounded border ${
                  isOrdersGrowthPositive 
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                    : 'text-rose-600 bg-rose-50 border-rose-100'
                }`}>
                  {ordersGrowthText}
                </span>
              </div>
            </div>

            {/* KPI 3: Today Visitors */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Visiteurs Aujourd&apos;hui</span>
                <span className="text-indigo-600 bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">
                  <Users size={15} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                {todayVisitorsCount}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Base CRM : <strong className="text-slate-800 font-semibold">{totalCustomers}</strong> clients</span>
                <span className={`font-semibold text-[11px] px-1.5 py-0.5 rounded border ${
                  isVisitorsGrowthPositive 
                    ? 'text-indigo-600 bg-indigo-50 border-indigo-100' 
                    : 'text-slate-600 bg-slate-50 border-slate-100'
                }`}>
                  {visitorsGrowthText}
                </span>
              </div>
            </div>

            {/* KPI 4: Live Visitors (Real-time auto-refresh) */}
            <LiveOnlineVisitorsCard 
              initialActiveCount={activeVisitorsCount} 
              conversionRate={tauxConversionVisiteurs} 
            />
          </>
        ) : (
          <>
            {/* AGENT VIEW: Confirmation Rate */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Taux de Confirmation</span>
                <span className="text-emerald-600 bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                  <CheckCircle2 size={15} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-emerald-600 tracking-tight">
                {tauxConfirmation}%
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span><strong className="text-slate-800 font-semibold">{confirmedCount}</strong> sur {totalOrders} commandes</span>
                <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">Données réelles</span>
              </div>
            </div>

            {/* AGENT VIEW: Non-Confirmation */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-rose-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Taux Non-Confirmé</span>
                <span className="text-rose-600 bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                  <PhoneCall size={15} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-rose-600 tracking-tight">
                {tauxNonConfirmation}%
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span><strong className="text-rose-700 font-semibold">{unconfirmedCount}</strong> injoignables / relances</span>
                <span className="text-rose-600 text-[11px] font-medium">À rappeler</span>
              </div>
            </div>

            {/* AGENT VIEW: Delivery Rate */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Taux de Livraison (Expéditions)</span>
                <span className="text-indigo-600 bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">
                  <Truck size={15} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-indigo-600 tracking-tight">
                {tauxLivraisonExpedie}%
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span><strong className="text-indigo-800 font-semibold">{deliveredCount}</strong> sur {dispatchedCount > 0 ? dispatchedCount : totalOrders} expédiées</span>
                <span className="text-indigo-600 text-[11px]">Transport</span>
              </div>
            </div>

            {/* AGENT VIEW: Returns Rate */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Taux de Retour</span>
                <span className="text-amber-600 bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                  <RotateCcw size={15} />
                </span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-amber-600 tracking-tight">
                {tauxRetourGlobal}%
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span><strong className="text-amber-800 font-semibold">{returnedCount}</strong> refus & retours</span>
                <span className="text-amber-700 text-[11px]">Contrôle qualité</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 2.5 REAL CONVERSION & OPERATIONAL RATES STRIP (EXECUTIVE VIEW) ── */}
      {canViewRevenue && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Rate 1: Taux de Confirmation */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Confirmation
              </span>
              <span className="font-mono text-emerald-600 font-bold">{tauxConfirmation}%</span>
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-between mt-1">
              <span>{confirmedCount} validées sur {totalOrders}</span>
              <span className="text-[10px] text-amber-600 font-medium">{unconfirmedCount} en attente ({tauxNonConfirmation}%)</span>
            </div>
          </div>

          {/* Rate 2: Taux de Livraison */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Truck size={13} className="text-indigo-500" />
                Taux Livraison
              </span>
              <span className="font-mono text-indigo-600 font-bold">{tauxLivraisonExpedie}%</span>
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-between mt-1">
              <span>{deliveredCount} colis encaissés</span>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">{formatMAD(deliveredRevenue)}</span>
            </div>
          </div>

          {/* Rate 3: Taux de Retour */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <RotateCcw size={13} className="text-amber-500" />
                Taux de Retour
              </span>
              <span className="font-mono text-amber-600 font-bold">{tauxRetourGlobal}%</span>
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-between mt-1">
              <span>{returnedCount} refus & retours</span>
              <span className="text-[10px] text-slate-500 font-mono">{tauxRetourExpedie}% des envois</span>
            </div>
          </div>

          {/* Rate 4: Conversion Boutique */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <TrendingUp size={13} className="text-[#1D9BF0]" />
                Conversion Visiteurs
              </span>
              <span className="font-mono text-[#0284c7] font-bold">{tauxConversionVisiteurs}%</span>
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-between mt-1">
              <span>{totalOrders} commandes générées</span>
              <span className="text-[10px] text-slate-400 font-mono">{totalVisitorsCount} visiteurs</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. ORDER FULFILLMENT PIPELINE BAR ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pipeline des Commandes ({totalOrders})
            </span>
            <span className="text-xs text-slate-400">• Répartition du cycle de vie</span>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-[#1D9BF0] hover:text-[#0284c7] flex items-center gap-1 self-start md:self-auto"
          >
            <span>Ouvrir l&apos;espace commandes complet</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {/* Visual Continuous Segmented Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 mb-3">
          {totalOrders > 0 ? (
            <>
              <div 
                className="bg-slate-400 h-full transition-all" 
                style={{ width: `${(pendingOrders / totalOrders) * 100}%` }} 
                title={`En attente: ${pendingOrders}`} 
              />
              <div 
                className="bg-amber-400 h-full transition-all" 
                style={{ width: `${(unconfirmedCount / totalOrders) * 100}%` }} 
                title={`Non confirmées: ${unconfirmedCount}`} 
              />
              <div 
                className="bg-sky-400 h-full transition-all" 
                style={{ width: `${(processingCount / totalOrders) * 100}%` }} 
                title={`En préparation: ${processingCount}`} 
              />
              <div 
                className="bg-indigo-400 h-full transition-all" 
                style={{ width: `${(shippedCount / totalOrders) * 100}%` }} 
                title={`En livraison: ${shippedCount}`} 
              />
              <div 
                className="bg-emerald-500 h-full transition-all" 
                style={{ width: `${(deliveredCount / totalOrders) * 100}%` }} 
                title={`Livrées: ${deliveredCount}`} 
              />
              <div 
                className="bg-rose-400 h-full transition-all" 
                style={{ width: `${(returnedCount / totalOrders) * 100}%` }} 
                title={`Retours: ${returnedCount}`} 
              />
            </>
          ) : (
            <div className="bg-slate-200 h-full w-full" />
          )}
        </div>

        {/* Pipeline Step Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <Link 
            href="/admin/orders?tab=PENDING" 
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors"
          >
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              En attente
            </span>
            <span className="font-bold text-slate-900 font-mono">{pendingOrders}</span>
          </Link>

          <Link 
            href="/admin/orders?tab=UNCONFIRMED" 
            className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60 transition-colors"
          >
            <span className="text-amber-800 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Non confirmées
            </span>
            <span className="font-bold text-amber-900 font-mono">{unconfirmedCount}</span>
          </Link>

          <Link 
            href="/admin/orders?tab=PROCESSING" 
            className="flex items-center justify-between p-2 rounded-xl bg-sky-50/50 hover:bg-sky-50 border border-sky-200/60 transition-colors"
          >
            <span className="text-sky-800 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1D9BF0]"></span>
              En prépa
            </span>
            <span className="font-bold text-sky-900 font-mono">{processingCount}</span>
          </Link>

          <Link 
            href="/admin/orders?tab=SHIPPED" 
            className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-200/60 transition-colors"
          >
            <span className="text-indigo-800 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              En livraison
            </span>
            <span className="font-bold text-indigo-900 font-mono">{shippedCount}</span>
          </Link>

          <Link 
            href="/admin/orders?tab=DELIVERED" 
            className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200/60 transition-colors"
          >
            <span className="text-emerald-800 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Livrées
            </span>
            <span className="font-bold text-emerald-900 font-mono">{deliveredCount}</span>
          </Link>

          <Link 
            href="/admin/orders?tab=ISSUES" 
            className="flex items-center justify-between p-2 rounded-xl bg-rose-50/50 hover:bg-rose-50 border border-rose-200/60 transition-colors"
          >
            <span className="text-rose-800 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Retours / Refus
            </span>
            <span className="font-bold text-rose-900 font-mono">{returnedCount}</span>
          </Link>
        </div>
      </div>

      {/* ── 4. MAIN SPLIT: RECENT ORDERS & TRAFFIC / REGIONAL ──────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Recent Orders Table & 7-Day Traffic (8 Cols) */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* RECENT ORDERS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Dernières Commandes</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Accès direct aux coordonnées et validation rapide</p>
              </div>
              <Link 
                href="/admin/orders" 
                className="text-xs font-semibold text-[#1D9BF0] hover:text-[#0284c7] flex items-center gap-1"
              >
                <span>Toutes les commandes ({totalOrders})</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Ville & Contact</th>
                    <th className="px-5 py-3">{canViewRevenue ? 'Montant' : 'Articles'}</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 6).map((order) => {
                    const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
                    const waPhone = cleanPhone.startsWith('0') ? `212${cleanPhone.slice(1)}` : cleanPhone;
                    const waMessage = encodeURIComponent(`Bonjour ${order.customerName || ''}, nous vous contactons de la Maison NAY Parfums concernant votre commande ${order.orderNumber || ''}.`);
                    
                    let itemCount = 1;
                    try {
                      itemCount = JSON.parse(order.items || '[]').length || 1;
                    } catch {
                      itemCount = 1;
                    }

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Client name & reference */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center border border-slate-200 shrink-0">
                              {(order.customerName || 'Client').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                                {order.customerName || 'Client NAY'}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                #{order.orderNumber || order.id.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* City & Phone */}
                        <td className="px-5 py-3.5 text-slate-600">
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <MapPin size={11} className="text-[#1D9BF0] shrink-0" />
                            <span>{order.shippingCity || 'Casablanca'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {order.customerPhone || 'N/A'}
                          </div>
                        </td>

                        {/* Amount or items */}
                        <td className="px-5 py-3.5">
                          {canViewRevenue ? (
                            <div className="font-bold text-slate-900 text-xs">
                              {formatMAD(order.total)}
                            </div>
                          ) : (
                            <div className="text-slate-600 font-medium">
                              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                                <Package size={11} className="text-slate-400" />
                                {itemCount} parfum{itemCount > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3.5">
                          <ProfessionalStatusBadge status={order.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            {order.customerPhone && (
                              <a
                                href={`https://wa.me/${waPhone}?text=${waMessage}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <MessageCircle size={14} />
                              </a>
                            )}
                            {order.customerPhone && (
                              <a
                                href={`tel:${order.customerPhone}`}
                                title="Appeler"
                                className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                              >
                                <Phone size={14} />
                              </a>
                            )}
                            <Link
                              href={`/admin/orders?highlight=${order.id}`}
                              title="Gérer la commande"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <ChevronRight size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                        Aucune commande enregistrée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7-DAY TRAFFIC CHART */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Fréquentation & Audience (7 derniers jours)</h2>
                <p className="text-[11px] text-slate-500">Pages vues et visiteurs uniques sur la boutique</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
                  Visiteurs uniques
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
                  Pages vues
                </span>
              </div>
            </div>

            <TrafficChart data={chartData} />
          </div>

        </div>

        {/* RIGHT COLUMN: Moroccan Regional Reach & Live Stream (4 Cols) */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* MOROCCAN REGIONAL PRESENCE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Rayonnement Régional Maroc
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Villes avec la plus forte intention d&apos;achat</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Maroc 🇲🇦
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {visitorsByCity.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">Aucune donnée géographique enregistrée.</div>
              ) : (
                visitorsByCity.map((item, idx) => {
                  const pctOfTotal = totalTopCityVisits > 0 
                    ? Math.round((item._count.id / totalTopCityVisits) * 100) 
                    : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <span className="w-4 text-[10px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                          <span>{item.city}</span>
                        </div>
                        <span className="font-mono font-semibold text-slate-600 text-[11px]">
                          {item._count.id} visites <span className="text-slate-400">({pctOfTotal}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#1D9BF0] to-indigo-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pctOfTotal}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* LIVE ACTIVITY STREAM (Auto-refresh) */}
          <LiveActivityStream initialViews={recentPageViews} />

          {/* ACQUISITION SOURCES */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Compass size={13} className="text-slate-400" />
              Canaux d&apos;Acquisition
            </h2>
            <div className="space-y-2 text-xs">
              {topReferrers.length === 0 ? (
                <div className="text-slate-400 text-xs py-2 text-center">Accès direct prédominant.</div>
              ) : (
                topReferrers.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <span className="text-slate-600 font-medium truncate max-w-[170px]">
                      {r.referrer ? r.referrer.replace('https://', '').replace('http://', '') : 'Accès Direct'}
                    </span>
                    <span className="font-mono text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {r._count.id}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

// 🏷️ Professional Status Badge
function ProfessionalStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    pending: { label: 'En attente', bg: 'bg-slate-100 text-slate-700', text: '', dot: 'bg-slate-400' },
    unconfirmed: { label: 'Non confirmée', bg: 'bg-amber-50 text-amber-800 border border-amber-200/60', text: '', dot: 'bg-amber-500' },
    processing: { label: 'Confirmée / Prépa', bg: 'bg-sky-50 text-sky-800 border border-sky-200/60', text: '', dot: 'bg-[#1D9BF0]' },
    confirmed: { label: 'Confirmée', bg: 'bg-sky-50 text-sky-800 border border-sky-200/60', text: '', dot: 'bg-[#1D9BF0]' },
    shipped: { label: 'En livraison', bg: 'bg-indigo-50 text-indigo-800 border border-indigo-200/60', text: '', dot: 'bg-indigo-500' },
    delivered: { label: 'Livrée & Encaissée', bg: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60', text: '', dot: 'bg-emerald-500' },
    refused: { label: 'Refusée', bg: 'bg-rose-50 text-rose-800 border border-rose-200/60', text: '', dot: 'bg-rose-500' },
    returned: { label: 'Retour Colis', bg: 'bg-rose-50 text-rose-800 border border-rose-200/60', text: '', dot: 'bg-rose-500' },
  };

  const config = configs[status] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700',
    text: '',
    dot: 'bg-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
