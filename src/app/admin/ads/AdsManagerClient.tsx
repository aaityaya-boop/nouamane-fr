'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Share2,
  RefreshCw,
  Plus,
  Settings,
  Flame,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  Sliders,
  Sparkles,
  PieChart,
  ShieldCheck,
  Eye,
  MousePointer,
  ShoppingCart,
  Zap,
  Globe,
  HelpCircle,
  X,
  Loader2,
  Radio,
  Check,
  Building2,
  FileText,
  PauseCircle,
  Clock
} from 'lucide-react';
import { formatMAD } from '@/lib/products';

interface AdIntegration {
  id: string;
  platform: 'META' | 'TIKTOK' | 'GOOGLE' | 'SNAPCHAT' | 'INFLUENCE';
  accountName?: string | null;
  accountId: string;
  accessToken?: string | null;
  pixelId?: string | null;
  currency: string;
  exchangeRateToMAD: number;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'MOCK_MODE';
  autoSyncEnabled: boolean;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  errorMessage?: string | null;
}

interface AdCampaignItem {
  id: string;
  platform: 'META' | 'TIKTOK' | 'GOOGLE' | 'SNAPCHAT' | 'INFLUENCE';
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DRAFT';
  objective?: string | null;
  dailyBudget: number;
  totalSpend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  conversionValue: number;
  cpa: number;
  roas: number;
  recommendation?: 'SCALE' | 'OPTIMIZE' | 'PAUSE' | 'LEARNING' | null;
  targetAudience?: string | null;
  lastSyncedAt?: string | null;
  integration?: { accountName?: string | null } | null;
}

interface AdDailySpendItem {
  id: string;
  platform: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  cpc: number;
  notes?: string | null;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

interface Props {
  initialIntegrations: AdIntegration[];
  initialCampaigns: AdCampaignItem[];
  initialDailySpends: AdDailySpendItem[];
  orders: OrderItem[];
}

export default function AdsManagerClient({
  initialIntegrations,
  initialCampaigns,
  initialDailySpends,
  orders,
}: Props) {
  const [integrations, setIntegrations] = useState<AdIntegration[]>(initialIntegrations);
  const [campaigns, setCampaigns] = useState<AdCampaignItem[]>(initialCampaigns);
  const [dailySpends, setDailySpends] = useState<AdDailySpendItem[]>(initialDailySpends);

  // Filters & State
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isManualSpendModalOpen, setIsManualSpendModalOpen] = useState(false);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

