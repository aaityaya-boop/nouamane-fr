'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Send,
  Plus,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  Users,
  FileEdit,
  Layers,
  Trash2,
  Check,
  Search,
} from 'lucide-react';

interface CampaignRow {
  id: string;
  name: string;
  channel: string;
  type: string;
  audience: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export default function CampaignsClient({
  initialCampaigns,
  totalCustomers,
}: {
  initialCampaigns: CampaignRow[];
  totalCustomers: number;
}) {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>(initialCampaigns);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SENT' | 'DRAFT' | 'SCHEDULED'>('ALL');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.audience.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
      );
    });
  }, [campaigns, filterStatus, search]);

  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter((c) => c.status === 'SENT').length;
  const draftCampaigns = campaigns.filter((c) => c.status === 'DRAFT').length;

  const updateStatus = async (id: string, status: 'SENT' | 'DRAFT' | 'SCHEDULED') => {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/marketing/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const deleteCampaign = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Send size={18} className="text-[#0ea5e9]" />
            Campagnes &amp; Diffusions Ciblées
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilotez vos diffusions WhatsApp et Email marketing pour vos lancements, offres VIP et réactivations.
          </p>
        </div>

        <Link
          href="/admin/marketing/campaigns/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white font-semibold text-xs shadow-sm shadow-sky-500/20 transition-all shrink-0"
        >
          <Plus size={14} />
          <span>Nouvelle Campagne</span>
        </Link>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nay-stagger">
        <div className="nay-hero-shine rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white shadow-md shadow-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-100">
              TOTAL CAMPAGNES
            </span>
            <Layers size={15} className="text-white/90" />
          </div>
          <div className="mt-2.5 text-2xl font-extrabold tabular-nums">{totalCampaigns}</div>
          <p className="text-[11px] text-sky-100 mt-1">Diffusions enregistrées</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CAMPAGNES ENVOYÉES
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-emerald-600 tabular-nums">
            {sentCampaigns}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Diffusions finalisées</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              BROUILLONS
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-[#0ea5e9]">
              <FileEdit size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {draftCampaigns}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Prêts pour envoi</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PORTÉE CRM
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {totalCustomers}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Clients qualifiés NAY</p>
        </div>
      </div>

      {/* Filter Toolbar & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'SENT', 'DRAFT', 'SCHEDULED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  filterStatus === st
                    ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === 'ALL'
                  ? `Toutes (${campaigns.length})`
                  : st === 'SENT'
                  ? `Envoyées (${sentCampaigns})`
                  : st === 'DRAFT'
                  ? `Brouillons (${draftCampaigns})`
                  : 'Planifiées'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher campagne..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#0ea5e9]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-5">Campagne</th>
                <th className="py-3 px-4">Canal &amp; Format</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Création</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0ea5e9] flex items-center justify-center mx-auto mb-2">
                      <Mail size={19} />
                    </div>
                    <p className="font-bold text-slate-800">Aucune campagne correspondante.</p>
                    <Link
                      href="/admin/marketing/campaigns/new"
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0ea5e9] text-white text-xs font-semibold hover:bg-[#0284c7] transition-colors"
                    >
                      <Plus size={13} /> Créer Maintenant
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-5 font-bold text-slate-900">
                      <div>{camp.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5 truncate max-w-xs">
                        {camp.subject || camp.message}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            camp.channel === 'WHATSAPP'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-sky-50 text-[#0284c7]'
                          }`}
                        >
                          {camp.channel === 'WHATSAPP' ? (
                            <MessageSquare size={13} />
                          ) : (
                            <Mail size={13} />
                          )}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{camp.channel}</div>
                          <div className="text-[10px] text-slate-400">{camp.type}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <Users size={11} className="text-slate-500" />
                        {camp.audience}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          camp.status === 'SENT'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : camp.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-sky-50 text-[#0284c7] border-sky-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            camp.status === 'SENT'
                              ? 'bg-emerald-500'
                              : camp.status === 'DRAFT'
                              ? 'bg-slate-400'
                              : 'bg-[#0ea5e9]'
                          }`}
                        />
                        {camp.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-slate-400" />
                        {new Date(camp.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {camp.status !== 'SENT' && (
                          <button
                            type="button"
                            disabled={busyId === camp.id}
                            onClick={() => updateStatus(camp.id, 'SENT')}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                          >
                            <Check size={11} /> Marquer Envoyée
                          </button>
                        )}
                        <Link
                          href={`/admin/marketing/campaigns/new?audience=${camp.audience}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-[#0284c7] bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                        >
                          Dupliquer
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === camp.id}
                          onClick={() => deleteCampaign(camp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
