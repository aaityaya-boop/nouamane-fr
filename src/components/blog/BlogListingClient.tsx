'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
  ShoppingBag,
  Compass,
  Award
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { formatPublicationDate } from '@/lib/blog';

export interface SerializedBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  tags?: string;
  publishedAt: string;
  readingTimeMinutes?: number;
}

export interface CatalogProduct {
  id: number;
  slug: string;
  name: string;
  brandLabel: string;
  price: number;
  originalPrice?: number | null;
  image?: string;
}

interface BlogListingClientProps {
  posts: SerializedBlogPost[];
  featuredPost: SerializedBlogPost | null;
  locale?: string;
  discoveryProducts?: CatalogProduct[];
}

const CATEGORY_TABS = [
  { id: 'all', label: 'Tous les articles' },
  { id: 'Guides & Conseils', label: 'Guides & Conseils' },
  { id: 'Testeurs & Authenticité', label: 'Testeurs & Authenticité' },
  { id: 'Parfums Homme', label: 'Parfums Homme' },
  { id: 'Parfums Femme', label: 'Parfums Femme' },
  { id: 'Notes & Familles Olfactives', label: 'Notes & Familles Olfactives' },
  { id: 'Tendances & Saisons', label: 'Tendances & Saisons' }
];

export default function BlogListingClient({
  posts = [],
  featuredPost,
  locale = 'fr',
  discoveryProducts = []
}: BlogListingClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter posts by category
  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') {
      return posts;
    }
    const target = selectedCategory.toLowerCase();
    return posts.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      // Match exact or related words
      if (cat.includes(target) || target.includes(cat)) return true;
      if (selectedCategory === 'Guides & Conseils' && (cat.includes('guide') || cat.includes('conseil'))) return true;
      if (selectedCategory === 'Testeurs & Authenticité' && (cat.includes('testeur') || cat.includes('authent'))) return true;
      if (selectedCategory === 'Parfums Homme' && (cat.includes('homme') || cat.includes('men'))) return true;
      if (selectedCategory === 'Parfums Femme' && (cat.includes('femme') || cat.includes('women'))) return true;
      if (selectedCategory === 'Notes & Familles Olfactives' && (cat.includes('note') || cat.includes('famille') || cat.includes('oud') || cat.includes('boisé'))) return true;
      if (selectedCategory === 'Tendances & Saisons' && (cat.includes('tendance') || cat.includes('saison') || cat.includes('ete') || cat.includes('été'))) return true;
      return false;
    });
  }, [posts, selectedCategory]);

  return (
    <div className="space-y-24 lg:space-y-32">
      {/* ============================================================== */}
      {/* SECTION B: FEATURED ARTICLE HERO SPOTLIGHT                     */}
      {/* ============================================================== */}
      {featuredPost && (
        <section aria-labelledby="featured-article-heading">
          <div className="relative overflow-hidden rounded-[32px] bg-white border border-[#e8e8e8] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.06)] group transition-all duration-500 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)]">
            <div className="grid lg:grid-cols-12 items-stretch min-h-[480px]">
              {/* Featured Image */}
              <div className="relative lg:col-span-7 min-h-[320px] lg:min-h-full overflow-hidden bg-[#f0f0ee]">
                <Image
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden" />
                <div className="absolute top-6 left-6 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-white/95 backdrop-blur-md text-[#1a1a1a] shadow-md">
                    <Sparkles size={11} className="text-[#0ea5e9]" /> À la une
                  </span>
                </div>
              </div>

              {/* Featured Info */}
              <div className="lg:col-span-5 p-8 sm:p-12 lg:p-14 flex flex-col justify-between bg-white">
                <div>
                  <div className="flex items-center gap-3 text-[11px] font-bold tracking-[0.2em] uppercase text-[#0ea5e9] mb-4">
                    <span>{featuredPost.category || 'Guides & Conseils'}</span>
                    <span className="w-1 h-1 rounded-full bg-[#0ea5e9]" />
                    <span className="text-[#888] font-medium tracking-normal flex items-center gap-1">
                      <Clock size={12} /> {featuredPost.readingTimeMinutes || 5} min de lecture
                    </span>
                  </div>

                  <h2
                    id="featured-article-heading"
                    className="heading-font text-2xl sm:text-3xl lg:text-4xl text-[#1a1a1a] leading-[1.25] mb-5 group-hover:text-[#0ea5e9] transition-colors"
                  >
                    <Link href={`/${locale}/blog/${featuredPost.slug}`}>
                      {featuredPost.title}
                    </Link>
                  </h2>

                  <p className="text-[#555] text-sm sm:text-base leading-relaxed line-clamp-3 mb-8">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[#f0f0ee]">
                  <div className="text-[11px] font-medium text-[#888]">
                    Publié le {formatPublicationDate(featuredPost.publishedAt, locale)}
                  </div>
                  <Link
                    href={`/${locale}/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase text-[#1a1a1a] group-hover:text-[#0ea5e9] transition-colors"
                  >
                    <span>Lire l'article</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* SECTION C & D: CATEGORIES & ARTICLE COLLECTION                 */}
      {/* ============================================================== */}
      <section aria-labelledby="all-articles-heading">
        {/* Header & Category Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#e8e8e8] mb-12">
          <div>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9] mb-2 block">
              Exploration Éditoriale
            </span>
            <h2 id="all-articles-heading" className="heading-font text-3xl lg:text-4xl text-[#1a1a1a]">
              Dernières Parutions
            </h2>
          </div>

          {/* Category Tabs Scrollbar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-6 px-6 md:mx-0 md:px-0">
            {CATEGORY_TABS.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-[11px] font-semibold tracking-wider whitespace-nowrap transition-all duration-300 ${
                    isSelected
                      ? 'bg-[#1a1a1a] text-white shadow-md'
                      : 'bg-[#fafaf7] hover:bg-white text-[#555] hover:text-[#1a1a1a] border border-[#e8e8e8]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Article Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white rounded-3xl border border-[#e8e8e8]">
            <BookOpen size={36} className="mx-auto text-[#aaa] mb-4 stroke-1" />
            <h3 className="heading-font text-xl text-[#1a1a1a] mb-2">
              Aucun article dans cette catégorie pour le moment
            </h3>
            <p className="text-sm text-[#777] max-w-md mx-auto mb-6">
              Nos spécialistes préparent de nouveaux dossiers parfumés. En attendant, explorez tous nos guides complets.
            </p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1a1a1a] text-white hover:bg-[#0ea5e9] transition-colors"
            >
              Voir tous les articles
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-[#e8e8e8] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.09)] transition-all duration-500 hover:-translate-y-1"
              >
                {/* Cover Image */}
                <Link
                  href={`/${locale}/blog/${post.slug}`}
                  className="relative aspect-[16/10] w-full overflow-hidden bg-[#f0f0ee] block"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase bg-white/95 backdrop-blur-md text-[#1a1a1a] shadow-sm">
                      {post.category || 'Guides'}
                    </span>
                  </div>
                </Link>

                {/* Article Card Body */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[#888] mb-3">
                      <span>{formatPublicationDate(post.publishedAt, locale)}</span>
                      <span className="w-1 h-1 rounded-full bg-[#888]" />
                      <span className="flex items-center gap-1 font-medium tracking-normal text-[#666]">
                        <Clock size={11} /> {post.readingTimeMinutes || 5} min
                      </span>
                    </div>

                    <h3 className="heading-font text-xl leading-snug text-[#1a1a1a] mb-3 group-hover:text-[#0ea5e9] transition-colors line-clamp-2">
                      <Link href={`/${locale}/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-[#666] text-[13px] leading-relaxed line-clamp-3 mb-6">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#f0f0ee] flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888]">
                      Par {post.author || 'NAY Parfums'}
                    </span>
                    <Link
                      href={`/${locale}/blog/${post.slug}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] uppercase text-[#1a1a1a] group-hover:text-[#0ea5e9] transition-colors"
                    >
                      <span>Lire</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* SECTION E: EVERGREEN EDUCATIONAL GUIDES                        */}
      {/* ============================================================== */}
      <section className="bg-gradient-to-b from-[#fafaf7] to-white rounded-[36px] p-8 sm:p-14 border border-[#e8e8e8]">
        <div className="max-w-2xl mb-12">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9] mb-3 block">
            Encyclopédie Olfactive
          </span>
          <h2 className="heading-font text-3xl sm:text-4xl text-[#1a1a1a] mb-4">
            Les Guides Essentiels du Parfum
          </h2>
          <p className="text-[#666] text-sm sm:text-base leading-relaxed">
            Pour maîtriser les subtilités de la haute parfumerie, comprendre la composition de vos sillages et faire des choix éclairés au Maroc.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Award,
              title: 'Concentrations de Parfums',
              desc: 'Eau de Cologne, EDT, EDP ou Extrait : les véritables pourcentages d\'essences et leur comportement face au climat marocain.',
              href: `/${locale}/blog/difference-edt-edp-extrait-parfum`
            },
            {
              icon: Compass,
              title: 'Testeurs vs Flacons Vente',
              desc: 'Comprendre l\'origine des testeurs certifiés authentiques, les économies sur le flacon et les mythes de tenue.',
              href: `/${locale}/blog/guide-testeur-parfum-vs-flacon-retail`
            },
            {
              icon: Sparkles,
              title: 'Familles Olfactives',
              desc: 'Boisés, floraux, hespéridés, orientaux et gourmands : décryptez la pyramide olfactive de votre signature.',
              href: `/${locale}/blog`
            },
            {
              icon: ShoppingBag,
              title: 'Parfums selon la Saison',
              desc: 'Adapter son sillage entre l\'humidité côtière de Casablanca et la chaleur solaire de Marrakech.',
              href: `/${locale}/blog`
            }
          ].map((guide, idx) => {
            const Icon = guide.icon;
            return (
              <Link
                key={idx}
                href={guide.href}
                className="group bg-white p-7 rounded-2xl border border-[#e8e8e8] hover:border-[#0ea5e9]/40 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center mb-5 group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors">
                    <Icon size={20} />
                  </div>
                  <h3 className="heading-font text-lg text-[#1a1a1a] mb-2 group-hover:text-[#0ea5e9] transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-[#666] text-xs leading-relaxed mb-6">
                    {guide.desc}
                  </p>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Explorer</span>
                  <ArrowRight size={13} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION F: RESTRAINED PRODUCT DISCOVERY (REAL DATABASE ONLY)   */}
      {/* ============================================================== */}
      {discoveryProducts.length > 0 && (
        <section aria-labelledby="product-discovery-heading">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#e8e8e8] mb-12">
            <div>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9] mb-2 block">
                Boutique Officielle
              </span>
              <h2 id="product-discovery-heading" className="heading-font text-3xl lg:text-4xl text-[#1a1a1a]">
                Parfums Mentionnés dans le Journal
              </h2>
            </div>
            <Link
              href={`/${locale}/shop`}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0ea5e9] hover:text-[#0284c7] transition-colors"
            >
              <span>Voir tout le catalogue ({discoveryProducts.length}+)</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {discoveryProducts.slice(0, 4).map((product) => (
              <Link
                key={product.id || product.slug}
                href={`/${locale}/product/${product.slug}`}
                className="group bg-white rounded-3xl p-5 border border-[#e8e8e8] hover:border-[#1a1a1a]/20 hover:shadow-xl transition-all duration-500 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#fafaf7] mb-4 p-4 border border-[#f0f0ee]">
                    {product.image && (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1">
                    {product.brandLabel}
                  </div>
                  <h3 className="heading-font text-base text-[#1a1a1a] group-hover:text-[#0ea5e9] transition-colors truncate mb-3">
                    {product.name}
                  </h3>
                </div>

                <div className="pt-3 border-t border-[#f0f0ee] flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-[#1a1a1a]">
                      {formatMAD(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-[#999] line-through">
                        {formatMAD(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#0ea5e9] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Découvrir <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* SECTION G: EDITORIAL CLOSING BRAND CTA                         */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden rounded-[36px] bg-[#1a1a1a] text-white p-10 sm:p-16 lg:p-20 text-center shadow-2xl">
        {/* Subtle Decorative Ambient Background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0ea5e9] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[#38bdf8]">
            <Sparkles size={13} /> Maison NAY Parfum Maroc
          </span>

          <h2 className="heading-font text-3xl sm:text-4xl lg:text-5xl leading-tight">
            Votre prochaine signature olfactive vous attend.
          </h2>

          <p className="text-[#a0a0a0] text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            Testeurs 100% originaux, grandes maisons de parfum et créations d'exception avec livraison rapide 24h/48h et paiement à la livraison au Maroc.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/shop`}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold tracking-[0.15em] uppercase shadow-lg shadow-[#0ea5e9]/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              Découvrir les parfums
            </Link>
            <Link
              href={`/${locale}/testeurs`}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300"
            >
              Explorer les testeurs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
