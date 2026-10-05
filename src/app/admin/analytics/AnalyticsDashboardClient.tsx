'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingBag, Users, Globe, Clock,
  Smartphone, Monitor, Filter, Activity, MapPin, Sparkles,
  Package, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw,
  Download, Calendar, Award, AlertTriangle, CheckCircle2,
  XCircle, Truck, PieChart as PieIcon, Layers, ChevronRight,
  Eye, ShieldCheck, Heart, Search, HelpCircle, Flame, ExternalLink,
  Radio, Target, Compass, Droplets, Zap, Share2, MessageCircle,
  UserCheck, ArrowRight, BarChart3, ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatMAD } from '@/lib/products';

type PeriodType = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | '90d' | 'year' | 'all' | 'custom';
type TabType = 'radar' | 'overview' | 'marketing' | 'olfactory' | 'perfumes' | 'geography';

interface AnalyticsData {
  period: {
    id: string;
    label: string;
    start: string;
    end: string;
  };
  kpi: {
    grossRevenue: number;
    deliveredRevenue: number;
    inTransitRevenue: number;
    lostRevenue: number;
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    refusedOrReturnedOrders: number;
    deliveryRate: number;
    aov: number;
    totalBottlesSold: number;
    uniqueCustomers: number;
    repeatCustomerRate: number;
    visitorsCount: number;
    pageViewsCount: number;
    activeVisitorsCount: number;
    conversionRate: number;
    deltas: {
      revenue: number;
      orders: number;
      aov: number;
      delivered: number;
    };
  };
  marketingUnitEconomics: {
    estimatedAdSpend: number;
    roas: number;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    avgRepurchaseCycleDays: number;
    abandonedCartRate: number;
    totalLiveCartsValue: number;
    rfm: {
      championsCount: number;
      loyalCount: number;
      newCustomersCount: number;
      atRiskCount: number;
    };
    channels: Array<{
      name: string;
      orders: number;
      revenue: number;
      aov: number;
      share: number;
    }>;
  };
  olfactoryIntelligence: {
    families: Array<{
      name: string;
      revenue: number;
      units: number;
      share: number;
    }>;
    gender: Array<{
      name: string;
      revenue: number;
      units: number;
      aov: number;
      orders: number;
    }>;
    crossSellingPairs: Array<{
      pairName: string;
      itemA: string;
      itemB: string;
      count: number;
      revenue: number;
    }>;
  };
  liveRadar: {
    activeVisitorsCount: number;
    liveEvents: Array<{
      id: number;
      createdAt: string;
      device: string;
      referrer: string;
      city: string;
      country: string;
      pathname: string;
      eventType: string;
      title: string;
      productName?: string;
    }>;
    activeCarts: Array<{
      id: string;
      sessionId: string;
      customerName: string;
      customerPhone?: string | null;
      customerCity: string;
      totalValue: number;
      itemsCount: number;
      items: string[];
      lastActivity: string;
    }>;
  };
  charts: {
    timeSeries: Array<{ label: string; date: string; revenue: number; orders: number }>;
    funnel: Array<{ name: string; value: number; count: number; rate: number }>;
    peakHours: number[];
    peakDays: Array<{ name: string; orders: number }>;
    brands: Array<{ name: string; revenue: number; units: number }>;
    categories: Array<{ name: string; revenue: number; units: number }>;
    bottleSizes: Array<{ size: string; count: number }>;
  };
  perfumes: {
    bestSellers: Array<{
      slug: string;
      name: string;
      brandLabel: string;
      category: string;
      gender: string;
      image: string;
      unitsSold: number;
      revenue: number;
      orderCount: number;
      stock: number;
      inStock: boolean;
      price: number;
      viewsCount: number;
      conversionRate: number;
      performanceBadge: string;
    }>;
    lowStockAlerts: Array<{
      id: number;
      name: string;
      slug: string;
      brandLabel: string;
      stock: number;
      inStock: boolean;
      price: number;
      image?: string;
    }>;
  };
  clients: {
    topCustomers: Array<{
      name: string;
      email: string;
      phone: string;
      city: string;
      orderCount: number;
      totalSpent: number;
      deliveredCount: number;
      refusedCount: number;
      lastOrderDate: string;
    }>;
    cities: Array<{
      city: string;
      orders: number;
      revenue: number;
      delivered: number;
      refused: number;
      deliveryRate: number;
      share: number;
    }>;
    newVsReturning: Array<{ name: string; value: number }>;
  };
  logistics: {
    statusDistribution: Record<string, number>;
    codHealth: {
      encaisse: number;
      enTransit: number;
      perdu: number;
    };
  };
}

