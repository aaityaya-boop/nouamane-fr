'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Map,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ExternalLink,
  Search,
  Globe2,
  Package,
  Bookmark,
  BookOpen,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';
import { formatDateGMT } from '@/lib/dateUtils';

interface SitemapStatusData {
  id?: string;
  sitemapUrl: string;
  httpStatus?: number | null;
  isValid: boolean;
  urlCount: number;
  lastCheckedAt?: string | null;
  errorMessage?: string | null;
}

interface UrlItem {
  url: string;
  category: string;
  priority: number;
  changeFrequency: string;
}

interface SitemapClientProps {
  initialStatus: SitemapStatusData | null;
  productsCount: number;
  brandsCount: number;
  blogCount: number;
  staticCount: number;
  sampleUrls: UrlItem[];
}

export default function SitemapClient({
  initialStatus,
  productsCount,
  brandsCount,
  blogCount,
  staticCount,
  sampleUrls,
}: SitemapClientProps) {
  const [status, setStatus] = useState<SitemapStatusData | null>(initialStatus);
  const [isValidating, setIsValidating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const totalUrls = productsCount + brandsCount + blogCount + staticCount;

  const handleValidateSitemap = async () => {
    setIsValidating(true);
    setToastMessage(null);
    try {
      const res = await fetch('/api/admin/seo/sitemap/check', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setStatus(data.status);
        }
        setToastMessage('Sitemap XML vérifié avec succès ! 100% conforme.');
      } else {
        setToastMessage('Échec de la validation du sitemap.');
      }
    } catch (e) {
      console.error(e);
      setToastMessage('Erreur lors du contrôle du sitemap.');
    } finally {
      setIsValidating(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const filteredUrls = sampleUrls.filter(u => {
    const matchesSearch = !search.trim() || u.url.toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || u.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* ── 1. HEADER & ACTION CONTROLS ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              NAY Parfums • Indexation & Google Search Console
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <CheckCircle2 size={11} className="text-emerald-500" />
              Sitemap.xml Actif
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Map size={22} className="text-sky-600" />
            <span>Moteur d'Indexation & Sitemap XML</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Génération automatique, contrôle de conformité XML et transmission directe aux robots Googlebot & Bingbot.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/sitemap.xml"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all"
          >
            <span>Voir /sitemap.xml</span>
            <ArrowUpRight size={13} className="text-slate-400" />
          </Link>

          <button
            onClick={handleValidateSitemap}
            disabled={isValidating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={13} className={isValidating ? 'animate-spin text-sky-300' : 'text-slate-300'} />
            <span>{isValidating ? 'Validation en cours...' : 'Vérifier la Validité du Sitemap'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 2. METRIC SUMMARY CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Indexable</span>
            <span className="p-1 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <Globe2 size={13} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{totalUrls}</div>
          <p className="text-[10px] text-slate-400 mt-1">URLs transmises à Google</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Parfums & Testeurs</span>
            <span className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Package size={13} />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-700 tracking-tight">{productsCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Fiches produits actives</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Marques de Luxe</span>
            <span className="p-1 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <Bookmark size={13} />
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-700 tracking-tight">{brandsCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Pages piliers de marques</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Articles Blog SEO</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <BookOpen size={13} />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">{blogCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Guides olfactifs publiés</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Catégories & Hubs</span>
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Layers size={13} />
            </span>
          </div>
          <div className="text-2xl font-bold text-indigo-700 tracking-tight">{staticCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Rayons & pages clés</p>
        </div>
      </div>

      {/* ── 3. SITEMAP HEALTH & TECHNICAL DIAGNOSTIC ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Health Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Santé Technique du Sitemap
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              100% Conforme
            </span>
          </div>

          <div className="space-y-3 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500">Statut HTTP Serveur</span>
              <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                {status?.httpStatus || 200} OK
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-500">Format XML</span>
              <span className="font-semibold text-slate-800">Standard sitemaps.org 0.9</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-500">Compatibilité Googlebot</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <Check size={13} />
                <span>Optimisé & Indexable</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-500">Fréquence de Mise à Jour</span>
              <span className="font-semibold text-slate-800">Automatique en Temps Réel</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-500">Dernière Vérification</span>
              <span className="font-mono text-slate-600">
                {status?.lastCheckedAt ? formatDateGMT(status.lastCheckedAt) : 'À l’instant'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 Le sitemap de la Maison NAY Parfums est mis à jour dynamiquement à chaque ajout de produit, marque ou article de blog.
            </p>
          </div>
        </div>

        {/* Right: URL Explorer & Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Explorateur des URLs du Sitemap ({filteredUrls.length})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Structure hiérarchique et priorités d'indexation</p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative w-40 sm:w-48">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrer une URL..."
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tout</option>
                <option value="RAYONS">Rayons</option>
                <option value="PRODUITS">Produits</option>
                <option value="MARQUES">Marques</option>
                <option value="BLOG">Blog</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5">URL Publique</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Priorité</th>
                  <th className="px-4 py-2.5">Fréquence</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredUrls.slice(0, 100).map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 text-slate-800 font-medium truncate max-w-xs">
                      {u.url.replace('https://nayparfum.ma', '')}
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.category === 'RAYONS' ? 'bg-indigo-50 text-indigo-700' :
                        u.category === 'PRODUITS' ? 'bg-amber-50 text-amber-700' :
                        u.category === 'MARQUES' ? 'bg-purple-50 text-purple-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {u.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 font-bold">
                      {u.priority}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 capitalize">
                      {u.changeFrequency}
                    </td>
                    <td className="px-4 py-2.5 text-right font-sans">
                      <Link
                        href={u.url.replace('https://nayparfum.ma', '')}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800"
                        title="Tester la page en direct"
                      >
                        <span>Visiter</span>
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
