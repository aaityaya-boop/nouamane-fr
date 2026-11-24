'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  MessageCircle, 
  Phone, 
  ChevronRight, 
  ShoppingBag,
  ExternalLink,
  MapPin
} from 'lucide-react';

export interface ActivityOrder {
  id: string;
  orderNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingCity?: string | null;
  total: number | string;
  status: string;
  createdAt: string | Date;
  itemsSummary?: string;
}

export default function RecentActivitiesTable({
  orders,
  canViewRevenue = true,
}: {
  orders: ActivityOrder[];
  canViewRevenue?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.shippingCity || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    return order.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Complétée
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            En livraison
          </span>
        );
      case 'processing':
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#0ea5e9]/10 text-[#0ea5e9] dark:text-[#38bdf8] border border-[#0ea5e9]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
            Confirmée
          </span>
        );
      case 'unconfirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            À confirmer
          </span>
        );
      case 'refused':
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Retour / Refus
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            En attente
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#14151f] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.4)] transition-all">
      {/* Header with Search and Filter - Matching Reference Image */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Activités Récentes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dernières transactions, validations et expéditions enregistrées
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-[#10111a] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#0ea5e9] w-36 sm:w-48 transition-all"
            />
          </div>

          {/* Filter Dropdown / Button */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#10111a] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0ea5e9] cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="delivered">Complétées</option>
            <option value="shipped">En livraison</option>
            <option value="processing">Confirmées</option>
            <option value="unconfirmed">À confirmer</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* Table - Recreating Exact Columns from Screenshot */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 dark:bg-[#11121c] text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-white/[0.06]">
            <tr>
              <th className="px-5 py-3.5">Activité</th>
              <th className="px-5 py-3.5">ID Commande</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Heure</th>
              <th className="px-5 py-3.5">Prix</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filteredOrders.slice(0, 7).map((order) => {
              const dateObj = new Date(order.createdAt);
              const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
              const timeFormatted = dateObj.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });

              const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
              const waPhone = cleanPhone.startsWith('0') ? `212${cleanPhone.slice(1)}` : cleanPhone;
              const waMessage = encodeURIComponent(`Bonjour ${order.customerName || ''}, nous vous contactons concernant votre commande Maison NAY Parfums #${order.orderNumber || ''}.`);

              return (
                <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors group">
                  {/* Activity (Icon + Name + City) */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1f202e] text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center border border-slate-200 dark:border-white/10 shrink-0 shadow-2xs">
                        {(order.customerName || 'NA').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {order.customerName || 'Client NAY'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                          <MapPin size={10} className="text-[#0ea5e9]" />
                          <span>{order.shippingCity || 'Casablanca'}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Order ID */}
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    #{order.orderNumber || order.id.slice(0, 8)}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                    {dateFormatted}
                  </td>

                  {/* Time */}
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {timeFormatted}
                  </td>

                  {/* Price */}
                  <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white tabular-nums">
                    {canViewRevenue ? `${Number(order.total).toLocaleString('fr-FR')} MAD` : '••• MAD'}
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-3.5">
                    {getStatusBadge(order.status)}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {order.customerPhone && (
                        <a
                          href={`https://wa.me/${waPhone}?text=${waMessage}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        >
                          <MessageCircle size={14} />
                        </a>
                      )}
                      <Link
                        href={`/admin/orders?highlight=${order.id}`}
                        title="Détails"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                  Aucune activité correspondant aux critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
