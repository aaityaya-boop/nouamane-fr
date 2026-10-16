import React, { Suspense } from 'react';
import Link from 'next/link';
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
import { ChevronRight, Sparkles } from 'lucide-react';

type Params = { locale: string; gender: string };

export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, gender } = await params;
  const category = getCategoryBySlug(gender);

  if (!category) return { title: 'Catégorie introuvable' };

  const currentLocale = locale || 'fr';

  return {
    title: `Testeurs Parfums ${category.label} 100% Originaux`,
    description: `Découvrez notre sélection exclusive de testeurs de parfums ${category.label} 100% authentiques au Maroc. Grandes marques, livraison express.`,
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/testeurs/${category.slug}`,
    },
    openGraph: {
      title: `Testeurs Parfums ${category.label} 100% Originaux | NAY Parfums`,
      description: `Découvrez notre sélection exclusive de testeurs de parfums ${category.label} 100% authentiques au Maroc. Grandes marques, livraison express.`,
      url: `https://nayparfum.ma/${currentLocale}/testeurs/${category.slug}`,
      images: [{ url: category.heroImage }]
    }
  };
}

export default async function TesteursGenderPage({
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
        isTester: true,
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
    isTester: true,
  }));

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen">
      <Header />

      {/* HERO */}
      <section className="relative pt-32 pb-16 min-h-[300px] flex items-center overflow-hidden bg-[#fafaf7]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0ea5e9]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-6 lg:px-10">
          <nav className="flex items-center gap-2 text-[11px] text-[#6B6B6B] mb-6">
            <Link href={`/${locale}`} className="hover:text-[#0ea5e9]">Accueil</Link>
            <ChevronRight size={12} />
            <Link href={`/${locale}/testeurs`} className="hover:text-[#0ea5e9]">Testeurs</Link>
            <ChevronRight size={12} />
            <span className="text-[#1A1A1A] font-medium">{category.label}</span>
          </nav>

          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9] flex items-center gap-1.5">
            <Sparkles size={13} /> Collection Testeurs
          </span>
          <h1 className="heading-font text-[#1A1A1A] text-5xl lg:text-7xl mt-3 tracking-wide">
            Testeurs {category.label}
          </h1>
          <p className="mt-4 text-[#6B6B6B] text-[14px] max-w-md">
            {products.length} testeurs authentiques de grandes maisons · Même tenue et sillage
          </p>

          {products.filter(p => p.inStock && (p.stock ?? 0) > 0).length > 0 && (
            <div className="mt-8 pt-5 pb-2 border-t border-[#e0ddd4] max-w-2xl w-full">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] mb-3">
                Sélections testeurs {category.label} en stock au Maroc :
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const prioritySlugs = [
                    'Creed-Absolu-Aventus-Tester',
                    'kayali-elixir-eau-de-parfum-tester',
                    'tom-ford-tobacco-vanille-tester'
                  ];
                  const inStock = products.filter(p => p.inStock && (p.stock ?? 0) > 0);
                  const sorted = [...inStock].sort((a, b) => {
                    const aIdx = prioritySlugs.indexOf(a.slug);
                    const bIdx = prioritySlugs.indexOf(b.slug);
                    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                    if (aIdx !== -1) return -1;
                    if (bIdx !== -1) return 1;
                    return 0;
                  });
                  return sorted.slice(0, 4).map((item) => (
                    <Link
                      key={item.id}
                      href={`/${locale}/product/${item.slug}`}
                      className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-white hover:bg-[#0ea5e9]/10 px-3.5 py-1.5 rounded-full border border-[#e0ddd4] transition-all shadow-sm"
                    >
                      {item.name} · {item.price} MAD
                    </Link>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SUBCATS */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 border-b border-[#e0ddd4]">
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] self-center mr-2 hidden lg:inline">
            Famille :
          </span>
          {category.subcategories.map((sc) => (
            <Link
              key={sc.slug}
              href={`/${locale}/testeurs/${category.slug}?sub=${sc.slug}`}
              className="text-[11px] font-semibold tracking-[0.15em] uppercase border border-[#e0ddd4] hover:border-[#0ea5e9] hover:text-[#0ea5e9] text-[#6B6B6B] rounded-full px-4 py-2 transition-all"
            >
              {sc.label}
            </Link>
          ))}
        </div>
      </section>

      {/* CATALOG (locked to gender + testers) */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14">
        <Suspense fallback={<div className="text-[#9A9A9A]">Chargement…</div>}>
          <ShopCatalog products={products} brands={dbBrands} lockedGender={category.key as Gender} lockedIsTester={true} recommendedSlugs={recommendedSlugs} />
        </Suspense>
      </section>

      <Footer />
      <CartDrawer />
    </div>
  );
}
