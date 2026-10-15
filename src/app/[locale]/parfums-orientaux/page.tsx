import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ShopCatalog from '@/components/ShopCatalog';
import prisma from '@/lib/prisma';
import { Product, MAIN_CATEGORIES } from '@/lib/products';
import { ShieldCheck, Truck, Clock } from 'lucide-react';

export const metadata = {
  title: 'Parfums Orientaux',
  description: 'Découvrez une sélection de parfums orientaux intenses, élégants et longue tenue.',
  openGraph: {
    title: 'Parfums Orientaux | NAY Parfums',
    description: 'Découvrez une sélection de parfums orientaux intenses, élégants et longue tenue.',
    url: 'https://nayparfum.ma/parfums-orientaux',
  },
  alternates: {
    canonical: 'https://nayparfum.ma/parfums-orientaux',
  },
};

export const revalidate = 3600;

export default async function ParfumsOrientauxPage() {
  const [dbProducts, dbBrands, config] = await Promise.all([
    prisma.product.findMany({
      where: { published: true, subcategory: 'arabic' }
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

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen relative overflow-hidden">
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
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#0ea5e9] mb-4">
            Collection Orientale
          </span>
          <h1 className="heading-font text-5xl sm:text-6xl lg:text-[90px] leading-none tracking-tight mb-6">
            <span className="liquid-glace-text">L'EXCELLENCE</span>
            <br />
            <span className="font-serif italic font-light text-[#0ea5e9] text-4xl sm:text-5xl lg:text-[80px] liquid-glace-text">Orientale</span>
          </h1>
          <p className="mt-2 text-[13px] md:text-[15px] text-[#555] font-light max-w-xl leading-[2] tracking-widest uppercase mb-10">
            Découvrez une sélection de parfums orientaux intenses, élégants et longue tenue.
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
        </div>
      </section>

      {/* CATALOG */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 py-10">
        <Suspense fallback={<div className="text-[#9A9A9A] text-sm">Chargement du catalogue…</div>}>
          <ShopCatalog products={products} brands={dbBrands} lockedSubcategory="arabic" recommendedSlugs={recommendedSlugs} />
        </Suspense>
      </section>

      <Footer />
      <CartDrawer />
    </div>
  );
}
