'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Star, 
  BadgeCheck, 
  Truck, 
  Banknote,
  Check,
  PackageCheck,
  Lock
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';
import { formatMAD, type Product } from '@/lib/products';

interface MobileConceptCHomeProps {
  products: Product[];
  bestsellers: Product[];
  latestReviews?: any[];
  locale: string;
  dict?: any;
}

interface FlagshipFlacon {
  id: string;
  brand: string;
  name: string;
  concentration: string;
  price: number;
  originalPrice: number;
  image: string;
  slug: string;
  badge: string;
  badgeAr: string;
  shortTag: string;
}

// 100% Studio-cut transparent PNGs with zero white borders
const FLAGSHIP_FLACONS: FlagshipFlacon[] = [
  {
    id: 'baccarat-rouge',
    brand: 'MAISON FRANCIS KURKDJIAN',
    name: 'Baccarat Rouge 540',
    concentration: 'Extrait de Parfum · 70ml',
    price: 299,
    originalPrice: 449,
    image: '/images/baccarat_clean.png',
    slug: 'baccarat-rouge-540-tester',
    badge: 'HAUTE PARFUMERIE · BESTSELLER N°01',
    badgeAr: 'عطر فاخر · الأكثر طلباً N°01',
    shortTag: 'Baccarat 540',
  },
  {
    id: 'dior-homme',
    brand: 'CHRISTIAN DIOR',
    name: 'Dior Homme Intense',
    concentration: 'Eau de Parfum · 100ml',
    price: 299,
    originalPrice: 499,
    image: '/images/dior_homme_intense_clean.png',
    slug: 'dior-dior-homme-intense-tester',
    badge: 'LE CHARISME ABSOLU · SÉLECTION HOMME',
    badgeAr: 'كاريزما وأصالة · اختيار رجالي فاخر',
    shortTag: 'Dior Homme',
  },
  {
    id: 'ysl-libre',
    brand: 'YVES SAINT LAURENT',
    name: 'Libre Intense',
    concentration: 'Eau de Parfum · 90ml',
    price: 299,
    originalPrice: 499,
    image: '/images/ysl_libre_clean.png',
    slug: 'YSL-libre-intense-tester',
    badge: 'COUP DE CŒUR · ÉDITION LUXE FEMME',
    badgeAr: 'المفضل لدى النساء · إصدار فاخر',
    shortTag: 'YSL Libre',
  },
];

