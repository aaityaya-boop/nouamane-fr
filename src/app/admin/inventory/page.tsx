'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Edit2,
  Check,
  X,
  Archive,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Package,
  Sparkles,
  Plus,
  Minus,
  RefreshCw,
  ArrowUpRight,
  Filter,
  Layers,
  FlaskConical,
  Crown,
  Gift,
  Download,
  ArrowUpDown,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type InventoryStockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type InventorySectionFilter = 'ALL' | 'TESTER' | 'ORIGINAL' | 'MASTER_COPY' | 'COFFRET';
type InventorySortOption = 'STOCK_ASC' | 'STOCK_DESC' | 'NAME_ASC' | 'PRICE_DESC';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [stockFilter, setStockFilter] = useState<InventoryStockFilter>('ALL');
  const [sectionFilter, setSectionFilter] = useState<InventorySectionFilter>('ALL');
  const [sortBy, setSortBy] = useState<InventorySortOption>('NAME_ASC');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      const parsedData = (data || []).map((p: any) => ({
        ...p,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      }));
      setProducts(parsedData);

      const uniqueSubcategories = Array.from(
        new Set(data.map((p: any) => p.subcategoryLabel || 'Parfums'))
      ) as string[];
      setCategories(['Toutes', ...uniqueSubcategories.filter(Boolean)]);
    } catch (error) {
      console.error('Failed to fetch inventory products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setEditStockValue(product.stock || 0);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleQuickAdjust = async (product: any, delta: number) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: newStock, inStock: newStock > 0 } : p))
    );

    try {
      await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, stock: newStock }),
      });
    } catch (error) {
      console.error(error);
      fetchProducts();
    }
  };

  const handleSaveStock = async (id: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: editStockValue, inStock: editStockValue > 0 } : p))
    );
    setEditingId(null);

    try {
      await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stock: editStockValue }),
      });
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la mise à jour du stock');
      fetchProducts();
    }
  };

  // Metrics
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + (Number(p.stock) || 0) * (Number(p.price) || 0),
    0
  );
  const inStockCount = products.filter((p) => (p.stock || 0) > 5).length;
  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
  const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length;
  const healthyRatio = products.length > 0 ? Math.round((inStockCount / products.length) * 100) : 0;

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const q = search.toLowerCase();
        const matchesSearch =
          p.name?.toLowerCase().includes(q) ||
          p.brandLabel?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q));

        const matchesCategory = selectedCategory === 'Toutes' || p.subcategoryLabel === selectedCategory;

        if (!matchesSearch || !matchesCategory) return false;

        if (stockFilter === 'IN_STOCK' && (p.stock || 0) <= 5) return false;
        if (stockFilter === 'LOW_STOCK' && ((p.stock || 0) <= 0 || (p.stock || 0) > 5)) return false;
        if (stockFilter === 'OUT_OF_STOCK' && (p.stock || 0) !== 0) return false;

        if (sectionFilter === 'TESTER') {
          if (!p.isTester || p.subcategory === 'master-copier' || p.subcategory === 'coffrets') return false;
        } else if (sectionFilter === 'ORIGINAL') {
          if (p.isTester || p.subcategory === 'master-copier' || p.subcategory === 'coffrets') return false;
        } else if (sectionFilter === 'MASTER_COPY') {
          if (p.subcategory !== 'master-copier') return false;
        } else if (sectionFilter === 'COFFRET') {
          if (p.subcategory !== 'coffrets') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'STOCK_ASC') return (a.stock || 0) - (b.stock || 0);
        if (sortBy === 'STOCK_DESC') return (b.stock || 0) - (a.stock || 0);
        if (sortBy === 'PRICE_DESC') return (b.price || 0) - (a.price || 0);
        return (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' });
      });
  }, [products, search, selectedCategory, stockFilter, sectionFilter, sortBy]);

  const handleExportInventoryCSV = () => {
    const headers = ['Nom', 'SKU', 'Marque', 'Rayon', 'Famille', 'Prix (MAD)', 'Stock', 'Valeur Stock (MAD)'];
    const rows = filteredProducts.map((p) => {
      const section =
        p.subcategory === 'master-copier'
          ? 'Master Copy'
          : p.subcategory === 'coffrets'
          ? 'Coffret'
          : p.isTester
          ? 'Testeur'
          : 'Original';
      const stock = p.stock || 0;
      return [
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.sku || p.slug || p.id}"`,
        `"${p.brandLabel || 'NAY'}"`,
        section,
        `"${p.subcategoryLabel || 'Parfumerie'}"`,
        p.price || 0,
        stock,
        stock * (Number(p.price) || 0),
      ].join(';');
    });
    const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inventaire_NAY_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-16 font-sans text-slate-900 dark:text-slate-100">
      {/* 🌟 EXECUTIVE HEADER */}
      <div className="nay-enter flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-x-2 gap-y-0.5 mb-1.5 flex-wrap text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-500 dark:text-slate-400">
            <span>NAY PARFUMS · INVENTAIRE &amp; STOCKS</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {totalStockUnits.toLocaleString('fr-FR')} flacons en direct
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Stock Flacons &amp; Parfums en Direct
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Pilotez vos {products.length} références en temps réel, ajustez les quantités en 1 clic et anticipez les réapprovisionnements.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={fetchProducts}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 w-10 sm:w-auto sm:px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#0ea5e9]' : 'text-slate-400'} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              type="button"
              onClick={handleExportInventoryCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="Exporter l'état du stock en CSV"
            >
              <Download size={13} className="text-[#0ea5e9] shrink-0" />
              <span>Export CSV</span>
            </button>
          </div>

          <Link
            href="/admin/products"
            style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 sm:h-9 px-4 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Package size={15} strokeWidth={2.3} className="shrink-0" />
            <span>Catalogue Produits</span>
          </Link>
        </div>
      </div>

      {/* 📊 4 SPATIAL KPI CARDS */}
      <div className="nay-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* Pod 1: Maison Obsidian Lead Card */}
        <div
          onClick={() => setStockFilter('ALL')}
          className={`nay-hero-shine nay-card-lift rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group relative overflow-hidden bg-[#0b1322] dark:bg-[#0f172a] text-white border shadow-md transition-all cursor-pointer ${
            stockFilter === 'ALL' ? 'border-sky-500/40 ring-2 ring-[#0ea5e9]/20' : 'border-slate-800/90 dark:border-sky-500/20'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.12] text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Archive size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300 leading-tight">
                    TOTAL FLACONS
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                    Stock physique atelier
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-sky-300 border border-white/[0.12] shrink-0">
                {products.length} réf.
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-3 mb-1 flex-wrap">
              <div className="text-xl sm:text-[24px] xl:text-[27px] font-bold tracking-tight text-white tabular-nums whitespace-nowrap">
                {totalStockUnits.toLocaleString('fr-FR')}
                <span className="text-sm font-medium text-slate-400 ml-1.5 font-sans">flacons</span>
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-emerald-300 border border-white/[0.12] tabular-nums">
                Valeur : {totalInventoryValue.toLocaleString('fr-FR')} MAD
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 mt-3 relative z-10">
            <span>Inventaire multi-rayons</span>
            <span className="font-bold text-white bg-white/[0.1] border border-white/[0.15] px-2.5 py-0.5 rounded-full">Temps réel</span>
          </div>
        </div>

        {/* Pod 2: Stock Sain (>5) */}
        <div
          onClick={() => setStockFilter(stockFilter === 'IN_STOCK' ? 'ALL' : 'IN_STOCK')}
          className={`nay-card-lift spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group cursor-pointer transition-all ${
            stockFilter === 'IN_STOCK' ? 'ring-2 ring-emerald-500/40 border-emerald-400/60' : ''
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle2 size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    STOCK SAIN (&gt;5)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Prêts pour expédition immédiate
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0 tabular-nums">
                {healthyRatio}%
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight text-slate-900 dark:text-white tabular-nums whitespace-nowrap mt-3 mb-2">
              {inStockCount}
              <span className="text-sm font-semibold text-slate-400 ml-1.5 font-sans">références</span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className="nay-progress-fill h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                style={{ width: `${healthyRatio}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>Niveau optimal (&gt;5 u.)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Optimal</span>
          </div>
        </div>

        {/* Pod 3: Alertes Stock Faible */}
        <div
          onClick={() => setStockFilter(stockFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          className={`nay-card-lift spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group cursor-pointer transition-all ${
            stockFilter === 'LOW_STOCK' ? 'ring-2 ring-amber-500/40 border-amber-400/60' : ''
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <AlertTriangle size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    STOCK FAIBLE (&le;5)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Approvisionnement recommandé
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                Surveiller
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap mt-3 mb-1">
              {lowStockCount}
              <span className="text-sm font-semibold text-slate-400 ml-1.5 font-sans">alertes</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>Seuil critique 1–5 u.</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">À prévoir</span>
          </div>
        </div>

        {/* Pod 4: Ruptures de Stock */}
        <div
          onClick={() => setStockFilter(stockFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
          className={`nay-card-lift spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group cursor-pointer transition-all ${
            stockFilter === 'OUT_OF_STOCK' ? 'ring-2 ring-rose-500/40 border-rose-400/60' : ''
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <TrendingDown size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    RUPTURE DE STOCK
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Produits épuisés sur la vitrine
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
                {outOfStockCount > 0 ? 'Réappro' : 'Complet'}
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
            <span>Commande fournisseur requise</span>
            <span className={`font-bold ${outOfStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {outOfStockCount > 0 ? 'Urgent' : 'OK'}
            </span>
          </div>
        </div>
      </div>

      {/* 🔍 SEARCH, RAYONS & STATUS FILTER TOOLBAR */}
      <div className="nay-enter spatial-card rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#101524] p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par parfum, marque, référence SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 rounded-xl text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#0ea5e9] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Animated Stock Filter Pills + Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 w-full xl:w-auto">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] overflow-x-auto max-w-full">
              {[
                { id: 'ALL' as const, label: `Tous (${products.length})`, activeClass: 'bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] shadow-[0_4px_14px_rgba(14,165,233,0.35)]', dotClass: '' },
                { id: 'LOW_STOCK' as const, label: `Faibles (${lowStockCount})`, activeClass: 'bg-amber-500 shadow-xs', dotClass: 'bg-amber-400' },
                { id: 'OUT_OF_STOCK' as const, label: `Ruptures (${outOfStockCount})`, activeClass: 'bg-rose-600 shadow-xs', dotClass: 'bg-rose-400' },
                { id: 'IN_STOCK' as const, label: `En Stock (${inStockCount})`, activeClass: 'bg-emerald-600 shadow-xs', dotClass: 'bg-emerald-400' },
              ].map((pill) => {
                const isActive = stockFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStockFilter(pill.id)}
                    className={`relative px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="inventory-stock-pill"
                        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                        className={`absolute inset-0 rounded-xl ${pill.activeClass}`}
                      />
                    )}
                    {pill.dotClass && (
                      <span className={`relative z-10 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : pill.dotClass}`} />
                    )}
                    <span className="relative z-10">{pill.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative flex items-center shrink-0">
              <ArrowUpDown size={12} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as InventorySortOption)}
                className="pl-7 pr-3 py-2 bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
              >
                <option value="NAME_ASC">Nom (A → Z)</option>
                <option value="STOCK_ASC">Stock critique d&apos;abord</option>
                <option value="STOCK_DESC">Stock élevé d&apos;abord</option>
                <option value="PRICE_DESC">Prix décroissant</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section Catalog Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 text-[11px] mr-1">
            <Layers size={13} className="text-[#0ea5e9]" /> Rayon :
          </span>
          {[
            { id: 'ALL', label: 'Tous les Rayons', icon: null },
            { id: 'TESTER', label: 'Testeurs', icon: <FlaskConical size={12} className="text-purple-500" /> },
            { id: 'ORIGINAL', label: 'Parfums Originaux', icon: <Crown size={12} className="text-emerald-500" /> },
            { id: 'MASTER_COPY', label: 'Master Copy', icon: <Sparkles size={12} className="text-amber-500" /> },
            { id: 'COFFRET', label: 'Coffrets Cadeaux', icon: <Gift size={12} className="text-indigo-500" /> },
          ].map((sec) => {
            const isActive = sectionFilter === sec.id;
            return (
              <button
                type="button"
                key={sec.id}
                onClick={() => setSectionFilter(sec.id as InventorySectionFilter)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="inventory-section-pill"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-slate-900 dark:bg-[#0ea5e9] shadow-xs"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {sec.icon}
                  <span>{sec.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Olfactive Universe Track */}
        {categories.length > 2 && (
          <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] text-xs overflow-x-auto custom-scrollbar pb-1">
            <span className="text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1 text-[11px] shrink-0">
              <Filter size={12} /> Familles :
            </span>
            {categories.slice(0, 12).map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-sky-500/15 text-[#0284c7] dark:text-[#38bdf8] border border-sky-300/80 dark:border-sky-500/40 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
            {categories.length > 12 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer"
              >
                <option value="Toutes">Plus de familles ({categories.length - 12})...</option>
                {categories.slice(12).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* 📦 INVENTORY TABLE */}
      <div className="nay-enter spatial-card bg-white dark:bg-[#101524] border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-slate-50/80 dark:bg-[#0c0f1a]/80 text-slate-500 dark:text-slate-400 text-[11px] uppercase font-extrabold tracking-wider border-b border-slate-200/80 dark:border-white/10">
              <tr>
                <th className="px-5 py-3.5">Parfum &amp; Référence</th>
                <th className="px-5 py-3.5">Marque &amp; Rayon</th>
                <th className="px-5 py-3.5">Prix Vitrine</th>
                <th className="px-5 py-3.5">Niveau de Stock</th>
                <th className="px-5 py-3.5 text-center">Ajustement Rapide</th>
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
                    <p className="font-bold text-slate-700 dark:text-slate-300">Chargement de l&apos;inventaire...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <Archive size={20} />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                      Aucun produit ne correspond à votre filtre.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock = product.stock || 0;
                  const isEditing = editingId === product.id;
                  const imageSrc =
                    Array.isArray(product.images) && product.images[0]
                      ? product.images[0]
                      : '/placeholder-perfume.jpg';

                  const sectionBadge =
                    product.subcategory === 'master-copier'
                      ? {
                          label: 'Master Copy',
                          href: '/admin/master-copier',
                          icon: <Sparkles size={10} className="text-amber-500" />,
                          color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
                        }
                      : product.subcategory === 'coffrets'
                      ? {
                          label: 'Coffret',
                          href: '/admin/coffrets',
                          icon: <Gift size={10} className="text-indigo-500" />,
                          color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
                        }
                      : product.isTester
                      ? {
                          label: 'Testeur',
                          href: '/admin/products',
                          icon: <FlaskConical size={10} className="text-purple-500" />,
                          color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
                        }
                      : {
                          label: 'Original',
                          href: '/admin/parfums-originaux',
                          icon: <Crown size={10} className="text-emerald-500" />,
                          color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
                        };

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-sky-500/[0.03] dark:hover:bg-sky-500/[0.06] transition-all group"
                    >
                      {/* Product & Thumbnail */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 overflow-hidden relative shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                            {imageSrc.startsWith('http') || imageSrc.startsWith('/') ? (
                              <Image
                                src={imageSrc}
                                alt={product.name}
                                fill
                                className="object-contain p-1"
                                sizes="44px"
                              />
                            ) : (
                              <Sparkles size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[220px] group-hover:text-[#0ea5e9] dark:group-hover:text-[#38bdf8] transition-colors">
                              {product.name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                              SKU: {product.sku || product.slug || `#${product.id}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brand & Section */}
                      <td className="px-5 py-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 uppercase tracking-wider">
                            {product.brandLabel || 'NAY'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${sectionBadge.color}`}
                          >
                            {sectionBadge.icon}
                            <span>{sectionBadge.label}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {product.subcategoryLabel || 'Parfumerie'}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                        {product.price ? `${product.price} MAD` : 'N/A'}
                      </td>

                      {/* Stock Level & Inline Edit */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={editStockValue}
                              onChange={(e) => setEditStockValue(parseInt(e.target.value, 10) || 0)}
                              className="w-20 px-2.5 py-1 bg-white dark:bg-[#0c0f1a] border border-[#0ea5e9] rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none ring-2 ring-[#0ea5e9]/20 tabular-nums"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveStock(product.id)}
                              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                              title="Enregistrer"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title="Annuler"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-extrabold border tabular-nums ${
                              stock === 0
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                                : stock <= 5
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                stock === 0
                                  ? 'bg-rose-500 animate-pulse'
                                  : stock <= 5
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            {stock} {stock <= 1 ? 'flacon' : 'flacons'}
                          </span>
                        )}
                      </td>

                      {/* Quick Adjust Stepper */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl border border-slate-200/80 dark:border-white/10">
                          <button
                            onClick={() => handleQuickAdjust(product, -1)}
                            disabled={stock === 0}
                            title="-1 flacon"
                            className="w-7 h-7 rounded-lg bg-white dark:bg-[#141a29] hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="px-2.5 text-xs font-mono font-bold text-slate-800 dark:text-white tabular-nums">
                            {stock}
                          </span>
                          <button
                            onClick={() => handleQuickAdjust(product, 1)}
                            title="+1 flacon"
                            className="w-7 h-7 rounded-lg bg-white dark:bg-[#141a29] hover:bg-emerald-50 dark:hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(product, 5)}
                            title="+5 flacons"
                            className="px-2 h-7 rounded-lg bg-white dark:bg-[#141a29] hover:bg-sky-50 dark:hover:bg-sky-500/15 hover:text-[#0284c7] dark:hover:text-[#38bdf8] text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-sky-500/10 text-slate-700 dark:text-slate-200 hover:text-[#0ea5e9] dark:hover:text-[#38bdf8] border border-slate-200/80 dark:border-white/10 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer hover:scale-105"
                          >
                            <Edit2 size={12} />
                            <span>Éditer</span>
                          </button>
                          <Link
                            href={sectionBadge.href}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-[#0ea5e9] dark:hover:text-[#38bdf8] hover:bg-sky-500/10 border border-slate-200/80 dark:border-white/10 transition-all hover:scale-105"
                            title={`Ouvrir dans ${sectionBadge.label}`}
                          >
                            <ArrowUpRight size={14} />
                          </Link>
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
    </div>
  );
}
