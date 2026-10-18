'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, Smartphone, Monitor, Tablet, MapPin, Eye, ShoppingCart,
  ArrowRight, Search, Filter, RefreshCw, Download, ExternalLink,
  Clock, CheckCircle2, ShoppingBag, X, ChevronLeft, ChevronRight,
  Sparkles, Compass, ShieldCheck, Flame, Share2, HelpCircle,
  TrendingUp, Radio, AlertCircle, MessageCircle
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
      {/* ── 1. REAL-TIME TELEMETRY RIBBON (RESEND METRIC STRIP) ─────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white dark:bg-[#121215] border border-[#eaeaea] dark:border-[#222227] rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-[#eaeaea] dark:divide-[#222227] shadow-2xs">
        {/* Stat 1: Live Now */}
        <div className="p-4">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">En direct</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-2xl font-mono font-semibold tracking-tight text-neutral-900 dark:text-white">
            {stats.online}
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono">
            visiteurs connectés
          </div>
        </div>

        {/* Stat 2: Active Carts */}
        <div className="p-4">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Paniers en cours</span>
            <ShoppingCart size={13} className="text-neutral-400" />
          </div>
          <div className="text-2xl font-mono font-semibold tracking-tight text-neutral-900 dark:text-white">
            {stats.withCart}
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono flex items-center justify-between">
            <span>Valeur active</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">{formatMAD(stats.totalCartValue)}</span>
          </div>
        </div>

        {/* Stat 3: Moroccan Cities */}
        <div className="p-4">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Villes actives</span>
            <MapPin size={13} className="text-neutral-400" />
          </div>
          <div className="text-2xl font-mono font-semibold tracking-tight text-neutral-900 dark:text-white">
            {uniqueCities.length}
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono truncate">
            {uniqueCities.slice(0, 3).join(', ') || 'Maroc'}
          </div>
        </div>

        {/* Stat 4: Pages / Session */}
        <div className="p-4">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Pages / session</span>
            <Eye size={13} className="text-neutral-400" />
          </div>
          <div className="text-2xl font-mono font-semibold tracking-tight text-neutral-900 dark:text-white">
            {stats.avgPages}
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono">
            {stats.mobile} mobiles ({stats.total > 0 ? Math.round((stats.mobile / stats.total) * 100) : 0}%) · {stats.desktop} PC
          </div>
        </div>
      </div>

      {/* ── 2. MAIN REGISTRY TABLE CONTAINER ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121215] rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-4 border-b border-[#eaeaea] dark:border-[#222227] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Registre des sessions visiteurs
              </h3>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#1c1c21] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                {filteredVisitors.length} sessions
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Historique télémétrique des sessions en direct : provenance, géolocalisation, navigation et statut panier
            </p>
          </div>

          {/* Quick Actions (Refresh & Export) */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 px-2.5 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#202026] text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Actualiser le flux des visiteurs"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={handleExportVisitorsCSV}
              className="h-8 px-3 rounded-md bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="p-3 border-b border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Filtrer par ville, provenance, page, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 pl-8 pr-7 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
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
              className="h-8 px-2.5 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
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
              className="h-8 px-2.5 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="recent">Plus récents d&apos;abord</option>
              <option value="pages">Plus de pages vues</option>
              <option value="duration">Plus longue durée</option>
              <option value="cartValue">Panier le plus élevé</option>
            </select>
          </div>
        </div>

        {/* Status Filter Segment Bar */}
        <div className="px-3 py-2 border-b border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#121215] flex items-center gap-1 overflow-x-auto text-xs" style={{ scrollbarWidth: 'none' }}>
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
              className={`h-7 px-2.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#1c1c21]'
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
              <tr className="border-b border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <th className="py-2.5 px-3.5">Session / Client</th>
                <th className="py-2.5 px-3">Localisation</th>
                <th className="py-2.5 px-3">Acquisition</th>
                <th className="py-2.5 px-3">Page d&apos;entrée ➔ Actuelle</th>
                <th className="py-2.5 px-3 text-center">Pages / Durée</th>
                <th className="py-2.5 px-3 text-center">Panier & Intention</th>
                <th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea] dark:divide-[#222227] text-neutral-700 dark:text-neutral-300">
              {paginatedVisitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400 font-mono">
                    <Users size={24} className="mx-auto mb-2 opacity-30 text-neutral-400" />
                    <p className="font-semibold text-xs">Aucun visiteur ne correspond à ces critères</p>
                    <p className="text-[11px] mt-1 text-neutral-500">Essayez d&apos;ajuster vos filtres de recherche ou de période</p>
                  </td>
                </tr>
              ) : (
                paginatedVisitors.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVisitor(v)}
                    className="hover:bg-[#fafafa] dark:hover:bg-[#18181d] transition-colors cursor-pointer group"
                  >
                    {/* Column 1: Client & Status */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-[#1c1c21] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
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
                            <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-white">
                              {v.customerName ? v.customerName : `#${v.ipHashShort}`}
                            </span>
                            {v.customerPhone && (
                              <span className="text-[10px] text-neutral-400 font-mono">
                                ({v.customerPhone})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            {v.isOnline ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                LIVE
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {formatTimeAgo(v.lastSeen)}
                              </span>
                            )}

                            <span className="text-neutral-300 dark:text-neutral-700 font-mono">·</span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {v.device}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Moroccan City */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-neutral-900 dark:text-white text-xs">
                          {v.city}
                        </span>
                        <span className="text-xs">{v.flag}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {v.country}
                      </div>
                    </td>

                    {/* Column 3: Traffic Acquisition Source */}
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#1c1c21] text-neutral-700 dark:text-neutral-300">
                        {v.referrer}
                      </span>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate max-w-[120px]">
                        {v.sourceCategory}
                      </div>
                    </td>

                    {/* Column 4: Landing Page & Current Page */}
                    <td className="py-2.5 px-3 max-w-[240px]">
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1">
                          <span className="text-[9px] uppercase font-mono text-neutral-400">in:</span>
                          <span className="truncate">
                            {v.landingPage.title}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-neutral-900 dark:text-white truncate flex items-center gap-1">
                          <span className="text-[9px] uppercase font-mono text-sky-500">now:</span>
                          <span className="truncate text-neutral-900 dark:text-neutral-100">
                            {v.currentPage.title}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 5: Page Views & Session Time */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="font-mono font-medium text-neutral-900 dark:text-white text-xs">
                        {v.pageCount} {v.pageCount > 1 ? 'pages' : 'page'}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {v.durationFormatted}
                      </div>
                    </td>

                    {/* Column 6: Intent & Cart */}
                    <td className="py-2.5 px-3 text-center">
                      {v.hasPurchased ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-purple-200 dark:border-purple-900/60 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <CheckCircle2 size={10} />
                          <span>Converti</span>
                        </span>
                      ) : v.hasCart || v.cartValue > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border border-amber-200 dark:border-amber-900/60 bg-amber-500/10 text-amber-600 dark:text-amber-400">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-[#1c1c21] border border-neutral-200 dark:border-neutral-800">
                          <Eye size={10} />
                          <span>{v.productsViewed.length} parfums</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-400">
                          Navigation
                        </span>
                      )}
                    </td>

                    {/* Column 7: Inspect Action */}
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVisitor(v);
                        }}
                        className="inline-flex items-center gap-1 h-6 px-2 rounded border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-neutral-700 dark:text-neutral-300 hover:border-black dark:hover:border-white text-[11px] font-mono transition-colors cursor-pointer"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-[#eaeaea] dark:border-[#222227] text-xs font-mono">
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
                className="h-7 px-2 rounded border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-neutral-700 dark:text-neutral-300 disabled:opacity-40 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-[#202026]"
              >
                <ChevronLeft size={13} />
              </button>

              <span className="px-2 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 rounded border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#18181d] text-neutral-700 dark:text-neutral-300 disabled:opacity-40 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-[#202026]"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. CLIENT JOURNEY INSPECTION SLIDE-OVER DRAWER (RESEND STYLE) ───── */}
      {selectedVisitor && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150"
          onClick={() => setSelectedVisitor(null)}
        >
          <div
            className="w-full sm:w-[540px] h-full bg-white dark:bg-[#121215] border-l border-[#eaeaea] dark:border-[#222227] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#eaeaea] dark:border-[#222227] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-[#1c1c21] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
                  {selectedVisitor.device === 'Mobile' ? (
                    <Smartphone size={15} />
                  ) : (
                    <Monitor size={15} />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white font-mono">
                      {selectedVisitor.customerName || `Session #${selectedVisitor.ipHashShort}`}
                    </h3>
                    {selectedVisitor.isOnline && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 font-mono">
                    <span>{selectedVisitor.city}, {selectedVisitor.country}</span>
                    <span>·</span>
                    <span>{selectedVisitor.referrer}</span>
                    <span>·</span>
                    <span>{selectedVisitor.device}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedVisitor.cartValue > 0 && (selectedVisitor.rawCustomerPhone || selectedVisitor.customerPhone) && (
                  <a
                    href={`https://wa.me/212${(selectedVisitor.rawCustomerPhone || selectedVisitor.customerPhone || '').replace(/\D/g, '').replace(/^212/, '').replace(/^0/, '')}?text=${encodeURIComponent(
                      `Bonjour ${selectedVisitor.customerName || ''} ! Nous avons remarqué que vous n'avez pas finalisé votre panier sur NAY Parfums (${formatMAD(selectedVisitor.cartValue)}). Profitez dès aujourd'hui de la Livraison Express Gratuite avec le code NAYEXPRESS ! https://nayparfum.ma`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-mono font-medium transition-colors"
                    title="Relancer le panier sur WhatsApp"
                  >
                    <MessageCircle size={12} />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  onClick={() => setSelectedVisitor(null)}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1c1c21] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs" style={{ scrollbarWidth: 'thin' }}>
              {/* Quick KPIs strip */}
              <div className="grid grid-cols-4 bg-[#fafafa] dark:bg-[#151518] rounded-md border border-[#eaeaea] dark:border-[#222227] divide-x divide-[#eaeaea] dark:divide-[#222227] text-center p-3">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-mono">Pages vues</div>
                  <div className="text-sm font-mono font-semibold text-neutral-900 dark:text-white mt-0.5">
                    {selectedVisitor.pageCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-mono">Durée</div>
                  <div className="text-sm font-mono font-semibold text-neutral-900 dark:text-white mt-0.5">
                    {selectedVisitor.durationFormatted}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-mono">Panier</div>
                  <div className="text-sm font-mono font-semibold text-neutral-900 dark:text-white mt-0.5">
                    {selectedVisitor.cartValue > 0 ? formatMAD(selectedVisitor.cartValue) : '0 MAD'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-mono">Statut</div>
                  <div className="text-[11px] font-mono font-semibold text-neutral-900 dark:text-white mt-1">
                    {selectedVisitor.hasPurchased ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Converti</span>
                    ) : selectedVisitor.hasCart ? (
                      <span className="text-amber-600 dark:text-amber-400">Panier</span>
                    ) : selectedVisitor.isOnline ? (
                      <span className="text-emerald-600 dark:text-emerald-400">En direct</span>
                    ) : (
                      <span className="text-neutral-400">Terminé</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cart Items if present */}
              {selectedVisitor.cartItems && selectedVisitor.cartItems.length > 0 && (
                <div className="p-3.5 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] space-y-2.5">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-medium">
                      <ShoppingCart size={13} className="text-neutral-400" />
                      <span>Panier actif ({selectedVisitor.cartItems.length} article{selectedVisitor.cartItems.length > 1 ? 's' : ''})</span>
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatMAD(selectedVisitor.cartValue)}</span>
                  </div>

                  <div className="space-y-1.5">
                    {selectedVisitor.cartItems.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-[#121215] p-2 rounded border border-[#eaeaea] dark:border-[#222227]">
                        <div className="flex items-center gap-2">
                          {it.image && (
                            <div className="w-7 h-7 relative rounded overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200 dark:border-neutral-800">
                              <Image src={it.image} alt={it.name || 'Parfum'} fill className="object-cover" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-white text-xs truncate max-w-[200px]">
                              {it.name || 'Parfum de Luxe'}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              Qté : {it.quantity || 1} · {it.size || '100ml'}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-neutral-900 dark:text-white text-xs">
                          {formatMAD(it.price || 299)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Chronological Journey */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#eaeaea] dark:border-[#222227]">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Compass size={13} className="text-neutral-400" />
                    <span>Parcours de navigation ({selectedVisitor.journey.length} étapes)</span>
                  </h4>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Entrée ➔ Dernière page
                  </span>
                </div>

                <div className="relative pl-5 space-y-2.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[#eaeaea] dark:before:bg-[#222227]">
                  {selectedVisitor.journey.map((step, idx) => (
                    <div key={idx} className="relative group">
                      {/* Step Circle Pin */}
                      <div className="absolute -left-5 top-1.5 w-4 h-4 rounded-full bg-white dark:bg-[#121215] border border-neutral-400 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 flex items-center justify-center text-[9px] font-mono font-semibold">
                        {step.step}
                      </div>

                      <div className="p-2.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-neutral-900 dark:text-white text-xs">
                            {step.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(step.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-neutral-400 truncate max-w-[240px]">
                            {step.pathname}
                          </span>
                          <Link
                            href={step.pathname}
                            target="_blank"
                            className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white font-mono flex items-center gap-0.5"
                          >
                            <span>Visiter</span>
                            <ExternalLink size={9} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketing Recommendation Box */}
              <div className="p-3 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] text-xs space-y-1">
                <div className="font-medium text-neutral-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Sparkles size={12} className="text-neutral-400" />
                  <span>Diagnostic télémétrique</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
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
            <div className="p-3 border-t border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] flex items-center justify-between">
              <span className="text-[10px] text-neutral-400 font-mono">
                Session ID : {selectedVisitor.id}
              </span>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="h-7 px-3 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
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