export default function MobileConceptCHome({
  products,
  bestsellers,
  latestReviews = [],
  locale,
  dict,
}: MobileConceptCHomeProps) {
  const isAr = locale === 'ar';

  const [activeFlaconIdx, setActiveFlaconIdx] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const handleNext = useCallback(() => {
    setActiveFlaconIdx((prev) => (prev + 1) % FLAGSHIP_FLACONS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveFlaconIdx((prev) => (prev - 1 + FLAGSHIP_FLACONS.length) % FLAGSHIP_FLACONS.length);
  }, []);

  // Smooth auto-advance every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
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

  const activeFlacon = FLAGSHIP_FLACONS[activeFlaconIdx] || FLAGSHIP_FLACONS[0];

  // 4 Curated Bestsellers for "Les Trésors de NAY"
  const curatedBestsellers = bestsellers && bestsellers.length >= 4 
    ? bestsellers.slice(0, 4) 
    : products.slice(0, 4);

  return (
    <div className="bg-[#FAF8F5] text-[#0D1722] w-full overflow-x-hidden selection:bg-[#0284c7]/20 selection:text-[#0D1722]">
      
      {/* ========================================================
          HERO: NAY SIGNATURE BOUTIQUE (Architectural Luxury Alcove)
          ======================================================== */}
      <section className="relative px-4 pt-3 pb-8 overflow-hidden">
        {/* Soft Ambient Radial Sky-Blue Aura */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-sky-200/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full text-center relative z-10">
          
          {/* Micro Brand Seal */}
          <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md border border-[#E5E0D4] px-3.5 py-1.5 rounded-full shadow-2xs mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
            <span className="text-[9.5px] font-bold tracking-[0.24em] uppercase text-[#0D1722]">
              {isAr ? 'دار العطور الراقية · ناي بارفان' : 'NAY PARFUM · LA PARFUMERIE SIGNATURE'}
            </span>
          </div>

          {/* Haute Couture Editorial Headline */}
          <h1 className="font-serif text-[30px] font-medium text-[#0D1722] tracking-tight leading-[1.14] max-w-sm mx-auto">
            {isAr ? (
              <>ملاذ العطور <span className="text-[#0284c7] font-semibold">الفاخرة والنادرة</span></>
            ) : (
              <>Le Sanctuaire des <span className="text-[#0284c7] italic">Essences Rares</span></>
            )}
          </h1>

          {/* Reassurance Subtitle */}
          <p className="text-[12px] text-[#4A5568] max-w-xs mx-auto mt-2 leading-relaxed font-normal">
            {isAr 
              ? 'تسترات أصلية وعطور فاخرة مستوردة. عاين عطرك وجربه مع الموزع قبل الدفع.'
              : 'Testeurs d’exception et parfums originaux importés. Testez votre flacon avec le livreur avant de payer.'
            }
          </p>

          {/* ========================================================
              ARCHITECTURAL ARCHED PORTAL FLACON SHOWCASE
              ======================================================== */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative my-4 flex flex-col items-center select-none"
          >
            {/* The Signature Arched Frame (Whisper-thin border, seamless radial spotlight) */}
            <div className="relative w-[285px] h-[355px] rounded-t-[142px] bg-gradient-to-b from-[#FFFFFF] via-[#FAF9F6] to-[#F4F1EA] border border-[#E4DFD3] p-5 flex flex-col items-center justify-between shadow-[0_16px_35px_-12px_rgba(13,23,34,0.08)]">
              
              {/* Subtle Flacon Spotlight Halo behind the bottle */}
              <div className="absolute inset-0 rounded-t-[142px] bg-[radial-gradient(circle_at_50%_55%,rgba(255,255,255,0.95)_0%,rgba(244,241,234,0.4)_75%,transparent_100%)] pointer-events-none" />

              {/* Arch Top Keyhole Badge */}
              <div className="relative z-10 text-[8.5px] font-bold tracking-[0.26em] uppercase text-[#0284c7] mt-1 flex items-center gap-1.5">
                <Sparkles size={11} className="text-[#0284c7]" />
                <span>{isAr ? activeFlacon.badgeAr : activeFlacon.badge}</span>
              </div>

              {/* Transparent Cutout Flacon with Realistic Drop Shadow */}
              <Link
                href={`/${locale}/product/${activeFlacon.slug}`}
                className="relative z-10 w-full h-[225px] flex items-center justify-center group cursor-pointer"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFlacon.id}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center p-2"
                  >
                    <Image
                      src={activeFlacon.image}
                      alt={activeFlacon.name}
                      fill
                      priority
                      unoptimized
                      sizes="280px"
                      className="object-contain drop-shadow-[0_16px_22px_rgba(13,23,34,0.16)] group-hover:scale-105 transition-transform duration-300"
                    />
                  </motion.div>
                </AnimatePresence>
              </Link>

              {/* Arch Base Metadata */}
              <div className="relative z-10 w-full pt-2.5 border-t border-[#E8E3D8] flex items-center justify-between text-left rtl:text-right">
                <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
                  <span className="text-[8.5px] font-bold text-[#0284c7] uppercase tracking-[0.2em] block">
                    {activeFlacon.brand}
                  </span>
                  <span className="text-[13px] font-bold text-[#0D1722] truncate block max-w-[150px]">
                    {activeFlacon.name}
                  </span>
                  <span className="text-[9.5px] text-[#718096] block">
                    {activeFlacon.concentration}
                  </span>
                </div>
                <div className="text-right rtl:text-left shrink-0">
                  <span className="text-[14px] font-extrabold text-[#0D1722] block leading-tight">
                    {formatMAD(activeFlacon.price)}
                  </span>
                  {activeFlacon.originalPrice && (
                    <span className="text-[10px] text-slate-400 line-through block">
                      {formatMAD(activeFlacon.originalPrice)}
                    </span>
                  )}
                  <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-full bg-sky-50 text-[#0284c7] text-[8px] font-bold">
                    Testeur VIP
                  </span>
                </div>
              </div>
            </div>

            {/* Segmented Luxury Flacon Switcher Pills */}
            <div className="inline-flex items-center gap-1 bg-white/90 border border-[#E5E0D4] p-1 rounded-full shadow-2xs mt-3 select-none">
              {FLAGSHIP_FLACONS.map((flacon, idx) => (
                <button
                  key={flacon.id}
                  data-testid="flacon-tab"
                  onClick={() => setActiveFlaconIdx(idx)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                    activeFlaconIdx === idx
                      ? 'bg-[#0D1722] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0D1722]'
                  }`}
                >
                  {flacon.shortTag}
                </button>
              ))}
            </div>
          </div>

          {/* Refined Luxury CTAs */}
          <div className="flex flex-col gap-2.5 max-w-xs mx-auto mt-2">
            <Link
              href={`/${locale}/testeurs`}
              className="w-full py-3.5 bg-[#0D1722] hover:bg-[#1A2634] text-white rounded-full font-bold text-[11.5px] tracking-[0.14em] uppercase flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(13,23,34,0.18)] active:scale-[0.98] transition"
            >
              <Sparkles size={13} className="text-[#38bdf8]" />
              <span>{isAr ? 'اكتشف تسترات VIP' : 'Découvrir les Testeurs VIP'}</span>
            </Link>

            <Link
              href={`/${locale}/shop`}
              className="w-full py-3 bg-white/90 hover:bg-slate-50 text-[#0D1722] border border-[#E0DBCF] rounded-full font-bold text-[11.5px] tracking-wider uppercase transition text-center shadow-2xs"
            >
              <span>{isAr ? 'تصفح المتجر بالكامل' : 'Toute la Boutique'}</span>
            </Link>

            <div className="flex items-center justify-center gap-2 text-[10px] text-[#64748B] mt-0.5">
              <ShieldCheck size={12} className="text-[#0284c7]" />
              <span>{isAr ? 'معاينة مجانية أمام الموزع · 0 درهم عند الرفض' : 'Test gratuit devant livreur · 0 DH si refus'}</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          CATEGORY DISCOVERY: THE 3 EDITORIAL VIGNETTES
          ======================================================== */}
      <section className="px-4 py-8 bg-white border-y border-[#ECE7DC]">
        <div className="w-full">
          <div className="text-center max-w-xs mx-auto mb-5">
            <span className="text-[9.5px] font-bold tracking-[0.26em] uppercase text-[#0284c7] block mb-1">
              {isAr ? 'عوالم العطور' : 'Portails Thématiques'}
            </span>
            <h2 className="font-serif text-[22px] font-bold text-[#0D1722]">
              {isAr ? 'استكشف تشكيلاتنا الحصرية' : 'Explorez Nos Univers'}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { 
                title: isAr ? 'عالم الأنوثة والرقي' : 'Univers Féminin', 
                desc: isAr ? 'نفحات زهرية، فاكهية وجذابة لأناقة آسرة' : 'Sillages floraux, fruités & gourmands d’exception', 
                href: `/${locale}/shop/women`,
                img: '/images/armani_my_way_clean.png',
                tag: isAr ? 'للنساء' : 'Pour Elle',
                bgGradient: 'from-[#FCF7F7] to-[#FBF4F2]',
                badgeColor: 'text-[#be185d]',
                count: '+95 Flacons'
              },
              { 
                title: isAr ? 'عالم الرجولة والكاريزما' : 'Univers Masculin', 
                desc: isAr ? 'أريج خشبي، جلدي ومغناطيسي لحضور قوي' : 'Accords boisés, cuirés & magnétiques intenses', 
                href: `/${locale}/shop/men`,
                img: '/images/dior_homme_intense_clean.png',
                tag: isAr ? 'للرجال' : 'Pour Lui',
                bgGradient: 'from-[#F7F9FC] to-[#EFF3F8]',
                badgeColor: 'text-[#0369a1]',
                count: '+80 Flacons'
              },
              { 
                title: isAr ? 'جناح تسترات VIP' : 'Écrin Testeurs Privés', 
                desc: isAr ? 'تسترات أصلية نادرة بأسعار امتيازية' : 'Authentiques testeurs de luxe sous emballage officiel', 
                href: `/${locale}/testeurs`,
                img: '/images/amouage_clean.png',
                tag: isAr ? 'حصري لدى ناي' : 'Exclusif NAY',
                bgGradient: 'from-[#FAF8F2] to-[#F5F0E4]',
                badgeColor: 'text-[#b45309]',
                count: 'Prix Privilège'
              },
            ].map((portal, idx) => (
              <Link
                key={idx}
                href={portal.href}
                className={`group rounded-2xl bg-gradient-to-r ${portal.bgGradient} border border-[#E5E0D4] p-4 flex items-center justify-between gap-3 hover:border-[#0284c7] hover:shadow-sm active:scale-[0.99] transition duration-300`}
              >
                {/* Text Metadata */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${portal.badgeColor}`}>
                      {portal.tag}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">· {portal.count}</span>
                  </div>
                  <h3 className="font-serif text-[16px] font-bold text-[#0D1722] group-hover:text-[#0284c7] transition-colors leading-tight">
                    {portal.title}
                  </h3>
                  <p className="text-[11px] text-[#64748B] line-clamp-1 mt-1 leading-snug">
                    {portal.desc}
                  </p>
                  <div className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#0D1722] group-hover:text-[#0284c7] mt-2 transition-colors">
                    <span>{isAr ? 'استكشف التشكيلة' : 'Découvrir la sélection'}</span>
                    <ChevronRight size={13} className="rtl:rotate-180" />
                  </div>
                </div>

                {/* Flacon Showcase (Transparent Cutout, Large & Proud) */}
                <div className="relative w-20 h-24 shrink-0 flex items-center justify-center">
                  <Image
                    src={portal.img}
                    alt={portal.title}
                    fill
                    sizes="80px"
                    className="object-contain drop-shadow-[0_8px_12px_rgba(13,23,34,0.12)] group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          FEATURED: LES TRÉSORS DE NAY (Curated Bestsellers Grid)
          ======================================================== */}
      <section className="px-4 py-8">
        <div className="w-full">
          <div className="flex items-end justify-between mb-4">
            <div>
              <span className="text-[9.5px] font-bold tracking-[0.25em] uppercase text-[#0284c7] block mb-0.5">
                {isAr ? 'الأكثر طلباً بالمغرب' : 'Les Favoris au Maroc'}
              </span>
              <h2 className="font-serif text-[22px] font-bold text-[#0D1722]">
                {isAr ? 'كنوز ناي بارفان' : 'Les Trésors de NAY'}
              </h2>
            </div>
            <Link 
              href={`/${locale}/shop`} 
              className="text-[11px] font-bold uppercase tracking-wider text-[#0D1722] hover:text-[#0284c7] transition flex items-center gap-1"
            >
              <span>{isAr ? 'عرض الكل' : 'Voir tout'}</span>
              <ChevronRight size={13} className="rtl:rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {curatedBestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          TRUST: LE PACTE CONFIANCE NAY (Elevated Royal Seal)
          ======================================================== */}
      <section className="px-4 py-4">
        <div className="w-full bg-gradient-to-br from-[#0B192C] via-[#0E2038] to-[#142C4C] text-white rounded-3xl p-6 shadow-xl shadow-sky-950/20 border border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-500/15 border border-sky-400/30 px-3 py-1 rounded-full text-[9.5px] font-bold tracking-widest uppercase text-sky-300 mb-3">
              <ShieldCheck size={13} className="text-[#38bdf8]" />
              <span>{isAr ? 'ميثاق الثقة ناي بارفان' : 'Pacte Confiance NAY'}</span>
            </div>
            
            <h3 className="font-serif text-[21px] font-bold leading-tight">
              {isAr ? 'جرّب قبل الدفع · أمان واطمئنان 100%' : 'Testez Avant de Payer. 100% Sérénité.'}
            </h3>
            
            <p className="text-[12px] text-white/75 mt-2 leading-relaxed font-light">
              {isAr
                ? 'توصيل سريع لكافة مدن المغرب خلال 24 إلى 48 ساعة. افتح الطرد وجرب العطر أمام الموزع، وإن لم يعجبك لا تدفع درهماً واحداً.'
                : 'Votre parfum est livré partout au Maroc sous 24 à 48 heures. Ouvrez le colis, testez le parfum devant le livreur. S’il ne correspond pas exactement à vos attentes, vous ne payez rien.'
              }
            </p>

            {/* Verified Trust Pillars */}
            <div className="grid grid-cols-2 gap-2.5 my-4 pt-3.5 border-t border-white/10 text-[11px]">
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-4 h-4 rounded-full bg-sky-400/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-[#38bdf8]" />
                </div>
                <span>{isAr ? 'معاينة قبل الدفع' : 'Test devant livreur'}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-4 h-4 rounded-full bg-sky-400/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-[#38bdf8]" />
                </div>
                <span>{isAr ? '0 درهم إذا تم الرفض' : '0 DH si refus'}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-4 h-4 rounded-full bg-sky-400/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-[#38bdf8]" />
                </div>
                <span>{isAr ? 'توصيل 24-48 ساعة' : 'Livraison 24–48h'}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-4 h-4 rounded-full bg-sky-400/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-[#38bdf8]" />
                </div>
                <span>{isAr ? '100% أصلي ومضمون' : '100% Authentique'}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={`/${locale}/shop`}
                className="w-full py-3.5 bg-white hover:bg-slate-100 text-[#0B192C] text-center rounded-full font-bold text-[11.5px] tracking-wider uppercase transition shadow-md active:scale-[0.98]"
              >
                {isAr ? 'اختر عطرك الآن' : 'Choisir Mon Parfum'}
              </Link>
              <div className="text-[10px] text-white/50 text-center font-medium">
                {isAr ? 'شحن مجاني للطلبات فوق 800 درهم · أداء نقداً عند الاستلام' : 'Livraison offerte dès 800 MAD · Paiement à la livraison'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          MOBILE TESTIMONIALS STRIP (Avis Clients Réels du Maroc)
          ======================================================== */}
      <section className="px-4 py-7">
        <div className="w-full">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#0284c7] block mb-0.5">
                {isAr ? 'آراء زبنائنا' : 'Avis Vérifiés au Maroc'}
              </span>
              <h3 className="font-serif text-[18px] font-bold text-[#0D1722]">
                {isAr ? 'ثقة زبنائنا بالمغرب' : 'Ils Nous Font Confiance'}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E0D4] px-2.5 py-1 rounded-full text-[11px] font-bold shadow-2xs">
              <Star size={11} className="text-amber-500 fill-amber-500" />
              <span>4.9 / 5</span>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
            {[
              {
                author: 'Yassir B.',
                city: 'Casablanca',
                product: 'Amouage Interlude Man',
                comment: '3ème commande chez NAY. Livraison sur Casa f 24h. Le flacon Amouage est 100% original w ri7a dayma!',
              },
              {
                author: 'Mounia T.',
                city: 'Marrakech',
                product: 'Baccarat Rouge 540',
                comment: 'Khdit tester Baccarat Rouge, tbarkallah original w service client sadi9. Recommandé sans hésiter.',
              },
              {
                author: 'Ayoub R.',
                city: 'Tanger',
                product: 'Armani Magenta Tanzanite',
                comment: 'Livraison rapide l Tanger, emballage parfait w l’odeur exceptionnelle. Merci NAY Parfum!',
              },
            ].map((rev, i) => (
              <div
                key={i}
                className="min-w-[82vw] snap-center rounded-2xl bg-white border border-[#E5E0D4] p-4 flex flex-col justify-between shadow-2xs shrink-0"
              >
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} size={11} className="text-amber-500 fill-amber-500" />
                    ))}
                    <span className="text-[9.5px] text-[#0284c7] font-semibold ml-1.5 flex items-center gap-0.5">
                      <BadgeCheck size={11} /> Achat Vérifié
                    </span>
                  </div>
                  <p className="text-[12px] text-[#2D3748] leading-relaxed italic mb-3">
                    "{rev.comment}"
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#0D1722]">{rev.author} · {rev.city}</span>
                  <span className="text-[#0284c7] font-semibold truncate max-w-[130px]">{rev.product}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          RECENTLY VIEWED (Mobile Container)
          ======================================================== */}
      <div className="px-4 py-4">
        <RecentlyViewed />
      </div>

    </div>
  );
}
