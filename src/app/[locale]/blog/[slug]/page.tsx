import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
  BookOpen
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await prisma.blogPost.findUnique({ where: { slug: decodedSlug } });

  if (!post || post.status !== 'published') {
    return { title: 'Article non trouvé' };
  }

  const currentLocale = locale || 'fr';
  const metaTitle = post.metaTitle || `${post.title} | NAY Parfums Maroc`;
  const metaDescription = post.metaDescription || post.excerpt;
  const canonicalUrl = `https://nayparfum.ma/${currentLocale}/blog/${post.slug}`;
  const coverImg = post.coverImage || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80';

  return {
    title: { absolute: metaTitle },
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      authors: ['NAY Parfums'],
      siteName: 'NAY Parfums',
      images: [
        {
          url: coverImg.startsWith('http') ? coverImg : `https://nayparfum.ma${coverImg}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [coverImg.startsWith('http') ? coverImg : `https://nayparfum.ma${coverImg}`],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; locale?: string }>;
}) {
  const { slug, locale } = await params;
  const currentLocale = locale || 'fr';
  const decodedSlug = decodeURIComponent(slug);

  const post = await prisma.blogPost.findUnique({
    where: { slug: decodedSlug },
  });

  if (!post || post.status !== 'published') {
    notFound();
  }

  // Parse HTML content to inject anchor IDs and extract headings for the Table of Contents
  const { processedHtml, headings } = processArticleHtml(post.content || '');
  const { minutes: readingTimeMinutes } = calculateReadingTime(post.content || '');

  // Parse related products from database
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

  // If no related products were manually tagged, find 3 relevant catalog products
  if (relatedProducts.length === 0) {
    const fallbackProds = await prisma.product.findMany({
      where: { published: true },
      take: 3,
      orderBy: { rating: 'desc' },
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

    relatedProducts = fallbackProds.map((p) => {
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

  // Fetch 3 other published articles for Related Articles section
  const otherPosts = await prisma.blogPost.findMany({
    where: {
      status: 'published',
      id: { not: post.id },
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      publishedAt: true,
      content: true,
    },
  });

  const relatedArticles = otherPosts.map((p) => {
    const { minutes } = calculateReadingTime(p.content || '');
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImage: p.coverImage || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80',
      category: p.category || 'Guides',
      publishedAt: p.publishedAt,
      readingTime: minutes,
    };
  });

  const isArabic = /[\u0600-\u06FF]/.test(post.title || post.content || '');
  const currentUrl = `https://nayparfum.ma/${currentLocale}/blog/${post.slug}`;
  const coverImgFull = post.coverImage.startsWith('http')
    ? post.coverImage
    : `https://nayparfum.ma${post.coverImage}`;

  // Complete Schema.org JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${currentUrl}#article`,
        headline: post.metaTitle || post.title,
        description: post.metaDescription || post.excerpt,
        image: coverImgFull,
        datePublished: new Date(post.publishedAt).toISOString(),
        dateModified: new Date(post.updatedAt).toISOString(),
        author: {
          '@type': 'Organization',
          name: 'NAY Parfums',
          url: 'https://nayparfum.ma',
        },
        publisher: {
          '@type': 'Organization',
          name: 'NAY Parfums',
          url: 'https://nayparfum.ma',
          logo: {
            '@type': 'ImageObject',
            url: 'https://nayparfum.ma/icon.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': currentUrl,
        },
        inLanguage: isArabic ? 'ar' : 'fr',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: `https://nayparfum.ma/${currentLocale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Journal & Blog',
            item: `https://nayparfum.ma/${currentLocale}/blog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title,
            item: currentUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="bg-[#fcfcf9] text-[#1A1A1A] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
                {post.title}
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
                Publié le {formatPublicationDate(post.publishedAt, currentLocale)}
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
              {/* Reading Experience Client Tools (Progress bar, social share, mobile TOC) */}
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

              {/* IN-ARTICLE COMMERCIAL CALL TO ACTION */}
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

            {/* DESKTOP SIDEBAR (4 COLS) */}
            <div className="hidden lg:block lg:col-span-4">
              <ArticleSidebar
                headings={headings}
                locale={currentLocale}
                featuredProduct={relatedProducts.length > 0 ? relatedProducts[0] : null}
              />
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <section className="bg-white border-y border-[#e8e8e8] py-20 mt-20">
            <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9] mb-2">
                  <ShoppingBag size={14} /> Sélection Recommandée
                </span>
                <h2 className="heading-font text-3xl sm:text-4xl text-[#1a1a1a]">
                  Parfums Mentionnés dans cet Article
                </h2>
                <div className="w-12 h-0.5 bg-[#0ea5e9] mx-auto mt-4" />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {relatedProducts.map((product) => (
                  <Link
                    href={`/${currentLocale}/product/${product.slug}`}
                    key={product.id || product.slug}
                    className="group bg-[#fafaf7] rounded-3xl p-6 border border-[#e8e8e8] hover:border-[#1a1a1a]/20 hover:shadow-xl transition-all duration-500 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white mb-5 p-4 border border-[#f0f0ee]">
                        {product.image && (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 320px"
                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1">
                        {product.brandLabel}
                      </div>
                      <h3 className="heading-font text-base text-[#1a1a1a] group-hover:text-[#0ea5e9] transition-colors truncate mb-4">
                        {product.name}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-[#e8e8e8] flex items-center justify-between">
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
                        Découvrir <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RELATED ARTICLES SECTION */}
        {relatedArticles.length > 0 && (
          <section className="pt-20">
            <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 pb-6 border-b border-[#e8e8e8]">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9] mb-2 block">
                    Poursuivre la lecture
                  </span>
                  <h2 className="heading-font text-3xl sm:text-4xl text-[#1a1a1a]">
                    Articles Recommandés
                  </h2>
                </div>
                <Link
                  href={`/${currentLocale}/blog`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0ea5e9] hover:text-[#0284c7] transition-colors"
                >
                  <span>Tous les articles</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedArticles.map((rel) => (
                  <Link
                    href={`/${currentLocale}/blog/${rel.slug}`}
                    key={rel.id}
                    className="group bg-white rounded-3xl overflow-hidden border border-[#e8e8e8] hover:border-[#1a1a1a]/20 hover:shadow-xl transition-all duration-500 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#fafaf7]">
                        <Image
                          src={rel.coverImage}
                          alt={rel.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase bg-white/95 text-[#1a1a1a] shadow-sm">
                            {rel.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888] mb-2">
                          <span>{formatPublicationDate(rel.publishedAt, currentLocale)}</span>
                          <span>·</span>
                          <span>{rel.readingTime} min</span>
                        </div>
                        <h3 className="heading-font text-lg text-[#1a1a1a] group-hover:text-[#0ea5e9] transition-colors line-clamp-2 mb-3">
                          {rel.title}
                        </h3>
                        <p className="text-xs text-[#666] leading-relaxed line-clamp-2">
                          {rel.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0 mt-auto flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#0ea5e9]">
                      <span>Lire l'article</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
