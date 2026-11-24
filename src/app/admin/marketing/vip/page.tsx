import React from 'react';
import Link from 'next/link';
import {
  Crown,
  Gift,
  ArrowRight,
  MessageSquare,
  ExternalLink,
  TrendingUp,
  Award,
  ShoppingBag,
  Diamond,
  Clock,
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { getUnifiedCustomers } from '@/lib/unifiedCustomers';

export const dynamic = 'force-dynamic';

export default async function VIPMarketingPage() {
  const allCustomers = await getUnifiedCustomers();

  let totalStoreRevenue = 0;

  const customerStats = allCustomers.map((c) => {
    totalStoreRevenue += c.totalSpent;
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      cleanPhone: c.cleanPhone,
      city: c.city,
      count: c.ordersCount,
      spent: c.totalSpent,
      lastOrder: c.lastOrderDate ? { createdAt: c.lastOrderDate } : null,
      tier: c.tier,
    };
  });

  const vipCustomers = customerStats
    .filter((c) => c.tier !== 'STANDARD')
    .sort((a, b) => b.spent - a.spent);

  const totalVipRevenue = vipCustomers.reduce((acc, c) => acc + c.spent, 0);
  const vipShare =
    totalStoreRevenue > 0 ? ((totalVipRevenue / totalStoreRevenue) * 100).toFixed(1) : '0';
  const diamondCount = vipCustomers.filter((c) => c.tier === 'DIAMOND').length;
  const goldCount = vipCustomers.filter((c) => c.tier === 'GOLD').length;
  const silverCount = vipCustomers.filter((c) => c.tier === 'SILVER').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Crown size={18} className="text-[#0ea5e9]" />
            Club Privilège &amp; Fidélisation VIP
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Paliers Diamant (&gt;5k MAD), Or (&gt;2.5k MAD) et Argent (&gt;1k MAD) avec suivi WhatsApp prioritaire.
          </p>
        </div>

        <Link
          href="/admin/marketing/campaigns/new?audience=VIP"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white font-semibold text-xs shadow-sm shadow-sky-500/20 transition-all shrink-0"
        >
          <Gift size={14} />
          <span>Créer Offre Privilège VIP</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nay-stagger">
        <div className="nay-hero-shine rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white shadow-md shadow-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-100">
              CA CLUB VIP
            </span>
            <TrendingUp size={15} className="text-white/90" />
          </div>
          <div className="mt-2.5 text-2xl font-extrabold tabular-nums">
            {formatMAD(totalVipRevenue)}
          </div>
          <p className="text-[11px] text-sky-100 mt-1">{vipShare}% du chiffre d&apos;affaires total</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              MEMBRES VIP ACTIFS
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-[#0ea5e9]">
              <Crown size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {vipCustomers.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Diamant {diamondCount} • Or {goldCount} • Argent {silverCount}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CLUB DIAMANT (&gt;5K)
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-[#0284c7]">
              <Diamond size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {diamondCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ambassadeurs Maison NAY</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CLUB OR (&gt;2.5K)
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Award size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {goldCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Forte récurrence d&apos;achat</p>
        </div>
      </div>

      {/* VIP Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-[#0ea5e9]" />
            <h3 className="font-bold text-slate-900 text-xs">
              Membres VIP ({vipCustomers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Classé par dépenses cumulées (MAD)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-5">Client VIP</th>
                <th className="py-3 px-4">Palier</th>
                <th className="py-3 px-4">Commandes</th>
                <th className="py-3 px-4">CA Cumulé (LTV)</th>
                <th className="py-3 px-4">Dernier Achat</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {vipCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Crown className="mx-auto text-slate-300 mb-2" size={24} />
                    <p className="font-bold text-slate-800">
                      Aucun client qualifié VIP pour le moment.
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Le statut VIP s&apos;active dès 2 commandes ou 1 000 MAD d&apos;achats.
                    </p>
                  </td>
                </tr>
              ) : (
                vipCustomers.map((vip) => {
                  const rawPhone = vip.phone || '';
                  const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
                  const formattedPhone = cleanDigits.startsWith('0')
                    ? `212${cleanDigits.slice(1)}`
                    : cleanDigits.startsWith('212')
                    ? cleanDigits
                    : cleanDigits
                    ? `212${cleanDigits}`
                    : '';

                  const vipMsg = `Salam ${vip.name} ✨, c'est l'équipe NAY Parfum. En tant que client VIP, nous vous réservons des privilèges exclusifs sur nos prochains arrivages et testeurs rares !`;
                  const whatsappUrl =
                    formattedPhone.length >= 9
                      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(vipMsg)}`
                      : null;

                  return (
                    <tr key={vip.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-200 font-extrabold flex items-center justify-center text-xs shrink-0">
                            {vip.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/admin/customers/${vip.id}`}
                              className="font-bold text-slate-900 hover:text-[#0284c7] transition-colors flex items-center gap-1"
                            >
                              {vip.name}
                              <ExternalLink size={10} className="text-slate-400" />
                            </Link>
                            <div className="text-[11px] text-slate-500 mt-0.5 space-x-1">
                              {vip.phone && <span className="font-mono">{vip.phone}</span>}
                              {vip.phone && vip.city && <span>•</span>}
                              {vip.city && <span>{vip.city}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            vip.tier === 'DIAMOND'
                              ? 'bg-sky-50 text-[#0284c7] border-sky-200'
                              : vip.tier === 'GOLD'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {vip.tier === 'DIAMOND' ? (
                            <Diamond size={11} />
                          ) : vip.tier === 'GOLD' ? (
                            <Crown size={11} />
                          ) : (
                            <Award size={11} />
                          )}
                          <span>
                            VIP{' '}
                            {vip.tier === 'DIAMOND'
                              ? 'Diamant'
                              : vip.tier === 'GOLD'
                              ? 'Or'
                              : 'Argent'}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag size={13} className="text-slate-400" />
                          <span>{vip.count} cmd</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 tabular-nums">
                          {formatMAD(vip.spent)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          {vip.lastOrder
                            ? new Date(vip.lastOrder.createdAt).toLocaleDateString('fr-FR')
                            : '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1fb857] text-white font-bold text-xs shadow-2xs transition-colors"
                            >
                              <MessageSquare size={12} />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <Link
                            href={`/admin/customers/${vip.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors"
                          >
                            <span>Fiche</span>
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
