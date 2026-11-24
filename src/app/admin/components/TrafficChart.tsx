'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, 
  BarChart, Bar,
  LineChart as RechartsLineChart, Line,
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Eye, Users, TrendingUp, Calendar, 
  BarChart2, LineChart as LineIcon, Layers,
  ShoppingBag, Coins, ChevronRight, CheckCircle2,
  Activity, ArrowUpRight
} from 'lucide-react';
import { useAdminTheme } from '@/context/AdminThemeContext';

interface TrafficChartProps {
  data: Array<{
    name: string;
    Vues: number;
    Visiteurs: number;
    Revenu?: number;
    Commandes?: number;
    Conversion?: number;
  }>;
  canViewRevenue?: boolean;
}

interface TrafficCustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metricTab: 'TRAFFIC' | 'REVENUE' | 'ORDERS';
  chartColors: { primary: string; secondary: string; revenue: string; orders: string };
  effectiveCanViewRevenue: boolean;
  isPrivacyHidden: boolean;
  formatMAD: (amount: number) => string;
}

function TrafficCustomTooltip({
  active,
  payload,
  label,
  metricTab,
  chartColors,
  effectiveCanViewRevenue,
  isPrivacyHidden,
  formatMAD,
}: TrafficCustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const visitors = payload.find((p: any) => p.dataKey === 'Visiteurs')?.value || 0;
  const views = payload.find((p: any) => p.dataKey === 'Vues')?.value || 0;
  const revenue = payload.find((p: any) => p.dataKey === 'Revenu')?.value || 0;
  const orders = payload.find((p: any) => p.dataKey === 'Commandes')?.value || 0;
  const conversion = payload.find((p: any) => p.dataKey === 'Conversion')?.value || 0;

  return (
    <div className="bg-slate-950/95 dark:bg-[#1c1c20] backdrop-blur-2xl border border-slate-700/80 dark:border-[#2e2e36] rounded-xl p-3.5 shadow-2xl text-white min-w-[210px] space-y-2.5 z-50">
      <div className="border-b border-white/10 pb-1.5 flex items-center justify-between text-xs font-bold text-slate-200">
        <span className="flex items-center gap-1.5">
          <Calendar size={12} className="text-slate-400" />
          <span>{label}</span>
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        {metricTab === 'TRAFFIC' && (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors.primary }}></span>
                Visiteurs uniques :
              </span>
              <span className="font-mono font-bold text-white tabular-nums">
                {visitors.toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors.secondary }}></span>
                Pages vues :
              </span>
              <span className="font-mono font-bold text-slate-200 tabular-nums">
                {views.toLocaleString('fr-FR')}
              </span>
            </div>
          </>
        )}

        {metricTab === 'REVENUE' && (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Chiffre d&apos;affaires :
              </span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                {effectiveCanViewRevenue ? formatMAD(revenue) : '•••• MAD'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Commandes :
              </span>
              <span className="font-mono font-semibold text-white tabular-nums">
                {isPrivacyHidden ? '•• colis' : `${orders} colis`}
              </span>
            </div>
          </>
        )}

        {metricTab === 'ORDERS' && (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors.orders }}></span>
                Commandes reçues :
              </span>
              <span className="font-mono font-bold text-white tabular-nums">
                {isPrivacyHidden ? '•• colis' : `${orders} colis`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Taux conversion :
              </span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                {conversion}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrafficChart({ data, canViewRevenue = true }: TrafficChartProps) {
  const { isPrivacyHidden, design } = useAdminTheme();
  const effectiveCanViewRevenue = canViewRevenue && !isPrivacyHidden;

  const accentHex = design?.accentColor || '#0ea5e9';
  const chartColors = useMemo(() => {
    switch (design?.chartPalette) {
      case 'luxury_gold':
        return { primary: '#b45309', secondary: '#d97706', revenue: '#059669', orders: '#92400e' };
      case 'emerald_pro':
        return { primary: '#059669', secondary: '#14b8a6', revenue: '#10b981', orders: '#047857' };
      case 'monochrome':
        return { primary: '#334155', secondary: '#94a3b8', revenue: '#059669', orders: '#475569' };
      default:
        return { primary: accentHex, secondary: '#64748b', revenue: '#10b981', orders: accentHex };
    }
  }, [accentHex, design?.chartPalette]);
  const [mounted, setMounted] = useState(false);
  const [metricTab, setMetricTab] = useState<'TRAFFIC' | 'REVENUE' | 'ORDERS'>('TRAFFIC');
  const [chartType, setChartType] = useState<'AREA' | 'BAR' | 'LINE'>('AREA');
  const [activeSeries, setActiveSeries] = useState<'ALL' | 'VISITORS' | 'VIEWS'>('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { 
        totalViews: 0, 
        totalVisitors: 0, 
        totalRevenue: 0,
        totalOrders: 0,
        peakDayClean: 'N/A', 
        avgVisitors: 0,
        avgViewsPerVisitor: '1.0',
        conversionRate7j: '0.0',
        revPerVisitor: 0
      };
    }
    
    let totalViews = 0;
    let totalVisitors = 0;
    let totalRevenue = 0;
    let totalOrders = 0;
    let peakDay = data[0]?.name || 'N/A';
    let peakVal = 0;

    data.forEach((d) => {
      totalViews += d.Vues || 0;
      totalVisitors += d.Visiteurs || 0;
      totalRevenue += d.Revenu || 0;
      totalOrders += d.Commandes || 0;
      if ((d.Visiteurs || 0) > peakVal) {
        peakVal = d.Visiteurs || 0;
        peakDay = d.name;
      }
    });

    let peakDayClean = peakDay;
    try {
      const parts = peakDay.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        const dayName = parts[0].replace('.', '');
        const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        const num = parts[1];
        const month = parts[2] ? ` ${parts[2].replace('.', '').slice(0, 3)}.` : '';
        peakDayClean = `${dayCapitalized}. ${num}${month}`;
      }
    } catch {
      peakDayClean = peakDay;
    }

    const avgVisitors = Math.round(totalVisitors / data.length);
    const avgViewsPerVisitor = totalVisitors > 0 ? (totalViews / totalVisitors).toFixed(1) : '1.0';
    const conversionRate7j = totalVisitors > 0 ? ((totalOrders / totalVisitors) * 100).toFixed(1) : '0.0';
    const revPerVisitor = totalVisitors > 0 ? Math.round(totalRevenue / totalVisitors) : 0;

    return { 
      totalViews, 
      totalVisitors, 
      totalRevenue,
      totalOrders,
      peakDayClean, 
      avgVisitors,
      avgViewsPerVisitor,
      conversionRate7j,
      revPerVisitor
    };
  }, [data]);

  if (!mounted) {
    return <div className="h-[420px] w-full bg-slate-100/50 dark:bg-white/[0.03] rounded-2xl animate-pulse" />;
  }

  const formatMAD = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: 'MAD', 
      maximumFractionDigits: 0 
    }).format(amount).replace('MAD', '').trim() + ' MAD';
  };

  return (
    <div className="space-y-4">
      
      {/* ── 1. THE 4 EXECUTIVE METRIC PODS (Editorial Hairline Framing) ────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        
        {/* POD 1: VISITEURS 7J */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.025] border border-slate-200/80 dark:border-white/[0.07] transition-all hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--admin-accent-soft, rgba(14,165,233,0.12))', color: chartColors.primary }}
              >
                <Users size={14} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                VISITEURS 7J
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {stats.totalVisitors.toLocaleString('fr-FR')}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Audience unique sur 7 jours
          </div>
        </div>

        {/* POD 2: PAGES VUES 7J */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.025] border border-slate-200/80 dark:border-white/[0.07] transition-all hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--admin-accent-soft, rgba(14,165,233,0.12))', color: chartColors.primary }}
              >
                <Eye size={14} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                PAGES VUES 7J
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-1">
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {stats.totalViews.toLocaleString('fr-FR')}
              </div>
              <span
                className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--admin-accent-soft, rgba(14,165,233,0.12))', color: chartColors.primary }}
              >
                {stats.avgViewsPerVisitor}x / visite
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Total des consultations web
          </div>
        </div>

        {/* POD 3: MOYENNE / JOUR */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.025] border border-slate-200/80 dark:border-white/[0.07] transition-all hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-slate-200/60 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <TrendingUp size={14} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                MOYENNE / JOUR
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              ~{stats.avgVisitors}
              <span className="text-xs font-medium text-slate-400 ml-1.5 font-sans">visites</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Rythme moyen d&apos;acquisition
          </div>
        </div>

        {/* POD 4: PIC D'AUDIENCE */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.025] border border-slate-200/80 dark:border-white/[0.07] transition-all hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-slate-200/60 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Calendar size={14} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                PIC D&apos;AUDIENCE
              </span>
            </div>

            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {stats.peakDayClean}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Journée de plus fort trafic
          </div>
        </div>

      </div>

      {/* ── 2. CONTROLS BAR: GRAPH TYPE SWITCHER & SERIES FILTERS ────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 pb-1 border-t border-slate-100 dark:border-[#2e2e36]">
        
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-[#18181c] border border-slate-200 dark:border-[#2e2e36] gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricTab('TRAFFIC')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              metricTab === 'TRAFFIC'
                ? 'bg-white dark:bg-[#28282e] text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Users size={12} style={metricTab === 'TRAFFIC' ? { color: chartColors.primary } : undefined} />
            <span>Trafic &amp; Audience</span>
          </button>

          {canViewRevenue && (
            <button
              type="button"
              onClick={() => setMetricTab('REVENUE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                metricTab === 'REVENUE'
                  ? 'bg-white dark:bg-[#28282e] text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Coins size={12} className={metricTab === 'REVENUE' ? 'text-emerald-500' : ''} />
              <span>Ventes &amp; CA</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMetricTab('ORDERS')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              metricTab === 'ORDERS'
                ? 'bg-white dark:bg-[#28282e] text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <ShoppingBag size={12} style={metricTab === 'ORDERS' ? { color: chartColors.orders } : undefined} />
            <span>Commandes &amp; Flux</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {metricTab === 'TRAFFIC' && (
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#18181c] border border-slate-200 dark:border-[#2e2e36]">
              <button
                type="button"
                onClick={() => setActiveSeries('ALL')}
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeSeries === 'ALL'
                    ? 'bg-white dark:bg-[#28282e] text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setActiveSeries('VISITORS')}
                style={activeSeries === 'VISITORS' ? { backgroundColor: chartColors.primary } : undefined}
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeSeries === 'VISITORS'
                    ? 'text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                Visiteurs
              </button>
              <button
                type="button"
                onClick={() => setActiveSeries('VIEWS')}
                style={activeSeries === 'VIEWS' ? { backgroundColor: chartColors.secondary } : undefined}
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeSeries === 'VIEWS'
                    ? 'text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                Vues
              </button>
            </div>
          )}

          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#18181c] border border-slate-200 dark:border-[#2e2e36]">
            {([
              { id: 'AREA', title: 'Courbe en aire', icon: Activity },
              { id: 'BAR', title: 'Graphique en barres', icon: BarChart2 },
              { id: 'LINE', title: 'Graphique linéaire', icon: LineIcon },
            ] as const).map((item) => {
              const Icon = item.icon;
              const isAct = chartType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setChartType(item.id)}
                  title={item.title}
                  style={isAct ? { color: chartColors.primary } : undefined}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    isAct ? 'bg-white dark:bg-[#28282e] shadow-xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                >
                  <Icon size={13} strokeWidth={2.2} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. MAIN MOTION GRAPH CANVAS ──────────────────────────────────── */}
      <div className="h-[290px] w-full relative pt-2 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${metricTab}-${chartType}-${activeSeries}`}
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              
              {/* A. AREA CHART MODE */}
              {chartType === 'AREA' && (
                <AreaChart
                  data={data}
                  margin={{ top: 15, right: 15, left: metricTab === 'REVENUE' ? 15 : 0, bottom: 0 }}
                >
                  <defs>
                    <filter id="nay-stroke-glow" x="-10%" y="-15%" width="120%" height="135%">
                      <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="colorVisiteurs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.34}/>
                      <stop offset="85%" stopColor={chartColors.primary} stopOpacity={0.04}/>
                      <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0}/>
                    </linearGradient>

                    <linearGradient id="colorVues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.secondary} stopOpacity={0.22}/>
                      <stop offset="85%" stopColor={chartColors.secondary} stopOpacity={0.02}/>
                      <stop offset="100%" stopColor={chartColors.secondary} stopOpacity={0}/>
                    </linearGradient>

                    <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.revenue} stopOpacity={0.34}/>
                      <stop offset="85%" stopColor={chartColors.revenue} stopOpacity={0.04}/>
                      <stop offset="100%" stopColor={chartColors.revenue} stopOpacity={0}/>
                    </linearGradient>

                    <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.orders} stopOpacity={0.32}/>
                      <stop offset="85%" stopColor={chartColors.orders} stopOpacity={0.03}/>
                      <stop offset="100%" stopColor={chartColors.orders} stopOpacity={0}/>
                    </linearGradient>
                  </defs>

              <CartesianGrid 
                strokeDasharray="4 4" 
                vertical={false} 
                stroke="currentColor" 
                className="text-slate-300/80 dark:text-white/[0.06]" 
              />

              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                dy={8} 
              />

              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                width={metricTab === 'REVENUE' ? 62 : 36}
                tickFormatter={(v) => metricTab === 'REVENUE' ? `${v} DH` : v}
              />

              <Tooltip content={<TrafficCustomTooltip metricTab={metricTab} chartColors={chartColors} effectiveCanViewRevenue={effectiveCanViewRevenue} isPrivacyHidden={isPrivacyHidden} formatMAD={formatMAD} />} />

              {metricTab === 'TRAFFIC' && (
                <>
                  {(activeSeries === 'ALL' || activeSeries === 'VIEWS') && (
                    <Area 
                      type="monotone" 
                      dataKey="Vues" 
                      stroke={chartColors.secondary} 
                      strokeWidth={1.8} 
                      fillOpacity={1} 
                      fill="url(#colorVues)" 
                      activeDot={{ r: 4.5, stroke: chartColors.secondary, strokeWidth: 2, fill: '#ffffff' }}
                    />
                  )}

                  {(activeSeries === 'ALL' || activeSeries === 'VISITORS') && (
                    <Area 
                      type="monotone" 
                      dataKey="Visiteurs" 
                      stroke={chartColors.primary} 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorVisiteurs)" 
                      activeDot={{ r: 5, stroke: chartColors.primary, strokeWidth: 2, fill: '#ffffff' }}
                    />
                  )}
                </>
              )}

              {metricTab === 'REVENUE' && (
                <Area 
                  type="monotone" 
                  dataKey="Revenu" 
                  stroke={chartColors.revenue} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorRevenu)" 
                  activeDot={{ r: 5, stroke: chartColors.revenue, strokeWidth: 2, fill: '#ffffff' }}
                />
              )}

              {metricTab === 'ORDERS' && (
                <Area 
                  type="monotone" 
                  dataKey="Commandes" 
                  stroke={chartColors.orders} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorCommandes)" 
                  activeDot={{ r: 5, stroke: chartColors.orders, strokeWidth: 2, fill: '#ffffff' }}
                />
              )}
            </AreaChart>
          )}

          {chartType === 'BAR' && (
            <BarChart
              data={data}
              margin={{ top: 15, right: 15, left: metricTab === 'REVENUE' ? 15 : 0, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="4 4" 
                vertical={false} 
                stroke="currentColor" 
                className="text-slate-300/80 dark:text-white/[0.06]" 
              />

              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                dy={8} 
              />

              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                width={metricTab === 'REVENUE' ? 62 : 36}
                tickFormatter={(v) => metricTab === 'REVENUE' ? `${v} DH` : v}
              />

              <Tooltip content={<TrafficCustomTooltip metricTab={metricTab} chartColors={chartColors} effectiveCanViewRevenue={effectiveCanViewRevenue} isPrivacyHidden={isPrivacyHidden} formatMAD={formatMAD} />} />

              {metricTab === 'TRAFFIC' && (
                <>
                  {(activeSeries === 'ALL' || activeSeries === 'VIEWS') && (
                    <Bar 
                      dataKey="Vues" 
                      fill={chartColors.secondary} 
                      radius={[5, 5, 0, 0]} 
                      maxBarSize={28}
                    />
                  )}
                  {(activeSeries === 'ALL' || activeSeries === 'VISITORS') && (
                    <Bar 
                      dataKey="Visiteurs" 
                      fill={chartColors.primary} 
                      radius={[5, 5, 0, 0]} 
                      maxBarSize={28}
                    />
                  )}
                </>
              )}

              {metricTab === 'REVENUE' && (
                <Bar 
                  dataKey="Revenu" 
                  fill={chartColors.revenue} 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={38}
                />
              )}

              {metricTab === 'ORDERS' && (
                <Bar 
                  dataKey="Commandes" 
                  fill={chartColors.orders} 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={38}
                />
              )}
            </BarChart>
          )}

          {chartType === 'LINE' && (
            <RechartsLineChart
              data={data}
              margin={{ top: 15, right: 15, left: metricTab === 'REVENUE' ? 15 : 0, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="4 4" 
                vertical={false} 
                stroke="currentColor" 
                className="text-slate-300/80 dark:text-white/[0.06]" 
              />

              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                dy={8} 
              />

              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                width={metricTab === 'REVENUE' ? 62 : 36}
                tickFormatter={(v) => metricTab === 'REVENUE' ? `${v} DH` : v}
              />

              <Tooltip content={<TrafficCustomTooltip metricTab={metricTab} chartColors={chartColors} effectiveCanViewRevenue={effectiveCanViewRevenue} isPrivacyHidden={isPrivacyHidden} formatMAD={formatMAD} />} />

              {metricTab === 'TRAFFIC' && (
                <>
                  {(activeSeries === 'ALL' || activeSeries === 'VIEWS') && (
                    <Line 
                      type="monotone" 
                      dataKey="Vues" 
                      stroke={chartColors.secondary} 
                      strokeWidth={1.8} 
                      dot={{ r: 3, fill: chartColors.secondary }}
                      activeDot={{ r: 5.5, stroke: chartColors.secondary, strokeWidth: 2, fill: '#ffffff' }}
                    />
                  )}
                  {(activeSeries === 'ALL' || activeSeries === 'VISITORS') && (
                    <Line 
                      type="monotone" 
                      dataKey="Visiteurs" 
                      stroke={chartColors.primary} 
                      strokeWidth={2.4} 
                      dot={{ r: 3, fill: chartColors.primary }}
                      activeDot={{ r: 6, stroke: chartColors.primary, strokeWidth: 2, fill: '#ffffff' }}
                    />
                  )}
                </>
              )}

              {metricTab === 'REVENUE' && (
                <Line 
                  type="monotone" 
                  dataKey="Revenu" 
                  stroke={chartColors.revenue} 
                  strokeWidth={2.4} 
                  dot={{ r: 4, fill: chartColors.revenue }}
                  activeDot={{ r: 6, stroke: chartColors.revenue, strokeWidth: 2, fill: '#ffffff' }}
                />
              )}

              {metricTab === 'ORDERS' && (
                <Line 
                  type="monotone" 
                  dataKey="Commandes" 
                  stroke={chartColors.orders} 
                  strokeWidth={2.4} 
                  dot={{ r: 4, fill: chartColors.orders }}
                  activeDot={{ r: 6, stroke: chartColors.orders, strokeWidth: 2, fill: '#ffffff' }}
                  animationDuration={850}
                />
              )}
            </RechartsLineChart>
          )}

        </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 4. COMPANION 3 MINI-GRAPH SUMMARY WIDGETS (Token-Unified) ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.05] text-xs">
        
        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-slate-200/70 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Eye size={12} strokeWidth={2} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pages par session
              </span>
              <div className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                {stats.avgViewsPerVisitor} pages <span className="font-normal text-slate-400">/ visiteur</span>
              </div>
            </div>
          </div>
          <div className="w-12 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full" 
              style={{ width: `${Math.min(Number(stats.avgViewsPerVisitor) * 20, 100)}%`, backgroundColor: chartColors.secondary }} 
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--admin-accent-soft, rgba(14,165,233,0.12))', color: chartColors.primary }}
            >
              <ShoppingBag size={12} strokeWidth={2} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Taux conversion 7j
              </span>
              <div className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                {stats.conversionRate7j}% <span className="font-normal text-slate-400">({isPrivacyHidden ? '••' : stats.totalOrders} commandes)</span>
              </div>
            </div>
          </div>
          <div className="w-12 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="nay-progress-fill h-full rounded-full" 
              style={{ width: `${Math.min(Number(stats.conversionRate7j) * 25, 100)}%`, backgroundColor: chartColors.primary }} 
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Coins size={12} strokeWidth={2} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Revenu moyen / visite
              </span>
              <div className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                {effectiveCanViewRevenue ? `${stats.revPerVisitor} MAD` : '••• MAD'}
              </div>
            </div>
          </div>
          <div className="w-12 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${Math.min(stats.revPerVisitor, 100)}%` }} 
            />
          </div>
        </div>

      </div>

    </div>
  );
}
