'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  Sparkles, 
  Star, 
  Flame,
  Sun,
  BadgeCheck, 
  ShieldCheck,
  Truck, 
  Banknote,
  Check,
  Heart,
  ShoppingBag,
  Headphones,
  Award
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import RecentlyViewed from '@/components/RecentlyViewed';
import { formatMAD, type Product } from '@/lib/products';

interface MobileVersionBHomeProps {
  products: Product[];
  bestsellers: Product[];
  newArrivals?: Product[];
  seasonalTrends?: Product[];
  seasonalTitle?: string;
  seasonalSubtitle?: string;
  seasonQueryParam?: string;
  latestReviews?: any[];
  locale: string;
  dict?: any;
}

interface FlagshipFlacon {
  id: string;
  brand: string;
  name: string;
  shortName: string;
  shortNameAr: string;
  concentration: string;
  price: number;
  originalPrice: number;
  image: string;
  slug: string;
  badge: string;
  badgeAr: string;
}

// 100% AUTHENTIC CATALOG FLACONS FROM DATABASE
const FLAGSHIP_FLACONS: FlagshipFlacon[] = [
  {
    id: 'dior-homme',
    brand: 'CHRISTIAN DIOR',
    name: 'Dior Homme Intense',
    shortName: 'Dior Homme',
    shortNameAr: 'ديور هوم',
    concentration: 'Eau de Parfum · 100ml',
    price: 299,
    originalPrice: 499,
    image: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986823993-Dior_Homme_Intense.jpg',
    slug: 'dior-dior-homme-intense-tester',
    badge: 'LE CHARISME ABSOLU · SÉLECTION HOMME',
    badgeAr: 'كاريزما وأصالة · اختيار رجالي فاخر',
  },
  {
    id: 'baccarat-rouge',
    brand: 'MAISON FRANCIS KURKDJIAN',
    name: 'Baccarat Rouge 540',
    shortName: 'Baccarat 540',
    shortNameAr: 'باكارات 540',
    concentration: 'Extrait de Parfum · 70ml',
    price: 299,
    originalPrice: 449,
    image: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784027743660-838331011-baccarat_rouge.jpg',
    slug: 'baccarat-rouge-540-tester',
    badge: 'HAUTE PARFUMERIE · BESTSELLER N°01',
    badgeAr: 'عطر فاخر · الأكثر طلباً N°01',
  },
  {
    id: 'ysl-libre',
    brand: 'YVES SAINT LAURENT',
    name: 'Libre Intense',
    shortName: 'Libre Intense',
    shortNameAr: 'ليبر إنتنس',
    concentration: 'Eau de Parfum · 90ml',
    price: 299,
    originalPrice: 499,
    image: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784029058352-526765774-Libre_Intense.jpg',
    slug: 'YSL-libre-intense-tester',
    badge: 'COUP DE CŒUR · ÉDITION LUXE FEMME',
    badgeAr: 'المفضل لدى النساء · إصدار فاخر',
  },
];

