'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Repeat,
  TrendingUp,
  ArrowRight,
  ShoppingCart,
  Crown,
  MessageSquare,
  Zap,
  CheckCircle2,
  Sparkles,
  Clock,
  Flame,
  PhoneCall,
  Send,
  Package,
  Copy,
  Check,
  TicketPercent,
  Plus,
  X,
  Loader2,
  MapPin,
  Smartphone,
  Radio,
  ShieldCheck,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { formatMAD } from '@/lib/products';

export interface MonthlyRetentionPoint {
  label: string;
  newRevenue: number;
  repeatRevenue: number;
  ordersCount: number;
}

export interface CityStat {
  city: string;
  count: number;
  revenue: number;
}

export interface StudioContact {
  id: string;
  name: string;
  phone: string | null;
  cleanPhone: string;
  city: string | null;
  totalSpent: number;
  ordersCount: number;
  tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'STANDARD';
  daysSinceLastOrder: number;
  segment: 'VIP' | 'AT_RISK' | 'INACTIVE' | 'ONE_TIME' | 'PROSPECT';
}

export interface AbandonedCartSummary {
  id: string;
  cartValue: number;
  lastActivity: string;
  minutesSince: number;
  items: Array<{ name: string; quantity?: number; price?: number }>;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
    city: string | null;
  };
}

export interface CampaignSummary {
  id: string;
  name: string;
  channel: string;
  type: string;
  audience: string;
  status: string;
  message: string;
  createdAt: string;
}

export interface PromoSummary {
  id: string;
  code: string;
  type: string;
  value: number;
  usageCount: number;
  isActive: boolean;
}

interface Props {
  kpis: {
    totalCustomers: number;
    withPhoneCount: number;
    newCustomers: number;
    returningCustomers: number;
    repeatRate: string;
    totalRevenue: number;
    repeatRevenue: number;
    repeatRevShare: string;
    cltv: number;
    aov: number;
    abandonedCartsCount: number;
    recoverableMAD: number;
    liveSessionsCount: number;
    liveCartsValue: number;
  };
  segments: {
    vipCount: number;
    diamondCount: number;
    goldCount: number;
    silverCount: number;
    atRiskCount: number;
    inactiveCount: number;
    oneTimeCount: number;
    hotCartsCount: number;
  };
  monthlyTrend: MonthlyRetentionPoint[];
  topCities: CityStat[];
  studioContacts: StudioContact[];
  recentAbandonedCarts: AbandonedCartSummary[];
  initialCampaigns: CampaignSummary[];
  initialPromos: PromoSummary[];
  initialSettings: {
    whatsappConfigured: boolean;
    emailConfigured: boolean;
    automationEnabled: boolean;
  };
}

type StudioAudience = 'VIP' | 'ONE_TIME' | 'AT_RISK' | 'INACTIVE' | 'ALL';

const STUDIO_TEMPLATES: Record<
  StudioAudience,
  { title: string; badge: string; message: string }
> = {
  VIP: {
    title: 'Offre Privilège Club VIP (-15%)',
    badge: 'VIP Diamant & Or',
    message:
      'Salam {{first_name}} ✨, en tant que membre VIP de la Maison NAY Parfum à {{city}}, profitez en avant-première de -15% avec le code {{promo_code}} + livraison express et un échantillon niche offert dans votre colis 🎁. Commander ici : https://nayparfum.ma',
  },
  ONE_TIME: {
    title: 'Conversion 2ème Commande',
    badge: 'Boost Rétention',
    message:
      'Salam {{first_name}} 👋, merci pour votre confiance chez NAY Parfum ! Pour votre 2ème flacon, nous vous offrons un privilège exclusif avec le code {{promo_code}} (livraison rapide sur {{city}}). Découvrez nos coups de cœur : https://nayparfum.ma/products ✨',
  },
  AT_RISK: {
    title: 'Relance Win-Back (90-180j)',
    badge: 'Réactivation',
    message:
      'Salam {{first_name}} ✨, cela fait un moment ! Nos nouveaux arrivages de parfums et testeurs de luxe viennent d’arriver. Utilisez le code {{promo_code}} pour profiter d’une remise immédiate + coffret découverte sur {{city}} : https://nayparfum.ma',
  },
  INACTIVE: {
    title: 'Cadeau Réveil Client Dormant',
    badge: '> 180 jours',
    message:
      'Salam {{first_name}} 🌙, la Maison NAY Parfum vous réserve une attention spéciale pour votre retour : activez le code {{promo_code}} et recevez un flacon testeur surprise avec votre prochaine commande ✨ https://nayparfum.ma',
  },
  ALL: {
    title: 'Lancement Nouveautés & Testeurs',
    badge: 'Diffusion Globale',
    message:
      'Salam {{first_name}} ✨, nouveaux arrivages exclusifs chez NAY Parfum (Parfums Originaux & Testeurs authentiques). Profitez du code {{promo_code}} aujourd’hui avec livraison express partout au Maroc 🇲🇦 : https://nayparfum.ma',
  },
};

