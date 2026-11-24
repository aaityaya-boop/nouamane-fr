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
  TrendingUp,
  DollarSign,
  RefreshCw,
  Plus,
  Settings,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  Sliders,
  Sparkles,
  PieChart,
  ShoppingCart,
  Zap,
  HelpCircle,
  X,
  Loader2,
  Check,
  Building2,
  PauseCircle,
  Clock,
  Download,
  Unlink,
  ShieldCheck,
  KeyRound,
  Calendar,
  ArrowUpRight,
  Flame,
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
  syncedFromApi?: boolean;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

interface DiscoveredMetaAccount {
  id: string;
  accountId: string;
  name: string;
  currency: string;
  accountStatus: number;
  amountSpentCents: number;
  businessName: string | null;
}

interface Props {
  initialIntegrations: AdIntegration[];
  initialCampaigns: AdCampaignItem[];
  initialDailySpends: AdDailySpendItem[];
  orders: OrderItem[];
}

const ADS_INPUT_CLASS =
  'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c101b] border border-slate-200/90 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#131826] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20 transition-all';

export default function AdsManagerClient({
  initialIntegrations,
  initialCampaigns,
  initialDailySpends,
  orders,
}: Props) {
  const [integrations] = useState<AdIntegration[]>(initialIntegrations);
  const [campaigns] = useState<AdCampaignItem[]>(initialCampaigns);
  const [dailySpends] = useState<AdDailySpendItem[]>(initialDailySpends);

  // Filters & State
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'CAMPAIGNS' | 'EXPENSES'>('CAMPAIGNS');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isManualSpendModalOpen, setIsManualSpendModalOpen] = useState(false);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

  // Connect Modal Form State + Meta Business Discovery
  const [connectPlatform, setConnectPlatform] = useState<'META' | 'TIKTOK' | 'GOOGLE'>('META');
  const [connectAccountId, setConnectAccountId] = useState('');
  const [connectAccountName, setConnectAccountName] = useState('');
  const [connectAccessToken, setConnectAccessToken] = useState('');
  const [connectPixelId, setConnectPixelId] = useState('');
  const [connectCurrency, setConnectCurrency] = useState('USD');
  const [connectExchangeRate, setConnectExchangeRate] = useState('10.0');
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isDiscoveringMeta, setIsDiscoveringMeta] = useState(false);
  const [metaDiscoveryResult, setMetaDiscoveryResult] = useState<{
    user?: { id: string; name: string };
    businesses?: Array<{ id: string; name: string }>;
    adAccounts?: DiscoveredMetaAccount[];
    grantedPermissions?: string[];
    missingPermissions?: string[];
  } | null>(null);

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
  const [campObjective] = useState('CONVERSIONS');
  const [campSubmitting, setCampSubmitting] = useState(false);

  const getIntegration = (platform: string) => integrations.find((i) => i.platform === platform);

  // Open Connect Modal pre-filled for platform
  const openConnectModalFor = (platform: 'META' | 'TIKTOK' | 'GOOGLE') => {
    const existing = getIntegration(platform);
    setConnectPlatform(platform);
    setConnectAccountId(existing?.accountId || '');
    setConnectAccountName(existing?.accountName || '');
    setConnectPixelId(existing?.pixelId || '');
    setConnectCurrency(existing?.currency || 'USD');
    setConnectExchangeRate(existing?.exchangeRateToMAD?.toString() || '10.0');
    setConnectAccessToken('');
    setConnectError(existing?.status === 'ERROR' ? existing.errorMessage || null : null);
    setMetaDiscoveryResult(null);
    setIsConnectModalOpen(true);
  };

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

  // Filtered Daily Spends
  const filteredDailySpends = useMemo(() => {
    return dailySpends.filter((d) => {
      if (selectedPlatform !== 'ALL' && d.platform !== selectedPlatform) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return d.platform.toLowerCase().includes(q) || (d.notes || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [dailySpends, selectedPlatform, searchQuery]);

  // Aggregate Metrics (campaigns + standalone manual daily spends!)
  const metrics = useMemo(() => {
    const standaloneSpends = dailySpends.filter((d) => !d.notes?.includes('API_AUTO'));

    const calcChannel = (platformKey: string) => {
      const campRows = campaigns.filter((c) => c.platform === platformKey);
      const manualRows = standaloneSpends.filter((d) => d.platform === platformKey);
      const spend = campRows.reduce((s, c) => s + c.totalSpend, 0) + manualRows.reduce((s, d) => s + d.spend, 0);
      const revenue = campRows.reduce((s, c) => s + c.conversionValue, 0) + manualRows.reduce((s, d) => s + d.revenue, 0);
      const purchases = campRows.reduce((s, c) => s + c.conversions, 0) + manualRows.reduce((s, d) => s + d.conversions, 0);
      const clicks = campRows.reduce((s, c) => s + c.clicks, 0) + manualRows.reduce((s, d) => s + d.clicks, 0);
      const impressions = campRows.reduce((s, c) => s + c.impressions, 0) + manualRows.reduce((s, d) => s + d.impressions, 0);
      return {
        spend,
        revenue,
        purchases,
        clicks,
        impressions,
        roas: spend > 0 ? (revenue / spend).toFixed(2) : '0',
        cpa: purchases > 0 ? Math.round(spend / purchases) : 0,
      };
    };

    const meta = calcChannel('META');
    const tiktok = calcChannel('TIKTOK');
    const google = calcChannel('GOOGLE');
    const influenceA = calcChannel('INFLUENCE');
    const influenceB = calcChannel('SNAPCHAT');
    const influence = {
      spend: influenceA.spend + influenceB.spend,
      revenue: influenceA.revenue + influenceB.revenue,
      purchases: influenceA.purchases + influenceB.purchases,
    };

    const totalAdSpend = meta.spend + tiktok.spend + google.spend + influence.spend;
    const totalAdRevenue = meta.revenue + tiktok.revenue + google.revenue + influence.revenue;
    const totalImpressions = meta.impressions + tiktok.impressions + google.impressions;
    const totalClicks = meta.clicks + tiktok.clicks + google.clicks;

    const totalStoreRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered' || o.status === 'completed').length;
    const totalOrdersCount = orders.length;

    const blendedROAS = totalAdSpend > 0 ? parseFloat((totalAdRevenue / totalAdSpend).toFixed(2)) : 0;
    const blendedMER = totalAdSpend > 0 ? parseFloat((totalStoreRevenue / totalAdSpend).toFixed(2)) : 0;
    const realCAC =
      deliveredOrdersCount > 0
        ? Math.round(totalAdSpend / deliveredOrdersCount)
        : totalOrdersCount > 0
        ? Math.round(totalAdSpend / totalOrdersCount)
        : 0;
    const overallCPC = totalClicks > 0 ? parseFloat((totalAdSpend / totalClicks).toFixed(2)) : 0;
    const overallCTR = totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

    return {
      totalAdSpend,
      totalAdRevenue,
      totalStoreRevenue,
      totalOrdersCount,
      deliveredOrdersCount,
      blendedROAS,
      blendedMER,
      realCAC,
      overallCPC,
      overallCTR,
      meta,
      tiktok,
      google,
      influence,
    };
  }, [campaigns, dailySpends, orders]);

  // Daily Chart Series
  const spendChartData = useMemo(() => {
    const grouped: Record<string, { date: string; spend: number; revenue: number }> = {};
    [...dailySpends].reverse().forEach((d) => {
      if (selectedPlatform !== 'ALL' && d.platform !== selectedPlatform) return;
      const key = new Date(d.date).toLocaleDateString('fr-FR', { month: 'short', day: '2-digit' });
      if (!grouped[key]) grouped[key] = { date: key, spend: 0, revenue: 0 };
      grouped[key].spend += Math.round(d.spend);
      grouped[key].revenue += Math.round(d.revenue);
    });
    return Object.values(grouped).slice(-20);
  }, [dailySpends, selectedPlatform]);

  // Trigger Sync
  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/ads/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncSuccessMsg('Synchronisation Meta Business & plateformes réussie !');
        window.location.reload();
      } else {
        alert(data.error || 'Erreur lors de la synchronisation');
      }
    } catch {
      alert('Erreur réseau lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  // Discover Meta Business Accounts from pasted token
  const handleDiscoverMeta = async () => {
    if (!connectAccessToken.trim()) {
      setConnectError("Collez d'abord votre Access Token Meta ci-dessous.");
      return;
    }
    setIsDiscoveringMeta(true);
    setConnectError(null);

    try {
      const res = await fetch('/api/admin/ads/meta/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: connectAccessToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMetaDiscoveryResult(data);
        setConnectError(data.error || 'Impossible de lire ce token Meta.');
        return;
      }

      setMetaDiscoveryResult(data);
      if (data.adAccounts && data.adAccounts.length > 0 && !connectAccountId) {
        const first = data.adAccounts[0];
        setConnectAccountId(first.id);
        setConnectAccountName(first.name);
        setConnectCurrency(first.currency || 'USD');
        setConnectExchangeRate(first.currency === 'MAD' ? '1.0' : first.currency === 'EUR' ? '10.8' : '10.0');
      }
    } catch {
      setConnectError('Erreur réseau lors de la vérification du token Meta.');
    } finally {
      setIsDiscoveringMeta(false);
    }
  };

  // Connect Ad Account + Immediately Sync Data & Expenses
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
          accountName: connectAccountName.trim() || undefined,
          accessToken: connectAccessToken.trim() || undefined,
          pixelId: connectPixelId.trim() || null,
          currency: connectCurrency,
          exchangeRateToMAD: parseFloat(connectExchangeRate || '10.0'),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.testResult && !data.testResult.success) {
          setConnectError(data.testResult.error || 'Le compte est enregistré mais le test API a échoué.');
          setConnectLoading(false);
          return;
        }
        // Auto-sync campaigns & expenses immediately when connected!
        await fetch('/api/admin/ads/sync', { method: 'POST' }).catch(() => null);
        setIsConnectModalOpen(false);
        setConnectAccessToken('');
        window.location.reload();
      } else {
        setConnectError(data.error || data.testResult?.error || 'Échec de la connexion.');
      }
    } catch {
      setConnectError('Erreur réseau lors de la configuration.');
    } finally {
      setConnectLoading(false);
    }
  };

  // Disconnect Account
  const handleDisconnectIntegration = async (id: string, label: string) => {
    if (!confirm(`Délier le compte ${label} ?`)) return;
    try {
      const res = await fetch(`/api/admin/ads/integrations?id=${id}`, { method: 'DELETE' });
      if (res.ok) window.location.reload();
    } catch {
      alert('Erreur lors de la déconnexion');
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
        window.location.reload();
      } else {
        alert(data.error || "Erreur lors de l'enregistrement.");
      }
    } catch {
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
    } catch {
      alert('Erreur réseau');
    } finally {
      setCampSubmitting(false);
    }
  };

  // Export Daily Ad Expenses CSV
  const handleExportSpendsCSV = () => {
    const headers = ['Date', 'Plateforme', 'Dépense (MAD)', 'Ventes Attribuées (MAD)', 'Achats', 'Clics', 'ROAS', 'Source / Note'];
    const rows = filteredDailySpends.map((d) =>
      [
        new Date(d.date).toISOString().slice(0, 10),
        d.platform,
        d.spend,
        d.revenue,
        d.conversions,
        d.clicks,
        d.roas,
        `"${(d.notes || (d.syncedFromApi ? 'API Sync' : 'Saisie Manuelle')).replace(/"/g, '""')}"`,
      ].join(';')
    );
    const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Depenses_Pubs_NAY_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const metaInteg = getIntegration('META');
  const metaIsConnected = metaInteg?.status === 'CONNECTED';
  const metaIsError = metaInteg?.status === 'ERROR';

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 font-sans text-slate-900 dark:text-slate-100">
      {/* ── 1. EXECUTIVE HEADER (NAY COMMERCE OS) ───────────────────────── */}
      <div className="nay-enter flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-x-2 gap-y-0.5 mb-1.5 flex-wrap text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-500 dark:text-slate-400">
            <span>NAY PARFUMS · ACQUISITION &amp; ADS</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span
              className={`inline-flex items-center gap-1.5 normal-case tracking-normal font-medium whitespace-nowrap ${
                metaIsConnected
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  metaIsConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {metaIsConnected
                ? `Meta Business (${metaInteg?.accountName || metaInteg?.accountId})`
                : 'Liaison Meta prête'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gestionnaire Publicités &amp; Meta Business
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Connectez votre compte Meta Business, visualisez toutes vos dépenses publicitaires en direct et pilotez votre vrai ROAS &amp; CAC.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsManualSpendModalOpen(true)}
              className="h-10 sm:h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <DollarSign size={14} className="text-[#0ea5e9] shrink-0" />
              <span>Charge Ads</span>
            </button>

            <button
              type="button"
              onClick={() => openConnectModalFor('META')}
              className="h-10 sm:h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#14151f] dark:hover:bg-[#1a1b28] border border-sky-300/80 dark:border-sky-500/30 text-xs font-bold text-[#0284c7] dark:text-[#38bdf8] shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <KeyRound size={14} className="shrink-0" />
              <span>{metaIsConnected ? 'Meta API' : 'Lier Meta'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSyncAll}
            disabled={isSyncing}
            style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
            className="w-full sm:w-auto h-10 sm:h-9 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin shrink-0' : 'shrink-0'} />
            <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser'}</span>
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 2. 4 EXECUTIVE HERO BENTO CARDS ─────────────────────────────── */}
      <div className="nay-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* Card 1: Maison Obsidian Lead Card */}
        <div className="nay-hero-shine nay-card-lift rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group relative overflow-hidden bg-[#0b1322] dark:bg-[#0f172a] text-white border border-slate-800/90 dark:border-sky-500/20 shadow-md">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.12] text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Flame size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300 leading-tight">
                    DÉPENSES PUBLICITAIRES
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                    Meta + TikTok + Google + VIP
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-sky-300 border border-white/[0.12] shrink-0">
                P&amp;L Sync
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-3 mb-1 flex-wrap">
              <div className="text-xl sm:text-[24px] xl:text-[27px] font-bold tracking-tight text-white tabular-nums whitespace-nowrap font-mono">
                {formatMAD(metrics.totalAdSpend)}
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-emerald-300 border border-white/[0.12] tabular-nums">
                CA Pub : {formatMAD(metrics.totalAdRevenue)}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 mt-3 relative z-10">
            <span>Déduit du CA Net</span>
            <Link href="/admin/finance?tab=EXPENSES" className="font-bold text-white bg-white/[0.1] hover:bg-white/[0.18] border border-white/[0.15] px-2.5 py-0.5 rounded-full transition-colors">
              Voir Finance →
            </Link>
          </div>
        </div>

        {/* Card 2: ROAS Global */}
        <div className="nay-card-lift spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <TrendingUp size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    ROAS GLOBAL (BLENDED)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Retour sur investissement pub
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                {metrics.blendedROAS >= 3.5 ? 'Rentable' : metrics.blendedROAS > 0 ? 'Actif' : 'En attente'}
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums font-mono mt-3 mb-2">
              {metrics.blendedROAS > 0 ? `${metrics.blendedROAS}x` : '—'}
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className="nay-progress-fill h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                style={{ width: `${Math.min(100, Math.round(metrics.blendedROAS * 20))}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>Ventes attribuées</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMAD(metrics.totalAdRevenue)}</span>
          </div>
        </div>

        {/* Card 3: Vrai CAC */}
        <div className="nay-card-lift spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[#0ea5e9] shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingCart size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    VRAI CAC / COLIS
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Coût acquisition commande livrée
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-[#0284c7] dark:text-[#38bdf8] bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 shrink-0">
                {metrics.deliveredOrdersCount || metrics.totalOrdersCount} cmd
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight text-slate-900 dark:text-white tabular-nums font-mono mt-3 mb-2">
              {metrics.realCAC > 0 ? formatMAD(metrics.realCAC) : '—'}
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className="nay-progress-fill h-full rounded-full bg-[#0ea5e9] dark:bg-[#38bdf8]"
                style={{ width: `${metrics.realCAC > 0 ? Math.min(100, Math.round((metrics.realCAC / 150) * 100)) : 0}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>CTR : <strong className="text-slate-800 dark:text-slate-200">{metrics.overallCTR}%</strong></span>
            <span>CPC : <strong className="font-mono text-slate-800 dark:text-slate-200">{metrics.overallCPC} MAD</strong></span>
          </div>
        </div>

        {/* Card 4: MER */}
        <div className="nay-card-lift spatial-card aura-hover-purple rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[196px] group">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  <PieChart size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 leading-tight">
                    MER (EFFICIENCE)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    CA Global Boutique / Dépenses Ads
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 shrink-0">
                Global
              </span>
            </div>

            <div className="text-xl sm:text-[24px] xl:text-[27px] font-black tracking-tight text-slate-900 dark:text-white tabular-nums font-mono mt-3 mb-2">
              {metrics.blendedMER > 0 ? `${metrics.blendedMER}x` : '—'}
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className="nay-progress-fill h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
                style={{ width: `${Math.min(100, Math.round(metrics.blendedMER * 15))}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
            <span>CA Total Boutique</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMAD(metrics.totalStoreRevenue)}</span>
          </div>
        </div>
      </div>

      {/* ── 3. META BUSINESS & CANAUX PUBLICITAIRES GRID ───────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
            Canaux d&apos;Acquisition &amp; Comptes Connectés
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Cliquez sur une plateforme pour filtrer ou configurer la synchronisation
          </span>
        </div>

        <div className="nay-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* META BUSINESS CARD (SPOTLIGHT) */}
          {(() => {
            const share = metrics.totalAdSpend > 0 ? Math.round((metrics.meta.spend / metrics.totalAdSpend) * 100) : 0;
            return (
              <div
                className={`nay-card-lift spatial-card rounded-2xl p-5 flex flex-col justify-between space-y-3 border transition-all ${
                  metaIsError
                    ? 'border-rose-400/70 dark:border-rose-500/40 ring-2 ring-rose-500/15'
                    : metaIsConnected
                    ? 'border-[#0ea5e9]/60 ring-1 ring-[#0ea5e9]/20'
                    : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1877F2] to-[#0284c7] text-white flex items-center justify-center font-black text-xs shadow-xs">
                        FB
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">Meta Business Ads</h4>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                          {metaInteg?.accountName || 'Instagram & Facebook'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        metaIsConnected
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          : metaIsError
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {metaIsConnected ? 'Connecté' : metaIsError ? 'Permission Requise' : 'Non lié'}
                    </span>
                  </div>

                  {metaIsError && (
                    <div
                      title={metaInteg?.errorMessage || undefined}
                      className="mt-3 p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-rose-500/25 border-l-2 border-l-rose-500 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                        <AlertTriangle size={12} className="shrink-0" />
                        <span>Autorisation Meta API à renouveler</span>
                      </div>
                      <p className="text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">
                        Le jeton actuel nécessite les droits <code className="font-mono text-[10px] text-slate-700 dark:text-slate-300">ads_read</code> &amp; <code className="font-mono text-[10px] text-slate-700 dark:text-slate-300">read_insights</code>.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">Dépense (Charges) :</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMAD(metrics.meta.spend)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">Ventes attribuées :</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatMAD(metrics.meta.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">ROAS / CPA :</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {metrics.meta.roas}x • {metrics.meta.cpa} MAD
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden pt-0">
                      <div className="nay-progress-fill h-full rounded-full bg-[#1877F2]" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openConnectModalFor('META')}
                    className={`text-xs font-bold transition-colors cursor-pointer ${
                      metaIsError
                        ? 'text-rose-600 dark:text-rose-400 hover:underline'
                        : 'text-[#0284c7] dark:text-[#38bdf8] hover:underline'
                    }`}
                  >
                    {metaIsError ? 'Corriger / Relier →' : metaIsConnected ? 'Paramètres API →' : 'Lier Meta Business →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(selectedPlatform === 'META' ? 'ALL' : 'META')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                      selectedPlatform === 'META'
                        ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {selectedPlatform === 'META' ? 'Actif ✓' : 'Filtrer'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* TIKTOK CARD */}
          {(() => {
            const tiktokInteg = getIntegration('TIKTOK');
            const isConn = tiktokInteg?.status === 'CONNECTED';
            const share = metrics.totalAdSpend > 0 ? Math.round((metrics.tiktok.spend / metrics.totalAdSpend) * 100) : 0;

            return (
              <div className="nay-card-lift spatial-card rounded-2xl p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xs">
                        TT
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">TikTok Ads</h4>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Business Center</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isConn
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {isConn ? 'Connecté' : 'Non lié'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">Dépense (Charges) :</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMAD(metrics.tiktok.spend)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">Ventes attribuées :</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatMAD(metrics.tiktok.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">ROAS / CPA :</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {metrics.tiktok.roas}x • {metrics.tiktok.cpa} MAD
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div className="nay-progress-fill h-full rounded-full bg-slate-800 dark:bg-slate-200" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openConnectModalFor('TIKTOK')}
                    className="text-xs font-bold text-[#0284c7] dark:text-[#38bdf8] hover:underline cursor-pointer"
                  >
                    {isConn ? 'Paramètres API →' : 'Lier le compte →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(selectedPlatform === 'TIKTOK' ? 'ALL' : 'TIKTOK')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                      selectedPlatform === 'TIKTOK'
                        ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {selectedPlatform === 'TIKTOK' ? 'Actif ✓' : 'Filtrer'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* GOOGLE CARD */}
          {(() => {
            const googleInteg = getIntegration('GOOGLE');
            const isConn = googleInteg?.status === 'CONNECTED';
            const share = metrics.totalAdSpend > 0 ? Math.round((metrics.google.spend / metrics.totalAdSpend) * 100) : 0;

            return (
              <div className="nay-card-lift spatial-card rounded-2xl p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-black text-xs">
                        GG
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">Google Ads</h4>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Search &amp; Shopping</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isConn
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {isConn ? 'Connecté' : 'Non lié'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">Dépense (Charges) :</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMAD(metrics.google.spend)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">Ventes attribuées :</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatMAD(metrics.google.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">ROAS / CPA :</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {metrics.google.roas}x • {metrics.google.cpa} MAD
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div className="nay-progress-fill h-full rounded-full bg-rose-500" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openConnectModalFor('GOOGLE')}
                    className="text-xs font-bold text-[#0284c7] dark:text-[#38bdf8] hover:underline cursor-pointer"
                  >
                    {isConn ? 'Paramètres API →' : 'Lier le compte →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(selectedPlatform === 'GOOGLE' ? 'ALL' : 'GOOGLE')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                      selectedPlatform === 'GOOGLE'
                        ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {selectedPlatform === 'GOOGLE' ? 'Actif ✓' : 'Filtrer'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* INFLUENCE & VIP CARD */}
          {(() => {
            const share = metrics.totalAdSpend > 0 ? Math.round((metrics.influence.spend / metrics.totalAdSpend) * 100) : 0;
            return (
              <div className="nay-card-lift spatial-card rounded-2xl p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-xs">
                        VIP
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">Influence &amp; VIP</h4>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Ambassadeurs &amp; UGC</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      Actif
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">Dépense (Cachets) :</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMAD(metrics.influence.spend)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">Ventes attribuées :</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatMAD(metrics.influence.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 dark:text-slate-400">Portail Ambassadeurs :</span>
                      <Link href="/admin/affiliates" className="text-xs font-bold text-[#0284c7] dark:text-[#38bdf8] hover:underline">
                        Virements →
                      </Link>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div className="nay-progress-fill h-full rounded-full bg-amber-500" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <Link href="/admin/creatives" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0ea5e9]">
                    Ads Vault UGC →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(selectedPlatform === 'INFLUENCE' ? 'ALL' : 'INFLUENCE')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                      selectedPlatform === 'INFLUENCE'
                        ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {selectedPlatform === 'INFLUENCE' ? 'Actif ✓' : 'Filtrer'}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── 4. LIVE SPEND & ATTRIBUTION CURVE (RECHARTS) ─────────────────── */}
      {spendChartData.length > 0 && (
        <div className="nay-enter spatial-card bg-white dark:bg-[#101524] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                Courbe des Dépenses Publicitaires &amp; Revenus Attribués
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Suivi quotidien synchronisé depuis Meta Business Manager &amp; saisies manuelles
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#0284c7] dark:text-[#38bdf8]">
              {spendChartData.length} jour(s) tracés
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="adsSpendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="adsRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `${v} DH`} />
                <Tooltip
                  formatter={(val: any) => [`${val} MAD`]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid rgba(148,163,184,0.2)',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" name="Ventes Attribuées" stroke="#10b981" strokeWidth={2.2} fill="url(#adsRevGrad)" />
                <Area type="monotone" dataKey="spend" name="Dépense Ads" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#adsSpendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 5. WORKSPACE TABS: CAMPAIGNS vs ALL EXPENSES LEDGER ───────────── */}
      <div className="nay-enter spatial-card rounded-2xl p-1.5 flex items-center justify-between gap-2 overflow-x-auto border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#101524]">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'CAMPAIGNS' as const, label: `Campagnes Actives (${filteredCampaigns.length})` },
            { id: 'EXPENSES' as const, label: `Journal Dépenses & Historique Meta (${filteredDailySpends.length})` },
          ].map((tab) => {
            const isActive = activeWorkspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWorkspaceTab(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="ads-workspace-tab"
                    transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] shadow-[0_4px_14px_rgba(14,165,233,0.35)]"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 pr-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Canal actif :</span>
          <strong className="text-[#0284c7] dark:text-[#38bdf8]">{selectedPlatform === 'ALL' ? 'Tous' : selectedPlatform}</strong>
        </div>
      </div>

      {/* ── 6. TABLE CARD (CAMPAIGNS OR DAILY EXPENSES) ─────────────────── */}
      <div className="nay-enter spatial-card bg-white dark:bg-[#101524] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-[#0c0f1a]/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {activeWorkspaceTab === 'CAMPAIGNS' ? 'Tableau de Bord des Campagnes' : 'Grand Livre des Dépenses Publicitaires'}
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {activeWorkspaceTab === 'CAMPAIGNS'
                ? 'Campagnes Actives & Décisions Stratégiques'
                : 'Toutes les Dépenses Quotidiennes Meta, TikTok & Google'}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 bg-white dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0ea5e9] w-48"
              />
            </div>

            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous les canaux</option>
              <option value="META">Meta Ads (FB/IG)</option>
              <option value="TIKTOK">TikTok Ads</option>
              <option value="GOOGLE">Google Ads</option>
              <option value="INFLUENCE">Influence &amp; UGC</option>
            </select>

            {activeWorkspaceTab === 'CAMPAIGNS' ? (
              <>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-[#0c0f1a] border border-slate-200/80 dark:border-white/10 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="ACTIVE">Actives</option>
                  <option value="PAUSED">En pause</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_4px_12px_rgba(14,165,233,0.3)]"
                >
                  <Plus size={14} />
                  <span>Créer Suivi Campagne</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleExportSpendsCSV}
                className="px-3.5 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download size={13} className="text-[#0ea5e9]" />
                <span>Export CSV Dépenses</span>
              </button>
            )}
          </div>
        </div>

        {activeWorkspaceTab === 'CAMPAIGNS' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#0c0f1a]/80 text-slate-500 dark:text-slate-400 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-3.5 px-5">Campagne &amp; Canal</th>
                  <th className="py-3.5 px-3">Statut</th>
                  <th className="py-3.5 px-3 text-right">Budget / Jour</th>
                  <th className="py-3.5 px-3 text-right">Dépense (MAD)</th>
                  <th className="py-3.5 px-3 text-right">Clics / CTR</th>
                  <th className="py-3.5 px-3 text-right">Achats</th>
                  <th className="py-3.5 px-3 text-right">CPA</th>
                  <th className="py-3.5 px-3 text-right">ROAS</th>
                  <th className="py-3.5 px-5 text-center">Décision Recommandée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-slate-400">
                      <HelpCircle size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Aucune campagne trouvée</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Liez votre compte Meta Business ci-dessus ou ajoutez manuellement une campagne / charge.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((camp) => {
                    const platformBadge =
                      camp.platform === 'META'
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                        : camp.platform === 'TIKTOK'
                        ? 'bg-slate-900 text-white border-slate-700 dark:bg-white/10'
                        : camp.platform === 'GOOGLE'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';

                    const recBadge =
                      camp.recommendation === 'SCALE'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                        : camp.recommendation === 'OPTIMIZE'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                        : camp.recommendation === 'PAUSE'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10';

                    const recConfig =
                      camp.recommendation === 'SCALE'
                        ? { text: 'SCALE UP', icon: <TrendingUp size={11} className="text-emerald-500" /> }
                        : camp.recommendation === 'OPTIMIZE'
                        ? { text: 'OPTIMISER', icon: <Zap size={11} className="text-amber-500" /> }
                        : camp.recommendation === 'PAUSE'
                        ? { text: 'STOP / PAUSE', icon: <PauseCircle size={11} className="text-rose-500" /> }
                        : { text: 'EN TEST', icon: <Clock size={11} className="text-slate-400" /> };

                    return (
                      <tr key={camp.id} className="hover:bg-sky-500/[0.03] dark:hover:bg-sky-500/[0.06] transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${platformBadge}`}>
                              {camp.platform}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs" title={camp.name}>
                              {camp.name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              camp.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                            }`}
                          >
                            {camp.status === 'ACTIVE' ? 'Actif' : 'En pause'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                          {camp.dailyBudget > 0 ? formatMAD(camp.dailyBudget) : '—'}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatMAD(camp.totalSpend)}
                        </td>

                        <td className="py-3.5 px-3 text-right text-slate-600 dark:text-slate-300 font-mono">
                          <span>{camp.clicks}</span>
                          <span className="text-[10px] text-slate-400 block font-sans">{camp.ctr}% CTR</span>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {camp.conversions}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                          {camp.cpa > 0 ? `${Math.round(camp.cpa)} MAD` : '—'}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {camp.roas > 0 ? `${camp.roas}x` : '—'}
                        </td>

                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${recBadge}`}>
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
        ) : (
          /* TAB 2: ALL DAILY AD EXPENSES LEDGER */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#0c0f1a]/80 text-slate-500 dark:text-slate-400 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-4">Plateforme</th>
                  <th className="py-3.5 px-4 text-right">Dépense (MAD)</th>
                  <th className="py-3.5 px-4 text-right">Ventes Attribuées</th>
                  <th className="py-3.5 px-4 text-right">Impressions / Clics</th>
                  <th className="py-3.5 px-4 text-right">ROAS</th>
                  <th className="py-3.5 px-5">Note &amp; Statut P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredDailySpends.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-400">
                      <Calendar size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Aucune dépense enregistrée</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Synchronisez Meta Business ou utilisez « Saisie Charge Ads » pour historiser vos dépenses.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDailySpends.map((d) => (
                    <tr key={d.id} className="hover:bg-sky-500/[0.03] dark:hover:bg-sky-500/[0.06] transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                        {new Date(d.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-[#0284c7] dark:text-[#38bdf8] border border-sky-500/20 text-[10px] font-bold">
                          {d.platform}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        -{formatMAD(d.spend)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMAD(d.revenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        {d.impressions.toLocaleString('fr-FR')} imp. • {d.clicks} clics
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {d.roas > 0 ? `${d.roas}x` : '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-xs">
                            {d.notes || (d.syncedFromApi ? 'Meta Graph API' : 'Saisie manuelle')}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold shrink-0">
                            <CheckCircle2 size={10} /> Finance
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL 1: LINK META BUSINESS / AD PLATFORMS ───────────────────── */}
      <AnimatePresence>
        {isConnectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConnectModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="relative z-10 bg-white dark:bg-[#111624] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-white/10 space-y-5 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center shadow-xs">
                    <Sliders size={17} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">
                      Connexion Meta Business &amp; API Ads
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Détection automatique de vos comptes publicitaires &amp; synchronisation des dépenses
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {connectError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>{connectError}</span>
                </div>
              )}

              <form onSubmit={handleConnectSave} className="space-y-4 text-xs">
                {/* Platform Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Plateforme Publicitaire *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['META', 'TIKTOK', 'GOOGLE'] as const).map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setConnectPlatform(plat)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          connectPlatform === plat
                            ? 'bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white border-[#0ea5e9] shadow-xs'
                            : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {plat === 'META' ? 'Meta Business' : plat === 'TIKTOK' ? 'TikTok Ads' : 'Google Ads'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Access Token + One-click Discovery for Meta Business */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Access Token {connectPlatform === 'META' ? 'Meta Business / System User' : 'API'}
                    </label>
                    {connectPlatform === 'META' && (
                      <div className="flex items-center gap-3">
                        <a
                          href="https://business.facebook.com/settings/system-users"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#0284c7] dark:text-[#38bdf8] hover:underline flex items-center gap-1"
                        >
                          Business Suite <ExternalLink size={10} />
                        </a>
                        <a
                          href="https://developers.facebook.com/tools/explorer/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-slate-500 hover:underline flex items-center gap-1"
                        >
                          Graph Explorer <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={metaInteg?.accessToken ? 'Laisser vide pour conserver le token actuel ou coller nouveau EAA...' : 'Coller le Token Meta (EAA...)'}
                      value={connectAccessToken}
                      onChange={(e) => setConnectAccessToken(e.target.value)}
                      className={`${ADS_INPUT_CLASS} font-mono flex-1`}
                    />
                    {connectPlatform === 'META' && (
                      <button
                        type="button"
                        onClick={handleDiscoverMeta}
                        disabled={isDiscoveringMeta || !connectAccessToken.trim()}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-[#0ea5e9] hover:opacity-90 text-white font-bold text-xs whitespace-nowrap flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        {isDiscoveringMeta ? <Loader2 size={13} className="animate-spin" /> : <Building2 size={13} />}
                        <span>Détecter Comptes</span>
                      </button>
                    )}
                  </div>

                  {/* Discovered Meta Business Portfolios & Accounts */}
                  {connectPlatform === 'META' && metaDiscoveryResult && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0c101b] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                      {metaDiscoveryResult.user && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            Profil Meta : {metaDiscoveryResult.user.name}
                          </span>
                          <div className="flex gap-1">
                            {['ads_read', 'read_insights'].map((perm) => {
                              const ok = metaDiscoveryResult.grantedPermissions?.includes(perm);
                              return (
                                <span
                                  key={perm}
                                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                                    ok ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'
                                  }`}
                                >
                                  {perm} {ok ? '✓' : '✕'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {metaDiscoveryResult.adAccounts && metaDiscoveryResult.adAccounts.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                            Sélectionnez votre Compte Publicitaire ({metaDiscoveryResult.adAccounts.length}) :
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-1.5">
                            {metaDiscoveryResult.adAccounts.map((acc) => {
                              const selected = connectAccountId === acc.id || connectAccountId === `act_${acc.accountId}`;
                              return (
                                <button
                                  key={acc.id}
                                  type="button"
                                  onClick={() => {
                                    setConnectAccountId(acc.id);
                                    setConnectAccountName(acc.name);
                                    setConnectCurrency(acc.currency || 'USD');
                                    setConnectExchangeRate(acc.currency === 'MAD' ? '1.0' : acc.currency === 'EUR' ? '10.8' : '10.0');
                                  }}
                                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                                    selected
                                      ? 'bg-sky-500/10 border-[#0ea5e9] ring-1 ring-[#0ea5e9]'
                                      : 'bg-white dark:bg-[#131826] border-slate-200 dark:border-white/10 hover:border-sky-300'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white truncate">{acc.name}</div>
                                    <div className="text-[10px] font-mono text-slate-500">
                                      {acc.id} {acc.businessName ? `• ${acc.businessName}` : ''}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 ml-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10">
                                      {acc.currency}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {connectPlatform === 'META' && !metaDiscoveryResult && (
                    <div className="mt-2.5 p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-[#0284c7] dark:text-[#38bdf8]">
                        <Sparkles size={13} />
                        Comment générer un Token Meta Business permanent :
                      </span>
                      <p className="text-[10.5px] leading-relaxed">
                        Dans <strong>Meta Business Suite → Paramètres d&apos;entreprise → Utilisateurs système</strong>, générez un token avec les permissions{' '}
                        <code className="px-1 py-0.2 rounded bg-white dark:bg-white/10 font-mono font-bold">ads_read</code> +{' '}
                        <code className="px-1 py-0.2 rounded bg-white dark:bg-white/10 font-mono font-bold">read_insights</code>, collez-le ci-dessus et cliquez sur <strong>Détecter Comptes</strong>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Account ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {connectPlatform === 'META'
                      ? 'Identifiant Compte Publicitaire (act_...)'
                      : connectPlatform === 'TIKTOK'
                      ? 'Advertiser ID TikTok'
                      : 'Customer ID Google Ads'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={connectPlatform === 'META' ? 'act_123456789012345' : '1234567890'}
                    value={connectAccountId}
                    onChange={(e) => setConnectAccountId(e.target.value)}
                    className={`${ADS_INPUT_CLASS} font-mono`}
                  />
                </div>

                {/* Currency & Exchange Rate */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Devise du Compte</label>
                    <select
                      value={connectCurrency}
                      onChange={(e) => {
                        const c = e.target.value;
                        setConnectCurrency(c);
                        setConnectExchangeRate(c === 'MAD' ? '1.0' : c === 'EUR' ? '10.8' : '10.0');
                      }}
                      className={ADS_INPUT_CLASS}
                    >
                      <option value="MAD">MAD (Dirham Marocain)</option>
                      <option value="USD">USD (Dollar Américain $)</option>
                      <option value="EUR">EUR (Euro €)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Taux de conversion → MAD</label>
                    <input
                      type="number"
                      step="0.01"
                      value={connectExchangeRate}
                      onChange={(e) => setConnectExchangeRate(e.target.value)}
                      placeholder="10.0"
                      className={`${ADS_INPUT_CLASS} font-mono`}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                  <div>
                    {getIntegration(connectPlatform) && (
                      <button
                        type="button"
                        onClick={() => handleDisconnectIntegration(getIntegration(connectPlatform)!.id, connectPlatform)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-500/10 text-xs font-bold cursor-pointer"
                      >
                        <Unlink size={13} />
                        <span>Délier</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConnectModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={connectLoading}
                      className="px-4 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white rounded-xl text-xs font-bold shadow-[0_4px_14px_rgba(14,165,233,0.35)] transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {connectLoading && <Loader2 size={13} className="animate-spin" />}
                      <span>Enregistrer &amp; Synchroniser</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: MANUAL SPEND FAST LOGGER ───────────────────────────── */}
      <AnimatePresence>
        {isManualSpendModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManualSpendModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="relative z-10 bg-white dark:bg-[#111624] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-white/10 space-y-4 text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-[#0ea5e9] flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Saisie Rapide Charge Ads</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Synchronisation automatique avec Finance P&amp;L</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualSpendModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleManualSpendSave} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Plateforme *</label>
                    <select
                      value={manualPlatform}
                      onChange={(e) => setManualPlatform(e.target.value as any)}
                      className={ADS_INPUT_CLASS}
                    >
                      <option value="META">Meta Ads (FB/IG)</option>
                      <option value="TIKTOK">TikTok Ads</option>
                      <option value="GOOGLE">Google Ads</option>
                      <option value="SNAPCHAT">Snapchat Ads</option>
                      <option value="INFLUENCE">Contrat Influenceur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className={ADS_INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Montant Dépensé (MAD) *</label>
                    <input
                      type="number"
                      step="1"
                      required
                      placeholder="Ex: 500"
                      value={manualSpend}
                      onChange={(e) => setManualSpend(e.target.value)}
                      className={`${ADS_INPUT_CLASS} font-mono font-bold`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ventes générées (MAD)</label>
                    <input
                      type="number"
                      step="1"
                      placeholder="Ex: 2200"
                      value={manualRevenue}
                      onChange={(e) => setManualRevenue(e.target.value)}
                      className={`${ADS_INPUT_CLASS} font-mono font-bold text-emerald-600 dark:text-emerald-400`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre d&apos;Achats</label>
                    <input
                      type="number"
                      placeholder="Ex: 6"
                      value={manualConversions}
                      onChange={(e) => setManualConversions(e.target.value)}
                      className={ADS_INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre de Clics</label>
                    <input
                      type="number"
                      placeholder="Ex: 450"
                      value={manualClicks}
                      onChange={(e) => setManualClicks(e.target.value)}
                      className={ADS_INPUT_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Note / Détails</label>
                  <input
                    type="text"
                    placeholder="Ex: Campagne Testeur Baccarat"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className={ADS_INPUT_CLASS}
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManualSpendModalOpen(false)}
                    className="px-3.5 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={manualSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {manualSubmitting && <Loader2 size={13} className="animate-spin" />}
                    <span>Enregistrer la dépense</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: NEW CAMPAIGN MODAL ────────────────────────────────── */}
      <AnimatePresence>
        {isNewCampaignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewCampaignModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="relative z-10 bg-white dark:bg-[#111624] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-white/10 space-y-4 text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-[#0ea5e9] flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Ajouter une Campagne Publicitaire</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Configurez le suivi pour analyser son ROAS</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de la Campagne *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: [Meta] Bestsellers Testeurs - Advantage+"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    className={ADS_INPUT_CLASS}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Plateforme *</label>
                    <select
                      value={campPlatform}
                      onChange={(e) => setCampPlatform(e.target.value as any)}
                      className={ADS_INPUT_CLASS}
                    >
                      <option value="META">Meta Ads (FB/IG)</option>
                      <option value="TIKTOK">TikTok Ads</option>
                      <option value="GOOGLE">Google Ads</option>
                      <option value="INFLUENCE">Influence &amp; UGC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Budget / Jour (MAD)</label>
                    <input
                      type="number"
                      value={campDailyBudget}
                      onChange={(e) => setCampDailyBudget(e.target.value)}
                      className={ADS_INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dépense (MAD)</label>
                    <input
                      type="number"
                      value={campSpend}
                      onChange={(e) => setCampSpend(e.target.value)}
                      className={`${ADS_INPUT_CLASS} font-bold font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Achats</label>
                    <input
                      type="number"
                      value={campConversions}
                      onChange={(e) => setCampConversions(e.target.value)}
                      className={`${ADS_INPUT_CLASS} font-bold font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ventes (MAD)</label>
                    <input
                      type="number"
                      value={campRevenue}
                      onChange={(e) => setCampRevenue(e.target.value)}
                      className={`${ADS_INPUT_CLASS} font-bold font-mono text-emerald-600 dark:text-emerald-400`}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewCampaignModalOpen(false)}
                    className="px-3.5 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={campSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {campSubmitting && <Loader2 size={13} className="animate-spin" />}
                    <span>Créer la campagne</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
