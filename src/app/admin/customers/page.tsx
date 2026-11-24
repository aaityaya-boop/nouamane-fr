import React from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  TrendingUp,
  Search,
  ShoppingCart,
  Crown,
  Diamond,
  Award,
  Phone,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Download,
  Filter,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  User
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { getUnifiedCustomers, UnifiedCustomer } from '@/lib/unifiedCustomers';

export const dynamic = 'force-dynamic';

export default async function CustomersDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp?.q || '').toLowerCase().trim();
  const page = parseInt(sp?.page || '1', 10);
  const filter = sp?.filter || 'all';
  const take = 25;

  // 1. Fetch ALL Unified Customers (Guest Orders + Registered Accounts)
  const allUnifiedCustomers = await getUnifiedCustomers();

  // 2. Global KPIs
  const totalCustomers = allUnifiedCustomers.length;
  let clientsWithOrdersCount = 0;
  let returningCustomersCount = 0;
  let newCustomersCount = 0;
  let guestOrdersCount = 0;
  let registeredOnlyCount = 0;
  let vipCustomersCount = 0;
  let totalRevenue = 0;
  let totalOrdersCount = 0;
  let totalDeliveredOrdersCount = 0;
  let withPhoneCount = 0;

  allUnifiedCustomers.forEach((c) => {
    if (c.cleanPhone) withPhoneCount++;
    totalRevenue += c.totalSpent;
    totalOrdersCount += c.ordersCount;
    totalDeliveredOrdersCount += c.deliveredOrdersCount;

    if (c.ordersCount > 0) {
      clientsWithOrdersCount++;
      if (c.ordersCount === 1) newCustomersCount++;
      if (c.ordersCount > 1) returningCustomersCount++;
    } else {
      registeredOnlyCount++;
    }

    if (c.source === 'COMMANDE') guestOrdersCount++;
    if (c.isVip) vipCustomersCount++;
  });

  const aov =
    totalDeliveredOrdersCount > 0
      ? Math.round(totalRevenue / totalDeliveredOrdersCount)
      : totalOrdersCount > 0
      ? Math.round(totalRevenue / totalOrdersCount)
      : 0;

  const cltv = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

  // 3. Filtering
  let filtered = allUnifiedCustomers.filter((c) => {
    // Search Query Match
    if (query) {
      const matchName = c.name.toLowerCase().includes(query);
      const matchEmail = c.email.toLowerCase().includes(query);
      const matchPhone = c.cleanPhone.includes(query) || (c.phone && c.phone.includes(query));
      const matchCity = c.city ? c.city.toLowerCase().includes(query) : false;
      const matchOrder = c.recentOrderNumber ? c.recentOrderNumber.toLowerCase().includes(query) : false;
      if (!matchName && !matchEmail && !matchPhone && !matchCity && !matchOrder) return false;
    }

    // Tab Filter Match
    if (filter === 'orders') return c.ordersCount > 0;
    if (filter === 'returning') return c.ordersCount > 1;
    if (filter === 'new') return c.ordersCount === 1;
    if (filter === 'guest') return c.source === 'COMMANDE';
    if (filter === 'vip') return c.isVip;
    if (filter === 'no_orders') return c.ordersCount === 0;

    return true;
  });

  // Pagination
  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / take) || 1;
  const skip = (page - 1) * take;
  const paginatedCustomers = filtered.slice(skip, skip + take);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 font-sans text-slate-900 dark:text-slate-100">
      {/* ── 1. REFINED EXECUTIVE HEADER ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-x-2 gap-y-0.5 mb-1.5 flex-wrap text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-500 dark:text-slate-400">
            <span>NAY PARFUMS · FICHIER CENTRAL CRM</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {clientsWithOrdersCount} acheteurs identifiés
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tous les Clients &amp; Contacts ({totalCustomers})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Regroupe automatiquement tous vos clients ayant commandé par téléphone/email (invités) et les comptes inscrits.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/admin/marketing/contacts"
            className="h-10 sm:h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Phone size={13.5} className="text-[#0ea5e9] shrink-0" />
            <span>Téléphones ({withPhoneCount})</span>
          </Link>

          <Link
            href="/admin/customers/vip"
            className="h-10 sm:h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] border border-slate-800 dark:border-white/10 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Crown size={13.5} className="text-amber-400 shrink-0" />
            <span>Top VIP ({vipCustomersCount})</span>
          </Link>
        </div>
      </div>

      {/* ── 2. GLOBAL KPIS RIBBON (TABLEAU DE BORD STANDARD) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* KPI 1: Base Clients Totale - Maison Obsidian Lead Card */}
        <div className="nay-hero-shine nay-card-lift rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[188px] group relative overflow-hidden bg-[#0b1322] dark:bg-[#0f172a] text-white border border-slate-800/90 dark:border-sky-500/20">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.12] text-sky-300 flex items-center justify-center shrink-0">
                  <Users size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300 leading-tight">
                    BASE CLIENTS TOTALE
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                    Contacts &amp; Acheteurs CRM
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.08] text-slate-200 border border-white/[0.1] shrink-0">
                {clientsWithOrdersCount} acheteurs
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-1.5 mt-4 mb-1">
              <div className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-white tabular-nums whitespace-nowrap">
                {totalCustomers}
                <span className="text-sm font-medium text-slate-400 ml-1.5 font-sans">profils</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 mt-3 relative z-10">
            <span>Commandes directes : <strong className="text-slate-200 font-semibold">{guestOrdersCount}</strong></span>
            <span className="font-semibold text-emerald-300">Actifs</span>
          </div>
        </div>

        {/* KPI 2: Clients Fidélisés */}
        <div className="spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[#0ea5e9] shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    CLIENTS FIDÉLISÉS
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Plus d'une commande passée
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 shrink-0">
                {clientsWithOrdersCount > 0 ? `${((returningCustomersCount / clientsWithOrdersCount) * 100).toFixed(0)}% réachat` : '0%'}
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight text-slate-900 dark:text-white tabular-nums whitespace-nowrap mt-3 mb-1">
              {returningCustomersCount}
              <span className="text-sm font-semibold text-slate-400 ml-1.5 font-sans">fidèles</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>Nouveaux clients : <strong className="text-slate-900 dark:text-white font-bold">{newCustomersCount}</strong></span>
          </div>
        </div>

        {/* KPI 3: Chiffre d'Affaires Clients */}
        <div className="spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <TrendingUp size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    CHIFFRE D'AFFAIRES CUMULÉ
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Valeur générée par les clients
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                Cumulé
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight text-slate-900 dark:text-white tabular-nums whitespace-nowrap mt-3 mb-1">
              {formatMAD(totalRevenue)}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>Total commandes : <strong className="text-slate-900 dark:text-white font-bold font-mono">{totalOrdersCount} colis</strong></span>
          </div>
        </div>

        {/* KPI 4: Panier Moyen & LTV */}
        <div className="spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingCart size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    VALEUR MOYENNE (LTV / AOV)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Revenu moyen par client
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                LTV Moy
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight text-slate-900 dark:text-white tabular-nums whitespace-nowrap mt-3 mb-1">
              {formatMAD(cltv)}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>Panier Moyen (AOV) : <strong className="text-slate-900 dark:text-white font-bold font-mono">{formatMAD(aov)}</strong></span>
          </div>
        </div>
      </div>

      {/* ── 3. TOOLBAR: SEARCH + SEGMENTATION TABS ─────────────────── */}
      <div className="spatial-card rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-white/10 space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: 'all', label: 'Tous les Clients', count: totalCustomers },
            { id: 'orders', label: 'Ayant Commandé', count: clientsWithOrdersCount },
            { id: 'returning', label: 'Fidèles (>1 achat)', count: returningCustomersCount },
            { id: 'new', label: 'Nouveaux (1 achat)', count: newCustomersCount },
            { id: 'guest', label: 'Commandes Directes (Sans Compte)', count: guestOrdersCount },
            { id: 'vip', label: 'Top VIP', count: vipCustomersCount },
            { id: 'no_orders', label: 'Inscrits Sans Achat', count: registeredOnlyCount },
          ].map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <Link
                key={tab.id}
                href={`?filter=${tab.id}${query ? `&q=${query}` : ''}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-[#0ea5e9] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Search input form */}
        <form method="GET" className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          <input type="hidden" name="filter" value={filter} />
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
            <input
              type="text"
              name="q"
              placeholder="Rechercher par nom, téléphone, email, ville, n° commande..."
              defaultValue={query}
              className="w-full bg-slate-50 dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#0ea5e9] dark:focus:border-[#0ea5e9] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 dark:text-slate-400">
            <span>
              Affichage de <b>{filtered.length}</b> client{filtered.length > 1 ? 's' : ''}
            </span>
          </div>
        </form>
      </div>

      {/* ── 4. MAIN CUSTOMERS TABLE (TABLEAU DE BORD STANDARD) ─────── */}
      <div className="spatial-card rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 dark:bg-[#0c101c]/90 border-b border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-extrabold backdrop-blur-md">
              <tr>
                <th className="py-3 px-3">Client &amp; Origine</th>
                <th className="py-3 px-2.5">Coordonnées</th>
                <th className="py-3 px-2.5">Ville</th>
                <th className="py-3 px-2 text-center">Cmd</th>
                <th className="py-3 px-2.5 text-right whitespace-nowrap">Total (LTV)</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Dernier Achat</th>
                <th className="py-3 px-2 text-center whitespace-nowrap">Statut</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Users size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Aucun client trouvé</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Essayez de modifier votre recherche ou sélectionnez le filtre "Tous".
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => {
                  const hasPhone = Boolean(customer.cleanPhone);
                  const formattedPhone = customer.cleanPhone.startsWith('0')
                    ? `212${customer.cleanPhone.slice(1)}`
                    : customer.cleanPhone.startsWith('212')
                    ? customer.cleanPhone
                    : `212${customer.cleanPhone}`;

                  const whatsappMsg = `Salam ${customer.name} 👋, c'est l'équipe NAY Parfum ! Nous restons à votre disposition pour vos commandes de testeurs d'exception ✨`;
                  const whatsappUrl = hasPhone && formattedPhone.length >= 9
                    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMsg)}`
                    : null;

                  // Source badge
                  const isGuestOrder = customer.source === 'COMMANDE';
                  const isRegistered = customer.source === 'COMPTE';
                  const isBoth = customer.source === 'COMMANDE_ET_COMPTE';

                  // Tier badge
                  const isDiamond = customer.tier === 'DIAMOND';
                  const isGold = customer.tier === 'GOLD';
                  const isSilver = customer.tier === 'SILVER';

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors">
                      {/* Client Name & Source */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0ea5e9]/20 to-[#0284c7]/30 border border-[#0ea5e9]/30 text-[#0ea5e9] dark:text-[#38bdf8] flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs admin-monogram-ring">
                            {customer.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 max-w-[165px]">
                            <Link
                              href={`/admin/customers/${encodeURIComponent(customer.id)}`}
                              className="font-bold text-slate-900 dark:text-white hover:underline hover:text-[#0ea5e9] block truncate"
                            >
                              {customer.name}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border whitespace-nowrap ${
                                  isBoth
                                    ? 'bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-800 dark:text-slate-200 border-slate-300/80 dark:border-white/15'
                                    : isGuestOrder
                                    ? 'bg-sky-500/[0.08] text-[#0284c7] dark:text-[#38bdf8] border-sky-500/20'
                                    : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/10'
                                }`}
                              >
                                {isBoth ? (
                                  <span className="inline-flex items-center gap-1"><Crown size={10} className="text-amber-500" /> Compte + Acheteur</span>
                                ) : isGuestOrder ? (
                                  <span className="inline-flex items-center gap-1"><ShoppingCart size={10} className="text-[#0ea5e9]" /> Commande Directe</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1"><User size={10} className="text-slate-400" /> Compte Créé</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & WhatsApp */}
                      <td className="py-3.5 px-2.5">
                        <div className="space-y-1">
                          {customer.phone ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                                {customer.phone}
                              </span>
                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                  title="Discuter directement sur WhatsApp"
                                >
                                  <MessageSquare size={12} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Sans numéro</span>
                          )}

                          {customer.email && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[165px] font-medium">
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* City & Address */}
                      <td className="py-3.5 px-2.5">
                        {customer.city ? (
                          <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span>{customer.city}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">—</span>
                        )}
                        {customer.address && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[115px] block mt-0.5">
                            {customer.address}
                          </span>
                        )}
                      </td>

                      {/* Orders count */}
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-slate-900 dark:text-white text-xs font-mono">
                            {customer.ordersCount}
                          </span>
                          {customer.deliveredOrdersCount > 0 && (
                            <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 mt-0.5">
                              {customer.deliveredOrdersCount} livré{customer.deliveredOrdersCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-2.5 text-right whitespace-nowrap">
                        <span className="font-black text-slate-900 dark:text-white text-xs font-mono">
                          {formatMAD(customer.totalSpent)}
                        </span>
                      </td>

                      {/* Last Order Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {customer.lastOrderDate ? (
                          <div>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold block">
                              {new Date(customer.lastOrderDate).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {customer.recentOrderNumber && (
                              <Link
                                href={`/admin/orders?search=${customer.recentOrderNumber}`}
                                className="text-[10px] font-mono text-slate-500 dark:text-slate-400 hover:underline hover:text-[#0ea5e9]"
                              >
                                {customer.recentOrderNumber}
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Jamais commandé</span>
                        )}
                      </td>

                      {/* Status / VIP Tier */}
                      <td className="py-3.5 px-2.5 text-center whitespace-nowrap">
                        {isDiamond ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 dark:bg-white/[0.12] text-white border border-slate-800 dark:border-white/15 shadow-2xs">
                            <Diamond size={10} className="text-amber-400" />
                            VIP Diamant
                          </span>
                        ) : isGold ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25">
                            <Crown size={10} className="text-amber-600 dark:text-amber-400" />
                            VIP Or
                          </span>
                        ) : isSilver ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/15">
                            <Award size={10} className="text-slate-600 dark:text-slate-300" />
                            VIP Argent
                          </span>
                        ) : customer.ordersCount > 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25">
                            Fidèle
                          </span>
                        ) : customer.ordersCount === 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/25">
                            Nouveau
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                            Sans Achat
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-7 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                              title="WhatsApp 1-Click"
                            >
                              <MessageSquare size={11} />
                              <span className="hidden xl:inline">WA</span>
                            </a>
                          )}

                          <Link
                            href={`/admin/customers/${encodeURIComponent(customer.id)}`}
                            className="h-7 px-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white/[0.1] dark:hover:bg-white/[0.18] border border-slate-800 dark:border-white/15 text-white rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 shadow-2xs"
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Page <b>{page}</b> sur <b>{totalPages}</b> (Total : {totalFiltered} clients)
            </span>
            <div className="flex items-center gap-1.5">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}${filter ? `&filter=${filter}` : ''}${query ? `&q=${query}` : ''}`}
                  className="px-3 py-1 border border-neutral-200 rounded-lg hover:bg-white text-neutral-800 font-medium transition-colors"
                >
                  ← Précédent
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}${filter ? `&filter=${filter}` : ''}${query ? `&q=${query}` : ''}`}
                  className="px-3 py-1 border border-neutral-200 rounded-lg hover:bg-white text-neutral-800 font-medium transition-colors"
                >
                  Suivant →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
