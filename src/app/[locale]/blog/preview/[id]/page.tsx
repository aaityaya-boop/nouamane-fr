import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import prisma from '@/lib/prisma';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Tag,
  ShoppingBag,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  Eye,
  AlertTriangle,
  Edit
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import {
  processArticleHtml,
  calculateReadingTime,
  formatPublicationDate
} from '@/lib/blog';
import ArticleReadingExperience from '@/components/blog/ArticleReadingExperience';
import ArticleSidebar from '@/components/blog/ArticleSidebar';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Prévisualisation Article | NAY Parfums Editorial',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function BlogPostPreviewPage({
  params,
}: {
  params: Promise<{ id: string; locale?: string }>;
}) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.has('admin_token') || cookieStore.has('admin_session');

  // If not admin, do not reveal drafts
  if (!isAdmin) {
    redirect('/admin/login');
  }

  const { id, locale } = await params;
  const currentLocale = locale || 'fr';

  // Search by either ID or slug
  const post = await prisma.blogPost.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });

  if (!post) {
    notFound();
  }

  // Parse HTML content
  const { processedHtml, headings } = processArticleHtml(post.content || '');
  const { minutes: readingTimeMinutes, wordCount } = calculateReadingTime(post.content || '');

  // Parse related products
  let relatedSlugs: string[] = [];
  try {
    if (post.relatedProductSlugs) {
      relatedSlugs =
        typeof post.relatedProductSlugs === 'string' && post.relatedProductSlugs.startsWith('[')
          ? JSON.parse(post.relatedProductSlugs)
          : [];
    }
  } catch (e) {}

  let relatedProducts: any[] = [];
  if (relatedSlugs.length > 0) {
    const dbProds = await prisma.product.findMany({
      where: { slug: { in: relatedSlugs }, published: true },
      select: {
        id: true,
        slug: true,
        name: true,
        brandLabel: true,
        price: true,
        originalPrice: true,
        images: true,
      },
    });

    relatedProducts = dbProds.map((p) => {
      let mainImg = '';
      try {
        if (typeof p.images === 'string' && p.images.startsWith('[')) {
          mainImg = JSON.parse(p.images)[0] || '';
        } else if (typeof p.images === 'string') {
          mainImg = p.images;
        }
      } catch {}

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brandLabel: p.brandLabel,
        price: p.price,
        originalPrice: p.originalPrice,
        image: mainImg,
      };
    });
  }

  const isArabic = /[\u0600-\u06FF]/.test(post.title || post.content || '');
  const currentUrl = `https://nayparfum.ma/${currentLocale}/blog/${post.slug}`;

  return (
    <div className="bg-[#fcfcf9] text-[#1A1A1A] min-h-screen">
      {/* EDITORIAL ADMIN PREVIEW BANNER (Sticky Top) */}
      <div className="sticky top-0 z-[70] bg-amber-500 text-slate-950 px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-slate-950" />
          <span>
            MODE PRÉVISUALISATION ÉDITORIALE &middot; Statut :{' '}
            <strong className="uppercase">{post.status}</strong> &middot;{' '}
            <span className="opacity-80">Non indexé par les moteurs de recherche</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] opacity-80">{wordCount} mots</span>
          <Link
            href={`/admin/blog/${post.id}`}
            className="px-3 py-1 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Edit size={13} />
            <span>Retour à l'éditeur</span>
          </Link>
        </div>
      </div>

      <Header />

      <main className="pt-28 lg:pt-36 pb-24">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
          {/* BREADCRUMB NAVIGATION */}
          <nav aria-label="Fil d'ariane" className="mb-8 text-xs text-[#888]">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href={`/${currentLocale}`} className="hover:text-[#1a1a1a] transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <ChevronRight size={13} className="text-[#bbb]" />
              </li>
              <li>
                <Link href={`/${currentLocale}/blog`} className="hover:text-[#1a1a1a] transition-colors">
                  Journal & Blog
                </Link>
              </li>
              <li>
                <ChevronRight size={13} className="text-[#bbb]" />
              </li>
              <li className="font-semibold text-[#1a1a1a] truncate max-w-[280px] sm:max-w-md">
                [Aperçu] {post.title}
              </li>
            </ol>
          </nav>

          {/* ARTICLE HERO HEADER */}
          <header className={`mb-12 max-w-4xl ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-[#0ea5e9]/10 text-[#0ea5e9]">
                {post.category || 'Guides & Conseils'}
              </span>
              <span className="text-xs text-[#888] flex items-center gap-1.5 font-medium">
                <Calendar size={13} />
                {formatPublicationDate(post.publishedAt || post.createdAt, currentLocale)}
              </span>
              <span className="text-xs text-[#888] flex items-center gap-1.5 font-medium">
                <Clock size={13} />
                {readingTimeMinutes} min de lecture
              </span>
            </div>

            <h1 className="heading-font text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-[#1a1a1a] leading-[1.18] mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg sm:text-xl text-[#555] font-light leading-relaxed max-w-3xl">
                {post.excerpt}
              </p>
            )}

            {/* Author / Verified Publisher Line */}
            <div className="mt-8 pt-6 border-t border-[#e8e8e8] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                N
              </div>
              <div>
                <div className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1.5">
                  <span>Par l'équipe éditoriale NAY Parfums</span>
                  <ShieldCheck size={14} className="text-[#0ea5e9]" />
                </div>
                <div className="text-[11px] text-[#888]">
                  Maison de haute parfumerie & testeurs authentiques au Maroc
                </div>
              </div>
            </div>
          </header>

          {/* COVER IMAGE */}
          {post.coverImage && (
            <div className="relative aspect-[16/9] w-full max-h-[580px] rounded-[32px] overflow-hidden mb-14 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] border border-[#e8e8e8]">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1320px"
                className="object-cover"
              />
            </div>
          )}

          {/* MAIN ARTICLE LAYOUT: CONTENT (8 COLS) + SIDEBAR (4 COLS) */}
          <div className="grid lg:grid-cols-12 gap-12 xl:gap-16 items-start">
            {/* ARTICLE COLUMN */}
            <div className="lg:col-span-8 min-w-0">
              <ArticleReadingExperience
                title={post.title}
                url={currentUrl}
                headings={headings}
                readingTimeMinutes={readingTimeMinutes}
              />

              {/* RENDERED ARTICLE HTML */}
              <article
                dir={isArabic ? 'rtl' : 'ltr'}
                className="article-prose prose prose-slate prose-lg max-w-none text-[#2d3748] 
                  prose-headings:font-bold prose-headings:text-[#1a1a1a] prose-headings:tracking-tight
                  prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-5 prose-h2:border-b prose-h2:border-[#e8e8e8]/60 prose-h2:pb-3
                  prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:leading-[1.8] prose-p:mb-6 prose-p:text-[#444]
                  prose-strong:text-[#1a1a1a] prose-strong:font-bold
                  prose-a:text-[#0ea5e9] prose-a:font-semibold hover:prose-a:underline
                  prose-ul:my-6 prose-li:my-2 prose-li:leading-relaxed
                  prose-ol:my-6
                  prose-blockquote:border-l-4 prose-blockquote:border-[#0ea5e9] prose-blockquote:bg-[#0ea5e9]/5 prose-blockquote:p-6 prose-blockquote:rounded-r-2xl prose-blockquote:font-normal prose-blockquote:italic
                  prose-img:rounded-3xl prose-img:shadow-lg prose-img:my-8
                  prose-table:border prose-table:border-[#e8e8e8] prose-table:rounded-2xl prose-table:overflow-hidden
                  prose-th:bg-[#fafaf7] prose-th:p-4 prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:text-[#1a1a1a]
                  prose-td:p-4 prose-td:border-t prose-td:border-[#e8e8e8] prose-td:text-sm"
                dangerouslySetInnerHTML={{ __html: processedHtml }}
              />

              {/* TAGS */}
              {post.tags && post.tags !== '[]' && (
                <div className="flex flex-wrap items-center gap-2 mt-12 pt-8 border-t border-[#e8e8e8]">
                  <span className="text-xs text-[#888] font-bold uppercase tracking-wider mr-2 flex items-center gap-1.5">
                    <Tag size={13} className="text-[#0ea5e9]" /> Mots-clés :
                  </span>
                  {(typeof post.tags === 'string' && post.tags.startsWith('[')
                    ? JSON.parse(post.tags)
                    : post.tags.split(',')
                  ).map((tag: string, idx: number) => {
                    const cleanTag = tag.trim().replace(/^#/, '');
                    if (!cleanTag) return null;
                    return (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 bg-[#fafaf7] text-[#555] rounded-full text-xs font-medium border border-[#e8e8e8]"
                      >
                        #{cleanTag}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* CALL TO ACTION */}
              {post.ctaText && post.ctaLink && (
                <div className="mt-14 p-8 sm:p-12 rounded-[32px] bg-gradient-to-br from-[#0ea5e9]/10 via-[#0ea5e9]/5 to-transparent border border-[#0ea5e9]/20 text-center shadow-sm">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9] mb-3">
                    <Sparkles size={14} /> Sélection Officielle NAY Parfums
                  </span>
                  <h3 className="heading-font text-2xl sm:text-3xl text-[#1a1a1a] mb-3">
                    Trouvez votre signature olfactive
                  </h3>
                  <p className="text-[#666] text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
                    Testeurs certifiés et parfums originaux avec livraison express et paiement à la livraison partout au Maroc.
                  </p>
                  <Link
                    href={post.ctaLink}
                    className="inline-flex items-center justify-center gap-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-4 rounded-full font-bold tracking-wider uppercase text-xs shadow-lg shadow-[#0ea5e9]/25 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <span>{post.ctaText}</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </div>

            {/* DESKTOP SIDEBAR */}
            <div className="hidden lg:block lg:col-span-4">
              <ArticleSidebar
                headings={headings}
                locale={currentLocale}
                featuredProduct={relatedProducts.length > 0 ? relatedProducts[0] : null}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
