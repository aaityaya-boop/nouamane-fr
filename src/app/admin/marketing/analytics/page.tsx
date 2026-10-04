import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  Repeat, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Crown, 
  Sparkles, 
  PieChart, 
  ArrowUpRight, 
  Target,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { getUnifiedCustomers } from '@/lib/unifiedCustomers';
import { getAbandonedCartsStats } from '@/lib/abandonedCartsService';

export const dynamic = 'force-dynamic';

export default async function MarketingAnalyticsPage() {
  const [allCustomers, deliveredOrders, abandonedStats, campaigns] = await Promise.all([
    getUnifiedCustomers(),
    prisma.order.findMany({
      where: { status: 'delivered' },
      orderBy: { createdAt: 'desc' }
    }),
    getAbandonedCartsStats(),
    prisma.marketingCampaign.findMany()
  ]);

  let totalRevenue = 0;
  let firstOrderRevenue = 0;
  let repeatRevenue = 0;
  let returningCustomerCount = 0;
  let singleBuyerCount = 0;

  // Cohorts
  let cohort1 = 0; // 1 order
  let cohort2 = 0; // 2 orders
  let cohort3to5 = 0; // 3-5 orders
  let cohort5plus = 0; // 5+ orders

  allCustomers.forEach(c => {
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
  const aov = totalDelivered > 0 ? Math.round(totalRevenue / totalDelivered) : (singleBuyerCount + returningCustomerCount > 0 ? Math.round(totalRevenue / (singleBuyerCount + returningCustomerCount)) : 0);
  const cltv = allCustomers.length > 0 ? Math.round(totalRevenue / allCustomers.length) : 0;
  const repeatRate = allCustomers.length > 0 ? ((returningCustomerCount / allCustomers.length) * 100).toFixed(1) : '0';
  const repeatRevShare = totalRevenue > 0 ? ((repeatRevenue / totalRevenue) * 100).toFixed(1) : '0';

  const abandonedValue = abandonedStats.totalValue;
  const recoveredValue = 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <BarChart3 size={18} className="text-neutral-700" />
            Analytique Rétention & Attribution CA
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Analyse de la fidélité client, de la récurrence et du retour sur investissement.
          </p>
        </div>

        <Link
          href="/admin/marketing/campaigns/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white font-medium text-xs shadow-xs transition-colors"
        >
          <Sparkles size={13} />
          <span>Lancer une Campagne</span>
        </Link>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">CA Récurrent</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <Repeat size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-neutral-900">{formatMAD(repeatRevenue)}</div>
          <p className="text-[11px] text-sky-700 font-medium mt-0.5">{repeatRevShare}% du CA total (clients fidèles)</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Taux de Rétention</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-700">{repeatRate}%</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">{returningCustomerCount} clients avec &gt;1 commande</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Valeur Vie Client (LTV)</span>
            <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-neutral-900">{formatMAD(cltv)}</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Dépense moyenne par client</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Paniers Abandonnés</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <ShoppingCart size={14} />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-neutral-900">{formatMAD(abandonedValue)}</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">À convertir via WhatsApp</p>
        </div>
      </div>

      {/* Cohorts & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Customer Loyalty Distribution (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5">
            <div>
              <h3 className="font-semibold text-neutral-900 text-sm">Fréquence d'Achat & Rétention</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Répartition des clients selon le nombre de commandes livrées.</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
              {allCustomers.length} clients
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Cohort 1 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-800">1ère Commande Validée (Découverte)</span>
                <span className="text-neutral-500">{cohort1} clients ({allCustomers.length > 0 ? Math.round((cohort1/allCustomers.length)*100) : 0}%)</span>
              </div>
              <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-neutral-400 rounded-full transition-all"
                  style={{ width: `${allCustomers.length > 0 ? (cohort1 / allCustomers.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cohort 2 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-800">2 Commandes (Clients Confirmés)</span>
                <span className="text-neutral-500">{cohort2} clients ({allCustomers.length > 0 ? Math.round((cohort2/allCustomers.length)*100) : 0}%)</span>
              </div>
              <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 rounded-full transition-all"
                  style={{ width: `${allCustomers.length > 0 ? (cohort2 / allCustomers.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cohort 3 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-800">3 à 5 Commandes (Clients Privilège)</span>
                <span className="text-neutral-500">{cohort3to5} clients ({allCustomers.length > 0 ? Math.round((cohort3to5/allCustomers.length)*100) : 0}%)</span>
              </div>
              <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${allCustomers.length > 0 ? (cohort3to5 / allCustomers.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cohort 4 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-800">Plus de 5 Commandes (Ambassadeurs)</span>
                <span className="text-neutral-500">{cohort5plus} clients ({allCustomers.length > 0 ? Math.round((cohort5plus/allCustomers.length)*100) : 0}%)</span>
              </div>
              <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-neutral-900 rounded-full transition-all"
                  style={{ width: `${allCustomers.length > 0 ? (cohort5plus / allCustomers.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/70 flex items-center justify-between text-xs">
            <span className="text-neutral-600">
              💡 Convertir les clients à 1 commande vers une 2ème génère une forte hausse de LTV.
            </span>
            <Link 
              href="/admin/marketing/campaigns/new?audience=ALL" 
              className="font-semibold text-neutral-900 hover:underline shrink-0 ml-3"
            >
              Créer une offre →
            </Link>
          </div>
        </div>

        {/* Right: Revenue Breakdown (1 Col) */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1 border-b border-neutral-100 pb-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Structure du CA</span>
            <h3 className="font-semibold text-neutral-900 text-sm">Impact de la Rétention</h3>
            <p className="text-xs text-neutral-500">Premier Achat vs Réachat.</p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/70">
              <div className="text-xs text-neutral-500">Premières Acquisitions</div>
              <div className="text-lg font-bold text-neutral-900 mt-0.5">{formatMAD(firstOrderRevenue)}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Nouveaux clients découvrant NAY</div>
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="text-xs text-emerald-800 font-medium">CA Fidélisé (Réachat)</div>
              <div className="text-lg font-bold text-emerald-900 mt-0.5">{formatMAD(repeatRevenue)}</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Commandes récurrentes à marge élevée</div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/admin/marketing/vip"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white font-medium text-xs shadow-xs transition-colors"
            >
              <span>Voir les Membres VIP</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
