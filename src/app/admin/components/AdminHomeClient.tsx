'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckSquare,
  ChevronRight,
  Coins,
  Flame,
  Globe2,
  Headphones,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import TrafficChart from './TrafficChart';
import LiveActivityStream from './LiveActivityStream';
import { CalculatorNumber, PrivacyMask, PrivacyToggleButton } from './PrivacyMask';
import { useAdminTheme } from '@/context/AdminThemeContext';

export interface HomeChartPoint {
  name: string;
  Vues: number;
  Visiteurs: number;
  Revenu: number;
  Commandes: number;
  Conversion: number;
}

export interface FulfillmentStageItem {
  code: string;
  label: string;
  sub: string;
  count: number;
  revenue: number;
  dotColor: string;
  barColor: string;
  numColor: string;
  highlight?: boolean;
  href: string;
}

export interface SerializedOrderItem {
  id: string;
  orderNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  shippingCity: string | null;
  total: number;
  status: string;
  items: string;
}

export interface AdminHomeProps {
  canViewRevenue: boolean;
  adminFirstName: string;
  todayFormatted: string;
  totalRevenue: number;
  last7DaysRevenue: number;
  last7DaysOrdersCount: number;
  deliveredRevenue: number;
  inTransitRevenue: number;
  averageOrderValue: number;
  revenueGrowthText: string;
  isRevenueGrowthPositive: boolean;
  totalOrders: number;
  confirmedCount: number;
  pendingOrders: number;
  unconfirmedCount: number;
  unconfirmedRevenue: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  ordersGrowthText: string;
  isOrdersGrowthPositive: boolean;
  todayVisitorsCount: number;
  totalCustomers: number;
  visitorsGrowthText: string;
  isVisitorsGrowthPositive: boolean;
  activeVisitorsCount: number;
  totalVisitorsCount: number;
  tauxConversionVisiteurs: string;
  tauxConfirmation: string;
  tauxLivraisonExpedie: string;
  tauxRetourGlobal: string;
  deliverabilityPct: number;
  productsCount: number;
  outOfStockCount: number;
  unreadMessagesCount: number;
  openSavCount: number;
  lowStockProducts: Array<{
    id: number;
    slug: string;
    name: string;
    brandLabel: string;
    stock: number;
    inStock: boolean;
  }>;
  topOrderedProducts: Array<{
    slug: string;
    name: string;
    brandLabel: string;
    units: number;
    price: number;
    stock: number;
    inStock: boolean;
  }>;
  openTasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    assigneeName: string | null;
  }>;
  chartData: HomeChartPoint[];
  fulfillmentStages: FulfillmentStageItem[];
  recentOrders: SerializedOrderItem[];
  visitorsByCity: Array<{ city: string; count: number }>;
  totalTopCityVisits: number;
  recentPageViews: any[];
  topReferrers: Array<{ label: string; count: number }>;
}

const formatMAD = (amount: number) =>
  `${new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('MAD', '')
    .trim()} MAD`;

