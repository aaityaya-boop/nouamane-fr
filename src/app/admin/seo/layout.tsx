'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Key,
  Sparkles,
  Settings2,
  RefreshCw,
  Calendar,
  Globe2,
  CheckCircle2,
  ArrowUpRight,
  Package,
  Bot,
} from 'lucide-react';

const SEO_NAV_TABS = [
  { href: '/admin/seo', label: "Vue d'Ensemble", icon: <LayoutDashboard size={14} /> },
  { href: '/admin/seo/pages-seo', label: 'Audit Catalogue', icon: <Package size={14} /> },
  { href: '/admin/seo/keywords', label: 'Mots-Clés Maroc', icon: <Key size={14} /> },
  { href: '/admin/seo/opportunities', label: 'Opportunités', icon: <Sparkles size={14} /> },
  { href: '/admin/seo/calendar', label: 'Calendrier Maroc', icon: <Calendar size={14} /> },
  { href: '/admin/seo/technical', label: 'Audit Technique', icon: <Settings2 size={14} /> },
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

  if (pathname.startsWith('/admin/seo/ai') && !pathname.startsWith('/admin/seo/ai-assistant')) {
    return <div className="w-full pb-12">{children}</div>;
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 flex items-center gap-1.5">
              <Globe2 size={12} className="text-[#0ea5e9]" />
              NAY PARFUMS • ORGANIC SEO &amp; SEARCH INTELLIGENCE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Télémétrie Site Réelle
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900">
            Référencement Naturel &amp; Audit SEO Maroc
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
            Audit on-page réel de votre catalogue, sources de trafic PageView, simulateur SERP Google.ma et validation Schema.org.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/seo/ai"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-all"
          >
            <Bot size={14} className="text-[#0ea5e9]" />
            <span>Visibilité IA (GEO)</span>
          </Link>

          <Link
            href="/sitemap.xml"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-all"
          >
            <span>Sitemap.xml</span>
            <ArrowUpRight size={13} className="text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer ${
              syncSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white shadow-sky-500/20'
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Audit en cours...</span>
              </>
            ) : syncSuccess ? (
              <>
                <CheckCircle2 size={13} />
                <span>Audit Synchronisé !</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} />
                <span>Actualiser Audit SEO</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Framer Motion Tab Dock */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
        <nav className="flex flex-wrap items-center gap-1">
          {SEO_NAV_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="seo-nav-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] shadow-sm shadow-sky-500/20"
                  />
                )}
                <span className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {tab.icon}
                </span>
                <span className="relative z-10">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
