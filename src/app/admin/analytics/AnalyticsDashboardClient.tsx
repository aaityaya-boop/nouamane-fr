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
  Eye, ShieldCheck, Heart, Search, HelpCircle, Flame, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatMAD } from '@/lib/products';

type PeriodType = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | '90d' | 'year' | 'all' | 'custom';
type TabType = 'overview' | 'perfumes' | 'clients' | 'traffic' | 'logistics';

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
    conversionRate: number;
    deltas: {
      revenue: number;
      orders: number;
      aov: number;
      delivered: number;
    };
  };
  charts: {
    timeSeries: Array<{ label: string; date: string; revenue: number; orders: number }>;
    funnel: Array<{ name: string; value: number; count: number; rate: number }>;
    peakHours: number[];
    peakDays: Array<{ name: string; orders: number }>;
    devices: Array<{ name: string; value: number }>;
    trafficSources: Array<{ name: string; value: number }>;
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
      image: string;
      unitsSold: number;
      revenue: number;
      orderCount: number;
      stock: number;
      inStock: boolean;
      price: number;
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

const BRAND_COLORS = [
  '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#14b8a6', '#f43f5e', '#a855f7', '#64748b'
];

export default function AnalyticsDashboardClient() {
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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

  // Export CSV Report
  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Rapport Analytique NAY Parfums - ${data.period.label}\r\n\r\n`;

    csvContent += '--- INDICATEURS CLES (KPIS) ---\r\n';
    csvContent += `Chiffre d'Affaires Brut,${data.kpi.grossRevenue} MAD\r\n`;
    csvContent += `Chiffre d'Affaires Encaissé,${data.kpi.deliveredRevenue} MAD\r\n`;
    csvContent += `Commandes Totales,${data.kpi.totalOrders}\r\n`;
    csvContent += `Commandes Livrées,${data.kpi.deliveredOrders}\r\n`;
    csvContent += `Taux de Livraison,${data.kpi.deliveryRate}%\r\n`;
    csvContent += `Panier Moyen (AOV),${data.kpi.aov} MAD\r\n`;
    csvContent += `Flacons Vendus,${data.kpi.totalBottlesSold}\r\n`;
    csvContent += `Visiteurs Uniques,${data.kpi.visitorsCount}\r\n`;
    csvContent += `Taux de Conversion Web,${data.kpi.conversionRate}%\r\n\r\n`;

    csvContent += '--- TOP PARFUMS VENDUS ---\r\n';
    csvContent += 'Nom,Marque,Categorie,Quantite Vendue,CA Genere (MAD),Stock Restant\r\n';
    data.perfumes.bestSellers.forEach((p) => {
      csvContent += `"${p.name.replace(/"/g, '""')}","${p.brandLabel}","${p.category}",${p.unitsSold},${p.revenue},${p.stock}\r\n`;
    });

    csvContent += '\r\n--- TOP VILLES (COMMANDES & REUSSITE) ---\r\n';
    csvContent += 'Ville,Commandes,CA (MAD),Livrees,Taux Reussite (%)\r\n';
    data.clients.cities.forEach((c) => {
      csvContent += `"${c.city}",${c.orders},${c.revenue},${c.delivered},${c.deliveryRate}%\r\n`;
    });

    csvContent += '\r\n--- TOP CLIENTS VIP ---\r\n';
    csvContent += 'Nom,Telephone,Ville,Commandes,Total Depense (MAD),Livrees\r\n';
    data.clients.topCustomers.forEach((cust) => {
      csvContent += `"${cust.name}","${cust.phone}","${cust.city}",${cust.orderCount},${cust.totalSpent},${cust.deliveredCount}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NAY_Analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
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
      (p) => p.name.toLowerCase().includes(q) || p.brandLabel.toLowerCase().includes(q)
    );
  }, [data, productSearch]);

  // Filtered Cities
  const filteredCities = useMemo(() => {
    if (!data?.clients?.cities) return [];
    if (!citySearch.trim()) return data.clients.cities;
    const q = citySearch.toLowerCase().trim();
    return data.clients.cities.filter((c) => c.city.toLowerCase().includes(q));
  }, [data, citySearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── TOP HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111827] p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              Intelligence & Données Directes
            </span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">•</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {data?.period?.label || '30 derniers jours'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp size={24} className="text-sky-500" />
            <span>Analytics & Performance Globale</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Analyse exhaustive des ventes de parfums, du comportement client, de la rentabilité logistique COD et de l&apos;entonnoir de conversion en ligne.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
          <button
            onClick={() => fetchAnalytics(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Rafraîchir les données"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Download size={13} />
            <span>Exporter Rapport CSV</span>
          </button>
        </div>
      </div>

      {/* ── PERIOD SELECTION PILLS ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#111827] p-2.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
        <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 px-2 flex items-center gap-1.5">
          <Calendar size={13} />
          Période :
        </span>
        {[
          { id: 'today', label: "Aujourd'hui" },
          { id: 'yesterday', label: 'Hier' },
          { id: '7d', label: '7 Jours' },
          { id: '30d', label: '30 Jours' },
          { id: 'this_month', label: 'Ce Mois' },
          { id: '90d', label: '90 Jours' },
          { id: 'year', label: 'Cette Année' },
          { id: 'all', label: 'Tout' },
          { id: 'custom', label: 'Personnalisé...' },
        ].map((p) => {
          const isActive = period === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                if (p.id === 'custom') {
                  setShowDatePicker(true);
                } else {
                  setShowDatePicker(false);
                }
                setPeriod(p.id as PeriodType);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-500 text-white shadow-xs font-semibold'
                  : 'bg-neutral-100/70 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
              }`}
            >
              {p.label}
            </button>
          );
        })}

        {/* Custom date range modal / popover inputs */}
        {showDatePicker && (
          <div className="w-full flex flex-wrap items-center gap-3 pt-3 mt-1 border-t border-neutral-100 dark:border-neutral-800 px-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Du :</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Au :</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white"
              />
            </div>
            <button
              onClick={() => fetchAnalytics(true)}
              className="px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-medium hover:bg-sky-700 transition-colors"
            >
              Appliquer
            </button>
          </div>
        )}
      </div>

      {/* ── CORE KPI CARDS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: CA Brut */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-800 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">CA Brut Total</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white">
            {isLoading ? '...' : formatMAD(data?.kpi?.grossRevenue || 0)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            {data?.kpi?.deltas?.revenue !== undefined && data.kpi.deltas.revenue >= 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                <ArrowUpRight size={12} /> +{data.kpi.deltas.revenue}%
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center">
                <ArrowDownRight size={12} /> {data?.kpi?.deltas?.revenue}%
              </span>
            )}
            <span className="text-neutral-400 dark:text-neutral-500">vs période préc.</span>
          </div>
        </div>

        {/* KPI 2: CA Encaissé / Livré */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">CA Encaissé (Livré)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {isLoading ? '...' : formatMAD(data?.kpi?.deliveredRevenue || 0)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            {data?.kpi?.deliveredOrders || 0} commandes livrées
          </div>
        </div>

        {/* KPI 3: Commandes & Taux Livraison */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Commandes</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingBag size={14} />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white">
            {isLoading ? '...' : data?.kpi?.totalOrders || 0}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              {data?.kpi?.deliveryRate || 0}%
            </span>
            <span className="text-neutral-400 dark:text-neutral-500">taux succès COD</span>
          </div>
        </div>

        {/* KPI 4: Panier Moyen (AOV) */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-800 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Panier Moyen</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award size={14} />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white">
            {isLoading ? '...' : formatMAD(data?.kpi?.aov || 0)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            {data?.kpi?.totalBottlesSold || 0} flacons vendus au total
          </div>
        </div>

        {/* KPI 5: Taux de Conversion Web */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-purple-300 dark:hover:border-purple-800 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Conversion Web</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Activity size={14} />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white">
            {isLoading ? '...' : `${data?.kpi?.conversionRate || 0}%`}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            {data?.kpi?.visitorsCount || 0} visiteurs uniques
          </div>
        </div>

        {/* KPI 6: Taux de Réachat Client */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-800 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Clients Récurrents</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Heart size={14} />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white">
            {isLoading ? '...' : `${data?.kpi?.repeatCustomerRate || 0}%`}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            {data?.kpi?.uniqueCustomers || 0} acheteurs distincts
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ──────────────────────────────────────────────── */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto pb-0">
        {[
          { id: 'overview', label: "Vue d'Ensemble", icon: <TrendingUp size={15} /> },
          { id: 'perfumes', label: 'Parfums & Best-Sellers', icon: <Sparkles size={15} /> },
          { id: 'clients', label: 'Clients & Villes du Maroc', icon: <Users size={15} /> },
          { id: 'traffic', label: 'Tunnel & Trafic Web', icon: <Globe size={15} /> },
          { id: 'logistics', label: 'Logistique & Encaiss. COD', icon: <Truck size={15} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-50/40 dark:bg-sky-950/20'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#111827] rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <RefreshCw size={28} className="animate-spin text-sky-500 mb-3" />
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Calcul en temps réel des métriques et des graphiques...
          </p>
        </div>
      ) : (
        <>
          {/* ═════════ TAB 1: VUE D'ENSEMBLE ═════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Sales Evolution Chart */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-sky-500" />
                      Évolution des Ventes & Chiffre d&apos;Affaires
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Courbe temporelle des revenus générés et du nombre de commandes passées.
                    </p>
                  </div>
                </div>

                <div className="h-[320px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data?.charts?.timeSeries || []}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(val) => `${val} DH`} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${val} MAD`, 'Revenus']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Funnel & Brands Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Brand breakdown */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Award size={16} className="text-amber-500" />
                      Parts de Marché par Marque
                    </h3>
                    <span className="text-[11px] text-neutral-400">Classement CA</span>
                  </div>

                  <div className="space-y-3">
                    {data?.charts?.brands?.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-8">Aucune commande sur cette période.</p>
                    ) : (
                      data?.charts?.brands?.map((brand, idx) => {
                        const totalBrandRev = data?.kpi?.grossRevenue || 1;
                        const pct = Math.round((brand.revenue / totalBrandRev) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{brand.name}</span>
                              <span className="font-bold text-neutral-900 dark:text-white">
                                {formatMAD(brand.revenue)} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: BRAND_COLORS[idx % BRAND_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Conversion Funnel Summary */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Filter size={16} className="text-sky-500" />
                      Entonnoir de Conversion Web
                    </h3>
                    <span className="text-[11px] text-neutral-400">Du visiteur au colis livré</span>
                  </div>

                  <div className="space-y-2.5">
                    {data?.charts?.funnel?.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                            {step.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white mr-2">
                            {step.count}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            {step.rate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 2: PARFUMS & PRODUITS ═════════ */}
          {activeTab === 'perfumes' && (
            <div className="space-y-6">
              {/* Category & Bottle size distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Category breakdown */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-2">
                    <Layers size={14} className="text-sky-500" />
                    Répartition par Gamme (Testeurs vs Originaux)
                  </h3>
                  <div className="space-y-2.5">
                    {data?.charts?.categories?.map((cat, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{cat.name}</span>
                        <div className="text-right">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white mr-2">{formatMAD(cat.revenue)}</span>
                          <span className="text-[11px] text-neutral-500">({cat.units} unités)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low Stock Opportunities Card */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      Alertes Réassort & Ruptures Imminentes
                    </h3>
                    <Link href="/admin/inventory" className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                      Gérer Stock →
                    </Link>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {data?.perfumes?.lowStockAlerts?.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-6">Tous vos parfums ont un stock suffisant.</p>
                    ) : (
                      data?.perfumes?.lowStockAlerts?.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-xl border border-rose-100 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-neutral-900 dark:text-white truncate max-w-[200px]">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-neutral-500">({p.brandLabel})</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.stock === 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          }`}>
                            {p.stock === 0 ? 'Rupture' : `${p.stock} restant(s)`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Top Perfumes Best-Sellers Table */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Flame size={16} className="text-amber-500" />
                      Classement des Parfums les Plus Vendus (Best-Sellers)
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Volume vendu, chiffre d&apos;affaires généré et disponibilité en stock.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Filtrer par nom ou marque..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        <th className="py-2.5 px-3"># Rang</th>
                        <th className="py-2.5 px-3">Parfum</th>
                        <th className="py-2.5 px-3">Marque</th>
                        <th className="py-2.5 px-3">Gamme</th>
                        <th className="py-2.5 px-3 text-right">Flacons Vendus</th>
                        <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                        <th className="py-2.5 px-3 text-right">CA Réalisé</th>
                        <th className="py-2.5 px-3 text-center">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-neutral-100 dark:divide-neutral-800/80 text-neutral-700 dark:text-neutral-300">
                      {filteredBestSellers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-neutral-400">
                            Aucun parfum correspondant trouvé.
                          </td>
                        </tr>
                      ) : (
                        filteredBestSellers.map((item, index) => (
                          <tr key={index} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-neutral-900 dark:text-white">
                              {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                {item.image ? (
                                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700">
                                    <Image src={item.image} alt={item.name} width={32} height={32} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                                    <Sparkles size={14} />
                                  </div>
                                )}
                                <span className="font-semibold text-neutral-900 dark:text-white line-clamp-1">
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">
                              {item.brandLabel}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-neutral-900 dark:text-white">
                              {item.unitsSold}
                            </td>
                            <td className="py-2.5 px-3 text-right text-neutral-600 dark:text-neutral-400">
                              {formatMAD(item.price)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-sky-600 dark:text-sky-400">
                              {formatMAD(item.revenue)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.stock > 5
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : item.stock > 0
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {item.stock} en stock
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 3: CLIENTS & VILLES ═════════ */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              {/* Moroccan Cities Distribution */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <MapPin size={16} className="text-rose-500" />
                      Répartition Géographique des Ventes (Villes du Maroc)
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Quelles villes génèrent le plus de commandes et affichent le meilleur taux de livraison.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Filtrer une ville..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCities.map((city, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-800/30 hover:border-sky-300 dark:hover:border-sky-800 transition-all space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <MapPin size={13} className="text-rose-500" />
                          {city.city}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                          {city.orders} commande(s)
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                        <span>Chiffre d&apos;Affaires :</span>
                        <span className="font-bold text-neutral-900 dark:text-white">{formatMAD(city.revenue)}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Taux de Livraison Réussi :</span>
                        <span className={`font-bold ${city.deliveryRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {city.deliveryRate}%
                        </span>
                      </div>

                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full"
                          style={{ width: `${city.deliveryRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top VIP Customers Table */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Award size={16} className="text-amber-500" />
                    Top Clients & Fidélité VIP
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Les clients ayant le plus grand volume de commandes et de dépenses sur la période.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Téléphone</th>
                        <th className="py-2.5 px-3">Ville</th>
                        <th className="py-2.5 px-3 text-right">Commandes</th>
                        <th className="py-2.5 px-3 text-right">Total Dépensé</th>
                        <th className="py-2.5 px-3 text-center">Colis Livrés</th>
                        <th className="py-2.5 px-3 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {data?.clients?.topCustomers?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-neutral-400">
                            Aucune donnée client pour cette période.
                          </td>
                        </tr>
                      ) : (
                        data?.clients?.topCustomers?.map((cust, i) => (
                          <tr key={i} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-white">
                              {cust.name}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {cust.phone || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              {cust.city}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-neutral-900 dark:text-white">
                              {cust.orderCount}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {formatMAD(cust.totalSpent)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {cust.deliveredCount}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cust.totalSpent > 1000
                                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
                                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                              }`}>
                                {cust.totalSpent > 1000 ? 'VIP Gold' : 'Régulier'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 4: TUNNEL & TRAFIC WEB ═════════ */}
          {activeTab === 'traffic' && (
            <div className="space-y-6">
              {/* Funnel Full Diagram */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Filter size={16} className="text-sky-500" />
                    Tunnel d&apos;Achat Complet & Déperdition (Drop-Off)
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Découvrez à quelle étape précise vos visiteurs abandonnent leur commande.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {data?.charts?.funnel?.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 text-center relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1">
                          Étape {idx + 1}
                        </div>
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-2">
                          {step.name.replace(/^\d+\.\s*/, '')}
                        </h4>
                        <div className="text-lg font-black text-sky-600 dark:text-sky-400">
                          {step.count.toLocaleString()}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                        <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                          {step.rate}%
                        </span>
                        <div className="text-[9px] text-neutral-400">rétention étape</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Devices and Peak Hours */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Traffic by device */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Smartphone size={16} className="text-indigo-500" />
                    Répartition par Appareil
                  </h3>
                  <div className="space-y-3 pt-2">
                    {data?.charts?.devices?.map((dev, idx) => {
                      const totalDev = data?.charts?.devices?.reduce((acc, d) => acc + d.value, 0) || 1;
                      const pct = Math.round((dev.value / totalDev) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{dev.name}</span>
                            <span className="font-bold text-neutral-900 dark:text-white">{pct}% ({dev.value} visites)</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Peak Hours Histogram */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Clock size={16} className="text-amber-500" />
                    Heures d&apos;Achat les Plus Actives (Heures de Pointe)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Volume de commandes par tranche horaire de la journée au Maroc.
                  </p>
                  <div className="h-[200px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.charts?.peakHours?.map((val, h) => ({ hour: `${h}h`, orders: val })) || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                          formatter={(v: any) => [`${v} commandes`, 'Commandes']}
                        />
                        <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 5: LOGISTIQUE & COD ═════════ */}
          {activeTab === 'logistics' && (
            <div className="space-y-6">
              {/* COD Health Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-950 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <span>Encaissé & Livré</span>
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatMAD(data?.logistics?.codHealth?.encaisse || 0)}
                  </div>
                  <p className="text-[11px] text-neutral-500">Revenus nets collectés avec succès en Cash on Delivery.</p>
                </div>

                <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-amber-200/80 dark:border-amber-950 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <span>En Cours de Livraison (En Transit)</span>
                    <Truck size={16} />
                  </div>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {formatMAD(data?.logistics?.codHealth?.enTransit || 0)}
                  </div>
                  <p className="text-[11px] text-neutral-500">Colis expédiés chez le transporteur, encaissement en attente.</p>
                </div>

                <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-rose-200/80 dark:border-rose-950 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-rose-700 dark:text-rose-300">
                    <span>Perdu (Refus / Retours)</span>
                    <XCircle size={16} />
                  </div>
                  <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                    {formatMAD(data?.logistics?.codHealth?.perdu || 0)}
                  </div>
                  <p className="text-[11px] text-neutral-500">Commandes annulées, refusées à la livraison ou retournées.</p>
                </div>
              </div>

              {/* Status Breakdown Table */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Layers size={16} className="text-sky-500" />
                  Répartition Détaillée par Statut de Commande
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {Object.entries(data?.logistics?.statusDistribution || {}).map(([st, cnt]) => {
                    const stLabels: Record<string, { label: string; bg: string }> = {
                      pending: { label: 'En attente', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
                      confirmed: { label: 'Confirmées', bg: 'bg-sky-50 text-sky-800 border-sky-200' },
                      preparing: { label: 'En préparation', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                      shipped: { label: 'Expédiées', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
                      delivered: { label: 'Livrées (Succès)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                      refused: { label: 'Refusées', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
                      returned: { label: 'Retournées', bg: 'bg-orange-50 text-orange-800 border-orange-200' },
                      cancelled: { label: 'Annulées', bg: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
                    };
                    const info = stLabels[st] || { label: st, bg: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
                    return (
                      <div key={st} className={`p-3 rounded-xl border ${info.bg} flex justify-between items-center`}>
                        <span className="text-xs font-semibold">{info.label}</span>
                        <span className="text-base font-black">{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