  // Connect Modal Form State
  const [connectPlatform, setConnectPlatform] = useState<'META' | 'TIKTOK' | 'GOOGLE'>('META');
  const [connectAccountId, setConnectAccountId] = useState('');
  const [connectAccessToken, setConnectAccessToken] = useState('');
  const [connectPixelId, setConnectPixelId] = useState('');
  const [connectCurrency, setConnectCurrency] = useState('USD');
  const [connectExchangeRate, setConnectExchangeRate] = useState('10.0');
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Manual Spend Form State
  const [manualPlatform, setManualPlatform] = useState<'META' | 'TIKTOK' | 'GOOGLE' | 'SNAPCHAT' | 'INFLUENCE'>('META');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualSpend, setManualSpend] = useState('');
  const [manualRevenue, setManualRevenue] = useState('');
  const [manualConversions, setManualConversions] = useState('');
  const [manualClicks, setManualClicks] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // New Campaign Form State
  const [campName, setCampName] = useState('');
  const [campPlatform, setCampPlatform] = useState<'META' | 'TIKTOK' | 'GOOGLE'>('META');
  const [campDailyBudget, setCampDailyBudget] = useState('300');
  const [campSpend, setCampSpend] = useState('0');
  const [campConversions, setCampConversions] = useState('0');
  const [campRevenue, setCampRevenue] = useState('0');
  const [campObjective, setCampObjective] = useState('CONVERSIONS');
  const [campSubmitting, setCampSubmitting] = useState(false);

  // Filtered Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (selectedPlatform !== 'ALL' && c.platform !== selectedPlatform) return false;
      if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(query) || c.platform.toLowerCase().includes(query);
      }
      return true;
    });
  }, [campaigns, selectedPlatform, selectedStatus, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalAdSpend = 0;
    let totalAdRevenue = 0;
    let totalAdPurchases = 0;
    let totalImpressions = 0;
    let totalClicks = 0;

    campaigns.forEach((c) => {
      totalAdSpend += c.totalSpend;
      totalAdRevenue += c.conversionValue;
      totalAdPurchases += c.conversions;
      totalImpressions += c.impressions;
      totalClicks += c.clicks;
    });

    // Also factor daily manual spends if not already in campaigns
    dailySpends.forEach((d) => {
      if (!d.notes?.includes('API_AUTO')) {
        // standalone manual spend
      }
    });

    const totalStoreRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered' || o.status === 'completed').length;
    const totalOrdersCount = orders.length;

    const blendedROAS = totalAdSpend > 0 ? parseFloat((totalAdRevenue / totalAdSpend).toFixed(2)) : 0;
    const blendedMER = totalAdSpend > 0 ? parseFloat((totalStoreRevenue / totalAdSpend).toFixed(2)) : 0;
    const realCAC = deliveredOrdersCount > 0 ? Math.round(totalAdSpend / deliveredOrdersCount) : (totalOrdersCount > 0 ? Math.round(totalAdSpend / totalOrdersCount) : 0);
    const overallCPC = totalClicks > 0 ? parseFloat((totalAdSpend / totalClicks).toFixed(2)) : 0;
    const overallCTR = totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

    // Platform Breakdown
    const metaSpend = campaigns.filter((c) => c.platform === 'META').reduce((s, c) => s + c.totalSpend, 0);
    const metaRevenue = campaigns.filter((c) => c.platform === 'META').reduce((s, c) => s + c.conversionValue, 0);
    const metaPurchases = campaigns.filter((c) => c.platform === 'META').reduce((s, c) => s + c.conversions, 0);

    const tiktokSpend = campaigns.filter((c) => c.platform === 'TIKTOK').reduce((s, c) => s + c.totalSpend, 0);
    const tiktokRevenue = campaigns.filter((c) => c.platform === 'TIKTOK').reduce((s, c) => s + c.conversionValue, 0);
    const tiktokPurchases = campaigns.filter((c) => c.platform === 'TIKTOK').reduce((s, c) => s + c.conversions, 0);

    const googleSpend = campaigns.filter((c) => c.platform === 'GOOGLE').reduce((s, c) => s + c.totalSpend, 0);
    const googleRevenue = campaigns.filter((c) => c.platform === 'GOOGLE').reduce((s, c) => s + c.conversionValue, 0);
    const googlePurchases = campaigns.filter((c) => c.platform === 'GOOGLE').reduce((s, c) => s + c.conversions, 0);

    const influenceSpend = campaigns.filter((c) => c.platform === 'INFLUENCE' || c.platform === 'SNAPCHAT').reduce((s, c) => s + c.totalSpend, 0);
    const influenceRevenue = campaigns.filter((c) => c.platform === 'INFLUENCE' || c.platform === 'SNAPCHAT').reduce((s, c) => s + c.conversionValue, 0);

    return {
      totalAdSpend,
      totalAdRevenue,
      totalStoreRevenue,
      totalAdPurchases,
      totalOrdersCount,
      deliveredOrdersCount,
      blendedROAS,
      blendedMER,
      realCAC,
      overallCPC,
      overallCTR,
      meta: {
        spend: metaSpend,
        revenue: metaRevenue,
        purchases: metaPurchases,
        roas: metaSpend > 0 ? (metaRevenue / metaSpend).toFixed(2) : '0',
        cpa: metaPurchases > 0 ? Math.round(metaSpend / metaPurchases) : 0,
      },
      tiktok: {
        spend: tiktokSpend,
        revenue: tiktokRevenue,
        purchases: tiktokPurchases,
        roas: tiktokSpend > 0 ? (tiktokRevenue / tiktokSpend).toFixed(2) : '0',
        cpa: tiktokPurchases > 0 ? Math.round(tiktokSpend / tiktokPurchases) : 0,
      },
      google: {
        spend: googleSpend,
        revenue: googleRevenue,
        purchases: googlePurchases,
        roas: googleSpend > 0 ? (googleRevenue / googleSpend).toFixed(2) : '0',
        cpa: googlePurchases > 0 ? Math.round(googleSpend / googlePurchases) : 0,
      },
      influence: {
        spend: influenceSpend,
        revenue: influenceRevenue,
      },
    };
  }, [campaigns, dailySpends, orders]);

  // Trigger Sync
  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/ads/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncSuccessMsg('Synchronisation terminée avec succès !');
        // Refresh page data
        window.location.reload();
      } else {
        alert(data.error || 'Erreur lors de la synchronisation');
      }
    } catch (err: any) {
      alert('Erreur réseau lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect Ad Account Handler
  const handleConnectSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectLoading(true);
    setConnectError(null);

    try {
      const res = await fetch('/api/admin/ads/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: connectPlatform,
          accountId: connectAccountId.trim(),
          accessToken: connectAccessToken.trim(),
          pixelId: connectPixelId.trim() || null,
          currency: connectCurrency,
          exchangeRateToMAD: parseFloat(connectExchangeRate || '10.0'),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsConnectModalOpen(false);
        setConnectAccessToken('');
        window.location.reload();
      } else {
        setConnectError(data.error || data.testResult?.error || 'Échec de la connexion.');
      }
    } catch (err: any) {
      setConnectError('Erreur réseau lors de la configuration.');
    } finally {
      setConnectLoading(false);
    }
  };

  // Manual Spend Handler
  const handleManualSpendSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSpend) return;
    setManualSubmitting(true);

    try {
      const res = await fetch('/api/admin/ads/manual-spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: manualPlatform,
          date: manualDate,
          spend: manualSpend,
          revenue: manualRevenue || '0',
          conversions: manualConversions || '0',
          clicks: manualClicks || '0',
          notes: manualNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsManualSpendModalOpen(false);
        setManualSpend('');
        setManualRevenue('');
        setManualConversions('');
        setManualClicks('');
        setManualNotes('');
        window.location.reload();
      } else {
        alert(data.error || 'Erreur lors de l\'enregistrement.');
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setManualSubmitting(false);
    }
  };

  // Create Campaign Handler
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;
    setCampSubmitting(true);

    try {
      const res = await fetch('/api/admin/ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campName.trim(),
          platform: campPlatform,
          dailyBudget: campDailyBudget,
          totalSpend: campSpend,
          conversions: campConversions,
          conversionValue: campRevenue,
          objective: campObjective,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsNewCampaignModalOpen(false);
        setCampName('');
        window.location.reload();
      } else {
        alert(data.error || 'Erreur lors de la création de la campagne.');
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setCampSubmitting(false);
    }
  };

  // Platform Integration Status Check
  const getIntegration = (platform: string) => {
    return integrations.find((i) => i.platform === platform);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-200">
              Marketing Intelligence
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Synchronisation Live Meta & TikTok
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <TrendingUp size={22} className="text-neutral-900" />
            <span>Gestionnaire Publicités (Meta, TikTok, Google)</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Suivez en direct vos dépenses publicitaires (Charges), vos ventes attribuées, et votre vrai CAC & ROAS global.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsManualSpendModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <DollarSign size={14} className="text-neutral-500" />
            <span>Saisie Rapide Charge Ads</span>
          </button>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Settings size={14} className="text-neutral-500" />
            <span>Connexions API</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser Maintenant'}</span>
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950">
            <X size={14} />
          </button>
        </div>
      )}

      {/* EXECUTIVE BLENDED KPIs RIBBON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Ad Spend */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Charges Publicitaires Totales</span>
            <div className="p-2 rounded-lg bg-neutral-100 text-neutral-800">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {formatMAD(metrics.totalAdSpend)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>Meta + TikTok + Google</span>
            <Link href="/admin/finance?tab=EXPENSES" className="text-neutral-900 hover:underline font-medium">
              Voir en Finance →
            </Link>
          </div>
        </div>

        {/* Metric 2: Blended ROAS */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">ROAS Global (Blended)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 tracking-tight">
              {metrics.blendedROAS > 0 ? `${metrics.blendedROAS}x` : '—'}
            </span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {metrics.blendedROAS >= 3.5 ? 'Excellente Rentabilité' : 'En Optimisation'}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>CA Attribué :</span>
            <b className="text-neutral-900 font-semibold">{formatMAD(metrics.totalAdRevenue)}</b>
          </div>
        </div>

        {/* Metric 3: Real CAC */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">Vrai CAC (Coût / Commande)</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
              <ShoppingCart size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {metrics.realCAC > 0 ? formatMAD(metrics.realCAC) : '—'}
            </span>
            <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Par Colis
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>{metrics.deliveredOrdersCount || metrics.totalOrdersCount} commandes payées</span>
            <span>CPC : <b>{metrics.overallCPC} MAD</b></span>
          </div>
        </div>

        {/* Metric 4: MER */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">MER (Marketing Efficiency)</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <PieChart size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {metrics.blendedMER > 0 ? `${metrics.blendedMER}x` : '—'}
            </span>
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              CA Global / Ads
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2.5 border-t border-neutral-100">
            <span>CA Total Boutique :</span>
            <b className="text-neutral-900 font-semibold">{formatMAD(metrics.totalStoreRevenue)}</b>
          </div>
        </div>
      </div>

      {/* PLATFORM CARDS GRID (Meta, TikTok, Google, Influence) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-neutral-900">Performance & Canaux Publicitaires</h3>
          <span className="text-xs text-neutral-500">Dépenses & Ventes segmentées par plateforme</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* META CARD */}
          {(() => {
            const metaInteg = getIntegration('META');
            const isConn = metaInteg?.status === 'CONNECTED';
            const isErr = metaInteg?.status === 'ERROR';

            return (
              <div className={`bg-white rounded-xl border p-4.5 shadow-2xs flex flex-col justify-between space-y-3 transition-colors ${
                isErr ? 'border-rose-300 ring-1 ring-rose-100' : isConn ? 'border-neutral-200 hover:border-neutral-300' : 'border-neutral-200'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                        FB
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-neutral-900">Meta Ads</h4>
                        <p className="text-[10px] text-neutral-400">Instagram & Facebook</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      isConn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      isErr ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}>
                      {isConn ? 'Connecté' : isErr ? 'Erreur Token' : 'Non lié'}
                    </span>
                  </div>

                  {isErr && (
                    <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle size={13} className="shrink-0 text-rose-600" />
                        <span>Permission requise</span>
                      </div>
                      <p className="leading-snug text-[10.5px]">
                        Votre jeton Meta nécessite la permission <b className="underline">ads_read</b> pour récupérer les campagnes.
                      </p>
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-500">Dépense (Charges) :</span>
                      <span className="text-sm font-bold text-neutral-900">{formatMAD(metrics.meta.spend)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-500">Ventes générées :</span>
                      <span className="text-xs font-semibold text-emerald-700">{formatMAD(metrics.meta.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-500">ROAS / CPA :</span>
                      <span className="text-xs font-semibold text-neutral-800">{metrics.meta.roas}x • {metrics.meta.cpa} MAD</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setConnectPlatform('META');
                      setConnectAccountId(metaInteg?.accountId || '');
                      setConnectPixelId(metaInteg?.pixelId || '');
                      setConnectExchangeRate(metaInteg?.exchangeRateToMAD?.toString() || '10.0');
                      setConnectCurrency(metaInteg?.currency || 'USD');
                      setConnectError(metaInteg?.errorMessage || null);
                      setIsConnectModalOpen(true);
                    }}
                    className={`text-xs font-medium transition-colors ${
                      isErr ? 'text-rose-600 hover:text-rose-800 font-bold' : 'text-blue-700 hover:text-blue-900'
                    }`}
                  >
                    {isErr ? 'Corriger le Token →' : isConn ? 'Paramètres API →' : 'Lier le compte →'}
                  </button>
                  <button
                    onClick={() => setSelectedPlatform(selectedPlatform === 'META' ? 'ALL' : 'META')}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                      selectedPlatform === 'META' ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Filtrer
                  </button>
                </div>
              </div>
            );
          })()}

          {/* TIKTOK CARD */}
          {(() => {
            const tiktokInteg = getIntegration('TIKTOK');
            const isConn = tiktokInteg?.status === 'CONNECTED';

            return (
              <div className="bg-white rounded-xl border border-neutral-200 p-4.5 shadow-2xs flex flex-col justify-between space-y-3 hover:border-neutral-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs border border-neutral-800">
                        TT
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-neutral-900">TikTok Ads</h4>
                        <p className="text-[10px] text-neutral-400">Business Manager</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      isConn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}>
                      {isConn ? 'Connecté' : 'Non lié'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-500">Dépense (Charges) :</span>
                      <span className="text-sm font-bold text-neutral-900">{formatMAD(metrics.tiktok.spend)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-500">Ventes générées :</span>
                      <span className="text-xs font-semibold text-emerald-700">{formatMAD(metrics.tiktok.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-500">ROAS / CPA :</span>
                      <span className="text-xs font-semibold text-neutral-800">{metrics.tiktok.roas}x • {metrics.tiktok.cpa} MAD</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setConnectPlatform('TIKTOK');
                      setIsConnectModalOpen(true);
                    }}
                    className="text-xs font-medium text-neutral-900 hover:text-black transition-colors"
                  >
                    {isConn ? 'Paramètres API →' : 'Lier le compte →'}
                  </button>
                  <button
                    onClick={() => setSelectedPlatform(selectedPlatform === 'TIKTOK' ? 'ALL' : 'TIKTOK')}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                      selectedPlatform === 'TIKTOK' ? 'bg-neutral-900 text-white border-black font-bold' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Filtrer
                  </button>
                </div>
              </div>
            );
          })()}

          {/* GOOGLE CARD */}
          {(() => {
            const googleInteg = getIntegration('GOOGLE');
            const isConn = googleInteg?.status === 'CONNECTED';

            return (
              <div className="bg-white rounded-xl border border-neutral-200 p-4.5 shadow-2xs flex flex-col justify-between space-y-3 hover:border-neutral-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold text-xs border border-red-200">
                        GG
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-neutral-900">Google Ads</h4>
                        <p className="text-[10px] text-neutral-400">Search & Shopping</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      isConn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}>
                      {isConn ? 'Connecté' : 'Non lié'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-500">Dépense (Charges) :</span>
                      <span className="text-sm font-bold text-neutral-900">{formatMAD(metrics.google.spend)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-500">Ventes générées :</span>
                      <span className="text-xs font-semibold text-emerald-700">{formatMAD(metrics.google.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-neutral-500">ROAS / CPA :</span>
                      <span className="text-xs font-semibold text-neutral-800">{metrics.google.roas}x • {metrics.google.cpa} MAD</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setConnectPlatform('GOOGLE');
                      setIsConnectModalOpen(true);
                    }}
                    className="text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
                  >
                    {isConn ? 'Paramètres API →' : 'Lier le compte →'}
                  </button>
                  <button
                    onClick={() => setSelectedPlatform(selectedPlatform === 'GOOGLE' ? 'ALL' : 'GOOGLE')}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                      selectedPlatform === 'GOOGLE' ? 'bg-red-50 text-red-700 border-red-300 font-bold' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Filtrer
                  </button>
                </div>
              </div>
            );
          })()}

          {/* INFLUENCE & AMBASSADORS CARD */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4.5 shadow-2xs flex flex-col justify-between space-y-3 hover:border-neutral-300 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs border border-amber-200">
                    VIP
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900">Influence & VIP</h4>
                    <p className="text-[10px] text-neutral-400">Ambassadeurs & UGC</p>
                  </div>
                </div>

                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Actif
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-neutral-500">Dépense (Cachets / Payouts) :</span>
                  <span className="text-sm font-bold text-neutral-900">{formatMAD(metrics.influence.spend)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-neutral-500">Ventes générées :</span>
                  <span className="text-xs font-semibold text-emerald-700">{formatMAD(metrics.influence.revenue)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-neutral-500">Portail Ambassadeurs :</span>
                  <Link href="/admin/affiliates" className="text-xs font-bold text-sky-700 hover:underline">
                    Gérer les virements →
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <Link href="/admin/creatives" className="text-xs font-medium text-neutral-700 hover:text-neutral-900">
                Ads Vault UGC →
              </Link>
              <button
                onClick={() => setSelectedPlatform(selectedPlatform === 'INFLUENCE' ? 'ALL' : 'INFLUENCE')}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                  selectedPlatform === 'INFLUENCE' ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                Filtrer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CAMPAIGNS TABLE & FILTER BAR */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Tableau de bord des Campagnes
            </span>
            <h2 className="text-base font-bold text-neutral-900">
              Campagnes Actives & Décisions Stratégiques
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher campagne..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 w-44"
              />
            </div>

            {/* Platform Filter */}
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-700 font-medium focus:outline-none"
            >
              <option value="ALL">Tous les canaux</option>
              <option value="META">Meta Ads (FB/IG)</option>
              <option value="TIKTOK">TikTok Ads</option>
              <option value="GOOGLE">Google Ads</option>
              <option value="INFLUENCE">Influence & UGC</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-700 font-medium focus:outline-none"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actives</option>
              <option value="PAUSED">En pause</option>
            </select>

            <button
              onClick={() => setIsNewCampaignModalOpen(true)}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Plus size={13} />
              <span>Créer Suivi Campagne</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Campagne & Canal</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-3 text-right">Budget / Jour</th>
                <th className="py-3 px-3 text-right">Dépense (MAD)</th>
                <th className="py-3 px-3 text-right">Clics / CTR</th>
                <th className="py-3 px-3 text-right">Achats</th>
                <th className="py-3 px-3 text-right">CPA</th>
                <th className="py-3 px-3 text-right">ROAS</th>
                <th className="py-3 px-4 text-center">Décision Recommandée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    <HelpCircle size={28} className="mx-auto mb-2 text-neutral-300" />
                    <p className="font-medium text-neutral-800 text-xs">Aucune campagne trouvée</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Liez votre compte Meta ou TikTok, ou ajoutez manuellement une campagne.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((camp) => {
                  const platformBadge =
                    camp.platform === 'META'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : camp.platform === 'TIKTOK'
                      ? 'bg-neutral-900 text-white border-neutral-700'
                      : camp.platform === 'GOOGLE'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                  const recBadge =
                    camp.recommendation === 'SCALE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : camp.recommendation === 'OPTIMIZE'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : camp.recommendation === 'PAUSE'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-200';

                  const recConfig =
                    camp.recommendation === 'SCALE'
                      ? { text: 'SCALE UP', icon: <TrendingUp size={11} className="text-emerald-600" /> }
                      : camp.recommendation === 'OPTIMIZE'
                      ? { text: 'OPTIMISER', icon: <Zap size={11} className="text-amber-600" /> }
                      : camp.recommendation === 'PAUSE'
                      ? { text: 'STOP / PAUSE', icon: <PauseCircle size={11} className="text-rose-600" /> }
                      : { text: 'EN TEST', icon: <Clock size={11} className="text-neutral-600" /> };

                  return (
                    <tr key={camp.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${platformBadge}`}>
                            {camp.platform}
                          </span>
                          <span className="font-semibold text-neutral-900 truncate max-w-xs" title={camp.name}>
                            {camp.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}>
                          {camp.status === 'ACTIVE' ? 'Actif' : 'En pause'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-neutral-700">
                        {camp.dailyBudget > 0 ? formatMAD(camp.dailyBudget) : '—'}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-neutral-900">
                        {formatMAD(camp.totalSpend)}
                      </td>

                      <td className="py-3 px-3 text-right text-neutral-600">
                        <span>{camp.clicks}</span>
                        <span className="text-[10px] text-neutral-400 block">{camp.ctr}% CTR</span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-neutral-900">
                        {camp.conversions}
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-neutral-700">
                        {camp.cpa > 0 ? `${Math.round(camp.cpa)} MAD` : '—'}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        {camp.roas > 0 ? `${camp.roas}x` : '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${recBadge}`}>
                          {recConfig.icon}
                          <span>{recConfig.text}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONNECT ACCOUNTS MODAL */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">
                    Connexion Plateforme Publicitaire
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Liez votre compte Meta, TikTok ou Google Ads
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100"
              >
                <X size={18} />
              </button>
            </div>

            {connectError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{connectError}</span>
              </div>
            )}

            <form onSubmit={handleConnectSave} className="space-y-3.5 text-xs">
              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Plateforme Publicitaire *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setConnectPlatform('META')}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                      connectPlatform === 'META'
                        ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    Meta Ads (FB/IG)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectPlatform('TIKTOK')}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                      connectPlatform === 'TIKTOK'
                        ? 'bg-neutral-900 border-black text-white font-bold'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    TikTok Ads
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectPlatform('GOOGLE')}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                      connectPlatform === 'GOOGLE'
                        ? 'bg-red-50 border-red-300 text-red-800 font-bold'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    Google Ads
                  </button>
                </div>
              </div>

              {/* Account ID */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {connectPlatform === 'META'
                    ? 'Identifiant Compte Publicitaire (act_...)'
                    : connectPlatform === 'TIKTOK'
                    ? 'Advertiser ID TikTok'
                    : 'Customer ID Google Ads (ex: 123-456-7890)'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    connectPlatform === 'META'
                      ? 'act_123456789012345'
                      : connectPlatform === 'TIKTOK'
                      ? '7123456789012345678'
                      : '123-456-7890'
                  }
                  value={connectAccountId}
                  onChange={(e) => setConnectAccountId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>

              {/* Access Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Token d'accès (Access Token API) *
                  </label>
                  {connectPlatform === 'META' && (
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-blue-700 hover:underline flex items-center gap-1"
                    >
                      Graph API Explorer <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="EAA..."
                  value={connectAccessToken}
                  onChange={(e) => setConnectAccessToken(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />

                {connectPlatform === 'META' && (
                  <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-blue-950">
                      <Sparkles size={12} className="text-blue-600" />
                      Permissions Meta Obligatoires :
                    </span>
                    <p className="text-[10.5px] leading-relaxed text-blue-800">
                      Pour que Meta autorise la lecture des campagnes et dépenses, cochez ces 3 permissions dans votre Token :
                    </p>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900 text-[10px]">ads_read</code>
                      <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900 text-[10px]">read_insights</code>
                      <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900 text-[10px]">ads_management</code>
                    </div>
                  </div>
                )}
              </div>

              {/* Currency & Exchange Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Devise du Compte Pub
                  </label>
                  <select
                    value={connectCurrency}
                    onChange={(e) => setConnectCurrency(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-800"
                  >
                    <option value="MAD">MAD (Dirham Marocain)</option>
                    <option value="USD">USD (Dollar Américain $)</option>
                    <option value="EUR">EUR (Euro €)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Taux de conversion vers MAD
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={connectExchangeRate}
                    onChange={(e) => setConnectExchangeRate(e.target.value)}
                    placeholder="10.0"
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-3.5 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={connectLoading}
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {connectLoading && <Loader2 size={13} className="animate-spin" />}
                  <span>Enregistrer & Tester</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL SPEND FAST LOGGER MODAL */}
      {isManualSpendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">
                    Saisie Rapide Charge Ads
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Enregistre la dépense et met à jour automatiquement la Finance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsManualSpendModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualSpendSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Plateforme *
                  </label>
                  <select
                    value={manualPlatform}
                    onChange={(e) => setManualPlatform(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 font-medium"
                  >
                    <option value="META">Meta Ads (FB/IG)</option>
                    <option value="TIKTOK">TikTok Ads</option>
                    <option value="GOOGLE">Google Ads</option>
                    <option value="SNAPCHAT">Snapchat Ads</option>
                    <option value="INFLUENCE">Contrat Influenceur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Date de la dépense *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Montant Dépensé (MAD) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="Ex: 500"
                    value={manualSpend}
                    onChange={(e) => setManualSpend(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Ventes générées (MAD)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="Ex: 2200"
                    value={manualRevenue}
                    onChange={(e) => setManualRevenue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nombre d'Achats / Commandes
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 6"
                    value={manualConversions}
                    onChange={(e) => setManualConversions(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nombre de Clics
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 450"
                    value={manualClicks}
                    onChange={(e) => setManualClicks(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Note / Détails (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Campagne Hook Testeur Baccarat"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                />
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-[11px] text-neutral-600 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Cette dépense s'enregistrera directement dans votre P&L Finance.</span>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualSpendModalOpen(false)}
                  className="px-3.5 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {manualSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>Enregistrer la dépense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CAMPAIGN MODAL */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">
                    Ajouter une Campagne Publicitaire
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Configurez le suivi pour analyser son ROAS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nom de la Campagne *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: [Meta] Bestsellers Testeurs - Advantage+"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Plateforme *
                  </label>
                  <select
                    value={campPlatform}
                    onChange={(e) => setCampPlatform(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 font-medium"
                  >
                    <option value="META">Meta Ads (FB/IG)</option>
                    <option value="TIKTOK">TikTok Ads</option>
                    <option value="GOOGLE">Google Ads</option>
                    <option value="INFLUENCE">Influence & UGC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Budget / Jour (MAD)
                  </label>
                  <input
                    type="number"
                    value={campDailyBudget}
                    onChange={(e) => setCampDailyBudget(e.target.value)}
                    placeholder="300"
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Dépense (MAD)
                  </label>
                  <input
                    type="number"
                    value={campSpend}
                    onChange={(e) => setCampSpend(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Achats
                  </label>
                  <input
                    type="number"
                    value={campConversions}
                    onChange={(e) => setCampConversions(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Ventes (MAD)
                  </label>
                  <input
                    type="number"
                    value={campRevenue}
                    onChange={(e) => setCampRevenue(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-emerald-700 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="px-3.5 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={campSubmitting}
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {campSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>Créer la campagne</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
