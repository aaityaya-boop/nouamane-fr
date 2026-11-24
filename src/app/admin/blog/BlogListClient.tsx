'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { sanitizeHtml } from '@/lib/security/sanitize';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  BookOpen,
  Edit,
  Eye,
  Sparkles,
  Search,
  Trash2,
  Copy,
  FileText,
  CheckCircle2,
  Globe,
  BarChart2,
  ShoppingBag,
  Wand2,
  X,
  Loader2,
  ShieldCheck,
  Truck,
  ArrowRight,
  Send,
  Layers,
} from 'lucide-react';

interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  category: string;
  tags: string;
  ctaText: string | null;
  ctaLink: string | null;
  relatedProductSlugs: string;
  publishedAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface GeneratedArticleResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  tags: string[];
  ctaText: string;
  ctaLink: string;
  coverImage: string;
  relatedProductSlugs: string[];
}

const IDEA_PRESETS = [
  'Pourquoi choisir un testeur original 100ml au Maroc plutôt qu’un flacon commercial ?',
  'Top parfums homme et femme longue tenue pour résister à la chaleur au Maroc',
  'Quel coffret ou parfum offrir pour un mariage ou une occasion spéciale à Casablanca ?',
  'Eau de Toilette, Eau de Parfum ou Extrait : différences de sillage et conseils NAY',
  'Comment reconnaître un vrai parfum authentique et profiter de la vérification avant paiement ?',
];

