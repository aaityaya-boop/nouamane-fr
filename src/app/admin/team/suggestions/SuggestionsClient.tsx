'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  Sparkles,
  ThumbsUp,
  MessageSquare,
  Award,
  Filter,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Check,
  AlertCircle,
  TrendingUp,
  User,
  ShieldCheck,
  Flame,
  Zap,
  Package,
  ShoppingBag,
  DollarSign,
  HeartHandshake,
  Compass,
  Building,
  Send,
  X,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Download,
  ExternalLink
} from 'lucide-react';
import { formatDateGMT } from '@/lib/dateUtils';
import AttachmentUploader from '../components/AttachmentUploader';
import ImageLightboxModal from '../components/ImageLightboxModal';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  status: string;
  isAnonymous: boolean;
  authorId?: string | null;
  authorName: string;
  authorRole?: string | null;
  authorAvatar?: string | null;
  likesCount: number;
  likedBy: string;
  attachments?: string;
  adminFeedback?: string | null;
  rewardNotes?: string | null;
  implementedAt?: string | null;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    role: string;
    avatar?: string | null;
    jobTitle?: string | null;
  } | null;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  SALES_BOOST: { label: 'Ventes & Chiffre d\'Affaires', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  LOGISTICS_PACKAGING: { label: 'Logistique & Packaging', icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  MARKETING_ADS: { label: 'Marketing & Publicité', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  PRODUCT_CURATION: { label: 'Curation Parfums & Offres', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  CUSTOMER_EXP: { label: 'Expérience & Fidélisation Client', icon: HeartHandshake, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  WORK_ENVIRONMENT: { label: 'Cadre de Travail & Équipe', icon: Building, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  COST_SAVINGS: { label: 'Économies & Optimisation Coûts', icon: DollarSign, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  DIGITAL_TECH: { label: 'Tech, Boutique & Digital', icon: Zap, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  OTHER: { label: 'Autre Idée', icon: Compass, color: 'text-slate-600 bg-slate-50 border-slate-200' },
};

const IMPACT_MAP: Record<string, { label: string; badge: string }> = {
  LOW: { label: 'Impact Modeste', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  MEDIUM: { label: 'Impact Moyen', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  HIGH: { label: 'Fort Impact', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  GAME_CHANGER: { label: '⚡ Game Changer', badge: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' },
};

const STATUS_MAP: Record<string, { label: string; badge: string; dot: string }> = {
  SUBMITTED: { label: 'Soumise', badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  UNDER_REVIEW: { label: 'En Examen', badge: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  APPROVED: { label: 'Approuvée', badge: 'bg-sky-50 text-sky-800 border-sky-200', dot: 'bg-[#1D9BF0]' },
  IN_PROGRESS: { label: 'En Cours de Déploiement', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
  IMPLEMENTED: { label: 'Déployée & Réalisée', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Non Retenue', badge: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
};

export default function SuggestionsClient({ currentAdmin }: { currentAdmin: any }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCount: 0, approvedCount: 0, implementedCount: 0, totalLikes: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [impactFilter, setImpactFilter] = useState('ALL');

  // Modals & Lightbox
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState('');

  // Form states for new suggestion
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('SALES_BOOST');
  const [newImpact, setNewImpact] = useState('HIGH');
  const [newIsAnonymous, setNewIsAnonymous] = useState(false);
  const [newAttachments, setNewAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form states for review
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewReward, setReviewReward] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (impactFilter !== 'ALL') params.set('impact', impactFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/team/suggestions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSuggestions(data.suggestions);
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.error('Erreur chargement suggestions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [categoryFilter, statusFilter, impactFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSuggestions();
  };

  const handleToggleLike = async (suggestionId: string) => {
    try {
      const res = await fetch(`/api/admin/team/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_LIKE' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSuggestions(prev => prev.map(s => s.id === suggestionId ? {
            ...s,
            likesCount: data.suggestion.likesCount,
            likedBy: data.suggestion.likedBy
          } : s));
        }
      }
    } catch (e) {
      console.error('Erreur like:', e);
    }
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/team/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          impact: newImpact,
          isAnonymous: newIsAnonymous,
          attachments: newAttachments
        })
      });

      if (res.ok) {
        setIsSubmitOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewCategory('SALES_BOOST');
        setNewImpact('HIGH');
        setNewIsAnonymous(false);
        setNewAttachments([]);
        fetchSuggestions();
      }
    } catch (e) {
      console.error('Erreur soumission suggestion:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuggestion) return;

    try {
      setReviewing(true);
      const res = await fetch(`/api/admin/team/suggestions/${selectedSuggestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          adminFeedback: reviewFeedback,
          rewardNotes: reviewReward
        })
      });

      if (res.ok) {
        setIsReviewOpen(false);
        setSelectedSuggestion(null);
        fetchSuggestions();
      }
    } catch (e) {
      console.error('Erreur revue suggestion:', e);
    } finally {
      setReviewing(false);
    }
  };

  const openReviewModal = (s: Suggestion) => {
    setSelectedSuggestion(s);
    setReviewStatus(s.status);
    setReviewFeedback(s.adminFeedback || '');
    setReviewReward(s.rewardNotes || '');
    setIsReviewOpen(true);
  };

  const handleExportCSV = () => {
    if (!suggestions.length) return;
    const headers = ['ID', 'Date (Casablanca)', 'Auteur', 'Catégorie', 'Impact', 'Statut', 'Likes', 'Titre', 'Description', 'Avis Direction', 'Récompense'];
    const rows = suggestions.map(s => [
      s.id,
      formatDateGMT(s.createdAt),
      s.isAnonymous ? 'Anonyme' : s.authorName,
      CATEGORY_MAP[s.category]?.label || s.category,
      IMPACT_MAP[s.impact]?.label || s.impact,
      STATUS_MAP[s.status]?.label || s.status,
      s.likesCount,
      `"${s.title.replace(/"/g, '""')}"`,
      `"${s.description.replace(/"/g, '""')}"`,
      `"${(s.adminFeedback || '').replace(/"/g, '""')}"`,
      `"${(s.rewardNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `suggestions-idees-equipe-nay-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isOwner = currentAdmin?.isOwner || currentAdmin?.role === 'OWNER' || currentAdmin?.role === 'HR_MANAGER';

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* ── 1. MODULE SUB-NAVIGATION TABS ────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <Link
          href="/admin/team/suggestions"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xs"
        >
          <Lightbulb size={14} className="text-amber-400" />
          <span>Boîte à Idées & Suggestions</span>
        </Link>
        <Link
          href="/admin/team/reclamations"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-xs transition-colors"
        >
          <AlertCircle size={14} className="text-rose-500" />
          <span>Réclamations & Tickets RH</span>
        </Link>
        <Link
          href="/admin/team"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-xs transition-colors"
        >
          <ShieldCheck size={14} className="text-slate-500" />
          <span>Gestion Équipe & Salaires</span>
        </Link>
        <Link
          href="/admin/team/roles"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-xs transition-colors hidden sm:inline-flex"
        >
          <User size={14} className="text-slate-500" />
          <span>Annuaire des Rôles (26)</span>
        </Link>
      </div>

      {/* ── 2. HEADER & ACTION BUTTONS ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              NAY Parfums • Espace Collaboratif
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
              <Lightbulb size={11} className="text-amber-500" />
              Innovation & Initiatives
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Boîte à Idées de l'Équipe</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Proposez vos idées pour booster les ventes, optimiser la logistique, embellir le packaging ou améliorer notre quotidien. Chaque initiative est étudiée et récompensée.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer"
            title="Exporter la boîte à idées en CSV"
          >
            <Download size={13} className="text-slate-500" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={() => setIsSubmitOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} className="text-amber-400" />
            <span>+ Proposer une Idée</span>
          </button>
        </div>
      </div>

      {/* ── 3. METRIC STAT CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Suggestions</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Lightbulb size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Idées soumises par l'équipe</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Validées / En Cours</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <Zap size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold text-sky-700 tracking-tight">{stats.approvedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">En phase d'intégration</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Déployées avec Succès</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">{stats.implementedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Projets concrétisés</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Soutien & Likes</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <ThumbsUp size={14} />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-700 tracking-tight">{stats.totalLikes}</div>
          <p className="text-[11px] text-slate-400 mt-1">Votes d'adhésion collègues</p>
        </div>
      </div>

      {/* ── 4. FILTERS & SEARCH BAR ────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une idée, un auteur..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Toutes les Catégories</option>
            {Object.entries(CATEGORY_MAP).map(([key, c]) => (
              <option key={key} value={key}>{c.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tous les Statuts</option>
            {Object.entries(STATUS_MAP).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>

          {/* Impact Filter */}
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tous les Impacts</option>
            {Object.entries(IMPACT_MAP).map(([key, imp]) => (
              <option key={key} value={key}>{imp.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 5. SUGGESTIONS LIST / GRID ─────────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Lightbulb size={32} className="mx-auto text-slate-300 animate-pulse mb-3" />
          <p className="text-sm font-medium text-slate-600">Chargement des idées...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Lightbulb size={36} className="mx-auto text-amber-400/60 mb-3" />
          <p className="text-base font-bold text-slate-700">Aucune idée trouvée pour ces critères</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Soyez le premier à proposer une idée d'amélioration pour la Maison NAY Parfums !
          </p>
          <button
            onClick={() => setIsSubmitOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus size={14} />
            <span>Proposer une Idée</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion) => {
            const cat = CATEGORY_MAP[suggestion.category] || CATEGORY_MAP.OTHER;
            const CatIcon = cat.icon;
            const imp = IMPACT_MAP[suggestion.impact] || IMPACT_MAP.MEDIUM;
            const st = STATUS_MAP[suggestion.status] || STATUS_MAP.SUBMITTED;
            
            let likedArray: string[] = [];
            try {
              likedArray = JSON.parse(suggestion.likedBy || '[]');
            } catch {
              likedArray = [];
            }
            const hasUserLiked = likedArray.includes(currentAdmin?.id);

            let attachList: string[] = [];
            try {
              attachList = JSON.parse(suggestion.attachments || '[]');
            } catch {
              attachList = [];
            }

            return (
              <div
                key={suggestion.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cat.color}`}>
                      <CatIcon size={12} />
                      <span>{cat.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${imp.badge}`}>
                        {imp.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${st.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug mb-2">
                    {suggestion.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mb-3">
                    {suggestion.description}
                  </p>

                  {/* Visual Attachments if present */}
                  {attachList.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {attachList.map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setLightboxUrl(url);
                              setLightboxTitle(`${suggestion.title} - Visuel #${idx + 1}`);
                            }}
                            className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square group cursor-pointer shadow-xs bg-slate-100"
                          >
                            <img
                              src={url}
                              alt={`Visuel ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ExternalLink size={14} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Feedback Box if present */}
                  {suggestion.adminFeedback && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs mb-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                        <Award size={13} className="text-amber-500" />
                        <span>Avis & Décision Direction</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {suggestion.adminFeedback}
                      </p>
                      {suggestion.rewardNotes && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                          <Sparkles size={11} className="text-amber-600" />
                          <span>{suggestion.rewardNotes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Author, Date, Likes & Management Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* Author */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {suggestion.isAnonymous ? '?' : (suggestion.authorName || 'NA').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-[11px] truncate">
                        {suggestion.isAnonymous ? 'Collaborateur Anonyme' : suggestion.authorName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatDateGMT(suggestion.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Upvote Button */}
                    <button
                      onClick={() => handleToggleLike(suggestion.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        hasUserLiked
                          ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                      title={hasUserLiked ? 'Retirer mon vote' : 'Soutenir cette idée'}
                    >
                      <ThumbsUp size={12} className={hasUserLiked ? 'fill-rose-500' : ''} />
                      <span className="font-mono font-bold">{suggestion.likesCount}</span>
                    </button>

                    {/* Owner / HR Review Button */}
                    {isOwner && (
                      <button
                        onClick={() => openReviewModal(suggestion)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Examiner
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 6. MODAL: PROPOSER UNE NOUVELLE IDÉE ──────────────────── */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Lightbulb size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Proposer une Idée Innovante</h3>
                  <p className="text-[11px] text-slate-400">Partagez votre initiative avec la Maison NAY</p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Titre de l'idée <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Échantillon offert pour les commandes de plus de 800 MAD"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catégorie <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, c]) => (
                      <option key={key} value={key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Impact Estimé
                  </label>
                  <select
                    value={newImpact}
                    onChange={(e) => setNewImpact(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="LOW">Modeste (Confort)</option>
                    <option value="MEDIUM">Moyen (Amélioration)</option>
                    <option value="HIGH">Fort (Croissance Ventes / Gain Temps)</option>
                    <option value="GAME_CHANGER">⚡ Game Changer (Impact Majeur)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description détaillée & Mise en œuvre <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Expliquez en détail votre idée, son utilité concrète et comment la mettre en place rapidement..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none leading-relaxed"
                />
              </div>

              {/* Visual Mock-up / Photo Uploader */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                <AttachmentUploader
                  attachments={newAttachments}
                  onChange={setNewAttachments}
                  maxFiles={4}
                  label="Visuels, Maquettes & Photos (Facultatif)"
                  helperText="Ajoutez jusqu'à 4 visuels d'illustration pour mieux présenter votre idée"
                />
              </div>

              {/* Anonymous Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {newIsAnonymous ? <EyeOff size={15} className="text-slate-500" /> : <Eye size={15} className="text-sky-600" />}
                  <div>
                    <p className="font-semibold text-slate-800 text-xs">Soumettre anonymement</p>
                    <p className="text-[10px] text-slate-400">Votre nom ne sera pas affiché publiquement</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newIsAnonymous}
                  onChange={(e) => setNewIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{submitting ? 'Envoi...' : 'Soumettre mon Idée'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. MODAL: EXAMINER & ATTRIBUER FEEDBACK (DIRECTION) ────── */}
      {isReviewOpen && selectedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Award size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Examiner & Statuer sur l'Idée</h3>
                  <p className="text-[11px] text-slate-400">{selectedSuggestion.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statut du Projet</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="SUBMITTED">Soumise (En attente d'évaluation)</option>
                  <option value="UNDER_REVIEW">En Examen technique & financier</option>
                  <option value="APPROVED">Approuvée (Feu vert Direction)</option>
                  <option value="IN_PROGRESS">En Cours de Déploiement</option>
                  <option value="IMPLEMENTED">Déployée & Réalisée (Succès)</option>
                  <option value="REJECTED">Non Retenue pour l'instant</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Commentaire & Feedback de la Direction
                </label>
                <textarea
                  rows={3}
                  placeholder="Donnez vos retours constructifs, les étapes de mise en place ou les félicitations à l'employé..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Récompense ou Prime d'Innovation (Facultatif)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Prime d'innovation 500 MAD validée sur fiche de paie"
                  value={reviewReward}
                  onChange={(e) => setReviewReward(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Check size={13} />
                  <span>{reviewing ? 'Enregistrement...' : 'Valider la Décision'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. LIGHTBOX MODAL FOR PICTURES ────────────────────────── */}
      <ImageLightboxModal
        imageUrl={lightboxUrl}
        title={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />

    </div>
  );
}
