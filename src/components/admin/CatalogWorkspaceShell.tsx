'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Plus,
  RefreshCw,
  Sparkles,
  Search,
  X,
  Archive,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
} from 'lucide-react';

export type CatalogStockFilter = 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK';
export type CatalogSortOption = 'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_ASC';

export interface CatalogTableProduct {
  id: any;
  name: string;
  sku?: string | null;
  brandLabel?: string | null;
  subcategory?: string | null;
  subcategoryLabel?: string | null;
  price: number;
  originalPrice?: number | null;
  images?: string[];
  inStock?: boolean;
  stock?: number | null;
  published?: boolean;
  isTester?: boolean;
}

export function computeCatalogMetrics<T extends { inStock?: boolean; stock?: number | null; price?: number; brandLabel?: string | null; subcategoryLabel?: string | null }>(
  products: T[],
  defaultStockFallback = 10
) {
  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = products.filter((p) => !p.inStock).length;
  const totalStockUnits = products.reduce(
    (acc, p) => acc + (p.stock !== undefined && p.stock !== null ? p.stock : p.inStock ? defaultStockFallback : 0),
    0
  );
  const priceSum = products.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const averagePrice = totalCount > 0 ? Math.round(priceSum / totalCount) : 0;
  const olfactiveFamilies = Array.from(new Set(products.map((p) => p.subcategoryLabel).filter(Boolean) as string[])).sort();
  const brandOptions = Array.from(new Set(products.map((p) => p.brandLabel).filter(Boolean) as string[])).sort();

  return {
    totalCount,
    inStockCount,
    outOfStockCount,
    totalStockUnits,
    averagePrice,
    olfactiveFamilies,
    brandOptions,
  };
}

export function filterAndSortCatalog<T extends CatalogTableProduct>(
  products: T[],
  params: {
    search: string;
    stockFilter: CatalogStockFilter;
    familyFilter: string;
    brandFilter: string;
    sortBy: CatalogSortOption;
    defaultStockFallback?: number;
  }
): T[] {
  const { search, stockFilter, familyFilter, brandFilter, sortBy, defaultStockFallback = 10 } = params;
  const searchLower = search.toLowerCase();

  return products
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchLower) ||
        (p.brandLabel || '').toLowerCase().includes(searchLower) ||
        (p.sku && p.sku.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
      if (stockFilter === 'IN_STOCK' && !p.inStock) return false;
      if (stockFilter === 'OUT_OF_STOCK' && p.inStock) return false;
      if (brandFilter !== 'ALL' && p.brandLabel !== brandFilter) return false;
      if (familyFilter !== 'ALL' && p.subcategoryLabel !== familyFilter && p.subcategory !== familyFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'PRICE_DESC') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'STOCK_ASC') {
        const stockA = a.stock !== undefined && a.stock !== null ? a.stock : a.inStock ? defaultStockFallback : 0;
        const stockB = b.stock !== undefined && b.stock !== null ? b.stock : b.inStock ? defaultStockFallback : 0;
        return stockA - stockB;
      }
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });
}

export const CATALOG_INPUT_CLASS =
  'w-full bg-slate-50/90 dark:bg-[#0c101b] border border-slate-200/90 dark:border-white/10 rounded-xl p-2.5 text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20 transition-all';

export const CATALOG_SECTION_CARD_CLASS =
  'bg-white dark:bg-[#131826] p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-5';

interface CatalogPageHeaderProps {
  eyebrow?: string;
  liveLabel: string;
  title: string;
  subtitle: string;
  addLabel: string;
  isLoading: boolean;
  onRefresh: () => void;
  onGenerateSKUs: () => void;
  onAdd: () => void;
}

export function CatalogPageHeader({
  eyebrow = 'NAY PARFUMS • GESTION DE CATALOGUE',
  liveLabel,
  title,
  subtitle,
  addLabel,
  isLoading,
  onRefresh,
  onGenerateSKUs,
  onAdd,
}: CatalogPageHeaderProps) {
  return (
    <div className="nay-enter flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
      <div>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-500 dark:text-slate-400">
          <span>{eyebrow}</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="inline-flex items-center gap-1.5 normal-case tracking-normal font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            {liveLabel}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto shrink-0">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 w-10 sm:w-auto sm:px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
            title="Rafraîchir les données"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#0ea5e9]' : 'text-slate-500 dark:text-slate-400'} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            type="button"
            onClick={onGenerateSKUs}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Sparkles size={13} className="text-[#0ea5e9] shrink-0" />
            <span>Générer SKUs</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onAdd}
          style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 sm:h-9 px-4 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <Plus size={14} strokeWidth={2.5} className="shrink-0" />
          <span>{addLabel}</span>
        </button>
      </div>
    </div>
  );
}

