import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { formatMAD } from '@/lib/products';
import {
  ShoppingCart,
  Clock,
  User,
  Package,
  TrendingUp,
  Sparkles,
  Zap,
  Flame,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LiveCartsPage() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const liveCarts = await prisma.liveCartSession.findMany({
    where: {
      lastActivity: { gte: twentyFourHoursAgo },
      items: { not: '[]' },
    },
    orderBy: { lastActivity: 'desc' },
  });

  const activeCartsCount = liveCarts.length;
  const potentialRevenue = liveCarts.reduce((acc, cart) => acc + cart.totalValue, 0);

  const productCounts: Record<
    string,
    { name: string; image: string; count: number; totalValue: number }
  > = {};

  liveCarts.forEach((cart) => {
    try {
      const items = JSON.parse(cart.items);
      items.forEach((item: { id?: string; name: string; image?: string; quantity?: number; price?: number }) => {
        const key = String(item.id || item.name);
        if (!productCounts[key]) {
          productCounts[key] = {
            name: item.name,
            image: item.image || '',
            count: 0,
            totalValue: 0,
          };
        }
        productCounts[key].count += item.quantity || 1;
        productCounts[key].totalValue += (item.price || 0) * (item.quantity || 1);
      });
    } catch {
      // ignore invalid JSON
    }
  });

  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const formatTimeAgo = (date: Date) => {
    const diffInMinutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    const hours = Math.floor(diffInMinutes / 60);
    return `Il y a ${hours}h`;
  };

  return (
    <div className="space-y-6 nay-enter">
      {/* Executive Electric Blue Hero Radar Banner */}
      <div className="nay-hero-shine rounded-2xl bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] text-white p-6 shadow-lg shadow-sky-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>Radar en Direct • Paniers Actifs (24h)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Intentions d&apos;Achat &amp; Sélections en Temps Réel
            </h2>
            <p className="text-xs text-sky-100 max-w-2xl">
              Suivez les paniers en cours sur la boutique NAY Parfum et identifiez les flacons les plus convoités des dernières 24 heures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/admin/marketing/abandoned-carts"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/25 transition-colors"
            >
              <span>Paniers Abandonnés</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#0284c7] hover:bg-sky-50 text-xs font-bold shadow-xs transition-colors"
            >
              <ShoppingCart size={13} />
              <span>Commandes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 nay-stagger">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PANIERS ACTIFS (24H)
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-[#0ea5e9]">
              <ShoppingCart size={14} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2.5 tabular-nums">
            {activeCartsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sessions avec articles non validés</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CA POTENTIEL ESTIMÉ
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2.5 tabular-nums">
            {formatMAD(potentialRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Valeur cumulée en cours</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PANIER MOYEN EN COURS
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Flame size={14} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2.5 tabular-nums">
            {activeCartsCount > 0 ? Math.round(potentialRevenue / activeCartsCount) : 0} MAD
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Intention moyenne par visiteur</p>
        </div>
      </div>

      {/* Main Split: Live Feed & Top Added Perfumes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Zap size={14} className="text-[#0ea5e9]" /> Flux des Sélections en Direct
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {liveCarts.length} session(s)
            </span>
          </div>

          {liveCarts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-2xs">
              <ShoppingCart className="mx-auto text-slate-300 mb-2" size={30} />
              <p className="font-bold text-slate-800 text-sm">
                Aucun panier actif dans les 24 dernières heures.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Les nouveaux ajouts au panier s&apos;afficheront ici en temps réel.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveCarts.map((cart) => {
                let items: Array<{ name: string; image?: string; quantity?: number; price?: number }> = [];
                try {
                  items = JSON.parse(cart.items);
                } catch {
                  items = [];
                }

                const digits = (cart.customerPhone || '').replace(/[^0-9]/g, '');
                const waDigits = digits.startsWith('0')
                  ? `212${digits.slice(1)}`
                  : digits.startsWith('212')
                  ? digits
                  : digits.length === 9
                  ? `212${digits}`
                  : '';
                const waUrl =
                  waDigits.length >= 11
                    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
                        `Salam ${cart.customerName || ''} 👋, votre sélection NAY Parfum (${formatMAD(
                          cart.totalValue
                        )}) vous attend sur la boutique ✨`
                      )}`
                    : null;

                return (
                  <div
                    key={cart.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center text-xs font-bold">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {cart.customerName ||
                                (cart.customerId ? 'Client Enregistré' : 'Visiteur Boutique')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              #{cart.sessionId.slice(0, 8)}
                            </span>
                          </div>
                          {(cart.customerPhone || cart.customerCity) && (
                            <div className="text-[11px] text-slate-500">
                              {cart.customerPhone} {cart.customerCity ? `• ${cart.customerCity}` : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Clock size={12} className="text-slate-400" />
                          <span>{formatTimeAgo(cart.lastActivity)}</span>
                        </div>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] text-white text-[11px] font-bold"
                          >
                            <MessageSquare size={11} /> WA
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center p-1">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package size={15} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                              <span>
                                Qté: <strong className="text-slate-800">{item.quantity || 1}</strong>
                              </span>
                              <span className="font-bold text-[#0284c7]">
                                {formatMAD((item.price || 0) * (item.quantity || 1))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 text-[11px] font-medium">
                        Total de la sélection
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                        {formatMAD(cart.totalValue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Top Products */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 sticky top-20">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-[#0ea5e9]" />
              Parfums les plus ajoutés (24h)
            </h3>

            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Aucune donnée disponible pour le moment.
              </p>
            ) : (
              <div className="space-y-2.5">
                {topProducts.map((prod, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                  >
                    <span className="w-5 text-center font-bold text-xs text-[#0284c7]">
                      #{idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center p-1">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package size={15} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {prod.count} ajouts • {formatMAD(prod.totalValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