const BRAND_PALETTE = [
  '#0ea5e9', '#6366f1', '#d97706', '#ec4899', '#10b981',
  '#8b5cf6', '#14b8a6', '#f43f5e', '#a855f7', '#64748b'
];

const OLFACTORY_COLORS: Record<string, string> = {
  'Boisé & Oud': '#78350f',
  'Ambré & Oriental': '#b45309',
  'Frais & Hespéridé': '#0284c7',
  'Floral & Poudré': '#ec4899',
  'Gourmand & Vanillé': '#ca8a04',
  'Épicé & Aromatique': '#dc2626',
};

export default function AnalyticsDashboardClient() {
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('radar');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch Analytics
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

  // Auto-refresh live radar every 25 seconds if on radar tab
  useEffect(() => {
    if (activeTab !== 'radar') return;
    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 25000);
    return () => clearInterval(interval);
  }, [activeTab, fetchAnalytics]);

  // Export Executive CSV
  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `RAPPORT MARKETING & ANALYTICS LUXE - NAY PARFUM (${data.period.label})\r\n\r\n`;

    csvContent += '--- 1. INDICATEURS FINANCIERS & MARKETING ---\r\n';
    csvContent += `Chiffre d'Affaires Brut,${data.kpi.grossRevenue} MAD\r\n`;
    csvContent += `Chiffre d'Affaires Encaissé (COD Livré),${data.kpi.deliveredRevenue} MAD\r\n`;
    csvContent += `Chiffre d'Affaires En Transit,${data.kpi.inTransitRevenue} MAD\r\n`;
    csvContent += `Chiffre d'Affaires Perdu (Refus/Retours),${data.kpi.lostRevenue} MAD\r\n`;
    csvContent += `Commandes Totales,${data.kpi.totalOrders}\r\n`;
    csvContent += `Commandes Livrées,${data.kpi.deliveredOrders}\r\n`;
    csvContent += `Taux de Livraison Réussie,${data.kpi.deliveryRate}%\r\n`;
    csvContent += `Panier Moyen (AOV),${data.kpi.aov} MAD\r\n`;
    csvContent += `Flacons Vendus,${data.kpi.totalBottlesSold}\r\n`;
    csvContent += `Taux de Conversion Web,${data.kpi.conversionRate}%\r\n`;
    csvContent += `Taux de Réachat (Fidélité),${data.kpi.repeatCustomerRate}%\r\n`;
    csvContent += `Cycle Moyen de Réachat,${data.marketingUnitEconomics.avgRepurchaseCycleDays} Jours\r\n`;
    csvContent += `ROAS Estimé,${data.marketingUnitEconomics.roas}x\r\n`;
    csvContent += `CAC Estimé,${data.marketingUnitEconomics.cac} MAD\r\n`;
    csvContent += `LTV Estimée,${data.marketingUnitEconomics.ltv} MAD\r\n`;
    csvContent += `Ratio LTV:CAC,${data.marketingUnitEconomics.ltvCacRatio}x\r\n\r\n`;

    csvContent += '--- 2. PALMARÈS DES PARFUMS & CONVERSION PRODUIT ---\r\n';
    csvContent += 'Nom,Marque,Famille Olfactive,Genre,Flacons Vendus,Vues Fiche,Taux Conversion (%),CA Genere (MAD),Stock Restant\r\n';
    data.perfumes.bestSellers.forEach((p) => {
      csvContent += `"${p.name.replace(/"/g, '""')}","${p.brandLabel}","${p.category}","${p.gender}",${p.unitsSold},${p.viewsCount},${p.conversionRate}%,${p.revenue},${p.stock}\r\n`;
    });

    csvContent += '\r\n--- 3. FAMILLES OLFACTIVES ---\r\n';
    csvContent += 'Famille Olfactive,CA (MAD),Flacons Vendus,Part de Marche (%)\r\n';
    data.olfactoryIntelligence.families.forEach((f) => {
      csvContent += `"${f.name}",${f.revenue},${f.units},${f.share}%\r\n`;
    });

    csvContent += '\r\n--- 4. PERFORMANCES PAR VILLE DU MAROC ---\r\n';
    csvContent += 'Ville,Commandes,CA (MAD),Livrees,Taux de Succes (%)\r\n';
    data.clients.cities.forEach((c) => {
      csvContent += `"${c.city}",${c.orders},${c.revenue},${c.delivered},${c.deliveryRate}%\r\n`;
    });

    csvContent += '\r\n--- 5. CLIENTS VIP DU ROYAUME ---\r\n';
    csvContent += 'Nom,Telephone,Ville,Commandes,Total Depense (MAD),Livrees\r\n';
    data.clients.topCustomers.forEach((cust) => {
      csvContent += `"${cust.name}","${cust.phone}","${cust.city}",${cust.orderCount},${cust.totalSpent},${cust.deliveredCount}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NAY_Luxury_Analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Products
  const filteredBestSellers = useMemo(() => {
    if (!data?.perfumes?.bestSellers) return [];
    if (!productSearch.trim()) return data.perfumes.bestSellers;
    const q = productSearch.toLowerCase().trim();
    return data.perfumes.bestSellers.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brandLabel.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [data, productSearch]);

  // Filtered Cities
  const filteredCities = useMemo(() => {
    if (!data?.clients?.cities) return [];
    if (!citySearch.trim()) return data.clients.cities;
    const q = citySearch.toLowerCase().trim();
    return data.clients.cities.filter((c) => c.city.toLowerCase().includes(q));
  }, [data, citySearch]);

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
      {/* ── LUXURY EXECUTIVE HEADER ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-500/10 to-sky-500/10 text-neutral-800 dark:text-neutral-200 border border-amber-200/50 dark:border-amber-900/50 flex items-center gap-2">
                <Sparkles size={13} className="text-amber-500 animate-pulse" />
                <span>Haute Parfumerie Intelligence Suite</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-semibold">{data?.kpi?.activeVisitorsCount || 1} visiteurs en direct</span>
              </span>

              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                {data?.period?.label || 'Chargement...'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
              <span>NAY Executive Analytics</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
                v2.5 Pro
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-3xl">
              Centre de commandement décisionnel pour parfumerie de prestige : radar d&apos;activité en temps réel, attribution publicitaire, intelligence olfactive et rétention client.
            </p>
          </div>

          {/* Quick Actions & Date Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => fetchAnalytics(false)}
              disabled={isRefreshing}
              className="p-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Rafraîchir les données"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-sky-500' : ''} />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!data}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              <span>Exporter Rapport CSV</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
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
                { id: 'all', label: 'Historique complet' },
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
            Monnaie : <strong className="text-neutral-700 dark:text-neutral-300">MAD (Dirham Marocain)</strong>
          </div>
        </div>

        {/* Custom Date Picker Dropdown */}
        {showDatePicker && (
          <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Du :</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Au :</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white"
              />
            </div>
            <button
              onClick={() => {
                if (customStartDate && customEndDate) {
                  setPeriod('custom');
                }
              }}
              disabled={!customStartDate || !customEndDate}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Appliquer le filtre
            </button>
          </div>
        )}
      </div>

      {/* ── LUXURY EXECUTIVE KPI DECK ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Gross Revenue */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Chiffre d&apos;Affaires</span>
            <DollarSign size={15} className="text-sky-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data ? formatMAD(data.kpi.grossRevenue) : '—'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Encaissé (COD) :</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {data ? formatMAD(data.kpi.deliveredRevenue) : '—'}
            </span>
          </div>
        </div>

        {/* KPI 2: Total Orders & Delivered Rate */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Commandes</span>
            <ShoppingBag size={15} className="text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data?.kpi?.totalOrders ?? '—'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Taux de livraison :</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {data ? `${data.kpi.deliveryRate}%` : '—'}
            </span>
          </div>
        </div>

        {/* KPI 3: AOV (Panier Moyen) */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Panier Moyen</span>
            <Award size={15} className="text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data ? formatMAD(data.kpi.aov) : '—'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Flacons vendus :</span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {data?.kpi?.totalBottlesSold ?? '—'}
            </span>
          </div>
        </div>

        {/* KPI 4: Blended ROAS */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">ROAS Pub Estimé</span>
            <Zap size={15} className="text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight flex items-baseline gap-1">
            <span>{data?.marketingUnitEconomics?.roas ?? '—'}</span>
            <span className="text-xs text-rose-500 font-bold">x</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">CAC estimé :</span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {data ? formatMAD(data.marketingUnitEconomics.cac) : '—'}
            </span>
          </div>
        </div>

        {/* KPI 5: LTV / Repurchase */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">LTV & Fidélité</span>
            <Heart size={15} className="text-pink-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data ? formatMAD(data.marketingUnitEconomics.ltv) : '—'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Cycle réachat :</span>
            <span className="font-bold text-pink-600 dark:text-pink-400">
              {data ? `${data.marketingUnitEconomics.avgRepurchaseCycleDays} j` : '—'}
            </span>
          </div>
        </div>

        {/* KPI 6: Web Traffic & Conversion */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Trafic & Taux</span>
            <Globe size={15} className="text-teal-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight">
            {data ? `${data.kpi.conversionRate}%` : '—'}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Visiteurs uniques :</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">
              {data?.kpi?.visitorsCount ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── LUXURY NAVIGATION TABS ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200 dark:border-neutral-800" style={{ scrollbarWidth: 'none' }}>
        {[
          { id: 'radar', label: '🔴 Live Radar & Activité', icon: <Radio size={15} className="text-rose-500 animate-pulse" /> },
          { id: 'overview', label: "Vue d'Ensemble & Ventes", icon: <BarChart3 size={15} /> },
          { id: 'marketing', label: 'Marketing, ROI & Segments', icon: <Target size={15} /> },
          { id: 'olfactory', label: 'Familles Olfactives & Parfums', icon: <Droplets size={15} /> },
          { id: 'perfumes', label: 'Palmarès Parfums & Fiches', icon: <Sparkles size={15} /> },
          { id: 'geography', label: 'Villes du Maroc & COD', icon: <MapPin size={15} /> },
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
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: LIVE RADAR & ACTIVITÉ DU SITE EN TEMPS RÉEL                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Live Pulse Banner */}
          <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-sky-950 text-white rounded-3xl p-6 shadow-md border border-neutral-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs uppercase font-extrabold tracking-widest text-rose-400">
                    Live Radar de Haute Parfumerie
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight">
                  Ce qui se passe sur nayparfum.ma en direct
                </h2>
                <p className="text-xs text-neutral-300 mt-1 max-w-2xl">
                  Flux continu des interactions visiteurs : consultations de flacons, ajouts au panier, paniers abandonnés et commandes passées.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-400">
                    {data?.liveRadar?.activeVisitorsCount || 1}
                  </div>
                  <div className="text-[10px] text-neutral-300 uppercase tracking-wider font-semibold">
                    Visiteurs Actifs
                  </div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-black text-amber-400">
                    {data ? formatMAD(data.marketingUnitEconomics.totalLiveCartsValue) : '0 MAD'}
                  </div>
                  <div className="text-[10px] text-neutral-300 uppercase tracking-wider font-semibold">
                    Valeur Paniers en Cours
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Event Stream (2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Flux des Dernières Actions en Direct
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      35 derniers événements enregistrés sur la boutique
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mise à jour automatique
                </span>
              </div>

              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {data?.liveRadar?.liveEvents?.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-800/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/80 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        ev.eventType === 'PRODUCT_VIEW' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 border-sky-200 dark:border-sky-800' :
                        ev.eventType === 'CART' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-200 dark:border-amber-800' :
                        ev.eventType === 'CHECKOUT' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200 dark:border-emerald-800' :
                        'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                      }`}>
                        {ev.eventType === 'PRODUCT_VIEW' ? <Eye size={16} /> :
                         ev.eventType === 'CART' ? <ShoppingCart size={16} /> :
                         ev.eventType === 'CHECKOUT' ? <Truck size={16} /> :
                         <Compass size={16} />}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {ev.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                            <MapPin size={11} className="text-rose-500" />
                            {ev.city} 🇲🇦
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {ev.device === 'Mobile' ? <Smartphone size={11} /> : <Monitor size={11} />}
                            {ev.device}
                          </span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-neutral-200/60 dark:bg-neutral-700 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
                            {ev.referrer}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-semibold text-neutral-400">
                        {formatRelativeTime(ev.createdAt)}
                      </div>
                      {ev.pathname.includes('/product/') && (
                        <Link
                          href={ev.pathname}
                          target="_blank"
                          className="text-[10px] font-bold text-sky-500 hover:text-sky-600 flex items-center gap-0.5 mt-0.5 justify-end"
                        >
                          <span>Voir</span>
                          <ArrowRight size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Carts Radar & WhatsApp Recovery (1 col) */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <ShoppingCart size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        Paniers Récents & Relance
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Paniers avec intention d&apos;achat en attente
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {data?.liveRadar?.activeCarts?.length === 0 && (
                    <div className="text-center py-8 text-neutral-400 text-xs">
                      Aucun panier actif pour le moment.
                    </div>
                  )}

                  {data?.liveRadar?.activeCarts?.map((cart) => (
                    <div
                      key={cart.id}
                      className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-2 hover:border-amber-400/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Users size={12} className="text-amber-500" />
                          <span>{cart.customerName}</span>
                        </div>
                        <span className="font-black text-xs text-amber-600 dark:text-amber-400">
                          {formatMAD(cart.totalValue)}
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex flex-wrap gap-1">
                        {cart.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10px] font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[180px]"
                          >
                            {it}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400">
                        <span>{formatRelativeTime(cart.lastActivity)}</span>
                        {cart.customerPhone ? (
                          <a
                            href={`https://wa.me/212${cart.customerPhone.replace(/[^0-9]/g, '').slice(-9)}?text=${encodeURIComponent(`Bonjour ${cart.customerName}, nous avons remarqué que vous n'avez pas finalisé votre commande de parfum chez NAY. Avez-vous besoin d'aide ?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
                          >
                            <MessageCircle size={11} />
                            <span>Relancer WhatsApp</span>
                          </a>
                        ) : (
                          <span className="text-neutral-400 italic">Session panier web</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: VUE D'ENSEMBLE & VENTES DE PARFUMS                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Area Chart: Revenue & Orders Over Time */}
          <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-sky-500" />
                  <span>Évolution Temporelle du Chiffre d&apos;Affaires & des Commandes</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Trajectoire des ventes sur la période sélectionnée ({data?.period?.label})
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-sky-500">
                  <span className="w-3 h-3 rounded-full bg-sky-500" /> Chiffre d&apos;Affaires (MAD)
                </span>
                <span className="flex items-center gap-1.5 text-indigo-500">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" /> Commandes
                </span>
              </div>
            </div>

            <div className="h-[320px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.charts?.timeSeries || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorOrd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(v) => `${v} DH`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(val: any, name: any) => [name === 'revenue' ? `${val} MAD` : val, name === 'revenue' ? 'Chiffre d’Affaires' : 'Commandes']}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorOrd)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid: Brand Market Share & Conversion Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Brands Market Share */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Award size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Parts de Marché par Marque de Parfum
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Top marques génératrices de chiffre d&apos;affaires
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {data?.charts?.brands?.slice(0, 7).map((b, idx) => {
                  const maxRev = data?.charts?.brands[0]?.revenue || 1;
                  const pct = Math.round((b.revenue / maxRev) * 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_PALETTE[idx % BRAND_PALETTE.length] }} />
                          {b.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-400">{b.units} flacons</span>
                          <span className="text-neutral-900 dark:text-white font-bold">{formatMAD(b.revenue)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: BRAND_PALETTE[idx % BRAND_PALETTE.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete Purchase Funnel */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Filter size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Entonnoir de Conversion Web (6 Étapes)
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Déperdition depuis la visite jusqu&apos;à l&apos;encaissement COD
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {data?.charts?.funnel?.map((step, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-neutral-800 dark:text-neutral-200">{step.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-900 dark:text-white font-bold">{step.count.toLocaleString()}</span>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                          {step.rate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, step.rate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: MARKETING INTELLIGENCE, AD ROI & RÉTENTION CLIENT               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'marketing' && (
        <div className="space-y-6">
          {/* Executive Marketing Unit Economics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111827] p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>ROAS BLENDÉ PUBS</span>
                <Zap size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white">
                {data?.marketingUnitEconomics?.roas}x
              </div>
              <p className="text-[11px] text-neutral-400">
                Chaque 1 MAD investi en publicité génère {data?.marketingUnitEconomics?.roas} MAD de commandes.
              </p>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>RATIO LTV : CAC</span>
                <Award size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {data?.marketingUnitEconomics?.ltvCacRatio}x
              </div>
              <p className="text-[11px] text-neutral-400">
                Norme Luxe &gt; 3.0x : Excellente rentabilité du modèle économique NAY.
              </p>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>CYCLE DE RÉACHAT MOYEN</span>
                <Clock size={16} className="text-sky-500" />
              </div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white">
                {data?.marketingUnitEconomics?.avgRepurchaseCycleDays} Jours
              </div>
              <p className="text-[11px] text-neutral-400">
                Délai exact avant qu&apos;un flacon ne se vide : moment idéal pour relancer le client par SMS/WhatsApp !
              </p>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold">
                <span>TAUX D&apos;ABANDON PANIER</span>
                <AlertTriangle size={16} className="text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {data?.marketingUnitEconomics?.abandonedCartRate}%
              </div>
              <p className="text-[11px] text-neutral-400">
                {data ? formatMAD(data.marketingUnitEconomics.totalLiveCartsValue) : '0 MAD'} de commandes récupérables via relances.
              </p>
            </div>
          </div>

          {/* RFM Customer Segmentation Matrix */}
          <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Segmentation Clientèle RFM (Récence, Fréquence, Montant)
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Cohortes stratégiques pour campagnes WhatsApp et offres personnalisées
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs text-amber-800 dark:text-amber-300">
                  <span>🌟 VIPs & Champions</span>
                  <span className="text-base">{data?.marketingUnitEconomics?.rfm?.championsCount || 0}</span>
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                  $\ge 3$ commandes ou dépensé $> 1 000$ MAD. À choyer avec des avant-premières et cadeaux testeurs.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs text-sky-800 dark:text-sky-300">
                  <span>💎 Clients Fidèles</span>
                  <span className="text-base">{data?.marketingUnitEconomics?.rfm?.loyalCount || 0}</span>
                </div>
                <p className="text-[11px] text-sky-700/80 dark:text-sky-400/80">
                  2 commandes passées. Cible parfaite pour le programme de parrainage et découverte d&apos;autres marques.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs text-rose-800 dark:text-rose-300">
                  <span>⚠️ Clients À Risque</span>
                  <span className="text-base">{data?.marketingUnitEconomics?.rfm?.atRiskCount || 0}</span>
                </div>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                  Dernier achat il y a plus de 45 jours. À réactiver d&apos;urgence avec un coupon exclusif -15% sur WhatsApp.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs text-emerald-800 dark:text-emerald-300">
                  <span>🌱 Nouveaux Acheteurs</span>
                  <span className="text-base">{data?.marketingUnitEconomics?.rfm?.newCustomersCount || 0}</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  1ère commande réussie. À intégrer dans la séquence d&apos;accueil et conseils d&apos;application du parfum.
                </p>
              </div>
            </div>
          </div>

          {/* Ad Channel Attribution & Peak Purchase Windows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Acquisition Channels */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Share2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Attribution des Ventes par Canal Marketing
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Provenance des acheteurs et performance commerciale
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {data?.marketingUnitEconomics?.channels?.map((ch, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">{ch.name}</div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {ch.orders} commandes générées
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">{formatMAD(ch.revenue)}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Actif
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Ordering Hours (Dayparting) */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Heures d&apos;Affluence des Achats (Dayparting)
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Créneaux optimaux pour intensifier vos budgets publicitaires
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-[220px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.peakHours?.map((count, hour) => ({ hour: `${hour}h`, count })) || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} commande(s)`, 'Volume']}
                    />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 text-[11px] text-sky-800 dark:text-sky-300">
                💡 <strong>Conseil Marketing NAY</strong> : Programmez vos campagnes Meta & TikTok Ads avec un pic de budget entre <strong>20h00 et 23h30</strong>, moment où le taux de conversion au Maroc est maximal.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: FAMILLES OLFACTIVES & INTELLIGENCE PRODUIT                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'olfactory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Olfactory Families Performance */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Droplets size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Roue des Familles Olfactives
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Préférences olfactives des clients marocains
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                {data?.olfactoryIntelligence?.families?.map((f, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-neutral-900 dark:text-white flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: OLFACTORY_COLORS[f.name] || '#6366f1' }} />
                        {f.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-400">{f.units} flacons ({f.share}%)</span>
                        <span className="font-bold text-neutral-900 dark:text-white">{formatMAD(f.revenue)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, f.share)}%`, backgroundColor: OLFACTORY_COLORS[f.name] || '#6366f1' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender Targeting & Cross-Selling Pairs */}
            <div className="space-y-6">
              {/* Gender Breakdown */}
              <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        Segmentation par Genre
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Pour Homme vs Pour Femme vs Unisexe
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {data?.olfactoryIntelligence?.gender?.map((g, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-center space-y-1">
                      <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">{g.name}</div>
                      <div className="text-base font-black text-neutral-900 dark:text-white">{formatMAD(g.revenue)}</div>
                      <div className="text-[10px] text-neutral-400">{g.units} flacons</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-Selling Pairs (Bought Together) */}
              <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Layers size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        Ventes Croisées : Fréquemment Achetés Ensemble
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Duos de parfums à regrouper en bundles ou coffrets
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {data?.olfactoryIntelligence?.crossSellingPairs?.length === 0 && (
                    <div className="text-center py-6 text-neutral-400 text-xs">
                      Aucune paire multi-articles enregistrée sur la période.
                    </div>
                  )}

                  {data?.olfactoryIntelligence?.crossSellingPairs?.map((pair, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {pair.pairName}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white">{pair.count} paniers</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">{formatMAD(pair.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: PALMARÈS DES PARFUMS & RENDEMENT PRODUIT                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'perfumes' && (
        <div className="space-y-6">
          {/* Low Stock Reorder Banner */}
          {data?.perfumes?.lowStockAlerts && data.perfumes.lowStockAlerts.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Alertes Réassort Urgent : {data.perfumes.lowStockAlerts.length} Parfums en Rupture Imminente
                    </h3>
                    <Link href="/admin/inventory" className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline">
                      Gérer le stock →
                    </Link>
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {data.perfumes.lowStockAlerts.map((p) => (
                      <div key={p.id} className="p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-amber-200/60 dark:border-amber-900/40 text-xs">
                        <div className="font-semibold text-neutral-900 dark:text-white truncate">{p.name}</div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-neutral-500">{p.brandLabel}</span>
                          <span className="font-black text-rose-600 dark:text-rose-400">
                            {p.stock <= 0 ? 'Épuisé' : `${p.stock} restant(s)`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Perfume Performance Table */}
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Matrice d&apos;Efficience des Parfums (Vues vs Ventes)</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Détection des pépites à booster en publicité et des bloqueurs de conversion
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher parfum ou marque..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    <th className="py-3 px-3">Rang</th>
                    <th className="py-3 px-3">Parfum</th>
                    <th className="py-3 px-3">Marque</th>
                    <th className="py-3 px-3">Genre</th>
                    <th className="py-3 px-3 text-center">Flacons Vendus</th>
                    <th className="py-3 px-3 text-center">Vues Fiche</th>
                    <th className="py-3 px-3 text-center">Conversion</th>
                    <th className="py-3 px-3">Statut Marketing</th>
                    <th className="py-3 px-3 text-right">CA Généré</th>
                    <th className="py-3 px-3 text-center">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                  {filteredBestSellers.map((p, index) => (
                    <tr key={index} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          index === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          index === 1 ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                          index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                          'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {p.image ? (
                            <Image
                              src={p.image}
                              alt={p.name}
                              width={32}
                              height={32}
                              className="rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                              <Package size={14} className="text-neutral-400" />
                            </div>
                          )}
                          <div className="font-semibold text-neutral-900 dark:text-white max-w-[200px] truncate" title={p.name}>
                            {p.name}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-500 dark:text-neutral-400">{p.brandLabel}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {p.gender}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-neutral-900 dark:text-white">{p.unitsSold}</td>
                      <td className="py-3 px-3 text-center text-neutral-500">{p.viewsCount}</td>
                      <td className="py-3 px-3 text-center font-black text-sky-600 dark:text-sky-400">{p.conversionRate}%</td>
                      <td className="py-3 px-3">
                        {p.performanceBadge === 'PEPITE_A_BOOSTER' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                            <Flame size={10} /> Pépite à booster
                          </span>
                        ) : p.performanceBadge === 'STAR' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
                            <Sparkles size={10} /> Best-Seller Star
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 w-fit">
                            Régulier
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-neutral-900 dark:text-white">{formatMAD(p.revenue)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.stock <= 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                          p.stock <= 4 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                          'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}>
                          {p.stock <= 0 ? 'Épuisé' : p.stock}
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
      {/* TAB 6: GÉOGRAPHIE DU MAROC & SANTÉ COD                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'geography' && (
        <div className="space-y-6">
          {/* COD Health Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-800/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span>ENCAISSÉ / LIVRÉ (FONDS SÉCURISÉS)</span>
                <CheckCircle2 size={18} />
              </div>
              <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                {data ? formatMAD(data.logistics.codHealth.encaisse) : '0 MAD'}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Argent déjà encaissé auprès des clients et validé par les livreurs.
              </p>
            </div>

            <div className="bg-sky-50/70 dark:bg-sky-950/30 p-5 rounded-3xl border border-sky-200 dark:border-sky-800/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-400">
                <span>EN COURS DE LIVRAISON (EN TRANSIT)</span>
                <Truck size={18} />
              </div>
              <div className="text-2xl font-black text-sky-800 dark:text-sky-200">
                {data ? formatMAD(data.logistics.codHealth.enTransit) : '0 MAD'}
              </div>
              <p className="text-[11px] text-sky-600 dark:text-sky-400">
                Colis confiés aux sociétés de messagerie, encaissement en attente.
              </p>
            </div>

            <div className="bg-rose-50/70 dark:bg-rose-950/30 p-5 rounded-3xl border border-rose-200 dark:border-rose-800/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400">
                <span>PERDU / REFUSÉ (MANQUE À GAGNER)</span>
                <XCircle size={18} />
              </div>
              <div className="text-2xl font-black text-rose-800 dark:text-rose-200">
                {data ? formatMAD(data.logistics.codHealth.perdu) : '0 MAD'}
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Commandes refusées au moment de la livraison ou annulées avant envoi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Moroccan Cities Ranking */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Palmarès des Villes du Maroc
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Volume de commandes et taux de succès de livraison COD
                    </p>
                  </div>
                </div>

                <div className="relative w-44">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Filtrer ville..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {filteredCities.map((c, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-neutral-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-[10px] font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        {c.city} 🇲🇦
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-400">{c.orders} commandes</span>
                        <span className="font-bold text-neutral-900 dark:text-white">{formatMAD(c.revenue)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Succès livraison : <strong className={c.deliveryRate >= 85 ? 'text-emerald-600' : 'text-amber-600'}>{c.deliveryRate}%</strong></span>
                      <span>Part des ventes : <strong>{c.share}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top VIP Clients */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Top Clients VIP du Royaume
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Meilleurs acheteurs à fidéliser en priorité
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {data?.clients?.topCustomers?.map((cust, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        {cust.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>{cust.city}</span>
                        <span>•</span>
                        <span>{cust.phone}</span>
                        <span>•</span>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">{cust.orderCount} commandes</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                        {formatMAD(cust.totalSpent)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Dernier achat : {new Date(cust.lastOrderDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
