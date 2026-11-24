'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Plus,
  Users,
  TrendingUp,
  Award,
  ExternalLink,
  Sparkles,
  Wallet,
  Copy,
  Check,
  Search,
  MessageSquare,
  ArrowRight,
  MousePointerClick,
} from 'lucide-react';
import { formatMAD } from '@/lib/products';

export interface AffiliateRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  code: string;
  commissionType: string | null;
  commissionRate: number;
  fixedPerOrder: number;
  payPerVisit: number;
  payPerLead: number;
  monthlyRetainer: number;
  visits: number;
  leads: number;
  sales: number;
  revenueGenerated: number;
  commissionEarned: number;
  commissionPaid: number;
  isActive: boolean;
}

interface Props {
  affiliates: AffiliateRow[];
  stats: {
    totalRevenue: number;
    totalCommissions: number;
    totalPaid: number;
    totalPending: number;
    totalVisits: number;
    totalSales: number;
    totalLeads: number;
  };
}

export default function AffiliatesClient({ affiliates, stats }: Props) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'OWING' | 'ACTIVE'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return affiliates.filter((a) => {
      const balance = Math.max(0, a.commissionEarned - (a.commissionPaid || 0));
      if (filterMode === 'OWING' && balance <= 0) return false;
      if (filterMode === 'ACTIVE' && !a.isActive) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        (a.instagram && a.instagram.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q))
      );
    });
  }, [affiliates, filterMode, search]);

  const conversionRate =
    stats.totalVisits > 0 ? ((stats.totalSales / stats.totalVisits) * 100).toFixed(1) : '0.0';
  const paidPercent =
    stats.totalCommissions > 0
      ? Math.min(100, Math.round((stats.totalPaid / stats.totalCommissions) * 100))
      : 0;

  const leaderboardData = useMemo(() => {
    return [...affiliates]
      .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
      .slice(0, 6)
      .map((a) => ({
        name: a.name.split(' ')[0] || a.code,
        revenue: Math.round(a.revenueGenerated),
        commission: Math.round(a.commissionEarned),
      }));
  }, [affiliates]);

  const copyVipLink = (code: string) => {
    const url = `${window.location.origin}/vip/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getCompensationLabel = (aff: AffiliateRow) => {
    const type = aff.commissionType || 'PERCENTAGE';
    if (type === 'PERCENTAGE') return `${aff.commissionRate}% / vente`;
    if (type === 'FIXED_PER_ORDER') return `${aff.fixedPerOrder} MAD / cmd`;
    if (type === 'PAY_PER_VISIT') return `${aff.payPerVisit} MAD / clic`;
    if (type === 'PAY_PER_LEAD') return `${aff.payPerLead} MAD / lead`;
    if (type === 'MONTHLY_RETAINER') return `${formatMAD(aff.monthlyRetainer)} / mois`;
    if (type === 'HYBRID') return `${aff.commissionRate}% + ${aff.fixedPerOrder} DH`;
    return `${aff.commissionRate}%`;
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              NAY PARFUMS • AMBASSADOR &amp; CREATOR GROWTH
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200">
              <Sparkles size={11} />
              Tracking VIP /vip/[code]
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900">
            Programme Ambassadeurs &amp; Influenceurs
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
            Mesurez le CA réel généré par chaque créateur, leurs taux de conversion et pilotez les versements commissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/fr/ambassadeur"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
          >
            <ExternalLink size={13} className="text-[#0ea5e9]" />
            <span>Portail Ambassadeur</span>
          </Link>

          <Link
            href="/admin/affiliates/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all"
          >
            <Plus size={14} />
            <span>Nouvel Ambassadeur</span>
          </Link>
        </div>
      </div>

      {/* 4 Executive Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nay-stagger">
        <div className="nay-hero-shine rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] text-white shadow-lg shadow-sky-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-100">
              CA TOTAL AMBASSADEURS
            </span>
            <TrendingUp size={15} className="text-white/90" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold tabular-nums">
              {formatMAD(stats.totalRevenue)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/25">
              Conv. {conversionRate}%
            </span>
          </div>
          <p className="text-[11px] text-sky-100 mt-1.5">
            {stats.totalSales} ventes attribuées • {affiliates.length} partenaires
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              TRAFIC &amp; LEADS VIP
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-[#0ea5e9]">
              <MousePointerClick size={14} />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {stats.totalVisits} <span className="text-xs font-semibold text-slate-400">clics</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {stats.totalLeads} leads / inscrits capturés
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              COMMISSIONS DUES
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Wallet size={14} />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-amber-600 tabular-nums">
            {formatMAD(stats.totalPending)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">Solde restant à régler</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              DÉJÀ VERSÉ (PAYOUTS)
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Award size={14} />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-emerald-600 tabular-nums">
            {formatMAD(stats.totalPaid)}
          </div>
          <div className="space-y-1 mt-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 nay-progress-fill"
                style={{ width: `${Math.max(4, paidPercent)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">{paidPercent}% des commissions réglées</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Chart (when affiliates exist) */}
      {leaderboardData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs nay-enter">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0ea5e9]">
                CLASSEMENT CRÉATEURS
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">
                Performance CA Généré vs Commissions (Top Ambassadeurs)
              </h2>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" /> CA Généré (MAD)
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Commissions (MAD)
              </span>
            </div>
          </div>

          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderboardData} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  formatter={(v: unknown) => formatMAD(Number(v) || 0)}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                <Bar dataKey="commission" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search & Affiliates Table */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: `Tous (${affiliates.length})` },
                { id: 'OWING', label: 'Solde à payer' },
                { id: 'ACTIVE', label: 'Actifs' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher nom, code, Instagram..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#0ea5e9]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-5">Ambassadeur &amp; Accès</th>
                <th className="py-3 px-4">Lien VIP Partageable</th>
                <th className="py-3 px-4">Rémunération</th>
                <th className="py-3 px-4 text-center">Trafic &amp; Leads</th>
                <th className="py-3 px-4 text-center">Ventes &amp; Conv.</th>
                <th className="py-3 px-4">Commissions &amp; Solde</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <Users size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-slate-700">Aucun ambassadeur trouvé</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Créez votre premier compte partenaire avec accès portail /ambassadeur.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((aff) => {
                  const balance = Math.max(0, aff.commissionEarned - (aff.commissionPaid || 0));
                  const conv = aff.visits > 0 ? ((aff.sales / aff.visits) * 100).toFixed(1) : '0.0';
                  const waDigits = (aff.phone || '').replace(/[^0-9]/g, '');
                  const formattedWa = waDigits.startsWith('0')
                    ? `212${waDigits.slice(1)}`
                    : waDigits.startsWith('212')
                    ? waDigits
                    : waDigits.length === 9
                    ? `212${waDigits}`
                    : '';

                  return (
                    <tr key={aff.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            {aff.name}
                            {aff.instagram && (
                              <span className="text-[10px] text-[#0284c7] font-semibold">
                                @{aff.instagram.replace(/^@/, '')}
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            {aff.email ? (
                              <span className="font-mono">{aff.email}</span>
                            ) : (
                              <span className="text-amber-600 font-semibold">Sans accès portail</span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 text-slate-800 bg-sky-50/70 px-2.5 py-1 rounded-lg text-xs font-mono border border-sky-200/80">
                          <span className="font-bold text-[#0284c7]">/vip/{aff.code}</span>
                          <button
                            type="button"
                            onClick={() => copyVipLink(aff.code)}
                            className="text-slate-400 hover:text-[#0284c7] cursor-pointer"
                            title="Copier le lien VIP"
                          >
                            {copiedCode === aff.code ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <a
                            href={`/vip/${aff.code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-slate-900"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {getCompensationLabel(aff)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-slate-900">{aff.visits} clics</span>
                          <span className="text-[10px] text-[#0284c7] font-semibold">
                            {aff.leads || 0} leads
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-slate-900">
                            {aff.sales} ({conv}%)
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            {formatMAD(aff.revenueGenerated)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-amber-700 font-extrabold">
                            Dû : {formatMAD(balance)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Gagné {formatMAD(aff.commissionEarned)} • Versé {formatMAD(aff.commissionPaid || 0)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {formattedWa.length >= 11 && (
                            <a
                              href={`https://wa.me/${formattedWa}?text=${encodeURIComponent(
                                `Salam ${aff.name} ✨, voici votre point NAY Ambassadeur : ${aff.sales} ventes (${formatMAD(aff.revenueGenerated)}), commissions disponibles : ${formatMAD(balance)}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              title="Contacter sur WhatsApp"
                            >
                              <MessageSquare size={13} />
                            </a>
                          )}
                          <Link
                            href={`/admin/affiliates/${aff.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] rounded-lg shadow-2xs hover:opacity-95"
                          >
                            <span>Gérer</span>
                            <ArrowRight size={11} />
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
