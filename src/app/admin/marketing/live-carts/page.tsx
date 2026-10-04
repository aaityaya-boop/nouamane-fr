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
  Radio, 
  ExternalLink,
  Sparkles,
  Zap,
  ShieldCheck,
  Phone,
  Flame,
  MessageCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LiveCartsPage() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const liveCarts = await prisma.liveCartSession.findMany({
    where: {
      lastActivity: { gte: twentyFourHoursAgo },
      items: { not: '[]' }
    },
    orderBy: { lastActivity: 'desc' },
  });

  const activeCartsCount = liveCarts.length;
  const potentialRevenue = liveCarts.reduce((acc, cart) => acc + cart.totalValue, 0);

  // Top added products in last 24h
  const productCounts: Record<string, { name: string, image: string, count: number, totalValue: number }> = {};
  
  liveCarts.forEach(cart => {
    try {
      const items = JSON.parse(cart.items);
      items.forEach((item: any) => {
        if (!productCounts[item.id]) {
          productCounts[item.id] = { name: item.name, image: item.image, count: 0, totalValue: 0 };
        }
        productCounts[item.id].count += (item.quantity || 1);
        productCounts[item.id].totalValue += (item.price || 0) * (item.quantity || 1);
      });
    } catch (e) {
      // ignore
    }
  });

  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const formatTimeAgo = (date: Date) => {
    const diffInMinutes = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    const hours = Math.floor(diffInMinutes / 60);
    return `Il y a ${hours}h`;
  };

  return (
    <div className="p-4 md:p-8 max-w-[1700px] mx-auto text-slate-900 space-y-8 animate-fadeIn">
      {/* 🌟 HERO RADAR BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-sky-200 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Radar en Direct • Paniers Actifs (24h)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Intentions d&apos;Achat & Paniers en Temps Réel
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
              Suivez les clients en cours de sélection sur la boutique en ligne. Analysez les combinaisons de parfums et transformez les intentions en commandes confirmées.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/marketing/abandoned-carts"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all shadow-sm"
            >
              <span>Paniers Abandonnés</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D9BF0] hover:bg-[#0284c7] text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all"
            >
              <ShoppingCart size={14} />
              <span>Gérer les Commandes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 📊 BENTO KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paniers Actifs (24h)</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#1D9BF0] border border-sky-100 flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{activeCartsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Sessions avec articles non validés</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">CA Potentiel Estimé</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">{formatMAD(potentialRevenue)}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Valeur cumulée des sélections en cours</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-amber-300 transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Taux d&apos;Intention</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Flame size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
            {activeCartsCount > 0 ? (potentialRevenue / activeCartsCount).toFixed(0) : '0'} MAD
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Panier moyen des sélections actives</div>
        </div>
      </div>

      {/* 🧭 MAIN SPLIT: LIVE FEED & TOP ADDED PERFUMES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Activity Feed (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Zap size={14} className="text-[#1D9BF0]" /> Flux des Sélections en Direct
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{liveCarts.length} session(s) active(s)</span>
          </div>

          {liveCarts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-2xs">
              <ShoppingCart className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="font-bold text-slate-800 text-sm">Aucun panier actif dans les 24 dernières heures.</p>
              <p className="text-xs text-slate-400 mt-1">Les nouveaux ajouts au panier s&apos;afficheront ici en temps réel.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveCarts.map((cart) => {
                let items: any[] = [];
                try { items = JSON.parse(cart.items); } catch(e){}

                return (
                  <div key={cart.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3 group">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-100 to-indigo-100 text-[#1D9BF0] flex items-center justify-center text-xs font-bold border border-sky-200/60">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {cart.customerId ? 'Client Enregistré' : 'Visiteur Boutique'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              #{cart.sessionId.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Clock size={12} className="text-slate-400" />
                        <span>{formatTimeAgo(cart.lastActivity)}</span>
                      </div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-10 h-10 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center p-1">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            ) : (
                              <Package size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                              <span>Qté: <strong className="text-slate-800">{item.quantity || 1}</strong></span>
                              <span className="font-bold text-[#1D9BF0]">{formatMAD((item.price || 0) * (item.quantity || 1))}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 text-[11px] font-medium">Total de la sélection</span>
                      <span className="text-sm font-extrabold text-slate-900">{formatMAD(cart.totalValue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Top Products (4 Cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 sticky top-20">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              Parfums les plus ajoutés (24h)
            </h3>

            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Aucune donnée disponible pour le moment.</p>
            ) : (
              <div className="space-y-2.5">
                {topProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-5 text-center font-bold text-xs text-slate-400">#{idx + 1}</span>
                    <div className="w-10 h-10 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center p-1">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" />
                      ) : (
                        <Package size={16} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                      <p className="text-[11px] text-slate-500">{prod.count} fois dans les paniers</p>
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
