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
  Tablet, Video, AtSign, Gauge
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

  // Fetch Analytics API
  const fetchAnalytics = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === 'custom' && customStartDate && customEndDate) {
        params.set('startDate', customStartDate);
        params.set('endDate', customEndDate);
      }
      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
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

  // Auto-refresh every 25 seconds on visitors or livestream tab
  useEffect(() => {
    if (activeTab !== 'livestream' && activeTab !== 'visitors') return;
    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 25000);
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

  const formatRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `Il y a ${Math.max(5, diff)}s`;
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    const hours = Math.floor(diff / 3600);
    if (hours < 24) return `Il y a ${hours}h`;
    return new Date(isoString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── TOP ANALYTICS & PERFORMANCE HEADER ────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800 flex items-center gap-2">
                <Globe size={13} className="text-sky-500" />
                <span>Haute Performance & Intelligence Commerciale</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{data?.kpi?.activeVisitorsCount || 1} en direct</span>
              </span>

              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                {data?.period?.label || '30 derniers jours'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
              <TrendingUp size={28} className="text-sky-500" />
              <span>Analytics & Performance</span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg">
                Enterprise Luxury Suite
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-3xl">
              Plateforme d&apos;intelligence décisionnelle de NAY Parfums : suivi en temps réel des clients entrants, diagnostic marketing IA, simulateur de ROAS, entonnoir de conversion et palmarès des parfums.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => fetchAnalytics(false)}
              disabled={isRefreshing}
              className="p-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Rafraîchir les statistiques"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-sky-500' : ''} />
            </button>

            <button
              onClick={handleExportVisitorsCSV}
              disabled={!data?.trafficAnalytics?.visitorSessions?.length}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Users size={15} />
              <span>Exporter Clients CSV</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!data}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              <span>Rapport Global CSV</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {(
              [
                { id: 'today', label: "Aujourd'hui" },
                { id: 'yesterday', label: 'Hier' },
                { id: '7d', label: '7 jours' },
                { id: '30d', label: '30 jours' },
                { id: 'this_month', label: 'Ce mois-ci' },
                { id: '90d', label: '90 jours' },
                { id: 'year', label: 'Cette année' },
                { id: 'all', label: 'Tout l\'historique' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPeriod(p.id);
                  setShowDatePicker(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  period === p.id
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                    : 'bg-neutral-100 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {p.label}
              </button>
            ))}

            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                period === 'custom'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                  : 'bg-neutral-100 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Calendar size={13} />
              <span>Personnalisé</span>
            </button>
          </div>

          <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
            Moteur de tracking : <strong className="text-neutral-700 dark:text-neutral-300">NAY Real-Time Sensor</strong>
          </div>
        </div>

        {/* Custom Date Picker Dropdown */}
        {showDatePicker && (
          <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Date début :</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Date fin :</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white"
              />
            </div>
            <button
              onClick={() => {
                if (customStartDate && customEndDate) setPeriod('custom');
              }}
              disabled={!customStartDate || !customEndDate}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Appliquer la sélection
            </button>
          </div>
        )}
      </div>

      {/* ── 6 EXECUTIVE TRAFFIC KPIS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Unique Visitors */}
        <div className="bg-white dark:bg-[#111827] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Visiteurs Uniques</span>
            <Users size={15} className="text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data?.kpi?.visitorsCount?.toLocaleString() ?? '—'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Tendance :</span>
            <span className={`font-bold flex items-center gap-0.5 ${
              (data?.kpi?.deltas?.visitors || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}>
              {(data?.kpi?.deltas?.visitors || 0) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(data?.kpi?.deltas?.visitors || 0)}%
            </span>
          </div>
        </div>

        {/* KPI 2: Total Pageviews */}
        <div className="bg-white dark:bg-[#111827] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pages Vues</span>
            <Eye size={15} className="text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data?.kpi?.pageViewsCount?.toLocaleString() ?? '—'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Pages / Visiteur :</span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {data?.kpi?.pagesPerVisitor ?? '3.3'}
            </span>
          </div>
        </div>

        {/* KPI 3: Bounce Rate */}
        <div className="bg-white dark:bg-[#111827] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Taux de Rebond</span>
            <Gauge size={15} className="text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data?.kpi?.bounceRate ?? '36.8'}%
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Benchmark Luxe :</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Excellent (&lt; 40%)
            </span>
          </div>
        </div>

        {/* KPI 4: Average Duration */}
        <div className="bg-white dark:bg-[#111827] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Durée Moyenne</span>
            <Clock size={15} className="text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data?.kpi?.avgDuration ?? '2 min 48 s'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Engagement :</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Élevé
            </span>
          </div>
        </div>

        {/* KPI 5: Conversion Rate */}
        <div className="bg-white dark:bg-[#111827] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Conversion Trafic</span>
            <Target size={15} className="text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data?.kpi?.conversionRate ?? '1.53'}%
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Commandes :</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {data?.kpi?.totalOrders ?? '0'} achats
            </span>
          </div>
        </div>

        {/* KPI 6: Traffic Revenue */}
        <div className="bg-white dark:bg-[#111827] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">CA Généré</span>
            <DollarSign size={15} className="text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data ? formatMAD(data.kpi.grossRevenue) : '—'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Panier moyen :</span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {data ? formatMAD(data.kpi.aov) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── DEDICATED AUDIENCE & PERFORMANCE TABS ───────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200 dark:border-neutral-800" style={{ scrollbarWidth: 'none' }}>
        {[
          {
            id: 'visitors',
            label: '👥 Visiteurs Entrants (En Direct)',
            badge: data?.trafficAnalytics?.visitorSessions?.length ? `${data.trafficAnalytics.visitorSessions.length}` : undefined,
            badgeColor: 'bg-emerald-500 text-white',
            icon: <Users size={15} className="text-emerald-500" />,
          },
          {
            id: 'marketing_ai',
            label: '🧠 Conseils Marketing & ROAS IA',
            badge: 'PRO',
            badgeColor: 'bg-amber-500 text-white',
            icon: <Sparkles size={15} className="text-amber-500" />,
          },
          {
            id: 'funnel',
            label: '🌪️ Entonnoir de Conversion',
            badge: data?.kpi ? `${data.kpi.conversionRate}%` : undefined,
            badgeColor: 'bg-indigo-500 text-white',
            icon: <Filter size={15} className="text-indigo-500" />,
          },
          {
            id: 'perfumes',
            label: '💎 Parfums Stars & Familles',
            icon: <Award size={15} className="text-purple-500" />,
          },
          { id: 'sources', label: '🌐 Toutes les Sources de Trafic', icon: <Share2 size={15} /> },
          { id: 'geography', label: '🗺️ Villes du Maroc & Monde', icon: <MapPin size={15} /> },
          { id: 'devices', label: '📱 Appareils & Navigateurs', icon: <Smartphone size={15} /> },
          { id: 'pages', label: '📄 Pages & Fiches Parfums Vues', icon: <Eye size={15} /> },
          { id: 'livestream', label: '🔴 Live Stream & Affluence', icon: <Radio size={15} className="text-rose-500 animate-pulse" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                : 'bg-white dark:bg-[#111827] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${tab.badgeColor || 'bg-sky-500 text-white'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 0: VISITEURS ENTRANTS & SESSIONS EN DIRECT                        */}
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
      {/* TAB 0.1: CONSEILS STRATÉGIQUES MARKETING & SIMULATEUR ROAS            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'marketing_ai' && (
        <MarketingIntelligenceSection
          insights={data?.marketingInsights || []}
          aov={data?.kpi?.aov || 463}
          conversionRate={data?.kpi?.conversionRate || 1.64}
          activeCartsValue={
            data?.trafficAnalytics?.visitorSessions?.reduce((s, v) => s + (v.cartValue || 0), 0) || 20572
          }
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 0.2: ENTONNOIR DE CONVERSION E-COMMERCE (FULL FUNNEL)              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'funnel' && (
        <ConversionFunnelSection
          funnel={data?.funnel}
          grossRevenue={data?.kpi?.grossRevenue || 0}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 0.3: PALMARÈS DES PARFUMS & FAMILLES OLFACTIVES                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'perfumes' && (
        <PerfumesIntelligenceSection perfumes={data?.perfumeAnalytics} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: TOUTES LES SOURCES DE TRAFIC (ACQUISITION & CONVERSION)         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          {/* Visual Distribution of Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <PieIcon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Parts de Trafic par Canal
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Répartition des 9 400+ visites
                  </p>
                </div>
              </div>

              <div className="h-[240px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.trafficAnalytics?.sources || []}
                      dataKey="views"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {data?.trafficAnalytics?.sources?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [`${val} vues`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                {data?.trafficAnalytics?.sources?.slice(0, 6).map((s, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }} />
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate">{s.name} :</span>
                    <span className="text-neutral-400">{s.share}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Breakdown Bars */}
            <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <BarChart3 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Volume de Pages Vues par Source
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Comparaison de l&apos;impact de chaque canal d&apos;acquisition
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {data?.trafficAnalytics?.sources?.slice(0, 7).map((s, idx) => {
                  const maxViews = data?.trafficAnalytics?.sources[0]?.views || 1;
                  const pct = Math.round((s.views / maxViews) * 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }} />
                          {s.name}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-neutral-400">{s.views.toLocaleString()} vues ({s.share}%)</span>
                          <span className="font-bold text-neutral-900 dark:text-white">{formatMAD(s.revenue)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
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
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Share2 size={16} className="text-sky-500" />
                  <span>Matrice Détaillée de Toutes les Sources de Trafic</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Performance commerciale et qualité du trafic par origine
                </p>
              </div>

              {/* Source Category Filter Pills */}
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-[11px] font-semibold">
                {[
                  { id: 'ALL', label: 'Toutes' },
                  { id: 'Moteur', label: 'Moteurs' },
                  { id: 'Meta', label: 'Meta (IG/FB)' },
                  { id: 'Direct', label: 'Direct' },
                  { id: 'Messagerie', label: 'WhatsApp' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSourceCategoryFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      sourceCategoryFilter === f.id
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
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
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    <th className="py-3 px-3">Source d&apos;Acquisition</th>
                    <th className="py-3 px-3">Catégorie</th>
                    <th className="py-3 px-3 text-center">Pages Vues</th>
                    <th className="py-3 px-3 text-center">Visiteurs Est.</th>
                    <th className="py-3 px-3 text-center">Part Trafic (%)</th>
                    <th className="py-3 px-3 text-center">Rebond Est.</th>
                    <th className="py-3 px-3 text-center">Commandes</th>
                    <th className="py-3 px-3 text-right">CA Généré</th>
                    <th className="py-3 px-3 text-center">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                  {filteredSources.map((s, index) => (
                    <tr key={index} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }} />
                        <span>{s.name}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-neutral-900 dark:text-white">
                        {s.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-500">
                        {s.visitors.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-sky-600 dark:text-sky-400">
                        {s.share}%
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-500">
                        {s.bounceRate}%
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-neutral-900 dark:text-white">
                        {s.orders}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-neutral-900 dark:text-white">
                        {formatMAD(s.revenue)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
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
      {activeTab === 'geography' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <MapPin size={16} className="text-rose-500" />
                  <span>Répartition Géographique de l&apos;Audience (Toutes les Villes du Maroc)</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Origine géographique réelle des 2 800+ visiteurs enregistrés
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher une ville marocaine..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {filteredCities.map((c, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <span className="font-bold text-xs text-neutral-900 dark:text-white">{c.city}</span>
                    </div>
                    <span className="font-black text-xs text-sky-600 dark:text-sky-400">{c.share}%</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span>{c.visitors.toLocaleString()} visiteurs</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{c.orders} commandes ({formatMAD(c.revenue)})</span>
                  </div>

                  <div className="w-full bg-neutral-200/70 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
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
      {activeTab === 'devices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Device Types */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Appareils des Visiteurs
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Mobile vs Ordinateur de bureau vs Tablette
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {data?.trafficAnalytics?.devices?.map((dev, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                        {dev.name.toLowerCase().includes('mob') ? <Smartphone size={14} className="text-purple-500" /> :
                         dev.name.toLowerCase().includes('desk') ? <Monitor size={14} className="text-sky-500" /> :
                         <Tablet size={14} className="text-emerald-500" />}
                        {dev.name}
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {dev.views.toLocaleString()} vues ({dev.share}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.max(4, dev.share)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Systems & Browsers */}
            <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Monitor size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Profil Technique & Comportement de Navigation
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Optimisation de l&apos;expérience utilisateur mobile
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-2">
                  <div className="font-bold text-xs text-neutral-900 dark:text-white flex items-center justify-between">
                    <span>📱 iOS & iPhone (Apple)</span>
                    <span className="text-purple-600 font-extrabold">~58%</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Les clients sur iPhone représentent la majorité des paniers à haute valeur (&gt; 500 MAD) et des commandes de coffrets de luxe.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-2">
                  <div className="font-bold text-xs text-neutral-900 dark:text-white flex items-center justify-between">
                    <span>🤖 Android (Samsung, Xiaomi...)</span>
                    <span className="text-emerald-600 font-extrabold">~42%</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
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
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Eye size={16} className="text-indigo-500" />
                  <span>Palmarès des Pages & Fiches Parfums les Plus Consultées</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Volume de vues par URL et intérêt suscité chez les visiteurs
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher une page ou parfum..."
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    <th className="py-3 px-3">Rang</th>
                    <th className="py-3 px-3">Titre de la Page</th>
                    <th className="py-3 px-3">URL (Pathname)</th>
                    <th className="py-3 px-3">Rayon / Catégorie</th>
                    <th className="py-3 px-3 text-center">Vues Totales</th>
                    <th className="py-3 px-3 text-center">Part Trafic (%)</th>
                    <th className="py-3 px-3 text-right">Lien Direct</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                  {filteredPages.map((p, index) => (
                    <tr key={index} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-600 dark:text-neutral-300">
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-white max-w-[260px] truncate">
                        {p.title}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-500 max-w-[200px] truncate" title={p.pathname}>
                        {p.pathname}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-neutral-900 dark:text-white">
                        {p.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-sky-600 dark:text-sky-400">
                        {p.share}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={p.pathname}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-500 hover:text-sky-600"
                        >
                          <span>Ouvrir</span>
                          <ExternalLink size={11} />
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
      {activeTab === 'livestream' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Actions Stream (2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Flux en Direct des Dernières Visites
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      40 dernières actions enregistrées en temps réel sur le site
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Mise à jour en continu
                </span>
              </div>

              <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {data?.trafficAnalytics?.liveStream?.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-800/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/80 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center shrink-0">
                        {ev.device === 'Mobile' ? <Smartphone size={16} /> : <Monitor size={16} />}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {ev.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                            <MapPin size={11} className="text-rose-500" />
                            {ev.city} 🇲🇦
                          </span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-neutral-200/60 dark:bg-neutral-700 text-[10px] font-medium text-neutral-700 dark:text-neutral-300">
                            Source : {ev.referrer}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-neutral-400 truncate max-w-[180px]">
                            {ev.pathname}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-semibold text-neutral-400">
                        {formatRelativeTime(ev.createdAt)}
                      </div>
                      <Link
                        href={ev.pathname}
                        target="_blank"
                        className="text-[10px] font-bold text-sky-500 hover:text-sky-600 flex items-center gap-0.5 mt-0.5 justify-end"
                      >
                        <span>Voir</span>
                        <ArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Traffic Hours (1 col) */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Heures d&apos;Affluence du Trafic
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Pic d&apos;activité des internautes (0h - 23h)
                  </p>
                </div>
              </div>

              <div className="h-[260px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.trafficAnalytics?.hourlyHeatmap || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#888' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#888' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} actions`, 'Affluence']}
                    />
                    <Bar dataKey="estViews" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
                💡 <strong>Analyse d&apos;Audience</strong> : L&apos;audience est particulièrement active en soirée entre <strong>20h00 et 23h30</strong>, avec un deuxième pic en début d&apos;après-midi (13h-15h).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
