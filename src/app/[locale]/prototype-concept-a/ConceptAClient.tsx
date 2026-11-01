'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Sparkles, ShieldCheck, Star, Heart, Zap } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import dynamic from 'next/dynamic';
import { formatMAD, type Product } from '@/lib/products';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false });

export default function ConceptAClient({
  products = [],
  brands = []
}: {
  products: Product[];
  brands: any[];
}) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';

  // Editorial featured flacons
  const bestsellers = products.filter(p => p.tags?.includes('bestseller')).slice(0, 4);
  const displayProducts = bestsellers.length >= 4 ? bestsellers : products.slice(0, 4);

  const heroProduct = products.find(p => p.slug?.includes('magenta') || p.slug?.includes('sauvage') || p.slug?.includes('homme')) || products[0] || {
    name: 'Magenta Tanzanite',
    brandLabel: 'GIORGIO ARMANI',
    price: 299,
    originalPrice: 499,
    slug: 'armani-prive-magenta-tanzanite-tester',
    images: ['https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986804567-armani_prive_magenta.jpg']
  };

  return (
    <div className="bg-[#FAF9F5] text-[#121212] min-h-screen selection:bg-[#D4AF37]/20">
      <Header />

      <main className="pt-20 sm:pt-28 pb-16">
        {/* ========================================================
            HERO: EDITORIAL LUXURY (Unboxed, Magazine Cover Aesthetic)
            ======================================================== */}
        <section className="relative px-4 sm:px-6 lg:px-12 pt-6 sm:pt-10 pb-12 overflow-hidden">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-[#EBE7DC]/60 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-[1240px] mx-auto text-center relative z-10">
            {/* Editorial Top Inscription */}
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase text-[#666]">
                Maison de Haute Parfumerie · Casablanca
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            </div>

            {/* Haute Couture Headline */}
            <h1 className="heading-font text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#121212] leading-[1.08] max-w-2xl mx-auto">
              L’Émotion du <span className="italic font-serif text-[#1A1A1A] font-normal">Luxe Olfactif</span>
            </h1>

            <p className="text-[12.5px] sm:text-[14px] text-[#555] max-w-md mx-auto mt-3 leading-relaxed font-light">
              Flacons originaux scellés et testeurs rares des plus grandes maisons de luxe mondiales. 
              Ouvrez et testez devant le livreur avant tout paiement.
            </p>

            {/* Grand Statuesque Flacon Centerpiece (NO BOX, PURE ART DIRECTION) */}
            <div className="relative my-6 sm:my-8 flex flex-col items-center">
              <Link 
                href={`/${locale}/product/${heroProduct.slug}`}
                className="relative block w-full max-w-[280px] sm:max-w-[340px] h-[290px] sm:h-[360px] mx-auto group cursor-pointer"
              >
                {/* Refined Backing Pedestal Shadow */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/10 rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-700" />
                
                <Image
                  src={heroProduct.images[0] || 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986804567-armani_prive_magenta.jpg'}
                  alt={heroProduct.name}
                  fill
                  priority
                  unoptimized
                  className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-700"
                />
              </Link>

              {/* Floating Editorial Provenance Card */}
              <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md border border-[#E0DDD4] px-4 py-2 rounded-full shadow-xs mt-1">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#D4AF37]">
                  {heroProduct.brandLabel}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-[12px] font-bold text-[#121212] truncate max-w-[140px]">
                  {heroProduct.name}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-[12.5px] font-extrabold text-[#121212]">
                  {formatMAD(heroProduct.price)}
                </span>
              </div>
            </div>

            {/* Authoritative Minimalist CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
              <Link
                href={`/${locale}/shop`}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#121212] hover:bg-[#222] text-white rounded-full font-bold text-[12px] tracking-[0.14em] uppercase flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
              >
                <span>Explorer la Collection</span>
                <ArrowRight size={14} />
              </Link>

              <Link
                href={`/${locale}/testeurs`}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#F2EFE9] text-[#121212] border border-[#E0DDD4] rounded-full font-semibold text-[12px] tracking-wider transition text-center"
              >
                <span>Testeurs Authentiques</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================
            CATEGORY DISCOVERY: THE 4 OLFACTORY UNIVERSES
            ======================================================== */}
        <section className="px-4 sm:px-6 lg:px-12 py-8 border-y border-[#EBE8DF] bg-white">
          <div className="max-w-[1240px] mx-auto">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#D4AF37] block mb-0.5">
                  Les Silos Olfactifs
                </span>
                <h2 className="heading-font text-xl sm:text-2xl font-bold text-[#121212]">
                  Explorer par Univers
                </h2>
              </div>
              <Link href={`/${locale}/shop`} className="text-[11px] font-bold uppercase tracking-wider text-[#666] hover:text-black transition">
                Tout voir →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { title: 'Pour Elle', sub: 'Floraux & Gourmands', slug: 'women', img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986846939-Narciso_Rouge.jpg' },
                { title: 'Pour Lui', sub: 'Boisés & Magnétiques', slug: 'men', img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986823993-Dior_Homme_Intense.jpg' },
                { title: 'Niche & Mixte', sub: 'Créations d’Auteur', slug: 'unisex', img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986804567-armani_prive_magenta.jpg' },
                { title: 'Testeurs VIP', sub: '100% Originaux', slug: 'testeurs', img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784027249449-582318655-amouage_interloude_men.jpg' },
              ].map((cat, idx) => (
                <Link
                  key={idx}
                  href={cat.slug === 'testeurs' ? `/${locale}/testeurs` : `/${locale}/shop/${cat.slug}`}
                  className="group block p-3.5 sm:p-4 rounded-2xl bg-[#FAF9F5] border border-[#EBE8DF] hover:border-[#D4AF37] hover:shadow-xs transition duration-300"
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white mb-2.5 border border-[#F0ECE1]">
                    <Image
                      src={cat.img}
                      alt={cat.title}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="heading-font text-[14px] font-bold text-[#121212] group-hover:text-[#D4AF37] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-[10px] text-[#777] tracking-wide mt-0.5">
                    {cat.sub}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            FEATURED FRAGRANCES: LES ICÔNES DU MOMENT
            ======================================================== */}
        <section className="px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
          <div className="max-w-[1240px] mx-auto">
            <div className="text-center max-w-lg mx-auto mb-8">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#D4AF37] block mb-1">
                Sélection Exclusive
              </span>
              <h2 className="heading-font text-2xl sm:text-3xl lg:text-4xl font-bold text-[#121212]">
                Les Icônes du Moment
              </h2>
              <p className="text-[12px] text-[#666] mt-1.5 font-light">
                Les flacons les plus plébiscités par nos connaisseurs au Maroc.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
              {displayProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            TRUST & ART DE RECEVOIR (Try Before You Pay Invitation)
            ======================================================== */}
        <section className="px-4 sm:px-6 lg:px-12 py-8">
          <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-[#E0DDD4] p-6 sm:p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#FAF9F5] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto mb-4">
              <Sparkles size={22} />
            </div>

            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#666] block mb-1">
              Protocole de Confiance NAY
            </span>
            <h3 className="heading-font text-xl sm:text-2xl font-bold text-[#121212] mb-2">
              Essayez Devant le Livreur · 0 DH d’Avance
            </h3>
            <p className="text-[12.5px] text-[#555] leading-relaxed max-w-md mx-auto">
              Recevez votre colis sous 24 à 48 heures partout au Maroc. Ouvrez le flacon et testez-le sur place. 
              S’il ne vous convient pas, vous ne payez absolument rien, pas même la livraison.
            </p>

            <div className="mt-5 pt-4 border-t border-[#F0ECE1] flex items-center justify-center gap-6 text-[11px] font-semibold text-[#444]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-[#D4AF37]" />
                100% Authentique
              </span>
              <span>·</span>
              <span>Paiement Espèces à Réception</span>
              <span>·</span>
              <span>Retour Sans Frais</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
