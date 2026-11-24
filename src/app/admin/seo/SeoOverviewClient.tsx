'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Key,
  Sparkles,
  Globe2,
  MousePointerClick,
  Package,
  Search,
  Wand2,
  Loader2,
  MapPin,
  Smartphone,
  Monitor,
  Code2,
  Save,
  TrendingUp,
  FileText,
  ExternalLink,
} from 'lucide-react';

export interface AuditedProductRow {
  id: number;
  name: string;
  brand: string;
  slug: string;
  price: number;
  score: number;
  issues: string[];
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  hasImages: boolean;
  hasLongDesc: boolean;
}

export interface DailyTrafficPoint {
  date: string;
  label: string;
  views: number;
}

export interface ReferrerStat {
  source: string;
  count: number;
  share: number;
}

export interface TopPageStat {
  pathname: string;
  views: number;
}

export interface CityVisitStat {
  city: string;
  count: number;
}

interface Props {
  catalogMetrics: {
    avgScore: number;
    totalProducts: number;
    optimizedCount: number;
    needsWorkCount: number;
    missingMetaDescCount: number;
    shortProductDescCount: number;
    brandsCount: number;
    publishedBlogsCount: number;
    activeLandingsCount: number;
    totalIndexableUrls: number;
  };
  trafficMetrics: {
    totalPageViews: number;
    totalVisitors: number;
    mobilePct: number;
    desktopPct: number;
    dailyTraffic: DailyTrafficPoint[];
    referrers: ReferrerStat[];
    topPages: TopPageStat[];
    topCities: CityVisitStat[];
  };
  gsc: {
    connected: boolean;
    propertyUrl: string | null;
    clicks: number;
    impressions: number;
  };
  initialAuditedProducts: AuditedProductRow[];
  keywords: Array<{
    id: string;
    keyword: string;
    searchIntent: string;
    searchVolume: number;
    opportunityScore: number;
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    impact: string;
    description: string;
    recommendation: string;
  }>;
}

