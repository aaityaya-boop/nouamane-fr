import React, { Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ShopCatalog from '@/components/ShopCatalog';
import prisma from '@/lib/prisma';
import { Product } from '@/lib/products';
import { ShieldCheck, Truck, Clock, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { getOriginauxCategoryFaq, createFaqJsonLd } from '@/lib/seoFaq';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  const title = 'Parfums Originaux Scellés 100% Authentiques au Maroc | NAY Parfum';
  const description = "Achetez des parfums 100% originaux dans leur emballage scellé d'origine au Maroc chez NAY Parfums. Grandes marques, garantie d'authenticité, batch code vérifiable, livraison express 24/48h et paiement à la livraison (COD).";

  return {
    title: { absolute: title },
    description,
    keywords: [
      'parfums originaux maroc',
      'parfum original maroc',
      'parfum authentique maroc',
      'parfum boite scellee maroc',
      'prix parfum original maroc',
      'achat parfum de luxe maroc',
      'عطور أصلية المغرب'
    ],
    openGraph: {
      title,
      description,
      url: `https://nayparfum.ma/${currentLocale}/parfums-originaux`,
    },
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/parfums-originaux`,
      languages: {
        'fr-MA': 'https://nayparfum.ma/fr/parfums-originaux',
        'ar-MA': 'https://nayparfum.ma/ar/parfums-originaux',
        'x-default': 'https://nayparfum.ma/fr/parfums-originaux',
      },
    },
  };
}

export const revalidate = 3600;

export default async function ParfumsOriginauxPage({
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
        isTester: false,
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
    isTester: false,
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
        name: 'Parfums Originaux Scellés',
        item: `https://nayparfum.ma/${currentLocale}/parfums-originaux`,
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Parfums Originaux 100% Authentiques au Maroc',
    description: "Découvrez notre collection de parfums 100% originaux dans leur packaging scellé d'origine au Maroc. Grandes marques, livraison express et paiement à la livraison.",
    url: `https://nayparfum.ma/${currentLocale}/parfums-originaux`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'NAY Parfums',
      url: 'https://nayparfum.ma',
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Parfums Originaux Scellés au Maroc',
    itemListElement: products.slice(0, 24).map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: p.name,
      url: `https://nayparfum.ma/${currentLocale}/product/${p.slug}`,
    })),
  };

  const categoryFaqItems = getOriginauxCategoryFaq();
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
            <Sparkles size={14} /> Collection Parfums Originaux Scellés
          </span>
          <h1 className="heading-font text-5xl sm:text-6xl lg:text-[90px] leading-none tracking-tight mb-6">
            <span className="liquid-glace-text">L'EXCELLENCE</span>
            <br />
            <span className="font-serif italic font-light text-[#0ea5e9] text-4xl sm:text-5xl lg:text-[80px] liquid-glace-text">Originale Scellée</span>
          </h1>
          <p className="mt-2 text-[13px] md:text-[15px] text-[#555] font-light max-w-xl leading-[2] tracking-widest uppercase mb-10">
            Découvrez notre sélection exclusive de <span className="font-semibold text-[#111]">parfums 100% authentiques</span> dans leur conditionnement et emballage scellé d'origine. Idéal pour offrir ou se faire plaisir au Maroc.
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

          {/* Contextual links to high-demand products in stock */}
          {products.filter(p => p.inStock && (p.stock ?? 0) > 0).length > 0 && (
            <div className="mt-8 pt-5 pb-2 border-t border-[#e0ddd4] max-w-2xl w-full">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] mb-3 text-center">
                Flacons scellés disponibles immédiatement au Maroc :
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {products.filter(p => p.inStock && (p.stock ?? 0) > 0).slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/${currentLocale}/product/${item.slug}`}
                    className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-white hover:bg-[#0ea5e9]/10 px-3.5 py-1.5 rounded-full border border-[#e0ddd4] transition-all shadow-sm"
                  >
                    {item.name} · {item.price} MAD
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CATALOG */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 py-10">
        <Suspense fallback={<div className="text-[#9A9A9A] text-sm">Chargement du catalogue…</div>}>
          <ShopCatalog products={products} brands={dbBrands} lockedIsTester={false} recommendedSlugs={recommendedSlugs} />
        </Suspense>
      </section>

      {/* Editorial Content Block & Dynamic FAQ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white border border-[#e0ddd4] rounded-2xl p-8 lg:p-12 shadow-sm">
          <h2 className="heading-font text-2xl lg:text-3xl text-[#1A1A1A] mb-4 tracking-wide text-center">
            Guide d&apos;Achat des Parfums Originaux au Maroc : Authenticité &amp; Sérénité
          </h2>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-6 text-center max-w-2xl mx-auto">
            Chez NAY Parfums, retrouvez l&apos;exigence de la haute parfumerie mondiale avec des flacons scellés neufs sous blister officiel, directement importés des circuits européens agréés.
          </p>

          <div className="space-y-4 text-[14px] text-[#6B6B6B] leading-relaxed border-t border-[#f0eee6] pt-6">
            <p>
              <strong>L&apos;assurance du packaging commercial d&apos;origine :</strong> Les parfums de cette collection sont présentés dans leur conditionnement de luxe officiel complet, scellé sous film cellophane avec dorures, logos en relief et boîte cartonnée protectrice. C&apos;est le format parfait pour un cadeau de prestige ou pour les passionnés qui souhaitent une expérience déballage somptueuse.
            </p>
            <p>
              <strong>Flacon scellé vs Testeur : quelle option privilégier ?</strong> Si vous cherchez un flacon pour vous-même au quotidien, nos <Link href={`/${currentLocale}/testeurs`} className="text-sky-600 hover:underline font-semibold">testeurs de parfums originaux</Link> offrent exactement le même jus olfactif dans une boîte neutre à prix réduit. Si vous recherchez un présent d&apos;exception ou le flaconnage scellé avec son blister d&apos;origine, notre sélection de parfums originaux scellés répond rigoureusement à vos exigences.
            </p>
            <p>
              <strong>Traçabilité &amp; Sécurité :</strong> Chaque boîte et chaque flacon portent un numéro de lot (batch code) identique, garantissant une authenticité incontestable. Commandez avec une livraison express en 24h à 48h partout au Maroc et réglez en espèces à la livraison (Cash on Delivery).
            </p>
          </div>

          {/* Dynamic FAQ */}
          <div className="mt-10 pt-8 border-t border-[#f0eee6]">
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9]">Foire Aux Questions</span>
              <h3 className="heading-font text-xl lg:text-2xl text-[#1A1A1A] mt-1">
                Tout savoir sur nos parfums originaux au Maroc
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
                Conseils indispensables avant votre achat au Maroc
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href={`/${currentLocale}/blog/comment-reconnaitre-un-parfum-original-maroc`}
                className="group p-5 bg-[#f8f7f5] hover:bg-[#0ea5e9]/5 rounded-xl border border-[#e0ddd4] hover:border-[#0ea5e9] transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9] block mb-1">Authenticité</span>
                  <h4 className="text-[14px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors mb-2">
                    Comment Reconnaître un Parfum Original ?
                  </h4>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                    Décryptage complet des batch codes, qualité du verre et astuces pour déjouer les contrefaçons au Maroc.
                  </p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#0ea5e9] mt-3 inline-flex items-center gap-1">
                  Lire le guide →
                </span>
              </Link>

              <Link
                href={`/${currentLocale}/blog/guide-testeur-parfum-vs-flacon-retail`}
                className="group p-5 bg-[#f8f7f5] hover:bg-[#0ea5e9]/5 rounded-xl border border-[#e0ddd4] hover:border-[#0ea5e9] transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9] block mb-1">Guide Comparatif</span>
                  <h4 className="text-[14px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors mb-2">
                    Testeur vs Flacon Commercial : La Vérité
                  </h4>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                    Découvrez pourquoi le jus est 100% identique et comment économiser jusqu&apos;à 50% sur vos flacons personnels.
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9] block mb-1">Alternative Économique</span>
                  <h4 className="text-[14px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors mb-2">
                    Nos Testeurs de Luxe 100% Originaux
                  </h4>
                  <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                    Accédez aux plus grands chefs-d&apos;œuvre de la parfumerie mondiale dès 299 MAD en boîte neutre d&apos;origine.
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
                href={`/${currentLocale}/parfums-orientaux`}
                className="text-[12px] font-medium text-[#1A1A1A] hover:text-[#0ea5e9] bg-[#f8f7f5] hover:bg-[#0ea5e9]/10 px-4 py-2 rounded-full border border-[#e0ddd4] transition-all"
              >
                Collection Parfums Orientaux &amp; Oud →
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
