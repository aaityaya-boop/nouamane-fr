'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingBag, Users, Globe, Clock,
  Smartphone, Monitor, Filter, Activity, MapPin, Sparkles,
  Package, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw,
  Download, Calendar, Award, AlertTriangle, CheckCircle2,
  XCircle, Truck, PieChart as PieIcon, Layers, ChevronRight,
  Eye, ShieldCheck, Heart, Search, HelpCircle, Flame, ExternalLink,
  Radio, Target, Compass, Droplets, Zap, Share2, MessageCircle,
  UserCheck, ArrowRight, BarChart3, ShoppingCart, MousePointerClick,
  Tablet, Video, AtSign, Gauge, Lightbulb, Coins
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatMAD } from '@/lib/products';
import VisitorsRegistrySection from './VisitorsRegistrySection';
import MarketingIntelligenceSection from './MarketingIntelligenceSection';
import ConversionFunnelSection from './ConversionFunnelSection';
import PerfumesIntelligenceSection from './PerfumesIntelligenceSection';
import {
  PeriodType, TabType, AnalyticsData, TrafficSource, CityData,
  PageData, LiveEvent, VisitorSession
} from './types';

const SOURCE_COLORS = [
  '#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#14b8a6', '#f43f5e', '#64748b', '#06b6d4'
];

