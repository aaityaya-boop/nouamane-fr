'use client';

/**
 * HOMEPAGE — NAY Parfums
 * Featured products logic: Bestsellers · New Arrivals · Seasonal Trends
 * Positioning: Authorized designer perfume retailer in Morocco
 */

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import SplitTypographyHero from '@/components/SplitTypographyHero';
import BrandsMarquee from '@/components/BrandsMarquee';
import FAQ from '@/components/FAQ';
import RecentlyViewed from '@/components/RecentlyViewed';
import MobileVersionBHome from '@/components/home/MobileVersionBHome';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false });
import {
  ArrowRight,
  ChevronRight,
  MoveRight,
  Star,
  Truck,
  Award,
  ShieldCheck,
  Gift,
  BadgeCheck,
  Sparkles,
  Flame,
  Leaf,
  Sun,
  Banknote,
} from 'lucide-react';
import {
  Product,
  getSeasonalTrends,
  MAIN_CATEGORIES,
} from '@/lib/products';

import { useDictionary } from '@/context/DictionaryContext';

const fadeUpProps: any = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8, ease: 'easeOut' }
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const staggerItem: any = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

interface CategoryItem {
  slug: string;
  labelShort: string;
  description: string;
}

export default function HomePageClient({ 
  products, 
  config, 
  latestReviews = [],
  initialBrands = []
}: { 
  products: Product[], 
  config?: any, 
  latestReviews?: any[],
  initialBrands?: any[]
}) {
  const dict = useDictionary();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const newArrivalsDefault = [...products].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()).slice(0, 4);

  const currentMonth = new Date().getMonth();
  const isFallWinter = currentMonth >= 8 || currentMonth <= 1;

  const [brands, setBrands] = useState<any[]>(initialBrands);
  const [homepageConfig, setHomepageConfig] = useState<any>(config || null);

  const isCustomFrenchSeason = locale === 'fr' && !!homepageConfig?.seasonalTrendTitle;
  const seasonalTitleParts = (homepageConfig?.seasonalTrendTitle || '').split(' ');
  const titleFirstPart = isCustomFrenchSeason
    ? (seasonalTitleParts[0] || 'Tendances')
    : (isFallWinter ? (dict.seasonal?.titleFirstFall || 'Chaleur &') : (dict.seasonal?.titleFirstSpring || 'Fraîcheur &'));
  const titleSecondPart = isCustomFrenchSeason
    ? (seasonalTitleParts.slice(1).join(' ') || (isFallWinter ? 'Automne-Hiver' : 'Printemps-Été'))
    : (isFallWinter ? (dict.seasonal?.titleSecondFall || 'Intensité Boisée') : (dict.seasonal?.titleSecondSpring || 'Éclat Solaire'));
  
  // Extract seasons based on keywords in the title so the button links correctly
  let extractedSeasons: string[] = [];
  const lowerTitle = (homepageConfig?.seasonalTrendTitle || '').toLowerCase();
  if (lowerTitle.includes('automne')) extractedSeasons.push('Automne');
  if (lowerTitle.includes('hiver')) extractedSeasons.push('Hiver');
  if (lowerTitle.includes('printemps')) extractedSeasons.push('Printemps');
  if (lowerTitle.includes('été') || lowerTitle.includes('ete') || lowerTitle.includes('étè')) extractedSeasons.push('Été');
  
  const seasonQueryParam = extractedSeasons.length > 0 
    ? extractedSeasons.join(',') 
    : (isFallWinter ? 'Automne,Hiver' : 'Printemps,Été');

  const displaySeasonalSubtitle = locale === 'fr' && homepageConfig?.seasonalTrendSubtitle
    ? homepageConfig.seasonalTrendSubtitle
    : (isFallWinter
      ? (dict.seasonal?.subtitleFall || 'Des accords ambrés, épicés et enveloppants pour sublimer les saisons fraîches.')
      : (dict.seasonal?.subtitleSpring || 'Des notes hespéridées, aquatiques et solaires pour illuminer vos journées.'));

  const isAr = locale === 'ar';

  const categoryMeta: Record<string, {
    label: string;
    desc: string;
    image: string;
    tag: string;
    curatedCount: string;
    featuredHouses: string;
    perfumeName: string;
    perfumeBrand: string;
    accords: string[];
    gradientGlow: string;
    badgeColor: string;
  }> = {
    women: {
      label: dict.categories?.womenLabel || (isAr ? 'عطور نسائية' : 'Femme'),
      desc: dict.categories?.womenDesc || (isAr ? 'تشكيلة نسائية ساحرة تجمع بين الأنوثة والرقي والجاذبية.' : 'Sillages floraux, fruités & gourmands créés pour elle.'),
      image: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986846939-Narciso_Rouge.jpg',
      tag: isAr ? 'للنساء · أنوثة ورقي' : 'POUR ELLE · ÉLÉGANCE',
      curatedCount: isAr ? '+95 عطراً نسائياً أصلياً' : '+95 Flacons d\'Exception',
      featuredHouses: 'YSL · Valentino · Armani · Dior',
      perfumeName: 'Narciso Rouge EDP',
      perfumeBrand: 'Narciso Rodriguez',
      accords: ['Floraux Lumineux', 'Gourmands', 'Poudrés'],
      gradientGlow: 'bg-rose-500/10',
      badgeColor: 'bg-rose-50 border-rose-200 text-rose-800',
    },
    men: {
      label: dict.categories?.menLabel || (isAr ? 'عطور رجالية' : 'Homme'),
      desc: dict.categories?.menDesc || (isAr ? 'عطور رجالية قوية وثابتة تمنحك حضوراً جذاباً وكاريزما رجولية.' : 'Accords boisés, ambrés & magnétiques pour affirmer votre charisme.'),
      image: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986823993-Dior_Homme_Intense.jpg',
      tag: isAr ? 'للرجال · كاريزما وأصالة' : 'POUR LUI · CHARISME',
      curatedCount: isAr ? '+80 عطراً رجالياً أصلياً' : '+80 Flacons de Caractère',
      featuredHouses: 'Dior · Creed · Tom Ford · Chanel',
      perfumeName: 'Dior Homme Intense',
      perfumeBrand: 'Christian Dior',
      accords: ['Boisés Nobles', 'Épices Chaudes', 'Magnétiques'],
      gradientGlow: 'bg-sky-500/10',
      badgeColor: 'bg-sky-50 border-sky-200 text-sky-800',
    },
    unisex: {
      label: dict.categories?.unisexLabel || (isAr ? 'عطور مشتركة ونيش' : 'Mixte & Haute Niche'),
      desc: dict.categories?.unisexDesc || (isAr ? 'إبداعات نيش نادرة وفاخرة تتجاوز الحدود وتناسب الجنسين.' : 'Créations rares & audacieuses transcendant les frontières du genre.'),
      image: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1788176891186-345546050-xerjoff_accento.jpg',
      tag: isAr ? 'مجموعة مشتركة · نيش فاخر' : 'COLLECTION PRIVÉE · HAUTE NICHE',
      curatedCount: isAr ? '+40 عطراً نيش مشترك' : '+40 Créations Rares',
      featuredHouses: 'Xerjoff · Armani Privé · Creed',
      perfumeName: 'Xerjoff Accento Overdose',
      perfumeBrand: 'Xerjoff',
      accords: ['Ananas & Jacinthe', 'Iris & Poivre Rose', 'Musc & Vétiver'],
      gradientGlow: 'bg-amber-500/10',
      badgeColor: 'bg-amber-50 border-amber-200 text-amber-800',
    },
  };

  useEffect(() => {
    if (initialBrands.length === 0) {
      fetch('/api/brands')
        .then(res => res.json())
        .then(data => setBrands(data))
        .catch(console.error);
    }

    // Always fetch latest settings from API to reflect admin updates immediately
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setHomepageConfig(data);
      })
      .catch(console.error);
  }, [initialBrands.length]);

  // Use admin-configured products if set, else fallback to tag-based
  const bestsellersDisplay = (() => {
    try {
      const slugs: string[] = JSON.parse(homepageConfig?.featuredBestsellers || '[]');
      if (slugs.length >= 1) {
        const configured = slugs.map(s => products.find(p => p.slug === s)).filter(Boolean) as typeof products;
        if (configured.length < 4) {
          const fallback = products.filter(p => p.tags.includes('bestseller') && !configured.find(c => c.id === p.id));
          const padding = fallback.length >= (4 - configured.length) ? fallback : products.filter(p => !configured.find(c => c.id === p.id));
          return [...configured, ...padding.slice(0, 4 - configured.length)];
        }
        return configured;
      }
    } catch {}
    const tagged = products.filter(p => p.tags.includes('bestseller'));
    return tagged.length >= 4 ? tagged.slice(0, 8) : products.slice(0, 8);
  })();

  const seasonalTrends = (() => {
    try {
      const slugs: string[] = JSON.parse(homepageConfig?.featuredSeasonal || '[]');
      if (slugs.length >= 1) {
        const configured = slugs.map(s => products.find(p => p.slug === s)).filter(Boolean) as typeof products;
        if (configured.length < 4) {
          const fallback = products.filter(p => (p.tags.includes('seasonal-fall') || p.tags.includes('seasonal-spring')) && !configured.find(c => c.id === p.id));
          const padding = fallback.length >= (4 - configured.length) ? fallback : products.filter(p => p.gender === 'women' && !configured.find(c => c.id === p.id));
          return [...configured, ...padding.slice(0, 4 - configured.length)];
        }
        return configured;
      }
    } catch {}
    const tagged = products.filter(p => p.tags.includes('seasonal-fall') || p.tags.includes('seasonal-spring'));
    return tagged.length >= 4 ? tagged.slice(0, 8) : products.filter(p => p.gender === 'women').slice(0, 8);
  })();

  const newArrivals = (() => {
    try {
      const slugs: string[] = JSON.parse(homepageConfig?.featuredLatest || '[]');
      if (slugs.length >= 1) {
        const configured = slugs.map(s => products.find(p => p.slug === s)).filter(Boolean) as typeof products;
        if (configured.length < 4) {
          const padding = newArrivalsDefault.filter(p => !configured.find(c => c.id === p.id));
          return [...configured, ...padding.slice(0, 4 - configured.length)];
        }
        return configured;
      }
    } catch {}
    return newArrivalsDefault;
  })();

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] overflow-x-hidden">
      <Header />

      {/* ========================================================= */}
      {/* MOBILE-ONLY HOMEPAGE (< lg): CONCEPT C "NAY SIGNATURE"    */}
      {/* ========================================================= */}
      <div className="block lg:hidden">
        <MobileVersionBHome
          products={products}
          bestsellers={bestsellersDisplay}
          newArrivals={newArrivals}
          seasonalTrends={seasonalTrends}
          seasonalTitle={isCustomFrenchSeason ? homepageConfig?.seasonalTrendTitle : (isAr ? 'اتجاهات الصيف والخريف' : 'Tendances Été-Automne')}
          seasonalSubtitle={displaySeasonalSubtitle}
          seasonQueryParam={seasonQueryParam}
          latestReviews={latestReviews}
          locale={locale}
          dict={dict}
        />
      </div>

      {/* ========================================================= */}
      {/* DESKTOP-ONLY HOMEPAGE (>= lg): UNCHANGED PRESERVED DESKTOP */}
      {/* ========================================================= */}
      <div className="hidden lg:block">
        {/* ===============================
            HERO (SPLIT TYPOGRAPHY)
            =============================== */}
        <SplitTypographyHero config={config} bestsellers={bestsellersDisplay} />

      {/* ===============================
          CATEGORY SHORTCUTS (Creative Haute Parfumerie 3-Portal Architecture)
          =============================== */}
      <section className="relative w-full bg-[#FAF9F5] py-16 sm:py-20 lg:py-28 overflow-hidden border-b border-[#ECE7DD]">
        {/* Subtle atmospheric ambient glow */}
        <div className="absolute top-1/2 left-0 w-[550px] h-[550px] bg-gradient-to-tr from-[#0ea5e9]/8 to-transparent rounded-full blur-[140px] pointer-events-none -translate-y-1/2 -translate-x-1/3" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-amber-500/6 to-transparent rounded-full blur-[130px] pointer-events-none translate-y-1/4 translate-x-1/4" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          
          {/* Section Header */}
          <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E0DDD4] shadow-2xs text-[10.5px] font-bold tracking-[0.25em] uppercase text-[#0284c7] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
              <span>{dict.categories?.eyebrow || (isAr ? 'مجموعاتنا الحصرية' : 'Nos univers olfactifs')}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
              {dict.categories?.titlePrefix || (isAr ? 'تصفح حسب' : 'Parcourir par')}{' '}
              <span className="text-[#0ea5e9]">
                {dict.categories?.titleSuffix || (isAr ? 'الفئة' : 'Catégorie')}
              </span>
            </h2>
            <p className="mt-3 text-[13px] sm:text-[14px] text-[#6B6B6B] max-w-lg leading-relaxed">
              {isAr ? 'ثلاث عوالم عطرية متميزة صُممت لتمنحك بصمة استثنائية تأسر الحواس.' : 'Trois univers d\'exception pour trouver la fragrance qui sublime votre personnalité.'}
            </p>
          </div>

          {/* Three-Column Creative Luxury Category Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch"
          >
            {MAIN_CATEGORIES.map((cat, index) => {
              const currentCat = categoryMeta[cat.slug] || {
                label: cat.labelShort,
                desc: cat.description,
                image: 'https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986823993-Dior_Homme_Intense.jpg',
                tag: `COLLECTION 0${index + 1}`,
                curatedCount: '+80 Flacons',
                featuredHouses: 'Grandes Maisons',
                perfumeName: 'Testeur Authentique',
                perfumeBrand: 'NAY Parfums',
                accords: ['Signature', 'Prestige', 'Tenue Longue'],
                gradientGlow: 'bg-[#0ea5e9]/10',
                badgeColor: 'bg-sky-50 border-sky-200 text-sky-800',
              };

              return (
                <motion.div
                  variants={staggerItem}
                  key={cat.slug}
                  className="group relative rounded-[28px] lg:rounded-[32px] overflow-hidden bg-white border border-[#E5E0D6] hover:border-[#0ea5e9]/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgba(14,165,233,0.12)] transition-all duration-500 flex flex-col justify-between"
                >
                  <div className="flex flex-col h-full w-full p-6 sm:p-7 lg:p-8 relative z-10">
                    
                    {/* Ambient Glow */}
                    <div className={`absolute top-0 right-0 w-64 h-64 ${currentCat.gradientGlow} rounded-full blur-[45px] translate-x-1/4 -translate-y-1/4 group-hover:scale-130 transition-transform duration-1000 pointer-events-none`} />

                    {/* Card Header: Collection Tag & Title */}
                    <div className="relative z-20 flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[9.5px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-slate-700 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                          <span>{currentCat.tag}</span>
                        </div>
                        <Link href={`/${locale}/shop/${cat.slug}`}>
                          <h3 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-950 tracking-tight group-hover:text-[#0ea5e9] transition-colors duration-300">
                            {currentCat.label}
                          </h3>
                        </Link>
                        <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                          {currentCat.curatedCount}
                        </span>
                      </div>

                      {/* Floating Action Arrow */}
                      <Link
                        href={`/${locale}/shop/${cat.slug}`}
                        aria-label={currentCat.label}
                        className="w-11 h-11 rounded-full border border-[#ECE7DD] bg-[#FAF9F5] flex items-center justify-center text-slate-800 group-hover:bg-[#0ea5e9] group-hover:text-white group-hover:border-[#0ea5e9] transition-all duration-300 flex-shrink-0 shadow-2xs rtl:rotate-180"
                      >
                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                      </Link>
                    </div>

                    {/* Studio Pedestal for Real Perfume Flacon */}
                    <Link 
                      href={`/${locale}/shop/${cat.slug}`}
                      className="relative z-20 block my-4 h-[280px] sm:h-[300px] w-full bg-gradient-to-b from-[#FCFBF9] to-[#F5F2EB] rounded-2xl border border-[#ECE7DD] overflow-hidden cursor-pointer group/flacon p-4"
                    >
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={currentCat.image}
                          alt={currentCat.label}
                          fill
                          sizes="(max-width: 1024px) 100vw, 420px"
                          className="object-contain p-2 transition-transform duration-700 ease-out group-hover/flacon:scale-105 mix-blend-multiply"
                        />
                      </div>

                      {/* Discrete Perfume Identifier Pill */}
                      <div className="absolute bottom-3 left-3 rtl:left-auto rtl:right-3 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xs pointer-events-none">
                        <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                          {currentCat.perfumeName}
                        </span>
                        <span className="text-[9px] font-bold text-[#0ea5e9] tracking-wider uppercase block">
                          {currentCat.perfumeBrand}
                        </span>
                      </div>
                    </Link>

                    {/* Olfactory Accord Tags */}
                    <div className="relative z-20 flex items-center gap-1.5 flex-wrap mb-3">
                      {currentCat.accords.map((accord) => (
                        <span
                          key={accord}
                          className="text-[10px] font-semibold text-slate-600 bg-slate-100/90 px-2.5 py-1 rounded-full border border-slate-200/70"
                        >
                          {accord}
                        </span>
                      ))}
                    </div>

                    {/* Description Text */}
                    <p className="relative z-20 text-slate-500 text-[12.5px] font-normal leading-[1.6] line-clamp-2 mb-4">
                      {currentCat.desc}
                    </p>

                    {/* Card Footer: Explore CTA */}
                    <div className="relative z-20 mt-auto pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide">
                        {currentCat.featuredHouses}
                      </span>

                      <Link 
                        href={`/${locale}/shop/${cat.slug}`}
                        className="inline-flex items-center gap-1.5 text-[11.5px] font-bold tracking-wider uppercase text-[#0ea5e9] group-hover:text-slate-950 transition-colors"
                      >
                        <span>{dict.categories?.explore || (isAr ? 'استكشف التشكيلة' : 'Explorer')}</span>
                        <ChevronRight size={14} className="rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                      </Link>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===============================
          FEATURED — BESTSELLERS
          =============================== */}
      <section className="relative bg-[#f8fafc] border-y border-[#e0ddd4] overflow-hidden py-12 sm:py-16 lg:py-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-tr from-[#0ea5e9]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mb-8 sm:mb-16 relative z-10">
          <SectionHeader
            icon={<Flame size={16} className="text-[#0ea5e9]" />}
            eyebrow={dict.bestsellers?.eyebrow || 'Les plus vendus au Maroc'}
            title={dict.bestsellers?.title || 'Bestsellers'}
            subtitle={dict.bestsellers?.subtitle || 'Les fragrances plébiscitées par nos clients ce mois-ci.'}
            linkLabel={dict.bestsellers?.viewAll || 'Voir tous les bestsellers'}
            linkHref={`/${locale}/shop`}
          />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pb-8 sm:pb-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-7"
          >
            {bestsellersDisplay.map((p) => (
              <motion.div variants={staggerItem} key={p.id}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===============================
          COFFRETS CADEAUX (FULL-BLEED CAROUSEL)
          =============================== */}
      <section className="relative w-full py-20 lg:py-32 overflow-hidden flex items-center my-20">
        {/* Background Image / Cover */}
        <div className="absolute inset-0 z-0">
          <Image 
            src={config?.coffretsCoverImage || "/images/category/pack-decouverte-luxe.jpg"} 
            alt="L'Art d'Offrir" 
            fill 
            className="object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/20" />
        </div>

        <div className="relative z-10 w-full flex flex-col lg:flex-row items-center">
          {/* Left Side: Text Content */}
          <div className="w-full lg:w-[40%] px-6 lg:pl-[max(2.5rem,calc((100vw-1400px)/2+2.5rem))] rtl:lg:pl-6 rtl:lg:pr-[max(2.5rem,calc((100vw-1400px)/2+2.5rem))] mb-12 lg:mb-0">
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37] mb-6 flex items-center gap-2">
              <Gift size={14} className="text-[#0ea5e9]" /> {dict.coffrets?.eyebrow || "L'Art d'Offrir"}
            </span>
            <h2 className="font-display text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              {dict.coffrets?.title || "Coffrets Cadeaux"}
            </h2>
            <p className="text-white/80 text-[16px] leading-relaxed mb-10 max-w-md">
              {dict.coffrets?.desc || "Découvrez nos éditions spéciales conçues pour laisser une empreinte inoubliable. L'assemblage parfait de nos fragrances signatures, présenté dans un écrin d'exception."}
            </p>
            <Link href={`/${locale}/coffrets`} className="inline-flex items-center gap-3 bg-white text-black text-[13px] font-medium px-8 py-4 rounded-full hover:bg-[#D4AF37] hover:text-white transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.3)] group">
              {dict.coffrets?.cta || "Explorer la Collection"}
              <ArrowRight size={16} className="group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
            </Link>
          </div>

          {/* Right Side: Carousel */}
          <div className="w-full lg:w-[60%] pl-6 lg:pl-12 rtl:pl-0 rtl:pr-6 rtl:lg:pr-12">
            <div className="flex gap-6 lg:gap-8 overflow-x-auto snap-x snap-mandatory pb-12 pr-6 lg:pr-10 rtl:pr-0 rtl:pl-6 rtl:lg:pl-10 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {products.filter(p => p.subcategory === 'coffrets').map((p) => (
                <div key={p.id} className="min-w-[280px] max-w-[320px] w-[75vw] snap-start flex-shrink-0">
                  <div className="bg-white rounded-[32px] p-2 shadow-2xl h-full border border-white/20 transform hover:-translate-y-2 transition-transform duration-500">
                    <ProductCard product={p} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ===============================
          FEATURED — NEW ARRIVALS
          =============================== */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-28">
        <SectionHeader
          icon={<Award size={16} className="text-[#0ea5e9]" />}
          eyebrow={dict.newArrivals?.eyebrow || ""}
          title={dict.newArrivals?.title || "Les dernières sorties"}
          subtitle={dict.newArrivals?.subtitle || "Découvrez les nouvelles créations qui viennent d'arriver dans nos rayons."}
          linkLabel={dict.newArrivals?.viewAll || "Voir toutes les nouveautés"}
          linkHref={`/${locale}/shop`}
        />
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-7"
        >
          {newArrivals.map((p) => (
            <motion.div variants={staggerItem} key={p.id}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===============================
          FEATURED — SEASONAL
          =============================== */}
      <section className="relative bg-gradient-to-br from-[#fefce8] via-[#f0f9ff] to-[#e0f2fe] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        
        {/* Decorative elements for summer vibes */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#fde047] rounded-full blur-[150px] opacity-30 pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#38bdf8] rounded-full blur-[150px] opacity-20 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                {isFallWinter ? <Leaf size={14} className="text-[#ea580c]" /> : <Sun size={14} className="text-[#eab308]" />}
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#0ea5e9]">
                  {dict.seasonal?.eyebrow || "Édition saisonnière"}
                </span>
              </div>
              <h2 className="font-display text-5xl lg:text-7xl font-extrabold text-[#1A1A1A] tracking-tight">
                {titleFirstPart}<br />
                <span className="text-[#0ea5e9] italic">{titleSecondPart}</span>
              </h2>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-4">
              <p className="text-[#1A1A1A]/70 text-[14px] max-w-xs text-left lg:text-right rtl:text-right rtl:lg:text-left font-medium">{displaySeasonalSubtitle}</p>
              <Link href={`/${locale}/shop?seasons=${seasonQueryParam}`} className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A] border border-[#1A1A1A]/30 hover:bg-[#0ea5e9] hover:border-[#0ea5e9] hover:text-white transition-all px-6 py-3 rounded-full">
                {dict.seasonal?.cta || "Explorer la sélection"} <ArrowRight size={14} className="rtl:rotate-180" />
              </Link>
            </div>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-7"
          >
            {seasonalTrends.map((p) => (
              <motion.div variants={staggerItem} key={p.id}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===============================
          BRAND SHOWCASE (5 Marques Mythiques)
          =============================== */}
      <section id="brands" className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">
            {dict.brandsSection?.eyebrow || "L'Élite de la Parfumerie"}
          </span>
          <h2 className="font-display text-5xl lg:text-6xl font-extrabold mt-4 tracking-tight">
            {dict.brandsSection?.title || "5 Marques Mythiques"}
          </h2>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col md:flex-row h-[900px] md:h-[700px] w-full gap-3 overflow-hidden group/accordion"
        >
          {[
            { name: 'Yves Saint Laurent', slug: 'yves-saint-laurent', logo: '/logos/ysl.png', img: 'https://images.pexels.com/photos/11216321/pexels-photo-11216321.jpeg?auto=compress&cs=tinysrgb&w=800' },
            { name: 'Valentino', slug: 'valentino', logo: '/logos/valentino.jpg', img: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800' },
            { name: 'Jean Paul Gaultier', slug: 'jean-paul-gaultier', logo: '/logos/jean-paul-gaultier.png', img: 'https://images.pexels.com/photos/1961791/pexels-photo-1961791.jpeg?auto=compress&cs=tinysrgb&w=800' },
            { name: 'Dior', slug: 'dior', logo: '/logos/dior.jpeg', img: 'https://images.pexels.com/photos/432059/pexels-photo-432059.jpeg?auto=compress&cs=tinysrgb&w=800' },
            { name: 'Giorgio Armani', slug: 'armani', logo: '/logos/armani.png', img: 'https://images.pexels.com/photos/1961795/pexels-photo-1961795.jpeg?auto=compress&cs=tinysrgb&w=800' }
          ].map((brand) => (
            <motion.div 
              variants={staggerItem} 
              key={brand.slug} 
              className="brand-slice group relative flex-1 md:hover:flex-[4] transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden rounded-3xl cursor-pointer"
            >
              <Link href={`/${locale}/brands/${brand.slug}`} className="block w-full h-full bg-white relative">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  className="object-contain p-10 mix-blend-multiply opacity-30 group-hover:opacity-100 transition-all duration-[1.5s] scale-90 group-hover:scale-100"
                />
                
                {/* Vertical Text (Collapsed state on desktop) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 md:opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none">
                  <span className="font-display text-[#1A1A1A] text-3xl -rotate-90 whitespace-nowrap tracking-widest">{brand.name}</span>
                </div>

                {/* Content shown on hover */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none transform translate-y-8 group-hover:translate-y-0 z-10">
                  <span className="text-[12px] font-bold tracking-[0.3em] uppercase text-white bg-[#1A1A1A] shadow-xl px-6 py-3 rounded-full border border-black/10">
                    {dict.brandsSection?.discover || "Découvrir"} {brand.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===============================
          VALUE PROPOSITIONS (Audited Verified Store Policies)
          =============================== */}
      <section className="bg-[#fafaf7] text-[#1A1A1A] border-y border-[#e0ddd4]/70">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 lg:py-18 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8"
        >
          {[
            { 
              icon: <ShieldCheck size={19} strokeWidth={1.8} />, 
              title: 'Essayez avant de payer', 
              desc: 'Ouvrez votre colis et testez le parfum devant le livreur. Si vous refusez, vous ne payez rien, aucun frais de livraison.' 
            },
            { 
              icon: <Truck size={19} strokeWidth={1.8} />, 
              title: 'Livraison 24–48h', 
              desc: 'Délai moyen de 24 à 48h après expédition (délai total ~72h selon disponibilité du flacon) partout au Maroc.' 
            },
            { 
              icon: <Award size={19} strokeWidth={1.8} />, 
              title: 'Flacons 100% Authentiques', 
              desc: 'Parfums originaux et testeurs de grandes maisons de luxe, issus directement de distributeurs agréés.' 
            },
            { 
              icon: <Banknote size={19} strokeWidth={1.8} />, 
              title: 'Paiement à la livraison', 
              desc: '0 DH d\'avance exigé. Réglez en toute sérénité en espèces lors de la remise en main propre.' 
            },
          ].map((item) => (
            <motion.div variants={staggerItem} key={item.title} className="text-center sm:text-start bg-white rounded-2xl p-3.5 sm:p-5 border border-[#e0ddd4]/70 shadow-2xs group flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-100 mb-2 sm:mb-3.5 transition-all duration-300 group-hover:bg-[#0ea5e9] group-hover:text-white group-hover:scale-105">
                  {item.icon}
                </div>
                <h3 className="font-display text-[13.5px] sm:text-lg font-bold tracking-tight mb-1 text-[#1A1A1A]">{item.title}</h3>
                <p className="text-[10.5px] sm:text-[12.5px] text-[#6B6B6B] leading-[1.5] sm:leading-[1.65]">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===============================
          TESTIMONIALS (AVIS CLIENTS) — Redesigned
          =============================== */}
      <section className="relative bg-[#0D0D0D] overflow-hidden py-28 lg:py-40">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0ea5e9]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0ea5e9]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-20 gap-8"
          >
            <div>
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#0ea5e9] mb-6 block">
                {dict.reviewsSection?.eyebrow || "Ils nous font confiance"}
              </span>
              <h2 className="font-display text-5xl lg:text-8xl font-extrabold text-white tracking-tight leading-none">
                {dict.reviewsSection?.title || "Avis de nos clients"}
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="font-display text-5xl text-white">4.9</div>
                <div className="flex gap-1 justify-center mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-[#0ea5e9] text-[10.5px] font-bold"><BadgeCheck size={13} /> 5/5 Exceptionnel</span>
                </div>
                <div className="text-[11px] text-[#9A9A9A] mt-1">{dict.reviewsSection?.averageRating || "Note moyenne"}</div>
              </div>
              <div className="w-[1px] h-16 bg-white/10" />
              <div className="text-center">
                <div className="font-display text-5xl text-white">500+</div>
                <div className="text-[11px] text-[#9A9A9A] mt-1">{dict.reviewsSection?.satisfiedClients || "Clients satisfaits"}</div>
              </div>
            </div>
          </motion.div>

          {/* Reviews grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {(latestReviews && latestReviews.length > 0 ? latestReviews : [
              { comment: "C'est la 3ème fois kanakhd mn 3andkom. Service top w la livraison sur Casablanca kant f 24h. Le parfum Amouage rah 100% original w chadda fih ri7a mzyan!", author: "Yassir B.", city: "Casablanca", product: { name: "Amouage Interlude Man" }, rating: 5 },
              { comment: "Franchement j'avais des doutes, mais sda9 site sadi9. Khdit Baccarat Rouge tester, c'est l'original. Tbarkallah 3likom, bonne continuation.", author: "Mounia T.", city: "Marrakech", product: { name: "Baccarat Rouge 540" }, rating: 5 },
              { comment: "Service client f lmostawa. 3awnoni n3zal parfum li bghit. La livraison l Tanger kant rapide w l'emballage n9i. Recommandé à 100%!", author: "Ayoub R.", city: "Tanger", product: { name: "Armani Stronger With You" }, rating: 5 },
              { comment: "J'étais fatigué d'acheter des parfums chez des revendeurs douteux. La garantie d'authenticité et la livraison rapide de NAY font toute la différence. Stronger With You est parfait!", author: "Hassan L.", city: "Casablanca", product: { name: "Armani Stronger With You" }, rating: 5 },
              { comment: "Expérience incroyable. Le parfum est arrivé dans un emballage soigné en moins de 48h. L'odeur est 100% authentique. Je recommande à tous mes proches.", author: "Salma B.", city: "Rabat", product: { name: "YSL Libre Eau de Parfum" }, rating: 5 },
              { comment: "Un service client exceptionnel et un choix incroyable des plus grandes maisons de luxe. C'est de loin ma meilleure expérience d'achat de parfum au Maroc.", author: "Youssef E.", city: "Tanger", product: { name: "Valentino Uomo Intense" }, rating: 5 },
            ]).map((review: any, i: number) => (
              <motion.div
                variants={staggerItem}
                key={review.id || i}
                className={`relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 flex flex-col justify-between ${
                  i === 1 ? 'lg:mt-12' : i === 3 ? 'lg:mt-8' : i === 5 ? 'lg:mt-16' : ''
                }`}
              >
                {/* Quote mark */}
                <div className="absolute top-6 right-8 rtl:right-auto rtl:left-8 text-[80px] leading-none text-white/5 font-serif select-none">"</div>
                
                <div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} size={13} className="text-[#0ea5e9] fill-[#0ea5e9]" />
                    ))}
                  </div>
                  <blockquote className="text-[15px] text-white/80 leading-[1.9] mb-8">
                    {review.comment}
                  </blockquote>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-6">
                  <div>
                    <div className="text-[12px] font-bold tracking-[0.2em] uppercase text-white">
                      {review.author}
                    </div>
                    <div className="text-[11px] text-[#9A9A9A] mt-1">
                      {dict.reviewsSection?.verifiedCustomer || "Client vérifié"} · {review.city}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#0ea5e9] font-bold tracking-wide text-right rtl:text-left max-w-[120px]">
                    {review.product?.name}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-16 flex justify-center">
            <Link href={`/${locale}/shop`} className="text-white border border-white/30 hover:bg-white hover:text-black transition-all px-8 py-4 rounded-full text-[12px] font-bold tracking-[0.15em] uppercase text-center inline-flex items-center gap-2">
              {dict.reviewsSection?.leaveReview || "Vous avez acheté chez nous ? Laissez un avis !"} <ArrowRight size={16} className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <RecentlyViewed />
      </div>
      </div>

      <BrandsMarquee brands={brands} />
      <FAQ />

      <Footer />
      <CartDrawer />
    </div>
  );
}

/* ============================================================
   SECTION HEADER — reusable
   ============================================================ */
function SectionHeader({
  icon,
  eyebrow,
  title,
  subtitle,
  linkLabel,
  linkHref,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  linkLabel: string;
  linkHref: string;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">
            {eyebrow}
          </span>
        </div>
        <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-none">{title}</h2>
        <p className="mt-3 text-[14px] text-[#6B6B6B] max-w-lg">{subtitle}</p>
      </div>
      <Link
        href={linkHref}
        className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#6B6B6B] hover:text-[#0ea5e9] transition-colors group self-start"
      >
        {linkLabel}
        <span className="block w-8 h-px bg-[#6B6B6B] group-hover:bg-[#0ea5e9] transition-colors" />
      </Link>
    </motion.div>
  );
}



