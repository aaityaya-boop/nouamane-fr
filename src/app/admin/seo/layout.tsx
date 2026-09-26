'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  Key, 
  Sparkles, 
  Settings2, 
  Map, 
  RefreshCw, 
  FolderTree, 
  Calendar, 
  Globe2, 
  CheckCircle2, 
  ArrowUpRight,
  Package,
  Layers
} from 'lucide-react';

const SEO_NAV_TABS = [
  { href: '/admin/seo', label: 'Vue d\'Ensemble', icon: <LayoutDashboard size={15} /> },
  { href: '/admin/seo/pages-seo', label: 'Audit des 199 Parfums', icon: <Package size={15} /> },
  { href: '/admin/seo/keywords', label: 'Mots-Clés Google Maroc', icon: <Key size={15} /> },
  { href: '/admin/seo/opportunities', label: 'Opportunités de Croissance', icon: <Sparkles size={15} /> },
  { href: '/admin/seo/calendar', label: 'Calendrier Commercial Maroc', icon: <Calendar size={15} /> },
  { href: '/admin/seo/technical', label: 'Audit Technique & Sitemap', icon: <Settings2 size={15} /> },
];

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const res = await fetch('/api/admin/seo/sync', { method: 'POST' });
      if (res.ok) {
        setSyncSuccess(true);
        router.refresh();
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to sync SEO:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // If on Visibilité IA Engine (/admin/seo/ai), let the dedicated AI Command Center render independently
  if (pathname.startsWith('/admin/seo/ai')) {
    return <div className="w-full pb-12 font-sans text-slate-900 animate-fadeIn">{children}</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 font-sans text-slate-900 animate-fadeIn">
      
      {/* ── HEADER MOROCCO SEO GROWTH ENGINE ───────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Globe2 size={13} className="text-[#1D9BF0]" />
              Moteur SEO Maroc • Google.ma
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Search Console Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Visibilité & Référencement Naturel Maroc
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimisation des 199 fiches parfums, suivi des requêtes au Maroc et captation du trafic transactionnel.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              syncSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0f172a] hover:bg-slate-800 text-white'
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw size={13} className="animate-spin text-sky-300" />
                <span>Audit & Sync en cours...</span>
              </>
            ) : syncSuccess ? (
              <>
                <CheckCircle2 size={13} />
                <span>Synchronisé avec succès !</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} className="text-slate-300" />
                <span>Actualiser l&apos;Audit SEO</span>
              </>
            )}
          </button>

          <Link
            href="/sitemap.xml"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all"
            title="Consulter le fichier XML sitemap public"
          >
            <span>Sitemap.xml</span>
            <ArrowUpRight size={13} className="text-slate-400" />
          </Link>
        </div>
      </div>

      {/* ── CLEAN 6-TAB NAVIGATION (NO HORIZONTAL OVERFLOW SCROLLBAR) ── */}
      <div className="bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
        <nav className="flex flex-wrap items-center gap-1">
          {SEO_NAV_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className={isActive ? 'text-sky-300' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── CONTENT CONTAINER ────────────────────────────────────────── */}
      <div className="space-y-6">
        {children}
      </div>

    </div>
  );
}