interface CatalogKpiDeckProps {
  heroIcon: React.ReactNode;
  heroTitle: string;
  heroSubtitle: string;
  heroFooterLeft: string;
  heroFooterRight?: string;
  reserveTitle: string;
  reserveSubtitle: string;
  outOfStockSubtitle?: string;
  totalCount: number;
  inStockCount: number;
  outOfStockCount: number;
  totalStockUnits: number;
  averagePrice: number;
  stockFilter: CatalogStockFilter;
  onSelectStockFilter: (filter: CatalogStockFilter) => void;
}

export function CatalogKpiDeck({
  heroIcon,
  heroTitle,
  heroSubtitle,
  heroFooterLeft,
  heroFooterRight = 'Prêts à la vente',
  reserveTitle,
  reserveSubtitle,
  outOfStockSubtitle = 'À commander en réappro',
  totalCount,
  inStockCount,
  outOfStockCount,
  totalStockUnits,
  averagePrice,
  stockFilter,
  onSelectStockFilter,
}: CatalogKpiDeckProps) {
  const stockRatio = totalCount > 0 ? Math.round((inStockCount / totalCount) * 100) : 0;

  return (
    <div className="nay-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
      {/* Pod 1: Maison Obsidian Lead Surface */}
      <div
        onClick={() => onSelectStockFilter('ALL')}
        className={`nay-hero-shine nay-card-lift rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[188px] group relative overflow-hidden bg-[#0b1322] dark:bg-[#0f172a] text-white border transition-all cursor-pointer ${
          stockFilter === 'ALL' ? 'border-sky-400/50 ring-1 ring-[#0ea5e9]/25' : 'border-slate-800/90'
        }`}
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.12] text-sky-300 flex items-center justify-center shrink-0">
                {heroIcon}
              </div>
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300 leading-tight">
                  {heroTitle}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                  {heroSubtitle}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.08] text-emerald-300 border border-white/[0.1] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Actif
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 mt-4 mb-1 flex-wrap">
            <div className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-white tabular-nums whitespace-nowrap">
              {totalCount}
              <span className="text-sm font-medium text-slate-400 ml-1.5 font-sans">références</span>
            </div>
            <span className="text-[11px] font-mono font-semibold text-slate-300 tabular-nums">
              Moy. {averagePrice.toLocaleString('fr-FR')} MAD
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 mt-3 relative z-10">
          <span>{heroFooterLeft}</span>
          <span className="font-semibold text-slate-200">{heroFooterRight}</span>
        </div>
      </div>

      {/* Pod 2: Reserve Units */}
      <div className="nay-card-lift spatial-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[188px] group">
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                <Archive size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300 leading-tight">
                  {reserveTitle}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                  {reserveSubtitle}
                </p>
              </div>
            </div>
            <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              Atelier
            </span>
          </div>

          <div className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums whitespace-nowrap mt-4 mb-1">
            {totalStockUnits.toLocaleString('fr-FR')}
            <span className="text-sm font-medium text-slate-400 ml-1.5 font-sans">unités</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
          <span>Inventaire physique</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">Vérifié</span>
        </div>
      </div>

      {/* Pod 3: Availability Rate (Interactive Filter + Progress Bar) */}
      <div
        onClick={() => onSelectStockFilter(stockFilter === 'IN_STOCK' ? 'ALL' : 'IN_STOCK')}
        className={`nay-card-lift spatial-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[188px] group cursor-pointer transition-all ${
          stockFilter === 'IN_STOCK' ? 'ring-2 ring-emerald-500/40 border-emerald-400/60' : ''
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300 leading-tight">
                  TAUX DISPONIBILITÉ
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                  Références livrables sous 24h
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 shrink-0 tabular-nums">
              {stockRatio}%
            </span>
          </div>

          <div className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums whitespace-nowrap mt-4 mb-2">
            {inStockCount}
            <span className="text-sm font-medium text-slate-400 ml-1.5 font-sans">en stock</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div
              className="nay-progress-fill h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
              style={{ width: `${stockRatio}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
          <span>{inStockCount} références actives</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">En stock</span>
        </div>
      </div>

      {/* Pod 4: Out of Stock Alert (Interactive Filter) */}
      <div
        onClick={() => onSelectStockFilter(stockFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
        className={`nay-card-lift spatial-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[188px] group cursor-pointer transition-all ${
          stockFilter === 'OUT_OF_STOCK' ? 'ring-2 ring-rose-500/40 border-rose-400/60' : ''
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                  RUPTURES D&apos;ATELIER
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                  {outOfStockSubtitle}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                outOfStockCount > 0
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                  : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              }`}
            >
              {outOfStockCount > 0 ? 'Réappro' : 'Optimal'}
            </span>
          </div>

          <div
            className={`text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight tabular-nums whitespace-nowrap mt-3 mb-1 ${
              outOfStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {outOfStockCount}
            <span className="text-sm font-semibold text-slate-400 ml-1.5 font-sans">épuisés</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
          <span>À commander fournisseur</span>
          <span className={`font-bold ${outOfStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {outOfStockCount > 0 ? 'Urgent' : 'Complet'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface CatalogFilterToolbarProps {
  sectionId: string;
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder: string;
  stockFilter: CatalogStockFilter;
  onStockFilterChange: (filter: CatalogStockFilter) => void;
  totalCount: number;
  inStockCount: number;
  outOfStockCount: number;
  filteredCount: number;
  familyFilter: string;
  onFamilyFilterChange: (val: string) => void;
  families: string[];
  brandFilter?: string;
  onBrandFilterChange?: (val: string) => void;
  brandOptions?: string[];
  sortBy?: CatalogSortOption;
  onSortByChange?: (val: CatalogSortOption) => void;
}

export function CatalogFilterToolbar({
  sectionId,
  search,
  onSearchChange,
  searchPlaceholder,
  stockFilter,
  onStockFilterChange,
  totalCount,
  inStockCount,
  outOfStockCount,
  filteredCount,
  familyFilter,
  onFamilyFilterChange,
  families,
  brandFilter = 'ALL',
  onBrandFilterChange,
  brandOptions = [],
  sortBy = 'NAME_ASC',
  onSortByChange,
}: CatalogFilterToolbarProps) {
  return (
    <div className="nay-enter spatial-card p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#101524] shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 rounded-xl text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#0ea5e9] dark:focus:border-[#0ea5e9] transition-all"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
            aria-label="Effacer la recherche"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Neo-pills stock status tabs + Dropdown filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 w-full xl:w-auto">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] overflow-x-auto max-w-full">
          {[
            { id: 'ALL' as const, label: `Tous (${totalCount})`, activeClass: 'bg-slate-900 dark:bg-[#0ea5e9] shadow-xs', dotClass: '' },
            { id: 'IN_STOCK' as const, label: `En Stock (${inStockCount})`, activeClass: 'bg-emerald-600 shadow-xs', dotClass: 'bg-emerald-400' },
            { id: 'OUT_OF_STOCK' as const, label: `Ruptures (${outOfStockCount})`, activeClass: 'bg-rose-600 shadow-xs', dotClass: 'bg-rose-400' },
          ].map((tab) => {
            const isActive = stockFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStockFilterChange(tab.id)}
                className={`relative px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={`catalog-stock-pill-${sectionId}`}
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    className={`absolute inset-0 rounded-lg ${tab.activeClass}`}
                  />
                )}
                {tab.dotClass && (
                  <span className={`relative z-10 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : tab.dotClass}`} />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {onBrandFilterChange && brandOptions.length > 0 && (
            <select
              value={brandFilter}
              onChange={(e) => onBrandFilterChange(e.target.value)}
              className="w-full sm:w-auto sm:max-w-[175px] px-3 py-2 bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
            >
              <option value="ALL">Toutes marques ({brandOptions.length})</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          )}

          <select
            value={familyFilter}
            onChange={(e) => onFamilyFilterChange(e.target.value)}
            className="w-full sm:w-auto sm:max-w-[180px] px-3 py-2 bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
          >
            <option value="ALL">Toutes familles ({families.length})</option>
            {families.map((fam) => (
              <option key={fam} value={fam}>
                {fam}
              </option>
            ))}
          </select>

          {onSortByChange && (
            <div className="relative flex items-center col-span-2 sm:col-span-1">
              <ArrowUpDown size={12} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value as CatalogSortOption)}
                className="w-full sm:w-auto pl-7 pr-3 py-2 bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
                aria-label="Trier le catalogue"
              >
                <option value="NAME_ASC">Nom (A → Z)</option>
                <option value="PRICE_ASC">Prix croissant</option>
                <option value="PRICE_DESC">Prix décroissant</option>
                <option value="STOCK_ASC">Stock critique</option>
              </select>
            </div>
          )}
        </div>

        <span className="hidden 2xl:inline-flex items-center px-2.5 py-1.5 rounded-xl bg-sky-500/10 text-[#0284c7] dark:text-[#38bdf8] border border-sky-500/20 text-[11px] font-bold tabular-nums whitespace-nowrap">
          {filteredCount} affiché{filteredCount > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

interface CatalogProductsTableProps<T extends CatalogTableProduct> {
  products: T[];
  isLoading: boolean;
  firstColTitle: string;
  thirdColTitle?: string;
  emptyTitle: string;
  sectionIcon: React.ReactNode;
  sectionBadge: React.ReactNode;
  defaultStockFallback?: number;
  defaultFamilyFallback?: string;
  showPublishedToggle?: boolean;
  showTesterSecondaryBadge?: boolean;
  editButtonTitle?: string;
  onQuickUpdate: (id: any, field: string, value: any) => void;
  onEdit: (product: T) => void;
  onDelete: (id: any) => void;
}

export function CatalogProductsTable<T extends CatalogTableProduct>({
  products,
  isLoading,
  firstColTitle,
  thirdColTitle = 'Univers Olfactif',
  emptyTitle,
  sectionIcon,
  sectionBadge,
  defaultStockFallback = 10,
  defaultFamilyFallback = 'Non définie',
  showPublishedToggle = false,
  showTesterSecondaryBadge = false,
  editButtonTitle = 'Modifier le produit',
  onQuickUpdate,
  onEdit,
  onDelete,
}: CatalogProductsTableProps<T>) {
  return (
    <div className="nay-enter spatial-card rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#101524] shadow-xs overflow-hidden">
      {/* ── PHONE NATIVE CATALOG CARDS (< 768px) ────────────────────────── */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
        {isLoading ? (
          <div className="px-4 py-14 text-center text-slate-400 text-xs">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-[#0ea5e9] flex items-center justify-center mx-auto mb-3 animate-spin">
              <RefreshCw size={18} />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300">Chargement de la collection...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="px-4 py-14 text-center text-slate-400 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 text-slate-400">
              {sectionIcon}
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300">{emptyTitle}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Modifiez vos critères de recherche ou de filtre</p>
          </div>
        ) : (
          products.map((p) => {
            const imgSrc = p.images?.[0];
            const stockCount = p.stock !== undefined && p.stock !== null ? p.stock : p.inStock ? defaultStockFallback : 0;
            const hasPromo = typeof p.originalPrice === 'number' && p.originalPrice > p.price;
            return (
              <div key={`mob-prod-${p.id}`} className="p-3.5 space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 overflow-hidden relative border border-slate-200/80 dark:border-white/10 shrink-0">
                    {imgSrc ? (
                      <Image src={imgSrc} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        {sectionIcon}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-sky-600 dark:text-sky-400 truncate">
                        {p.brandLabel || 'NAY'}
                      </span>
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white tabular-nums shrink-0">
                        {p.price} MAD
                      </span>
                    </div>

                    <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {p.name}
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[10.5px] text-slate-500 dark:text-slate-400">
                      <span className="truncate">{p.subcategoryLabel || defaultFamilyFallback}</span>
                      {hasPromo && (
                        <span className="text-rose-500 line-through font-mono shrink-0">
                          {p.originalPrice} MAD
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock, Publish & Touch Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.inStock ? (
                      <button
                        type="button"
                        onClick={() => onQuickUpdate(p.id, 'inStock', false)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Stock ({stockCount})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onQuickUpdate(p.id, 'inStock', true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>Rupture</span>
                      </button>
                    )}

                    {showPublishedToggle && (
                      <button
                        type="button"
                        onClick={() => onQuickUpdate(p.id, 'published', p.published === false)}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          p.published !== false
                            ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'
                        }`}
                      >
                        {p.published !== false ? 'Publié' : 'Brouillon'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="h-9 px-3 flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[11px] font-bold cursor-pointer"
                    >
                      <Edit2 size={12} />
                      <span>Modifier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 cursor-pointer"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── DESKTOP / TABLET CATALOG TABLE (>= 768px) ───────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50/80 dark:bg-[#0c0f1a]/80 border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-extrabold">
            <tr>
              <th className="px-5 py-3.5">{firstColTitle}</th>
              <th className="px-5 py-3.5">Maison / Marque</th>
              <th className="px-5 py-3.5">{thirdColTitle}</th>
              <th className="px-5 py-3.5">Tarif Public</th>
              <th className="px-5 py-3.5">Statut Stock</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-slate-400 text-xs">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-[#0ea5e9] flex items-center justify-center mx-auto mb-3 animate-spin">
                    <RefreshCw size={18} />
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">Chargement de la collection...</p>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-slate-400 text-xs">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    {sectionIcon}
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{emptyTitle}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Modifiez vos critères de recherche ou de filtre</p>
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const imgSrc = p.images?.[0];
                const stockCount = p.stock !== undefined && p.stock !== null ? p.stock : p.inStock ? defaultStockFallback : 0;
                const hasPromo = typeof p.originalPrice === 'number' && p.originalPrice > p.price;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-sky-500/[0.03] dark:hover:bg-sky-500/[0.06] transition-all group"
                  >
                    {/* Produit & SKU */}
                    <td className="px-5 py-3.5 flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 overflow-hidden relative border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {imgSrc ? (
                          <Image src={imgSrc} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            {sectionIcon}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-[13px] leading-snug group-hover:text-[#0ea5e9] dark:group-hover:text-[#38bdf8] transition-colors truncate max-w-[260px] sm:max-w-[320px]">
                          {p.name}
                        </div>
                        <input
                          key={`${p.id}-sku-${p.sku || ''}`}
                          type="text"
                          placeholder="SKU / Réf"
                          className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-[#0ea5e9] focus:outline-none transition-colors w-28 px-0.5 py-0.5 mt-0.5 block"
                          defaultValue={p.sku || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (p.sku || '')) {
                              onQuickUpdate(p.id, 'sku', e.target.value);
                            }
                          }}
                        />
                      </div>
                    </td>

                    {/* Maison / Marque */}
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-[0.08em]">
                        {p.brandLabel || 'NAY'}
                      </span>
                    </td>

                    {/* Univers Olfactif / Type */}
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
                        {p.subcategoryLabel || defaultFamilyFallback}
                      </span>
                    </td>

                    {/* Tarif Public */}
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white font-mono">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <input
                            key={`${p.id}-price-${p.price}`}
                            type="number"
                            className="w-16 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-[#0ea5e9] focus:outline-none transition-colors text-right px-1 py-0.5 font-bold text-slate-900 dark:text-white tabular-nums"
                            defaultValue={p.price}
                            onBlur={(e) => {
                              if (Number(e.target.value) !== p.price) {
                                onQuickUpdate(p.id, 'price', Number(e.target.value));
                              }
                            }}
                          />
                          <span className="text-slate-400 dark:text-slate-500 font-medium text-xs font-sans">MAD</span>
                        </div>
                        {hasPromo && (
                          <span className="text-[10px] text-rose-500 line-through font-normal pl-5 tabular-nums">
                            {p.originalPrice} MAD
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Statut Stock */}
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 items-center flex-wrap">
                        {p.inStock ? (
                          <button
                            type="button"
                            onClick={() => onQuickUpdate(p.id, 'inStock', false)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="tabular-nums">En stock ({stockCount})</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onQuickUpdate(p.id, 'inStock', true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-rose-500/[0.08] text-rose-700 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/15 transition-colors cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Rupture</span>
                          </button>
                        )}

                        {sectionBadge}

                        {showTesterSecondaryBadge && p.isTester && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                            Testeur
                          </span>
                        )}

                        {showPublishedToggle && (
                          p.published !== false ? (
                            <button
                              type="button"
                              onClick={() => onQuickUpdate(p.id, 'published', false)}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/[0.08] text-[#0284c7] dark:text-[#38bdf8] border border-sky-500/20 hover:bg-sky-500/15 transition-colors cursor-pointer"
                            >
                              Publié
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onQuickUpdate(p.id, 'published', true)}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              Brouillon
                            </button>
                          )
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="px-2.5 py-1.5 flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:text-[#0ea5e9] dark:hover:text-[#38bdf8] hover:bg-sky-500/10 transition-all border border-slate-200/80 dark:border-white/10 shadow-2xs text-[11px] font-bold cursor-pointer hover:scale-105"
                          title={editButtonTitle}
                        >
                          <Edit2 size={12} />
                          <span>Modifier</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(p.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-slate-200/80 dark:border-white/10 shadow-2xs cursor-pointer hover:scale-105"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface CatalogSlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  saveLabel: string;
  onSave: (e: React.FormEvent) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function CatalogSlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  saveLabel,
  onSave,
  icon,
  children,
}: CatalogSlideOverDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0.85 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.85 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="relative z-10 bg-[#f8fafc] dark:bg-[#0b0f19] w-full max-w-4xl h-full shadow-2xl border-l border-slate-200/80 dark:border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="bg-white/95 dark:bg-[#111624]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(14,165,233,0.3)]">
                  {icon}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {title}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 truncate">
                    {subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-xs font-bold shadow-[0_4px_14px_rgba(14,165,233,0.35)] transition-all cursor-pointer active:scale-95"
                >
                  {saveLabel}
                </button>
              </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-slate-900 dark:text-slate-100">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
