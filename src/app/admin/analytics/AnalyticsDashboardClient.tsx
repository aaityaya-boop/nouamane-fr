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
  Tablet, Video, AtSign, Gauge, Lightbulb
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
    <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans text-neutral-900 dark:text-neutral-100">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: RESEND MINIMALIST & PROFESSIONAL                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eaeaea] dark:border-[#222227]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              Audience &amp; Trafic
            </h1>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Maison NAY Parfums
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {data?.kpi?.activeVisitorsCount ?? 1} en direct
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pilotage des flux de visiteurs en temps réel, diagnostic d&apos;acquisition et entonnoir pour <strong className="font-medium text-neutral-700 dark:text-neutral-200">nayparfum.ma</strong>
          </p>
        </div>

        {/* Global Action Cluster */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchAnalytics(false, true)}
            disabled={isRefreshing}
            className="h-8 px-3 inline-flex items-center gap-1.5 bg-white dark:bg-[#121215] hover:bg-neutral-50 dark:hover:bg-[#18181d] border border-[#eaeaea] dark:border-[#222227] text-neutral-700 dark:text-neutral-200 text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Rafraîchir les statistiques en temps réel"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={handleExportVisitorsCSV}
            disabled={!data?.trafficAnalytics?.visitorSessions?.length}
            className="h-8 px-3 inline-flex items-center gap-1.5 bg-white dark:bg-[#121215] hover:bg-neutral-50 dark:hover:bg-[#18181d] border border-[#eaeaea] dark:border-[#222227] text-neutral-700 dark:text-neutral-200 text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Users size={12} />
            <span>Export Visiteurs</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!data}
            className="h-8 px-3.5 inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download size={12} />
            <span>Rapport Global</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DATE FILTER BAR                                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center bg-neutral-100 dark:bg-[#1c1c21] p-0.5 rounded-md text-xs overflow-x-auto max-w-full">
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
                className={`px-3 py-1.5 rounded transition-all cursor-pointer text-xs font-medium whitespace-nowrap ${
                  isSelected
                    ? 'bg-white dark:bg-[#121215] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            );
          })}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer text-xs font-medium whitespace-nowrap ${
              period === 'custom'
                ? 'bg-white dark:bg-[#121215] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Calendar size={12} />
            <span>Personnalisé</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Moteur de télémesure : <strong>NAY Live Sensor</strong></span>
        </div>
      </div>

      {/* Custom Date Picker Dropdown */}
      {showDatePicker && (
        <div className="p-4 bg-white dark:bg-[#121215] rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs flex flex-wrap items-center gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-neutral-500 dark:text-neutral-400">Début :</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 rounded border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-xs font-mono text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-neutral-500 dark:text-neutral-400">Fin :</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 rounded border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-xs font-mono text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>
          <button
            onClick={() => {
              if (customStartDate && customEndDate) setPeriod('custom');
            }}
            disabled={!customStartDate || !customEndDate}
            className="h-7 px-3 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-40 rounded text-xs font-medium transition-colors cursor-pointer"
          >
            Appliquer
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. 6 EXECUTIVE TRAFFIC & FINANCIAL KPIS (MINIMALIST RESEND CARDS)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Chiffre d'Affaires Brut */}
        <div className="bg-white dark:bg-[#121215] p-4 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Chiffre d&apos;Affaires</div>
          <div className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white font-mono mt-1">
            {data ? formatMAD(data.kpi.grossRevenue) : '—'}
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Encaissé : <strong className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">{data ? formatMAD(data.kpi.deliveredRevenue) : '—'}</strong>
          </div>
        </div>

        {/* KPI 2: Commandes & Panier Moyen */}
        <div className="bg-white dark:bg-[#121215] p-4 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Commandes</div>
          <div className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white font-mono mt-1">
            {data?.kpi?.totalOrders?.toLocaleString() ?? '—'}
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Panier moyen : <strong className="font-medium text-neutral-700 dark:text-neutral-300 font-mono">{data ? formatMAD(data.kpi.aov) : '—'}</strong>
          </div>
        </div>

        {/* KPI 3: Visiteurs Uniques */}
        <div className="bg-white dark:bg-[#121215] p-4 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Visiteurs Uniques</div>
          <div className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white font-mono mt-1">
            {data?.kpi?.visitorsCount?.toLocaleString() ?? '—'}
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Pages vues : <strong className="font-medium text-neutral-700 dark:text-neutral-300 font-mono">{data?.kpi?.pageViewsCount?.toLocaleString() ?? '—'}</strong>
          </div>
        </div>

        {/* KPI 4: Taux de Conversion */}
        <div className="bg-white dark:bg-[#121215] p-4 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Taux Conversion</div>
          <div className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white font-mono mt-1">
            {data?.kpi?.conversionRate ?? 0}%
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Livraison : <strong className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">{data?.kpi?.deliveryRate ?? 0}%</strong>
          </div>
        </div>

        {/* KPI 5: Paniers en Cours */}
        <div className="bg-white dark:bg-[#121215] p-4 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Paniers Actifs</div>
          <div className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white font-mono mt-1">
            {formatMAD(data?.trafficAnalytics?.visitorSessions?.reduce((s, v) => s + (v.cartValue || 0), 0) || 0)}
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            À relancer : <strong className="font-medium text-amber-600 dark:text-amber-400 font-mono">{data?.trafficAnalytics?.visitorSessions?.filter(s => s.hasCart || s.cartValue > 0).length || 0} paniers</strong>
          </div>
        </div>

        {/* KPI 6: Taux de Rebond */}
        <div className="bg-white dark:bg-[#121215] p-4 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Taux Rebond</div>
          <div className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white font-mono mt-1">
            {data?.kpi?.bounceRate ?? 0}%
          </div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Durée moy. : <strong className="font-medium text-neutral-700 dark:text-neutral-300 font-mono">{data?.kpi?.avgDuration ?? '—'}</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. 5 EXECUTIVE DASHBOARD TABS (RESEND UNDERLINE STYLE)                     */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-6 border-b border-[#eaeaea] dark:border-[#222227] overflow-x-auto text-sm">
        {[
          {
            id: 'visitors',
            label: 'Visiteurs & Registre Live',
            count: data?.trafficAnalytics?.visitorSessions?.length,
          },
          {
            id: 'funnel',
            label: 'Entonnoir de Conversion',
            badge: data?.kpi ? `${data.kpi.conversionRate}%` : undefined,
          },
          {
            id: 'perfumes',
            label: 'Performance Parfums & Stocks',
            count: data?.perfumeAnalytics?.bestSellers?.length,
          },
          {
            id: 'geography',
            label: 'Villes & Canaux de Trafic',
            badge: 'Maroc MA',
          },
          {
            id: 'marketing_ai',
            label: 'Marketing, ROAS & Ads',
            badge: 'ROAS',
          },
        ].map((tab) => {
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'geography' && (activeTab === 'sources' || activeTab === 'devices' || activeTab === 'pages' || activeTab === 'livestream'));

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative pb-3 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-black dark:text-white border-b-2 border-black dark:border-white font-semibold -mb-px'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-neutral-900 text-white dark:bg-white dark:text-black' : 'bg-neutral-100 text-neutral-600 dark:bg-[#1c1c21] dark:text-neutral-300'
                }`}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 dark:bg-[#1c1c21] dark:text-neutral-300 font-mono font-medium border border-[#eaeaea] dark:border-[#222227]">
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
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-neutral-100 dark:bg-[#1c1c21] rounded-md border border-[#eaeaea] dark:border-[#26262b] w-fit max-w-full" style={{ scrollbarWidth: 'none' }}>
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
                      ? 'bg-white dark:bg-[#121215] text-neutral-900 dark:text-white shadow-2xs font-semibold'
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
            <div className="bg-white dark:bg-[#121215] p-4.5 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-4">
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
            <div className="lg:col-span-2 bg-white dark:bg-[#121215] p-4.5 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-4">
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
          <div className="bg-white dark:bg-[#121215] rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs overflow-hidden">
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
          <div className="bg-white dark:bg-[#121215] rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs p-4.5 space-y-4">
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
            <div className="bg-white dark:bg-[#121215] p-4.5 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-4">
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
            <div className="lg:col-span-2 bg-white dark:bg-[#121215] p-4.5 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-4">
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
          <div className="bg-white dark:bg-[#121215] rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs overflow-hidden">
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
            <div className="lg:col-span-2 bg-white dark:bg-[#121215] p-4.5 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-3">
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
            <div className="bg-white dark:bg-[#121215] p-4.5 rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-3">
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
