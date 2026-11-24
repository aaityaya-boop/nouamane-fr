'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Phone, 
  Mail, 
  Search, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  MessageSquare, 
  Sparkles, 
  Crown, 
  ShoppingBag, 
  MapPin, 
  PhoneCall, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Package,
  Clock,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { formatMAD } from '@/lib/products';

export interface CustomerContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cleanPhone: string;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  ordersCount: number;
  deliveredOrdersCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
  isVip: boolean;
  tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'STANDARD';
  source: 'COMMANDE' | 'COMPTE' | 'COMMANDE_ET_COMPTE';
  recentOrderNumber: string | null;
}

export default function ContactsDirectoryClient({ 
  initialContacts 
}: { 
  initialContacts: CustomerContact[] 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ORDERS' | 'PHONE' | 'VIP' | 'COMMANDES_ONLY'>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter and Search logic
  const filteredContacts = useMemo(() => {
    return initialContacts.filter(c => {
      // Filter tab
      if (activeFilter === 'ORDERS' && c.ordersCount === 0) return false;
      if (activeFilter === 'PHONE' && !c.phone) return false;
      if (activeFilter === 'VIP' && !c.isVip) return false;
      if (activeFilter === 'COMMANDES_ONLY' && c.ordersCount === 0) return false;

      // Search term
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(term);
      const matchEmail = c.email?.toLowerCase().includes(term);
      const matchPhone = c.phone?.toLowerCase().includes(term);
      const matchCity = c.city?.toLowerCase().includes(term);
      const matchAddress = c.address?.toLowerCase().includes(term);
      const matchOrder = c.recentOrderNumber?.toLowerCase().includes(term);
      return matchName || matchEmail || matchPhone || matchCity || matchAddress || matchOrder;
    });
  }, [initialContacts, searchTerm, activeFilter]);

  // Statistics
  const totalContacts = initialContacts.length;
  const withPhoneCount = initialContacts.filter(c => !!c.phone).length;
  const withOrdersCount = initialContacts.filter(c => c.ordersCount > 0).length;
  const totalSpentAll = initialContacts.reduce((sum, c) => sum + c.totalSpent, 0);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Copy all phones
  const copyAllPhones = () => {
    const phones = initialContacts
      .map(c => c.phone)
      .filter((p): p is string => !!p && p.trim().length > 0)
      .map(p => {
        const clean = p.replace(/[^0-9]/g, '');
        return clean.startsWith('0') ? `+212${clean.slice(1)}` : clean.startsWith('212') ? `+${clean}` : `+212${clean}`;
      });

    const text = Array.from(new Set(phones)).join('\n');
    handleCopy(text, 'all_phones');
  };

  // Copy all emails
  const copyAllEmails = () => {
    const emails = initialContacts
      .map(c => c.email)
      .filter(e => !!e && e.includes('@'));

    const text = Array.from(new Set(emails)).join(', ');
    handleCopy(text, 'all_emails');
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Nom & Prenom', 'Telephone', 'Email', 'Ville', 'Adresse Complete', 'Total Commandes', 'Total Depense (MAD)', 'Derniere Commande', 'Source', 'Statut VIP'];
    const rows = filteredContacts.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.city || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.ordersCount,
      c.totalSpent,
      c.lastOrderDate ? `"${new Date(c.lastOrderDate).toLocaleDateString('fr-FR')}"` : '""',
      c.source === 'COMMANDE' ? 'Commande Directe' : c.source === 'COMPTE' ? 'Compte Enregistre' : 'Commande + Compte',
      c.isVip ? `VIP ${c.tier}` : 'Standard'
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `repertoire_clients_et_commandes_nay_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nay-stagger">
        <div className="nay-hero-shine rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white shadow-md shadow-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-100">TOTAL CONTACTS CRM</span>
            <Users size={15} className="text-white/90" />
          </div>
          <div className="mt-2.5 text-2xl font-extrabold tabular-nums">{totalContacts}</div>
          <p className="text-[11px] text-sky-100 mt-1">Commandes &amp; Comptes unifiés</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TÉLÉPHONES WHATSAPP</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Phone size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">{withPhoneCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Numéros actifs +212</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CLIENTS ACHETEURS</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-[#0ea5e9]">
              <ShoppingBag size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">{withOrdersCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Ayant passé commande</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">VALEUR CUMULÉE</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-[#0284c7]">
              <Sparkles size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">{formatMAD(totalSpentAll)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Total dépenses clients</p>
        </div>
      </div>

      {/* Top Search & Bulk Actions Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Instant Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, téléphone (ex: 06...), email, ville..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium focus:border-neutral-900 focus:outline-none bg-neutral-50 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyAllPhones}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium border border-neutral-200 transition-colors shadow-2xs cursor-pointer"
              title="Copier tous les numéros WhatsApp"
            >
              {copiedKey === 'all_phones' ? <Check size={13} className="text-emerald-600" /> : <Phone size={13} className="text-neutral-500" />}
              <span>{copiedKey === 'all_phones' ? 'Copiés !' : `Copier ${withPhoneCount} Numéros`}</span>
            </button>

            <button
              onClick={copyAllEmails}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium border border-neutral-200 transition-colors shadow-2xs cursor-pointer"
              title="Copier tous les emails"
            >
              {copiedKey === 'all_emails' ? <Check size={13} className="text-emerald-600" /> : <Mail size={13} className="text-neutral-500" />}
              <span>{copiedKey === 'all_emails' ? 'Copiés !' : 'Copier Emails'}</span>
            </button>

            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Télécharger l'export CSV"
            >
              <Download size={13} />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-[#0ea5e9] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tous ({totalContacts})
            </button>
            <button
              onClick={() => setActiveFilter('COMMANDES_ONLY')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === 'COMMANDES_ONLY'
                  ? 'bg-[#0ea5e9] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Provenant des Commandes ({withOrdersCount})
            </button>
            <button
              onClick={() => setActiveFilter('PHONE')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === 'PHONE'
                  ? 'bg-[#0ea5e9] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Avec Téléphone ({withPhoneCount})
            </button>
            <button
              onClick={() => setActiveFilter('VIP')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === 'VIP'
                  ? 'bg-[#0ea5e9] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Membres VIP
            </button>
          </div>

          <span className="text-[11px] text-neutral-400 font-medium">
            {filteredContacts.length} contact(s)
          </span>
        </div>
      </div>

      {/* Full Contacts Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-5">Nom & Client</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Ville & Adresse</th>
                <th className="py-3 px-4">Commandes & MAD</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-400">
                    <AlertCircle className="mx-auto text-neutral-300 mb-1.5" size={24} />
                    <p className="font-semibold text-neutral-800">Aucun contact ne correspond à votre recherche.</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Vérifiez les filtres ou le terme recherché.</p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => {
                  const rawPhone = contact.phone || '';
                  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                  const formattedWhatsapp = cleanPhone.startsWith('0')
                    ? `212${cleanPhone.slice(1)}`
                    : cleanPhone.startsWith('212')
                      ? cleanPhone
                      : cleanPhone ? `212${cleanPhone}` : '';

                  const whatsappMessage = `Salam ${contact.name} ✨, c'est l'équipe NAY Parfum ! Nous vous remercions pour votre confiance. N'hésitez pas si vous avez la moindre question.`;
                  const whatsappLink = formattedWhatsapp.length >= 9
                    ? `https://wa.me/${formattedWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`
                    : null;

                  return (
                    <tr key={contact.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4 sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-medium flex items-center justify-center text-[10px] shrink-0">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-neutral-900">
                                {contact.name}
                              </span>
                              {contact.isVip && (
                                <span className="text-amber-500" title={`VIP ${contact.tier}`}>
                                  <Crown size={12} />
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                {contact.source === 'COMMANDE' ? 'Commande' : contact.source === 'COMMANDE_ET_COMPTE' ? 'Client + Cmd' : 'Compte'}
                              </span>
                              {contact.recentOrderNumber && (
                                <span className="font-mono text-[10px] text-neutral-400">
                                  #{contact.recentOrderNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="py-3 px-4">
                        {contact.phone ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${contact.phone}`}
                              className="font-mono text-xs font-medium text-neutral-900 hover:underline bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200 inline-flex items-center gap-1"
                            >
                              <Phone size={11} className="text-neutral-400" />
                              <span>{contact.phone}</span>
                            </a>
                            <button
                              onClick={() => handleCopy(contact.phone!, `phone_${contact.id}`)}
                              title="Copier le numéro"
                              className="text-neutral-400 hover:text-neutral-700 transition-colors p-1 cursor-pointer"
                            >
                              {copiedKey === `phone_${contact.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400 italic">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        {contact.email ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-xs text-neutral-700 hover:text-neutral-900 font-normal transition-colors truncate max-w-[170px]"
                            >
                              {contact.email}
                            </a>
                            <button
                              onClick={() => handleCopy(contact.email, `email_${contact.id}`)}
                              title="Copier l'email"
                              className="text-neutral-400 hover:text-neutral-700 transition-colors p-1 shrink-0 cursor-pointer"
                            >
                              {copiedKey === `email_${contact.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400 italic">—</span>
                        )}
                      </td>

                      {/* City & Address */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-neutral-900 flex items-center gap-1">
                          <MapPin size={11} className="text-neutral-400 shrink-0" />
                          <span>{contact.city || 'Maroc'}</span>
                        </div>
                        {contact.address && (
                          <p className="text-[11px] text-neutral-400 truncate max-w-[190px] mt-0.5">
                            {contact.address} {contact.postalCode ? `(${contact.postalCode})` : ''}
                          </p>
                        )}
                      </td>

                      {/* Orders & Total Spent */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-neutral-900">
                          {formatMAD(contact.totalSpent)}
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <ShoppingBag size={10} />
                          <span>{contact.ordersCount} cmd</span>
                          {contact.lastOrderDate && (
                            <span>• {new Date(contact.lastOrderDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {whatsappLink && (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ouvrir WhatsApp direct"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-xs border border-emerald-200 transition-colors"
                            >
                              <MessageSquare size={12} />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <Link
                            href={`/admin/customers/${contact.id}`}
                            title="Voir profil client"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 font-medium text-xs transition-colors shadow-2xs"
                          >
                            <span>Fiche</span>
                            <ExternalLink size={11} />
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
