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

  return {
    title: `Parfums ${category.label} | Acheter au Maroc`,
    description: `Découvrez notre collection de parfums ${category.label}. ${category.description} 100% authentique. Livraison rapide.`,
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/shop/${category.slug}`,
    },
    openGraph: {
      title: `Parfums ${category.label} | Acheter au Maroc`,
      description: `Découvrez notre collection de parfums ${category.label}. ${category.description} 100% authentique. Livraison rapide.`,
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

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen">
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
            {products.length} fragrances · Valentino · YSL · Armani
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


