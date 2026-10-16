import React, { use, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ShopCatalog from '@/components/ShopCatalog';
import {
  MAIN_CATEGORIES,
  getCategoryBySlug,
  type Gender,
} from '@/lib/products';
import prisma from '@/lib/prisma';
import { ChevronRight } from 'lucide-react';

/**
 * Category landing page — Women / Men / Unisex.
 * Displays hero image, category description, subcategory shortcuts, then full catalog locked to the gender.
 */

type Params = { locale: string; gender: string };

export const revalidate = 3600;

import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, gender } = await params;
  const category = getCategoryBySlug(gender);

  if (!category) return { title: 'Catégorie introuvable' };

  const currentLocale = locale || 'fr';

  let title = '';
  let description = '';

  if (category.key === 'men') {
    title = 'Parfums Homme au Maroc : Grandes Marques & Testeurs 100% Originaux | NAY Parfum';
    description = 'Achetez votre parfum homme au Maroc chez NAY Parfum : sélection de grandes marques de luxe (Dior, Creed, Chanel, Tom Ford), flacons scellés et testeurs 100% originaux. Prix en MAD, paiement à la livraison (COD) et livraison express 24/48h.';
  } else if (category.key === 'women') {
    title = 'Parfums Femme au Maroc : Grandes Marques & Testeurs 100% Originaux | NAY Parfum';
    description = 'Achetez votre parfum femme au Maroc chez NAY Parfum : sélection de grandes marques iconiques (Chanel, YSL, Kayali, Lancôme), flacons scellés et testeurs 100% originaux. Prix en MAD, paiement à la livraison (COD) et livraison express 24/48h.';
  } else {
    title = 'Parfums Mixtes & Niche au Maroc : Testeurs Originaux | NAY Parfum';
    description = 'Sélection exclusive de parfums unisexes et de niche au Maroc : flacons et testeurs d\'exception (Tom Ford, Montale, Xerjoff). Prix en MAD, livraison rapide 24/48h et paiement à la livraison (COD).';
  }

  return {
    title: { absolute: title },
    description,
    keywords: [
      category.key === 'men' ? 'parfum homme maroc' : 'parfum femme maroc',
      category.key === 'men' ? 'acheter parfum homme maroc' : 'acheter parfum femme maroc',
      `testeurs ${category.slug} maroc`,
      `parfums de luxe ${category.slug} maroc`,
      `prix parfum ${category.slug} maroc`,
      'عطور أصلية المغرب'
    ],
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/shop/${category.slug}`,
      languages: {
        'fr-MA': `https://nayparfum.ma/fr/shop/${category.slug}`,
        'ar-MA': `https://nayparfum.ma/ar/shop/${category.slug}`,
        'x-default': `https://nayparfum.ma/fr/shop/${category.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://nayparfum.ma/${currentLocale}/shop/${category.slug}`,
      images: [{ url: category.heroImage }]
    }
  };
}
export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, gender } = await params;
  const category = getCategoryBySlug(gender);
  if (!category) notFound();

  const [dbProducts, dbBrands, config] = await Promise.all([
    prisma.product.findMany({
      where: { 
        published: true,
        gender: category.key,
        subcategory: { notIn: ['master-copier', 'coffrets'] }
      }
    }),
    prisma.brand.findMany(),
    prisma.siteConfig.findFirst()
  ]);

  let recommendedSlugs: string[] = [];
  try {
    if (category.key === 'men') recommendedSlugs = JSON.parse(config?.recommendedMen || '[]');
    else if (category.key === 'women') recommendedSlugs = JSON.parse(config?.recommendedWomen || '[]');
    else if (category.key === 'unisex') recommendedSlugs = JSON.parse(config?.recommendedUnisex || '[]');
  } catch {}

  const products = dbProducts.map((p) => ({
    ...p,
    brand: p.brandId as any,
    gender: p.gender as any,
    subcategory: p.subcategory as any,
    images: JSON.parse(p.images),
    notes: JSON.parse(p.notes),
    sizes: JSON.parse(p.sizes),
    tags: JSON.parse(p.tags) as any,
    bottleColor: p.bottleColor as any,
    bottleMaterial: p.bottleMaterial as any,
    perfectSeason: p.perfectSeason as any,
    originalPrice: p.originalPrice ?? undefined,
  }));

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: `https://nayparfum.ma/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Boutique',
        item: `https://nayparfum.ma/${locale}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.label,
        item: `https://nayparfum.ma/${locale}/shop/${category.slug}`,
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.label} au Maroc - Testeurs & Flacons 100% Originaux`,
    description: category.key === 'men'
      ? 'Sélection exclusive de parfums et testeurs pour homme au Maroc. 100% originaux, grandes marques de luxe, prix en MAD et paiement à la livraison.'
      : category.key === 'women'
      ? 'Sélection exclusive de parfums et testeurs pour femme au Maroc. 100% originaux, grands classiques de luxe, prix en MAD et paiement à la livraison.'
      : 'Sélection exclusive de parfums et testeurs de niche au Maroc. 100% originaux, prix en MAD et paiement à la livraison.',
    url: `https://nayparfum.ma/${locale}/shop/${category.slug}`,
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.label} au Maroc`,
    itemListElement: products.slice(0, 12).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: p.name,
      url: `https://nayparfum.ma/${locale}/product/${p.slug}`,
    })),
  };

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Header />

      {/* HERO */}
      <section className="relative pt-32 pb-16 min-h-[300px] flex items-center overflow-hidden bg-[#fafaf7]">
        {/* Background Aura */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0ea5e9]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-6 lg:px-10">
          <nav className="flex items-center gap-2 text-[11px] text-[#6B6B6B] mb-6">
            <Link href={`/${locale}`} className="hover:text-[#0ea5e9]">Accueil</Link>
            <ChevronRight size={12} />
            <Link href={`/${locale}/shop`} className="hover:text-[#0ea5e9]">Boutique</Link>
            <ChevronRight size={12} />
            <span className="text-[#1A1A1A] font-medium">{category.label}</span>
          </nav>

          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">
            Collection
          </span>
          <h1 className="heading-font text-[#1A1A1A] text-5xl lg:text-7xl mt-3 tracking-wide">
            {category.label}
          </h1>
          <p className="mt-4 text-[#6B6B6B] text-[14px] max-w-md">
            {products.length} fragrances {category.key === 'men' ? 'masculines' : category.key === 'women' ? 'féminines' : 'mixtes'} d&apos;exception · Dior · Chanel · Creed · Tom Ford · YSL
          </p>
        </div>
      </section>

      {/* DESCRIPTION + SUBCATS */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14 border-b border-[#e0ddd4]">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-start">
          <p className="text-[15px] lg:text-base text-[#6B6B6B] leading-[1.85] max-w-3xl">
            {category.description}
          </p>

          {/* Subcategory chips */}
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] self-center mr-2 hidden lg:inline">
              Famille :
            </span>
            {category.subcategories.map((sc) => (
              <Link
                key={sc.slug}
                href={`/${locale}/shop/${category.slug}?sub=${sc.slug}`}
                className="text-[11px] font-semibold tracking-[0.15em] uppercase border border-[#e0ddd4] hover:border-[#0ea5e9] hover:text-[#0ea5e9] text-[#6B6B6B] rounded-full px-4 py-2 transition-all"
              >
                {sc.label}
              </Link>
            ))}
          </div>
        </div>

        {products.filter(p => p.inStock && (p.stock ?? 0) > 0).length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#e0ddd4]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] mb-3">
              Coups de cœur {category.label} disponibles au Maroc :
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {products
                .filter(p => p.inStock && (p.stock ?? 0) > 0)
                .slice(0, 5)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={`/${locale}/product/${item.slug}`}
                    className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-3.5 py-1.5 rounded-full border border-[#e0ddd4] transition-all"
                  >
                    {item.name} · {item.price} MAD
                  </Link>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* CATALOG (locked to gender) */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14">
        <Suspense fallback={<div className="text-[#9A9A9A]">Chargement…</div>}>
          <ShopCatalog products={products} brands={dbBrands} lockedGender={category.key as Gender} recommendedSlugs={recommendedSlugs} />
        </Suspense>
      </section>

      <Footer />
      <CartDrawer />
    </div>
  );
}


