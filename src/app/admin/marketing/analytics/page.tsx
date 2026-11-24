import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Repeat,
  Users,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Crown,
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { getUnifiedCustomers } from '@/lib/unifiedCustomers';
import { getAbandonedCartsStats } from '@/lib/abandonedCartsService';

export const dynamic = 'force-dynamic';

export default async function MarketingAnalyticsPage() {
  const [allCustomers, deliveredOrders, abandonedStats] = await Promise.all([
    getUnifiedCustomers(),
    prisma.order.findMany({
      where: { status: 'delivered' },
      orderBy: { createdAt: 'desc' },
    }),
    getAbandonedCartsStats(),
  ]);

  let totalRevenue = 0;
  let firstOrderRevenue = 0;
  let repeatRevenue = 0;
  let returningCustomerCount = 0;
  let singleBuyerCount = 0;

  let cohort1 = 0;
  let cohort2 = 0;
  let cohort3to5 = 0;
  let cohort5plus = 0;

  allCustomers.forEach((c) => {
    const count = c.ordersCount;
    const spent = c.totalSpent;
    totalRevenue += spent;

    if (count === 1) {
      singleBuyerCount++;
      cohort1++;
      firstOrderRevenue += spent;
    } else if (count === 2) {
      returningCustomerCount++;
      cohort2++;
      repeatRevenue += spent;
    } else if (count >= 3 && count <= 5) {
      returningCustomerCount++;
      cohort3to5++;
      repeatRevenue += spent;
    } else if (count > 5) {
      returningCustomerCount++;
      cohort5plus++;
      repeatRevenue += spent;
    }
  });

  const totalDelivered = deliveredOrders.length;
  const aov =
    totalDelivered > 0
      ? Math.round(totalRevenue / totalDelivered)
      : singleBuyerCount + returningCustomerCount > 0
      ? Math.round(totalRevenue / (singleBuyerCount + returningCustomerCount))
      : 0;
  const cltv = allCustomers.length > 0 ? Math.round(totalRevenue / allCustomers.length) : 0;
  const repeatRate =
    allCustomers.length > 0
      ? ((returningCustomerCount / allCustomers.length) * 100).toFixed(1)
      : '0';
  const repeatRevShare =
    totalRevenue > 0 ? ((repeatRevenue / totalRevenue) * 100).toFixed(1) : '0';
  const abandonedValue = abandonedStats.totalValue;
  const safeTotal = Math.max(1, allCustomers.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 size={18} className="text-[#0ea5e9]" />
            Analytique Rétention &amp; Attribution CA
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyse des cohortes d’achat, récurrence VIP, LTV moyenne et valeur des paniers récupérables.
          </p>
        </div>

        <Link
          href="/admin/marketing/campaigns/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white font-semibold text-xs shadow-sm shadow-sky-500/20 transition-all shrink-0"
        >
          <Sparkles size={13} />
          <span>Lancer une Campagne</span>
        </Link>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nay-stagger">
        <div className="nay-hero-shine rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white shadow-md shadow-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-100">
              CA RÉCURRENT (FIDÉLITÉ)
            </span>
            <Repeat size={15} className="text-white/90" />
          </div>
          <div className="mt-2.5 text-2xl font-extrabold tabular-nums">
            {formatMAD(repeatRevenue)}
          </div>
          <p className="text-[11px] text-sky-100 mt-1">
            {repeatRevShare}% du CA global boutique
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TAUX DE RÉTENTION
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-emerald-600 tabular-nums">
            {repeatRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {returningCustomerCount} clients avec &gt;1 commande
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              VALEUR VIE CLIENT (LTV)
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-[#0ea5e9]">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {formatMAD(cltv)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Panier moyen AOV : {formatMAD(aov)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PANIERS ABANDONNÉS
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <ShoppingCart size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {formatMAD(abandonedValue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Potentiel à convertir via WhatsApp</p>
        </div>
      </div>

      {/* Cohorts & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 nay-enter">
        {/* Left: Customer Loyalty Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Fréquence d&apos;Achat &amp; Paliers de Rétention
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Répartition des clients selon leur nombre total de commandes.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-[#0284c7] border border-sky-200">
              {allCustomers.length} clients
            </span>
          </div>

          <div className="space-y-4">
            {[
              {
                label: '1ère Commande Validée (Découverte)',
                count: cohort1,
                bar: 'bg-slate-400',
              },
              {
                label: '2 Commandes (Clients Confirmés)',
                count: cohort2,
                bar: 'bg-[#38bdf8]',
              },
              {
                label: '3 à 5 Commandes (Clients Privilège)',
                count: cohort3to5,
                bar: 'bg-[#0ea5e9]',
              },
              {
                label: 'Plus de 5 Commandes (Ambassadeurs)',
                count: cohort5plus,
                bar: 'bg-[#0284c7]',
              },
            ].map((c) => {
              const pct = Math.round((c.count / safeTotal) * 100);
              return (
                <div key={c.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{c.label}</span>
                    <span className="text-slate-500 font-medium tabular-nums">
                      {c.count} clients ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${c.bar} rounded-full nay-progress-fill`}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-700 font-medium">
              Convertir un acheteur à 1 commande vers un 2ème parfum double sa LTV moyenne.
            </span>
            <Link
              href="/admin/marketing/campaigns/new?audience=ALL"
              className="font-bold text-[#0284c7] hover:underline shrink-0"
            >
              Créer une offre 2ème achat →
            </Link>
          </div>
        </div>

        {/* Right: Revenue Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1 border-b border-slate-100 pb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9]">
              STRUCTURE DU CA
            </span>
            <h3 className="font-bold text-slate-900 text-sm">Impact de la Rétention</h3>
            <p className="text-xs text-slate-500">Premier Achat vs Réachat Fidèle.</p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500 font-medium">Premières Acquisitions</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {formatMAD(firstOrderRevenue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Nouveaux clients découvrant NAY
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs text-emerald-800 font-bold">CA Fidélisé (Réachat)</div>
              <div className="text-xl font-extrabold text-emerald-900 mt-1 tabular-nums">
                {formatMAD(repeatRevenue)}
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                Commandes récurrentes à CAC nul
              </div>
            </div>
          </div>

          <Link
            href="/admin/marketing/vip"
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-opacity"
          >
            <Crown size={13} />
            <span>Voir le Club VIP</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
