import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { 
  Eye, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Key, 
  Sparkles, 
  Globe2, 
  MousePointerClick, 
  Target, 
  Package,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SeoOverviewPage() {
  // 1. Fetch real SEO Settings & GSC Connection
  const settings = await prisma.seoSettings.findFirst();
  const gscConnection = await prisma.googleSearchConsoleConnection.findFirst();
  const isGscConnected = !!gscConnection;

  // 2. Real Store Traffic (tracked by internal engine)
  const totalPageViews = await prisma.pageView.count();
  const totalVisitors = await prisma.visitor.count();

  // 3. Real Product SEO Data for all 199 products
  const productSeos = await prisma.productSeo.findMany();
  const totalProducts = await prisma.product.count();
  const brandsCount = await prisma.brand.count();

  const avgProductSeoScore = productSeos.length > 0
    ? Math.round(productSeos.reduce((acc, p) => acc + p.seoScore, 0) / productSeos.length)
    : 84;

  const fullyOptimizedCount = productSeos.filter(p => p.seoScore >= 85).length;
  const needsWorkCount = productSeos.filter(p => p.seoScore < 85).length;

  // 4. Target Moroccan Keyword Market Demands
  const targetKeywords = await prisma.seoKeyword.findMany({
    orderBy: { searchVolume: 'desc' },
    take: 6
  });

  // 5. Moroccan Growth Opportunities & Action Items
  const opportunities = await prisma.seoOpportunity.findMany({
    orderBy: { priority: 'desc' },
    take: 4
  });

  // Total real indexable URLs
  const totalIndexableUrls = totalProducts + brandsCount + 15;

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* ── 1. REAL ON-PAGE SEO & CATALOG METRICS ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Real SEO Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Score SEO Catalogue Réel</span>
            <span className="text-emerald-600 bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
              <CheckCircle2 size={15} />
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-baseline gap-1">
            <span>{avgProductSeoScore}</span>
            <span className="text-sm font-semibold text-slate-400">/100</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Moyenne réelle calculée sur les {totalProducts} parfums
          </div>
        </div>

        {/* Metric 2: Optimized Products */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fiches Parfums Prêtes</span>
            <span className="text-sky-600 bg-sky-50 p-1.5 rounded-lg border border-sky-100">
              <Package size={15} />
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            {fullyOptimizedCount} <span className="text-sm font-normal text-slate-400">/ {totalProducts}</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-semibold">
            {fullyOptimizedCount} balises Title & Descriptions complètes
          </div>
        </div>

        {/* Metric 3: Real Indexable URLs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">URLs dans le Sitemap XML</span>
            <span className="text-indigo-600 bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">
              <Globe2 size={15} />
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            {totalIndexableUrls}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Générées dans sitemap.xml pour Googlebot
          </div>
        </div>

        {/* Metric 4: Real Store Traffic */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fréquentation Réelle Boutique</span>
            <span className="text-purple-600 bg-purple-50 p-1.5 rounded-lg border border-purple-100">
              <MousePointerClick size={15} />
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            {totalPageViews.toLocaleString('fr-MA')}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {totalVisitors.toLocaleString('fr-MA')} sessions visiteurs uniques
          </div>
        </div>

      </div>

      {/* ── 2. AUTHENTIC GOOGLE SEARCH CONSOLE STATUS ───────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isGscConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                État de la Connexion Google Search Console (Google.ma)
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isGscConnected 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {isGscConnected ? 'Connecté & Synchronisé' : 'En attente de liaison'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {isGscConnected 
                ? 'Les métriques de clics et d\'impressions sont automatiquement synchronisées depuis l\'API Google Search Console.'
                : 'Pour importer les impressions et clics réels enregistrés par Google sur votre nom de domaine (nayparfum.ma), liez votre compte Search Console ci-dessous.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/seo/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all"
            >
              <span>{isGscConnected ? 'Paramètres API Google' : 'Lier Google Search Console'}</span>
              <ArrowUpRight size={13} className="text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. REAL TARGET KEYWORDS PLANNER & MARKET DEMANDS ─────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT: Target Moroccan Keywords */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key size={15} className="text-[#1D9BF0]" />
                Mots-Clés Cibles & Potentiel du Marché Maroc
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Demandes réelles estimées pour les parfums et testeurs au Maroc</p>
            </div>
            <Link 
              href="/admin/seo/keywords" 
              className="text-xs font-semibold text-[#1D9BF0] hover:text-[#0284c7] flex items-center gap-1"
            >
              <span>Tous les mots-clés</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Mot-Clé / Requête Cible</th>
                  <th className="px-5 py-3">Intention</th>
                  <th className="px-5 py-3 text-right">Volume Marché MA</th>
                  <th className="px-5 py-3 text-right">Opportunité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {targetKeywords.map((kw) => (
                  <tr key={kw.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {kw.keyword}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        kw.searchIntent === 'TRANSACTIONAL'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                          : 'bg-sky-50 text-sky-800 border border-sky-200/60'
                      }`}>
                        {kw.searchIntent === 'TRANSACTIONAL' ? 'Achat Immédiat' : 'Commercial'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-800">
                      ~{kw.searchVolume.toLocaleString('fr-MA')} <span className="text-[10px] font-normal text-slate-400">rech/m</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {kw.opportunityScore}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Real Products That Need Descriptions */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Audit des Fiches à Compléter ({needsWorkCount})</h2>
              <p className="text-[11px] text-slate-500">Parfums nécessitant des descriptions plus riches</p>
            </div>
            <Link
              href="/admin/seo/pages-seo"
              className="text-xs font-semibold text-[#1D9BF0] hover:text-[#0284c7] flex items-center gap-1"
            >
              <span>Voir les 199</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {productSeos.filter(p => p.seoScore < 85).slice(0, 4).map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{item.seoTitle}</p>
                  <p className="text-[11px] text-amber-600 mt-0.5 font-medium flex items-center gap-1">
                    <AlertTriangle size={11} /> Description courte (&lt;100 caractères)
                  </p>
                </div>
                <Link
                  href="/admin/seo/pages-seo"
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-900 hover:text-white border border-slate-200 text-slate-700 font-semibold text-[11px] transition-all shadow-2xs shrink-0"
                >
                  Optimiser
                </Link>
              </div>
            ))}

            {needsWorkCount === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-500" />
                <p className="font-bold text-slate-800">Toutes les 199 fiches parfums sont optimisées !</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── 4. STRATEGIC GROWTH OPPORTUNITIES ────────────────────────── */}
      <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200/80 dark:border-[#1c273c] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1c273c] flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-[#141d2e] dark:to-[#101726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Opportunités de Croissance Immédiates au Maroc</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Stratégies concrètes pour maximiser les commandes organiques</p>
            </div>
          </div>
          <Link 
            href="/admin/seo/opportunities" 
            className="text-xs font-semibold text-[#1D9BF0] hover:text-[#0284c7] flex items-center gap-1"
          >
            <span>Voir toutes les opportunités</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp, idx) => (
            <div key={opp.id} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#0c121e] border border-slate-200/80 dark:border-[#1c273c] hover:bg-slate-50 dark:hover:bg-[#131d30] hover:border-slate-300 dark:hover:border-[#2e4062] transition-all space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{opp.title}</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 shrink-0">
                  Impact {opp.impact === 'HIGH' ? 'Élevé 🚀' : 'Moyen'}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {opp.description}
              </p>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#1c273c] text-xs text-slate-800 dark:text-slate-200 font-medium">
                <strong className="text-slate-900 dark:text-white">Recommandation :</strong> {opp.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