export default function MobileVersionBHome({
  products = [],
  bestsellers = [],
  newArrivals = [],
  seasonalTrends = [],
  seasonalTitle,
  seasonalSubtitle,
  seasonQueryParam = 'Été,Automne',
  latestReviews = [],
  locale,
  dict,
}: MobileVersionBHomeProps) {
  const isAr = locale === 'ar';
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Dynamic Hero Flacons: Randomly picked from actual Bestsellers on every refresh!
  const [heroFlacons, setHeroFlacons] = useState<FlagshipFlacon[]>(FLAGSHIP_FLACONS);
  const [activeFlaconIdx, setActiveFlaconIdx] = useState(0);
  const [addedIds, setAddedIds] = useState<Record<string | number, boolean>>({});
  const touchStartXRef = useRef<number | null>(null);

  // 1. BESTSELLERS LIST: Synchronized with admin panel (featuredBestsellers)
  const bestsellersList = (() => {
    if (bestsellers && bestsellers.length >= 1) {
      return bestsellers;
    }
    const tagged = products.filter(p => {
      try {
        const t = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
        return Array.isArray(t) && t.includes('bestseller');
      } catch {
        return false;
      }
    });
    return tagged.length >= 1 ? tagged : products;
  })();

  // Random pick of bestsellers on every page load/refresh
  useEffect(() => {
    if (bestsellersList && bestsellersList.length >= 3) {
      // Shuffle bestsellers list to get dynamic picks on every refresh
      const shuffled = [...bestsellersList].sort(() => Math.random() - 0.5);
      const badges = [
        'BESTSELLER N°01 · COUP DE CŒUR',
        'LE CHARISME ABSOLU · SÉLECTION VIP',
        'SÉLECTION EXCLUSIVE · HAUTE NICHE',
      ];
      const badgesAr = [
        'الأكثر طلباً بالمغرب N°01',
        'كاريزما وأصالة · اختيار VIP',
        'اختيار حصري · عطور نيش فاخرة',
      ];

      const dynamicFlacons: FlagshipFlacon[] = shuffled.slice(0, 3).map((p, idx) => {
        const brandName = p.brandLabel || (typeof p.brand === 'string' ? p.brand.toUpperCase() : 'HAUTE PARFUMERIE');
        const shortName = p.name.split('·')[0].split('-')[0].trim();
        const discount = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : Math.round(p.price * 1.45);

        return {
          id: String(p.id),
          brand: brandName,
          name: p.name,
          shortName: shortName,
          shortNameAr: shortName,
          concentration: p.subcategoryLabel ? `${p.subcategoryLabel} · 100ml` : 'Eau de Parfum · 100ml',
          price: p.price,
          originalPrice: discount,
          image: p.images?.[0] || 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986823993-Dior_Homme_Intense.jpg',
          slug: p.slug,
          badge: badges[idx % badges.length],
          badgeAr: badgesAr[idx % badgesAr.length],
        };
      });

      setHeroFlacons(dynamicFlacons);
      // Random pick on refresh
      setActiveFlaconIdx(Math.floor(Math.random() * dynamicFlacons.length));
    }
  }, [bestsellersList]);

  const handleNext = useCallback(() => {
    setActiveFlaconIdx((prev) => (prev + 1) % heroFlacons.length);
  }, [heroFlacons.length]);

  const handlePrev = useCallback(() => {
    setActiveFlaconIdx((prev) => (prev - 1 + heroFlacons.length) % heroFlacons.length);
  }, [heroFlacons.length]);

  // Smooth auto-advance every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 8000);
    return () => clearInterval(timer);
  }, [handleNext]);

  // Touch Swipe Handlers for Mobile Phone Browsers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        if (isAr) handlePrev();
        else handleNext();
      } else {
        if (isAr) handleNext();
        else handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  const activeFlacon = heroFlacons[activeFlaconIdx] || heroFlacons[0] || FLAGSHIP_FLACONS[0];



  // 2. NEW ARRIVALS LIST: Synchronized with admin panel (featuredLatest)
  const newArrivalsList = (() => {
    if (newArrivals && newArrivals.length >= 1) {
      return newArrivals;
    }
    const sorted = [...products].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    return sorted.length >= 1 ? sorted : products;
  })();

  // 3. SEASONAL TRENDS LIST: Synchronized with admin panel (featuredSeasonal)
  const seasonalTrendsList = (() => {
    if (seasonalTrends && seasonalTrends.length >= 1) {
      return seasonalTrends;
    }
    const seasonalTagged = products.filter(p => {
      try {
        const t = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
        return Array.isArray(t) && (t.includes('seasonal-fall') || t.includes('seasonal-spring'));
      } catch {
        return false;
      }
    });
    return seasonalTagged.length >= 1 ? seasonalTagged : products;
  })();

  const handleAddToCart = (p: Product) => {
    addToCart(p, 1);
    setAddedIds((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  // Reusable Horizontal Swipe Card (Clean, Simple Regular Body + Bold Titles)
  const renderHorizontalCard = (p: Product, options?: { badge?: string; badgeColor?: string; rank?: number }) => {
    const isFav = isInWishlist(p.slug);
    const isAdded = addedIds[p.id];
    const pImage = p.images?.[0] || 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986823993-Dior_Homme_Intense.jpg';
    const discountPct = p.originalPrice && p.originalPrice > p.price 
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) 
      : null;

    return (
      <div
        key={p.id}
        className="w-[156px] sm:w-[172px] shrink-0 snap-start bg-white rounded-[20px] border border-[#ECEAE4] p-2.5 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 relative group"
      >
        {/* Top Badges / Ranking */}
        <div className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 z-10 flex items-center gap-1 pointer-events-none">
          {options?.rank !== undefined && (
            <span className="font-body-modern bg-[#111827] text-white text-[7.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
              N° {options.rank < 10 ? `0${options.rank}` : options.rank}
            </span>
          )}
          {options?.badge && (
            <span className={`font-body-modern ${options.badgeColor || 'bg-[#0284c7] text-white'} text-[7.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs`}>
              {options.badge}
            </span>
          )}
        </div>

        {/* Wishlist Heart */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(p.slug);
          }}
          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 z-10 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs border border-[#ECEAE4] flex items-center justify-center text-[#111827] hover:text-rose-500 active:scale-85 transition shadow-2xs cursor-pointer"
        >
          <Heart 
            size={13.5} 
            className={isFav ? "fill-rose-500 text-rose-500" : "text-[#6B7280]"} 
          />
        </button>

        {/* Flacon Link (Seamless Pure White Canvas) */}
        <Link
          href={`/${locale}/product/${p.slug}`}
          className="relative w-full h-[166px] overflow-hidden rounded-2xl bg-white flex items-center justify-center my-0.5"
        >
          <Image
            src={pImage}
            alt={p.name}
            fill
            sizes="200px"
            unoptimized
            className="object-contain scale-115 group-hover:scale-120 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(17,24,39,0.10)]"
          />
        </Link>

        {/* Info */}
        <div className="pt-2 border-t border-[#F3F0EA] flex flex-col justify-between flex-1">
          <div>
            <span className="font-body-modern text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8C827A] block truncate">
              {p.brandLabel || 'HAUTE PARFUMERIE'}
            </span>
            <Link href={`/${locale}/product/${p.slug}`}>
              <h3 className="font-body-modern text-[11.5px] font-bold text-[#111827] line-clamp-2 min-h-[30px] leading-tight mt-0.5 hover:text-[#0284c7] transition">
                {p.name}
              </h3>
            </Link>
          </div>

          <div className="mt-1.5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="font-body-modern text-[13px] font-extrabold text-[#111827]" dir="ltr">
                  {formatMAD(p.price)}
                </span>
                {p.originalPrice && p.originalPrice > p.price && (
                  <span className="font-body-modern text-[9.5px] font-normal text-slate-400 line-through truncate" dir="ltr">
                    {formatMAD(p.originalPrice)}
                  </span>
                )}
              </div>
              {discountPct !== null && (
                <span className="font-body-modern text-[8px] font-bold text-rose-600 bg-rose-50 border border-rose-200/50 px-1.5 py-0.5 rounded leading-none shrink-0" dir="ltr">
                  -{discountPct}%
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleAddToCart(p)}
              className={`font-body-modern w-full mt-2 h-8.5 rounded-xl text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.96] cursor-pointer shadow-2xs ${
                isAdded
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#111827] hover:bg-black text-white'
              }`}
            >
              {isAdded ? (
                <>
                  <Check size={12} strokeWidth={2.5} />
                  <span>{isAr ? 'تمت الإضافة ✓' : 'Ajouté ✓'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={12} strokeWidth={2.2} />
                  <span>{isAr ? 'أضف للسلة' : 'Ajouter'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-[#FAF9F5] text-[#111827] w-full overflow-x-hidden font-body-modern selection:bg-[#0284c7]/20 selection:text-[#111827] pb-24 lg:pb-0 ${isAr ? 'font-arabic' : ''}`}>
      
      {/* ========================================================
          HERO: MODERN LUXURY ART DIRECTION & EFFORTLESS UX
          Symmetrical Editorial Layout · Grand Hero Stage · Direct-Select Chips
          ======================================================== */}
      <section 
        className="relative pt-[62px] pb-5 overflow-hidden bg-gradient-to-b from-[#F8F6F0] via-[#FAF9F6] to-[#F5F2EB]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full">
          
          {/* Symmetrical Balanced Eyebrow */}
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="h-px w-8 bg-[#E0DDD4]" />
            <span className="font-body-modern text-[8.5px] font-semibold tracking-[0.24em] uppercase text-[#6B7280]">
              {isAr ? 'دار العطور الراقية · المغرب' : 'MAISON DE HAUTE PARFUMERIE · MAROC'}
            </span>
            <span className="h-px w-8 bg-[#E0DDD4]" />
          </div>

          {/* Editorial Headline & Value Proposition (Centered & Uncramped) */}
          <div className="text-center px-4 mb-4">
            <h1 className="font-display-modern text-[22px] sm:text-[25px] font-bold text-[#111827] tracking-tight leading-[1.2]">
              {isAr ? (
                <>
                  فن العطور الفاخرة، <br />
                  <span className="text-[#0284c7] font-extrabold">جوهر الذكريات الخالدة.</span>
                </>
              ) : (
                <>
                  L'Art du Parfum d'Exception, <br />
                  <span className="text-[#0284c7] font-extrabold">l'Essence de l'Inoubliable.</span>
                </>
              )}
            </h1>

            <p className="font-body-modern text-[11px] font-normal text-[#6B7280] mt-1.5 max-w-xs mx-auto leading-relaxed">
              {isAr 
                ? 'عطور راقية وتسترات أصلية مستوردة، توصيل سريع 24/48h مع إمكانية معاينة الطرد قبل الدفع.'
                : 'Parfums d’exception & testeurs authentiques au Maroc. Livraison 24/48h avec inspection du colis avant paiement.'
              }
            </p>
          </div>

          {/* Grand Hero Stage Card: Clean, Unified, Every Element In Place */}
          <div className="mx-3.5 rounded-[28px] bg-white border border-[#E5DFD3]/90 shadow-[0_10px_30px_rgba(17,24,39,0.06)] p-4 flex flex-col items-center relative">
            
            {/* Curation Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F5] border border-[#E5DFD3] text-[8.5px] sm:text-[9px] font-bold tracking-[0.16em] uppercase text-[#111827] shadow-2xs mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
              <span>{isAr ? activeFlacon.badgeAr : activeFlacon.badge}</span>
            </div>

            {/* Grand Flacon Showcase (Large, Crisp, Unconstrained) */}
            <Link
              href={`/${locale}/product/${activeFlacon.slug}`}
              aria-label={`Voir ${activeFlacon.name}`}
              className="relative w-full h-[185px] sm:h-[200px] flex items-center justify-center my-1 group cursor-pointer overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFlacon.id}
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <Image
                    src={activeFlacon.image}
                    alt={activeFlacon.name}
                    fill
                    priority
                    unoptimized
                    sizes="240px"
                    className="object-contain scale-115 group-hover:scale-120 transition-transform duration-300 drop-shadow-[0_12px_22px_rgba(17,24,39,0.12)]"
                  />
                </motion.div>
              </AnimatePresence>
            </Link>

            {/* Fragrance Details & Price */}
            <div className="relative z-10 w-full text-center mt-1">
              <span className="text-[9px] font-bold text-[#0284c7] uppercase tracking-[0.2em] block">
                {activeFlacon.brand}
              </span>
              <h2 className="font-display-modern text-[16px] sm:text-[17px] font-bold text-[#111827] tracking-tight mt-0.5">
                {activeFlacon.name}
              </h2>
              <span className="text-[10px] text-[#6B7280] block mt-0.5">
                {activeFlacon.concentration}
              </span>

              {/* Price Row */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="font-body-modern text-[17px] sm:text-[18px] font-extrabold text-[#111827] tracking-tight" dir="ltr">
                  {formatMAD(activeFlacon.price)}
                </span>
                {activeFlacon.originalPrice && (
                  <span className="text-[11px] text-[#9CA3AF] line-through font-normal" dir="ltr">
                    {formatMAD(activeFlacon.originalPrice)}
                  </span>
                )}
                <span className="text-[8.5px] font-bold text-rose-600 bg-rose-50 border border-rose-200/70 px-1.5 py-0.5 rounded leading-none" dir="ltr">
                  -{Math.round(((activeFlacon.originalPrice - activeFlacon.price) / activeFlacon.originalPrice) * 100)}%
                </span>
              </div>
            </div>

            {/* 3 Direct-Select Fragrance Chips (Sitting Right Below Flacon) */}
            <div className="relative z-10 w-full mt-3 pt-2.5 border-t border-[#E5DFD3]/80 grid grid-cols-3 gap-1.5">
              {heroFlacons.map((flacon, idx) => {
                const isActive = activeFlaconIdx === idx;
                return (
                  <button
                    key={flacon.id}
                    type="button"
                    onClick={() => setActiveFlaconIdx(idx)}
                    aria-label={`Afficher ${flacon.name}`}
                    className={`py-2 px-1 rounded-xl text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                      isActive
                        ? 'bg-[#111827] text-white shadow-sm ring-1 ring-[#111827]'
                        : 'bg-white hover:bg-slate-50 text-[#4B5563] border border-[#E0DDD4]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                        isActive ? 'bg-[#0ea5e9]' : 'bg-[#D1D5DB]'
                      }`}
                    />
                    <span
                      className={`text-[9.5px] tracking-tight leading-none truncate ${
                        isActive ? 'font-bold text-white' : 'font-medium text-[#4B5563]'
                      } ${isAr ? 'font-arabic' : 'font-body-modern'}`}
                    >
                      {isAr ? flacon.shortNameAr : flacon.shortName}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Primary High-Impact CTA Button & Trust Guarantees */}
          <div className="px-3.5 mt-3.5 flex flex-col gap-2.5">
            <Link
              href={`/${locale}/shop`}
              className="font-body-modern w-full bg-[#111827] hover:bg-black text-white py-3.5 px-6 rounded-2xl text-[11.5px] font-bold tracking-[0.16em] uppercase flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(17,24,39,0.18)] active:scale-[0.98] transition-all"
            >
              <span>{isAr ? 'اكتشف جميع العطور في المتجر' : 'DÉCOUVRIR TOUTE LA BOUTIQUE'}</span>
              <ArrowRight size={15} className="rtl:rotate-180" />
            </Link>

            {/* Reassurance Micro-Pills */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-center">
              <div className="bg-white/85 rounded-xl border border-[#E5DFD3]/80 py-2 px-1 flex flex-col items-center shadow-2xs">
                <ShieldCheck size={14} className="text-[#0284c7] mb-0.5" />
                <span className="text-[9.5px] font-bold text-[#111827] leading-tight">{isAr ? 'أصلية 100%' : '100% Authentique'}</span>
                <span className="text-[8px] text-[#6B7280]">{isAr ? 'مستوردة ومضمونة' : 'Testeurs certifiés'}</span>
              </div>
              <div className="bg-white/85 rounded-xl border border-[#E5DFD3]/80 py-2 px-1 flex flex-col items-center shadow-2xs">
                <Truck size={14} className="text-[#0284c7] mb-0.5" />
                <span className="text-[9.5px] font-bold text-[#111827] leading-tight">{isAr ? 'توصيل 24/48h' : 'Livraison 24–48h'}</span>
                <span className="text-[8px] text-[#6B7280]">{isAr ? 'سريع بالمغرب' : 'Partout au Maroc'}</span>
              </div>
              <div className="bg-white/85 rounded-xl border border-[#E5DFD3]/80 py-2 px-1 flex flex-col items-center shadow-2xs">
                <Banknote size={14} className="text-[#0284c7] mb-0.5" />
                <span className="text-[9.5px] font-bold text-[#111827] leading-tight">{isAr ? 'معاينة قبل الدفع' : 'Paiement à la livraison'}</span>
                <span className="text-[8px] text-[#6B7280]">{isAr ? '0 درهم مسبق' : 'Inspectez le colis'}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          CATEGORY DISCOVERY: LES UNIVERS OLFACTIFS (GENDER / NICHE)
          HOMME · FEMME · UNISEXE (Originaux moved under Tendances)
          Pure Floating Flacons (Zero Shadow Cutout) & Luxury Aura
          ======================================================== */}
      <section className="px-4 py-6 bg-gradient-to-b from-white via-[#FAF8F5] to-white border-y border-[#ECE7DC]">
        <div className="w-full">
          {/* Category Header */}
          <div className="flex items-center justify-between mb-3.5 px-0.5">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                <span className="text-[8.5px] font-bold text-[#0284c7] uppercase tracking-[0.2em] block">
                  {isAr ? 'تصفح حسب الفئة' : 'PARCOURIR PAR UNIVERS'}
                </span>
              </div>
              <h3 className="font-display-modern text-[16px] font-bold text-[#111827] tracking-tight">
                {isAr ? 'العوالم العطرية الفاخرة' : 'Les Univers Olfactifs'}
              </h3>
            </div>
            <Link 
              href={`/${locale}/shop`} 
              className="text-[11px] font-bold text-[#0284c7] bg-[#0284c7]/5 hover:bg-[#0284c7]/10 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors border border-[#0284c7]/15"
            >
              <span>{isAr ? 'عرض الكل' : 'Voir tout'}</span>
              <ChevronRight size={13} className="rtl:rotate-180" />
            </Link>
          </div>

          {/* Grand Category Cards: Homme + Femme (2 Cols) & Unisexe (Full Width Luxe) — Pure Floating Flacons (No Ground Shadow) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* HOMME */}
            <Link
              href={`/${locale}/shop/men`}
              className="group relative rounded-2xl border border-slate-200/90 hover:border-sky-400/60 bg-gradient-to-b from-[#FAFBFD] via-[#F3F7FA] to-[#E9F0F6] p-3 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md active:scale-[0.98] transition-all duration-300 h-[216px]"
            >
              {/* Subtle Luxury Editorial Monogram Watermark */}
              <span className="absolute ltr:-right-1 rtl:-left-1 -top-1.5 text-[44px] font-black tracking-tighter text-slate-900/[0.04] select-none pointer-events-none font-serif leading-none">
                I
              </span>
              {/* Luminous Ambient Spotlight (Pure back light, zero shadow) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-sky-400/15 blur-xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-display-modern text-[13.5px] font-black tracking-[0.06em] uppercase text-[#111827] group-hover:text-sky-600 transition-colors">
                    {isAr ? 'رجال' : 'HOMME'}
                  </span>
                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50/95 border border-sky-300/50 px-1.5 py-0.5 rounded-full shadow-2xs shrink-0 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-sky-500" />
                    <span>{isAr ? 'الأكثر طلباً' : 'Best-Seller'}</span>
                  </span>
                </div>
                <p className="text-[9.5px] font-medium text-slate-500 leading-tight line-clamp-1">
                  {isAr ? 'جاذبية وقوة السيلّاج' : 'Sillage & Puissance'}
                </p>
              </div>

              {/* Pure Floating Flacon — 100% Transparent Cutout, Zero Shadow */}
              <div className="relative w-full h-[116px] mt-1 mb-0.5 flex items-center justify-center z-10">
                <Image
                  src="/images/flacon_dior_sauvage.png"
                  alt="Parfums Homme"
                  fill
                  sizes="160px"
                  unoptimized
                  className="object-contain scale-105 group-hover:scale-115 group-hover:-translate-y-1 transition-all duration-300 ease-out"
                />
              </div>

              <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-slate-900/5">
                <span className="text-[10px] font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                  {isAr ? 'استكشف المجموعة' : 'Explorer'}
                </span>
                <div className="w-5 h-5 rounded-full bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 group-hover:bg-sky-500 group-hover:border-sky-500 group-hover:text-white transition-all duration-200">
                  <ChevronRight size={11} className="rtl:rotate-180" />
                </div>
              </div>
            </Link>

            {/* FEMME */}
            <Link
              href={`/${locale}/shop/women`}
              className="group relative rounded-2xl border border-rose-200/80 hover:border-rose-400/60 bg-gradient-to-b from-[#FFFDFD] via-[#FDF5F2] to-[#FBECE6] p-3 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md active:scale-[0.98] transition-all duration-300 h-[216px]"
            >
              {/* Subtle Luxury Editorial Monogram Watermark */}
              <span className="absolute ltr:-right-1 rtl:-left-1 -top-1.5 text-[44px] font-black tracking-tighter text-rose-950/[0.04] select-none pointer-events-none font-serif leading-none">
                II
              </span>
              {/* Luminous Ambient Spotlight (Pure back light, zero shadow) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-rose-400/15 blur-xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-display-modern text-[13.5px] font-black tracking-[0.06em] uppercase text-[#111827] group-hover:text-rose-600 transition-colors">
                    {isAr ? 'نساء' : 'FEMME'}
                  </span>
                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50/95 border border-rose-300/50 px-1.5 py-0.5 rounded-full shadow-2xs shrink-0 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-rose-500" />
                    <span>{isAr ? 'أنوثة راقية' : 'Coup de Cœur'}</span>
                  </span>
                </div>
                <p className="text-[9.5px] font-medium text-slate-500 leading-tight line-clamp-1">
                  {isAr ? 'أناقة وسحر أنثوي' : 'Élégance & Douceur'}
                </p>
              </div>

              {/* Pure Floating Flacon — 100% Transparent Cutout, Zero Shadow */}
              <div className="relative w-full h-[116px] mt-1 mb-0.5 flex items-center justify-center z-10">
                <Image
                  src="/images/flacon_libre_intense.png"
                  alt="Parfums Femme"
                  fill
                  sizes="160px"
                  unoptimized
                  className="object-contain scale-105 group-hover:scale-115 group-hover:-translate-y-1 transition-all duration-300 ease-out"
                />
              </div>

              <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-rose-900/5">
                <span className="text-[10px] font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                  {isAr ? 'استكشف المجموعة' : 'Explorer'}
                </span>
                <div className="w-5 h-5 rounded-full bg-white border border-rose-200/80 shadow-2xs flex items-center justify-center text-slate-700 group-hover:bg-rose-500 group-hover:border-rose-500 group-hover:text-white transition-all duration-200">
                  <ChevronRight size={11} className="rtl:rotate-180" />
                </div>
              </div>
            </Link>

            {/* UNISEXE — Full Width Prestige Showcase */}
            <Link
              href={`/${locale}/shop/unisex`}
              className="group relative col-span-2 rounded-2xl border border-amber-200/90 hover:border-amber-400/70 bg-gradient-to-r from-[#FCFAF6] via-[#FAF4EA] to-[#F5ECE0] p-3.5 flex items-center justify-between overflow-hidden shadow-2xs hover:shadow-md active:scale-[0.99] transition-all duration-300 min-h-[134px]"
            >
              {/* Subtle Luxury Editorial Monogram Watermark */}
              <span className="absolute ltr:-left-1 rtl:-right-1 -bottom-2 text-[52px] font-black tracking-tighter text-amber-950/[0.04] select-none pointer-events-none font-serif leading-none">
                III
              </span>
              {/* Luminous Ambient Spotlight (Pure back light, zero shadow) */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-8 w-32 h-32 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col justify-between h-full pr-3 rtl:pr-0 rtl:pl-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display-modern text-[14px] font-black tracking-[0.06em] uppercase text-[#111827] group-hover:text-amber-700 transition-colors">
                      {isAr ? 'للجنسين' : 'UNISEXE'}
                    </span>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                      <Sparkles size={8} className="text-amber-600" />
                      <span>{isAr ? 'عطور نيش' : 'Haute Niche'}</span>
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-600 leading-tight line-clamp-1">
                    {isAr ? 'عطور النيش الخاصة وإبداعات نادرة' : 'Collections Privées & Sillages Rares'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-2 text-[#111827] group-hover:text-amber-700 transition-colors">
                  <span className="text-[10.5px] font-bold">
                    {isAr ? 'استكشف عطور النيش' : 'Explorer les collections'}
                  </span>
                  <div className="w-5 h-5 rounded-full bg-white border border-amber-200/80 shadow-2xs flex items-center justify-center text-slate-700 group-hover:bg-amber-600 group-hover:border-amber-600 group-hover:text-white transition-all duration-200">
                    <ChevronRight size={11} className="rtl:rotate-180" />
                  </div>
                </div>
              </div>

              {/* Pure Floating Flacon — 100% Transparent Cutout, Zero Shadow */}
              <div className="relative w-[114px] h-[108px] shrink-0 flex items-center justify-center z-10">
                <Image
                  src="/images/flacon_baccarat_rouge.png"
                  alt="Parfums Unisexe & Niche"
                  fill
                  sizes="130px"
                  unoptimized
                  className="object-contain scale-110 group-hover:scale-120 group-hover:-translate-y-1 transition-all duration-300 ease-out"
                />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          1. BESTSELLERS: "Les Bestsellers Absolus"
          Horizontal Swipe Carousel (Matching "Les Dernières Sorties" Style)
          Synchronized 100% with Admin Panel (featuredBestsellers)
          ======================================================== */}
      <section className="py-7 bg-[#FAF9F6] border-b border-[#ECE7DC]">
        <div className="w-full">
          
          {/* Section Header with Bold Modern Title */}
          <div className="px-4 flex items-end justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Sparkles size={11} className="text-[#0284c7]" />
                <span className="font-body-modern text-[9.5px] font-semibold tracking-[0.24em] uppercase text-[#0284c7]">
                  {isAr ? 'الأكثر طلباً بالمغرب —' : 'COUP DE CŒUR CLIENTS —'}
                </span>
              </div>
              <h2 className="font-display-modern text-[21px] sm:text-[23px] font-bold text-[#111827] tracking-tight">
                {isAr ? 'أكثر العطور طلباً' : 'Les Bestsellers Absolus'}
              </h2>
            </div>
            
            <Link 
              href={`/${locale}/shop?sort=bestseller`} 
              className="font-body-modern text-[11px] font-bold uppercase tracking-wider text-[#111827] hover:text-[#0284c7] transition flex items-center gap-1"
            >
              <span>{isAr ? 'عرض الكل' : 'Voir tout'}</span>
              <ArrowRight size={12} className="rtl:rotate-180" />
            </Link>
          </div>

          {/* Horizontal Snap Carousel with Admin Order & End Padding */}
          <div className="flex gap-3 overflow-x-auto pb-3 px-4 scrollbar-none snap-x snap-mandatory after:w-10 after:shrink-0">
            {bestsellersList.map((p, idx) => renderHorizontalCard(p, { rank: idx + 1 }))}
          </div>

        </div>
      </section>

      {/* ========================================================
          2. LES DERNIÈRES SORTIES (NEW ARRIVALS)
          Horizontal Swipe Carousel with NOUVEAU Badge
          Synchronized 100% with Admin Panel (featuredLatest)
          ======================================================== */}
      <section className="py-7 bg-white border-b border-[#ECE7DC]">
        <div className="w-full">
          
          {/* Section Header with Bold Modern Title */}
          <div className="px-4 flex items-end justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Flame size={12} className="text-[#0284c7]" />
                <span className="font-body-modern text-[9.5px] font-semibold tracking-[0.24em] uppercase text-[#0284c7]">
                  {isAr ? 'وصل حديثاً —' : 'ARRIVAGES RÉCENTS —'}
                </span>
              </div>
              <h2 className="font-display-modern text-[21px] sm:text-[23px] font-bold text-[#111827] tracking-tight">
                {isAr ? 'أحدث الإصدارات' : 'Les Dernières Sorties'}
              </h2>
            </div>
            
            <Link 
              href={`/${locale}/shop?sort=newest`} 
              className="font-body-modern text-[11px] font-bold uppercase tracking-wider text-[#111827] hover:text-[#0284c7] transition flex items-center gap-1"
            >
              <span>{isAr ? 'عرض الكل' : 'Voir tout'}</span>
              <ArrowRight size={12} className="rtl:rotate-180" />
            </Link>
          </div>

          {/* Horizontal Snap Carousel with Admin Order & End Padding */}
          <div className="flex gap-3 overflow-x-auto pb-3 px-4 scrollbar-none snap-x snap-mandatory after:w-10 after:shrink-0">
            {newArrivalsList.map((p) => renderHorizontalCard(p, { badge: isAr ? 'جديد' : 'NOUVEAU', badgeColor: 'bg-[#0284c7] text-white' }))}
          </div>

        </div>
      </section>

      {/* ========================================================
          3. TENDANCES ÉTÉ-AUTOMNE (SEASONAL TRENDS)
          New Horizontal Swipe Carousel Style (Matching User's Favorite Format)
          Synchronized 100% with Admin Panel (featuredSeasonal)
          ======================================================== */}
      <section className="py-7 bg-[#FAF9F6] border-b border-[#ECE7DC]">
        <div className="w-full">
          
          {/* Section Header with Bold Modern Title & Subtitle */}
          <div className="px-4 flex items-end justify-between mb-1.5">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Sun size={12} className="text-[#b45309]" />
                <span className="font-body-modern text-[9.5px] font-semibold tracking-[0.24em] uppercase text-[#b45309]">
                  {isAr ? 'إصدار موسمي خاص —' : 'ÉDITION SAISONNIÈRE —'}
                </span>
              </div>
              <h2 className="font-display-modern text-[21px] sm:text-[23px] font-bold text-[#111827] tracking-tight">
                {seasonalTitle || (isAr ? 'اتجاهات الصيف والخريف' : 'Tendances Été-Automne')}
              </h2>
            </div>
            
            <Link 
              href={`/${locale}/shop?season=${seasonQueryParam}`} 
              className="font-body-modern text-[11px] font-bold uppercase tracking-wider text-[#111827] hover:text-[#b45309] transition flex items-center gap-1 shrink-0"
            >
              <span>{isAr ? 'عرض الكل' : 'Voir tout'}</span>
              <ArrowRight size={12} className="rtl:rotate-180" />
            </Link>
          </div>

          {/* Seasonal Subtitle */}
          <p className="px-4 font-body-modern text-[11px] font-normal text-[#6B7280] mb-4 leading-relaxed">
            {seasonalSubtitle || (isAr 
              ? 'عطور أيقونية بنفحات شمسية وخشبية دافئة لمرافقة الانتقال الموسمي بكل أناقة.'
              : 'Des parfums iconiques pour prolonger l’été et accueillir l’automne avec élégance.'
            )}
          </p>

          {/* Horizontal Snap Carousel with Seasonal Badge & End Padding */}
          <div className="flex gap-3 overflow-x-auto pb-3 px-4 scrollbar-none snap-x snap-mandatory after:w-10 after:shrink-0">
            {seasonalTrendsList.map((p) => renderHorizontalCard(p, { badge: isAr ? 'صيف-خريف' : 'ÉTÉ-AUTOMNE', badgeColor: 'bg-[#b45309] text-white' }))}
          </div>

        </div>
      </section>

      {/* ========================================================
          4. PARCOURIR PAR GAMME : TESTEURS (TOP) · ORIGINAUX & MASTER COPY (ROW)
          Pure Floating Flacons (No Inner Box, Background Removed)
          Place de Testeur inversée avec Parfum Original selon la demande utilisateur
          ======================================================== */}
      <section className="px-4 py-7 bg-white border-b border-[#ECE7DC]">
        <div className="w-full">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3.5 px-0.5">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Award size={12} className="text-[#0284c7]" />
                <span className="text-[8.5px] font-bold text-[#0284c7] uppercase tracking-[0.2em] block">
                  {isAr ? 'تصفح حسب الفئة —' : 'EXPLOREZ PAR GAMME —'}
                </span>
              </div>
              <h2 className="font-display-modern text-[19px] sm:text-[21px] font-bold text-[#111827] tracking-tight">
                {isAr ? 'تسترات، عطور أصلية وماستر كوبي' : 'Testeurs, Originaux & Master Copy'}
              </h2>
              <p className="text-[10.5px] font-normal text-[#6B7280] mt-0.5 leading-relaxed">
                {isAr 
                  ? 'اختر الفئة المناسبة: تسترات أصلية مستوردة، عطور أصلية مختومة، أو تشكيلة ماستر كوبي.'
                  : 'Choisissez votre univers : testeurs authentiques importés, flacons retail scellés ou éditions Master Copy.'
                }
              </p>
            </div>
          </div>

          {/* Cards Grid: 1 Wide Flagship (TESTEURS) + 2 Columns (ORIGINAUX & MASTER COPY) */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            
            {/* 1. TESTEURS — Full Width Flagship Card (Swapped on Top as Requested) */}
            <Link
              href={`/${locale}/testeurs`}
              className="group relative col-span-2 rounded-2xl border border-[#CDE3F7] bg-gradient-to-r from-[#F6FAFE] via-[#EDF5FD] to-[#E3F0FA] p-3.5 flex items-center justify-between overflow-hidden shadow-2xs hover:shadow-md hover:border-[#0284c7]/50 active:scale-[0.99] transition-all duration-300 min-h-[135px]"
            >
              <div className="absolute -right-4 -bottom-4 w-36 h-36 rounded-full bg-sky-400/15 blur-xl pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-full pr-3 rtl:pr-0 rtl:pl-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display-modern text-[14.5px] font-black tracking-[0.06em] uppercase text-[#111827] group-hover:text-[#0284c7] transition-colors">
                      {isAr ? 'تسترات أصلية' : 'TESTEURS AUTHENTIQUES'}
                    </span>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-[#0284c7] bg-white/95 border border-[#0284c7]/25 px-1.5 py-0.5 rounded-full shadow-2xs">
                      {isAr ? 'الأكثر طلباً' : 'Authentique 100%'}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-[#6B7280] leading-snug max-w-[210px]">
                    {isAr 
                      ? 'تسترات أصلية مستوردة بنفس التركيز الأصلي، أسعار استثنائية وتوفير حتى 60%.'
                      : 'Même jus que le flacon scellé, emballage neutre officiel et rapport qualité/prix imbattable.'
                    }
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-2 text-[#111827] group-hover:text-[#0284c7] transition-colors">
                  <span className="text-[10.5px] font-bold">
                    {isAr ? 'اكتشف التسترات الأصلية' : 'Explorer les Testeurs'}
                  </span>
                  <div className="w-5 h-5 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#111827] group-hover:bg-[#0284c7] group-hover:text-white transition-all duration-200">
                    <ChevronRight size={11} className="rtl:rotate-180" />
                  </div>
                </div>
              </div>

              {/* Pure Floating Flacon — Transparent Cutout, No Box, Zero Shadow */}
              <div className="relative w-[110px] h-[115px] shrink-0 flex items-center justify-center z-10">
                <Image
                  src="/images/flacon_dior_homme_intense.png"
                  alt="Testeurs de Parfums Authentiques"
                  fill
                  sizes="140px"
                  unoptimized
                  className="object-contain scale-105 group-hover:scale-115 group-hover:-translate-y-1 transition-all duration-300 ease-out"
                />
              </div>
            </Link>

            {/* 2. PARFUMS ORIGINAUX — Column 1 (Swapped to Row 2) */}
            <Link
              href={`/${locale}/parfums-originaux`}
              className="group relative rounded-2xl border border-[#E5D7F4] bg-gradient-to-b from-[#FAF7FD] to-[#EFE4FA] p-3 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md hover:border-[#9333ea]/50 active:scale-[0.98] transition-all duration-300 h-[206px]"
            >
              <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-display-modern text-[13.5px] font-black tracking-[0.06em] uppercase text-[#111827] group-hover:text-[#9333ea] transition-colors">
                    {isAr ? 'عطور أصلية' : 'ORIGINAUX'}
                  </span>
                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-[#9333ea] bg-white/95 border border-[#9333ea]/20 px-1.5 py-0.5 rounded-full shadow-2xs shrink-0">
                    {isAr ? 'مختومة 100%' : '100% Scellés'}
                  </span>
                </div>
                <p className="text-[9.5px] font-medium text-[#6B7280] leading-tight line-clamp-1">
                  {isAr ? 'علب مختومة مع السلوفان' : 'Blister d’origine & garantie'}
                </p>
              </div>

              {/* Pure Floating Flacon — Transparent Cutout, No Box, Zero Shadow */}
              <div className="relative w-full h-[115px] my-1 flex items-center justify-center z-10">
                <Image
                  src="/images/flacon_amouage_interlude.png"
                  alt="Parfums Originaux Scellés"
                  fill
                  sizes="160px"
                  unoptimized
                  className="object-contain scale-105 group-hover:scale-115 group-hover:-translate-y-1 transition-all duration-300 ease-out"
                />
              </div>

              <div className="relative z-10 flex items-center justify-between pt-1 border-t border-black/5">
                <span className="text-[10px] font-bold text-[#111827] group-hover:text-[#9333ea] transition-colors">
                  {isAr ? 'تصفح الأصلية' : 'Explorer'}
                </span>
                <div className="w-5 h-5 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#111827] group-hover:bg-[#9333ea] group-hover:text-white transition-all duration-200">
                  <ChevronRight size={11} className="rtl:rotate-180" />
                </div>
              </div>
            </Link>

            {/* 3. MASTER COPY — Column 2 */}
            <Link
              href={`/${locale}/master-copier`}
              className="group relative rounded-2xl border border-[#EDDBC6] bg-gradient-to-b from-[#FCFAF7] to-[#F7EDE1] p-3 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md hover:border-[#b45309]/50 active:scale-[0.98] transition-all duration-300 h-[206px]"
            >
              <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-display-modern text-[13.5px] font-black tracking-[0.06em] uppercase text-[#111827] group-hover:text-[#b45309] transition-colors">
                    {isAr ? 'ماستر كوبي' : 'MASTER COPY'}
                  </span>
                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-[#b45309] bg-white/95 border border-amber-300/40 px-1.5 py-0.5 rounded-full shadow-2xs shrink-0">
                    {isAr ? 'سعر خاص' : 'Prix Doux'}
                  </span>
                </div>
                <p className="text-[9.5px] font-medium text-[#6B7280] leading-tight line-clamp-1">
                  {isAr ? 'جودة عالية مطابقة' : 'Inspiration 1:1 fidèle'}
                </p>
              </div>

              {/* Pure Floating Flacon — Transparent Cutout, No Box, Zero Shadow */}
              <div className="relative w-full h-[115px] my-1 flex items-center justify-center z-10">
                <Image
                  src="/images/flacon_le_male_elixir.png"
                  alt="Parfums Master Copy"
                  fill
                  sizes="160px"
                  unoptimized
                  className="object-contain scale-105 group-hover:scale-115 group-hover:-translate-y-1 transition-all duration-300 ease-out"
                />
              </div>

              <div className="relative z-10 flex items-center justify-between pt-1 border-t border-black/5">
                <span className="text-[10px] font-bold text-[#111827] group-hover:text-[#b45309] transition-colors">
                  {isAr ? 'تصفح ماستر كوبي' : 'Explorer'}
                </span>
                <div className="w-5 h-5 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#111827] group-hover:bg-[#b45309] group-hover:text-white transition-all duration-200">
                  <ChevronRight size={11} className="rtl:rotate-180" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ========================================================
          TRUST PILLARS: 4 REFINED COLUMNS
          Clean Modern Typography · Zero Clutter
          ======================================================== */}
      <section className="px-4 py-6 bg-white border-y border-[#ECE7DC]">
        <div className="w-full">
          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
            
            {/* Pillar 1 */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0 mt-0.5">
                <Award size={14} />
              </div>
              <div>
                <span className="font-body-modern text-[11.5px] font-bold text-[#111827] block">
                  {isAr ? 'جودة أصلية' : 'Haute Qualité'}
                </span>
                <span className="font-body-modern text-[10px] font-normal text-[#6B7280] block mt-0.5">
                  {isAr ? '100% عطور وتسترات أصلية' : '100% Authentique garanti'}
                </span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0 mt-0.5">
                <Truck size={14} />
              </div>
              <div>
                <span className="font-body-modern text-[11.5px] font-bold text-[#111827] block">
                  {isAr ? 'توصيل سريع' : 'Livraison Express'}
                </span>
                <span className="font-body-modern text-[10px] font-normal text-[#6B7280] block mt-0.5">
                  {isAr ? '24–48 ساعة لكافة المدن' : '24–48h partout au Maroc'}
                </span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0 mt-0.5">
                <Banknote size={14} />
              </div>
              <div>
                <span className="font-body-modern text-[11.5px] font-bold text-[#111827] block">
                  {isAr ? 'دفع عند الاستلام' : 'Paiement à la Réception'}
                </span>
                <span className="font-body-modern text-[10px] font-normal text-[#6B7280] block mt-0.5">
                  {isAr ? 'عاين قبل أداء درهم واحد' : 'Zéro avance exigée'}
                </span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0 mt-0.5">
                <Headphones size={14} />
              </div>
              <div>
                <span className="font-body-modern text-[11.5px] font-bold text-[#111827] block">
                  {isAr ? 'استشارة الخبراء' : 'Conseil d\'Experts'}
                </span>
                <span className="font-body-modern text-[10px] font-normal text-[#6B7280] block mt-0.5">
                  {isAr ? 'خدمة الزبناء رهن إشارتكم' : 'Assistance personnalisée'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          RECENTLY VIEWED
          ======================================================== */}
      <div className="px-4 py-4">
        <RecentlyViewed />
      </div>

    </div>
  );
}
