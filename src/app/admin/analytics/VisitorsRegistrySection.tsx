'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, Smartphone, Monitor, Tablet, MapPin, Eye, ShoppingCart,
  ArrowRight, Search, Filter, RefreshCw, Download, ExternalLink,
  Clock, CheckCircle2, ShoppingBag, X, ChevronLeft, ChevronRight,
  Sparkles, Compass, ShieldCheck, Flame, Share2, HelpCircle,
  TrendingUp, Radio, AlertCircle
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
      {/* ── 1. REAL-TIME TELEMETRY RIBBON ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Live Now */}
        <div className="bg-white dark:bg-[#111827] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Visiteurs en Direct</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              {stats.online}
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              connectés maintenant
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            Navigation en temps réel sur la boutique
          </div>
        </div>

        {/* Card 2: Active Carts */}
        <div className="bg-white dark:bg-[#111827] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Paniers en Cours</span>
            <ShoppingCart size={15} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              {stats.withCart}
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              paniers actifs
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Valeur en panier :</span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {formatMAD(stats.totalCartValue)}
            </span>
          </div>
        </div>

        {/* Card 3: Moroccan Cities */}
        <div className="bg-white dark:bg-[#111827] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Villes Actives</span>
            <MapPin size={15} className="text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              {uniqueCities.length}
            </div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              villes du Maroc 🇲🇦
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 truncate">
            {uniqueCities.slice(0, 3).join(', ')}...
          </div>
        </div>

        {/* Card 4: Engagement & Pages */}
        <div className="bg-white dark:bg-[#111827] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pages / Session</span>
            <Eye size={15} className="text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              {stats.avgPages}
            </div>
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              pages vues / visite
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            {stats.mobile} mobiles ({(stats.total > 0 ? Math.round((stats.mobile / stats.total) * 100) : 0)}%) • {stats.desktop} PC
          </div>
        </div>
      </div>

      {/* ── 2. MAIN REGISTRY TABLE CONTAINER ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm p-6 space-y-5">
        {/* Table Header & Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Registre Détaillé de Tous les Visiteurs Entrants</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
                  {filteredVisitors.length} sessions
                </span>
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Historique en direct de tous les clients connectés : ville marocaine, source de provenance (Google, Meta, TikTok...), page visitée et statut du panier.
            </p>
          </div>

          {/* Quick Actions (Refresh & Export) */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Actualiser le flux des visiteurs"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-sky-500' : ''} />
            </button>

            <button
              onClick={handleExportVisitorsCSV}
              className="flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Download size={14} />
              <span>Exporter Registre CSV</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher par ville, provenance, page, parfum ou ID client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* City Filter & Sort Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* City Dropdown */}
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">📍 Toutes les villes du Maroc</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  🇲🇦 {city}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="recent">⏱️ Plus récents d&apos;abord</option>
              <option value="pages">📄 Plus de pages consultées</option>
              <option value="duration">⏳ Plus longue durée</option>
              <option value="cartValue">🛒 Panier le plus élevé</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'ALL', label: `Tous (${visitors.length})` },
            { id: 'ONLINE', label: `🟢 En Ligne (${stats.online})` },
            { id: 'CART', label: `🛒 Panier Actif (${stats.withCart})` },
            { id: 'PURCHASED', label: `🛍️ Acheteurs (${stats.purchased})` },
            { id: 'MOBILE', label: `📱 Mobiles (${stats.mobile})` },
            { id: 'DESKTOP', label: `💻 PC (${stats.desktop})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => {
                setStatusFilter(pill.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                statusFilter === pill.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* ── 3. VISITOR DATA TABLE ────────────────────────────────────────── */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/50 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <th className="py-3 px-3.5">Client & Statut</th>
                <th className="py-3 px-3">Localisation</th>
                <th className="py-3 px-3">Source d&apos;Acquisition</th>
                <th className="py-3 px-3">Page d&apos;Entrée ➔ Page Actuelle</th>
                <th className="py-3 px-3 text-center">Pages / Temps</th>
                <th className="py-3 px-3 text-center">Panier & Intention</th>
                <th className="py-3 px-3.5 text-right">Parcours Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
              {paginatedVisitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <Users size={32} className="mx-auto mb-2 opacity-40 text-neutral-400" />
                    <p className="font-semibold text-sm">Aucun visiteur ne correspond à ces critères</p>
                    <p className="text-xs mt-1">Essayez d&apos;ajuster vos filtres de recherche ou de période</p>
                  </td>
                </tr>
              ) : (
                paginatedVisitors.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVisitor(v)}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group"
                  >
                    {/* Column 1: Client & Status */}
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        {/* Device Icon Avatar */}
                        <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
                          {v.device === 'Mobile' ? (
                            <Smartphone size={15} />
                          ) : v.device === 'Tablet' ? (
                            <Tablet size={15} />
                          ) : (
                            <Monitor size={15} />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-neutral-900 dark:text-white text-xs">
                              {v.customerName ? v.customerName : `#Client-${v.ipHashShort}`}
                            </span>
                            {v.customerPhone && (
                              <span className="text-[10px] text-neutral-400 font-mono">
                                ({v.customerPhone})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            {v.isOnline ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                En direct
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400">
                                {formatTimeAgo(v.lastSeen)}
                              </span>
                            )}

                            <span className="text-neutral-300 dark:text-neutral-700">•</span>
                            <span className="text-[10px] text-neutral-400">
                              {v.device}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Moroccan City */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-rose-500 shrink-0" />
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {v.city}
                        </span>
                        <span className="text-xs">{v.flag}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {v.country}
                      </div>
                    </td>

                    {/* Column 3: Traffic Acquisition Source */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        v.referrer.includes('Google')
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50'
                          : v.referrer.includes('Instagram')
                          ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200/50'
                          : v.referrer.includes('Facebook')
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50'
                          : v.referrer.includes('TikTok')
                          ? 'bg-neutral-900 text-white dark:bg-neutral-700'
                          : v.referrer.includes('WhatsApp')
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}>
                        {v.referrer}
                      </span>
                      <div className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[130px]">
                        {v.sourceCategory}
                      </div>
                    </td>

                    {/* Column 4: Landing Page & Current Page */}
                    <td className="py-3.5 px-3 max-w-[260px]">
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1">
                          <span className="text-[9px] uppercase font-bold text-neutral-400">Entrée :</span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                            {v.landingPage.title}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate flex items-center gap-1">
                          <span className="text-[9px] uppercase font-bold text-sky-500">Actuel :</span>
                          <span className="truncate text-sky-600 dark:text-sky-400">
                            {v.currentPage.title}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 5: Page Views & Session Time */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-bold text-neutral-900 dark:text-white text-xs">
                        {v.pageCount} {v.pageCount > 1 ? 'pages' : 'page'}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {v.durationFormatted}
                      </div>
                    </td>

                    {/* Column 6: Intent & Cart */}
                    <td className="py-3.5 px-3 text-center">
                      {v.hasPurchased ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <CheckCircle2 size={11} className="text-purple-600" />
                          <span>Achat Converti</span>
                        </span>
                      ) : v.hasCart || v.cartValue > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <ShoppingCart size={11} className="text-amber-600" />
                          <span>Panier : {formatMAD(v.cartValue)}</span>
                        </span>
                      ) : v.productsViewed.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          <Eye size={11} className="text-sky-600" />
                          <span>{v.productsViewed.length} parfums vus</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          <span>Exploration simple</span>
                        </span>
                      )}
                    </td>

                    {/* Column 7: Inspect Action */}
                    <td className="py-3.5 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVisitor(v);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 dark:hover:text-white text-neutral-700 dark:text-neutral-300 text-[11px] font-bold transition-all cursor-pointer group-hover:bg-sky-500 group-hover:text-white"
                      >
                        <span>Inspecter</span>
                        <ArrowRight size={11} />
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <div className="text-neutral-500 dark:text-neutral-400">
              Affichage de <strong className="text-neutral-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</strong> à{' '}
              <strong className="text-neutral-900 dark:text-white">
                {Math.min(currentPage * pageSize, filteredVisitors.length)}
              </strong>{' '}
              sur <strong className="text-neutral-900 dark:text-white">{filteredVisitors.length}</strong> visiteurs
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 cursor-pointer transition-all hover:bg-neutral-50"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="px-3 py-1 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Page {currentPage} sur {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 cursor-pointer transition-all hover:bg-neutral-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. CLIENT JOURNEY INSPECTION MODAL ─────────────────────────────────── */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  {selectedVisitor.device === 'Mobile' ? (
                    <Smartphone size={20} />
                  ) : (
                    <Monitor size={20} />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      {selectedVisitor.customerName || `Session #${selectedVisitor.ipHashShort}`}
                    </h3>
                    {selectedVisitor.isOnline && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        En direct
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                      <MapPin size={11} className="text-rose-500" />
                      {selectedVisitor.city} 🇲🇦
                    </span>
                    <span>•</span>
                    <span>Source : <strong>{selectedVisitor.referrer}</strong></span>
                    <span>•</span>
                    <span>{selectedVisitor.device}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedVisitor(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs" style={{ scrollbarWidth: 'thin' }}>
              {/* Quick KPIs strip */}
              <div className="grid grid-cols-4 gap-2.5 p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-center">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Pages Vues</div>
                  <div className="text-base font-black text-neutral-900 dark:text-white mt-0.5">
                    {selectedVisitor.pageCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Temps Passé</div>
                  <div className="text-base font-black text-neutral-900 dark:text-white mt-0.5">
                    {selectedVisitor.durationFormatted}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Panier</div>
                  <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {selectedVisitor.cartValue > 0 ? formatMAD(selectedVisitor.cartValue) : '0 MAD'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Statut</div>
                  <div className="text-xs font-black text-neutral-900 dark:text-white mt-1">
                    {selectedVisitor.hasPurchased
                      ? '🏆 Converti'
                      : selectedVisitor.hasCart
                      ? '🛒 Panier'
                      : selectedVisitor.isOnline
                      ? '🟢 En direct'
                      : '⚪ Terminé'}
                  </div>
                </div>
              </div>

              {/* Cart Items if present */}
              {selectedVisitor.cartItems && selectedVisitor.cartItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
                  <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200 text-xs">
                    <span className="flex items-center gap-1.5">
                      <ShoppingCart size={14} className="text-amber-600" />
                      <span>Contenu du Panier Actif ({selectedVisitor.cartItems.length} article(s))</span>
                    </span>
                    <span className="text-sm font-black">{formatMAD(selectedVisitor.cartValue)}</span>
                  </div>

                  <div className="space-y-2">
                    {selectedVisitor.cartItems.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-amber-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2.5">
                          {it.image && (
                            <div className="w-8 h-8 relative rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                              <Image src={it.image} alt={it.name || 'Parfum'} fill className="object-cover" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-white text-xs truncate max-w-[200px]">
                              {it.name || 'Parfum de Luxe'}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              Qté : {it.quantity || 1} • {it.size || '100ml'}
                            </div>
                          </div>
                        </div>
                        <div className="font-black text-neutral-900 dark:text-white text-xs">
                          {formatMAD(it.price || 299)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Chronological Journey */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
                  <h4 className="font-bold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Compass size={14} className="text-sky-500" />
                    <span>Parcours Chronologique de Navigation ({selectedVisitor.journey.length} étapes)</span>
                  </h4>
                  <span className="text-[10px] text-neutral-400">
                    Ordre chronologique (Entrée ➔ Sortie)
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
                  {selectedVisitor.journey.map((step, idx) => (
                    <div key={idx} className="relative group">
                      {/* Step Circle Pin */}
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 border-2 border-sky-500 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px] font-black">
                        {step.step}
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-900 dark:text-white text-xs">
                            {step.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(step.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-neutral-400 truncate max-w-[260px]">
                            {step.pathname}
                          </span>
                          <Link
                            href={step.pathname}
                            target="_blank"
                            className="text-sky-500 hover:text-sky-600 font-bold flex items-center gap-0.5"
                          >
                            <span>Ouvrir</span>
                            <ExternalLink size={10} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketing Recommendation Box */}
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-900/40 text-[11px] text-sky-900 dark:text-sky-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles size={13} className="text-sky-500" />
                  <span>Analyse & Diagnostic Marketing NAY</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                  {selectedVisitor.hasPurchased
                    ? 'Client acheteur confirmé. Parcours d\'achat fluide avec une excellente conversion depuis sa source d\'acquisition.'
                    : selectedVisitor.hasCart
                    ? 'Visiteur à fort potentiel d\'achat ayant placé des parfums au panier sans finaliser le paiement. Un message WhatsApp ou une offre spéciale peut déclencher la conversion.'
                    : selectedVisitor.productsViewed.length > 0
                    ? `Visiteur intéressé par la parfumerie (${selectedVisitor.productsViewed.map((p) => p.name).join(', ')}). Idéal pour le ciblage publicitaire Meta/TikTok.`
                    : 'Visiteur en phase de découverte générale de la marque.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">
                ID Session : {selectedVisitor.id}
              </span>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