export default function BlogListClient({
  initialPosts = [],
  totalProductsCount = 0,
}: {
  initialPosts: BlogPostItem[];
  totalProductsCount: number;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPostItem[]>(initialPosts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isDuplicatingId, setIsDuplicatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Studio IA (Idée -> Article Complet) Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [quickIdeaBar, setQuickIdeaBar] = useState('');
  const [aiIdea, setAiIdea] = useState('');
  const [aiCategory, setAiCategory] = useState('Guides');
  const [aiTone, setAiTone] = useState('Luxe & Expert');
  const [aiLanguage, setAiLanguage] = useState<'fr' | 'ar' | 'en'>('fr');
  const [aiKeyword, setAiKeyword] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticleResult | null>(null);
  const [matchedProductsPreview, setMatchedProductsPreview] = useState<
    Array<{ slug: string; name: string; brandLabel: string; price: number }>
  >([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        p.author.toLowerCase().includes(search.toLowerCase()) ||
        (p.tags && p.tags.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [posts, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const published = posts.filter((p) => p.status === 'published').length;
    const drafts = posts.filter((p) => p.status === 'draft').length;
    let totalWords = 0;
    let totalLinkedProducts = 0;

    posts.forEach((p) => {
      const text = p.content ? p.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      totalWords += text ? text.split(/\s+/).length : 0;
      try {
        if (p.relatedProductSlugs) {
          const arr = JSON.parse(p.relatedProductSlugs);
          if (Array.isArray(arr)) totalLinkedProducts += arr.length;
        }
      } catch {
        // ignore invalid json
      }
    });

    const avgWords = posts.length > 0 ? Math.round(totalWords / posts.length) : 0;
    return { total: posts.length, published, drafts, avgWords, totalLinkedProducts };
  }, [posts]);

  const openAiStudio = (initialIdeaText = '') => {
    if (initialIdeaText) setAiIdea(initialIdeaText);
    setAiError(null);
    setIsAiModalOpen(true);
  };

  const handleGenerateFromIdea = async () => {
    const ideaToUse = (aiIdea || quickIdeaBar).trim();
    if (!ideaToUse) {
      setAiError("Saisissez une idée d'article (même en 1 phrase) pour lancer l'IA Maison NAY.");
      return;
    }

    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: ideaToUse,
          category: aiCategory,
          tone: aiTone,
          focusKeyword: aiKeyword,
          language: aiLanguage,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Erreur lors de la génération');
      }
      setGeneratedArticle(json.data);
      setMatchedProductsPreview(json.businessContext?.matchedProducts || []);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveGeneratedArticle = async (publishStatus: 'draft' | 'published', openEditor = false) => {
    if (!generatedArticle) return;
    setAiSaving(true);
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generatedArticle,
          status: publishStatus,
          author: 'Maison NAY Parfums',
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || 'Erreur sauvegarde');
      setPosts((prev) => [created, ...prev]);
      setIsAiModalOpen(false);
      setGeneratedArticle(null);
      setAiIdea('');
      setQuickIdeaBar('');
      if (openEditor && created.id) {
        router.push(`/admin/blog/${created.id}`);
      } else {
        showToast(
          publishStatus === 'published'
            ? 'Article IA publié en ligne sur le blog NAY !'
            : 'Article IA enregistré en brouillon !'
        );
        router.refresh();
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Impossible de sauvegarder');
    } finally {
      setAiSaving(false);
    }
  };

  const handleToggleStatus = async (post: BlogPostItem) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    setTogglingId(post.id);
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p)));
        showToast(nextStatus === 'published' ? 'Article publié sur Google.ma !' : 'Passé en brouillon.');
        router.refresh();
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'article "${title}" ?`)) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        showToast('Article supprimé.');
        router.refresh();
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDuplicate = async (post: BlogPostItem) => {
    setIsDuplicatingId(post.id);
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          id: undefined,
          slug: `${post.slug}-copie-${Date.now().toString().slice(-4)}`,
          title: `${post.title} (Copie)`,
          status: 'draft',
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setPosts((prev) => [created, ...prev]);
        showToast('Article dupliqué en brouillon.');
        router.refresh();
      }
    } finally {
      setIsDuplicatingId(null);
    }
  };

  const getSeoGrade = (post: BlogPostItem) => {
    const text = post.content ? post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    const words = text ? text.split(/\s+/).length : 0;
    const hasH2 = /<h2/i.test(post.content || '');
    const hasMeta = Boolean(post.metaDescription || post.excerpt);
    const hasCover = Boolean(post.coverImage);

    let score = 0;
    if (words >= 500) score += 40;
    else if (words >= 300) score += 25;
    else score += 10;
    if (hasH2) score += 25;
    if (hasMeta) score += 20;
    if (hasCover) score += 15;

    if (score >= 85) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 70) return { grade: 'A', color: 'text-[#0284c7] bg-sky-50 border-sky-200' };
    if (score >= 50) return { grade: 'B', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { grade: 'C', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const publishRate = stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white border border-sky-500/40 shadow-xl text-xs font-semibold">
          <CheckCircle2 size={14} className="text-sky-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              NAY PARFUMS • JOURNAL &amp; RÉDACTION SEO
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
              <ShoppingBag size={11} className="text-slate-500" />
              Catalogue indexé ({totalProductsCount} parfums)
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900">
            Blog &amp; Rédaction SEO Maroc
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
            Rédigez et publiez des guides éditoriaux optimisés Google.ma, reliés directement à vos fiches produits et conditions COD.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/seo"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
          >
            <Globe size={14} className="text-[#0ea5e9]" />
            <span>Audit SEO</span>
          </Link>

          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
          >
            <Plus size={14} />
            <span>Éditeur Manuel</span>
          </Link>

          <button
            type="button"
            onClick={() => openAiStudio(quickIdeaBar)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Wand2 size={14} className="text-sky-300" />
            <span>Assistant Éditorial</span>
          </button>
        </div>
      </div>

      {/* 4 EXECUTIVE BENTO KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nay-stagger">
        <div className="nay-hero-shine rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] text-white shadow-lg shadow-sky-500/20 flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-100">
              ARTICLES PUBLIÉS
            </span>
            <Globe size={15} className="text-white/90" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tabular-nums">
              {stats.published}{' '}
              <span className="text-sm font-semibold text-sky-100">/ {stats.total}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/25">
              {publishRate}% en ligne
            </span>
          </div>
          <p className="text-[11px] text-sky-100 mt-2">
            Indexables sur Google.ma &amp; sitemap.xml
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              BROUILLONS EN COURS
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <FileText size={14} />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {stats.drafts}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Prêts à publier en 1 clic</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              RICHESSE MOYENNE
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-[#0ea5e9]">
              <BarChart2 size={14} />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {stats.avgWords} <span className="text-xs font-semibold text-slate-400">mots</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            ~{Math.max(1, Math.ceil(stats.avgWords / 200))} min de lecture moyenne
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              MAILLAGE CATALOGUE
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShoppingBag size={14} />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-emerald-600 tabular-nums">
            {stats.totalLinkedProducts}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Liens vers vos {totalProductsCount} parfums en stock
          </p>
        </div>
      </div>

      {/* QUICK ARTICLE COMPOSER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5 nay-enter">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              ASSISTANCE RÉDACTIONNELLE • STUDIO ÉDITORIAL
            </span>
            <h2 className="text-sm font-bold text-slate-900 mt-0.5">
              Rédigez depuis un sujet avec intégration automatique des références, tarifs MAD et livraison 24-48h
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
            <span>{totalProductsCount} références</span>
            <span>•</span>
            <span>Livraison gratuite dès 800 MAD</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={quickIdeaBar}
            onChange={(e) => setQuickIdeaBar(e.target.value)}
            placeholder="Ex: Comparatif Dior Sauvage Elixir vs Bleu de Chanel pour un mariage au Maroc..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0ea5e9]"
          />
          <button
            type="button"
            onClick={() => openAiStudio(quickIdeaBar)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-xs font-bold shadow-sm cursor-pointer shrink-0"
          >
            <Sparkles size={14} />
            <span>Ouvrir &amp; Générer</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Idées rapides :</span>
          {IDEA_PRESETS.slice(0, 3).map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuickIdeaBar(preset);
                openAiStudio(preset);
              }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-[#0284c7] border border-slate-200/80 transition-colors cursor-pointer"
            >
              {preset.slice(0, 52)}...
            </button>
          ))}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, mot-clé, tag..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-[#0ea5e9] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'all', label: `Tous (${posts.length})` },
                { id: 'published', label: `Publiés (${stats.published})` },
                { id: 'draft', label: `Brouillons (${stats.drafts})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#0ea5e9]"
            >
              <option value="all">Toutes Catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ARTICLES LIST */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-14 text-center text-slate-500 flex flex-col items-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center mb-4">
              <BookOpen size={26} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              {search ? 'Aucun article correspondant' : 'Aucun article de blog'}
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Lancez le Studio IA pour transformer une simple idée en article éditorial SEO relié à vos parfums Maison NAY.
            </p>
            <button
              type="button"
              onClick={() => openAiStudio(IDEA_PRESETS[0])}
              className="px-5 py-2.5 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Générer avec IA Maison NAY</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPosts.map((post) => {
              const seo = getSeoGrade(post);
              let linkedCount = 0;
              try {
                if (post.relatedProductSlugs) {
                  const arr = JSON.parse(post.relatedProductSlugs);
                  if (Array.isArray(arr)) linkedCount = arr.length;
                }
              } catch {
                // ignore
              }
              const cleanExcerpt =
                post.excerpt ||
                (post.content ? `${post.content.replace(/<[^>]+>/g, ' ').slice(0, 140)}...` : '');

              return (
                <div
                  key={post.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <BookOpen size={22} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                        <span className="font-semibold uppercase tracking-wider text-slate-500">
                          {post.category || 'Guides'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          disabled={togglingId === post.id}
                          onClick={() => handleToggleStatus(post)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border cursor-pointer transition-colors ${
                            post.status === 'published'
                              ? 'bg-emerald-500/[0.08] text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/15'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70'
                          }`}
                          title="Cliquer pour basculer le statut de publication"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {togglingId === post.id
                            ? '...'
                            : post.status === 'published'
                            ? 'Publié'
                            : 'Brouillon'}
                        </button>
                        <span className="font-mono font-semibold text-slate-600">
                          SEO {seo.grade}
                        </span>
                      </div>

                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-base font-extrabold text-slate-900 group-hover:text-[#0284c7] transition-colors block truncate"
                      >
                        {post.title}
                      </Link>

                      <p className="text-xs text-slate-500 line-clamp-1">{cleanExcerpt}</p>

                      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400 pt-0.5">
                        <span className="font-mono text-slate-500">/blog/{post.slug}</span>
                        <span>•</span>
                        <span>Par {post.author || 'NAY'}</span>
                        <span>•</span>
                        <span>
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString('fr-FR', {
                            timeZone: 'UTC',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {linkedCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-[#0284c7] font-bold">
                              {linkedCount} parfum(s) lié(s)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <a
                      href={
                        post.status === 'published'
                          ? `/fr/blog/${post.slug}`
                          : `/fr/blog/preview/${post.id}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl text-slate-500 hover:text-[#0284c7] hover:bg-sky-50 border border-slate-200 bg-white transition-colors"
                      title="Aperçu"
                    >
                      <Eye size={15} />
                    </a>

                    <button
                      type="button"
                      disabled={isDuplicatingId === post.id}
                      onClick={() => handleDuplicate(post)}
                      className="p-2 rounded-xl text-slate-500 hover:text-[#0284c7] hover:bg-sky-50 border border-slate-200 bg-white transition-colors cursor-pointer"
                      title="Dupliquer"
                    >
                      <Copy size={15} />
                    </button>

                    <button
                      type="button"
                      disabled={isDeletingId === post.id}
                      onClick={() => handleDelete(post.id, post.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>

                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:opacity-95"
                    >
                      <Edit size={13} />
                      <span>Éditer</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STUDIO IA : IDÉE -> ARTICLE COMPLET MODAL */}
      <AnimatePresence>
        {isAiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsAiModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center shadow-sm">
                    <Wand2 size={19} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Studio IA Éditorial Maison NAY (Idée → Article Complet)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Formé sur votre catalogue ({totalProductsCount} parfums), gammes Testeurs/Originaux/Coffrets, livraison 24-48h &amp; vérification colis COD.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* Left 5 Cols: Idea Input + Business Grounding */}
                <div className="lg:col-span-5 p-6 space-y-4 overflow-y-auto">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-[#0284c7]" />
                      Contexte Catalogue Maison NAY Actif
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Intégration automatique des références, tarifs MAD, vérification à la livraison (0 MAD si refus) et livraison 24-48h gratuite dès 800 MAD.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                      Votre Idée d&apos;Article *
                    </label>
                    <textarea
                      rows={3}
                      value={aiIdea}
                      onChange={(e) => setAiIdea(e.target.value)}
                      placeholder="Ex: Guide pour offrir un parfum de luxe pour l'Aïd ou un mariage à Casablanca avec un budget malin..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-[#0ea5e9]"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                      Idées Prêtes (1-Clic)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {IDEA_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiIdea(p)}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#0284c7] border border-slate-200 cursor-pointer text-left"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Langue
                      </label>
                      <select
                        value={aiLanguage}
                        onChange={(e) => setAiLanguage(e.target.value as 'fr' | 'ar' | 'en')}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="fr">Français (Maroc)</option>
                        <option value="ar">العربية (Maroc)</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Catégorie
                      </label>
                      <select
                        value={aiCategory}
                        onChange={(e) => setAiCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="Guides">Guides &amp; Comparatifs</option>
                        <option value="Conseils">Conseils Sillage &amp; Tenue</option>
                        <option value="Tendances">Tendances Parfumerie</option>
                        <option value="Coffrets">Coffrets &amp; Cadeaux</option>
                        <option value="Nouveautés">Testeurs &amp; Nouveautés</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Ton Éditorial
                      </label>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="Luxe & Expert">Luxe &amp; Expert</option>
                        <option value="Conseiller Chaleureux">Conseiller Proche &amp; Pédagogue</option>
                        <option value="Conversion Directe">Orienté Vente &amp; Offres</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Mot-Clé Google.ma
                      </label>
                      <input
                        type="text"
                        value={aiKeyword}
                        onChange={(e) => setAiKeyword(e.target.value)}
                        placeholder="Ex: testeur parfum maroc"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {aiError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                      {aiError}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={aiGenerating}
                    onClick={handleGenerateFromIdea}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 disabled:opacity-60 cursor-pointer"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Rédaction &amp; Maillage Catalogue en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Générer l&apos;Article SEO Complet</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right 7 Cols: Live Article Preview & Instant Publish */}
                <div className="lg:col-span-7 p-6 bg-slate-50/60 flex flex-col justify-between gap-4 overflow-y-auto">
                  {generatedArticle ? (
                    <div className="space-y-4">
                      {/* Google SERP Preview */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#0284c7] uppercase">
                          <span>Aperçu Google.ma SERP</span>
                          <span className="text-emerald-700">SEO Prêt</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate">
                          https://nayparfum.ma/fr/blog/{generatedArticle.slug}
                        </div>
                        <div className="text-sm font-bold text-[#1a0dab]">
                          {generatedArticle.metaTitle || generatedArticle.title}
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-2">
                          {generatedArticle.metaDescription || generatedArticle.excerpt}
                        </div>
                      </div>

                      {/* Linked Real Products */}
                      {matchedProductsPreview.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">
                            Parfums liés :
                          </span>
                          {matchedProductsPreview.map((mp) => (
                            <span
                              key={mp.slug}
                              className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-[11px] font-bold text-[#0284c7]"
                            >
                              {mp.name} ({mp.price} MAD)
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Rich HTML Article Preview */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 max-h-[340px] overflow-y-auto">
                        <h4 className="text-lg font-extrabold text-slate-900">
                          {generatedArticle.title}
                        </h4>
                        <div
                          className="prose prose-sm max-w-none text-slate-700 text-xs leading-relaxed [&_h2]:text-sm [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-xs [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_a]:text-[#0284c7] [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(generatedArticle.content) }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border border-dashed border-slate-300 rounded-2xl bg-white">
                      {aiGenerating ? (
                        <>
                          <Loader2 size={30} className="animate-spin text-[#0ea5e9] mb-3" />
                          <p className="text-sm font-bold text-slate-900">
                            Analyse de votre catalogue &amp; rédaction SEO...
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Sélection des parfums pertinents et intégration des garanties Maison NAY.
                          </p>
                        </>
                      ) : (
                        <>
                          <BookOpen size={30} className="text-[#0ea5e9] mb-3" />
                          <p className="text-sm font-extrabold text-slate-900">
                            Aperçu de l&apos;Article Généré
                          </p>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            Saisissez une idée à gauche et cliquez sur Générer pour prévisualiser l&apos;article complet avec vos produits et balises Google.ma.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Save / Publish Footer */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Fermer
                    </button>
                    {generatedArticle && (
                      <>
                        <button
                          type="button"
                          disabled={aiSaving}
                          onClick={() => handleSaveGeneratedArticle('draft', true)}
                          className="px-4 py-2 rounded-xl border border-sky-200 bg-sky-50 text-[#0284c7] text-xs font-bold hover:bg-sky-100 cursor-pointer"
                        >
                          Brouillon &amp; Ouvrir Éditeur
                        </button>
                        <button
                          type="button"
                          disabled={aiSaving}
                          onClick={() => handleSaveGeneratedArticle('published', false)}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-60"
                        >
                          {aiSaving ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Send size={13} />
                          )}
                          <span>Publier sur le Blog NAY</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
