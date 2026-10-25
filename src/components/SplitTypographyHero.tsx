'use client';

/**
 * SPLIT TYPOGRAPHY HERO — NAY Parfums (Luxury Minimalist Creative Edition)
 * Minimalist luxury art-direction, crisp Urbanist typography, 100% real product photos,
 * automatic smooth carousel with visual progress, swipe gesture support & phone browser compatibility.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Truck, 
  Headphones, 
  Banknote,
  CheckCircle2,
} from 'lucide-react';
import { useDictionary } from '@/context/DictionaryContext';

interface FeaturedFlacon {
  id: string;
  brand: string;
  name: string;
  concentration: string;
  concentrationAr?: string;
  price: string;
  originalPrice?: string;
  image: string;
  slug: string;
  badge: string;
  badgeAr?: string;
}

// Default items using authentic real product photos from the store's verified database
const DEFAULT_FLACONS: FeaturedFlacon[] = [
  {
    id: 'armani-magenta',
    brand: 'GIORGIO ARMANI',
    name: 'Prive Magenta Tanzanite',
    concentration: 'Eau de Parfum · 100ml',
    concentrationAr: 'أو دو بارفان مكثف · 100 مل',
    price: '299 MAD',
    originalPrice: '499 MAD',
    image: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986804567-armani_prive_magenta.jpg',
    slug: 'armani-prive-magenta-tanzanite-tester',
    badge: 'Bestseller N°01',
    badgeAr: 'الأكثر طلباً 01',
  },
  {
    id: 'amouage-interlude',
    brand: 'AMOUAGE',
    name: 'Interlude Men',
    concentration: 'Eau de Parfum · 100ml',
    concentrationAr: 'أو دو بارفان فاخر · 100 مل',
    price: '299 MAD',
    originalPrice: '499 MAD',
    image: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784027249449-582318655-amouage_interloude_men.jpg',
    slug: 'amouage-interlude-man-tester',
    badge: 'Coup de Cœur',
    badgeAr: 'المفضل لدى الزبائن',
  },
  {
    id: 'dg-devotion',
    brand: 'DOLCE & GABBANA',
    name: 'Devotion Intense',
    concentration: 'Eau de Parfum · 100ml',
    concentrationAr: 'أو دو بارفان مكثف · 100 مل',
    price: '299 MAD',
    originalPrice: '499 MAD',
    image: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784030617124-665578510-Dolce_Gabbana_Devotion_intense.jpg',
    slug: 'dolce-gabbana-devotion-intense-eau-de-parfum-tester',
    badge: 'Édition Prestigieuse',
    badgeAr: 'إصدار فاخر',
  },
];

const AUTOPLAY_INTERVAL = 4500; // 4.5 seconds for engaging, automatic rotation

function cleanPerfumeName(name: string, brand: string): string {
  if (!name) return '';
  let cleaned = name.trim();
  if (brand && cleaned.toLowerCase().startsWith(brand.toLowerCase())) {
    cleaned = cleaned.slice(brand.length).replace(/^[\s\-_–:]+/, '').trim();
  }
  cleaned = cleaned.replace(/\s*[-–]\s*TESTER\s*$/i, '');
  return cleaned || name;
}

interface SplitTypographyHeroProps {
  config?: any;
  bestsellers?: any[];
}

export default function SplitTypographyHero({ config, bestsellers = [] }: SplitTypographyHeroProps) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const dict = useDictionary();
  const isAr = locale === 'ar';
  const isEn = locale === 'en';

  const [flacons, setFlacons] = useState<FeaturedFlacon[]>(DEFAULT_FLACONS);
  const [activeFlaconIndex, setActiveFlaconIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Every refresh / page load: pick 3 random perfumes from bestsellers using their REAL photos
  useEffect(() => {
    if (bestsellers && bestsellers.length >= 3) {
      const shuffled = [...bestsellers].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);

      const generated: FeaturedFlacon[] = selected.map((p, idx) => {
        // 1. ALWAYS prioritize authentic real product photo from store database!
        let img = '';
        if (Array.isArray(p.images) && p.images[0]) {
          img = p.images[0];
        } else if (typeof p.images === 'string') {
          try {
            const parsed = JSON.parse(p.images);
            img = Array.isArray(parsed) && parsed[0] ? parsed[0] : p.images;
          } catch {
            img = p.images;
          }
        }

        if (!img || typeof img !== 'string') {
          img = DEFAULT_FLACONS[idx % DEFAULT_FLACONS.length].image;
        }

        let badge = `Bestseller N°0${idx + 1}`;
        let badgeAr = `الأكثر طلباً 0${idx + 1}`;
        if (p.gender === 'men') {
          badge = `Sélection Homme N°0${idx + 1}`;
          badgeAr = `الأكثر مبيعاً للرجال 0${idx + 1}`;
        } else if (p.gender === 'women') {
          badge = `Coup de Cœur Femme N°0${idx + 1}`;
          badgeAr = `المفضل لدى النساء 0${idx + 1}`;
        } else if (p.gender === 'unisex') {
          badge = `Édition Niche N°0${idx + 1}`;
          badgeAr = `إصدار نيش مشترك 0${idx + 1}`;
        }

        const brandClean = (p.brandLabel || p.brandId || 'Maison De Luxe').toUpperCase();
        const priceNum = typeof p.price === 'number' ? p.price : parseInt(p.price, 10) || 299;
        const origPriceNum = p.originalPrice 
          ? (typeof p.originalPrice === 'number' ? p.originalPrice : parseInt(p.originalPrice, 10)) 
          : Math.round(priceNum * 1.6);

        return {
          id: p.id || `flacon-${idx}`,
          brand: brandClean,
          name: p.name,
          concentration: p.subcategoryLabel ? `${p.subcategoryLabel} · 100ml` : 'Eau de Parfum · 100ml',
          concentrationAr: 'أو دو بارفان أصلي · 100 مل',
          price: `${priceNum} MAD`,
          originalPrice: `${origPriceNum} MAD`,
          image: img,
          slug: p.slug,
          badge,
          badgeAr,
        };
      });

      setFlacons(generated);
      setActiveFlaconIndex(0);
    }
  }, [bestsellers]);

  const activeFlacon = flacons[activeFlaconIndex] || flacons[0] || DEFAULT_FLACONS[0];

  const handleNext = useCallback(() => {
    setActiveFlaconIndex((prev) => (prev + 1) % flacons.length);
  }, [flacons.length]);

  const handlePrev = useCallback(() => {
    setActiveFlaconIndex((prev) => (prev - 1 + flacons.length) % flacons.length);
  }, [flacons.length]);

  // Robust automatic rotation timer with smooth resets on slide change
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, handleNext, activeFlaconIndex]);

  // Touch Swipe Handlers for Mobile Phone Browsers (iOS Safari / Android Chrome)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left
        if (isAr) handlePrev();
        else handleNext();
      } else {
        // Swiped right
        if (isAr) handleNext();
        else handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  // Only pause on real desktop mouse hover (never permanently freeze on mobile touch)
  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <section 
      className="relative w-full bg-[#fafafa] overflow-hidden flex flex-col justify-between pt-[62px] sm:pt-24 lg:pt-32 pb-6 sm:pb-12 lg:pb-16 min-h-0 lg:min-h-[880px] selection:bg-[#0ea5e9] selection:text-white"
    >
      
      {/* ========================================================= */}
      {/* MOBILE-ONLY DEDICATED EXPERIENCE (< lg)                   */}
      {/* ========================================================= */}
      <div className="lg:hidden w-full flex flex-col pt-1 pb-4 px-3.5 sm:px-6 gap-3">
        {/* 1. SEAMLESS EDITORIAL HERO (No nested outer card container) */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full text-[#1A1A1A] flex flex-col"
        >
          {/* Top Brand Crest & Verified Policy Pill */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div
                className="w-12 h-4 sm:w-14 sm:h-5 bg-[#1A1A1A]"
                style={{
                  maskImage: 'url("/images/nay/Artboard%202.png")',
                  WebkitMaskImage: 'url("/images/nay/Artboard%202.png")',
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: isAr ? 'right center' : 'left center',
                  WebkitMaskPosition: isAr ? 'right center' : 'left center',
                }}
              />
              <div className="h-3 w-[1px] bg-[#e0ddd4]" />
              <span className={`text-[9px] text-[#0ea5e9] uppercase font-bold tracking-[0.2em] ${isAr ? 'font-arabic' : 'font-display'}`}>
                {isAr ? "دار العطور المغربية" : "Haute Parfumerie"}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#e0ddd4] text-[9px] font-semibold text-slate-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
              <span>{isAr ? "معاينة قبل الدفع · 0 درهم مسبق" : "Essayez avant de payer · 0 DH avance"}</span>
            </div>
          </div>

          {/* Dynamic Editorial Headline */}
          <div className="text-left rtl:text-right mb-2">
            <h1 className={`text-[22px] sm:text-[26px] font-extrabold text-[#1A1A1A] tracking-tight leading-[1.2] ${isAr ? 'font-arabic' : 'font-display'}`}>
              {isAr ? (
                <>فن العطور الفاخرة،<br /><span className="text-[#0ea5e9]">حضور يدوم طويلاً</span></>
              ) : isEn ? (
                <>The Art of Perfume,<br /><span className="text-[#0ea5e9]">The Mark of Distinction</span></>
              ) : (
                <>L'Art du Parfum d'Exception,<br /><span className="text-[#0ea5e9]">l'Essence de l'Inoubliable</span></>
              )}
            </h1>
            <p className="text-[#6B6B6B] text-[11px] leading-relaxed mt-1 max-w-sm">
              {isAr
                ? "تشكيلة حصرية من أرقى العطور وتسترات البريميوم بجودة عالية وثبات ممتاز. معاينة الطرد قبل الدفع."
                : "Flacons d'exception et testeurs officiels. Testez votre parfum devant le livreur avant de régler votre commande."}
            </p>
          </div>

          {/* 2. SINGLE STUDIO PEDESTAL STAGE (Clean, unboxed presentation) */}
          <div className="relative my-1 rounded-2xl bg-white shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] p-3 sm:p-4 flex flex-col justify-between overflow-hidden border border-[#e0ddd4]/80 select-none">
            {/* Top stage controls bar */}
            <div className="flex items-center justify-between gap-2 text-[10px] mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="font-extrabold text-[#0ea5e9] tracking-wider uppercase flex-shrink-0">
                  0{activeFlaconIndex + 1} / 0{flacons.length}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-slate-700 uppercase truncate">
                  {isAr ? activeFlacon.badgeAr : activeFlacon.badge}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Précédent"
                  className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 active:scale-90 flex items-center justify-center text-slate-700 transition-all border border-slate-200"
                >
                  <ChevronLeft size={13} strokeWidth={2.5} className="rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Suivant"
                  className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 active:scale-90 flex items-center justify-center text-slate-700 transition-all border border-slate-200"
                >
                  <ChevronRight size={13} strokeWidth={2.5} className="rtl:rotate-180" />
                </button>
              </div>
            </div>

            {/* Flacon Image Showcase (Seamless White Studio Presentation) */}
            <Link
              href={`/${locale}/product/${activeFlacon.slug}`}
              className="relative block h-[185px] sm:h-[210px] w-full my-0.5 flex items-center justify-center group cursor-pointer bg-white"
            >
              <AnimatePresence>
                <motion.div
                  key={activeFlacon.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Image
                    src={activeFlacon.image}
                    alt={activeFlacon.name}
                    fill
                    priority
                    unoptimized
                    sizes="300px"
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </motion.div>
              </AnimatePresence>
            </Link>

            {/* Flacon Meta Row */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-[#0ea5e9] uppercase tracking-widest block truncate">
                  {activeFlacon.brand}
                </span>
                <div className={`text-[13.5px] font-bold text-slate-900 truncate leading-snug ${isAr ? 'font-arabic' : 'font-display'}`}>
                  {cleanPerfumeName(activeFlacon.name, activeFlacon.brand)}
                </div>
                <span className="text-[9.5px] text-slate-500 block truncate">
                  {isAr ? activeFlacon.concentrationAr : activeFlacon.concentration}
                </span>
              </div>

              <div className="text-right rtl:text-left flex-shrink-0 pl-2 rtl:pl-0 rtl:pr-2">
                <div className="flex items-baseline gap-1.5 justify-end rtl:justify-start">
                  <span className="text-[16px] font-extrabold text-slate-950 tracking-tight tabular-nums">
                    {activeFlacon.price}
                  </span>
                  {activeFlacon.originalPrice && (
                    <span className="text-[10px] text-slate-400 line-through">
                      {activeFlacon.originalPrice}
                    </span>
                  )}
                </div>
                <Link
                  href={`/${locale}/product/${activeFlacon.slug}`}
                  className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#0ea5e9] hover:text-slate-950 transition-colors"
                >
                  <span>{isAr ? 'عرض العطر' : 'Découvrir'}</span>
                  <ArrowRight size={11} className="rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center justify-center gap-1.5 my-1.5">
            {flacons.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveFlaconIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
                className="py-2 px-1 relative cursor-pointer"
              >
                <span
                  className={`block h-1 rounded-full transition-all duration-300 ${
                    activeFlaconIndex === idx ? 'w-6 bg-[#0ea5e9]' : 'w-1.5 bg-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Single Dominant Primary CTA + Subordinate Secondary Link */}
          <div className="flex flex-col items-center gap-2 mt-1">
            <Link
              href={`/${locale}/shop`}
              className="w-full bg-[#1A1A1A] hover:bg-[#0ea5e9] text-white py-3 px-5 rounded-full font-bold text-[11.5px] tracking-[0.1em] uppercase flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all"
            >
              <span>{isAr ? 'تسوق جميع العطور' : 'Explorer la Boutique'}</span>
              <ArrowRight size={13} className="rtl:rotate-180" />
            </Link>

            <Link
              href={`/${locale}/testeurs`}
              className="text-[11px] font-semibold text-[#0ea5e9] hover:underline underline-offset-4 tracking-wide transition-all"
            >
              <span>{isAr ? '← أو تصفح تيسترات دي لوكس' : 'Découvrir notre collection de Testeurs →'}</span>
            </Link>
          </div>
        </div>

        {/* 3. MOBILE QUICK CATEGORIES TRAY (Horizontal Scroll) */}
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2 py-0.5 px-0.5 select-none">
          {[
            { label: isAr ? 'جميع العطور' : 'Tous', href: `/${locale}/shop`, img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986804567-armani_prive_magenta.jpg' },
            { label: isAr ? 'رجالي' : 'Homme', href: `/${locale}/shop/men`, img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986823993-Dior_Homme_Intense.jpg' },
            { label: isAr ? 'نسائي' : 'Femme', href: `/${locale}/shop/women`, img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986846939-Narciso_Rouge.jpg' },
            { label: isAr ? 'تسترات VIP' : 'Testeurs VIP', href: `/${locale}/testeurs`, img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784027249449-582318655-amouage_interloude_men.jpg' },
            { label: isAr ? 'باقات هدايا' : 'Coffrets', href: `/${locale}/coffrets`, img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784030617124-665578510-Dolce_Gabbana_Devotion_intense.jpg' },
            { label: isAr ? 'الماركات' : 'Marques', href: `#brands`, img: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986804567-armani_prive_magenta.jpg' },
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#e0ddd4] shadow-2xs hover:border-[#0ea5e9] hover:shadow-xs active:scale-95 transition-all"
            >
              <div className="relative w-6 h-6 rounded-full bg-slate-50 border border-slate-200/70 overflow-hidden flex-shrink-0">
                <Image src={item.img} alt={item.label} fill sizes="24px" className="object-contain p-0.5" />
              </div>
              <span className={`text-[11px] font-bold text-slate-800 whitespace-nowrap ${isAr ? 'font-arabic' : 'font-display'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        {/* 4. MOBILE TRUST REASSURANCE (Verified Store Policies) */}
        <div className="grid grid-cols-3 gap-1.5 text-center mt-0.5">
          <div className="bg-white rounded-xl border border-[#e0ddd4]/70 p-2 flex flex-col items-center shadow-2xs">
            <ShieldCheck size={14} className="text-[#0ea5e9] mb-0.5" />
            <span className="text-[9.5px] font-bold text-slate-900 leading-tight">{isAr ? 'معاينة الطرد' : 'Essayez avant de payer'}</span>
            <span className="text-[8px] text-slate-500">{isAr ? '0 درهم إذا تم الرفض' : '0 DH si refus'}</span>
          </div>
          <div className="bg-white rounded-xl border border-[#e0ddd4]/70 p-2 flex flex-col items-center shadow-2xs">
            <Truck size={14} className="text-[#0ea5e9] mb-0.5" />
            <span className="text-[9.5px] font-bold text-slate-900 leading-tight">{isAr ? 'توصيل 24/48h' : 'Livraison 24–48h'}</span>
            <span className="text-[8px] text-slate-500">{isAr ? 'بعد الشحن بالمغرب' : 'Après expédition'}</span>
          </div>
          <div className="bg-white rounded-xl border border-[#e0ddd4]/70 p-2 flex flex-col items-center shadow-2xs">
            <Banknote size={14} className="text-[#0ea5e9] mb-0.5" />
            <span className="text-[9.5px] font-bold text-slate-900 leading-tight">{isAr ? 'الدفع عند الاستلام' : 'Paiement à la livraison'}</span>
            <span className="text-[8px] text-slate-500">{isAr ? 'نقداً للناقل' : 'En espèces'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP-ONLY SPLIT TYPOGRAPHY (lg+)                       */}
      {/* ========================================================= */}
      <div className="hidden lg:flex flex-col justify-between flex-1 w-full">
        {/* 1. CREATIVE MINIMALIST ATMOSPHERE */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#fafafa] to-[#f4f5f7] z-0" />
      
      {/* Pure, Soft Ambient Atmospheric Sky Blue Gradients */}
      <div 
        className="absolute top-[-10%] right-[-5%] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.08)_0%,transparent_70%)] pointer-events-none z-0 blur-3xl" 
      />
      <div 
        className="absolute bottom-[-10%] left-[-5%] w-[45vw] h-[45vw] max-w-[650px] max-h-[650px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.05)_0%,transparent_70%)] pointer-events-none z-0 blur-3xl" 
      />

      {/* Subtle Architectural Minimalist Hairline Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px'
        }}
      />

      {/* 2. MAIN CREATIVE MINIMALIST VIEWPORT */}
      <div className="relative z-10 max-w-[1640px] w-full mx-auto px-4 sm:px-8 lg:px-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 xl:gap-20 items-center">
          
          {/* =========================================================
              LEFT COLUMN (COL-7): CREATIVE & MINIMALIST TYPOGRAPHY
              ========================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left rtl:text-right">
            
            {/* Minimalist Micro-Tag */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-slate-900/[0.04] border border-slate-900/[0.08] text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase text-slate-700 w-fit mb-5 sm:mb-6 backdrop-blur-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
              <span>{isAr ? 'دار العطور الأصلية بالمغرب' : 'Maison de Haute Parfumerie · Maroc'}</span>
            </motion.div>

            {/* Creative Minimalist Headline (Urbanist Modern Geometric Bold) */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[74px] xl:text-[82px] font-extrabold text-slate-950 leading-[1.05] tracking-[-0.03em] mb-5 sm:mb-6"
            >
              {isAr ? (
                <>
                  <span className="block font-arabic">فن العطور الفاخرة</span>
                  <span className="block font-arabic text-[#0ea5e9] mt-1 font-bold">
                    حضور لا يُنسى
                  </span>
                </>
              ) : isEn ? (
                <>
                  <span className="block">The Art of Perfume,</span>
                  <span className="block text-slate-950 mt-1 font-extrabold">
                    the Pure Mark of <span className="text-[#0ea5e9]">Luxury</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="block">L'Art du Parfum,</span>
                  <span className="block text-slate-950 mt-1 font-extrabold">
                    l'Essence de <span className="text-[#0ea5e9]">l'Inoubliable</span>
                  </span>
                </>
              )}
            </motion.h1>

            {/* Breathable, Clean Minimalist Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="text-sm sm:text-base lg:text-[18px] text-slate-600 font-normal leading-[1.7] sm:leading-[1.75] max-w-xl mb-7 sm:mb-8"
            >
              {isAr ? (
                'تشكيلة حصرية من أرقى العطور وتسترات البريميوم بجودة عالية وثبات ممتاز. معاينة العطر عند الاستلام وتوصيل سريع في 24/48 ساعة بالمغرب.'
              ) : isEn ? (
                'Exclusive curation of world-renowned luxury fragrances and premium testers. Fast 24/48h delivery across Morocco with Cash on Delivery.'
              ) : (
                "La référence des fragrances d'exception et testeurs de haute tenue au Maroc. Flacons sélectionnés, sillage remarquable et livraison express 24/48h avec paiement à la livraison."
              )}
            </motion.p>

            {/* Minimalist Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="flex flex-wrap items-center gap-3.5 sm:gap-4 mb-8 sm:mb-10"
            >
              <Link
                href={`/${locale}/shop`}
                className="group inline-flex items-center gap-3 bg-slate-950 hover:bg-[#0ea5e9] text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-[11.5px] sm:text-[12px] tracking-[0.2em] uppercase transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <span>{isAr ? 'تسوق المجموعة' : 'Explorer la Collection'}</span>
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
              </Link>

              <Link
                href={`/${locale}/shop/testers`}
                className="inline-flex items-center gap-2 bg-transparent hover:bg-slate-100 text-slate-900 border border-slate-300 hover:border-slate-400 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-[11.5px] sm:text-[12px] tracking-[0.2em] uppercase transition-all duration-300"
              >
                <span>{isAr ? 'تسترات بريميوم' : 'Testeurs de Luxe'}</span>
              </Link>
            </motion.div>

            {/* Creative Minimalist Reassurance Footnote */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] sm:text-[12.5px] text-slate-500 font-medium">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                {isAr ? 'تركيبة أصلية وسياج مميز' : 'Formulation Authentique & Sillage Remarquable'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                {isAr ? 'توصيل سريع 24/48 ساعة' : 'Expédition Express 24-48h'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                {isAr ? 'الدفع عند الاستلام والمعاينة' : 'Paiement à la Réception'}
              </span>
            </div>

          </div>

          {/* =========================================================
              RIGHT COLUMN (COL-5): CREATIVE MINIMALIST GALLERY CAROUSEL
              SHOWCASING REAL AUTHENTIC PRODUCT PHOTOS (AUTOMATIC + SWIPE)
              ========================================================= */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {/* Minimalist Gallery Card with Touch Swipe Support */}
            <div 
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-full max-w-[460px] lg:max-w-[480px] rounded-[28px] sm:rounded-[32px] bg-white border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)] p-5 sm:p-8 flex flex-col justify-between overflow-hidden transition-all duration-500 hover:border-[#0ea5e9]/40 hover:shadow-[0_25px_60px_rgba(14,165,233,0.12)]"
            >
              {/* Soft Ambient Halo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#0ea5e9]/8 rounded-full blur-3xl pointer-events-none" />

              {/* Top Bar: Minimal Index Counter + Navigation */}
              <div className="relative z-10 flex items-center justify-between gap-3 mb-2.5 sm:mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] sm:text-[11px] font-bold tracking-[0.2em] text-[#0ea5e9] uppercase">
                    0{activeFlaconIndex + 1} / 0{flacons.length}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase truncate max-w-[170px] sm:max-w-none">
                    {isAr ? activeFlacon.badgeAr : activeFlacon.badge}
                  </span>
                </div>

                {/* Left / Right Simple Nav Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrev}
                    aria-label="Précédent"
                    className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all shadow-sm"
                  >
                    <ChevronLeft size={15} strokeWidth={2} className="rtl:rotate-180" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Suivant"
                    className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all shadow-sm"
                  >
                    <ChevronRight size={15} strokeWidth={2} className="rtl:rotate-180" />
                  </button>
                </div>
              </div>

              {/* REAL PRODUCT PHOTO SHOWCASE (Creative Minimalist Gallery Stage) */}
              <Link 
                href={`/${locale}/product/${activeFlacon.slug}`} 
                className="block relative h-[280px] sm:h-[320px] w-full bg-white flex items-center justify-center my-2 group cursor-pointer overflow-hidden rounded-2xl"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFlacon.id}
                    initial={{ opacity: 0, scale: 1.25 }}
                    animate={{ opacity: 1, scale: 1.35 }}
                    exit={{ opacity: 0, scale: 1.25 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    <Image
                      src={activeFlacon.image}
                      alt={activeFlacon.name}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 440px"
                      className="object-contain transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                  </motion.div>
                </AnimatePresence>

                
              </Link>

              {/* Minimalist Product Meta & Price */}
              <div className="relative z-10 pt-3 border-t border-slate-100">
                <div className="space-y-1 mb-4">
                  {/* Top row: Brand & Price */}
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] font-bold tracking-[0.24em] uppercase text-[#0ea5e9]">
                      {activeFlacon.brand}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight tabular-nums">
                        {activeFlacon.price}
                      </span>
                      {activeFlacon.originalPrice && (
                        <span className="text-xs text-slate-400 line-through font-medium">
                          {activeFlacon.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Second row: Fragrance name in crisp Urbanist */}
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-950 tracking-tight line-clamp-1 leading-snug">
                    {cleanPerfumeName(activeFlacon.name, activeFlacon.brand)}
                  </h3>

                  {/* Third row: Concentration & details */}
                  <p className="text-[12px] sm:text-[12.5px] text-slate-500 font-light">
                    {isAr ? activeFlacon.concentrationAr : activeFlacon.concentration}
                  </p>
                </div>

                {/* Primary Action Button */}
                <Link
                  href={`/${locale}/product/${activeFlacon.slug}`}
                  className="w-full bg-slate-950 hover:bg-[#0ea5e9] text-white py-3.5 px-6 rounded-full font-bold text-[11.5px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md group/btn"
                >
                  <span>{isAr ? 'عرض تفاصيل العطر' : 'Découvrir la Fragrance'}</span>
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 rtl:rotate-180" />
                </Link>

                {/* Creative Segmented Automatic Progress Bar (Users visually see the timer!) */}
                <div className="w-full flex items-center justify-center gap-2 pt-4">
                  {flacons.map((_, idx) => {
                    const isActive = idx === activeFlaconIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveFlaconIndex(idx)}
                        aria-label={`Flacon ${idx + 1}`}
                        className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 ${
                          isActive ? 'w-12 bg-slate-100' : 'w-4 bg-slate-200 hover:bg-slate-300'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            key={`progress-${activeFlaconIndex}`}
                            initial={{ width: '0%' }}
                            animate={{ width: isPaused ? '0%' : '100%' }}
                            transition={{ duration: AUTOPLAY_INTERVAL / 1000, ease: 'linear' }}
                            className="absolute inset-y-0 left-0 bg-[#0ea5e9] rounded-full"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* 3. ARCHITECTURAL MINIMALIST SERVICE DOCK */}
      <div className="relative z-20 max-w-[1640px] w-full mx-auto px-4 sm:px-8 lg:px-16 pt-8 sm:pt-10 lg:pt-14">
        <div className="w-full rounded-[24px] sm:rounded-[28px] bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_12px_45px_rgba(15,23,42,0.04)] py-5 sm:py-5.5 px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-0">
            
            {/* Pillar 1 */}
            <div className="relative flex items-center gap-3.5 sm:gap-4 lg:pr-6 rtl:lg:pr-0 rtl:lg:pl-6 group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-sky-50/70 border border-sky-100/90 text-[#0ea5e9] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#0ea5e9] group-hover:border-[#0ea5e9] group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(14,165,233,0.25)] group-hover:scale-105">
                <ShieldCheck size={21} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h4 className="font-display text-[14px] sm:text-[14.5px] font-bold text-slate-950 tracking-tight group-hover:text-[#0ea5e9] transition-colors leading-snug">
                  {isAr ? 'جودة عالية وثبات ممتاز' : 'Haute Qualité & Tenue'}
                </h4>
                <p className="text-[11.5px] sm:text-[12px] text-slate-500 font-normal leading-relaxed mt-0.5">
                  {isAr ? 'عطور وتسترات مختارة بعناية فائقة' : 'Sillages intenses & flacons rigoureusement sélectionnés.'}
                </p>
              </div>
              <div className="hidden lg:block absolute right-0 rtl:right-auto rtl:left-0 top-1/2 -translate-y-1/2 h-8 w-[1px] bg-gradient-to-b from-transparent via-slate-200 to-transparent pointer-events-none" />
            </div>

            {/* Pillar 2 */}
            <div className="relative flex items-center gap-3.5 sm:gap-4 lg:px-6 group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-sky-50/70 border border-sky-100/90 text-[#0ea5e9] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#0ea5e9] group-hover:border-[#0ea5e9] group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(14,165,233,0.25)] group-hover:scale-105">
                <Truck size={21} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h4 className="font-display text-[14px] sm:text-[14.5px] font-bold text-slate-950 tracking-tight group-hover:text-[#0ea5e9] transition-colors leading-snug">
                  {isAr ? 'توصيل سريع 24 - 48 ساعة' : 'Livraison Express 24-48h'}
                </h4>
                <p className="text-[11.5px] sm:text-[12px] text-slate-500 font-normal leading-relaxed mt-0.5">
                  {isAr ? 'كازا، الرباط وجميع مدن المغرب' : 'Partout au Maroc avec suivi direct.'}
                </p>
              </div>
              <div className="hidden lg:block absolute right-0 rtl:right-auto rtl:left-0 top-1/2 -translate-y-1/2 h-8 w-[1px] bg-gradient-to-b from-transparent via-slate-200 to-transparent pointer-events-none" />
            </div>

            {/* Pillar 3 */}
            <div className="relative flex items-center gap-3.5 sm:gap-4 lg:px-6 group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-sky-50/70 border border-sky-100/90 text-[#0ea5e9] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#0ea5e9] group-hover:border-[#0ea5e9] group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(14,165,233,0.25)] group-hover:scale-105">
                <Banknote size={21} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h4 className="font-display text-[14px] sm:text-[14.5px] font-bold text-slate-950 tracking-tight group-hover:text-[#0ea5e9] transition-colors leading-snug">
                  {isAr ? 'معاينة الطرد قبل الدفع' : 'Paiement à la Livraison'}
                </h4>
                <p className="text-[11.5px] sm:text-[12px] text-slate-500 font-normal leading-relaxed mt-0.5">
                  {isAr ? 'عاين العطر وافتحه بكل أمان قبل الدفع' : 'Inspectez votre colis avant de payer.'}
                </p>
              </div>
              <div className="hidden lg:block absolute right-0 rtl:right-auto rtl:left-0 top-1/2 -translate-y-1/2 h-8 w-[1px] bg-gradient-to-b from-transparent via-slate-200 to-transparent pointer-events-none" />
            </div>

            {/* Pillar 4 */}
            <div className="relative flex items-center gap-3.5 sm:gap-4 lg:pl-6 rtl:lg:pl-0 rtl:lg:pr-6 group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-sky-50/70 border border-sky-100/90 text-[#0ea5e9] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#0ea5e9] group-hover:border-[#0ea5e9] group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(14,165,233,0.25)] group-hover:scale-105">
                <Headphones size={21} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h4 className="font-display text-[14px] sm:text-[14.5px] font-bold text-slate-950 tracking-tight group-hover:text-[#0ea5e9] transition-colors leading-snug">
                  {isAr ? 'استشارة واختيار شخصي 7/7' : 'Conseil Olfactif Personnalisé'}
                </h4>
                <p className="text-[11.5px] sm:text-[12px] text-slate-500 font-normal leading-relaxed mt-0.5">
                  {isAr ? 'مساعدة لاختيار عطرك المثالي' : 'Recommandations d\'experts 7j/7.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

          </div>
    </section>
  );
}
