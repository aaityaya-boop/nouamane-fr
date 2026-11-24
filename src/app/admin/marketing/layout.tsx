'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Radio,
  Send,
  PlusCircle,
  Crown,
  BarChart3,
  Sliders,
  PhoneCall,
  TicketPercent,
  Sparkles,
} from 'lucide-react';

const MARKETING_TABS = [
  { href: '/admin/marketing', label: "Vue d'ensemble", icon: <LayoutDashboard size={14} /> },
  { href: '/admin/marketing/contacts', label: 'Répertoire CRM', icon: <PhoneCall size={14} /> },
  { href: '/admin/marketing/abandoned-carts', label: 'Paniers Abandonnés', icon: <ShoppingCart size={14} /> },
  { href: '/admin/marketing/live-carts', label: 'Live Radar', icon: <Radio size={14} />, live: true },
  { href: '/admin/marketing/campaigns', label: 'Campagnes', icon: <Send size={14} /> },
  { href: '/admin/marketing/campaigns/new', label: 'Créateur Studio', icon: <PlusCircle size={14} /> },
  { href: '/admin/marketing/vip', label: 'Club VIP', icon: <Crown size={14} /> },
  { href: '/admin/marketing/analytics', label: 'Analytique & ROI', icon: <BarChart3 size={14} /> },
  { href: '/admin/marketing/settings', label: 'Automatisations', icon: <Sliders size={14} /> },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-12">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              NAY PARFUMS • RETENTION &amp; GROWTH OS
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Moteur Rétention En Direct
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200/80">
              <Sparkles size={11} />
              WhatsApp +212 &amp; CRM Unifié
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900">
            Marketing &amp; Rétention Client
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
            Pilotez votre cycle de vie client, relances WhatsApp 1-clic, paniers en direct, codes privilège et cohorte LTV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/promos"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
          >
            <TicketPercent size={14} className="text-[#0ea5e9]" />
            <span>Codes Promo</span>
          </Link>

          <Link
            href="/admin/marketing/contacts"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
          >
            <PhoneCall size={13} className="text-slate-500" />
            <span>Répertoire Contacts</span>
          </Link>

          <Link
            href="/admin/marketing/abandoned-carts"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
          >
            <ShoppingCart size={13} className="text-amber-600" />
            <span>Paniers Abandonnés</span>
          </Link>

          <Link
            href="/admin/marketing/campaigns/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white font-semibold text-xs transition-all shadow-md shadow-sky-500/20"
          >
            <PlusCircle size={14} />
            <span>Nouvelle Campagne</span>
          </Link>
        </div>
      </div>

      {/* Unclipped Framer Motion Navigation Dock */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5">
        <nav className="flex flex-wrap items-center gap-1">
          {MARKETING_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="marketing-nav-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] shadow-sm shadow-sky-500/25"
                  />
                )}
                <span className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {tab.icon}
                </span>
                <span className="relative z-10">{tab.label}</span>
                {tab.live && (
                  <span className="relative z-10 flex h-1.5 w-1.5 ml-0.5">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isActive ? 'bg-white' : 'bg-emerald-400'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        isActive ? 'bg-white' : 'bg-emerald-500'
                      }`}
                    />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="min-h-[520px]">{children}</div>
    </div>
  );
}