export default function AnalyticsDashboardClient() {
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('visitors');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filters inside tabs
  const [sourceCategoryFilter, setSourceCategoryFilter] = useState<string>('ALL');
  const [citySearch, setCitySearch] = useState('');
  const [pageSearch, setPageSearch] = useState('');
  const [geoSubTab, setGeoSubTab] = useState<'cities' | 'sources' | 'devices' | 'pages' | 'stream'>('cities');

  // Client-Side In-Memory SWR Cache for 0ms Instant Period Switching
  const cacheRef = React.useRef<Map<string, { data: AnalyticsData; time: number }>>(new Map());

  // Fetch Analytics API with SWR & optional background refresh
  const fetchAnalytics = useCallback(async (showSpinner = true, forceFresh = false) => {
    const cacheKey = `${period}:${customStartDate || ''}:${customEndDate || ''}`;

    // SWR Cache: Serve instant data if available
    if (!forceFresh) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setData(cached.data);
        setIsLoading(false);
        // If cached within last 20 seconds, avoid re-fetching
        if (Date.now() - cached.time < 20000) return;
      }
    }

    if (showSpinner && !cacheRef.current.has(cacheKey)) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === 'custom' && customStartDate && customEndDate) {
        params.set('startDate', customStartDate);
        params.set('endDate', customEndDate);
      }
      if (forceFresh) {
        params.set('nocache', 'true');
      }
      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        cacheRef.current.set(cacheKey, { data: json, time: Date.now() });
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [period, customStartDate, customEndDate]);

  useEffect(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Auto-refresh every 30 seconds smoothly in the background
  useEffect(() => {
    if (activeTab !== 'livestream' && activeTab !== 'visitors') return;
    const interval = setInterval(() => {
      fetchAnalytics(false, false);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, fetchAnalytics]);

  // Filtered Sources
  const filteredSources = useMemo(() => {
    if (!data?.trafficAnalytics?.sources) return [];
    if (sourceCategoryFilter === 'ALL') return data.trafficAnalytics.sources;
    return data.trafficAnalytics.sources.filter((s) => s.category.toLowerCase().includes(sourceCategoryFilter.toLowerCase()));
  }, [data, sourceCategoryFilter]);

  // Filtered Cities
  const filteredCities = useMemo(() => {
    if (!data?.trafficAnalytics?.cities) return [];
    if (!citySearch.trim()) return data.trafficAnalytics.cities;
    const q = citySearch.toLowerCase().trim();
    return data.trafficAnalytics.cities.filter((c) => c.city.toLowerCase().includes(q));
  }, [data, citySearch]);

  // Filtered Pages
  const filteredPages = useMemo(() => {
    if (!data?.trafficAnalytics?.topPages) return [];
    if (!pageSearch.trim()) return data.trafficAnalytics.topPages;
    const q = pageSearch.toLowerCase().trim();
    return data.trafficAnalytics.topPages.filter((p) => p.title.toLowerCase().includes(q) || p.pathname.toLowerCase().includes(q));
  }, [data, pageSearch]);

  // Format relative time for live stream
  const formatRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `Il y a ${Math.max(5, diff)}s`;
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    const hours = Math.floor(diff / 3600);
    if (hours < 24) return `Il y a ${hours}h`;
    return new Date(isoString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Export Executive Traffic Report
  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `RAPPORT AUDIENCE & TRAFIC - NAY PARFUMS (${data.period.label})\r\n\r\n`;

    csvContent += '--- 1. INDICATEURS CLES DU TRAFIC ---\r\n';
    csvContent += `Visiteurs Uniques,${data.kpi.visitorsCount}\r\n`;
    csvContent += `Pages Vues Totales,${data.kpi.pageViewsCount}\r\n`;
    csvContent += `Pages par Visiteur,${data.kpi.pagesPerVisitor}\r\n`;
    csvContent += `Duree Moyenne de Visite,${data.kpi.avgDuration}\r\n`;
    csvContent += `Taux de Rebond Estime,${data.kpi.bounceRate}%\r\n`;
    csvContent += `Taux de Conversion Global,${data.kpi.conversionRate}%\r\n`;
    csvContent += `Chiffre d'Affaires Trafic (MAD),${data.kpi.grossRevenue} MAD\r\n\r\n`;

    csvContent += '--- 2. TOUTES LES SOURCES D\'ACQUISITION ---\r\n';
    csvContent += 'Source,Categorie,Pages Vues,Visiteurs Estimes,Part Trafic (%),Commandes,CA Genere (MAD),Conversion (%)\r\n';
    data.trafficAnalytics.sources.forEach((s) => {
      csvContent += `"${s.name}","${s.category}",${s.views},${s.visitors},${s.share}%,${s.orders},${s.revenue},${s.conversionRate}%\r\n`;
    });

    csvContent += '\r\n--- 3. AUDIENCE PAR VILLE DU MAROC ---\r\n';
    csvContent += 'Ville,Pays,Visiteurs,Part (%),Commandes,CA Genere (MAD)\r\n';
    data.trafficAnalytics.cities.forEach((c) => {
      csvContent += `"${c.city}","${c.country}",${c.visitors},${c.share}%,${c.orders},${c.revenue}\r\n`;
    });

    csvContent += '\r\n--- 4. PAGES LES PLUS CONSULTEES ---\r\n';
    csvContent += 'Page,URL,Categorie,Pages Vues,Part (%)\r\n';
    data.trafficAnalytics.topPages.forEach((p) => {
      csvContent += `"${p.title.replace(/"/g, '""')}","${p.pathname}","${p.category}",${p.views},${p.share}%\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NAY_Audience_Trafic_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportVisitorsCSV = () => {
    const list = data?.trafficAnalytics?.visitorSessions;
    if (!list || !list.length) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `REGISTRE DES VISITEURS & CLIENTS ENTRANTS - NAY PARFUMS (${data.period.label})\r\n\r\n`;
    csvContent += 'ID Client,Ville,Pays,Appareil,Source Provenance,Date Premiere Entree,Derniere Activite,En Ligne,Pages Vues,Duree,Page Entree,Derniere Page,Panier (MAD),Statut\r\n';

    list.forEach((v) => {
      csvContent += `"${v.customerName || v.ipHashShort}","${v.city}","${v.country}","${v.device}","${v.referrer}","${v.firstSeen}","${v.lastSeen}",${v.isOnline ? 'OUI' : 'NON'},${v.pageCount},"${v.durationFormatted}","${v.landingPage.pathname}","${v.currentPage.pathname}",${v.cartValue},"${v.status}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NAY_Clients_Visiteurs_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans text-slate-900 dark:text-slate-100 relative">
      {/* Subtle atmospheric ambient glow */}
      <div className="hidden dark:block absolute top-10 right-10 w-96 h-96 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />
      <div className="hidden dark:block absolute top-80 left-5 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. TOP HEADER: LUXURY ANALYTICS STUDIO                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/12 text-[#0ea5e9] border border-sky-500/20 flex items-center justify-center shadow-xs shrink-0">
            <BarChart3 size={22} strokeWidth={2.2} />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-x-2.5 gap-y-0.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Audience &amp; Performance Studio
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {data?.kpi?.activeVisitorsCount ?? 1} en direct
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Observatoire télémétrique en direct, diagnostic d&apos;acquisition et entonnoir de conversion pour <strong className="font-bold text-slate-800 dark:text-slate-200">nayparfum.ma</strong>
            </p>
          </div>
        </div>

        {/* Global Action Cluster */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => fetchAnalytics(false, true)}
              disabled={isRefreshing}
              className="h-10 sm:h-9 px-3.5 inline-flex items-center justify-center gap-1.5 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-[#1a233a] border border-slate-200/90 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="Rafraîchir les statistiques en temps réel"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={handleExportVisitorsCSV}
              disabled={!data?.trafficAnalytics?.visitorSessions?.length}
              className="h-10 sm:h-9 px-3.5 inline-flex items-center justify-center gap-1.5 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-[#1a233a] border border-slate-200/90 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <Users size={13} />
              <span>Export Visiteurs</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!data}
            className="w-full sm:w-auto h-10 sm:h-9 px-4 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Download size={13} />
            <span>Rapport Global (CSV)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DATE FILTER BAR (POLARIS SEGMENTED CONTROL)                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-white/[0.04] p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md overflow-x-auto max-w-full" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'today', label: "Aujourd'hui" },
            { id: 'yesterday', label: 'Hier' },
            { id: '7d', label: '7 jours' },
            { id: '30d', label: '30 jours' },
            { id: 'this_month', label: 'Ce mois-ci' },
            { id: '90d', label: '90 jours' },
            { id: 'year', label: 'Cette année' },
            { id: 'all', label: "Tout l'historique" },
          ].map((p) => {
            const isSelected = period === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setPeriod(p.id as any);
                  setShowDatePicker(false);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer text-xs font-bold whitespace-nowrap ${
                  isSelected
                    ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-200/90 dark:ring-white/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.05]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer text-xs font-bold whitespace-nowrap ${
              period === 'custom'
                ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-200/90 dark:ring-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.05]'
            }`}
          >
            <Calendar size={13} />
            <span>Personnalisé</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] shadow-2xs shrink-0 self-start xl:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Moteur de télémesure : <strong className="font-bold text-slate-800 dark:text-slate-200">NAY Real-Time Sensor</strong></span>
        </div>
      </div>

      {/* Custom Date Picker Dropdown */}
      {showDatePicker && (
        <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/90 dark:border-white/[0.08] shadow-lg flex flex-wrap items-center gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">Début :</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#182136] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">Fin :</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#182136] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
            />
          </div>
          <button
            onClick={() => {
              if (customStartDate && customEndDate) setPeriod('custom');
            }}
            disabled={!customStartDate || !customEndDate}
            className="h-8 px-4 bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 disabled:opacity-40 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Appliquer
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. 6 SHOPIFY ANALYTICS KPI CARDS (CLEAN METRICS & GAUGES)                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Chiffre d'Affaires Brut */}
        <div className="rounded-xl p-4 sm:p-4.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all flex flex-col justify-between min-h-[148px]">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-tight uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">Chiffre d&apos;Affaires</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-500/15 border border-sky-100 dark:border-sky-500/20 text-[#0ea5e9] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                <Coins size={14} strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-xl sm:text-[22px] font-black tracking-tight text-slate-900 dark:text-white font-mono tabular-nums leading-tight">
              {data ? formatMAD(data.kpi.grossRevenue) : '—'}
            </div>
            {/* Shopify Micro-Gauge */}
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-[2.5px] rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round(((data?.kpi?.deliveredRevenue || 0) / (data?.kpi?.grossRevenue || 1)) * 100))}%`
                }}
              />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Encaissé</span>
            <strong className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{data ? formatMAD(data.kpi.deliveredRevenue) : '—'}</strong>
          </div>
        </div>

        {/* KPI 2: Commandes & Panier Moyen */}
        <div className="rounded-xl p-4 sm:p-4.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all flex flex-col justify-between min-h-[148px]">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-tight uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">Commandes</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-100 dark:border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ShoppingBag size={14} strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-xl sm:text-[22px] font-black tracking-tight text-slate-900 dark:text-white font-mono tabular-nums leading-tight">
              {data?.kpi?.totalOrders?.toLocaleString() ?? '—'}
            </div>
            {/* Shopify Micro-Gauge */}
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-[2.5px] rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round(((data?.kpi?.totalOrders || 0) / 30) * 100))}%`
                }}
              />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Panier moy.</span>
            <strong className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data ? formatMAD(data.kpi.aov) : '—'}</strong>
          </div>
        </div>

        {/* KPI 3: Visiteurs Uniques */}
        <div className="rounded-xl p-4 sm:p-4.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all flex flex-col justify-between min-h-[148px]">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-tight uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">Visiteurs Uniques</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-100 dark:border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Users size={14} strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-xl sm:text-[22px] font-black tracking-tight text-slate-900 dark:text-white font-mono tabular-nums leading-tight">
              {data?.kpi?.visitorsCount?.toLocaleString() ?? '—'}
            </div>
            {/* Shopify Micro-Gauge */}
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-[2.5px] rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round(((data?.kpi?.visitorsCount || 0) / 2000) * 100))}%`
                }}
              />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Pages vues</span>
            <strong className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data?.kpi?.pageViewsCount?.toLocaleString() ?? '—'}</strong>
          </div>
        </div>

        {/* KPI 4: Taux de Conversion */}
        <div className="rounded-xl p-4 sm:p-4.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all flex flex-col justify-between min-h-[148px]">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-tight uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">Taux Conversion</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/15 border border-purple-100 dark:border-purple-500/20 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Target size={14} strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-xl sm:text-[22px] font-black tracking-tight text-slate-900 dark:text-white font-mono tabular-nums leading-tight">
              {data?.kpi?.conversionRate ?? 0}%
            </div>
            {/* Shopify Micro-Gauge */}
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-[2.5px] rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round(((data?.kpi?.conversionRate || 0) / 3) * 100))}%`
                }}
              />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Livraison</span>
            <strong className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{data?.kpi?.deliveryRate ?? 0}%</strong>
          </div>
        </div>

        {/* KPI 5: Paniers en Cours */}
        <div className="rounded-xl p-4 sm:p-4.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all flex flex-col justify-between min-h-[148px]">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-tight uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">Paniers Actifs</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-100 dark:border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShoppingCart size={14} strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-xl sm:text-[22px] font-black tracking-tight text-slate-900 dark:text-white font-mono tabular-nums leading-tight">
              {formatMAD(data?.trafficAnalytics?.visitorSessions?.reduce((s, v) => s + (v.cartValue || 0), 0) || 0)}
            </div>
            {/* Shopify Micro-Gauge */}
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-[2.5px] rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round(((data?.trafficAnalytics?.visitorSessions?.filter(s => s.hasCart || s.cartValue > 0).length || 0) / (data?.trafficAnalytics?.visitorSessions?.length || 1)) * 100))}%`
                }}
              />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>À relancer</span>
            <strong className="font-bold text-amber-600 dark:text-amber-400 font-mono">{data?.trafficAnalytics?.visitorSessions?.filter(s => s.hasCart || s.cartValue > 0).length || 0} paniers</strong>
          </div>
        </div>

        {/* KPI 6: Taux de Rebond */}
        <div className="rounded-xl p-4 sm:p-4.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all flex flex-col justify-between min-h-[148px]">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-tight uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">Taux Rebond</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-100 dark:border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Activity size={14} strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-xl sm:text-[22px] font-black tracking-tight text-slate-900 dark:text-white font-mono tabular-nums leading-tight">
              {data?.kpi?.bounceRate ?? 0}%
            </div>
            {/* Shopify Micro-Gauge */}
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-[2.5px] rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, data?.kpi?.bounceRate || 0)}%`
                }}
              />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Durée moy.</span>
            <strong className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data?.kpi?.avgDuration ?? '—'}</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. 5 EXECUTIVE DASHBOARD TABS (SHOPIFY POLARIS SEGMENTED CONTROLS)        */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-white/[0.04] rounded-xl border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl overflow-x-auto text-xs" style={{ scrollbarWidth: 'none' }}>
        {[
          {
            id: 'visitors',
            label: 'Visiteurs & Registre Live',
            icon: Users,
            count: data?.trafficAnalytics?.visitorSessions?.length,
          },
          {
            id: 'funnel',
            label: 'Entonnoir de Conversion',
            icon: Target,
            badge: data?.kpi ? `${data.kpi.conversionRate}%` : undefined,
          },
          {
            id: 'perfumes',
            label: 'Performance Parfums & Stocks',
            icon: Package,
            count: data?.perfumeAnalytics?.bestSellers?.length,
          },
          {
            id: 'geography',
            label: 'Villes & Canaux de Trafic',
            icon: MapPin,
            badge: 'Maroc MA',
          },
          {
            id: 'marketing_ai',
            label: 'Marketing, ROAS & Ads',
            icon: Sparkles,
            badge: 'ROAS',
          },
        ].map((tab) => {
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'geography' && (activeTab === 'sources' || activeTab === 'devices' || activeTab === 'pages' || activeTab === 'livestream'));
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-200/90 dark:ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <IconComponent size={13} className={isActive ? 'text-[#0ea5e9] dark:text-[#38bdf8]' : 'text-slate-400'} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] dark:text-[#38bdf8]' : 'bg-slate-200/70 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-200/70 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>


{/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: VISITEURS ENTRANTS & SESSIONS EN DIRECT                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'visitors' && (
        <VisitorsRegistrySection
          visitors={data?.trafficAnalytics?.visitorSessions || []}
          isRefreshing={isRefreshing}
          onRefresh={() => fetchAnalytics(false)}
          periodLabel={data?.period?.label || '30 derniers jours'}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ENTONNOIR DE CONVERSION E-COMMERCE (FULL FUNNEL)              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'funnel' && (
        <ConversionFunnelSection
          funnel={data?.funnel}
          grossRevenue={data?.kpi?.grossRevenue || 0}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: PALMARÈS DES PARFUMS & FAMILLES OLFACTIVES                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'perfumes' && (
        <PerfumesIntelligenceSection perfumes={data?.perfumeAnalytics} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: CONSEILS STRATÉGIQUES MARKETING & SIMULATEUR ROAS            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'marketing_ai' && (
        <MarketingIntelligenceSection
          insights={data?.marketingInsights || []}
          aov={data?.kpi?.aov || 0}
          conversionRate={data?.kpi?.conversionRate || 0}
          activeCartsValue={
            data?.trafficAnalytics?.visitorSessions?.reduce((s, v) => s + (v.cartValue || 0), 0) || 0
          }
          marketingFinancials={data?.marketingFinancials}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: VILLES DU MAROC, CANAUX DE TRAFIC & TELEMESURE                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {(activeTab === 'geography' || activeTab === 'sources' || activeTab === 'devices' || activeTab === 'pages' || activeTab === 'livestream') && (
        <div className="space-y-6">
          {/* Sub Navigation Bar */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/90 dark:bg-white/[0.04] p-1 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] w-fit max-w-full" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'cities', label: 'Villes du Maroc', icon: <MapPin size={12} className="text-neutral-400" /> },
              { id: 'sources', label: 'Sources d\'Acquisition', icon: <Share2 size={12} className="text-neutral-400" /> },
              { id: 'devices', label: 'Appareils & Systèmes', icon: <Smartphone size={12} className="text-neutral-400" /> },
              { id: 'pages', label: 'Pages & Fiches', icon: <Eye size={12} className="text-neutral-400" /> },
              { id: 'stream', label: 'Flux Live', icon: <Radio size={12} className="text-emerald-500 animate-pulse" /> },
            ].map((sub) => {
              const isSelected =
                (geoSubTab === sub.id && activeTab === 'geography') ||
                (sub.id === 'sources' && activeTab === 'sources') ||
                (sub.id === 'devices' && activeTab === 'devices') ||
                (sub.id === 'pages' && activeTab === 'pages') ||
                (sub.id === 'stream' && activeTab === 'livestream');

              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setGeoSubTab(sub.id as any);
                    setActiveTab('geography');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white dark:bg-[#182136] text-[#0ea5e9] dark:text-[#38bdf8] shadow-xs ring-1 ring-slate-200/80 dark:ring-white/10 font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {sub.icon}
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub View: Sources */}
          {((geoSubTab === 'sources' && activeTab === 'geography') || activeTab === 'sources') && (
            <div className="space-y-6">
          {/* Visual Distribution of Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Donut Chart */}
            <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
                    Parts par canal
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Répartition des visites
                  </p>
                </div>
              </div>

              <div className="h-[220px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.trafficAnalytics?.sources || []}
                      dataKey="views"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {data?.trafficAnalytics?.sources?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '6px', border: '1px solid #222227', backgroundColor: '#121215', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(val: any, name: any) => [`${val} vues`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#eaeaea] dark:border-[#222227] text-[11px] font-mono">
                {data?.trafficAnalytics?.sources?.slice(0, 6).map((s, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }} />
                    <span className="text-neutral-700 dark:text-neutral-300 truncate">{s.name} :</span>
                    <span className="text-neutral-400 font-semibold">{s.share}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Breakdown Bars */}
            <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
                    Volume de pages par source
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Impact des canaux d&apos;acquisition
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {data?.trafficAnalytics?.sources?.slice(0, 7).map((s, idx) => {
                  const maxViews = data?.trafficAnalytics?.sources[0]?.views || 1;
                  const pct = Math.round((s.views / maxViews) * 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }} />
                          {s.name}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-neutral-400">{s.views.toLocaleString()} vues ({s.share}%)</span>
                          <span className="font-semibold text-neutral-900 dark:text-white">{formatMAD(s.revenue)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-[#1c1c21] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Full Enterprise Sources Table */}
          <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-4 border-b border-[#eaeaea] dark:border-[#222227] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Matrice des sources de trafic
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Performance commerciale et qualité du trafic par origine
                </p>
              </div>

              {/* Source Category Filter Pills */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-[#1c1c21] p-1 rounded-md text-xs font-mono">
                {[
                  { id: 'ALL', label: 'Toutes' },
                  { id: 'Moteur', label: 'Moteurs' },
                  { id: 'Meta', label: 'Meta' },
                  { id: 'Direct', label: 'Direct' },
                  { id: 'Messagerie', label: 'WhatsApp' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSourceCategoryFilter(f.id)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                      sourceCategoryFilter === f.id
                        ? 'bg-white dark:bg-[#121215] text-neutral-900 dark:text-white font-semibold shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    <th className="py-2.5 px-3.5">Source d&apos;Acquisition</th>
                    <th className="py-2.5 px-3">Catégorie</th>
                    <th className="py-2.5 px-3 text-center">Pages Vues</th>
                    <th className="py-2.5 px-3 text-center">Visiteurs Est.</th>
                    <th className="py-2.5 px-3 text-center">Part (%)</th>
                    <th className="py-2.5 px-3 text-center">Rebond</th>
                    <th className="py-2.5 px-3 text-center">Commandes</th>
                    <th className="py-2.5 px-3 text-right">CA Généré</th>
                    <th className="py-2.5 px-3.5 text-center">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea] dark:divide-[#222227] text-neutral-700 dark:text-neutral-300 font-mono">
                  {filteredSources.map((s, index) => (
                    <tr key={index} className="hover:bg-[#fafafa] dark:hover:bg-[#18181d] transition-colors">
                      <td className="py-2.5 px-3.5 font-sans font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }} />
                        <span>{s.name}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-[#1c1c21] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-neutral-900 dark:text-white">
                        {s.views.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center text-neutral-400">
                        {s.visitors.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center text-neutral-900 dark:text-neutral-200">
                        {s.share}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-neutral-400">
                        {s.bounceRate}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-neutral-900 dark:text-white">
                        {s.orders}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-neutral-900 dark:text-white">
                        {formatMAD(s.revenue)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {s.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: VILLES DU MAROC & GÉOGRAPHIE                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {((geoSubTab === 'cities' && activeTab === 'geography') || (activeTab === 'geography' && geoSubTab === 'cities')) && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4.5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <MapPin size={14} className="text-neutral-400" />
                  <span>Répartition géographique de l&apos;audience (Villes du Maroc)</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Origine géographique réelle des visiteurs enregistrés
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher une ville..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {filteredCities.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] hover:border-black dark:hover:border-white transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{c.flag}</span>
                      <span className="font-semibold text-xs text-neutral-900 dark:text-white">{c.city}</span>
                    </div>
                    <span className="font-mono font-semibold text-xs text-neutral-900 dark:text-white">{c.share}%</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>{c.visitors.toLocaleString()} visiteurs</span>
                    <span className="text-neutral-700 dark:text-neutral-300">{c.orders} cmd ({formatMAD(c.revenue)})</span>
                  </div>

                  <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-white rounded-full"
                      style={{ width: `${Math.max(4, c.share * 2.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: APPAREILS, SYSTÈMES & NAVIGATEURS (TECH AUDIENCE)               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {((geoSubTab === 'devices' && activeTab === 'geography') || activeTab === 'devices') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Device Types */}
            <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-4">
              <div className="pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
                  Appareils des Visiteurs
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  Mobile vs Desktop vs Tablette
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {data?.trafficAnalytics?.devices?.map((dev, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                        {dev.name.toLowerCase().includes('mob') ? <Smartphone size={13} className="text-neutral-400" /> :
                         dev.name.toLowerCase().includes('desk') ? <Monitor size={13} className="text-neutral-400" /> :
                         <Tablet size={13} className="text-neutral-400" />}
                        {dev.name}
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {dev.views.toLocaleString()} vues ({dev.share}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-[#1c1c21] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 dark:bg-white rounded-full"
                        style={{ width: `${Math.max(4, dev.share)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Systems & Browsers */}
            <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-4">
              <div className="pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
                  Profil Technique & Navigation
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  Optimisation de l&apos;expérience utilisateur mobile
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-2">
                  <div className="font-mono text-xs text-neutral-900 dark:text-white flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5"><Smartphone size={13} className="text-neutral-400" /> iOS & iPhone</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">~58%</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
                    Les clients sur iPhone représentent la majorité des paniers à haute valeur (&gt; 500 MAD) et des commandes de coffrets de luxe.
                  </p>
                </div>

                <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-2">
                  <div className="font-mono text-xs text-neutral-900 dark:text-white flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5"><Smartphone size={13} className="text-neutral-400" /> Android</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">~42%</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
                    Très forte conversion sur les testeurs de parfums et commandes avec paiement à la livraison (COD).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: PAGES & FICHES PARFUMS LES PLUS VUES                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {((geoSubTab === 'pages' && activeTab === 'geography') || activeTab === 'pages') && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-4 border-b border-[#eaeaea] dark:border-[#222227] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Palmarès des pages & fiches parfums
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Volume de vues par URL et intérêt suscité chez les visiteurs
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher une page..."
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    <th className="py-2.5 px-3.5">Rang</th>
                    <th className="py-2.5 px-3">Titre de la Page</th>
                    <th className="py-2.5 px-3">Pathname</th>
                    <th className="py-2.5 px-3">Catégorie</th>
                    <th className="py-2.5 px-3 text-center">Vues</th>
                    <th className="py-2.5 px-3 text-center">Part (%)</th>
                    <th className="py-2.5 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea] dark:divide-[#222227] text-neutral-700 dark:text-neutral-300 font-mono">
                  {filteredPages.map((p, index) => (
                    <tr key={index} className="hover:bg-[#fafafa] dark:hover:bg-[#18181d] transition-colors">
                      <td className="py-2.5 px-3.5 text-neutral-400">
                        #{index + 1}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-neutral-900 dark:text-white max-w-[260px] truncate">
                        {p.title}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-neutral-400 max-w-[200px] truncate" title={p.pathname}>
                        {p.pathname}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-[#1c1c21] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-neutral-900 dark:text-white">
                        {p.views.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center text-neutral-900 dark:text-neutral-200">
                        {p.share}%
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <Link
                          href={p.pathname}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <span>Visiter</span>
                          <ExternalLink size={10} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: LIVE STREAM & PICS D'AFFLUENCE DU SITE                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {((geoSubTab === 'stream' && activeTab === 'geography') || activeTab === 'livestream') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Live Actions Stream (2 cols) */}
            <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
                    Flux en Direct des Visites
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    40 dernières actions enregistrées en temps réel
                  </p>
                </div>

                <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mise à jour en continu
                </span>
              </div>

              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {data?.trafficAnalytics?.liveStream?.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-[#1c1c21] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
                        {ev.device === 'Mobile' ? <Smartphone size={13} /> : <Monitor size={13} />}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                          {ev.title}
                        </div>
                        <div className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-1.5 mt-0.5 font-mono">
                          <span>{ev.city}</span>
                          <span>·</span>
                          <span>{ev.referrer}</span>
                          <span>·</span>
                          <span className="truncate max-w-[160px]">
                            {ev.pathname}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px] text-neutral-400">
                      {formatRelativeTime(ev.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Traffic Hours (1 col) */}
            <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-3">
              <div className="pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
                  Heures d&apos;Affluence
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  Activité journalière par heure (0h - 23h)
                </p>
              </div>

              <div className="h-[250px] w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.trafficAnalytics?.hourlyHeatmap || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#888', fontFamily: 'monospace' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#888', fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '6px', border: '1px solid #222227', backgroundColor: '#121215', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(val: any) => [`${val} actions`, 'Affluence']}
                    />
                    <Bar dataKey="estViews" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] text-[11px] text-neutral-500 font-sans">
                <strong className="text-neutral-900 dark:text-white">Pic d&apos;activité :</strong> L&apos;audience est particulièrement active en soirée entre <strong>20h00 et 23h30</strong>, avec un pic secondaire vers 14h.
              </div>
            </div>
          </div>
        </div>
      )}

        </div>
      )}
    </div>
  );
}