/** Generates a smooth SVG Catmull-Rom spline path through normalized points */
function buildSmoothSplinePath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function AdminHomeClient(props: AdminHomeProps) {
  const {
    canViewRevenue,
    adminFirstName,
    todayFormatted,
    totalRevenue,
    last7DaysRevenue,
    last7DaysOrdersCount,
    deliveredRevenue,
    inTransitRevenue,
    averageOrderValue,
    revenueGrowthText,
    isRevenueGrowthPositive,
    totalOrders,
    confirmedCount,
    pendingOrders,
    unconfirmedCount,
    unconfirmedRevenue,
    processingCount,
    shippedCount,
    deliveredCount,
    ordersGrowthText,
    isOrdersGrowthPositive,
    todayVisitorsCount,
    totalCustomers,
    visitorsGrowthText,
    isVisitorsGrowthPositive,
    activeVisitorsCount,
    totalVisitorsCount,
    tauxConversionVisiteurs,
    tauxConfirmation,
    tauxLivraisonExpedie,
    tauxRetourGlobal,
    deliverabilityPct,
    productsCount,
    outOfStockCount,
    unreadMessagesCount,
    openSavCount,
    lowStockProducts,
    topOrderedProducts,
    openTasks,
    chartData,
    fulfillmentStages,
    recentOrders,
    visitorsByCity,
    totalTopCityVisits,
    recentPageViews,
    topReferrers,
  } = props;

  const { design } = useAdminTheme();
  const accentHex = design?.accentColor || '#0ea5e9';
  const [heroScope, setHeroScope] = useState<'GLOBAL' | '7J'>('GLOBAL');
  const [stageView, setStageView] = useState<'AUDIENCE' | 'SPLINE'>('AUDIENCE');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  const displayedHeroValue = useMemo(() => {
    if (!canViewRevenue) {
      return heroScope === '7J' ? `${last7DaysOrdersCount} cmd` : `${confirmedCount} colis`;
    }
    return heroScope === '7J' ? formatMAD(last7DaysRevenue) : formatMAD(totalRevenue);
  }, [canViewRevenue, heroScope, last7DaysOrdersCount, confirmedCount, last7DaysRevenue, totalRevenue]);

  // Panoramic Bezier spline coordinates (640 x 190) for Signal Spline mode
  const splineGeometry = useMemo(() => {
    const W = 640;
    const H = 190;
    const padX = 24;
    const padTop = 24;
    const padBottom = 18;
    const usableW = W - padX * 2;
    const usableH = H - padTop - padBottom;

    const vals = chartData.map((d) => (canViewRevenue ? d.Revenu || 0 : d.Commandes || 0));
    const maxVal = Math.max(...vals, 1);

    const points = chartData.map((d, idx) => {
      const val = vals[idx];
      const x = chartData.length > 1 ? padX + (idx / (chartData.length - 1)) * usableW : W / 2;
      const ratio = val / maxVal;
      const y = padTop + usableH - ratio * usableH;
      return {
        x,
        y,
        val,
        orders: d.Commandes || 0,
        visitors: d.Visiteurs || 0,
        views: d.Vues || 0,
        label: d.name.split(' ')[0].replace('.', ''),
        fullName: d.name,
      };
    });

    const strokePath = buildSmoothSplinePath(points);
    const areaPath =
      points.length > 0
        ? `${strokePath} L ${points[points.length - 1].x.toFixed(1)} ${H} L ${points[0].x.toFixed(1)} ${H} Z`
        : '';

    return { W, H, points, strokePath, areaPath };
  }, [chartData, canViewRevenue]);

  // SVG Radial Dual-Arc metrics for Operational Health Cockpit
  const confirmNum = Math.min(Math.max(parseFloat(tauxConfirmation) || 0, 0), 100);
  const deliverNum = Math.min(Math.max(parseFloat(tauxLivraisonExpedie) || 0, 0), 100);
  const outerR = 32;
  const innerR = 23;
  const outerC = 2 * Math.PI * outerR;
  const innerC = 2 * Math.PI * innerR;

  const activePoint =
    hoveredDayIdx !== null
      ? splineGeometry.points[hoveredDayIdx]
      : splineGeometry.points[splineGeometry.points.length - 1];

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-5 pb-6 font-sans text-slate-900 dark:text-slate-100">
      {/* ── PHONE-NATIVE HERO & EXPRESS TELEMETRY (< 768px) ─────────────────── */}
      <div className="md:hidden space-y-4">
        {/* Executive Mobile Hero Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="relative overflow-hidden rounded-[26px] p-4.5 text-white shadow-xl"
          style={{
            background: `linear-gradient(145deg, #0b1326 0%, #0f1d38 58%, ${accentHex}dd 140%)`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{adminFirstName} · {todayFormatted.split(' ').slice(0, 2).join(' ')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <PrivacyToggleButton variant="greeting-pill" />
              <div className="inline-flex items-center p-0.5 rounded-lg bg-white/10 text-[10px] font-bold">
                {(['GLOBAL', '7J'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setHeroScope(tab)}
                    className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                      heroScope === tab ? 'bg-white text-slate-950' : 'text-white/70'
                    }`}
                  >
                    {tab === 'GLOBAL' ? 'Global' : '7J'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-white/65 font-semibold">
                {canViewRevenue ? "Chiffre d'Affaires" : 'Colis Validés'}
              </div>
              <div className="text-[28px] font-black tracking-tight tabular-nums leading-tight mt-0.5">
                <CalculatorNumber value={displayedHeroValue} mask="•••••• MAD" duration={680} />
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-full ${
                isRevenueGrowthPositive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-200'
              }`}
            >
              <TrendingUp size={11} />
              {revenueGrowthText}
            </span>
          </div>

          {canViewRevenue && (
            <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-white/15 text-[11px]">
              <div className="rounded-xl bg-white/[0.08] px-2.5 py-2">
                <span className="text-white/65 block text-[9.5px] uppercase font-bold">Encaissé Net</span>
                <span className="font-mono font-extrabold text-emerald-300 tabular-nums">
                  <PrivacyMask value={formatMAD(deliveredRevenue)} mask="••• MAD" />
                </span>
              </div>
              <div className="rounded-xl bg-white/[0.08] px-2.5 py-2">
                <span className="text-white/65 block text-[9.5px] uppercase font-bold">COD En Cours</span>
                <span className="font-mono font-extrabold text-sky-200 tabular-nums">
                  <PrivacyMask value={formatMAD(inTransitRevenue)} mask="••• MAD" />
                </span>
              </div>
            </div>
          )}

          {/* Thumb-Zone Primary CTAs */}
          <div className="grid grid-cols-2 gap-2 mt-3.5">
            <Link
              href="/admin/orders"
              className="h-10 rounded-xl bg-white text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <ShoppingBag size={14} />
              <span>Commandes</span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-mono">
                <PrivacyMask value={pendingOrders + unconfirmedCount} mask="••" />
              </span>
            </Link>
            <Link
              href="/admin/orders?tab=UNCONFIRMED"
              className="h-10 rounded-xl bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Phone size={13.5} />
              <span>Confirmer ({unconfirmedCount})</span>
            </Link>
          </div>
        </motion.div>

        {/* Compact 2x2 Phone KPI Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/85 dark:border-white/[0.08]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Commandes</span>
              <span className="text-emerald-600 dark:text-emerald-400">{ordersGrowthText}</span>
            </div>
            <div className="text-xl font-black font-mono mt-1 tabular-nums">{totalOrders}</div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              {pendingOrders + unconfirmedCount} à traiter
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/85 dark:border-white/[0.08]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Audience / j</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xl font-black font-mono mt-1 tabular-nums">{todayVisitorsCount}</div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              {activeVisitorsCount} en ligne · {tauxConversionVisiteurs}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/85 dark:border-white/[0.08]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Panier Moyen</span>
              <span className="text-sky-600 dark:text-sky-400">COD</span>
            </div>
            <div className="text-xl font-black font-mono mt-1 tabular-nums">
              {canViewRevenue ? formatMAD(averageOrderValue) : `${totalCustomers} clients`}
            </div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              {productsCount} parfums actifs
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/85 dark:border-white/[0.08]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Délivrabilité</span>
              <span className="text-rose-500 font-mono">{tauxRetourGlobal}% ret.</span>
            </div>
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {tauxLivraisonExpedie}%
            </div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              {deliveredCount} colis clôturés
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. EDITORIAL ATELIER MASTHEAD (DESKTOP / TABLET) ───────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-white/[0.08]"
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Boutique active</span>
            </span>
            <span className="text-slate-300 dark:text-zinc-700">·</span>
            <span className="capitalize">{todayFormatted}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {canViewRevenue ? `Bonjour, ${adminFirstName}` : `Opérations COD · ${adminFirstName}`}
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400">
            {canViewRevenue ? (
              <>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  <PrivacyMask value={pendingOrders + unconfirmedCount} mask="••" /> commande(s)
                </span>{' '}
                en attente de validation •{' '}
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  <PrivacyMask value={deliveredCount} mask="••" /> livrées
                </span>{' '}
                et encaissées.
              </>
            ) : (
              'Suivi téléphonique des commandes, préparation atelier et coordination transporteur.'
            )}
          </p>
        </div>

        {/* Inline Executive Action Toolbar */}
        <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
          <PrivacyToggleButton variant="greeting-pill" />

          <Link
            href="/admin/tasks"
            className="inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#10182b] dark:hover:bg-[#17223b] border border-slate-200/90 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs shrink-0"
          >
            <CheckSquare size={13} style={{ color: accentHex }} />
            <span>Missions</span>
          </Link>

          <Link
            href="/admin/orders"
            style={{ backgroundColor: accentHex }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 h-10 sm:h-9 px-4 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all"
          >
            <ShoppingBag size={13.5} className="text-white shrink-0" />
            <span className="truncate">Traiter Commandes</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10.5px] font-bold tabular-nums shrink-0">
              <PrivacyMask value={pendingOrders + unconfirmedCount} mask="••" />
            </span>
          </Link>
        </div>
      </motion.div>

      {/* ── 2. UNIFIED 4-COLUMN ARCHITECTURAL KPI LEDGER STRIP (DESKTOP/TABLET) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:grid rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs overflow-hidden grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/[0.06]"
      >
        {/* Col 1: Primary Ledger Anchor (Chiffre d'Affaires / Colis Validés) */}
        <div
          className="p-5 sm:p-6 flex flex-col justify-between relative border-t-[3px]"
          style={{ borderTopColor: accentHex }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <Coins size={13} style={{ color: accentHex }} />
              <span>{canViewRevenue ? "Chiffre d'Affaires" : 'Colis Validés'}</span>
            </span>

            {/* Global / 7J Scope Morph */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-[10px] font-bold">
              {(
                [
                  { id: 'GLOBAL', label: 'Global' },
                  { id: '7J', label: '7J' },
                ] as const
              ).map((tab) => {
                const active = heroScope === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHeroScope(tab.id)}
                    className={`relative px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      active
                        ? 'text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nay-ledger-scope"
                        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                        className="absolute inset-0 rounded-md"
                        style={{ backgroundColor: accentHex }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroScope}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none"
                >
                  <CalculatorNumber value={displayedHeroValue} mask="•••••• MAD" duration={760} />
                </motion.div>
              </AnimatePresence>

              <span
                className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
                  isRevenueGrowthPositive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                <TrendingUp size={10.5} />
                {revenueGrowthText}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
            {canViewRevenue ? (
              <div className="flex items-center gap-3">
                <span className="text-slate-500 dark:text-slate-400">
                  Encaissé :{' '}
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    <PrivacyMask value={formatMAD(deliveredRevenue)} mask="•••" />
                  </strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-slate-500 dark:text-slate-400">
                  COD :{' '}
                  <strong className="font-mono text-slate-800 dark:text-slate-200">
                    <PrivacyMask value={formatMAD(inTransitRevenue)} mask="•••" />
                  </strong>
                </span>
              </div>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">Volume confirmé</span>
            )}
            <Link
              href="/admin/finance"
              className="text-[#0284c7] dark:text-[#38bdf8] font-semibold hover:underline inline-flex items-center gap-0.5 shrink-0"
            >
              <span>Livre</span>
              <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>

        {/* Col 2: Flux Commandes + Micro Bar Sparkline */}
        <div className="p-5 sm:p-6 flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <ShoppingBag size={13} className="text-slate-600 dark:text-slate-300" />
              <span>Flux Commandes</span>
            </span>
            <span
              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
                isOrdersGrowthPositive
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {ordersGrowthText}
            </span>
          </div>

          <div className="my-3.5 flex items-end justify-between gap-3">
            <div>
              <div className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                <CalculatorNumber value={totalOrders} mask="••" duration={700} />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {confirmedCount} validées ({tauxConfirmation}%)
              </div>
            </div>

            {/* 7-Day Micro-Bars (High-Contrast Light & Dark Mode) */}
            <div className="flex items-end gap-1.5 h-11 w-28 shrink-0 px-1.5 py-1 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07]">
              {chartData.map((d, i) => {
                const maxOrd = Math.max(...chartData.map((c) => c.Commandes || 0), 1);
                const ordersCount = d.Commandes || 0;
                const h = ordersCount > 0
                  ? Math.max(Math.round((ordersCount / maxOrd) * 100), 28)
                  : 14;
                const isToday = i === chartData.length - 1;
                return (
                  <div
                    key={d.name}
                    title={`${d.name} : ${ordersCount} commande${ordersCount > 1 ? 's' : ''}`}
                    className="flex-1 h-full flex items-end justify-center group/bar relative"
                  >
                    <div
                      style={{
                        height: `${h}%`,
                        ['--bar-index' as any]: i,
                        ...(ordersCount > 0 || isToday
                          ? {
                              backgroundColor: accentHex,
                              opacity: isToday ? 1 : 0.48,
                            }
                          : {}),
                      }}
                      className={`nay-bar-rise w-full rounded-sm transition-opacity group-hover/bar:opacity-100 ${
                        ordersCount > 0 || isToday
                          ? ''
                          : 'bg-slate-300/90 dark:bg-white/20'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              En attente : <strong className="font-mono text-amber-600 dark:text-amber-400">{unconfirmedCount}</strong>
            </span>
            <Link
              href="/admin/orders"
              className="text-slate-700 dark:text-slate-300 font-semibold hover:text-[#0284c7] inline-flex items-center gap-0.5"
            >
              <span>Gérer</span>
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* Col 3: Audience Live & Conversion */}
        <div className="p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <Users size={13} className="text-slate-600 dark:text-slate-300" />
              <span>Audience &amp; Direct</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-[#0284c7] dark:text-[#38bdf8]">
              {tauxConversionVisiteurs}% conv.
            </span>
          </div>

          <div className="my-3.5 flex items-baseline justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                  <CalculatorNumber value={todayVisitorsCount} duration={700} />
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">visites / j</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {activeVisitorsCount} en ligne
                </span>
                <span>•</span>
                <span>{totalCustomers} CRM</span>
              </div>
            </div>

            <span
              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                isVisitorsGrowthPositive
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
              }`}
            >
              {visitorsGrowthText}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              Total cumulé : <strong className="font-mono text-slate-700 dark:text-slate-200">{totalVisitorsCount.toLocaleString('fr-FR')}</strong>
            </span>
            <Link
              href="/admin/analytics"
              className="text-slate-700 dark:text-slate-300 font-semibold hover:text-[#0284c7] inline-flex items-center gap-0.5"
            >
              <span>Analytics</span>
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* Col 4: Panier Moyen & Qualité Livraison */}
        <div className="p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <Activity size={13} className="text-slate-600 dark:text-slate-300" />
              <span>{canViewRevenue ? 'Panier & Qualité' : 'Qualité Livraison'}</span>
            </span>
            <span className="text-[10.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {deliverabilityPct}% net
            </span>
          </div>

          <div className="my-3.5 space-y-2">
            {canViewRevenue ? (
              <div className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                <CalculatorNumber value={formatMAD(averageOrderValue)} mask="••• MAD" duration={720} />
              </div>
            ) : (
              <div className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                {tauxLivraisonExpedie}%
              </div>
            )}

            <div className="space-y-1">
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden flex">
                <div
                  className="nay-progress-fill h-full bg-emerald-500"
                  style={{ width: `${deliverNum}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
                <span>Livraison : <strong className="text-slate-800 dark:text-slate-200">{tauxLivraisonExpedie}%</strong></span>
                <span>Retours : <strong className="text-rose-600 dark:text-rose-400">{tauxRetourGlobal}%</strong></span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              Catalogue : <strong className="font-mono text-slate-800 dark:text-slate-200">{productsCount}</strong>
            </span>
            <Link
              href="/admin/customers"
              className="text-slate-700 dark:text-slate-300 font-semibold hover:text-[#0284c7] inline-flex items-center gap-0.5"
            >
              <span>Clients</span>
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── 3. PANORAMIC TELEMETRY STAGE (8 COLS) + OPERATIONS COCKPIT (4 COLS) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 8 COLS: Switchable Telemetry Stage */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="xl:col-span-8 h-full rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs flex flex-col justify-between space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-white/[0.07]">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Courbe d&apos;Audience &amp; Performance (7 jours)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Croisement en direct des visites, pages consultées et volume COD
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Spring-Animated Stage View Mode Switch */}
              <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.08] text-[11px] font-semibold">
                {(
                  [
                    { id: 'AUDIENCE', label: 'Multi-Courbes' },
                    { id: 'SPLINE', label: 'Signal Express' },
                  ] as const
                ).map((mode) => {
                  const active = stageView === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setStageView(mode.id)}
                      className={`relative px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        active ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="nay-home-stage-mode"
                          transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                          className="absolute inset-0 rounded-lg"
                          style={{ backgroundColor: accentHex }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="relative z-10">{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              <Link
                href="/admin/analytics"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0284c7] dark:hover:text-[#38bdf8] transition-colors"
              >
                <span>Rapport</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {stageView === 'AUDIENCE' ? (
              <motion.div
                key="AUDIENCE"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <TrafficChart data={chartData} canViewRevenue={canViewRevenue} />
              </motion.div>
            ) : (
              <motion.div
                key="SPLINE"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Dark Editorial Panoramic Spline Instrument */}
                <div className="rounded-xl bg-[#0b1322] border border-slate-800 p-4 sm:p-5 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
                    <span className="text-slate-400 font-medium">
                      Survolez un point pour isoler le jour
                    </span>
                    {activePoint && (
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="font-bold" style={{ color: accentHex }}>{activePoint.fullName}</span>
                        <span className="text-slate-500">•</span>
                        <span>{activePoint.orders} cmd</span>
                        <span className="text-slate-500">•</span>
                        <span>{activePoint.visitors} visites</span>
                        {canViewRevenue && (
                          <>
                            <span className="text-slate-500">•</span>
                            <span className="text-emerald-300 font-bold">{formatMAD(activePoint.val)}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <svg
                    viewBox={`0 0 ${splineGeometry.W} ${splineGeometry.H}`}
                    className="w-full h-44 overflow-visible"
                    onMouseLeave={() => setHoveredDayIdx(null)}
                  >
                    <defs>
                      <linearGradient id="nayEditorialSplineArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accentHex} stopOpacity={0.34} />
                        <stop offset="100%" stopColor={accentHex} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="nayEditorialSplineStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={accentHex} />
                        <stop offset="100%" stopColor={accentHex} stopOpacity={0.85} />
                      </linearGradient>
                    </defs>

                    <line x1="24" y1="55" x2="616" y2="55" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <line x1="24" y1="115" x2="616" y2="115" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                    {splineGeometry.areaPath && (
                      <motion.path
                        d={splineGeometry.areaPath}
                        fill="url(#nayEditorialSplineArea)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                      />
                    )}

                    {splineGeometry.strokePath && (
                      <motion.path
                        d={splineGeometry.strokePath}
                        fill="none"
                        stroke="url(#nayEditorialSplineStroke)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}

                    {splineGeometry.points.map((pt, i) => {
                      const isLast = i === splineGeometry.points.length - 1;
                      const isHot = hoveredDayIdx === i || (hoveredDayIdx === null && isLast);
                      return (
                        <g
                          key={pt.fullName}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredDayIdx(i)}
                        >
                          <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />
                          {isHot && (
                            <motion.circle
                              cx={pt.x}
                              cy={pt.y}
                              r="8"
                              fill={accentHex}
                              fillOpacity={0.28}
                              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.2, 0.6] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHot ? 4.2 : 2.5}
                            fill={isHot ? '#ffffff' : accentHex}
                            stroke={accentHex}
                            strokeWidth={isHot ? 2 : 0}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  <div className="grid grid-cols-7 text-center mt-2 pt-2 border-t border-white/[0.08]">
                    {splineGeometry.points.map((pt, i) => (
                      <button
                        type="button"
                        key={pt.fullName}
                        onMouseEnter={() => setHoveredDayIdx(i)}
                        style={
                          hoveredDayIdx === i || (hoveredDayIdx === null && i === splineGeometry.points.length - 1)
                            ? { color: accentHex }
                            : undefined
                        }
                        className={`text-[10.5px] font-mono cursor-pointer transition-colors ${
                          hoveredDayIdx === i || (hoveredDayIdx === null && i === splineGeometry.points.length - 1)
                            ? 'font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* RIGHT 4 COLS: Operational Health Radial + Priority Dispatch + Live Treasury Summary */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.44, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="xl:col-span-4 h-full rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs p-5 flex flex-col justify-between gap-4"
        >
          {/* Top Health Gauge Block */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.07]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Santé Opérationnelle
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                COD Temps Réel
              </span>
            </div>

            <div className="flex items-center gap-4 pt-3.5">
              <svg viewBox="0 0 78 78" className="w-[72px] h-[72px] shrink-0 -rotate-90">
                <circle cx="39" cy="39" r={outerR} fill="none" stroke="currentColor" strokeWidth="5.5" className="text-slate-100 dark:text-white/[0.06]" />
                <motion.circle
                  cx="39"
                  cy="39"
                  r={outerR}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeDasharray={outerC}
                  initial={{ strokeDashoffset: outerC }}
                  animate={{ strokeDashoffset: outerC - (outerC * confirmNum) / 100 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                />
                <circle cx="39" cy="39" r={innerR} fill="none" stroke="currentColor" strokeWidth="4.5" className="text-slate-100 dark:text-white/[0.06]" />
                <motion.circle
                  cx="39"
                  cy="39"
                  r={innerR}
                  fill="none"
                  stroke={accentHex}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={innerC}
                  initial={{ strokeDashoffset: innerC }}
                  animate={{ strokeDashoffset: innerC - (innerC * deliverNum) / 100 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                />
              </svg>

              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Confirmation
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">{tauxConfirmation}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentHex }} />
                    Livraison
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">{tauxLivraisonExpedie}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Retours
                  </span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">{tauxRetourGlobal}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Queue Rows (Dense Operational Feed) */}
          <div className="space-y-2 flex-1 flex flex-col justify-center">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-0.5">
              File d&apos;Action Rapide
            </div>

            <Link
              href="/admin/orders?tab=UNCONFIRMED"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] hover:bg-amber-50/70 dark:hover:bg-amber-500/10 border border-slate-200/80 dark:border-white/[0.07] border-l-2 border-l-amber-500 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {unconfirmedCount} à confirmer
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                <PrivacyMask value={formatMAD(unconfirmedRevenue)} mask="••• MAD" />
              </span>
            </Link>

            <Link
              href="/admin/orders?tab=PROCESSING"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.07] transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Package size={13.5} className="text-[#0284c7] dark:text-[#38bdf8] shrink-0" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {processingCount} en préparation atelier
                </span>
              </div>
              <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/admin/orders?tab=SHIPPED"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.07] transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Truck size={13.5} className="text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {shippedCount} colis en transit livraison
                </span>
              </div>
              <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/admin/inventory"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.07] transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle
                  size={13.5}
                  className={outOfStockCount > 0 ? 'text-rose-500 shrink-0' : 'text-emerald-500 shrink-0'}
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {outOfStockCount > 0
                    ? `${outOfStockCount} rupture(s) sur ${productsCount} parfums`
                    : `${productsCount} parfums en vitrine prêts`}
                </span>
              </div>
              <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/admin/sav"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.07] transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Headphones size={13.5} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {openSavCount} ticket(s) SAV · {unreadMessagesCount} message(s)
                </span>
              </div>
              <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Bottom Summary Pulse Bar + Footer Link */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {canViewRevenue ? 'Encaissé Net' : 'Livrées'}
                </div>
                <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                  {canViewRevenue ? (
                    <PrivacyMask value={formatMAD(deliveredRevenue)} mask="••• MAD" />
                  ) : (
                    `${deliveredCount} colis`
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {canViewRevenue ? 'COD En Cours' : 'En Ligne'}
                </div>
                <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  {canViewRevenue ? (
                    <PrivacyMask value={formatMAD(inTransitRevenue)} mask="••• MAD" />
                  ) : (
                    `${activeVisitorsCount} visites`
                  )}
                </div>
              </div>
            </div>

            <Link
              href="/admin/marketing"
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0284c7] dark:hover:text-[#38bdf8] flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/[0.07]"
            >
              <span>Ouvrir Rétention &amp; CRM</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── 4. CONNECTED HORIZONTAL LOGISTICS RUNWAY ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xs overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Cycle Logistique &amp; COD
            </h2>
            <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              <PrivacyMask value={totalOrders} mask="••" /> colis suivis
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Délivrabilité :{' '}
              <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {deliverabilityPct}%
              </strong>
            </span>
            <Link
              href="/admin/orders"
              className="font-semibold text-[#0284c7] dark:text-[#38bdf8] hover:underline inline-flex items-center gap-1"
            >
              <span>Pipeline complet</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Continuous Proportion Rail */}
        <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.05] flex overflow-hidden">
          {totalOrders > 0 &&
            fulfillmentStages.map((stage) => {
              const w = (stage.count / totalOrders) * 100;
              if (w <= 0) return null;
              return (
                <div
                  key={stage.code}
                  style={{ width: `${w}%` }}
                  className={`${stage.barColor} nay-progress-fill h-full`}
                  title={`${stage.label} : ${stage.count} colis`}
                />
              );
            })}
        </div>

        {/* Mobile Horizontal Snap Pipeline Stages */}
        <div className="md:hidden nay-mobile-snap-row gap-2.5 p-3">
          {fulfillmentStages.map((stage) => {
            const sharePct = totalOrders > 0 ? Math.round((stage.count / totalOrders) * 100) : 0;
            return (
              <Link
                key={stage.code}
                href={stage.href}
                className="nay-mobile-snap-card w-[150px] p-3 rounded-2xl bg-slate-50/85 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between active:scale-95 transition-transform"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${stage.dotColor}`} />
                    {stage.code}
                  </span>
                  <span>{sharePct}%</span>
                </div>
                <div className="mt-2">
                  <div className={`text-xl font-black font-mono tabular-nums ${stage.numColor}`}>
                    {stage.count}
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                    {stage.label}
                  </div>
                  <div className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                    {formatMAD(stage.revenue)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop 6-Column Logistics Runway */}
        <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/[0.06]">
          {fulfillmentStages.map((stage) => {
            const sharePct = totalOrders > 0 ? Math.round((stage.count / totalOrders) * 100) : 0;
            return (
              <Link
                key={stage.code}
                href={stage.href}
                className="p-4 sm:p-4.5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className={`w-1.5 h-1.5 rounded-full ${stage.dotColor}`} />
                    <span>{stage.code}</span>
                  </span>
                  <span>{sharePct}%</span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-xl font-extrabold font-mono tabular-nums ${stage.numColor}`}>
                    <CalculatorNumber value={stage.count} mask="••" duration={680} />
                  </span>
                  <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                    <PrivacyMask value={formatMAD(stage.revenue)} mask="••• MAD" />
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <span>{stage.label}</span>
                  {stage.highlight && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </div>
                <div className="text-[10.5px] text-slate-400 mt-0.5 truncate">{stage.sub}</div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* ── 5. LOWER LEDGER & REGIONAL TELEMETRY (8 + 4 BALANCED COLUMNS) ──── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 8 COLS: Dernières Commandes + Executive Product & Stock/Tasks Pair */}
        <div className="xl:col-span-8 flex flex-col gap-5 h-full">
          <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Dernières Commandes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Confirmation téléphonique et contact WhatsApp direct
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-[#0284c7] dark:text-[#38bdf8] hover:underline flex items-center gap-1"
              >
                <span>Toutes (<PrivacyMask value={totalOrders} mask="••" />)</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {/* Mobile Native Order Cards (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
              {recentOrders.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-slate-400">
                  Aucune commande enregistrée.
                </div>
              ) : (
                recentOrders.map((order) => {
                  const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
                  const waPhone = cleanPhone.startsWith('0') ? `212${cleanPhone.slice(1)}` : cleanPhone;
                  const waMessage = encodeURIComponent(
                    `Bonjour ${order.customerName || ''}, nous vous contactons de la Maison NAY Parfums concernant votre commande ${order.orderNumber || ''}.`
                  );
                  return (
                    <div key={order.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.08] font-extrabold text-[11px] flex items-center justify-center shrink-0">
                            {(order.customerName || 'Client').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {order.customerName || 'Client NAY'}
                            </div>
                            <div className="text-[10.5px] font-mono text-slate-400">
                              #{order.orderNumber || order.id.slice(0, 8)} · {order.shippingCity || 'Maroc'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {canViewRevenue && (
                            <div className="text-xs font-black font-mono text-slate-900 dark:text-white tabular-nums">
                              <PrivacyMask value={formatMAD(order.total)} mask="•••• MAD" />
                            </div>
                          )}
                          <div className="mt-0.5">
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-0.5">
                        {order.customerPhone ? (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="h-9 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <Phone size={12} />
                            <span>Appeler</span>
                          </a>
                        ) : (
                          <span className="h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 text-[11px] flex items-center justify-center">
                            Sans tél
                          </span>
                        )}
                        {order.customerPhone ? (
                          <a
                            href={`https://wa.me/${waPhone}?text=${waMessage}`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-9 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <MessageCircle size={12} />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <span className="h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 text-[11px] flex items-center justify-center">
                            -
                          </span>
                        )}
                        <Link
                          href={`/admin/orders?highlight=${order.id}`}
                          className="h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[11px] font-bold flex items-center justify-center gap-1"
                        >
                          <span>Gérer</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold tracking-wider border-b border-slate-100 dark:border-white/[0.06]">
                  <tr>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Ville &amp; Contact</th>
                    <th className="px-5 py-3">{canViewRevenue ? 'Montant' : 'Articles'}</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {recentOrders.map((order) => {
                    const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
                    const waPhone = cleanPhone.startsWith('0') ? `212${cleanPhone.slice(1)}` : cleanPhone;
                    const waMessage = encodeURIComponent(
                      `Bonjour ${order.customerName || ''}, nous vous contactons de la Maison NAY Parfums concernant votre commande ${order.orderNumber || ''}.`
                    );

                    let itemCount = 1;
                    try {
                      itemCount = JSON.parse(order.items || '[]').length || 1;
                    } catch {
                      itemCount = 1;
                    }

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center shrink-0">
                              {(order.customerName || 'Client').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                                {order.customerName || 'Client NAY'}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                                #{order.orderNumber || order.id.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                          <div className="font-medium text-slate-800 dark:text-white">
                            {order.shippingCity || 'Casablanca'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {order.customerPhone || 'N/A'}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          {canViewRevenue ? (
                            <div className="font-bold text-slate-900 dark:text-white text-xs tabular-nums">
                              <PrivacyMask value={formatMAD(order.total)} mask="•••• MAD" />
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              {itemCount} parfum{itemCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {order.customerPhone && (
                              <a
                                href={`https://wa.me/${waPhone}?text=${waMessage}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp"
                                className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white flex items-center justify-center transition-all"
                              >
                                <MessageCircle size={13} />
                              </a>
                            )}
                            {order.customerPhone && (
                              <a
                                href={`tel:${order.customerPhone}`}
                                title="Appeler"
                                className="w-7 h-7 rounded-lg bg-sky-500/10 hover:bg-sky-600 text-sky-600 hover:text-white flex items-center justify-center transition-all"
                              >
                                <Phone size={13} />
                              </a>
                            )}
                            <Link
                              href={`/admin/orders?highlight=${order.id}`}
                              title="Ouvrir"
                              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all"
                            >
                              <ChevronRight size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {recentOrders.length === 0 && (
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

          {/* Balanced Lower Pair Filling Column 8 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
            {/* Sub-card A: Top Parfums Vendus */}
            <div className="rounded-2xl p-5 bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.07]">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Flame size={13.5} style={{ color: accentHex }} />
                      <span>Top Parfums Commandés</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Rotation réelle des ventes valides</p>
                  </div>
                  <Link
                    href="/admin/products"
                    className="text-[11px] font-semibold text-[#0284c7] dark:text-[#38bdf8] hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Catalogue</span>
                    <ArrowUpRight size={11} />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.05] mt-2">
                  {topOrderedProducts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Aucune vente comptabilisée.
                    </div>
                  ) : (
                    topOrderedProducts.map((item, idx) => (
                      <Link
                        key={item.slug}
                        href="/admin/products"
                        className="flex items-center justify-between gap-2.5 py-2.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.03] -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-white/[0.07] text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </div>
                            <div className="text-[10.5px] text-slate-400 truncate">
                              {item.brandLabel}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                            {item.units} vendu{item.units > 1 ? 's' : ''}
                          </div>
                          {canViewRevenue && item.price > 0 && (
                            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatMAD(item.price)}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sub-card B: Alertes Stock & Missions Actives */}
            <div className="rounded-2xl p-5 bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.07]">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <AlertTriangle size={13.5} className="text-amber-500" />
                      <span>Alertes Stock &amp; Missions</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Réassort urgent et tâches équipe</p>
                  </div>
                  <Link
                    href="/admin/inventory"
                    className="text-[11px] font-semibold text-[#0284c7] dark:text-[#38bdf8] hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Stocks</span>
                    <ArrowUpRight size={11} />
                  </Link>
                </div>

                <div className="space-y-2 mt-3">
                  {lowStockProducts.length === 0 ? (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl p-2.5 font-medium">
                      Tous les flacons sont en stock optimal.
                    </div>
                  ) : (
                    lowStockProducts.slice(0, 3).map((prod) => (
                      <Link
                        key={prod.id}
                        href="/admin/inventory"
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] hover:border-amber-400/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {prod.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{prod.brandLabel}</div>
                        </div>
                        <span
                          className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                            prod.stock <= 0 || !prod.inStock
                              ? 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {prod.stock <= 0 || !prod.inStock ? 'Rupture' : `${prod.stock} rest.`}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Missions en cours</span>
                  <Link href="/admin/tasks" className="text-[#0284c7] dark:text-[#38bdf8] hover:underline">
                    Voir tout
                  </Link>
                </div>
                {openTasks.length === 0 ? (
                  <div className="text-xs text-slate-400 py-1">Aucune mission en attente.</div>
                ) : (
                  openTasks.slice(0, 2).map((task) => (
                    <Link
                      key={task.id}
                      href="/admin/tasks"
                      className="flex items-center justify-between gap-2 text-xs py-1 text-slate-700 dark:text-slate-200 hover:text-[#0284c7]"
                    >
                      <span className="truncate font-medium">• {task.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.07] shrink-0">
                        {task.priority}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: GEOGRAPHY, LIVE STREAM & REFERRERS */}
        <div className="xl:col-span-4 flex flex-col gap-5 h-full">
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.07]">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Rayonnement Maroc
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Top villes par intention d&apos;achat</p>
              </div>
              <MapPin size={14} className="text-[#0284c7] dark:text-[#38bdf8]" />
            </div>

            <div className="space-y-3">
              {visitorsByCity.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">Aucune donnée géographique enregistrée.</div>
              ) : (
                visitorsByCity.map((item, idx) => {
                  const pctOfTotal = totalTopCityVisits > 0 ? Math.round((item.count / totalTopCityVisits) * 100) : 0;
                  return (
                    <div key={item.city} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                          <span className="text-slate-400 font-mono text-[10px]">0{idx + 1}</span>
                          <span>{item.city}</span>
                        </div>
                        <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                          {item.count.toLocaleString('fr-FR')} ({pctOfTotal}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="nay-progress-fill bg-[#0ea5e9] h-full rounded-full"
                          style={{ width: `${Math.max(pctOfTotal, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <LiveActivityStream initialViews={recentPageViews} />

          <div className="rounded-2xl p-5 bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.07]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Sources d&apos;Acquisition
                </h2>
                <Globe2 size={13.5} className="text-slate-400" />
              </div>
              <div className="space-y-1 text-xs mt-2">
                {topReferrers.length === 0 ? (
                  <div className="text-slate-400 text-xs py-3 text-center">Accès direct prédominant.</div>
                ) : (
                  topReferrers.map((r, i) => (
                    <div
                      key={`${r.label}-${i}`}
                      className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/[0.06] last:border-0"
                    >
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[190px]">
                        {r.label}
                      </span>
                      <span className="font-mono text-slate-900 dark:text-white font-bold text-[11px] tabular-nums">
                        {r.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <Link
              href="/admin/analytics"
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0284c7] dark:hover:text-[#38bdf8] flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/[0.07]"
            >
              <span>Audience &amp; Acquisition détaillée</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; bg: string; dot: string }> = {
    pending: {
      label: 'En attente',
      bg: 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10',
      dot: 'bg-slate-400',
    },
    unconfirmed: {
      label: 'Non confirmée',
      bg: 'bg-amber-500/[0.08] text-amber-700 dark:text-amber-400 border border-amber-500/20',
      dot: 'bg-amber-500',
    },
    processing: {
      label: 'Préparation',
      bg: 'bg-sky-500/[0.08] text-[#0284C7] dark:text-[#38BDF8] border border-sky-500/20',
      dot: 'bg-[#0EA5E9]',
    },
    confirmed: {
      label: 'Confirmée',
      bg: 'bg-sky-500/[0.08] text-[#0284C7] dark:text-[#38BDF8] border border-sky-500/20',
      dot: 'bg-[#0EA5E9]',
    },
    shipped: {
      label: 'En livraison',
      bg: 'bg-sky-500/12 text-[#0369A1] dark:text-[#7DD3FC] border border-sky-500/25',
      dot: 'bg-[#0284C7]',
    },
    delivered: {
      label: 'Livrée',
      bg: 'bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
      dot: 'bg-emerald-500',
    },
    refused: {
      label: 'Refusée',
      bg: 'bg-rose-500/[0.08] text-rose-700 dark:text-rose-400 border border-rose-500/20',
      dot: 'bg-rose-500',
    },
    returned: {
      label: 'Retour',
      bg: 'bg-rose-500/[0.08] text-rose-700 dark:text-rose-400 border border-rose-500/20',
      dot: 'bg-rose-500',
    },
  };

  const config = configs[status] || {
    label: status,
    bg: 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
