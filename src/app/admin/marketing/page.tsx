import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { 
  Users, 
  Repeat, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  ShoppingCart, 
  Crown, 
  MessageSquare, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  Clock, 
  Flame, 
  PhoneCall,
  Send,
  ShieldCheck,
  Package,
  Layers,
  Radio,
  BookUser
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { getUnifiedCustomers } from '@/lib/unifiedCustomers';
import { getUnifiedAbandonedCarts, getAbandonedCartsStats } from '@/lib/abandonedCartsService';

export const dynamic = 'force-dynamic';

export default async function MarketingDashboardPage() {
  const [allCustomers, abandonedStats, allUnifiedCarts, campaigns, liveSessions] = await Promise.all([
    getUnifiedCustomers(),
    getAbandonedCartsStats(),
    getUnifiedAbandonedCarts(10),
    prisma.marketingCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4
    }),
    prisma.liveCartSession.findMany({
      where: {
        lastActivity: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        items: { not: '[]' }
      }
    })
  ]);

  const recentAbandonedCarts = allUnifiedCarts.slice(0, 6);

  let totalRevenue = 0;
  let repeatRevenue = 0;
  let newCustomers = 0;
  let returningCustomers = 0;
  let vipCustomers = 0;
  let atRiskCustomers = 0;
  let inactiveCustomers = 0;
  let totalDeliveredOrders = 0;
  let withPhoneCount = 0;

  const now = new Date().getTime();

  allCustomers.forEach(c => {
    if (c.phone) withPhoneCount++;
    totalRevenue += c.totalSpent;
    const count = c.ordersCount;
    totalDeliveredOrders += c.deliveredOrdersCount;

    if (count === 1) newCustomers++;
    if (count > 1) {
      returningCustomers++;
      repeatRevenue += c.totalSpent;
    }

    // VIP criteria
    if (c.isVip) {
      vipCustomers++;
    }

    const lastOrder = c.lastOrderDate;
    const daysSince = lastOrder ? Math.floor((now - new Date(lastOrder).getTime()) / (1000 * 3600 * 24)) : 999;

    if (count > 0 && daysSince > 90 && daysSince <= 180) atRiskCustomers++;
    if (count > 0 && daysSince > 180) inactiveCustomers++;
  });

  const aov = totalDeliveredOrders > 0 ? Math.round(totalRevenue / totalDeliveredOrders) : (newCustomers + returningCustomers > 0 ? Math.round(totalRevenue / (newCustomers + returningCustomers)) : 0);
  const cltv = allCustomers.length > 0 ? Math.round(totalRevenue / allCustomers.length) : 0;
  const repeatRate = allCustomers.length > 0 ? ((returningCustomers / allCustomers.length) * 100).toFixed(1) : '0';

  const abandonedCartsCount = abandonedStats.abandonedCarts;
  const recoverableMAD = abandonedStats.totalValue;
  const liveCartsValue = liveSessions.reduce((acc, s) => acc + s.totalValue, 0);

  return (
    <div className="space-y-6">
      {/* Top Metric Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Customer Base */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Base Clients & Contacts</span>
            <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">{allCustomers.length}</span>
            <Link href="/admin/marketing/contacts" className="text-[11px] font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 hover:bg-neutral-200 transition-colors">
              {withPhoneCount} numéros →
            </Link>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>Nouveaux : <b className="text-neutral-800 font-semibold">{newCustomers}</b></span>
            <span>Fidélisés : <b className="text-neutral-800 font-semibold">{returningCustomers}</b></span>
          </div>
        </div>

        {/* Metric 2: Repeat Purchase Rate */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Taux de Réachat</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
              <Repeat size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">{repeatRate}%</span>
            <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Rétention
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>CA Récurrent :</span>
            <b className="text-neutral-900 font-semibold">{formatMAD(repeatRevenue)}</b>
          </div>
        </div>

        {/* Metric 3: Customer Lifetime Value (LTV) */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Valeur Vie Client (LTV)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">{formatMAD(cltv)}</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>Panier Moyen (AOV) :</span>
            <b className="text-neutral-900 font-semibold">{formatMAD(aov)}</b>
          </div>
        </div>

        {/* Metric 4: Recoverable Revenue */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Paniers à Récupérer</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <ShoppingCart size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">{formatMAD(recoverableMAD)}</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>{abandonedCartsCount} paniers en attente</span>
            <Link href="/admin/marketing/abandoned-carts" className="text-neutral-900 hover:underline font-medium flex items-center gap-1">
              Relancer <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Direct Contact Directory Quick Access Banner */}
      <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
            <PhoneCall size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-neutral-900">Répertoire des Téléphones & Emails</h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                {withPhoneCount} numéros
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Accédez à la liste complète de vos clients avec copie rapide des numéros et export CSV.
            </p>
          </div>
        </div>

        <Link
          href="/admin/marketing/contacts"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white font-medium text-xs transition-colors shadow-xs shrink-0"
        >
          <span>Ouvrir le Répertoire</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Audience Segmentation Grid */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50">
          <div>
            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block">
              Segmentation & Ciblage
            </span>
            <h2 className="text-base font-bold text-neutral-900">Segments Clients & Actions Rapides</h2>
          </div>
          <Link
            href="/admin/marketing/campaigns/new"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-black px-3.5 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Send size={13} /> Créer une Diffusion
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          
          {/* Segment 1: VIP */}
          <div className="p-6 hover:bg-neutral-50/50 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-200/60">
                  <Crown size={20} />
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  Top Valeur
                </span>
              </div>
              <h3 className="font-bold text-neutral-900 text-base">Clients VIP Privilège</h3>
              <p className="text-xs text-neutral-500 mt-1">Clients réguliers &gt;3 commandes ou &gt;2 000 MAD.</p>
              <div className="mt-4">
                <span className="text-3xl font-black text-neutral-900">{vipCustomers}</span>
                <span className="text-xs text-neutral-500 ml-2">clients</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
              <Link
                href="/admin/marketing/vip"
                className="text-xs font-bold text-neutral-900 hover:text-[#0ea5e9] flex items-center gap-1"
              >
                Voir Liste VIP <ArrowRight size={12} />
              </Link>
              <Link
                href="/admin/marketing/campaigns/new?audience=VIP"
                className="text-xs font-bold text-[#0ea5e9] bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-lg border border-sky-200 transition-colors"
              >
                Offre VIP
              </Link>
            </div>
          </div>

          {/* Segment 2: At-Risk */}
          <div className="p-6 hover:bg-neutral-50/50 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                  <Clock size={20} />
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  90-180 jours
                </span>
              </div>
              <h3 className="font-bold text-neutral-900 text-base">Clients À Réactiver</h3>
              <p className="text-xs text-neutral-500 mt-1">Dernière commande passée il y a 3 à 6 mois.</p>
              <div className="mt-4">
                <span className="text-3xl font-black text-neutral-900">{atRiskCustomers}</span>
                <span className="text-xs text-neutral-500 ml-2">clients</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs text-neutral-400">Risque de départ</span>
              <Link
                href="/admin/marketing/campaigns/new?audience=AT_RISK"
                className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 transition-colors"
              >
                Relance Win-Back
              </Link>
            </div>
          </div>

          {/* Segment 3: Inactive */}
          <div className="p-6 hover:bg-neutral-50/50 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-neutral-100 text-neutral-600 border border-neutral-200">
                  <Users size={20} />
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                  &gt;180 jours
                </span>
              </div>
              <h3 className="font-bold text-neutral-900 text-base">Clients Dormants</h3>
              <p className="text-xs text-neutral-500 mt-1">Inactifs depuis plus de 6 mois sans achat récent.</p>
              <div className="mt-4">
                <span className="text-3xl font-black text-neutral-900">{inactiveCustomers}</span>
                <span className="text-xs text-neutral-500 ml-2">clients</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs text-neutral-400">Offre cadeau testeur</span>
              <Link
                href="/admin/marketing/campaigns/new?audience=INACTIVE"
                className="text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 px-3 py-1 rounded-lg border border-neutral-300 transition-colors"
              >
                Cadeau Réveil
              </Link>
            </div>
          </div>

          {/* Segment 4: Hot Live Abandoned Carts */}
          <div className="p-6 hover:bg-neutral-50/50 transition-colors flex flex-col justify-between bg-gradient-to-b from-sky-50/30 to-white">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200/60">
                  <Flame size={20} />
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                  Chaud &lt;24h
                </span>
              </div>
              <h3 className="font-bold text-neutral-900 text-base">Paniers Récents</h3>
              <p className="text-xs text-neutral-500 mt-1">Paniers chauds enregistrés sur la boutique.</p>
              <div className="mt-4">
                <span className="text-3xl font-black text-red-600">{recentAbandonedCarts.length}</span>
                <span className="text-xs text-neutral-500 ml-2">en file</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
              <Link
                href="/admin/marketing/abandoned-carts"
                className="text-xs font-bold text-neutral-900 hover:text-red-600 flex items-center gap-1"
              >
                File de Relance <ArrowRight size={12} />
              </Link>
              <Link
                href="/admin/marketing/live-carts"
                className="text-xs font-bold text-[#0ea5e9] bg-sky-50 hover:bg-sky-100 px-3 py-1 rounded-lg border border-sky-200 transition-colors"
              >
                Live Radar
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Main Split: Left = Hot Abandoned Carts Table with WhatsApp 1-Click | Right = Live Automations Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left (2 Cols): Abandoned Carts Quick Action Center */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 text-lg flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#0ea5e9]" />
                  Paniers Abandonnés Récents à Relancer
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Relancez vos clients en 1 clic direct sur WhatsApp avec message pré-rempli.</p>
              </div>
              <Link
                href="/admin/marketing/abandoned-carts"
                className="text-xs font-bold text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Voir Tous ({abandonedCartsCount})
              </Link>
            </div>

            <div className="divide-y divide-neutral-100">
              {recentAbandonedCarts.length === 0 ? (
                <div className="p-12 text-center text-neutral-400">
                  <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={32} />
                  <p className="text-sm font-bold text-neutral-800">Aucun panier abandonné en attente !</p>
                  <p className="text-xs text-neutral-500 mt-1">Tous les paniers sont finalisés ou en cours de commande.</p>
                </div>
              ) : (
                recentAbandonedCarts.map((cart) => {
                  const minutesSince = Math.floor((now - new Date(cart.lastActivity).getTime()) / 60000);
                  const isAbandoned = minutesSince > 60;
                  
                  let items: any[] = [];
                  try {
                    items = JSON.parse(cart.cartItems || '[]');
                  } catch (e) {
                    items = [];
                  }

                  const firstItemName = items[0]?.name || 'vos parfums d\'exception';
                  const customerPhone = cart.customer.phone || '';
                  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
                  const formattedPhone = cleanPhone.startsWith('0') ? `212${cleanPhone.slice(1)}` : cleanPhone.startsWith('212') ? cleanPhone : `212${cleanPhone}`;

                  // Luxury Moroccan French/Darija WhatsApp recovery copy
                  const whatsappMsg = `Salam ${cart.customer.name} 👋, c'est l'équipe NAY Parfum ! Nous avons remarqué que vous n'avez pas finalisé votre commande pour ${firstItemName} (${formatMAD(cart.cartValue)}). Souhaitez-vous de l'aide pour valider votre livraison express partout au Maroc ? Nous pouvons vous réserver votre parfum immédiatement ✨`;
                  const whatsappUrl = formattedPhone.length >= 9 
                    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMsg)}`
                    : null;

                  const isNamedCustomer = cart.customer.name && cart.customer.name !== 'Visiteur Boutique';

                  return (
                    <div key={cart.id} className="p-5 hover:bg-neutral-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] text-[#0ea5e9] font-black flex items-center justify-center text-xs shrink-0 shadow-sm border border-white/10">
                          {isNamedCustomer ? cart.customer.name.charAt(0).toUpperCase() : <ShoppingCart size={15} className="text-[#0ea5e9]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {isNamedCustomer ? (
                              <span className="font-bold text-neutral-900 text-sm">
                                {cart.customer.name}
                              </span>
                            ) : (
                              <span className="font-bold text-neutral-800 text-sm">
                                Visiteur Boutique <span className="text-xs font-mono font-normal text-neutral-400">#{cart.id.slice(-6)}</span>
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isAbandoned 
                                ? 'bg-red-50 text-red-700 border border-red-200' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {isAbandoned ? 'Abandonné' : 'En session'}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-3">
                            <span>{cart.customer.phone || (cart.customer.email || 'Session anonyme')}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} className="text-neutral-400" />
                              {minutesSince > 1440 
                                ? `Il y a ${Math.floor(minutesSince / 1440)}j` 
                                : minutesSince > 60 
                                  ? `Il y a ${Math.floor(minutesSince / 60)}h` 
                                  : `Il y a ${minutesSince} min`}
                            </span>
                          </div>
                          {items.length > 0 && (
                            <div className="text-xs text-neutral-600 mt-2 flex items-center gap-1.5 bg-neutral-100/80 px-2.5 py-1 rounded-lg w-fit">
                              <Package size={12} className="text-neutral-400" />
                              <span className="font-medium truncate max-w-[260px]">
                                {items.map((i: any) => `${i.name} (x${i.quantity || 1})`).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-neutral-100">
                        <div className="text-right mr-2">
                          <span className="text-[11px] text-neutral-400 block">Valeur panier</span>
                          <span className="text-base font-black text-neutral-900">{formatMAD(cart.cartValue)}</span>
                        </div>

                        {whatsappUrl ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            <MessageSquare size={14} />
                            <span>1-Click WhatsApp</span>
                          </a>
                        ) : isNamedCustomer ? (
                          <Link
                            href={`/admin/customers/${cart.customer.id}`}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold"
                          >
                            <span>Voir Fiche</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] font-medium text-neutral-400 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
                            Sans contact
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-100 text-center">
              <Link
                href="/admin/marketing/abandoned-carts"
                className="text-xs font-bold text-neutral-700 hover:text-[#0ea5e9] inline-flex items-center gap-1 transition-colors"
              >
                Ouvrir le centre complet des relances <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Recent Campaigns Table */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 text-lg flex items-center gap-2">
                  <Send size={18} className="text-neutral-800" />
                  Dernières Campagnes & Diffusions
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Historique des messages envoyés ou planifiés.</p>
              </div>
              <Link
                href="/admin/marketing/campaigns"
                className="text-xs font-bold text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Toutes les Campagnes
              </Link>
            </div>

            <div className="divide-y divide-neutral-100">
              {campaigns.length === 0 ? (
                <div className="p-8 text-center text-neutral-400">
                  <p className="text-sm font-medium">Aucune campagne encore créée.</p>
                  <Link
                    href="/admin/marketing/campaigns/new"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white bg-[#0ea5e9] px-3.5 py-2 rounded-lg hover:bg-sky-600 transition-colors shadow-sm"
                  >
                    Créer votre première campagne
                  </Link>
                </div>
              ) : (
                campaigns.map((camp) => (
                  <div key={camp.id} className="p-4 hover:bg-neutral-50/60 transition-colors flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">{camp.name}</h4>
                      <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                        <span className="font-medium text-neutral-700">{camp.channel}</span>
                        <span>•</span>
                        <span>Audience: {camp.audience}</span>
                        <span>•</span>
                        <span>{new Date(camp.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      camp.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      camp.status === 'SCHEDULED' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                      'bg-neutral-100 text-neutral-700 border border-neutral-200'
                    }`}>
                      {camp.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right (1 Col): Automations Engine Cockpit */}
        <div className="space-y-5">
          {/* Automated Sequences Card */}
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-800">
                  <Zap size={15} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">Automatisations</h3>
                  <p className="text-neutral-500 text-[11px]">Séquences programmées NAY</p>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Actif
              </span>
            </div>

            {/* Sequence 1 */}
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-neutral-900 flex items-center gap-1.5">
                  <Clock size={12} className="text-neutral-500" /> Relance Panier H+1
                </span>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Prêt
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Rappel automatique avec détail du panier sélectionné.
              </p>
            </div>

            {/* Sequence 2 */}
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-neutral-900 flex items-center gap-1.5">
                  <Crown size={12} className="text-neutral-500" /> Bienvenue VIP
                </span>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Prêt
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Message envoyé dès la 2ème commande avec avantages.
              </p>
            </div>

            {/* Sequence 3 */}
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-neutral-900 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-neutral-500" /> Conseils d'Application J+3
                </span>
                <span className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                  Auto
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Conseils olfactifs pour optimiser la tenue sur la peau.
              </p>
            </div>

            <Link
              href="/admin/marketing/settings"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium text-xs transition-colors"
            >
              <span>Configurer les Règles</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* WhatsApp Direct Recovery Banner */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                <MessageSquare size={16} />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-neutral-900">Relances WhatsApp</h4>
                <p className="text-[11px] text-neutral-500">Taux d'ouverture élevé au Maroc</p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Messages pré-remplis avec prénom client, total en MAD et lien direct vers le panier.
            </p>
            <div className="pt-1">
              <Link
                href="/admin/marketing/abandoned-carts"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white font-medium text-xs transition-colors shadow-xs"
              >
                <span>Accéder aux Relances</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
