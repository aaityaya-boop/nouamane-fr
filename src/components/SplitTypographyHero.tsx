'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function SplitTypographyHero({ config }: { config?: any }) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';

  return (
    <section 
      className="relative h-[100dvh] min-h-[650px] w-full bg-[#FCFCFC] overflow-hidden flex items-center justify-center selection:bg-[#111] selection:text-white"
    >
      {/* 1. LUXURY BACKGROUND: Subtle Editorial Atmosphere */}
      <div className="absolute inset-0 bg-[#FCFCFC] z-0" />
      
      {/* Huge Background Watermark (Pure CSS - Zero Reflow) */}
      <div 
        className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-0 overflow-hidden select-none"
      >
        <span className="font-serif italic text-[15vw] leading-none text-[#111]/[0.02] whitespace-nowrap rotate-[-5deg] scale-150">
          NAY PARFUMS
        </span>
      </div>
      
      {/* Luxury Radial Aura 1 (Sky Glow) */}
      <div 
        className="hidden md:block absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.12)_0%,rgba(14,165,233,0.03)_50%,transparent_70%)] pointer-events-none" 
      />

      {/* Luxury Radial Aura 2 (Dark Luxury Glow) */}
      <div 
        className="hidden md:block absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] max-w-[1000px] max-h-[1000px] rounded-full bg-[radial-gradient(circle_at_center,rgba(17,17,17,0.06)_0%,rgba(17,17,17,0.02)_50%,transparent_70%)] pointer-events-none" 
      />

      {/* Ambient Micro-Glow Accents */}
      <div className="hidden md:block absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[25%] left-[20%] w-1.5 h-1.5 rounded-full bg-[#111]/15" />
        <div className="absolute top-[65%] left-[15%] w-1 h-1 rounded-full bg-[#0ea5e9]/20" />
        <div className="absolute top-[35%] right-[22%] w-1 h-1 rounded-full bg-[#111]/15" />
        <div className="absolute top-[75%] right-[18%] w-1.5 h-1.5 rounded-full bg-[#0ea5e9]/25" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 text-center flex flex-col items-center justify-center">
        {/* Typo Logo */}
        <div className="mb-12 flex flex-col items-center justify-center relative group">
          <Image
            src="/images/nay/nay-logo-new.png"
            alt="NAY Parfums"
            width={224}
            height={80}
            priority
            fetchPriority="high"
            className="w-32 sm:w-40 md:w-48 lg:w-56 h-auto object-contain transition-transform duration-1000 group-hover:scale-105"
          />
        </div>

        {/* Eyebrow */}
        <div className="flex flex-col items-center gap-5 mb-8">
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.6em] uppercase text-[#111]/50">
            L'Art de la Parfumerie
          </span>
          <span className="w-[1px] h-10 bg-gradient-to-b from-[#111]/20 to-transparent" />
        </div>

        {/* Main Headline with Split Editorial Typography */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[120px] xl:text-[140px] leading-[1] tracking-[-0.02em] mb-10 flex flex-col items-center justify-center w-full">
          <div className="font-light text-[#111] pr-0 sm:pr-12 md:pr-24 self-center md:self-end text-center md:text-right mix-blend-darken relative">
            L'Empreinte
          </div>
          <div className="flex items-center gap-4 sm:gap-6 pl-0 sm:pl-12 md:pl-24 self-center md:self-start mt-2 sm:mt-0 mix-blend-darken relative">
            <span className="font-serif italic font-light text-[#0ea5e9] text-5xl sm:text-7xl md:text-8xl lg:text-[130px] xl:text-[150px] drop-shadow-sm">&</span>
            <span className="font-serif italic font-light text-[#111]">l'Inoubliable</span>
          </div>
        </h1>

        {/* Sub-headline */}
        <p
          className="text-[11px] sm:text-[13px] md:text-[14px] text-[#555] font-light max-w-2xl mx-auto leading-[2.2] tracking-[0.2em] uppercase mb-16"
        >
          Découvrez notre sélection de <span className="font-semibold text-[#111]">parfums prestigieux</span>. L'essence du luxe, de l'authenticité et de l'exception.
        </p>
        
        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Découvrir Button - Luxury Minimalist Version */}
          <Link
            href={`/${locale}/decouverte`}
            className="group relative inline-flex items-center justify-center overflow-hidden border border-[#111]/20 bg-white/50 backdrop-blur-md px-16 py-5 transition-all duration-700 hover:border-[#111] hover:shadow-2xl rounded-full"
          >
            <div className="absolute inset-0 bg-[#111] transform scale-y-0 origin-bottom transition-transform duration-700 ease-[0.16,1,0.3,1] group-hover:scale-y-100" />
            <span className="relative z-10 text-[10px] font-semibold tracking-[0.4em] uppercase text-[#111] transition-colors duration-500 group-hover:text-white">
              Découvrir
            </span>
          </Link>
        </div>
      </div>

      {/* 3. SCROLL INDICATOR */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 cursor-pointer hover:opacity-70 transition-opacity"
        onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
      >
        <span className="text-[8px] font-semibold tracking-[0.5em] uppercase text-[#111]/40">
          Scroll
        </span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-[#111]/20 to-transparent overflow-hidden relative">
          <div className="w-full h-1/2 bg-[#111]/50 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
