'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, Smartphone, Monitor, Tablet, MapPin, Eye, ShoppingCart,
  ArrowRight, Search, Filter, RefreshCw, Download, ExternalLink,
  Clock, CheckCircle2, ShoppingBag, X, ChevronLeft, ChevronRight,
  Sparkles, Compass, ShieldCheck, Flame, Share2, HelpCircle,
  TrendingUp, Radio, AlertCircle, MessageCircle, Activity, Check,
  Copy, Globe, Zap
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { VisitorSession, VisitorJourneyStep } from './types';

interface VisitorsRegistrySectionProps {
  visitors: VisitorSession[];
  isRefreshing: boolean;
  onRefresh: () => void;
  periodLabel: string;
}

export default function VisitorsRegistrySection({
  visitors,
  isRefreshing,
  onRefresh,
  periodLabel,
}: VisitorsRegistrySectionProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'CART' | 'PURCHASED' | 'MOBILE' | 'DESKTOP'>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'pages' | 'duration' | 'cartValue'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Selected visitor for journey inspection modal
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorSession | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Unique Moroccan cities from visitors
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    visitors.forEach((v) => {
      if (v.city && v.city !== 'Autre / Inconnu') {
        set.add(v.city);
      }
    });
    return Array.from(set).sort();
  }, [visitors]);

  // Real-time statistics counters
  const stats = useMemo(() => {
    const total = visitors.length;
    const online = visitors.filter((v) => v.isOnline).length;
    const withCart = visitors.filter((v) => v.hasCart || v.cartValue > 0).length;
    const purchased = visitors.filter((v) => v.hasPurchased).length;
    const mobile = visitors.filter((v) => v.device === 'Mobile').length;
    const desktop = visitors.filter((v) => v.device === 'Desktop').length;

    const totalCartValue = visitors.reduce((sum, v) => sum + (v.cartValue || 0), 0);
    const avgPages = total > 0 ? (visitors.reduce((sum, v) => sum + v.pageCount, 0) / total).toFixed(1) : '3.2';

    return {
      total,
      online: Math.max(1, online),
      withCart,
      purchased,
      mobile,
      desktop,
      totalCartValue,
      avgPages,
    };
  }, [visitors]);

  // Filtered & sorted visitors
  const filteredVisitors = useMemo(() => {
    let list = [...visitors];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((v) =>
        v.city.toLowerCase().includes(q) ||
        v.referrer.toLowerCase().includes(q) ||
        v.landingPage.pathname.toLowerCase().includes(q) ||
        v.currentPage.pathname.toLowerCase().includes(q) ||
        v.landingPage.title.toLowerCase().includes(q) ||
        v.currentPage.title.toLowerCase().includes(q) ||
        v.ipHashShort.toLowerCase().includes(q) ||
        (v.customerName && v.customerName.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter === 'ONLINE') {
      list = list.filter((v) => v.isOnline);
    } else if (statusFilter === 'CART') {
      list = list.filter((v) => v.hasCart || v.cartValue > 0);
    } else if (statusFilter === 'PURCHASED') {
      list = list.filter((v) => v.hasPurchased);
    } else if (statusFilter === 'MOBILE') {
      list = list.filter((v) => v.device === 'Mobile');
    } else if (statusFilter === 'DESKTOP') {
      list = list.filter((v) => v.device === 'Desktop');
    }

    // City filter
    if (cityFilter !== 'ALL') {
      list = list.filter((v) => v.city.toLowerCase() === cityFilter.toLowerCase());
    }

    // Sorting
    if (sortBy === 'pages') {
      list.sort((a, b) => b.pageCount - a.pageCount);
    } else if (sortBy === 'duration') {
      list.sort((a, b) => b.durationSeconds - a.durationSeconds);
    } else if (sortBy === 'cartValue') {
      list.sort((a, b) => b.cartValue - a.cartValue);
    } else {
      // Recent
      list.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
    }

    return list;
  }, [visitors, search, statusFilter, cityFilter, sortBy]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredVisitors.length / pageSize));
  const paginatedVisitors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVisitors.slice(start, start + pageSize);
  }, [filteredVisitors, currentPage, pageSize]);

  // Format relative time
  const formatTimeAgo = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `Il y a ${Math.max(5, diff)}s`;
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    const hours = Math.floor(diff / 3600);
    if (hours < 24) return `Il y a ${hours}h`;
    return new Date(isoString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Export visitors to CSV
  const handleExportVisitorsCSV = () => {
    if (!visitors.length) return;

    let csv = 'data:text/csv;charset=utf-8,';
    csv += `REGISTRE DES VISITEURS & CLIENTS ENTRANTS - NAY PARFUMS (${periodLabel})\r\n\r\n`;
    csv += 'ID Client,Ville,Pays,Appareil,Source Provenance,Date Premiere Entree,Derniere Activite,En Ligne,Pages Vues,Duree,Page Entree,Derniere Page,Panier (MAD),Statut\r\n';

    filteredVisitors.forEach((v) => {
      csv += `"${v.customerName || v.ipHashShort}","${v.city}","${v.country}","${v.device}","${v.referrer}","${v.firstSeen}","${v.lastSeen}",${v.isOnline ? 'OUI' : 'NON'},${v.pageCount},"${v.durationFormatted}","${v.landingPage.pathname}","${v.currentPage.pathname}",${v.cartValue},"${v.status}"\r\n`;
    });

    const encoded = encodeURI(csv);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `NAY_Clients_Visiteurs_Entrants_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. REAL-TIME TELEMETRY RIBBON (SHOPIFY POLARIS LIVE PODS) ───────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Stat 1: Live Now */}
        <div className="rounded-xl p-4 sm:p-4.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Radio size={14} strokeWidth={2.5} className="animate-pulse" />
                </div>
                En direct
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-2xl sm:text-[28px] font-mono font-black tracking-tight text-slate-900 dark:text-white tabular-nums leading-none mt-2">
              {stats.online}
            </div>
            {/* Shopify Micro-Meter */}
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-[2.5px] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(15, stats.online * 20))}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.05] font-mono flex items-center justify-between">
            <span>Visiteurs connectés</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10">Actif</span>
          </div>
        </div>

        {/* Stat 2: Active Carts */}
        <div className="rounded-xl p-4 sm:p-4.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShoppingCart size={14} strokeWidth={2.5} />
                </div>
                Paniers en cours
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {stats.withCart} paniers
              </span>
            </div>
            <div className="text-2xl sm:text-[28px] font-mono font-black tracking-tight text-slate-900 dark:text-white tabular-nums leading-none mt-2">
              {formatMAD(stats.totalCartValue)}
            </div>
            {/* Shopify Micro-Meter */}
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-[2.5px] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(10, (stats.withCart / Math.max(1, stats.total)) * 100))}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.05] font-mono flex items-center justify-between">
            <span>Valeur active</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">À relancer</span>
          </div>
        </div>

        {/* Stat 3: Moroccan Cities */}
        <div className="rounded-xl p-4 sm:p-4.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]">
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-500/15 border border-sky-100 dark:border-sky-500/20 text-[#0ea5e9] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                  <MapPin size={14} strokeWidth={2.5} />
                </div>
                Couverture Villes
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-[#0ea5e9] dark:text-[#38bdf8] border border-sky-500/20">
                Maroc MA
              </span>
            </div>
            <div className="text-2xl sm:text-[28px] font-mono font-black tracking-tight text-slate-900 dark:text-white tabular-nums leading-none mt-2">
              {uniqueCities.length} <span className="text-xs font-semibold text-slate-400 font-sans">villes</span>
            </div>
            {/* Shopify Micro-Meter */}
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-[2.5px] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(20, (uniqueCities.length / 30) * 100))}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.05] font-mono truncate">
            {uniqueCities.slice(0, 3).join(', ') || 'Casablanca, Rabat...'}
          </div>
        </div>

        {/* Stat 4: Pages / Session */}
        <div className="rounded-xl p-4 sm:p-4.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/15 border border-purple-100 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Eye size={14} strokeWidth={2.5} />
                </div>
                Pages / session
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Engagement
              </span>
            </div>
            <div className="text-2xl sm:text-[28px] font-mono font-black tracking-tight text-slate-900 dark:text-white tabular-nums leading-none mt-2">
              {stats.avgPages}
            </div>
            {/* Shopify Micro-Meter */}
            <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-[2.5px] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(15, (parseFloat(stats.avgPages) / 8) * 100))}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.05] font-mono truncate">
            {stats.mobile} mobiles ({stats.total > 0 ? Math.round((stats.mobile / stats.total) * 100) : 0}%) · {stats.desktop} PC
          </div>
        </div>
      </div>

      {/* ── 2. MAIN REGISTRY TABLE CONTAINER ─────────────────────────────────── */}
      <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/[0.06] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Registre des sessions visiteurs
              </h3>
              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1c2333] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08]">
                {filteredVisitors.length} sessions
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Historique télémétrique des sessions en direct : provenance, géolocalisation, navigation et statut panier
            </p>
          </div>

          {/* Quick Actions (Refresh & Export) */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8.5 px-3 rounded-lg border border-slate-200/90 dark:border-white/[0.1] bg-white dark:bg-[#151c2e] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1e2942] text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Actualiser le flux des visiteurs"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={handleExportVisitorsCSV}
              className="h-8.5 px-3.5 rounded-lg bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download size={13} />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="p-3 sm:p-3.5 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#0c101c] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer par ville, provenance, page, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8.5 pl-8 pr-7 rounded-lg border border-slate-200/90 dark:border-white/[0.1] bg-white dark:bg-[#151c2e] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0ea5e9] font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* City Filter & Sort Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8.5 px-3 rounded-lg border border-slate-200/90 dark:border-white/[0.1] bg-white dark:bg-[#151c2e] text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Toutes les villes</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8.5 px-3 rounded-lg border border-slate-200/90 dark:border-white/[0.1] bg-white dark:bg-[#151c2e] text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="recent">Plus récents d&apos;abord</option>
              <option value="pages">Plus de pages vues</option>
              <option value="duration">Plus longue durée</option>
              <option value="cartValue">Panier le plus élevé</option>
            </select>
          </div>
        </div>

        {/* Status Filter Segment Bar */}
        <div className="px-3.5 py-2 border-b border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#111827] flex items-center gap-1.5 overflow-x-auto text-xs" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'ALL', label: `Tous (${visitors.length})` },
            { id: 'ONLINE', label: `En direct (${stats.online})` },
            { id: 'CART', label: `Paniers (${stats.withCart})` },
            { id: 'PURCHASED', label: `Acheteurs (${stats.purchased})` },
            { id: 'MOBILE', label: `Mobiles (${stats.mobile})` },
            { id: 'DESKTOP', label: `Desktop (${stats.desktop})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => {
                setStatusFilter(pill.id as any);
                setCurrentPage(1);
              }}
              className={`h-7.5 px-3 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* ── 3. VISITOR DATA TABLE ────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02] text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3.5">Session / Client</th>
                <th className="py-3 px-3">Localisation</th>
                <th className="py-3 px-3">Acquisition</th>
                <th className="py-3 px-3">Page d&apos;entrée ➔ Actuelle</th>
                <th className="py-3 px-3 text-center">Pages / Durée</th>
                <th className="py-3 px-3 text-center">Panier & Intention</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
              {paginatedVisitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    <Users size={24} className="mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-xs">Aucun visiteur ne correspond à ces critères</p>
                    <p className="text-[11px] mt-1 text-slate-500">Essayez d&apos;ajuster vos filtres de recherche ou de période</p>
                  </td>
                </tr>
              ) : (
                paginatedVisitors.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVisitor(v)}
                    className="hover:bg-slate-50/90 dark:hover:bg-[#161f33] transition-colors cursor-pointer group"
                  >
                    {/* Column 1: Client & Status */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                          {v.device === 'Mobile' ? (
                            <Smartphone size={13} />
                          ) : v.device === 'Tablet' ? (
                            <Tablet size={13} />
                          ) : (
                            <Monitor size={13} />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#0ea5e9] transition-colors">
                              {v.customerName ? v.customerName : `#${v.ipHashShort}`}
                            </span>
                            {v.customerPhone && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({v.customerPhone})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            {v.isOnline ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                LIVE
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatTimeAgo(v.lastSeen)}
                              </span>
                            )}

                            <span className="text-slate-300 dark:text-slate-600 font-mono">·</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {v.device}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Moroccan City */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs">
                          {v.city}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">MA</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {v.country}
                      </div>
                    </td>

                    {/* Column 3: Traffic Acquisition Source */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300">
                        {v.referrer}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
                        {v.sourceCategory}
                      </div>
                    </td>

                    {/* Column 4: Landing Page & Current Page */}
                    <td className="py-3 px-3 max-w-[240px]">
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                          <span className="text-[9px] uppercase font-mono text-slate-400">in:</span>
                          <span className="truncate">
                            {v.landingPage.title}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1">
                          <span className="text-[9px] uppercase font-mono text-[#0ea5e9]">now:</span>
                          <span className="truncate text-slate-900 dark:text-slate-100">
                            {v.currentPage.title}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 5: Page Views & Session Time */}
                    <td className="py-3 px-3 text-center">
                      <div className="font-mono font-semibold text-slate-900 dark:text-white text-xs">
                        {v.pageCount} {v.pageCount > 1 ? 'pages' : 'page'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {v.durationFormatted}
                      </div>
                    </td>

                    {/* Column 6: Intent & Cart */}
                    <td className="py-3 px-3 text-center">
                      {v.hasPurchased ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border border-purple-200 dark:border-purple-900/60 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <CheckCircle2 size={10} />
                          <span>Converti</span>
                        </span>
                      ) : v.hasCart || v.cartValue > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-amber-200 dark:border-amber-900/60 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <ShoppingCart size={10} />
                            <span>{formatMAD(v.cartValue)}</span>
                          </span>
                          {(v.rawCustomerPhone || v.customerPhone) && (
                            <a
                              href={`https://wa.me/212${(v.rawCustomerPhone || v.customerPhone || '').replace(/\D/g, '').replace(/^212/, '').replace(/^0/, '')}?text=${encodeURIComponent(
                                `Bonjour ${v.customerName || ''} ! Nous avons remarqué que vous n'avez pas finalisé votre panier sur NAY Parfums (${formatMAD(v.cartValue)}). Profitez aujourd'hui de la Livraison Express Gratuite avec le code NAYEXPRESS ! https://nayparfum.ma`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-mono font-medium transition-colors"
                              title="Relancer le panier sur WhatsApp"
                            >
                              <MessageCircle size={9} />
                              <span>Relance</span>
                            </a>
                          )}
                        </div>
                      ) : v.productsViewed.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1c1c21] border border-slate-200 dark:border-slate-800">
                          <Eye size={10} />
                          <span>{v.productsViewed.length} parfums</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">
                          Navigation
                        </span>
                      )}
                    </td>

                    {/* Column 7: Inspect Action */}
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVisitor(v);
                        }}
                        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-slate-200/90 dark:border-white/[0.1] bg-white dark:bg-[#1a2338] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#222e48] hover:text-[#0ea5e9] dark:hover:text-[#38bdf8] text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <span>Détails</span>
                        <ArrowRight size={10} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── 4. PAGINATION BAR ──────────────────────────────────────────────── */}
        {filteredVisitors.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-slate-100 dark:border-white/[0.06] text-xs font-mono">
            <div className="text-neutral-500 dark:text-neutral-400">
              Affichage de <strong className="text-neutral-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</strong> à{' '}
              <strong className="text-neutral-900 dark:text-white">
                {Math.min(currentPage * pageSize, filteredVisitors.length)}
              </strong>{' '}
              sur <strong className="text-neutral-900 dark:text-white">{filteredVisitors.length}</strong>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2 rounded border border-slate-100 dark:border-white/[0.06] bg-white dark:bg-[#18181d] text-neutral-700 dark:text-neutral-300 disabled:opacity-40 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-[#202026]"
              >
                <ChevronLeft size={13} />
              </button>

              <span className="px-2 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 rounded border border-slate-100 dark:border-white/[0.06] bg-white dark:bg-[#18181d] text-neutral-700 dark:text-neutral-300 disabled:opacity-40 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-[#202026]"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. CLIENT JOURNEY INSPECTION SLIDE-OVER DRAWER (SHOPIFY POLARIS & VERCEL EXECUTIVE) ───── */}
      {mounted && selectedVisitor && createPortal(
        <div
          className="fixed inset-0 z-50 h-screen max-h-screen overflow-hidden bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedVisitor(null)}
        >
          <div
            className="w-full sm:w-[580px] lg:w-[620px] h-screen max-h-screen bg-white dark:bg-[#0e1424] border-l border-slate-200/90 dark:border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] flex flex-col min-h-0 overflow-hidden animate-in slide-in-from-right duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0e1424]/95 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50/70 dark:from-sky-500/10 dark:to-indigo-500/10 border border-sky-100 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
                  {selectedVisitor.device === 'Mobile' ? (
                    <Smartphone size={18} className="stroke-[2.2]" />
                  ) : (
                    <Monitor size={18} className="stroke-[2.2]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono tracking-tight truncate">
                      {selectedVisitor.customerName || `Session #${selectedVisitor.ipHashShort}`}
                    </h3>
                    {selectedVisitor.isOnline && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06]">
                      <MapPin size={10} className="text-slate-400" />
                      <span>{selectedVisitor.city}, {selectedVisitor.country}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50/80 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-500/20">
                      <Globe size={10} className="text-sky-500" />
                      <span className="truncate max-w-[150px]">{selectedVisitor.referrer}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                      {selectedVisitor.device}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedVisitor.cartValue > 0 && (selectedVisitor.rawCustomerPhone || selectedVisitor.customerPhone) && (
                  <a
                    href={`https://wa.me/212${(selectedVisitor.rawCustomerPhone || selectedVisitor.customerPhone || '').replace(/\D/g, '').replace(/^212/, '').replace(/^0/, '')}?text=${encodeURIComponent(
                      `Bonjour ${selectedVisitor.customerName || ''} ! Nous avons remarqué que vous n'avez pas finalisé votre panier sur NAY Parfums (${formatMAD(selectedVisitor.cartValue)}). Profitez dès aujourd'hui de la Livraison Express Gratuite avec le code NAYEXPRESS ! https://nayparfum.ma`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono font-semibold transition-all shadow-xs hover:scale-[1.02]"
                    title="Relancer le panier sur WhatsApp"
                  >
                    <MessageCircle size={13} className="stroke-[2.2]" />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  onClick={() => setSelectedVisitor(null)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100/80 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors flex items-center justify-center cursor-pointer"
                  title="Fermer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="p-4 sm:p-5 overflow-y-auto min-h-0 space-y-4 flex-1 text-xs" style={{ scrollbarWidth: 'thin' }}>
              {/* Quick KPIs strip - 4 Shopify Polaris Micro-Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Pages vues */}
                <div className="p-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Pages vues</span>
                    <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Eye size={12} className="stroke-[2.2]" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {selectedVisitor.pageCount}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">pages</span>
                  </div>
                  <div className="mt-2 w-full h-[2.5px] rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(15, (selectedVisitor.pageCount / 8) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Durée */}
                <div className="p-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Durée</span>
                    <div className="w-6 h-6 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Clock size={12} className="stroke-[2.2]" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-base font-mono font-bold tabular-nums text-slate-900 dark:text-white truncate block">
                      {selectedVisitor.durationFormatted}
                    </span>
                  </div>
                  <div className="mt-2 w-full h-[2.5px] rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(20, (selectedVisitor.durationSeconds / 300) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Panier */}
                <div className="p-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Panier</span>
                    <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <ShoppingCart size={12} className="stroke-[2.2]" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`text-base font-mono font-bold tabular-nums truncate block ${selectedVisitor.cartValue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                      {selectedVisitor.cartValue > 0 ? formatMAD(selectedVisitor.cartValue) : '0 MAD'}
                    </span>
                  </div>
                  <div className="mt-2 w-full h-[2.5px] rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${selectedVisitor.cartValue > 0 ? Math.min(100, Math.max(30, (selectedVisitor.cartValue / 1000) * 100)) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Statut */}
                <div className="p-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Statut</span>
                    <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Activity size={12} className="stroke-[2.2]" />
                    </div>
                  </div>
                  <div className="mt-2">
                    {selectedVisitor.hasPurchased ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={11} className="stroke-[2.5]" />
                        Converti
                      </span>
                    ) : selectedVisitor.hasCart ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <ShoppingBag size={11} className="stroke-[2.5]" />
                        Panier
                      </span>
                    ) : selectedVisitor.isOnline ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        En direct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                        Terminé
                      </span>
                    )}
                  </div>
                  <div className="mt-2 w-full h-[2.5px] rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedVisitor.hasPurchased ? 'bg-emerald-500 w-full' :
                        selectedVisitor.hasCart ? 'bg-amber-500 w-3/4' :
                        selectedVisitor.isOnline ? 'bg-sky-500 w-1/2' : 'bg-slate-300 dark:bg-slate-700 w-1/4'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Cart Items if present */}
              {selectedVisitor.cartItems && selectedVisitor.cartItems.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-500/20 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 dark:from-amber-500/[0.04] dark:via-[#111827] dark:to-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100/80 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                        <ShoppingCart size={14} className="stroke-[2.2]" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        Panier actif ({selectedVisitor.cartItems.length} article{selectedVisitor.cartItems.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {formatMAD(selectedVisitor.cartValue)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedVisitor.cartItems.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-[#141c30] p-3 rounded-lg border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {it.image ? (
                            <div className="w-9 h-9 relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                              <Image src={it.image} alt={it.name || 'Parfum'} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <ShoppingBag size={16} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[220px]">
                              {it.name || 'Parfum de Luxe'}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              Qté : {it.quantity || 1} · {it.size || '100ml'}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs shrink-0 pl-2">
                          {formatMAD(it.price || 299)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Chronological Journey */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-white/[0.08]">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Compass size={12} className="stroke-[2.2]" />
                    </div>
                    <span>Parcours de navigation ({selectedVisitor.journey.length} étapes)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono inline-flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-white/[0.06]">
                    Entrée ➔ Dernière page
                  </span>
                </div>

                <div className="relative pl-6 space-y-3">
                  {/* Vertical Illuminated Gradient Line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-sky-400 via-indigo-400 to-emerald-400 dark:from-sky-500 dark:via-indigo-500 dark:to-emerald-500 rounded-full" />

                  {selectedVisitor.journey.map((step, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === selectedVisitor.journey.length - 1;

                    return (
                      <div key={idx} className="relative group">
                        {/* Step Circle Pin */}
                        <div
                          className={`absolute -left-6 top-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shadow-xs transition-transform group-hover:scale-110 z-10 ${
                            isFirst
                              ? 'bg-sky-500 text-white ring-4 ring-sky-100 dark:ring-sky-500/20'
                              : isLast
                              ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-500/20 animate-pulse'
                              : 'bg-white dark:bg-[#111827] border-2 border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {step.step}
                        </div>

                        {/* Step Card */}
                        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-md transition-all space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                              {step.title}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-white/[0.03] px-2 py-0.5 rounded border border-slate-100 dark:border-white/[0.04] shrink-0">
                              <Clock size={9} />
                              {new Date(step.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.04] text-[10px]">
                            <span className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[260px] bg-slate-100/70 dark:bg-white/[0.04] px-1.5 py-0.5 rounded">
                              {step.pathname}
                            </span>
                            <Link
                              href={step.pathname}
                              target="_blank"
                              className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 font-mono font-medium flex items-center gap-1 hover:underline shrink-0"
                            >
                              <span>Visiter</span>
                              <ExternalLink size={10} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Marketing Recommendation Box */}
              <div className="p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/40 dark:from-indigo-950/25 dark:via-[#111827] dark:to-sky-950/15 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Sparkles size={12} className="stroke-[2.2]" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">Diagnostic télémétrique</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11.5px] leading-relaxed">
                  {selectedVisitor.hasPurchased
                    ? 'Client acheteur confirmé. Parcours d\'achat fluide avec une excellente conversion depuis sa source d\'acquisition.'
                    : selectedVisitor.hasCart
                    ? 'Visiteur à fort potentiel d\'achat ayant placé des parfums au panier sans finaliser le paiement. Un message WhatsApp ou une offre spéciale peut déclencher la conversion.'
                    : selectedVisitor.productsViewed.length > 0
                    ? `Visiteur intéressé par la parfumerie (${selectedVisitor.productsViewed.map((p) => p.name).join(', ')}). Idéal pour le reciblage.`
                    : 'Visiteur en phase de découverte générale de la marque.'}
                </p>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/90 dark:bg-[#0c101c]/90 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  Session ID :
                </span>
                <button
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(selectedVisitor.id);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-mono text-[10px] border border-slate-200/70 dark:border-white/[0.08] transition-colors cursor-pointer"
                  title="Copier l'ID de session"
                >
                  <span>{selectedVisitor.id.slice(0, 14)}...</span>
                  {copiedId ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-slate-400" />}
                </button>
              </div>

              <button
                onClick={() => setSelectedVisitor(null)}
                className="h-8 px-4 bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
