import React from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Diamond, Crown, Award, Phone, MessageSquare, MapPin, ShoppingCart, User } from 'lucide-react';
import { getUnifiedCustomers } from '@/lib/unifiedCustomers';
import { formatMAD } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function VipCustomersPage() {
  const allCustomers = await getUnifiedCustomers();

  // VIP Criteria: Has spent money or placed multiple orders
  const vipCustomers = allCustomers
    .filter((c) => c.isVip || c.totalSpent > 0 || c.ordersCount >= 2)
    .slice(0, 50);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
              Programme Privilège
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
              <Star size={13} className="fill-amber-400 text-amber-500" />
              {vipCustomers.length} Meilleurs Clients
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <span>Clients VIP & Top Acheteurs</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Classement de vos plus gros acheteurs et clients les plus fidèles (commandes directes et comptes).
          </p>
        </div>

        <Link
          href="/admin/customers"
          className="bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors shadow-2xs inline-flex items-center gap-1.5"
        >
          ← Tous les clients
        </Link>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="border-b border-neutral-100 bg-neutral-50/50 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-500 fill-amber-400" />
            <h3 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
              Classement des 50 Meilleurs Acheteurs NAY
            </h3>
          </div>
          <span className="text-xs text-neutral-500 font-medium">Classé par LTV Décroissante</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Rang</th>
                <th className="py-3 px-4">Client & Origine</th>
                <th className="py-3 px-4">Contact / WhatsApp</th>
                <th className="py-3 px-3">Ville</th>
                <th className="py-3 px-3 text-center">Commandes</th>
                <th className="py-3 px-3 text-right">Total Dépensé (LTV)</th>
                <th className="py-3 px-3 text-center">Rang VIP</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {vipCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400 text-xs">
                    Aucun client VIP détecté pour le moment.
                  </td>
                </tr>
              ) : (
                vipCustomers.map((customer, idx) => {
                  const hasPhone = Boolean(customer.cleanPhone);
                  const formattedPhone = customer.cleanPhone.startsWith('0')
                    ? `212${customer.cleanPhone.slice(1)}`
                    : customer.cleanPhone.startsWith('212')
                    ? customer.cleanPhone
                    : `212${customer.cleanPhone}`;

                  const whatsappMsg = `Salam ${customer.name} ✨, en tant que client privilégié NAY Parfum, nous tenions à vous remercier pour votre fidélité ! Avez-vous besoin d'un nouveau flacon ou d'un conseil personnalisé ?`;
                  const whatsappUrl = hasPhone && formattedPhone.length >= 9
                    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMsg)}`
                    : null;

                  return (
                    <tr key={customer.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                              : idx === 1
                              ? 'bg-neutral-200 text-neutral-800'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'text-neutral-500 bg-neutral-100'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-900">{customer.name}</div>
                        <span className="text-[10px] text-neutral-500 font-medium inline-flex items-center gap-1">
                          {customer.source === 'COMMANDE' ? (
                            <><ShoppingCart size={10} className="text-sky-600" /> Commande directe</>
                          ) : (
                            <><User size={10} className="text-neutral-500" /> Compte créé</>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {customer.phone ? (
                            <div className="flex items-center gap-1.5 font-mono font-semibold text-neutral-900">
                              <span>{customer.phone}</span>
                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                  title="WhatsApp Concierge"
                                >
                                  <MessageSquare size={11} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">Sans tel</span>
                          )}
                          {customer.email && (
                            <div className="text-[11px] text-neutral-500">{customer.email}</div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-medium text-neutral-800">
                        {customer.city || '—'}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-neutral-900">{customer.ordersCount}</span>
                        {customer.deliveredOrdersCount > 0 && (
                          <span className="text-[9.5px] font-medium text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 block mt-0.5 w-fit mx-auto">
                            {customer.deliveredOrdersCount} livré{customer.deliveredOrdersCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-neutral-900">
                        {formatMAD(customer.totalSpent)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {customer.tier === 'DIAMOND' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-900 text-white shadow-2xs">
                            <Diamond size={10} className="text-amber-400" />
                            Diamant
                          </span>
                        ) : customer.tier === 'GOLD' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            <Crown size={10} className="text-amber-600" />
                            Or
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                            <Award size={10} className="text-neutral-600" />
                            Argent
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/customers/${encodeURIComponent(customer.id)}`}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-black text-white rounded-md text-[11px] font-medium transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <span>Fiche</span>
                          <ArrowRight size={11} />
                        </Link>
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
