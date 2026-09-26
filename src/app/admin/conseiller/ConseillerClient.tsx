'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bot, 
  Sparkles, 
  Search, 
  Filter, 
  TrendingUp, 
  Flame, 
  Gift, 
  Clock, 
  RefreshCw, 
  Download, 
  MessageSquare, 
  HelpCircle, 
  User, 
  CheckCircle2, 
  Trash2, 
  ExternalLink, 
  Copy, 
  ChevronRight, 
  BarChart3, 
  Tag, 
  MapPin, 
  Zap,
  ShoppingBag,
  SlidersHorizontal,
  Compass,
  Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AdvisorMessage {
  id: string;
  role: string;
  content: string;
  recommendedProducts?: string[];
  createdAt: string;
}

interface AdvisorConversation {
  id: string;
  sessionId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerCity?: string | null;
  summary: string;
  intent: string;
  preferredNotes: string[];
  preferredGender: string;
  budget?: string | null;
  recommendedSlugs: string[];
  messagesCount: number;
  createdAt: string;
  updatedAt: string;
  messages: AdvisorMessage[];
}

interface AnalyticsData {
  totalConversations: number;
  totalQuestions: number;
  intentBreakdown: Array<{
    key: string;
    label: string;
    count: number;
    percentage: number;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }>;
  topNotes: Array<{
    note: string;
    count: number;
    percentage: number;
  }>;
  topRecommendedProducts: Array<{
    slug: string;
    count: number;
    name: string;
    brandLabel: string;
    price: number;
    image: string;
    subcategoryLabel: string;
  }>;
  genderStats: {
    homme: number;
    femme: number;
    mixte: number;
    total: number;
  };
  customerQuestions: Array<{
    conversationId: string;
    text: string;
    createdAt: string;
    intent: string;
    summary: string;
  }>;
}

const INTENT_MAP: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  RECOMMENDATION: { label: 'Recommandation Parfum', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Sparkles },
  GIFT_SEARCH: { label: 'Recherche Cadeau', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Gift },
  TESTER_INQUIRY: { label: 'Demande Testeur', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: HelpCircle },
  SILLAGE_PERFUME: { label: 'Tenue & Sillage', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Flame },
  PRICE_SHIPPING: { label: 'Prix & Livraison', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: ShoppingBag },
  COMPLAINT: { label: 'SAV / Commande', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: MessageSquare },
  GENERAL: { label: 'Conseil Général', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', icon: Compass },
};

