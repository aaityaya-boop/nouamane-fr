'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, BookOpen, Edit, Eye, Sparkles, Search, Filter,
  Trash2, Copy, FileText, CheckCircle2, Clock, Globe,
  ArrowUpRight, BarChart2, Layers, Tag, ExternalLink,
  ChevronRight, RefreshCw, ShoppingBag, Wand2
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

export default function BlogListClient({
  initialPosts = [],
  totalProductsCount = 0
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

  // Categories extracted from posts
  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
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

  // Statistics
  const stats = useMemo(() => {
    const published = posts.filter(p => p.status === 'published').length;
    const drafts = posts.filter(p => p.status === 'draft').length;

    let totalWords = 0;
    let totalLinkedProducts = 0;

    posts.forEach(p => {
      const text = p.content ? p.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      totalWords += text ? text.split(/\s+/).length : 0;
      
      try {
        if (p.relatedProductSlugs) {
          const arr = JSON.parse(p.relatedProductSlugs);
          if (Array.isArray(arr)) totalLinkedProducts += arr.length;
        }
      } catch {}
    });

    const avgWords = posts.length > 0 ? Math.round(totalWords / posts.length) : 0;

    return {
      total: posts.length,
      published,
      drafts,
      avgWords,
      totalLinkedProducts
    };
  }, [posts]);

  // Delete Post
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'article "${title}" ?`)) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
        router.refresh();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Duplicate Post
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
          status: 'draft'
        })
      });

      if (res.ok) {
        const created = await res.json();
        setPosts(prev => [created, ...prev]);
        router.refresh();
      } else {
        alert('Erreur lors de la duplication');
      }
    } catch {
      alert('Erreur réseau lors de la duplication');
    } finally {
      setIsDuplicatingId(null);
    }
  };

  // Calculate estimated SEO grade
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
    if (score >= 70) return { grade: 'A', color: 'text-sky-700 bg-sky-50 border-sky-200' };
    if (score >= 50) return { grade: 'B', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { grade: 'C', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[11px] font-bold uppercase tracking-wider border border-sky-100">
              NAY Parfums Editorial Studio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Blog & Rédaction SEO
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pilotez votre stratégie de contenu de luxe et attirez des visiteurs qualifiés sur Google.ma
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog/new"
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles size={16} className="text-amber-300 animate-pulse" />
            <span>Générer avec l'IA</span>
          </Link>
          <Link
            href="/admin/blog/new"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            <span>Nouvel Article</span>
          </Link>
        </div>
      </div>

      {/* EXECUTIVE KPI STATS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Articles Publiés</span>
            <Globe size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.published}</span>
            <span className="text-xs text-slate-400">/ {stats.total} total</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 size={12} /> Indexables sur Google.ma
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Brouillons en Cours</span>
            <FileText size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.drafts}</span>
            <span className="text-xs text-slate-400">articles</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-medium">
            Prêts pour finalisation & SEO
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Richesse Moyenne</span>
            <BarChart2 size={16} className="text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.avgWords}</span>
            <span className="text-xs text-slate-400">mots / article</span>
          </div>
          <div className="mt-2 text-[11px] text-sky-600 font-medium">
            ~{Math.max(1, Math.ceil(stats.avgWords / 200))} min de lecture moyenne
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Parfums Liés</span>
            <ShoppingBag size={16} className="text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.totalLinkedProducts}</span>
            <span className="text-xs text-slate-400">liaisons catalogue</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-600 font-medium">
            Générateurs de conversion boutique
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par titre, mot-clé, tag..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'published' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Publiés ({stats.published})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'draft' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Brouillons ({stats.drafts})
            </button>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Toutes Catégories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ARTICLES LIST / TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {search ? 'Aucun article ne correspond à votre recherche' : 'Aucun article de blog'}
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Le blog est le levier N°1 pour positionner NAY Parfums sur Google Maroc. Rédigez un guide ou générez un article en 1-clic avec notre assistant IA.
            </p>
            <Link
              href="/admin/blog/new"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2"
            >
              <Sparkles size={15} className="text-amber-300" />
              <span>Générer un 1er Article avec l'IA</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPosts.map(post => {
              const seo = getSeoGrade(post);
              let linkedCount = 0;
              try {
                if (post.relatedProductSlugs) {
                  const arr = JSON.parse(post.relatedProductSlugs);
                  if (Array.isArray(arr)) linkedCount = arr.length;
                }
              } catch {}

              const cleanExcerpt = post.excerpt || (post.content ? post.content.replace(/<[^>]+>/g, ' ').slice(0, 140) + '...' : '');

              return (
                <div
                  key={post.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-5 group"
                >
                  {/* Article Main Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Cover Thumbnail */}
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

                    {/* Text Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {post.category || 'Guides'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          post.status === 'published' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {post.status === 'published' ? '● En Ligne' : '○ Brouillon'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${seo.color}`}>
                          SEO: {seo.grade}
                        </span>
                      </div>

                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors block truncate"
                      >
                        {post.title}
                      </Link>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        {cleanExcerpt}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                        <span className="font-mono text-slate-500">/blog/{post.slug}</span>
                        <span>·</span>
                        <span>Par {post.author || 'NAY'}</span>
                        <span>·</span>
                        <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {linkedCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-purple-600 font-semibold">{linkedCount} parfum(s) lié(s)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Direct Frontend View */}
                    <a
                      href={`/fr/blog/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Voir sur la boutique"
                    >
                      <Eye size={17} />
                    </a>

                    {/* Duplicate */}
                    <button
                      type="button"
                      disabled={isDuplicatingId === post.id}
                      onClick={() => handleDuplicate(post)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                      title="Dupliquer l'article"
                    >
                      {isDuplicatingId === post.id ? (
                        <RefreshCw size={17} className="animate-spin text-indigo-600" />
                      ) : (
                        <Copy size={17} />
                      )}
                    </button>

                    {/* Edit */}
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Edit size={14} />
                      <span>Éditer</span>
                    </Link>

                    {/* Delete */}
                    <button
                      type="button"
                      disabled={isDeletingId === post.id}
                      onClick={() => handleDelete(post.id, post.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