export default function SeoOverviewClient({
  catalogMetrics,
  trafficMetrics,
  gsc,
  initialAuditedProducts,
  keywords,
  opportunities,
}: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<AuditedProductRow[]>(initialAuditedProducts);
  const [auditFilter, setAuditFilter] = useState<'NEEDS_WORK' | 'ALL' | 'OPTIMIZED'>('NEEDS_WORK');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected product in Live SERP Simulator
  const [selectedId, setSelectedId] = useState<number>(
    initialAuditedProducts.find((p) => p.score < 85)?.id || initialAuditedProducts[0]?.id || 0
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) || products[0] || null,
    [products, selectedId]
  );

  const [editTitle, setEditTitle] = useState<string>(selectedProduct?.seoTitle || '');
  const [editDesc, setEditDesc] = useState<string>(selectedProduct?.metaDescription || '');
  const [editKw, setEditKw] = useState<string>(selectedProduct?.focusKeyword || '');
  const [serpDevice, setSerpDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [showSchema, setShowSchema] = useState(false);

  const [savingOne, setSavingOne] = useState(false);
  const [bulkOptimizing, setBulkOptimizing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSelectProduct = (row: AuditedProductRow) => {
    setSelectedId(row.id);
    setEditTitle(row.seoTitle);
    setEditDesc(row.metaDescription);
    setEditKw(row.focusKeyword);
  };

  const filteredAuditList = useMemo(() => {
    return products
      .filter((p) => {
        if (auditFilter === 'NEEDS_WORK' && p.score >= 85) return false;
        if (auditFilter === 'OPTIMIZED' && p.score < 85) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.score - b.score);
  }, [products, auditFilter, searchQuery]);

  const liveAvgScore = useMemo(() => {
    if (products.length === 0) return catalogMetrics.avgScore;
    return Math.round(products.reduce((acc, p) => acc + p.score, 0) / products.length);
  }, [products, catalogMetrics.avgScore]);

  const liveNeedsWorkCount = useMemo(
    () => products.filter((p) => p.score < 85).length,
    [products]
  );

  const liveOptimizedCount = products.length - liveNeedsWorkCount;

  const handleSaveSerpEdit = async () => {
    if (!selectedProduct) return;
    setSavingOne(true);
    try {
      const res = await fetch('/api/admin/seo/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          seoTitle: editTitle.trim(),
          metaDescription: editDesc.trim(),
          focusKeyword: editKw.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id
              ? {
                  ...p,
                  seoTitle: editTitle.trim(),
                  metaDescription: editDesc.trim(),
                  focusKeyword: editKw.trim(),
                  score: data.score ?? p.score,
                  issues: data.issues ?? p.issues,
                }
              : p
          )
        );
        showToast(`Fiche "${selectedProduct.name}" enregistrée (Score : ${data.score}/100)`);
        router.refresh();
      }
    } finally {
      setSavingOne(false);
    }
  };

  const handleBulkOptimize = async () => {
    setBulkOptimizing(true);
    try {
      const res = await fetch('/api/admin/seo/bulk-optimize', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${data.updatedCount} fiche(s) produit(s) optimisées en base de données !`);
        // Reload fresh real scores from GET /api/admin/seo/pages
        const freshRes = await fetch('/api/admin/seo/pages');
        const freshData = await freshRes.json();
        if (freshRes.ok && freshData.success && Array.isArray(freshData.data)) {
          setProducts(
            freshData.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              brand: item.brand,
              slug: item.slug,
              price: item.price,
              score: item.seoScore,
              issues: item.issues || [],
              seoTitle: item.seoTitle,
              metaDescription: item.metaDescription,
              focusKeyword: item.focusKeyword,
              hasImages: true,
              hasLongDesc: true,
            }))
          );
        }
        router.refresh();
      }
    } finally {
      setBulkOptimizing(false);
    }
  };

  const schemaJsonPreview = selectedProduct
    ? JSON.stringify(
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: selectedProduct.name,
          brand: { '@type': 'Brand', name: selectedProduct.brand },
          description: editDesc || selectedProduct.metaDescription,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'MAD',
            price: selectedProduct.price,
            availability: 'https://schema.org/InStock',
            url: `https://nayparfum.ma/products/${selectedProduct.slug}`,
          },
        },
        null,
        2
      )
    : '';

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white border border-sky-500/40 shadow-xl text-xs font-semibold">
          <CheckCircle2 size={14} className="text-sky-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Row 1 — 4 Executive Real-Data Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nay-stagger">
        {/* Hero Card: Real Catalog Audit Score */}
        <div className="nay-hero-shine rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] text-white shadow-lg shadow-sky-500/20 flex flex-col justify-between min-h-[156px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-100">
              SCORE SEO RÉEL CATALOGUE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/25">
              {liveOptimizedCount}/{products.length} prêtes
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-3xl font-extrabold tabular-nums">{liveAvgScore}</span>
              <span className="text-sm font-semibold text-sky-100 ml-1">/100</span>
            </div>
            {liveNeedsWorkCount > 0 && (
              <button
                type="button"
                disabled={bulkOptimizing}
                onClick={handleBulkOptimize}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white text-[#0284c7] hover:bg-sky-50 text-[11px] font-bold shadow-xs cursor-pointer disabled:opacity-60"
              >
                {bulkOptimizing ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Wand2 size={11} />
                )}
                <span>Optimiser {liveNeedsWorkCount}</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-sky-100 mt-2">
            {catalogMetrics.missingMetaDescCount} meta desc. manquantes • {catalogMetrics.shortProductDescCount} descriptions courtes
          </p>
        </div>

        {/* Indexable Sitemap URLs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[156px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              URLS INDEXABLES SITEMAP
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-[#0ea5e9]">
              <Globe2 size={15} />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {catalogMetrics.totalIndexableUrls}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-snug">
            {catalogMetrics.totalProducts} produits • {catalogMetrics.brandsCount} marques • {catalogMetrics.publishedBlogsCount} articles blog • {catalogMetrics.activeLandingsCount} funnels
          </p>
        </div>

        {/* Real PageView Traffic */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[156px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              TRAFIC BOUTIQUE RÉEL
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <MousePointerClick size={15} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {trafficMetrics.totalPageViews.toLocaleString('fr-MA')}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {trafficMetrics.totalVisitors} visiteurs
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Mobile {trafficMetrics.mobilePct}% • Desktop {trafficMetrics.desktopPct}%
          </p>
        </div>

        {/* Honest Google Search Console Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[156px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              GOOGLE SEARCH CONSOLE
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                gsc.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {gsc.connected ? 'Connecté' : 'Non lié'}
            </span>
          </div>

          {gsc.connected ? (
            <>
              <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
                {gsc.clicks.toLocaleString('fr-MA')} <span className="text-xs font-normal text-slate-400">clics</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {gsc.impressions.toLocaleString('fr-MA')} impressions Google.ma
              </p>
            </>
          ) : (
            <>
              <div className="mt-2.5 text-sm font-extrabold text-slate-900">
                Données Google.ma en attente
              </div>
              <Link
                href="/admin/seo/settings"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#0284c7] hover:underline"
              >
                Lier Search Console OAuth <ArrowUpRight size={11} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Row 2 — Real 14-Day Store Traffic Curve + Real Referrers & Top Visited URLs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 nay-enter">
        {/* 14-Day Real PageViews AreaChart */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0ea5e9]">
                TÉLÉMÉTRIE TRAFIC RÉEL (14 JOURS)
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                Pages Vues Quotidiennes sur la Boutique
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Source : table PostgreSQL PageView
            </span>
          </div>

          <div className="h-[220px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficMetrics.dailyTraffic} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="naySeoViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  formatter={(v: unknown) => [`${v} pages vues`, 'Trafic réel']}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fill="url(#naySeoViews)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Visited Storefront Cities */}
          {trafficMetrics.topCities.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <MapPin size={12} className="text-[#0ea5e9]" />
                Villes Visiteurs Réelles :
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {trafficMetrics.topCities.map((c) => (
                  <span
                    key={c.city}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700"
                  >
                    {c.city} <strong className="text-[#0284c7]">{c.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Real Acquisition Sources & Top Pages */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              SOURCES &amp; PAGES POPULAIRES
            </span>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
              Provenance Réelle &amp; URLs les Plus Vues
            </h2>
          </div>

          {/* Referrers Breakdown */}
          <div className="space-y-2.5">
            {trafficMetrics.referrers.map((r) => (
              <div key={r.source} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{r.source}</span>
                  <span className="text-slate-500 tabular-nums">
                    {r.count} ({r.share}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0ea5e9] nay-progress-fill"
                    style={{ width: `${Math.max(3, r.share)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Top Visited URLs */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Top URLs Consultées
            </div>
            <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
              {trafficMetrics.topPages.map((pg) => (
                <div
                  key={pg.pathname}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                >
                  <span className="font-mono text-[11px] text-slate-700 truncate">
                    {pg.pathname}
                  </span>
                  <span className="font-bold text-[#0284c7] shrink-0 tabular-nums">
                    {pg.views} vues
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — NEW ENTERPRISE FEATURE: Real Product SEO Auditor & Live Google.ma SERP Simulator */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden nay-enter">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0ea5e9]">
              AUDIT TECHNIQUE &amp; SIMULATEUR SERP GOOGLE.MA
            </span>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
              Inspecteur On-Page Catalogue &amp; Éditeur Balises Meta en Direct
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'NEEDS_WORK', label: `À Optimiser (${liveNeedsWorkCount})` },
                { id: 'ALL', label: `Tout le Catalogue (${products.length})` },
                { id: 'OPTIMIZED', label: `Score >= 85 (${liveOptimizedCount})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setAuditFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  auditFilter === f.id
                    ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left 5 Cols: Real Audited Product List */}
          <div className="lg:col-span-5 p-4 space-y-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher parfum, marque ou slug..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredAuditList.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
                  <p className="font-bold text-slate-800">Aucune fiche dans ce filtre !</p>
                </div>
              ) : (
                filteredAuditList.slice(0, 40).map((row) => {
                  const isSel = selectedProduct?.id === row.id;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => handleSelectProduct(row)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSel
                          ? 'border-[#0ea5e9] bg-sky-50/60 ring-1 ring-[#0ea5e9]/30'
                          : 'border-slate-200/80 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {row.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 tabular-nums ${
                            row.score >= 85
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : row.score >= 65
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {row.score}/100
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between gap-2">
                        <span className="truncate">{row.brand} • {row.price} MAD</span>
                        {row.issues.length > 0 && (
                          <span className="text-[10px] font-semibold text-amber-600 truncate max-w-[170px]">
                            {row.issues[0]}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right 7 Cols: Live Google.ma SERP Snippet Preview + Inline Editor */}
          <div className="lg:col-span-7 p-5 space-y-4 bg-slate-50/40">
            {selectedProduct ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSerpDevice('desktop')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        serpDevice === 'desktop'
                          ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <Monitor size={12} /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerpDevice('mobile')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        serpDevice === 'mobile'
                          ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <Smartphone size={12} /> Mobile
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSchema((s) => !s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-[#0ea5e9] cursor-pointer"
                    >
                      <Code2 size={12} className="text-[#0ea5e9]" />
                      {showSchema ? 'Masquer JSON-LD' : 'Schema.org JSON-LD'}
                    </button>
                  </div>

                  <a
                    href={`/fr/products/${selectedProduct.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-[#0284c7] hover:underline flex items-center gap-1"
                  >
                    Voir fiche <ExternalLink size={11} />
                  </a>
                </div>

                {/* Google SERP Preview Card */}
                <div
                  className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1 ${
                    serpDevice === 'mobile' ? 'max-w-[360px]' : 'w-full'
                  }`}
                >
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0ea5e9] text-white text-[9px] font-bold flex items-center justify-center">
                      N
                    </span>
                    <span className="truncate font-mono">
                      https://nayparfum.ma › products › {selectedProduct.slug}
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold text-[#1a0dab] leading-snug line-clamp-2">
                    {editTitle || selectedProduct.name}
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {editDesc || 'Aucune meta description définie — Google risque d’afficher un extrait tronqué.'}
                  </div>
                  <div className="pt-1 flex items-center gap-3 text-[11px] text-emerald-700 font-semibold">
                    <span>★ 4.9 (Avis Maroc)</span>
                    <span>•</span>
                    <span>{selectedProduct.price} MAD</span>
                    <span>•</span>
                    <span>En stock</span>
                  </div>
                </div>

                {showSchema && (
                  <pre className="p-3 rounded-xl bg-slate-900 text-sky-300 text-[11px] font-mono overflow-x-auto max-h-40">
                    {schemaJsonPreview}
                  </pre>
                )}

                {/* Inline SEO Fields Editor */}
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-600 uppercase">Balise Meta Title (30–65 car.)</span>
                      <span
                        className={
                          editTitle.length >= 30 && editTitle.length <= 68
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }
                      >
                        {editTitle.length} / 65 car.
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-600 uppercase">Meta Description (110–160 car.)</span>
                      <span
                        className={
                          editDesc.length >= 110 && editDesc.length <= 168
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }
                      >
                        {editDesc.length} / 160 car.
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                        Mot-Clé Cible Principal (Google.ma)
                      </label>
                      <input
                        type="text"
                        value={editKw}
                        onChange={(e) => setEditKw(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={savingOne}
                      onClick={handleSaveSerpEdit}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60 shrink-0"
                    >
                      {savingOne ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                      <span>Enregistrer &amp; Recalculer Score</span>
                    </button>
                  </div>

                  {/* Issues diagnostic pills */}
                  {selectedProduct.issues.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {selectedProduct.issues.map((iss) => (
                        <span
                          key={iss}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold"
                        >
                          <AlertTriangle size={10} /> {iss}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">Sélectionnez un produit à inspecter.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 4 — Moroccan Target Keywords + Opportunities */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 nay-enter">
        <div className="xl:col-span-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key size={14} className="text-[#0ea5e9]" />
                Mots-Clés Stratégiques Google.ma
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Requêtes transactionnelles ciblées au Maroc
              </p>
            </div>
            <Link
              href="/admin/seo/keywords"
              className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1"
            >
              Tout voir <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-2.5">Mot-Clé</th>
                  <th className="px-5 py-2.5">Intention</th>
                  <th className="px-5 py-2.5 text-right">Volume MA</th>
                  <th className="px-5 py-2.5 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keywords.map((kw) => (
                  <tr key={kw.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-2.5 font-semibold text-slate-900">{kw.keyword}</td>
                    <td className="px-5 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0284c7] border border-sky-200">
                        {kw.searchIntent === 'TRANSACTIONAL' ? 'Achat' : 'Commercial'}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-800">
                      {kw.searchVolume.toLocaleString('fr-MA')}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono font-bold text-emerald-600">
                      {kw.opportunityScore}/100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={14} className="text-[#0ea5e9]" />
                Plan d&apos;Actions &amp; Opportunités Organiques
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Priorités à plus fort potentiel ROI sur Google.ma
              </p>
            </div>
            <Link
              href="/admin/seo/opportunities"
              className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1"
            >
              Détails <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {opportunities.map((opp, idx) => (
              <div
                key={opp.id}
                className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#0284c7]">
                    #{idx + 1} • IMPACT {opp.impact}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{opp.title}</h3>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-snug">
                  {opp.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
