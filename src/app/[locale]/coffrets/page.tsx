import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  return {
    title: 'Coffrets Duo & Cadeaux | NAY Parfums',
    description: 'Découvrez nos coffrets cadeaux et duos. Célébrez l\'amour avec nos fragrances couplées.',
    openGraph: {
      title: 'Coffrets Duo & Cadeaux | NAY Parfums',
      description: 'Découvrez nos coffrets cadeaux et duos. Célébrez l\'amour avec nos fragrances couplées.',
      url: `https://nayparfum.ma/${currentLocale}/coffrets`,
    },
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/coffrets`,
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function CoffretsPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  
  const [coffrets, standardProducts, config] = await Promise.all([
    prisma.product.findMany({
      where: { subcategory: 'coffrets' },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.findMany({
      where: { subcategory: { not: 'coffrets' } }
    }),
    prisma.siteConfig.findFirst()
  ]);

  let recommendedCoffrets: string[] = [];
  try {
    recommendedCoffrets = JSON.parse(config?.recommendedCoffrets || '[]');
  } catch {}

  // Parse images and tags for each coffret
  let parsedCoffrets = coffrets.map(c => {
    const tags = typeof c.tags === 'string' ? JSON.parse(c.tags) : c.tags;
    
    // Find the actual product objects that are included in this coffret
    const includedProducts = (tags || []).map((slug: string) => {
      const p = standardProducts.find(sp => sp.slug === slug);
      if (p) {
        return {
          ...p,
          images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images
        };
      }
      return null;
    }).filter(Boolean);

    return {
      ...c,
      images: typeof c.images === 'string' ? JSON.parse(c.images) : c.images,
      includedProducts
    };
  });

  parsedCoffrets.sort((a, b) => {
    const aInStock = (a.inStock !== false && (a.stock === undefined || a.stock > 0)) ? 1 : 0;
    const bInStock = (b.inStock !== false && (b.stock === undefined || b.stock > 0)) ? 1 : 0;
    if (aInStock !== bInStock) return bInStock - aInStock;

    if (recommendedCoffrets.length > 0) {
      const indexA = recommendedCoffrets.indexOf(a.slug);
      const indexB = recommendedCoffrets.indexOf(b.slug);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
    }
    return 0;
  });

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#9E1B1B] selection:text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[65vh] md:h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-transparent to-[#050505] z-10" />
        <div className="absolute inset-0 opacity-50">
           {/* Deep romantic red silk/petals background */}
           <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=2000')] bg-cover bg-center" />
        </div>
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6 opacity-0 animate-[fade-in-up_1s_ease-out_forwards]">
            <div className="h-[1px] w-12 bg-[#9E1B1B]"></div>
            <span className="text-[#9E1B1B] text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase">L'Amour en Flacon</span>
            <div className="h-[1px] w-12 bg-[#9E1B1B]"></div>
          </div>
          <h1 className="heading-font text-5xl md:text-7xl lg:text-8xl font-light mb-8 leading-tight opacity-0 animate-[fade-in-up_1s_ease-out_0.3s_forwards]">
            Coffrets Cadeaux
          </h1>
        </div>
      </section>

      {/* Coffrets Grid */}
      <section className="py-24 px-6 md:px-12 max-w-[1800px] mx-auto">
        {parsedCoffrets.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <h2 className="heading-font text-3xl mb-4 text-white">Nos éditions romantiques arrivent</h2>
            <p>Nos artisans préparent actuellement nos nouveaux coffrets pour couples.</p>
          </div>
        ) : (
          <div className="space-y-40">
            {parsedCoffrets.map((coffret, index) => (
              <div 
                key={coffret.id} 
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 lg:gap-24 relative`}
              >
                {/* Decorative floating heart element (Background) */}
                <div className={`absolute top-1/2 -translate-y-1/2 ${index % 2 === 1 ? 'left-0' : 'right-0'} text-[#9E1B1B]/5 text-[300px] font-serif italic -z-10 select-none`}>
                  &
                </div>

                {/* BIG Cover Image */}
                <div className="w-full lg:w-[55%] group relative">
                  <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded-[2rem] bg-[#111]">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#9E1B1B]/40 via-transparent to-[#9E1B1B]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-10 mix-blend-overlay" />
                    <Image
                      src={coffret.images[0] || '/images/placeholder.jpg'}
                      alt={coffret.name}
                      fill
                      className="object-cover transform group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                    />
                  </div>
                  {/* Glowing Border Element */}
                  <div className="absolute -inset-2 border border-[#9E1B1B]/30 rounded-[2.5rem] -z-10 transform group-hover:scale-105 transition-transform duration-1000 group-hover:shadow-[0_0_40px_rgba(158,27,27,0.2)]" />
                </div>

                {/* Content */}
                <div className="w-full lg:w-[45%] flex flex-col justify-center">
                  <span className="text-[#9E1B1B] text-[11px] font-bold tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-[#9E1B1B]"></span>
                    {coffret.brandLabel || 'Duo Parfait'}
                  </span>
                  <h2 className="heading-font text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
                    {coffret.name}
                  </h2>
                  <div className="flex items-end gap-4 mb-8">
                    <div className="text-3xl text-white font-light">
                      {coffret.price} MAD
                    </div>
                    {coffret.originalPrice && (
                      <div className="text-gray-500 line-through text-lg mb-1">
                        {coffret.originalPrice} MAD
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-[15px] leading-relaxed mb-12 max-w-lg">
                    {coffret.description}
                  </p>
                  
                  {coffret.includedProducts && coffret.includedProducts.length > 0 && (
                    <div className="mb-12 p-6 rounded-2xl bg-[#111]/50 border border-white/5 backdrop-blur-sm">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[#9E1B1B] mb-6 font-bold flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        Partagez l'Expérience
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {/* Overlapping Perfumes UI */}
                        <div className="flex -space-x-6 relative">
                          {coffret.includedProducts.map((p: any, i: number) => (
                            <div key={p.id} className={`w-20 h-20 relative rounded-full overflow-hidden border-4 border-[#050505] shadow-lg z-${10 - i} hover:-translate-y-2 transition-transform duration-300`}>
                              {p.images && p.images[0] ? (
                                <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full bg-[#1A1A1A]"></div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white mb-1">
                            {coffret.includedProducts.map((p: any) => p.name).join(' & ')}
                          </div>
                          <div className="text-xs text-gray-500 italic">
                            L'harmonie parfaite
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Link 
                      href={`/${locale}/product/${coffret.slug}`}
                      className="group/btn relative inline-flex items-center justify-center overflow-hidden rounded-full p-4 px-12 font-bold tracking-[0.15em] text-[12px] uppercase bg-white text-[#050505] hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300"
                    >
                      <span className="absolute inset-0 h-full w-full bg-[#9E1B1B] -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 ease-out"></span>
                      <span className="relative flex items-center gap-3">
                        Découvrir ce Duo
                        <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
