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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-200">
              Fichier Central Clients & CRM
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {clientsWithOrdersCount} acheteurs identifiés
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Users size={22} className="text-neutral-900" />
            <span>Tous les Clients & Contacts ({totalCustomers})</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Regroupe automatiquement tous vos clients ayant commandé par téléphone/email (invités) et les comptes inscrits.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/marketing/contacts"
            className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Phone size={14} className="text-neutral-500" />
            <span>Répertoire Téléphones ({withPhoneCount})</span>
          </Link>

          <Link
            href="/admin/customers/vip"
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Crown size={14} className="text-amber-600" />
            <span>Top VIP ({vipCustomersCount})</span>
          </Link>
        </div>
      </div>

      {/* Global KPIs Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Base Clients Totale */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Base Clients Totale</span>
            <div className="p-2 rounded-lg bg-neutral-100 text-neutral-800">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">{totalCustomers}</span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {clientsWithOrdersCount} acheteurs
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>Commandes directes (invités) :</span>
            <b className="text-neutral-900 font-semibold">{guestOrdersCount}</b>
          </div>
        </div>

        {/* KPI 2: Clients Fidèles / Récurrents */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Clients Fidélisés (&gt;1 commande)</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
              <UserCheck size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-700 tracking-tight">{returningCustomersCount}</span>
            <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {clientsWithOrdersCount > 0
                ? `${((returningCustomersCount / clientsWithOrdersCount) * 100).toFixed(0)}% réachat`
                : '0%'}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>Nouveaux clients :</span>
            <b className="text-neutral-900 font-semibold">{newCustomersCount}</b>
          </div>
        </div>

        {/* KPI 3: Chiffre d'Affaires Cumulé */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Chiffre d'Affaires Clients</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">{formatMAD(totalRevenue)}</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>Total commandes passées :</span>
            <b className="text-neutral-900 font-semibold">{totalOrdersCount} colis</b>
          </div>
        </div>

        {/* KPI 4: Panier Moyen & LTV */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Valeur Moyenne (LTV / AOV)</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <ShoppingCart size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">{formatMAD(cltv)}</span>
            <span className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
              LTV Moy
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>Panier Moyen (AOV) :</span>
            <b className="text-neutral-900 font-semibold">{formatMAD(aov)}</b>
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Segmentation Tabs */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-2xs space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tous les Clients', count: totalCustomers },
            { id: 'orders', label: 'Ayant Commandé', count: clientsWithOrdersCount },
            { id: 'returning', label: 'Fidèles (>1 achat)', count: returningCustomersCount },
            { id: 'new', label: 'Nouveaux (1 achat)', count: newCustomersCount },
            { id: 'guest', label: 'Commandes Directes (Sans Compte)', count: guestOrdersCount },
            { id: 'vip', label: '⭐ Top VIP', count: vipCustomersCount },
            { id: 'no_orders', label: 'Inscrits Sans Achat', count: registeredOnlyCount },
          ].map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <Link
                key={tab.id}
                href={`?filter=${tab.id}${query ? `&q=${query}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs font-semibold'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-600 border border-neutral-200'
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Search input form */}
        <form method="GET" className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-100">
          <input type="hidden" name="filter" value={filter} />
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
            <input
              type="text"
              name="q"
              placeholder="Rechercher par nom, téléphone, email, ville, n° commande..."
              defaultValue={query}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-4 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-neutral-500">
            <span>
              Affichage de <b>{filtered.length}</b> client{filtered.length > 1 ? 's' : ''}
            </span>
          </div>
        </form>
      </div>

      {/* Main Customers Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Client & Origine</th>
                <th className="py-3 px-4">Coordonnées / WhatsApp</th>
                <th className="py-3 px-3">Ville & Livraison</th>
                <th className="py-3 px-3 text-center">Commandes</th>
                <th className="py-3 px-3 text-right">Total Dépensé (LTV)</th>
                <th className="py-3 px-3">Dernier Achat</th>
                <th className="py-3 px-3 text-center">Rang / Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-neutral-400">
                    <Users size={28} className="mx-auto text-neutral-300 mb-2" />
                    <p className="font-semibold text-neutral-800 text-xs">Aucun client trouvé</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
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
                    <tr key={customer.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Client Name & Source */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/customers/${encodeURIComponent(customer.id)}`}
                              className="font-semibold text-neutral-900 hover:underline hover:text-neutral-600 block truncate"
                            >
                              {customer.name}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[9.5px] font-medium px-1.5 py-0.2 rounded border ${
                                  isBoth
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 font-semibold'
                                    : isGuestOrder
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                }`}
                              >
                                {isBoth ? (
                                  <span className="inline-flex items-center gap-1"><Crown size={10} className="text-amber-600" /> Compte + Acheteur</span>
                                ) : isGuestOrder ? (
                                  <span className="inline-flex items-center gap-1"><ShoppingCart size={10} className="text-sky-600" /> Commande Directe</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1"><User size={10} className="text-neutral-500" /> Compte Créé</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & WhatsApp */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {customer.phone ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-neutral-900 text-xs">
                                {customer.phone}
                              </span>
                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                  title="Discuter directement sur WhatsApp"
                                >
                                  <MessageSquare size={12} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic text-[11px]">Sans numéro</span>
                          )}

                          {customer.email && (
                            <div className="text-[11px] text-neutral-500 truncate max-w-xs">
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* City & Address */}
                      <td className="py-3.5 px-3">
                        {customer.city ? (
                          <div className="flex items-center gap-1 text-neutral-800 font-medium">
                            <MapPin size={11} className="text-neutral-400 shrink-0" />
                            <span>{customer.city}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">—</span>
                        )}
                        {customer.address && (
                          <span className="text-[10px] text-neutral-400 truncate max-w-[140px] block mt-0.5">
                            {customer.address}
                          </span>
                        )}
                      </td>

                      {/* Orders count */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-neutral-900 text-xs">
                            {customer.ordersCount}
                          </span>
                          {customer.deliveredOrdersCount > 0 && (
                            <span className="text-[9.5px] font-medium text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 mt-0.5">
                              {customer.deliveredOrdersCount} livré{customer.deliveredOrdersCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-neutral-900 text-xs">
                          {formatMAD(customer.totalSpent)}
                        </span>
                      </td>

                      {/* Last Order Date */}
                      <td className="py-3.5 px-3">
                        {customer.lastOrderDate ? (
                          <div>
                            <span className="text-neutral-800 font-medium block">
                              {new Date(customer.lastOrderDate).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {customer.recentOrderNumber && (
                              <Link
                                href={`/admin/orders?search=${customer.recentOrderNumber}`}
                                className="text-[10px] font-mono text-neutral-400 hover:underline hover:text-neutral-700"
                              >
                                {customer.recentOrderNumber}
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">Jamais commandé</span>
                        )}
                      </td>

                      {/* Status / VIP Tier */}
                      <td className="py-3.5 px-3 text-center">
                        {isDiamond ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-900 text-white border border-neutral-800 shadow-2xs">
                            <Diamond size={10} className="text-amber-400" />
                            VIP Diamant
                          </span>
                        ) : isGold ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            <Crown size={10} className="text-amber-600" />
                            VIP Or
                          </span>
                        ) : isSilver ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                            <Award size={10} className="text-neutral-600" />
                            VIP Argent
                          </span>
                        ) : customer.ordersCount > 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Fidèle
                          </span>
                        ) : customer.ordersCount === 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            Nouveau
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
                            Sans Achat
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                              title="WhatsApp 1-Click"
                            >
                              <MessageSquare size={11} />
                              <span className="hidden lg:inline">WhatsApp</span>
                            </a>
                          )}

                          <Link
                            href={`/admin/customers/${encodeURIComponent(customer.id)}`}
                            className="px-2.5 py-1 bg-neutral-900 hover:bg-black text-white rounded-md text-[11px] font-medium transition-colors inline-flex items-center gap-1 shadow-2xs"
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