export default function MarketingOverviewClient({
  kpis,
  segments,
  monthlyTrend,
  topCities,
  studioContacts,
  recentAbandonedCarts,
  initialCampaigns,
  initialPromos,
  initialSettings,
}: Props) {
  // Interactive WhatsApp Broadcast Studio State
  const [selectedAudience, setSelectedAudience] = useState<StudioAudience>('VIP');
  const [messageTemplate, setMessageTemplate] = useState<string>(STUDIO_TEMPLATES.VIP.message);
  const [campaignName, setCampaignName] = useState<string>(STUDIO_TEMPLATES.VIP.title);
  const [promos, setPromos] = useState<PromoSummary[]>(initialPromos);
  const [selectedPromoCode, setSelectedPromoCode] = useState<string>(
    initialPromos[0]?.code || 'NAYVIP15'
  );
  const [dispatchedIds, setDispatchedIds] = useState<Record<string, boolean>>({});
  const [previewContactId, setPreviewContactId] = useState<string | null>(null);
  const [copiedPhones, setCopiedPhones] = useState(false);
  const [copiedCartPhone, setCopiedCartPhone] = useState<string | null>(null);

  // Campaign save & list state
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>(initialCampaigns);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Inline Quick Promo Modal State
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('NAYVIP15');
  const [newPromoType, setNewPromoType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newPromoValue, setNewPromoValue] = useState('15');
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Automations Persistence State
  const [settings, setSettings] = useState(initialSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  const showToast = (text: string, type: 'ok' | 'err' = 'ok') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSelectAudience = (aud: StudioAudience) => {
    setSelectedAudience(aud);
    setCampaignName(STUDIO_TEMPLATES[aud].title);
    setMessageTemplate(STUDIO_TEMPLATES[aud].message);
    setPreviewContactId(null);
  };

  // Matched WhatsApp contacts for selected audience
  const matchedContacts = useMemo(() => {
    return studioContacts.filter((c) => {
      if (!c.cleanPhone || c.cleanPhone.length < 9) return false;
      if (selectedAudience === 'VIP') return c.segment === 'VIP';
      if (selectedAudience === 'ONE_TIME') return c.segment === 'ONE_TIME';
      if (selectedAudience === 'AT_RISK') return c.segment === 'AT_RISK';
      if (selectedAudience === 'INACTIVE') return c.segment === 'INACTIVE';
      return true;
    });
  }, [studioContacts, selectedAudience]);

  const activePreviewContact = useMemo(() => {
    if (previewContactId) {
      const found = matchedContacts.find((c) => c.id === previewContactId);
      if (found) return found;
    }
    return (
      matchedContacts[0] || {
        id: 'sample',
        name: 'Salma Bennani',
        phone: '0661234567',
        cleanPhone: '212661234567',
        city: 'Casablanca',
        totalSpent: 2850,
        ordersCount: 3,
        tier: 'GOLD' as const,
        daysSinceLastOrder: 14,
        segment: 'VIP' as const,
      }
    );
  }, [matchedContacts, previewContactId]);

  const personalizeMessage = (tpl: string, contact: StudioContact) => {
    const firstName = (contact.name || 'Client').trim().split(/\s+/)[0] || 'Client';
    const city = contact.city?.trim() || 'votre ville';
    return tpl
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{city\}\}/g, city)
      .replace(/\{\{promo_code\}\}/g, selectedPromoCode || 'NAYVIP');
  };

  const dispatchedCount = matchedContacts.filter((c) => dispatchedIds[c.id]).length;

  const handleSendWhatsAppToContact = (contact: StudioContact) => {
    const personalized = personalizeMessage(messageTemplate, contact);
    const url = `https://wa.me/${contact.cleanPhone}?text=${encodeURIComponent(personalized)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setDispatchedIds((prev) => ({ ...prev, [contact.id]: true }));
  };

  const handleCopyAllSegmentPhones = () => {
    const list = matchedContacts.map((c) => `+${c.cleanPhone}`).join(', ');
    if (!list) {
      showToast('Aucun numéro WhatsApp disponible dans ce segment.', 'err');
      return;
    }
    navigator.clipboard.writeText(list);
    setCopiedPhones(true);
    showToast(`${matchedContacts.length} numéros copiés au format +212 !`);
    setTimeout(() => setCopiedPhones(false), 2500);
  };

  const handleSaveCampaign = async (status: 'DRAFT' | 'SENT') => {
    setSavingCampaign(true);
    try {
      const res = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          channel: 'WHATSAPP',
          type:
            selectedAudience === 'VIP'
              ? 'VIP'
              : selectedAudience === 'AT_RISK' || selectedAudience === 'INACTIVE'
              ? 'REACTIVATION'
              : 'PROMOTION',
          audience: selectedAudience,
          message: messageTemplate,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur enregistrement');
      setCampaigns((prev) => [
        {
          ...data.campaign,
          createdAt: data.campaign.createdAt || new Date().toISOString(),
        },
        ...prev.slice(0, 4),
      ]);
      showToast(
        status === 'SENT'
          ? 'Campagne enregistrée comme envoyée dans le journal !'
          : 'Brouillon sauvegardé dans vos campagnes.'
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur API', 'err');
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleToggleCampaignStatus = async (camp: CampaignSummary) => {
    const nextStatus = camp.status === 'SENT' ? 'DRAFT' : 'SENT';
    setUpdatingCampaignId(camp.id);
    try {
      const res = await fetch('/api/admin/marketing/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: camp.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur mise à jour');
      setCampaigns((prev) =>
        prev.map((c) => (c.id === camp.id ? { ...c, status: nextStatus } : c))
      );
      showToast(`Statut mis à jour : ${nextStatus}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'err');
    } finally {
      setUpdatingCampaignId(null);
    }
  };

  const handleCreateQuickPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPromo(true);
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newPromoCode.trim().toUpperCase(),
          type: newPromoType,
          value: Number(newPromoValue) || 10,
          applicableScope: 'ALL',
          description: `Code Rétention créé depuis Studio Marketing (${selectedAudience})`,
          isActive: true,
          requiresAccount: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de créer le code promo');
      const created: PromoSummary = {
        id: data.id,
        code: data.code,
        type: data.type,
        value: data.value,
        usageCount: 0,
        isActive: true,
      };
      setPromos((prev) => [created, ...prev]);
      setSelectedPromoCode(created.code);
      setPromoModalOpen(false);
      showToast(`Code promo ${created.code} créé et injecté dans votre message !`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur création code', 'err');
    } finally {
      setCreatingPromo(false);
    }
  };

  const handleToggleSetting = async (
    key: 'automationEnabled' | 'whatsappConfigured' | 'emailConfigured'
  ) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/marketing/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error('Échec sauvegarde');
      showToast('Paramètre d’automatisation sauvegardé.');
    } catch {
      setSettings(settings);
      showToast('Impossible de sauvegarder le paramètre.', 'err');
    } finally {
      setSavingSettings(false);
    }
  };

  const retentionGoalPercent = Math.min(100, Math.round((parseFloat(kpis.repeatRate) / 25) * 100));
  const vipShareBase = Math.max(1, kpis.totalCustomers);

  return (
    <div className="space-y-6">
      {/* Floating Toast Feedback */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
              toastMsg.type === 'ok'
                ? 'bg-slate-900 text-white border-sky-500/40'
                : 'bg-red-600 text-white border-red-400'
            }`}
          >
            {toastMsg.type === 'ok' ? (
              <CheckCircle2 size={15} className="text-sky-400 shrink-0" />
            ) : (
              <X size={15} className="shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 1 — 4 Executive Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nay-stagger">
        {/* Hero Card: Signature Electric Blue */}
        <div className="nay-hero-shine rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] text-white shadow-lg shadow-sky-500/20 flex flex-col justify-between min-h-[156px]">
          <div className="flex items-start justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0">
                <Repeat size={17} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-100">
                  CA RÉCURRENT (FIDÉLITÉ)
                </p>
                <p className="text-[11px] text-sky-100/80">Clients à achats multiples</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/25 shrink-0">
              {kpis.repeatRevShare}% CA
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2 relative z-10">
            <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight tabular-nums">
              {formatMAD(kpis.repeatRevenue)}
            </span>
            <span className="text-[11px] font-semibold bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
              LTV : {formatMAD(kpis.cltv)}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-sky-50 relative z-10">
            <span>Panier moyen : {formatMAD(kpis.aov)}</span>
            <Link
              href="/admin/marketing/analytics"
              className="inline-flex items-center gap-1 font-bold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg transition-colors"
            >
              Analytique <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* KPI 2: Base Clients & Contacts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[156px]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                BASE CLIENTS &amp; CRM
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Audience joignable +212</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-200/70 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {kpis.totalCustomers} <span className="text-xs font-semibold text-slate-400">clients</span>
            </span>
            <Link
              href="/admin/marketing/contacts"
              className="text-[11px] font-bold text-[#0284c7] bg-sky-50 hover:bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200 transition-colors"
            >
              {kpis.withPhoneCount} WhatsApp
            </Link>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0ea5e9] nay-progress-fill"
                style={{
                  width: `${
                    kpis.totalCustomers > 0
                      ? Math.min(100, Math.round((kpis.withPhoneCount / kpis.totalCustomers) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Nouveaux : <strong className="text-slate-800">{kpis.newCustomers}</strong>
              </span>
              <span>
                Fidélisés : <strong className="text-slate-800">{kpis.returningCustomers}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Taux de Réachat (Retention Rate) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[156px]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                TAUX DE RÉACHAT
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Objectif Maison NAY : 25%</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {kpis.repeatRate}%
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {segments.vipCount} VIP actifs
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 nay-progress-fill"
                style={{ width: `${retentionGoalPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Club Diamant : {segments.diamondCount}</span>
              <Link
                href="/admin/marketing/vip"
                className="font-semibold text-[#0284c7] hover:underline flex items-center gap-0.5"
              >
                Club VIP <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>

        {/* KPI 4: Paniers à Récupérer & Radar En Direct */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[156px]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                CA À RÉCUPÉRER
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Paniers abandonnés + live</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
              <ShoppingCart size={16} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {formatMAD(kpis.recoverableMAD)}
            </span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {kpis.abandonedCartsCount} paniers
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 nay-progress-fill"
                style={{
                  width: `${
                    kpis.abandonedCartsCount > 0
                      ? Math.min(100, Math.round((segments.hotCartsCount / Math.max(1, kpis.abandonedCartsCount)) * 100) || 35)
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Radio size={11} className="text-emerald-500" />
                {kpis.liveSessionsCount} actifs 24h
              </span>
              <Link
                href="/admin/marketing/abandoned-carts"
                className="font-semibold text-[#0284c7] hover:underline flex items-center gap-0.5"
              >
                Relancer <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — Retention Revenue Curve + RFM Customer Health Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 nay-enter">
        {/* Left (2 Cols): Recharts Retention Attribution AreaChart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0ea5e9]">
                COHORTES &amp; ATTRIBUTION REVENUS
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Croissance Nouveaux Clients vs Réachat Fidèle (6 mois)
              </h2>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
                CA Récurrent (VIP / Fidèles)
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Premiers Achats
              </span>
            </div>
          </div>

          <div className="h-[240px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="nayRetentionRepeat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="nayRetentionNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.26} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
                  }}
                  formatter={(value: unknown, name: unknown) => [
                    formatMAD(Number(value) || 0),
                    name === 'repeatRevenue' ? 'CA Récurrent (Fidèles)' : 'Premiers Achats',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="newRevenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#nayRetentionNew)"
                />
                <Area
                  type="monotone"
                  dataKey="repeatRevenue"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fill="url(#nayRetentionRepeat)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Cities Geographic Concentration Bar */}
          {topCities.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <MapPin size={12} className="text-[#0ea5e9]" />
                Top Villes CRM :
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {topCities.map((c) => (
                  <span
                    key={c.city}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-700"
                  >
                    <span>{c.city}</span>
                    <span className="text-[#0284c7] font-bold">{c.count}</span>
                    <span className="text-slate-400">({formatMAD(c.revenue)})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right (1 Col): RFM Lifecycle Matrix */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                MATRICE RFM EN DIRECT
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Cycle de Vie Client
              </h2>
            </div>
            <Link
              href="/admin/marketing/analytics"
              className="text-[11px] font-semibold text-[#0284c7] hover:underline flex items-center gap-1"
            >
              Détails <ArrowRight size={11} />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                key: 'VIP' as StudioAudience,
                label: 'VIP Privilège (Diamant / Or / Argent)',
                count: segments.vipCount,
                color: 'bg-[#0ea5e9]',
                badge: 'bg-sky-50 text-[#0284c7] border-sky-200',
                desc: '≥ 1 000 MAD ou ≥ 2 achats',
              },
              {
                key: 'ONE_TIME' as StudioAudience,
                label: '1ère Commande (À convertir)',
                count: segments.oneTimeCount,
                color: 'bg-emerald-500',
                badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                desc: 'Potentiel 2ème achat fort',
              },
              {
                key: 'AT_RISK' as StudioAudience,
                label: 'À Réactiver (90 – 180 jours)',
                count: segments.atRiskCount,
                color: 'bg-amber-500',
                badge: 'bg-amber-50 text-amber-700 border-amber-200',
                desc: 'Risque d’attrition modéré',
              },
              {
                key: 'INACTIVE' as StudioAudience,
                label: 'Dormants (> 180 jours)',
                count: segments.inactiveCount,
                color: 'bg-slate-400',
                badge: 'bg-slate-100 text-slate-700 border-slate-200',
                desc: 'Campagne réveil + testeur',
              },
            ].map((row) => {
              const pct = Math.min(100, Math.round((row.count / vipShareBase) * 100));
              const isSelected = selectedAudience === row.key;
              return (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => handleSelectAudience(row.key)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-[#0ea5e9] bg-sky-50/50 shadow-xs'
                      : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">{row.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${row.badge}`}
                    >
                      {row.count} clients
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.color} nay-progress-fill`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                    <span>{row.desc}</span>
                    <span className="font-semibold text-[#0284c7]">Cibler dans Studio →</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50 to-slate-50 border border-sky-200/70 flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-700">
              <strong className="text-slate-900">{segments.hotCartsCount} paniers chauds</strong> détectés &lt;24h
            </div>
            <Link
              href="/admin/marketing/live-carts"
              className="text-[11px] font-bold text-white bg-[#0ea5e9] hover:bg-[#0284c7] px-2.5 py-1 rounded-lg transition-colors shrink-0"
            >
              Live Radar
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3 — NEW ENTERPRISE FEATURE: Studio de Diffusion WhatsApp & Promo Express */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden nay-enter">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              <Smartphone size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0284c7]">
                  STUDIO DE DIFFUSION WHATSAPP DIRECT
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {matchedContacts.length} contacts ciblés (+212)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                File d’Envoi Personnalisée &amp; Codes Promo Express
              </h2>
            </div>
          </div>

          {/* Segment Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'VIP', label: `VIP (${segments.vipCount})` },
                { id: 'ONE_TIME', label: `1ère Cmd (${segments.oneTimeCount})` },
                { id: 'AT_RISK', label: `À Réactiver (${segments.atRiskCount})` },
                { id: 'INACTIVE', label: `Dormants (${segments.inactiveCount})` },
                { id: 'ALL', label: `Tous (${kpis.withPhoneCount})` },
              ] as Array<{ id: StudioAudience; label: string }>
            ).map((pill) => {
              const active = selectedAudience === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => handleSelectAudience(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    active
                      ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left 7 Cols: Message Composer + Promo Injector + Actions */}
          <div className="lg:col-span-7 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Nom de la Campagne
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-[#0ea5e9]"
                  placeholder="Ex: Offre Privilège Ramadan VIP"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Code Promo Injecté (&#123;&#123;promo_code&#125;&#125;)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPromoModalOpen(true)}
                    className="text-[11px] font-bold text-[#0284c7] hover:underline flex items-center gap-0.5"
                  >
                    <Plus size={11} /> Créer Express
                  </button>
                </div>
                <select
                  value={selectedPromoCode}
                  onChange={(e) => setSelectedPromoCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-[#0ea5e9]"
                >
                  {promos.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.code} ({p.type === 'PERCENTAGE' ? `-${p.value}%` : `-${p.value} MAD`} • {p.usageCount} util.)
                    </option>
                  ))}
                  {promos.length === 0 && <option value="NAYVIP15">NAYVIP15 (Par défaut)</option>}
                </select>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Message Personnalisé WhatsApp
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { token: '{{first_name}}', label: '+ Prénom' },
                    { token: '{{city}}', label: '+ Ville' },
                    { token: '{{promo_code}}', label: '+ Code Promo' },
                  ].map((v) => (
                    <button
                      key={v.token}
                      type="button"
                      onClick={() => setMessageTemplate((prev) => `${prev} ${v.token}`)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-sky-100 transition-colors"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={4}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-[#0ea5e9]"
              />
            </div>

            {/* Live iPhone WhatsApp Message Bubble Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                  Aperçu Client Live ({activePreviewContact.name})
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {activePreviewContact.city || 'Maroc'} • {activePreviewContact.tier}
                </span>
              </div>
              <div className="bg-white border border-emerald-200/80 rounded-xl rounded-tl-xs p-3 text-xs text-slate-800 leading-relaxed shadow-2xs">
                {personalizeMessage(messageTemplate, activePreviewContact)}
              </div>
            </div>

            {/* Studio Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyAllSegmentPhones}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all"
              >
                {copiedPhones ? (
                  <Check size={13} className="text-emerald-600" />
                ) : (
                  <Copy size={13} className="text-slate-500" />
                )}
                <span>Copier {matchedContacts.length} Numéros (+212)</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={savingCampaign}
                  onClick={() => handleSaveCampaign('DRAFT')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all disabled:opacity-60"
                >
                  Sauvegarder Brouillon
                </button>
                <button
                  type="button"
                  disabled={savingCampaign}
                  onClick={() => handleSaveCampaign('SENT')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-xs font-semibold shadow-sm shadow-sky-500/20 transition-all disabled:opacity-60"
                >
                  {savingCampaign ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>Journaliser Campagne Envoyée</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Live 1-Click Sequential Dispatch Queue */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between bg-slate-50/40">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    File d’Envoi Séquentielle ({matchedContacts.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cliquez pour pré-remplir WhatsApp et suivre votre avancement.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-[#0284c7] tabular-nums">
                  {dispatchedCount} / {matchedContacts.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[305px] overflow-y-auto pr-1">
                {matchedContacts.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 bg-white text-xs text-slate-500">
                    Aucun contact avec numéro WhatsApp valide dans ce segment.
                  </div>
                ) : (
                  matchedContacts.slice(0, 25).map((contact) => {
                    const isSent = !!dispatchedIds[contact.id];
                    const isPreview = activePreviewContact.id === contact.id;
                    return (
                      <div
                        key={contact.id}
                        onClick={() => setPreviewContactId(contact.id)}
                        className={`cursor-pointer p-2.5 rounded-xl border bg-white flex items-center justify-between gap-2 transition-all ${
                          isPreview
                            ? 'border-[#0ea5e9] ring-1 ring-[#0ea5e9]/30'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {contact.name}
                            </span>
                            {contact.tier !== 'STANDARD' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-[#0284c7] border border-sky-200 shrink-0">
                                {contact.tier}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">+{contact.cleanPhone}</span>
                            <span>•</span>
                            <span className="truncate">{contact.city || 'Maroc'}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">
                              {formatMAD(contact.totalSpent)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendWhatsAppToContact(contact);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                            isSent
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-[#25D366] hover:bg-[#1fb857] text-white shadow-xs'
                          }`}
                        >
                          {isSent ? (
                            <>
                              <Check size={12} /> Envoyé
                            </>
                          ) : (
                            <>
                              <MessageSquare size={12} /> WhatsApp
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {matchedContacts.length > 25 && (
              <div className="mt-3 pt-2.5 border-t border-slate-200 text-center">
                <Link
                  href="/admin/marketing/contacts"
                  className="text-[11px] font-bold text-[#0284c7] hover:underline"
                >
                  Voir les {matchedContacts.length} contacts dans le Répertoire CRM →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4 — Hot Abandoned Carts Queue + Campaigns & Live Automations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 nay-enter">
        {/* Left (2 Cols): Abandoned Carts & Recent Campaigns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Abandoned Carts Action Center */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Flame size={17} className="text-amber-500" />
                  Paniers Abandonnés Récents à Relancer
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Relance 1-clic WhatsApp avec produit exact et montant en MAD.
                </p>
              </div>
              <Link
                href="/admin/marketing/abandoned-carts"
                className="text-xs font-bold text-[#0284c7] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl transition-colors shrink-0"
              >
                Tout Voir ({kpis.abandonedCartsCount})
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentAbandonedCarts.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={28} />
                  <p className="text-sm font-bold text-slate-800">Aucun panier en attente !</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tous les paniers récents ont déjà été convertis.
                  </p>
                </div>
              ) : (
                recentAbandonedCarts.map((cart) => {
                  const isAbandoned = cart.minutesSince > 60;
                  const firstItemName = cart.items[0]?.name || "vos parfums d'exception";
                  const rawPhone = cart.customer.phone || '';
                  const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
                  const waDigits = cleanDigits.startsWith('0')
                    ? `212${cleanDigits.slice(1)}`
                    : cleanDigits.startsWith('212')
                    ? cleanDigits
                    : cleanDigits.length === 9
                    ? `212${cleanDigits}`
                    : '';
                  const waMsg = `Salam ${cart.customer.name} 👋, c'est l'équipe NAY Parfum ! Votre sélection (${firstItemName} — ${formatMAD(cart.cartValue)}) est toujours réservée. Souhaitez-vous valider votre livraison express au Maroc ? ✨`;
                  const waUrl =
                    waDigits.length >= 11
                      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waMsg)}`
                      : null;
                  const isNamed =
                    cart.customer.name && cart.customer.name !== 'Visiteur Boutique';

                  return (
                    <div
                      key={cart.id}
                      className="p-4 sm:px-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-200 font-extrabold flex items-center justify-center text-xs shrink-0">
                          {isNamed ? (
                            cart.customer.name.charAt(0).toUpperCase()
                          ) : (
                            <ShoppingCart size={15} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm truncate">
                              {isNamed
                                ? cart.customer.name
                                : `Visiteur #${cart.id.slice(-6)}`}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isAbandoned
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {isAbandoned ? 'Abandonné' : 'En session'}
                            </span>
                            {cart.customer.city && (
                              <span className="text-[10px] font-semibold text-slate-500">
                                {cart.customer.city}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>
                              {cart.customer.phone || cart.customer.email || 'Session anonyme'}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              {cart.minutesSince > 1440
                                ? `Il y a ${Math.floor(cart.minutesSince / 1440)}j`
                                : cart.minutesSince > 60
                                ? `Il y a ${Math.floor(cart.minutesSince / 60)}h`
                                : `Il y a ${cart.minutesSince} min`}
                            </span>
                          </div>
                          {cart.items.length > 0 && (
                            <div className="text-[11px] text-slate-600 mt-1.5 inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg max-w-full">
                              <Package size={11} className="text-slate-400 shrink-0" />
                              <span className="font-medium truncate max-w-[260px]">
                                {cart.items
                                  .map((i) => `${i.name} (x${i.quantity || 1})`)
                                  .join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                        <div className="text-right mr-1">
                          <span className="text-[10px] text-slate-400 block">Valeur</span>
                          <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                            {formatMAD(cart.cartValue)}
                          </span>
                        </div>

                        {cart.customer.phone && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(cart.customer.phone || '');
                              setCopiedCartPhone(cart.id);
                              setTimeout(() => setCopiedCartPhone(null), 2000);
                            }}
                            title="Copier le numéro"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            {copiedCartPhone === cart.id ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        )}

                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1fb857] text-white text-xs font-bold shadow-sm transition-all"
                          >
                            <MessageSquare size={13} />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <Link
                            href="/admin/marketing/abandoned-carts"
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                          >
                            Détails
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Campaigns Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Send size={16} className="text-[#0ea5e9]" />
                  Dernières Campagnes &amp; Diffusions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Basculer le statut d’envoi en 1 clic ou dupliquer vers le studio.
                </p>
              </div>
              <Link
                href="/admin/marketing/campaigns"
                className="text-xs font-bold text-[#0284c7] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                Toutes les Campagnes
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {campaigns.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-sm font-semibold text-slate-700">
                    Aucune campagne enregistrée.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Utilisez le Studio ci-dessus pour journaliser votre première diffusion !
                  </p>
                </div>
              ) : (
                campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 sm:px-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{camp.name}</h4>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#0284c7]">{camp.channel}</span>
                        <span>•</span>
                        <span>Audience : {camp.audience}</span>
                        <span>•</span>
                        <span>{new Date(camp.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={updatingCampaignId === camp.id}
                        onClick={() => handleToggleCampaignStatus(camp)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                          camp.status === 'SENT'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : camp.status === 'SCHEDULED'
                            ? 'bg-sky-50 text-[#0284c7] border-sky-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {updatingCampaignId === camp.id ? '...' : camp.status}
                      </button>

                      <Link
                        href={`/admin/marketing/campaigns/new?audience=${camp.audience}`}
                        className="text-xs font-semibold text-slate-600 hover:text-[#0284c7] px-2.5 py-1 rounded-lg border border-slate-200 bg-white"
                      >
                        Relancer
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right (1 Col): Live Automations Switchboard & Promo Vault */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Moteur Automatisations</h3>
                  <p className="text-slate-500 text-[11px]">Contrôle en base de données</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  settings.automationEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {settings.automationEnabled ? 'Actif' : 'Pause'}
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  key: 'automationEnabled' as const,
                  title: 'Séquences Rétention & Relances',
                  desc: 'Détection paniers abandonnés H+1 & paliers VIP.',
                  active: settings.automationEnabled,
                },
                {
                  key: 'whatsappConfigured' as const,
                  title: 'Normalisation WhatsApp +212',
                  desc: 'Formatage auto 06/07 → liens wa.me directs.',
                  active: settings.whatsappConfigured,
                },
                {
                  key: 'emailConfigured' as const,
                  title: 'Notifications Email Rétention',
                  desc: 'Confirmations VIP et alertes fidélité.',
                  active: settings.emailConfigured,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={() => handleToggleSetting(item.key)}
                    className={`w-10 h-5.5 rounded-full transition-colors p-0.5 shrink-0 ${
                      item.active ? 'bg-[#0ea5e9]' : 'bg-slate-300'
                    }`}
                    aria-label={item.title}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform ${
                        item.active ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <Link
              href="/admin/marketing/settings"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
            >
              <span>Configurer les Playbooks</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* Active Promo Codes Mini-Vault */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
                  <TicketPercent size={15} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Codes Privilège Actifs</h4>
                  <p className="text-[11px] text-slate-500">{promos.length} codes prêts à l’emploi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromoModalOpen(true)}
                className="text-[11px] font-bold text-white bg-[#0ea5e9] hover:bg-[#0284c7] px-2.5 py-1 rounded-lg transition-colors"
              >
                + Nouveau
              </button>
            </div>

            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {promos.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  Aucun code promo actif. Créez-en un en 1 clic !
                </p>
              ) : (
                promos.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPromoCode(p.code);
                      showToast(`Code ${p.code} sélectionné dans le Studio !`);
                    }}
                    className={`cursor-pointer p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      selectedPromoCode === p.code
                        ? 'border-[#0ea5e9] bg-sky-50/50'
                        : 'border-slate-200/80 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{p.code}</span>
                      <span className="text-[10px] text-slate-500 ml-2">
                        {p.usageCount} util.
                      </span>
                    </div>
                    <span className="font-bold text-[#0284c7]">
                      {p.type === 'PERCENTAGE' ? `-${p.value}%` : `-${p.value} MAD`}
                    </span>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/admin/promos"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-opacity"
            >
              <span>Gérer tous les Codes Promo</span>
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Inline Quick Promo Creation Modal */}
      <AnimatePresence>
        {promoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPromoModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
                    <TicketPercent size={17} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Créer un Code Promo Rétention
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Utilisable immédiatement sur boutique &amp; WhatsApp
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPromoModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateQuickPromo} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                    Code Promo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 uppercase"
                    placeholder="NAYVIP15"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                      Type Remise
                    </label>
                    <select
                      value={newPromoType}
                      onChange={(e) =>
                        setNewPromoType(e.target.value as 'PERCENTAGE' | 'FIXED')
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                    >
                      <option value="PERCENTAGE">Pourcentage (%)</option>
                      <option value="FIXED">Montant Fixe (MAD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                      Valeur *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newPromoValue}
                      onChange={(e) => setNewPromoValue(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPromoModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creatingPromo}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-xs font-semibold shadow-sm"
                  >
                    {creatingPromo && <Loader2 size={13} className="animate-spin" />}
                    <span>Créer &amp; Injecter</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
