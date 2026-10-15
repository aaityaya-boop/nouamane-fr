'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function BrandCard({ brand, i, totalBrands, smoothProgress }: { brand: any, i: number, totalBrands: number, smoothProgress: any }) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  // Map the global scroll progress to each specific card's animation window
  const startSlide = i * (1 / Math.max(1, totalBrands));
  const endSlide = startSlide + (1 / Math.max(1, totalBrands)) * 0.8;
  
  // Slide UP effect: First card is already visible. Other cards slide in from 1200px below.
  const y = useTransform(
    smoothProgress,
    [startSlide, endSlide],
    [i === 0 ? 0 : 1200, 0] 
  );

  // Scale DOWN effect: As the NEXT cards slide over this one, this one scales down slightly to create depth.
  const scaleDownStart = endSlide;
  const targetScale = 1 - ((totalBrands - 1 - i) * 0.05);
  
  const scale = useTransform(
    smoothProgress,
    [scaleDownStart, 1],
    [1, targetScale]
  );

  // Shadow/Darkening effect: Darken the card as it gets covered by the ones above it.
  const overlayOpacity = useTransform(
    smoothProgress,
    [scaleDownStart, 1],
    [0, 0.5]
  );

  return (
    <motion.div
      className="absolute w-full h-full rounded-[30px] lg:rounded-[40px] overflow-hidden shadow-[0_-10px_50px_rgba(0,0,0,0.15)] origin-top border border-white/20 bg-black"
      style={{ 
        y, 
        scale,
        zIndex: i * 10,
        top: `calc(${i * 30}px)` // Slight top offset so you can see the stack of cards like a deck
      }}
    >
      {/* Hero Image */}
      <Image
        src={brand.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900'}
        alt={brand.label || brand.name}
        fill
        className="object-cover"
      />

      {/* Permanent subtle gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      {/* Dynamic darkening overlay as the card is pushed to the back */}
      <motion.div 
        className="absolute inset-0 bg-black pointer-events-none" 
        style={{ opacity: overlayOpacity }} 
      />

      <div className="absolute bottom-8 lg:bottom-12 left-8 lg:left-12 right-8 lg:right-12 flex flex-col items-start text-white">
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/70 mb-2">
          Collection exclusive
        </span>
        <h3 className="heading-font text-5xl lg:text-8xl leading-none tracking-tight">
          {brand.label || brand.name}
        </h3>
        <p className="mt-4 max-w-lg text-white/80 font-light text-sm lg:text-lg">
          {brand.description}
        </p>
        
        {/* Premium Glassmorphism Link */}
        <Link 
          href={`/${locale}/brands/${brand.slug}`}
          className="mt-8 group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-4 shadow-2xl transition-all duration-500 hover:bg-white/20 hover:scale-105"
        >
          <span className="relative z-10 text-[11px] font-bold tracking-[0.25em] uppercase text-white">
            Explorer la maison
          </span>
          <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function StickyBrandsShowcase({ brands }: { brands: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // The container needs to be very tall so we have room to scroll through the stacking effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100, mass: 0.5 });

  return (
    <section 
      ref={containerRef} 
      className="relative w-full bg-[#fafaf7]" 
      style={{ height: `${Math.max(1, brands.length) * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        
        {/* Section Header */}
        <div className="absolute top-12 left-0 w-full text-center z-50 pointer-events-none">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#1A1A1A]/50">
            Les Grandes Maisons
          </span>
          <h2 className="heading-font text-3xl lg:text-5xl mt-2 tracking-wide text-[#1A1A1A]">
            3 marques mythiques
          </h2>
        </div>

        <div className="relative w-full max-w-[1200px] h-[75vh] px-4 lg:px-0 mt-16 lg:mt-24">
          {brands.map((brand, i) => (
            <BrandCard 
              key={brand.slug} 
              brand={brand} 
              i={i} 
              totalBrands={brands.length} 
              smoothProgress={smoothProgress} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
