import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ShopCatalog from '@/components/ShopCatalog';
import BrandLogo from '@/components/BrandLogo';
import { type Brand } from '@/lib/products';
import prisma from '@/lib/prisma';
import { ChevronRight, ShieldCheck, Truck, Clock } from 'lucide-react';

type Params = { locale: string; brand: string };

export const revalidate = 3600;

import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, brand: brandSlug } = await params;
  const decodedBrandSlug = decodeURIComponent(brandSlug);
  const brand = await prisma.brand.findUnique({
    where: { slug: decodedBrandSlug }
  });

  if (!brand) return { title: 'Marque introuvable' };

  const currentLocale = locale || 'fr';

  return {
    title: `Parfums ${brand.name} | Acheter au Maroc`,
    description: `Découvrez la collection de parfums ${brand.name} chez NAY Parfums. 100% authentique. Livraison rapide partout au Maroc.`,
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/brands/${brand.slug}`,
      languages: {
        'fr-MA': `https://nayparfum.ma/fr/brands/${brand.slug}`,
        'ar-MA': `https://nayparfum.ma/ar/brands/${brand.slug}`,
        'x-default': `https://nayparfum.ma/fr/brands/${brand.slug}`,
      },
    },
    openGraph: {
      title: `Parfums ${brand.name} | Acheter au Maroc`,
      description: `Découvrez la collection de parfums ${brand.name} chez NAY Parfums. 100% authentique. Livraison rapide partout au Maroc.`,
      url: `https://nayparfum.ma/${currentLocale}/brands/${brand.slug}`,
      images: [{ url: `/images/brands/${brand.slug}-hero.jpg` }]
    }
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, brand: brandSlug } = await params;
  const decodedBrandSlug = decodeURIComponent(brandSlug);
  
  const brand = await prisma.brand.findUnique({
    where: { slug: decodedBrandSlug }
  });
  
  if (!brand) notFound();

  const dbProducts = await prisma.product.findMany({
    where: { 
      brandId: brand.slug,
      published: true 
    }
  });

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

  const dbBrands = await prisma.brand.findMany({
    where: { products: { some: { published: true } } }
  });

  const otherBrands = await prisma.brand.findMany({
    where: {
      slug: { not: brand.slug },
      products: { some: { published: true } }
    },
    take: 4
  });

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
        name: 'Marques',
        item: `https://nayparfum.ma/${locale}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: brand.label,
        item: `https://nayparfum.ma/${locale}/brands/${brand.slug}`,
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Parfums ${brand.label} au Maroc`,
    description: `Achetez vos parfums et testeurs ${brand.label} 100% originaux au Maroc. Flacons authentiques, livraison rapide et paiement à la livraison.`,
    url: `https://nayparfum.ma/${locale}/brands/${brand.slug}`,
    about: {
      '@type': 'Brand',
      name: brand.label,
    },
  };

  return (
    <div className="min-h-screen bg-[#f8f7f5] selection:bg-[#0ea5e9]/20 selection:text-[#1A1A1A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <Header />
      
      <main className="pt-24 lg:pt-32 pb-24">
        {/* Brand Header */}
        <section className="relative overflow-hidden mb-16 lg:mb-24">
          {/* Background Aura */}
          <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-[#0ea5e9]/5 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative z-10 max-w-3xl w-full mx-auto px-6 flex flex-col items-center">
            <nav className="flex items-center justify-center gap-2 text-[11px] text-[#6B6B6B] mb-10">
              <Link href={`/${locale}`} className="hover:text-[#0ea5e9]">Accueil</Link>
              <ChevronRight size={12} />
              <Link href={`/${locale}/shop`} className="hover:text-[#0ea5e9]">Marques</Link>
              <ChevronRight size={12} />
              <span className="text-[#1A1A1A] font-medium">{brand.label}</span>
            </nav>

            {/* Brand Logo Container */}
            <div className="w-32 h-32 md:w-40 md:h-40 relative rounded-full bg-white border border-[#e0ddd4] p-4 flex items-center justify-center shadow-sm mb-6 mix-blend-multiply">
              <div className="relative w-full h-full">
                <BrandLogo 
                  src={brand.image || `/images/brands/${brand.slug?.toLowerCase()}-logo.jpg`} 
                  alt={`${brand.label} Logo`}
                  label={brand.label}
                  className="object-contain mix-blend-multiply" 
                />
              </div>
            </div>

            <h1 className="heading-font text-3xl md:text-5xl font-bold tracking-tight text-[#1A1A1A] mb-4 text-center">
              Parfums {brand.label}
            </h1>

            <p className="text-[14px] md:text-[16px] text-[#6B6B6B] leading-relaxed font-light mb-8 max-w-2xl text-center">
              {brand.description}
            </p>

            <div className="inline-flex items-center justify-center px-6 py-2.5 border border-[#e0ddd4] rounded-full text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] bg-white shadow-sm">
              {products.length} {products.length === 1 ? 'parfum disponible' : 'parfums disponibles'}
            </div>
          </div>
        </section>

        <Suspense fallback={<div className="text-center text-[#9A9A9A]">Chargement…</div>}>
          <ShopCatalog products={products} brands={dbBrands} lockedBrand={brand.slug as Brand} />
        </Suspense>

        {/* Brand Guide & Reassurance for Moroccan Shoppers */}
        <section className="mt-20 max-w-4xl mx-auto px-6">
          <div className="bg-white border border-[#e0ddd4] rounded-2xl p-8 lg:p-10 shadow-sm">
            <h2 className="heading-font text-2xl lg:text-3xl text-[#1A1A1A] mb-4 tracking-wide text-center">
              Acheter vos Parfums {brand.label} au Maroc chez NAY Parfums
            </h2>
            <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-8 text-center max-w-2xl mx-auto">
              NAY Parfums vous propose une sélection rigoureuse de fragrances {brand.label} 100% originaux. Profitez des meilleurs prix au Maroc avec une garantie totale d'authenticité et un service client dédié.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#f0eee6]">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center mb-3">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  100% Authentique
                </h3>
                <p className="text-[12px] text-[#7A7A7A] leading-relaxed">
                  Produits authentiques vérifiables par code de lot, issus de distributeurs agréés.
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
                  Livraison rapide en 24/48h à Casablanca, Rabat, Marrakech, Fès, Tanger et tout le Maroc.
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
                  Réglez votre commande en espèces à la livraison (Cash on Delivery) après réception de votre colis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Other Brands Section */}
        <section className="mt-32 max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center mb-12 text-center">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">
              Autres Maisons
            </span>
            <h2 className="heading-font text-3xl lg:text-4xl mt-2 tracking-wide">
              Explorer nos autres marques
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {otherBrands.map((b) => (
              <Link
                key={b.slug}
                href={`/${locale}/brands/${b.slug}`}
                className="group border border-[#e0ddd4] bg-white rounded-xl overflow-hidden hover:border-[#0ea5e9] transition-all hover:shadow-lg flex flex-col h-40"
              >
                <div className="relative h-full w-full flex flex-col items-center justify-center p-6">
                  <BrandLogo 
                    src={b.image || `/images/brands/${b.slug?.toLowerCase()}-logo.jpg`} 
                    alt={b.name} 
                    label={b.label}
                    className="object-contain p-8 pb-10 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 mix-blend-multiply" 
                  />
                  <div className="absolute bottom-4 text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors line-clamp-1">{b.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
