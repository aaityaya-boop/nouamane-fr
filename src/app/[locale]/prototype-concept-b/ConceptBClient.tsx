'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronRight, Check, Zap, ShieldCheck, Sparkles, Truck, PackageCheck } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import dynamic from 'next/dynamic';
import { formatMAD, type Product } from '@/lib/products';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false });

export default function ConceptBClient({
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

  const heroProduct = products.find(p => p.slug?.includes('sauvage') || p.slug?.includes('homme') || p.slug?.includes('magenta')) || products[0] || {
    name: 'Sauvage Elixir',
    brandLabel: 'DIOR',
    price: 299,
    originalPrice: 499,
    slug: 'dior-sauvage-elixir-tester',
    images: ['https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986823993-Dior_Homme_Intense.jpg']
  };

  return (
    <div className="bg-[#FFFFFF] text-[#111111] min-h-screen selection:bg-[#111] selection:text-white">
      <Header />

      <main className="pt-20 sm:pt-28 pb-16">
        {/* ========================================================
            HERO: MODERN LUXURY COMMERCE (Architectural, High Impact)
            ======================================================== */}
        <section className="px-3.5 sm:px-6 lg:px-12 pt-4 sm:pt-8 pb-8">
          <div className="max-w-[1240px] mx-auto bg-[#F8F9FA] border border-[#E5E7EB] rounded-3xl p-5 sm:p-10 overflow-hidden relative">
            
            {/* Top Micro Eyebrow */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#111] bg-white border border-[#E5E7EB] px-3 py-1 rounded-full">
                SÉLECTION N°1 AU MAROC
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                En Stock · 24-48h
              </span>
            </div>

            {/* Split Grid: Bold Contemporary Headline + Floating Flacon */}
            <div className="grid sm:grid-cols-2 gap-6 items-center">
              <div>
                <h1 className="heading-font text-3xl sm:text-5xl font-black tracking-tight text-[#111] leading-[1.08] uppercase">
                  Parfums de Luxe & Testeurs <span className="text-[#0ea5e9]">Authentiques</span>
                </h1>
                
                <p className="text-[13px] text-[#555] mt-3 leading-relaxed max-w-md">
                  Découvrez les fragrances iconiques des plus grandes maisons de parfum. 
                  Essayez votre flacon en direct devant le livreur : aucun paiement requis si le parfum ne vous séduit pas.
                </p>

                {/* Direct High-Velocity Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-6">
                  <Link
                    href={`/${locale}/product/${heroProduct.slug}`}
                    className="h-12 px-6 bg-[#111] hover:bg-black text-white rounded-xl font-bold text-[12px] tracking-wider uppercase flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-sm"
                  >
                    <Zap size={15} className="fill-[#0ea5e9] text-[#0ea5e9]" />
                    <span>Acheter {heroProduct.name} · {formatMAD(heroProduct.price)}</span>
                  </Link>

                  <Link
                    href={`/${locale}/shop`}
                    className="h-12 px-5 bg-white hover:bg-slate-50 text-[#111] border border-[#E5E7EB] rounded-xl font-bold text-[12px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition text-center"
                  >
                    <span>Explorer le Catalogue</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Floating Flacon with Modernist Backing */}
              <div className="relative flex items-center justify-center py-4">
                <div className="relative w-full max-w-[240px] sm:max-w-[280px] h-[250px] sm:h-[300px]">
                  <Image
                    src={heroProduct.images[0] || 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986823993-Dior_Homme_Intense.jpg'}
                    alt={heroProduct.name}
                    fill
                    priority
                    unoptimized
                    className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.1)]"
                  />
                </div>

                {/* Micro Provenance Tag */}
                <div className="absolute bottom-1 right-2 bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl shadow-xs text-right">
                  <span className="text-[9px] font-bold uppercase text-[#888] block">FORMAT STANDARD</span>
                  <span className="text-[13px] font-extrabold text-[#111]">{formatMAD(heroProduct.price)}</span>
                </div>
              </div>
            </div>

            {/* Micro 3-Step Trust Strip */}
            <div className="mt-8 pt-5 border-t border-[#E5E7EB] grid grid-cols-3 gap-2 text-center">
              <div className="p-2">
                <div className="text-[11px] font-bold text-[#111]">1. Recevez</div>
                <div className="text-[10px] text-[#666]">Partout au Maroc en 24/48h</div>
              </div>
              <div className="p-2 border-x border-[#E5E7EB]">
                <div className="text-[11px] font-bold text-[#111]">2. Testez</div>
                <div className="text-[10px] text-[#666]">Devant le livreur en direct</div>
              </div>
              <div className="p-2">
                <div className="text-[11px] font-bold text-[#111]">3. Décidez</div>
                <div className="text-[10px] text-[#666]">0 DH si refus immédiat</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            CATEGORY DISCOVERY: CONTEMPORARY CAPSULES
            ======================================================== */}
        <section className="px-3.5 sm:px-6 lg:px-12 py-4">
          <div className="max-w-[1240px] mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                { label: 'Tous les Parfums', href: `/${locale}/shop` },
                { label: 'Parfums Homme', href: `/${locale}/shop/men` },
                { label: 'Parfums Femme', href: `/${locale}/shop/women` },
                { label: 'Testeurs de Luxe', href: `/${locale}/testeurs` },
                { label: 'Parfums Orientaux', href: `/${locale}/parfums-orientaux` },
                { label: 'Coffrets Cadeaux', href: `/${locale}/coffrets` },
              ].map((pill, idx) => (
                <Link
                  key={idx}
                  href={pill.href}
                  className={`px-4 py-2.5 rounded-full text-[11px] font-bold tracking-wider uppercase whitespace-nowrap transition border ${
                    idx === 0 
                      ? 'bg-[#111] text-white border-[#111]' 
                      : 'bg-white text-[#444] border-[#E5E7EB] hover:border-[#111] hover:text-[#111]'
                  }`}
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            FEATURED DROPS (2-Column Ultra-Clean Grid)
            ======================================================== */}
        <section className="px-3.5 sm:px-6 lg:px-12 py-8 sm:py-12">
          <div className="max-w-[1240px] mx-auto">
            <div className="flex items-end justify-between mb-6 pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0ea5e9]">
                  CURATED DROPS
                </span>
                <h2 className="heading-font text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111]">
                  Bestsellers & Tendances
                </h2>
              </div>
              <Link href={`/${locale}/shop`} className="text-[12px] font-bold uppercase tracking-wider text-[#111] hover:text-[#0ea5e9] transition flex items-center gap-1">
                <span>Voir tout ({products.length})</span>
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
            MODERN TRUST CARD
            ======================================================== */}
        <section className="px-3.5 sm:px-6 lg:px-12 py-6">
          <div className="max-w-[1240px] mx-auto bg-[#111] text-white rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[#0ea5e9] mb-2 font-bold text-[11px] tracking-widest uppercase">
                <ShieldCheck size={16} />
                <span>Paiement Sécurisé à la Livraison</span>
              </div>
              <h3 className="heading-font text-2xl sm:text-3xl font-bold">
                Zéro Risque. 100% Sérénité.
              </h3>
              <p className="text-[13px] text-white/70 max-w-lg mt-1">
                Ouvrez le flacon devant le livreur. Testez la tenue, la fraîcheur et les notes. 
                Réglez en espèces uniquement si le parfum vous donne entière satisfaction.
              </p>
            </div>

            <Link
              href={`/${locale}/shop`}
              className="px-8 py-3.5 bg-white text-[#111] hover:bg-slate-100 rounded-xl font-bold text-[12px] tracking-wider uppercase transition whitespace-nowrap"
            >
              Commander en 1 Clic
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
