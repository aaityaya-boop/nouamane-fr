'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronRight, ShieldCheck, Sparkles, Award, Star, Zap } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import dynamic from 'next/dynamic';
import { formatMAD, type Product } from '@/lib/products';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false });

export default function ConceptCClient({
  products = [],
  brands = []
}: {
  products: Product[];
  brands: any[];
}) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';

  const bestsellers = products.filter(p => p.tags?.includes('bestseller')).slice(0, 4);
  const displayProducts = bestsellers.length >= 4 ? bestsellers : products.slice(0, 4);

  const heroProduct = products.find(p => p.slug?.includes('amouage') || p.slug?.includes('baccarat') || p.slug?.includes('magenta')) || products[0] || {
    name: 'Interlude Men',
    brandLabel: 'AMOUAGE',
    price: 299,
    originalPrice: 499,
    slug: 'amouage-interlude-man-tester',
    images: ['https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784027249449-582318655-amouage_interloude_men.jpg']
  };

  return (
    <div className="bg-[#FAF8F5] text-[#0B192C] min-h-screen selection:bg-[#0ea5e9]/20 selection:text-[#0B192C]">
      <Header />

      <main className="pt-20 sm:pt-28 pb-16">
        {/* ========================================================
            HERO: NAY SIGNATURE BOUTIQUE (Arched Alcove & Brand Crest)
            ======================================================== */}
        <section className="relative px-4 sm:px-6 lg:px-12 pt-6 sm:pt-10 pb-12 overflow-hidden">
          {/* Subtle Ambient Navy Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-sky-200/40 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-[1240px] mx-auto text-center relative z-10">
            {/* Signature Crest / Monogram Banner */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-[#E2DFD2] px-3.5 py-1.5 rounded-full shadow-2xs mb-4">
              <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
              <span className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-[#0B192C]">
                NAY PARFUM · LA PARFUMERIE SIGNATURE
              </span>
            </div>

            <h1 className="heading-font text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0B192C] tracking-tight leading-[1.1] max-w-xl mx-auto">
              Le Sanctuaire des <span className="text-[#0ea5e9]">Essences Rares</span>
            </h1>

            <p className="text-[13px] text-[#4A5568] max-w-md mx-auto mt-2.5 leading-relaxed font-normal">
              Testeurs d'exception et parfums originaux importés. 
              Vivez l'expérience Try Before You Pay : testez votre parfum avant de régler le livreur.
            </p>

            {/* Architectural Arched Portal Flacon Showcase */}
            <div className="relative my-7 sm:my-10 flex flex-col items-center">
              {/* The Signature Arched Frame */}
              <div className="relative w-[280px] sm:w-[340px] h-[340px] sm:h-[400px] rounded-t-full bg-gradient-to-b from-white via-white/90 to-[#FAF8F5] border-t-2 border-x-2 border-[#E2DFD2] p-6 flex flex-col items-center justify-between shadow-[0_15px_35px_-10px_rgba(11,25,44,0.08)]">
                
                {/* Micro Arch Keyhole Header */}
                <div className="text-[9.5px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9] mt-2">
                  CRU D’EXCEPTION 2026
                </div>

                {/* Central Flacon */}
                <Link
                  href={`/${locale}/product/${heroProduct.slug}`}
                  className="relative w-full h-[220px] sm:h-[260px] flex items-center justify-center group cursor-pointer"
                >
                  <Image
                    src={heroProduct.images[0] || 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784027249449-582318655-amouage_interloude_men.jpg'}
                    alt={heroProduct.name}
                    fill
                    priority
                    unoptimized
                    className="object-contain drop-shadow-[0_18px_25px_rgba(11,25,44,0.18)] group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                {/* Arch Base Metadata */}
                <div className="w-full pt-2 border-t border-[#EEEBE2] flex items-center justify-between text-left">
                  <div>
                    <span className="text-[9px] font-bold text-[#0ea5e9] uppercase tracking-wider block">
                      {heroProduct.brandLabel}
                    </span>
                    <span className="text-[12.5px] font-bold text-[#0B192C] truncate block max-w-[160px]">
                      {heroProduct.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[14px] font-extrabold text-[#0B192C]">
                      {formatMAD(heroProduct.price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
              <Link
                href={`/${locale}/testeurs`}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#0B192C] hover:bg-[#132A4A] text-white rounded-full font-bold text-[12px] tracking-[0.12em] uppercase flex items-center justify-center gap-2 shadow-lg shadow-sky-950/20 active:scale-[0.98] transition"
              >
                <Sparkles size={14} className="text-[#0ea5e9]" />
                <span>Découvrir les Testeurs VIP</span>
              </Link>

              <Link
                href={`/${locale}/shop`}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-[#0B192C] border border-[#E2DFD2] rounded-full font-bold text-[12px] tracking-wider uppercase transition text-center"
              >
                <span>Toute la Boutique</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================
            CATEGORY DISCOVERY: THE 3 ARCHED PORTALS
            ======================================================== */}
        <section className="px-4 sm:px-6 lg:px-12 py-8 bg-white border-y border-[#EAE6DB]">
          <div className="max-w-[1240px] mx-auto">
            <div className="text-center max-w-md mx-auto mb-6">
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9] block mb-1">
                Portails Thématiques
              </span>
              <h2 className="heading-font text-xl sm:text-2xl font-bold text-[#0B192C]">
                Explorez Nos Univers
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6">
              {[
                { 
                  title: 'Univers Féminin', 
                  desc: 'Sillages floraux, fruités & gourmands raffinés', 
                  href: `/${locale}/shop/women`,
                  img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986846939-Narciso_Rouge.jpg',
                  tag: 'Pour Elle'
                },
                { 
                  title: 'Univers Masculin', 
                  desc: 'Accords boisés, cuirés & magnétiques intenses', 
                  href: `/${locale}/shop/men`,
                  img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986823993-Dior_Homme_Intense.jpg',
                  tag: 'Pour Lui'
                },
                { 
                  title: 'Écrin Testeurs Privés', 
                  desc: 'Authentiques testeurs de luxe sous emballage d’origine', 
                  href: `/${locale}/testeurs`,
                  img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784027249449-582318655-amouage_interloude_men.jpg',
                  tag: 'Exclusif NAY'
                },
              ].map((portal, idx) => (
                <Link
                  key={idx}
                  href={portal.href}
                  className="group rounded-3xl bg-[#FAF8F5] border border-[#E2DFD2] p-5 flex items-center gap-4 hover:border-[#0ea5e9] hover:shadow-xs transition duration-300"
                >
                  <div className="relative w-20 h-24 rounded-2xl bg-white border border-[#EEEBE2] overflow-hidden shrink-0">
                    <Image
                      src={portal.img}
                      alt={portal.title}
                      fill
                      className="object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9.5px] font-bold text-[#0ea5e9] uppercase tracking-wider block mb-0.5">
                      {portal.tag}
                    </span>
                    <h3 className="heading-font text-[15px] font-bold text-[#0B192C] group-hover:text-[#0ea5e9] transition-colors truncate">
                      {portal.title}
                    </h3>
                    <p className="text-[11px] text-[#6B7280] line-clamp-2 mt-0.5 leading-snug">
                      {portal.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            FEATURED: LES TRÉSORS DE NAY
            ======================================================== */}
        <section className="px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
          <div className="max-w-[1240px] mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9] block mb-1">
                  Les Favoris de Casablanca & du Maroc
                </span>
                <h2 className="heading-font text-2xl sm:text-3xl font-extrabold text-[#0B192C]">
                  Les Trésors de NAY
                </h2>
              </div>
              <Link href={`/${locale}/shop`} className="text-[11.5px] font-bold uppercase tracking-wider text-[#0B192C] hover:text-[#0ea5e9] transition flex items-center gap-1">
                <span>Voir tout le catalogue</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
              {displayProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            TRUST: LE PACTE CONFIANCE NAY
            ======================================================== */}
        <section className="px-4 sm:px-6 lg:px-12 py-6">
          <div className="max-w-[1240px] mx-auto bg-gradient-to-br from-[#0B192C] to-[#122A4A] text-white rounded-3xl p-6 sm:p-10 shadow-lg shadow-sky-950/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/30 px-3 py-1 rounded-full text-[10.5px] font-bold tracking-widest uppercase text-sky-300 mb-2.5">
                  <ShieldCheck size={14} />
                  <span>Pacte Confiance NAY Parfum</span>
                </div>
                <h3 className="heading-font text-2xl sm:text-3xl font-bold">
                  Testez Avant de Payer. Zéro Compromis.
                </h3>
                <p className="text-[13px] text-white/70 max-w-lg mt-1.5 leading-relaxed">
                  Votre parfum est livré partout au Maroc sous 24 à 48 heures. Ouvrez le colis, testez le parfum devant le livreur. 
                  S'il ne correspond pas exactement à vos attentes, vous ne payez rien, même pas les frais de port.
                </p>
              </div>

              <div className="text-center sm:text-right shrink-0">
                <Link
                  href={`/${locale}/shop`}
                  className="inline-block px-8 py-3.5 bg-[#0ea5e9] hover:bg-sky-400 text-white rounded-full font-bold text-[12px] tracking-wider uppercase transition shadow-md"
                >
                  Choisir Mon Parfum
                </Link>
                <div className="text-[10px] text-white/50 mt-2">
                  Livraison gratuite dès 800 MAD
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