export default function ConseillerClient({ currentAdmin }: { currentAdmin: any }) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'EXPLORER' | 'QUESTIONS'>('ANALYTICS');
  const [loading, setLoading] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [conversations, setConversations] = useState<AdvisorConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AdvisorConversation | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIntent, setSelectedIntent] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedIntent && selectedIntent !== 'ALL') params.append('intent', selectedIntent);
      if (selectedGender && selectedGender !== 'ALL') params.append('gender', selectedGender);

      const res = await fetch(`/api/admin/conseiller?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
        setConversations(data.conversations || []);
        if (data.conversations && data.conversations.length > 0) {
          if (!selectedConversation || !data.conversations.some((c: any) => c.id === selectedConversation.id)) {
            setSelectedConversation(data.conversations[0]);
          }
        } else {
          setSelectedConversation(null);
        }
      }
    } catch (err) {
      console.error('Erreur chargement données conseiller:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted, selectedIntent, selectedGender]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Auto-refresh live data every 10s
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [mounted, selectedIntent, selectedGender, searchQuery]);

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) return;
    try {
      const res = await fetch(`/api/admin/conseiller/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (selectedConversation?.id === id) {
          const remaining = conversations.filter(c => c.id !== id);
          setSelectedConversation(remaining[0] || null);
        }
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleCopyTranscript = (conv: AdvisorConversation) => {
    const text = conv.messages
      .map(m => `[${m.role === 'user' ? 'CLIENT' : 'CONSEILLER NAY'}] (${new Date(m.createdAt).toLocaleTimeString('fr-FR')}):\n${m.content}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopiedId(conv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (!conversations.length) return;
    const headers = ['ID', 'Date', 'Intention', 'Genre Requis', 'Notes Préférées', 'Produits Recommandés', 'Ville', 'Résumé Question Client'];
    const rows = conversations.map(c => [
      c.id,
      new Date(c.createdAt).toLocaleDateString('fr-FR') + ' ' + new Date(c.createdAt).toLocaleTimeString('fr-FR'),
      c.intent,
      c.preferredGender,
      c.preferredNotes.join('; '),
      c.recommendedSlugs.join('; '),
      c.customerCity || 'Non spécifié',
      `"${c.summary.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `conseiller-nay-rapport-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (isoStr?: string) => {
    if (!mounted || !isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const formatShortDate = (isoStr?: string) => {
    if (!mounted || !isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString('fr-FR');
    } catch {
      return '';
    }
  };

  const formatTime = (isoStr?: string) => {
    if (!mounted || !isoStr) return '';
    try {
      return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const topNote = analytics?.topNotes?.[0];
  const topProduct = analytics?.topRecommendedProducts?.[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6" suppressHydrationWarning>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Conseiller NAY (IA)</h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  100% Données Réelles en Direct
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Analyse en temps réel des questions de vos vrais clients, intentions d'achat et parfums suggérés par l'IA.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={mounted ? loading : false}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Rafraîchir les données"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={mounted ? conversations.length === 0 : true}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#1D9BF0] hover:bg-sky-500 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Exporter en CSV"
          >
            <Download size={14} />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Conversations */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversations IA</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#1D9BF0] flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900">{analytics?.totalConversations || 0}</div>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">En direct</span>
          </div>
          <p className="text-[11px] text-slate-400">Sessions de conseil ouvertes</p>
        </div>

        {/* Questions Posées */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Questions Clients</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HelpCircle size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900">{analytics?.totalQuestions || 0}</div>
            <span className="text-[11px] font-medium text-slate-500">
              ~{analytics?.totalConversations ? (analytics.totalQuestions / analytics.totalConversations).toFixed(1) : 1} / conv
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Interactions & demandes</p>
        </div>

        {/* Note Olfactive N°1 */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Note N°1 Demandée</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-lg font-bold text-slate-900 truncate">
              {topNote ? topNote.note : 'Aucune'}
            </div>
            {topNote && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                {topNote.percentage}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {topNote ? `${topNote.count} requêtes associées` : 'En attente de requêtes'}
          </p>
        </div>

        {/* Top Parfum Recommandé */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Parfum Star</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {topProduct ? topProduct.name : '—'}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {topProduct ? `${topProduct.count} fois proposé par l'IA` : 'Basé sur les requêtes'}
          </p>
        </div>

        {/* Genre ciblé */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cible Genre</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User size={16} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-sky-600">H: {analytics?.genderStats.homme || 0}</span>
            <span className="text-slate-300">•</span>
            <span className="text-pink-600">F: {analytics?.genderStats.femme || 0}</span>
            <span className="text-slate-300">•</span>
            <span className="text-purple-600">U: {analytics?.genderStats.mixte || 0}</span>
          </div>
          <p className="text-[11px] text-slate-400">Répartition des requêtes</p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'ANALYTICS'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={15} />
          <span>Tendances & Préférences Olfactives</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPLORER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'EXPLORER'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare size={15} />
          <span>Explorateur de Conversations ({conversations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('QUESTIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'QUESTIONS'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HelpCircle size={15} />
          <span>Flux des Questions Clients</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & OLFACTORY TRENDS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {(!analytics?.totalConversations || analytics.totalConversations === 0) && (
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white border border-sky-200 text-[#1D9BF0] flex items-center justify-center mx-auto shadow-2xs">
                <Bot size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">En attente des premières conversations réelles</h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto">
                Toutes les données de test ont été supprimées. Dès qu'un vrai client pose une question au <strong>Conseiller NAY</strong> sur la boutique, ses questions, préférences olfactives, intentions d'achat et recommandations apparaîtront ici automatiquement en direct.
              </p>
            </div>
          )}

          {/* Top Olfactory Notes & Customer Intents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes olfactives demandées */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Flame size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Notes & Familles Olfactives en Tête</h3>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Intérêt exprimé</span>
              </div>

              {analytics?.topNotes && analytics.topNotes.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topNotes.map((item, idx) => (
                    <div key={item.note} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 w-4 font-mono">#{idx + 1}</span>
                          {item.note}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">{item.count} demandes</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded text-[11px]">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(item.percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Aucune note olfactive enregistrée pour le moment.
                </div>
              )}
            </div>

            {/* Répartition des intentions d'achat */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#1D9BF0] flex items-center justify-center">
                    <Compass size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Intentions d'Achat & Motivations</h3>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Objectif client</span>
              </div>

              {analytics?.intentBreakdown && analytics.intentBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {analytics.intentBreakdown.map((item) => {
                    const intentMeta = INTENT_MAP[item.key] || INTENT_MAP.GENERAL;
                    const IconComponent = intentMeta.icon;
                    return (
                      <div key={item.key} className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg ${intentMeta.bg} ${intentMeta.text} flex items-center justify-center shrink-0`}>
                            <IconComponent size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{item.label}</div>
                            <div className="text-[11px] text-slate-400">{item.count} conversations</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-slate-900">{item.percentage}%</div>
                          <div className="text-[10px] text-slate-400">du trafic IA</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Aucune intention détectée pour le moment.
                </div>
              )}
            </div>
          </div>

          {/* Top Parfums Recommandés par le Conseiller */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Parfums les Plus Recommandés par l'IA</h3>
                  <p className="text-[11px] text-slate-400">Fragrances proposées aux clients selon leurs critères</p>
                </div>
              </div>
            </div>

            {analytics?.topRecommendedProducts && analytics.topRecommendedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.topRecommendedProducts.map((p, idx) => (
                  <div key={p.slug} className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-all flex flex-col justify-between space-y-3 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">#{idx + 1} Recommandé</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                        {p.count}x
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.brandLabel} • {p.price} DH</div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{p.subcategoryLabel}</span>
                      <Link 
                        href={`/fr/product/${p.slug}`}
                        target="_blank"
                        className="text-[11px] font-medium text-[#1D9BF0] hover:underline flex items-center gap-1"
                      >
                        <span>Voir</span>
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                Aucun produit recommandé pour le moment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXPLORER (2-COLUMN INTERACTIVE CHAT INSPECTOR) */}
      {activeTab === 'EXPLORER' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleSearch} className="flex-1 min-w-[260px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par note (vanille, oud...), mot-clé, produit..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1D9BF0] text-slate-800"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedIntent}
                onChange={(e) => setSelectedIntent(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-[#1D9BF0]"
              >
                <option value="ALL">Toutes les intentions</option>
                <option value="RECOMMENDATION">Recommandations</option>
                <option value="GIFT_SEARCH">Cadeaux</option>
                <option value="TESTER_INQUIRY">Testeurs</option>
                <option value="SILLAGE_PERFUME">Tenue & Sillage</option>
                <option value="PRICE_SHIPPING">Prix & Livraison</option>
                <option value="COMPLAINT">SAV & Questions</option>
              </select>

              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-[#1D9BF0]"
              >
                <option value="ALL">Tous les genres</option>
                <option value="HOMME">Homme</option>
                <option value="FEMME">Femme</option>
                <option value="UNISEXE">Unisexe</option>
              </select>
            </div>
          </div>

          {/* 2-Column Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
            {/* Left Column: Conversations List */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden">
              <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Conversations ({conversations.length})</span>
                <span className="text-[11px] text-slate-400">Tri par date récente</span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[700px] divide-y divide-slate-100 custom-scrollbar">
                {conversations.length > 0 ? (
                  conversations.map((c) => {
                    const isSelected = selectedConversation?.id === c.id;
                    const intentMeta = INTENT_MAP[c.intent] || INTENT_MAP.GENERAL;
                    const formattedDate = new Date(c.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedConversation(c)}
                        className={`p-3.5 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-sky-50/70 border-l-4 border-l-[#1D9BF0]' 
                            : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${intentMeta.bg} ${intentMeta.text} ${intentMeta.border}`}>
                            {intentMeta.label}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
                        </div>

                        <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-relaxed mb-2">
                          {c.summary || 'Demande de conseil parfum'}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {c.preferredNotes && c.preferredNotes.slice(0, 3).map((note) => (
                            <span key={note} className="text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded">
                              #{note}
                            </span>
                          ))}
                          {c.preferredGender && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              {c.preferredGender}
                            </span>
                          )}
                          {c.customerCity && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <MapPin size={9} />
                              {c.customerCity}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                    <Bot size={28} className="mx-auto text-slate-300" />
                    <p>Aucune conversation ne correspond à vos filtres.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Selected Conversation Full Transcript */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden">
              {selectedConversation ? (
                <>
                  {/* Transcript Top Bar */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Session ID:</span>
                        <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {selectedConversation.sessionId || selectedConversation.id.slice(0, 12)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{formatDate(selectedConversation.createdAt)}</span>
                        {selectedConversation.customerCity && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={10} /> {selectedConversation.customerCity}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyTranscript(selectedConversation)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                        title="Copier toute la conversation"
                      >
                        {copiedId === selectedConversation.id ? (
                          <>
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span className="text-emerald-600">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copier</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteConversation(selectedConversation.id)}
                        className="p-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                        title="Supprimer la conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Chips Bar */}
                  <div className="px-4 py-2.5 bg-slate-100/60 border-b border-slate-200/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Profil Détecté :</span>
                    <span className="font-bold bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {selectedConversation.preferredGender}
                    </span>
                    {selectedConversation.preferredNotes.map(n => (
                      <span key={n} className="font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                        Note: {n}
                      </span>
                    ))}
                    {selectedConversation.recommendedSlugs.length > 0 && (
                      <span className="font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                        {selectedConversation.recommendedSlugs.length} Parfums Suggérés
                      </span>
                    )}
                  </div>

                  {/* Chat Messages Log */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[600px] bg-slate-50/30 custom-scrollbar">
                    {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                      selectedConversation.messages.map((m) => (
                        <div 
                          key={m.id} 
                          className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {m.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                              <Bot size={15} />
                            </div>
                          )}

                          <div 
                            className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                              m.role === 'user'
                                ? 'bg-[#1D9BF0] text-white rounded-tr-sm font-medium'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-1 opacity-75 text-[10px]">
                              <span className="font-bold uppercase tracking-wider">
                                {m.role === 'user' ? 'Client' : 'Conseiller NAY'}
                              </span>
                              <span>{formatTime(m.createdAt)}</span>
                            </div>

                            {m.role === 'user' ? (
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            ) : (
                              <div className="space-y-2 text-slate-800">
                                <ReactMarkdown
                                  components={{
                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                    a: ({ node, ...props }) => (
                                      <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1D9BF0] bg-sky-50 px-2 py-0.5 rounded hover:bg-sky-100 transition-colors" {...props} />
                                    ),
                                    strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="pl-4 my-1 space-y-1 list-disc" {...props} />,
                                    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />
                                  }}
                                >
                                  {m.content}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>

                          {m.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-sky-100 text-[#1D9BF0] flex items-center justify-center shrink-0 mt-1">
                              <User size={15} />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        Aucun message dans cette session.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                  <Bot size={36} className="text-slate-300" />
                  <div className="text-sm font-bold text-slate-700">Sélectionnez une conversation</div>
                  <p className="text-xs max-w-sm">
                    Cliquez sur une session à gauche pour inspecter la transcription détaillée et les suggestions du conseiller.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEED DES QUESTIONS CLIENTS */}
      {activeTab === 'QUESTIONS' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verbatims & Questions Réelles des Clients</h3>
              <p className="text-[11px] text-slate-400">Ce que vos visiteurs marocains demandent le plus au conseiller</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {analytics?.customerQuestions?.length || 0} Questions récentes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics?.customerQuestions && analytics.customerQuestions.length > 0 ? (
              analytics.customerQuestions.map((q, idx) => {
                const intentMeta = INTENT_MAP[q.intent] || INTENT_MAP.GENERAL;
                return (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-all bg-slate-50/40 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${intentMeta.bg} ${intentMeta.text} ${intentMeta.border}`}>
                          {intentMeta.label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatShortDate(q.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900 leading-relaxed italic">
                        « {q.text} »
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const target = conversations.find(c => c.id === q.conversationId);
                        if (target) {
                          setSelectedConversation(target);
                          setActiveTab('EXPLORER');
                        }
                      }}
                      className="text-[11px] font-semibold text-[#1D9BF0] hover:underline flex items-center gap-1 pt-2 border-t border-slate-200/60 cursor-pointer"
                    >
                      <span>Voir la conversation complète</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-slate-400 text-xs">
                Aucune question client enregistrée pour l'instant.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
