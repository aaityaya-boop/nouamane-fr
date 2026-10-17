import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import prisma from '@/lib/prisma';
import BlogListingClient, { SerializedBlogPost, CatalogProduct } from '@/components/blog/BlogListingClient';
import { calculateReadingTime } from '@/lib/blog';
import { Sparkles, ArrowDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';

  return {
    title: "Le Journal NAY Parfum | L'Art du Parfum & Guides Olfactifs au Maroc",
    description:
      "Plongez dans l'univers de la haute parfumerie au Maroc : guides d'experts, authenticité des testeurs, conseils de sillage et découvertes olfactives exclusives.",
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/blog`,
    },
    openGraph: {
      title: "Le Journal NAY Parfum | L'Art du Parfum & Guides Olfactifs au Maroc",
      description:
        "Conseils d'experts, secrets de fabrication, authenticité des testeurs et inspirations pour trouver votre signature olfactive au Maroc.",
      url: `https://nayparfum.ma/${currentLocale}/blog`,
      siteName: 'NAY Parfums',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80',
          width: 1200,
          height: 630,
          alt: 'Le Journal NAY Parfum — Haute Parfumerie Maroc',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: "Le Journal NAY Parfum | L'Art du Parfum",
      description:
        "Guides olfactifs, authenticité des testeurs et conseils de sillage par NAY Parfums au Maroc.",
      images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80'],
    },
  };
}

export default async function BlogListingPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const { locale } = (await params) || { locale: 'fr' };
  const currentLocale = locale || 'fr';

  // Fetch real published blog posts from database
  const postsFromDb = await prisma.blogPost.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
  });

  // Fetch real catalog products for restrained editorial discovery
  const productsFromDb = await prisma.product.findMany({
    where: { published: true },
    take: 8,
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

  // Serialize posts & calculate reading times
  const serializedPosts: SerializedBlogPost[] = postsFromDb.map((p) => {
    const { minutes } = calculateReadingTime(p.content || '');
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      coverImage: p.coverImage || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80',
      author: p.author || 'NAY Parfums',
      category: p.category || 'Guides & Conseils',
      tags: p.tags,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : p.createdAt.toISOString(),
      readingTimeMinutes: minutes,
    };
  });

  const featuredPost = serializedPosts.length > 0 ? serializedPosts[0] : null;
  const remainingPosts = serializedPosts.length > 1 ? serializedPosts.slice(1) : serializedPosts;

  // Serialize catalog products
  const discoveryProducts: CatalogProduct[] = productsFromDb.map((prod) => {
    let mainImg = '';
    try {
      if (typeof prod.images === 'string' && prod.images.startsWith('[')) {
        const parsed = JSON.parse(prod.images);
        mainImg = parsed[0] || '';
      } else if (typeof prod.images === 'string') {
        mainImg = prod.images;
      }
    } catch {}

    return {
      id: prod.id,
      slug: prod.slug,
      name: prod.name,
      brandLabel: prod.brandLabel,
      price: prod.price,
      originalPrice: prod.originalPrice,
      image: mainImg,
    };
  });

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `https://nayparfum.ma/${currentLocale}/blog#blog`,
        name: 'Le Journal NAY Parfum',
        description:
          "Conseils, inspirations et découvertes pour explorer l'univers des fragrances et trouver le parfum qui vous ressemble.",
        url: `https://nayparfum.ma/${currentLocale}/blog`,
        publisher: {
          '@type': 'Organization',
          name: 'NAY Parfums',
          url: 'https://nayparfum.ma',
          logo: {
            '@type': 'ImageObject',
            url: 'https://nayparfum.ma/icon.png',
          },
        },
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

      <main className="pb-24">
        {/* ============================================================== */}
        {/* SECTION A — EDITORIAL MAGAZINE HERO                           */}
        {/* ============================================================== */}
        <section className="relative pt-36 lg:pt-48 pb-20 lg:pb-28 overflow-hidden bg-[#fafaf7] border-b border-[#e8e8e8]">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#0ea5e9]/5 via-amber-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />

          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Hero Left Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e8e8e8] shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#1a1a1a]">
                    LE JOURNAL NAY PARFUM
                  </span>
                </div>

                <h1 className="heading-font text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-[#1a1a1a] tracking-tight leading-[1.08]">
                  L'Art du <br />
                  <span className="italic font-light text-[#0ea5e9]">Parfum</span>
                </h1>

                <p className="text-[#555] text-base sm:text-lg lg:text-xl font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Conseils, inspirations et découvertes pour explorer l'univers des fragrances et trouver le parfum qui vous ressemble.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <a
                    href="#featured-article-heading"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#1a1a1a] hover:bg-[#0ea5e9] text-white text-xs font-bold tracking-[0.15em] uppercase shadow-lg shadow-black/10 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <span>Explorer les articles</span>
                    <ArrowDown size={14} />
                  </a>

                  <Link
                    href={`/${currentLocale}/shop`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-[#fafaf7] text-[#1a1a1a] border border-[#e8e8e8] text-xs font-bold tracking-[0.15em] uppercase hover:border-[#1a1a1a]/30 transition-all duration-300"
                  >
                    <span>Découvrir la boutique</span>
                  </Link>
                </div>
              </div>

              {/* Hero Right Visual Editorial Frame */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-[4/5] w-full max-w-md mx-auto rounded-[32px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border-4 border-white">
                  <Image
                    src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80"
                    alt="Flacon d'exception haute parfumerie NAY Parfums Maroc"
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 450px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/80 block mb-1">
                      Édition NAY Parfums
                    </span>
                    <p className="heading-font text-lg leading-snug">
                      La haute parfumerie authentique à portée de main au Maroc.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* MAIN BODY: SECTIONS B TO G (CLIENT INTERACTIVE LAYER)          */}
        {/* ============================================================== */}
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-16 lg:pt-24">
          <BlogListingClient
            posts={serializedPosts}
            featuredPost={featuredPost}
            locale={currentLocale}
            discoveryProducts={discoveryProducts}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
