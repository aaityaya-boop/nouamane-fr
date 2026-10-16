import React, { Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ShopCatalog from '@/components/ShopCatalog';
import prisma from '@/lib/prisma';
import { Product } from '@/lib/products';
import { ShieldCheck, Truck, Clock, Sparkles, HelpCircle } from 'lucide-react';
import { getOrientalCategoryFaq, createFaqJsonLd } from '@/lib/seoFaq';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  const title = 'Parfums Orientaux au Maroc : Oud, Ambre & Sillage Intense | NAY Parfum';
  const description = "Découvrez notre collection exclusive de parfums orientaux 100% originaux au Maroc chez NAY Parfums. Fragrances au oud noble, ambre précieux et épices chaudes. Livraison express 24/48h et paiement à la livraison (COD).";

  return {
    title: { absolute: title },
    description,
    keywords: [
      'parfums orientaux maroc',
      'parfum oriental maroc',
      'parfum oud maroc',
      'parfum ambre maroc',
      'parfum oriental homme maroc',
      'parfum oriental femme maroc',
      'عطور شرقية المغرب',
      'عطور العود المغرب'
    ],
    openGraph: {
      title,
      description,
      url: `https://nayparfum.ma/${currentLocale}/parfums-orientaux`,
    },
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/parfums-orientaux`,
      languages: {
        'fr-MA': 'https://nayparfum.ma/fr/parfums-orientaux',
        'ar-MA': 'https://nayparfum.ma/ar/parfums-orientaux',
        'x-default': 'https://nayparfum.ma/fr/parfums-orientaux',
      },
    },
  };
}

export const revalidate = 3600;

export default async function ParfumsOrientauxPage({
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
        OR: [
          { subcategory: 'oriental' },
          { subcategory: 'arabic' }
        ],
        subcategory: { notIn: ['master-copier', 'coffrets'] }
      }
    }),
    prisma.brand.findMany(),
    prisma.siteConfig.findFirst()
  ]);

  let recommendedSlugs: string[] = [];
  try {
    recommendedSlugs = JSON.parse(config?.recommendedOriental || '[]');
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
        name: 'Parfums Orientaux & Oud',
        item: `https://nayparfum.ma/${currentLocale}/parfums-orientaux`,
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Parfums Orientaux au Maroc (Oud, Ambre & Sillage Intense)',
    description: "Découvrez notre collection exclusive de parfums orientaux, oud et ambre au Maroc. Sillage magnétique, tenue exceptionnelle et paiement à la livraison.",
    url: `https://nayparfum.ma/${currentLocale}/parfums-orientaux`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'NAY Parfums',
      url: 'https://nayparfum.ma',
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Parfums Orientaux au Maroc',
    itemListElement: products.slice(0, 24).map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: p.name,
      url: `https://nayparfum.ma/${currentLocale}/product/${p.slug}`,
    })),
  };

  const categoryFaqItems = getOrientalCategoryFaq();
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
            <Sparkles size={14} /> Collection Haute Parfumerie Orientale
          </span>
          <h1 className="heading-font text-5xl sm:text-6xl lg:text-[90px] leading-none tracking-tight mb-6">
            <span className="liquid-glace-text">L'EXCELLENCE</span>
            <br />
            <span className="font-serif italic font-light text-[#0ea5e9] text-4xl sm:text-5xl lg:text-[80px] liquid-glace-text">Orientale &amp; Oud</span>
          </h1>
          <p className="mt-2 text-[13px] md:text-[15px] text-[#555] font-light max-w-xl leading-[2] tracking-widest uppercase mb-10">
            Découvrez une sélection prestigieuse de <span className="font-semibold text-[#111]">parfums orientaux intenses</span> : bois de oud noble, ambre impérial, tabac suave et épices rares. Sillage remarquable et tenue d&apos;exception au Maroc.
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

          {/* Contextual links to high-demand oriental icons */}
          {products.filter(p => p.inStock && (p.stock ?? 0) > 0).length > 0 && (
            <div className="mt-8 pt-5 pb-2 border-t border-[#e0ddd4] max-w-2xl w-full">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] mb-3 text-center">
                Sillages orientaux emblématiques en stock au Maroc :
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {(() => {
                  const prioritySlugs = [
                    'montale-oud-tobacco-tester',
                    'tom-ford-tobacco-vanille-tester',
                    'TOM-FORD-OUD-WOOD-Edp',
                    'Armani-Stronger-With-You-Amber',
                    'Qaaed-lattafa'
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
        <Suspense fallback={<div className="text-[#9A9A9A] text-sm">Chargement du catalogue oriental…</div>}>
          <ShopCatalog products={products} brands={dbBrands} recommendedSlugs={recommendedSlugs} />
        </Suspense>
      </section>

      {/* Editorial Content Block & Dynamic FAQ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white border border-[#e0ddd4] rounded-2xl p-8 lg:p-12 shadow-sm">
          <h2 className="heading-font text-2xl lg:text-3xl text-[#1A1A1A] mb-4 tracking-wide text-center">
            L&apos;Art de la Parfumerie Orientale au Maroc : Oud Noble, Ambre &amp; Épices Rares
          </h2>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-6 text-center max-w-2xl mx-auto">
            Au Maroc, le parfum oriental est bien plus qu&apos;une parure : c&apos;est une célébration de l&apos;hospitalité, une empreinte identitaire et un héritage olfactif précieux.
          </p>

          <div className="space-y-4 text-[14px] text-[#6B6B6B] leading-relaxed border-t border-[#f0eee6] pt-6">
            <p>
              <strong>La noblesse des matières premières orientales :</strong> Notre collection rassemble les plus illustres créations de parfumerie orientale et de niche : le bois de oud (agarwood) mystique et profond, l&apos;ambre gris aux reflets solaires, la vanille bourbon gourmande, le safran précieux et les feuilles de tabac blond. Ces essences nobles confèrent à chaque fragrance un sillage puissant (<em>فوحان</em>) et une rémanence cutanée exceptionnelle (<em>ثبات</em>).
            </p>
            <p>
              <strong>Conseils de port sous le climat marocain :</strong> Les compositions orientales et ambrées se déploient avec une splendeur majestueuse lors des soirées fraîches, des célébrations traditionnelles et tout au long de l&apos;automne et de l&apos;hiver au Maroc. En période estivale, nous recommandons une vaporisation légère sur les textiles naturels (lin, coton) ou les revers de vestes pour profiter d&apos;un sillage aérien sans lourdeur.
            </p>
            <p>
              <strong>Authenticité garantie et livraison express :</strong> Chaque flacon oriental proposé sur NAY Parfums est 100% authentique avec numéro de lot vérifiable. Bénéficiez d&apos;une expédition rapide sous 24 à 48 heures dans toutes les villes du royaume avec paiement sécurisé à la livraison en espèces (COD).
            </p>
          </div>

          {/* Dynamic FAQ */}
          <div className="mt-10 pt-8 border-t border-[#f0eee6]">
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9]">Foire Aux Questions</span>
              <h3 className="heading-font text-xl lg:text-2xl text-[#1A1A1A] mt-1">
                Tout savoir sur nos parfums orientaux au Maroc
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

          {/* Editorial Authority & Buyer Guides Silo */}
          <div className="mt-10 pt-8 border-t border-[#f0eee6]">
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9]">
                Guides d&apos;Experts &amp; Conseils d&apos;Achat
              </span>
              <h3 className="heading-font text-xl lg:text-2xl text-[#1A1A1A] mt-1">
                Approfondir votre découverte des fragrances orientales
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href={`/${currentLocale}/blog/guide-parfums-orientaux-maroc-oud-ambre`}
                className="group p-5 bg-[#f8f7f5] hover:bg-[#0ea5e9]/5 rounded-xl border border-[#e0ddd4] hover:border-[#0ea5e9] transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9] block mb-1">Guide Olfactif</span>
                  <h4 className="text-[14px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors mb-2">
                    Meilleurs Parfums Orientaux : Oud &amp; Ambre
                  </h4>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                    Dossier complet sur les essences d&apos;Orient, le bois de oud noble et les accords les plus prisés au Maroc.
                  </p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#0ea5e9] mt-3 inline-flex items-center gap-1">
                  Lire le guide →
                </span>
              </Link>

              <Link
                href={`/${currentLocale}/blog/quel-parfum-choisir-selon-la-saison-maroc`}
                className="group p-5 bg-[#f8f7f5] hover:bg-[#0ea5e9]/5 rounded-xl border border-[#e0ddd4] hover:border-[#0ea5e9] transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9] block mb-1">Conseil Saisonnier</span>
                  <h4 className="text-[14px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors mb-2">
                    Quel Parfum Selon la Saison au Maroc ?
                  </h4>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                    Comment adapter les fragrances ambrées et épicées aux températures marocaines au fil de l&apos;année.
                  </p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#0ea5e9] mt-3 inline-flex items-center gap-1">
                  Lire le guide →
                </span>
              </Link>

              <Link
                href={`/${currentLocale}/testeurs`}
                className="group p-5 bg-[#f8f7f5] hover:bg-[#0ea5e9]/5 rounded-xl border border-[#e0ddd4] hover:border-[#0ea5e9] transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9] block mb-1">Collection Complète</span>
                  <h4 className="text-[14px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors mb-2">
                    Nos Testeurs de Parfums Originaux
                  </h4>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                    Découvrez également l&apos;intégralité de nos testeurs de grandes maisons de luxe mondiales dès 299 MAD.
                  </p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#0ea5e9] mt-3 inline-flex items-center gap-1">
                  Voir les testeurs →
                </span>
              </Link>
            </div>
          </div>

          {/* Category Silo Links */}
          <div className="mt-10 pt-8 border-t border-[#f0eee6]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A] block text-center mb-4">
              Explorer les autres univers de parfumerie :
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${currentLocale}/testeurs`}
                className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
              >
                Tous les Testeurs de Luxe →
              </Link>
              <Link
                href={`/${currentLocale}/testeurs/men`}
                className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
              >
                Testeurs Homme au Maroc →
              </Link>
              <Link
                href={`/${currentLocale}/testeurs/women`}
                className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
              >
                Testeurs Femme au Maroc →
              </Link>
              <Link
                href={`/${currentLocale}/parfums-originaux`}
                className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
              >
                Parfums Originaux Scellés →
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
