import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ShopCatalog from '@/components/ShopCatalog';
import prisma from '@/lib/prisma';
import { Product } from '@/lib/products';
import { ShieldCheck, Truck, Clock, Sparkles, HelpCircle } from 'lucide-react';
import { getCategoryFaq, createFaqJsonLd } from '@/lib/seoFaq';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  const title = 'Testeurs de Parfums 100% Originaux au Maroc | Prix en MAD - NAY Parfum';
  const description = "Achetez des testeurs de parfums 100% originaux de grandes marques au Maroc chez NAY Parfums. Flacons authentiques, même sillage, prix réduits en MAD, livraison express 24/48h et paiement à la livraison (COD).";

  return {
    title: { absolute: title },
    description,
    keywords: [
      'testeurs de parfums maroc',
      'testeur parfum original maroc',
      'parfums testeurs pas cher maroc',
      'prix testeur parfum maroc',
      'achat testeur parfum maroc',
      'عطور تيستر أصلية المغرب'
    ],
    openGraph: {
      title,
      description,
      url: `https://nayparfum.ma/${currentLocale}/testeurs`,
    },
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/testeurs`,
      languages: {
        'fr-MA': 'https://nayparfum.ma/fr/testeurs',
        'ar-MA': 'https://nayparfum.ma/ar/testeurs',
        'x-default': 'https://nayparfum.ma/fr/testeurs',
      },
    },
  };
}

export const revalidate = 3600;

export default async function TesteursPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const { locale } = (await params) || { locale: 'fr' };
  const currentLocale = locale || 'fr';

  const [dbProducts, dbBrands, config] = await Promise.all([
    prisma.product.findMany({
      where: { 
        published: true, 
        isTester: true,
        subcategory: { notIn: ['master-copier', 'coffrets'] }
      }
    }),
    prisma.brand.findMany(),
    prisma.siteConfig.findFirst()
  ]);

  let recommendedSlugs: string[] = [];
  try {
    recommendedSlugs = JSON.parse((config as any)?.recommendedTesters || config?.recommendedShop || '[]');
  } catch {}
  
  const products: Product[] = dbProducts.map((p) => ({
    ...p,
    brand: p.brandId as any,
    gender: p.gender as any,
    subcategory: p.subcategory as any,
    images: JSON.parse(p.images),
    notes: JSON.parse(p.notes),
    sizes: JSON.parse(p.sizes),
    tags: JSON.parse(p.tags),
    bottleColor: p.bottleColor as any,
    bottleMaterial: p.bottleMaterial as any,
    perfectSeason: p.perfectSeason as any,
    originalPrice: p.originalPrice ?? undefined,
    isTester: true,
  }));

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
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
        name: 'Testeurs de Luxe',
        item: `https://nayparfum.ma/${currentLocale}/testeurs`,
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Testeurs de Parfums 100% Originaux au Maroc',
    description: "Découvrez notre collection exclusive de testeurs de grandes marques 100% authentiques au Maroc. Flacon d'origine, même sillage, prix exceptionnels.",
    url: `https://nayparfum.ma/${currentLocale}/testeurs`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'NAY Parfums',
      url: 'https://nayparfum.ma',
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Testeurs de Parfums Originaux',
    itemListElement: products.slice(0, 24).map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: p.name,
      url: `https://nayparfum.ma/${currentLocale}/product/${p.slug}`,
    })),
  };

  const categoryFaqItems = getCategoryFaq('testeurs');
  const faqJsonLd = createFaqJsonLd(categoryFaqItems);

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen relative overflow-hidden">
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Background Aura */}
      <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-[#0ea5e9]/5 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      
      {/* CSS for Liquid Glass Effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes liquid-glace {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .liquid-glace-text {
          background: linear-gradient(
            110deg,
            #111111 10%,
            #0ea5e9 30%,
            #ffffff 45%,
            #e0f2fe 50%,
            #0ea5e9 55%,
            #111111 75%
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: liquid-glace 8s linear infinite;
        }
      `}} />

      <Header />

      <section className="relative pt-32 pb-12 lg:pt-48 lg:pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center relative z-10 flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#0ea5e9] mb-4 flex items-center gap-1.5">
            <Sparkles size={14} /> Collection Testeurs de Luxe
          </span>
          <h1 className="heading-font text-5xl sm:text-6xl lg:text-[90px] leading-none tracking-tight mb-6">
            <span className="liquid-glace-text">L'EXCELLENCE</span>
            <br />
            <span className="font-serif italic font-light text-[#0ea5e9] text-4xl sm:text-5xl lg:text-[80px] liquid-glace-text">Des Testeurs</span>
          </h1>
          <p className="mt-2 text-[13px] md:text-[15px] text-[#555] font-light max-w-xl leading-[2] tracking-widest uppercase mb-10">
            Découvrez notre sélection exclusive de <span className="font-semibold text-[#111]">testeurs 100% authentiques</span> des plus grandes maisons. Flacon d'origine, même sillage et tenue d'exception.
          </p>

          {/* Minimalist Trust Signals */}
          <div className="flex flex-wrap justify-center gap-6 lg:gap-12 mt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#0ea5e9]" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#111]">100% Authentique</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-[#0ea5e9]" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#111]">Paiement à la livraison</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#0ea5e9]" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[#111]">Livraison 24-48h</span>
            </div>
          </div>

          {/* Contextual links to high-demand in-stock testers */}
          {products.filter(p => p.inStock && (p.stock ?? 0) > 0).length > 0 && (
            <div className="mt-8 pt-5 pb-2 border-t border-[#e0ddd4] max-w-2xl w-full">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] mb-3 text-center">
                Testeurs de luxe très demandés au Maroc :
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
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
                  return sorted.slice(0, 5).map((item) => (
                    <Link
                      key={item.id}
                      href={`/${currentLocale}/product/${item.slug}`}
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

      {/* CATALOG */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 py-10">
        <Suspense fallback={<div className="text-[#9A9A9A] text-sm">Chargement des testeurs…</div>}>
          <ShopCatalog products={products} brands={dbBrands} lockedIsTester={true} recommendedSlugs={recommendedSlugs} />
        </Suspense>
      </section>

      {/* Editorial Content Block & Dynamic FAQ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white border border-[#e0ddd4] rounded-2xl p-8 lg:p-12 shadow-sm">
          <h2 className="heading-font text-2xl lg:text-3xl text-[#1A1A1A] mb-4 tracking-wide text-center">
            Guide Complet des Testeurs de Parfums 100% Originaux au Maroc
          </h2>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-6 text-center max-w-2xl mx-auto">
            NAY Parfums est le spécialiste de référence au Maroc pour l'achat de testeurs de parfums authentiques de luxe aux meilleurs prix en dirhams (MAD).
          </p>

          <div className="space-y-4 text-[14px] text-[#6B6B6B] leading-relaxed border-t border-[#f0eee6] pt-6">
            <p>
              <strong>Qu’est-ce qu’un testeur de parfum ?</strong> Un testeur de parfum est un flacon officiel produit par les grandes maisons de parfumerie (Dior, Chanel, Tom Ford, Creed, Yves Saint Laurent, etc.) destiné aux comptoirs et parfumeries pour permettre aux clients de tester la fragrance. Le jus, la pyramide olfactive, la tenue et le flacon en verre sont rigoureusement identiques au produit de détail standard.
            </p>
            <p>
              <strong>Pourquoi un prix beaucoup plus avantageux ?</strong> Les testeurs sont livrés dans un emballage simplifié en carton blanc ou kraft avec la mention « Tester / Démonstration » et sont parfois fournis sans capuchon décoratif. En éliminant le coût du packaging luxueux commercial et des marges intermédiaires de distribution traditionnelle, vous bénéficiez d'une réduction directe de 30% à 50% sur le tarif boutique officiel au Maroc.
            </p>
            <p>
              <strong>Garantie Authenticité & Sécurité :</strong> Chaque flacon testeur proposé par NAY Parfums est garanti 100% original, traçable via son code de lot (batch code) officiel. Nous assurons la livraison rapide sous 24 à 48 heures dans toutes les villes du Maroc (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, etc.) avec l'option de paiement en espèces à la livraison (COD) pour une tranquillité d'esprit absolue.
            </p>
          </div>

          {/* Dynamic FAQ Accordions / Cards */}
          <div className="mt-10 pt-8 border-t border-[#f0eee6]">
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9]">Foire Aux Questions</span>
              <h3 className="heading-font text-xl lg:text-2xl text-[#1A1A1A] mt-1">
                Tout savoir sur les testeurs originaux au Maroc
              </h3>
            </div>
            <div className="space-y-4">
              {categoryFaqItems.map((faq, idx) => (
                <div key={idx} className="bg-[#f8f7f5] border border-[#e0ddd4] rounded-xl p-5 text-left">
                  <h4 className="text-[14px] font-bold text-[#1A1A1A] flex items-start gap-2.5 mb-2">
                    <HelpCircle size={18} className="text-[#0ea5e9] shrink-0 mt-0.5" />
                    <span>{faq.question}</span>
                  </h4>
                  <p className="text-[13px] text-[#6B6B6B] leading-relaxed pl-7">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Silo Links */}
          <div className="mt-10 pt-8 border-t border-[#f0eee6]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A] block text-center mb-4">
              Naviguer par univers olfactif :
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${currentLocale}/testeurs/men`}
                className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
              >
                Testeurs Parfums Homme au Maroc →
              </Link>
              <Link
                href={`/${currentLocale}/testeurs/women`}
                className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
              >
                Testeurs Parfums Femme au Maroc →
              </Link>
              <Link
                href={`/${currentLocale}/testeurs/unisex`}
                className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
              >
                Testeurs Parfums Mixtes / Unisexe au Maroc →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <CartDrawer />
    </div>
  );
}
