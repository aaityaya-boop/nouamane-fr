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
import { ChevronRight, Sparkles, ShieldCheck, Truck, Clock, HelpCircle } from 'lucide-react';
import { getCategoryFaq, createFaqJsonLd } from '@/lib/seoFaq';

type Params = { locale: string; gender: string };

export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, gender } = await params;
  const category = getCategoryBySlug(gender);

  if (!category) return { title: 'Catégorie introuvable' };

  const currentLocale = locale || 'fr';
  const title = `Testeurs ${category.label} 100% Originaux au Maroc | Prix en MAD - NAY Parfum`;
  const description = `Découvrez notre sélection exclusive de testeurs de ${category.label.toLowerCase()} 100% originaux au Maroc chez NAY Parfums. Grandes marques, flacons authentiques, prix réduits en MAD, livraison express 24/48h et paiement à la livraison (COD).`;

  return {
    title: { absolute: title },
    description,
    keywords: [
      `testeurs ${category.slug} maroc`,
      `testeurs parfums ${category.slug} original`,
      `testeur ${category.label.toLowerCase()} maroc`,
      `prix parfum ${category.slug} maroc`,
      'عطور تيستر أصلية المغرب'
    ],
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/testeurs/${category.slug}`,
      languages: {
        'fr-MA': `https://nayparfum.ma/fr/testeurs/${category.slug}`,
        'ar-MA': `https://nayparfum.ma/ar/testeurs/${category.slug}`,
        'x-default': `https://nayparfum.ma/fr/testeurs/${category.slug}`,
      },
    },
    openGraph: {
      title,
      description,
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
        name: 'Testeurs',
        item: `https://nayparfum.ma/${locale}/testeurs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Testeurs ${category.label}`,
        item: `https://nayparfum.ma/${locale}/testeurs/${category.slug}`,
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Testeurs ${category.label} 100% Originaux au Maroc`,
    description: `Achetez vos testeurs de ${category.label.toLowerCase()} de grandes marques au Maroc. Flacons authentiques, même sillage, prix réduits en MAD.`,
    url: `https://nayparfum.ma/${locale}/testeurs/${category.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'NAY Parfums',
      url: 'https://nayparfum.ma',
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Catalogue Testeurs ${category.label} au Maroc`,
    itemListElement: products.slice(0, 24).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: p.name,
      url: `https://nayparfum.ma/${locale}/product/${p.slug}`,
    })),
  };

  const categoryFaqItems = getCategoryFaq(category.slug);
  const faqJsonLd = createFaqJsonLd(categoryFaqItems);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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
                  let prioritySlugs: string[] = [];
                  if (category.key === 'men') {
                    prioritySlugs = [
                      'Creed-Absolu-Aventus-Tester',
                      'Sauvage-Eau-De-Parfum',
                      'chanel-bleu-de-chanel-eau-de-parfum-tester',
                      'tom-ford-tobacco-vanille-tester'
                    ];
                  } else if (category.key === 'women') {
                    prioritySlugs = [
                      'la-vie-est-belle-tester',
                      'delina-edp-tester',
                      'burberry-goddess-eau-de-parfum-tester',
                      'si-fiori-tester'
                    ];
                  } else {
                    prioritySlugs = [
                      'xerjoff-erba-pura-tester',
                      'TOM-FORD-Black-Orchid-Reserve',
                      'vert-malachite-armani-prive-eau-de-parfum-tester',
                      'kayali-elixir-eau-de-parfum-tester'
                    ];
                  }
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

      {/* Editorial Content Block & Dynamic FAQ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white border border-[#e0ddd4] rounded-2xl p-8 lg:p-12 shadow-sm">
          <h2 className="heading-font text-2xl lg:text-3xl text-[#1A1A1A] mb-4 tracking-wide text-center">
            Pourquoi Choisir nos Testeurs {category.label} au Maroc ?
          </h2>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-6 text-center max-w-2xl mx-auto">
            Chez NAY Parfums, retrouvez l'élégance et la puissance olfactive des plus grandes créations de parfumerie mondiale destinées {category.key === 'men' ? 'aux hommes' : category.key === 'women' ? 'aux femmes' : 'à tous'} avec une garantie absolue d'authenticité.
          </p>

          <div className="space-y-4 text-[14px] text-[#6B6B6B] leading-relaxed border-t border-[#f0eee6] pt-6">
            <p>
              Nos <strong>testeurs de parfums {category.label.toLowerCase()}</strong> proviennent directement des circuits de distribution agréés des plus grandes maisons de luxe en Europe. Contrairement aux copies ou imitations, un testeur authentique contient rigoureusement le même concentré d’essence que le flacon commercial en boutique.
            </p>
            <p>
              En choisissant un testeur, vous évitez le surcoût de l’emballage commercial scellé et profitez d’une remise immédiate de 30% à 50% sur le tarif régulier, tout en recevant un flacon en verre officiel et un jus à la tenue et au sillage exceptionnels.
            </p>
            <p>
              Chaque commande bénéficie de notre expédition sécurisée en 24h à 48h sur l'ensemble du territoire marocain (Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, etc.), du <strong>paiement à la livraison (Cash on Delivery)</strong> et d'un droit de retour sous 7 jours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 mt-8 border-t border-[#f0eee6]">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center mb-3">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                100% Original
              </h3>
              <p className="text-[12px] text-[#7A7A7A] leading-relaxed">
                Flacons traçables par numéro de lot (batch code).
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center mb-3">
                <Truck size={22} />
              </div>
              <h3 className="text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Livraison Express Maroc
              </h3>
              <p className="text-[12px] text-[#7A7A7A] leading-relaxed">
                24-48h partout au Maroc avec suivi de colis.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center mb-3">
                <Clock size={22} />
              </div>
              <h3 className="text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Paiement à la Livraison
              </h3>
              <p className="text-[12px] text-[#7A7A7A] leading-relaxed">
                Réglez en toute sécurité en espèces à la réception.
              </p>
            </div>
          </div>

          {/* Dynamic FAQ Section */}
          <div className="mt-10 pt-8 border-t border-[#f0eee6]">
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9]">Questions Fréquentes</span>
              <h3 className="heading-font text-xl lg:text-2xl text-[#1A1A1A] mt-1">
                Tout savoir sur nos testeurs {category.label} au Maroc
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

          {/* Contextual Buyer Guides & Editorial Silo */}
          <div className="mt-10 pt-8 border-t border-[#f0eee6]">
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9]">
                Guides d&apos;Achat &amp; Conseils d&apos;Experts
              </span>
              <h3 className="heading-font text-xl lg:text-2xl text-[#1A1A1A] mt-1">
                Tout savoir sur les testeurs {category.label.toLowerCase()} au Maroc
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={`/${locale}/blog/guide-testeur-parfum-vs-flacon-retail`}
                className="group p-5 bg-[#f8f7f5] hover:bg-[#0ea5e9]/5 rounded-xl border border-[#e0ddd4] hover:border-[#0ea5e9] transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9] block mb-1">Guide Comparatif</span>
                  <h4 className="text-[14px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors mb-2">
                    Testeur vs Flacon Commercial : Ce Qu&apos;il Faut Savoir
                  </h4>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                    Même jus authentique, même tenue : découvrez pourquoi les testeurs sont l&apos;option préférée des connaisseurs au Maroc.
                  </p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#0ea5e9] mt-3 inline-flex items-center gap-1">
                  Lire le guide →
                </span>
              </Link>

              <Link
                href={
                  category.key === 'men'
                    ? `/${locale}/blog/meilleur-parfum-homme-longue-tenue-maroc`
                    : category.key === 'women'
                    ? `/${locale}/blog/meilleur-parfum-femme-sillage-maroc`
                    : `/${locale}/blog/quel-parfum-choisir-selon-la-saison-maroc`
                }
                className="group p-5 bg-[#f8f7f5] hover:bg-[#0ea5e9]/5 rounded-xl border border-[#e0ddd4] hover:border-[#0ea5e9] transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9] block mb-1">Sélection Signature</span>
                  <h4 className="text-[14px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors mb-2">
                    {category.key === 'men'
                      ? 'Les Meilleurs Parfums Homme à Longue Tenue au Maroc'
                      : category.key === 'women'
                      ? 'Les Meilleurs Parfums Femme au Sillage Remarquable'
                      : 'Quel Parfum Choisir Selon la Saison au Maroc ?'}
                  </h4>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                    {category.key === 'men'
                      ? 'Fragrances masculines à forte projection et sillage puissant testées sous le climat marocain.'
                      : category.key === 'women'
                      ? 'Sélection de sillages féminins envoûtants, floraux et vanillés plébiscités au Maroc.'
                      : 'Notre guide climatique complet pour choisir les notes adaptées à chaque saison au Maroc.'}
                  </p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#0ea5e9] mt-3 inline-flex items-center gap-1">
                  Lire le guide →
                </span>
              </Link>
            </div>
          </div>

          {/* Category Silo Links */}
          <div className="mt-10 pt-8 border-t border-[#f0eee6]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A7A] block text-center mb-4">
              Explorer les autres catégories de testeurs :
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${locale}/testeurs`}
                className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
              >
                Tous les Testeurs de Luxe au Maroc →
              </Link>
              {category.slug !== 'men' && (
                <Link
                  href={`/${locale}/testeurs/men`}
                  className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
                >
                  Testeurs Parfums Homme →
                </Link>
              )}
              {category.slug !== 'women' && (
                <Link
                  href={`/${locale}/testeurs/women`}
                  className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
                >
                  Testeurs Parfums Femme →
                </Link>
              )}
              {category.slug !== 'unisex' && (
                <Link
                  href={`/${locale}/testeurs/unisex`}
                  className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
                >
                  Testeurs Parfums Unisexe →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <CartDrawer />
    </div>
  );
}
