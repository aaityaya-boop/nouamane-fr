'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Heart,
  Bookmark,
  Check,
  ChevronRight,
  ShieldCheck,
  Compass,
  ArrowRight,
  Users,
  User,
  Layers,
  Sparkle,
  ShoppingBag
} from 'lucide-react';
import { QueueProduct, ScentMatchFilters, SwipeAction, GenderFilter } from '@/lib/scentMatch/types';
import ScentMatchCard from './ScentMatchCard';
import { useCart } from '@/context/CartContext';

interface ScentMatchDesktopProps {
  queue: QueueProduct[];
  totalEligible?: number;
  currentIndex: number;
  currentProduct: QueueProduct | null;
  likedProducts: QueueProduct[];
  passedProducts: QueueProduct[];
  savedProducts: QueueProduct[];
  filters: ScentMatchFilters;
  onUpdateFilters: (filters: Partial<ScentMatchFilters>) => void;
  onOpenFilterDrawer: () => void;
  onSwipe: (action: SwipeAction) => void;
  onUndo: () => void;
  canUndo: boolean;
  onOpenDetails: (product: QueueProduct) => void;
  onFinishAnalysis: () => void;
  onOpenFriendMatch: () => void;
  isAnalyzing: boolean;
  recommendedSwipes: number;
  minSwipes: number;
  locale?: string;
}

export default function ScentMatchDesktop({
  queue,
  totalEligible,
  currentIndex,
  currentProduct,
  likedProducts,
  passedProducts,
  savedProducts,
  filters,
  onUpdateFilters,
  onOpenFilterDrawer,
  onSwipe,
  onUndo,
  canUndo,
  onOpenDetails,
  onFinishAnalysis,
  onOpenFriendMatch,
  isAnalyzing,
  recommendedSwipes,
  minSwipes,
  locale = 'fr'
}: ScentMatchDesktopProps) {
  const isAr = locale === 'ar';
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<number | null>(null);
  const totalSwipes = likedProducts.length + passedProducts.length;
  const progressPercent = Math.min(100, Math.round((totalSwipes / recommendedSwipes) * 100));
  const canFinish = totalSwipes >= minSwipes;

  const GENDER_TABS: Array<{
    id: GenderFilter;
    labelFr: string;
    labelAr: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { id: 'all', labelFr: 'Tous les Parfums', labelAr: 'جميع العطور', icon: Sparkles },
    { id: 'men', labelFr: 'Pour Homme', labelAr: 'رجال', icon: User },
    { id: 'women', labelFr: 'Pour Femme', labelAr: 'نساء', icon: Heart },
    { id: 'unisex', labelFr: 'Unisexe', labelAr: 'للجنسين', icon: Layers }
  ];

  // Dynamic atmospheric aura gradient based on subcategory
  const getAtmosphericGlow = (sub?: string) => {
    const s = (sub || '').toLowerCase();
    if (s.includes('bois') || s.includes('wood') || s.includes('oud') || s.includes('cuir')) {
      return 'from-amber-600/15 via-orange-500/10 to-transparent';
    }
    if (s.includes('orient') || s.includes('ambr') || s.includes('vanill')) {
      return 'from-orange-500/20 via-amber-600/10 to-transparent';
    }
    if (s.includes('flor') || s.includes('rose') || s.includes('jasmin')) {
      return 'from-rose-400/20 via-pink-500/10 to-transparent';
    }
    if (s.includes('frais') || s.includes('aquat') || s.includes('agrum') || s.includes('hesp')) {
      return 'from-cyan-400/20 via-sky-500/10 to-transparent';
    }
    if (s.includes('gourm') || s.includes('sucr')) {
      return 'from-amber-400/20 via-yellow-500/10 to-transparent';
    }
    if (s.includes('épic') || s.includes('spic')) {
      return 'from-red-500/20 via-orange-600/10 to-transparent';
    }
    return 'from-sky-500/15 via-sky-400/10 to-transparent';
  };

  const auraGlow = getAtmosphericGlow(currentProduct?.subcategoryLabel);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSwipe('LIKE');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSwipe('PASS');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSwipe('SAVE');
      } else if ((e.ctrlKey && e.key.toLowerCase() === 'z') || (e.key.toLowerCase() === 'u')) {
        e.preventDefault();
        if (canUndo) onUndo();
      } else if (e.key.toLowerCase() === 'i' || e.key === ' ') {
        e.preventDefault();
        if (currentProduct) onOpenDetails(currentProduct);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSwipe, onUndo, canUndo, currentProduct, onOpenDetails]);

  // Next cards in stack for 3D depth effect
  const nextProduct = queue[currentIndex + 1] || null;
  const nextNextProduct = queue[currentIndex + 2] || null;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 pt-16 lg:pt-18 pb-6 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      {/* TOP EDITORIAL BRAND HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200/90 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Compass size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-500">
                Maison NAY Parfums
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Interactive Scent Discovery
              </span>
              {typeof totalEligible === 'number' && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-full">
                    {totalEligible} {isAr ? 'عطر متاح' : 'parfums disponibles'}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'مختبر الاكتشاف الذكي — NAY Scent Match' : 'NAY Scent Match — Atelier Olfactif'}
            </h1>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenFriendMatch}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Users size={15} className="text-sky-500" />
            <span>{isAr ? 'جلسة ثنائية مع صديق' : 'Match à Deux'}</span>
          </button>

          <button
            onClick={onOpenFilterDrawer}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0f172a] hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
          >
            <SlidersHorizontal size={15} />
            <span>{isAr ? 'تخصيص الفلاتر' : 'Filtres Personnalisés'}</span>
          </button>
        </div>
      </div>

      {/* 3-PANEL LUXURY EDITORIAL GRID */}
      <div className="grid grid-cols-12 gap-8 items-start flex-1">
        {/* ================= LEFT PANEL: FILTERS & PROGRESS ================= */}
        <aside className="col-span-3 space-y-5 bg-white/95 dark:bg-slate-900/60 p-6 rounded-[32px] border border-[#E8E2D6] dark:border-slate-800 shadow-sm backdrop-blur-sm">
          {/* Progress Tracker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                {isAr ? 'تقدم الاكتشاف' : 'Progression ADN'}
              </span>
              <span className="font-black text-sky-500">
                {totalSwipes} / {recommendedSwipes}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 shadow-xs"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {totalSwipes < minSwipes
                ? (isAr ? `تفاعل مع ${minSwipes - totalSwipes} عطور إضافية لبدء التحليل` : `Encore ${minSwipes - totalSwipes} interactions pour débloquer l'analyse`)
                : (isAr ? 'بيانات كافية متاحة ! يمكنك التحليل الآن' : 'Données suffisantes ! Vous pouvez analyser votre profil ou continuer')}
            </p>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Active Constraints */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {isAr ? 'الفلاتر النشطة' : 'Filtres Appliqués'}
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold shadow-2xs">
                {filters.gender === 'all' ? (isAr ? 'جميع العطور' : 'Tous genres') : filters.gender === 'men' ? (isAr ? 'رجالي' : 'Homme') : filters.gender === 'women' ? (isAr ? 'نسائي' : 'Femme') : 'Unisexe'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold shadow-2xs">
                {filters.minPrice} – {filters.maxPrice} MAD
              </span>
              {filters.family !== 'all' && (
                <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-300 font-semibold shadow-2xs">
                  {filters.family}
                </span>
              )}
            </div>
            <button
              onClick={onOpenFilterDrawer}
              className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
            >
              <span>{isAr ? 'تعديل المعايير...' : 'Modifier les filtres...'}</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Keyboard Shortcuts Guide */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {isAr ? 'اختصارات لوحة المفاتيح' : 'Raccourcis Clavier'}
            </span>
            <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex items-center justify-between">
                <span>{isAr ? 'تجاوز العطر' : 'Passer'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">
                  ←
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{isAr ? 'إعجاب / قلب' : 'Coup de Cœur'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">
                  →
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{isAr ? 'حفظ لوقت لاحق' : 'Sauvegarder'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">
                  ↑
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{isAr ? 'تراجع' : 'Annuler'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">
                  Ctrl + Z
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{isAr ? 'تفاصيل العطر' : 'Pyramide Olfactive'}</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">
                  Espace / I
                </kbd>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= CENTER PANEL: LARGE SWIPE CARD ================= */}
        <main className="col-span-6 flex flex-col items-center justify-center relative min-h-[580px] space-y-4">
          {/* Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
            <div className={`w-[520px] h-[520px] rounded-full bg-gradient-radial ${auraGlow} blur-3xl opacity-60 transition-colors duration-700`} />
          </div>

          {/* Tinder Quick Gender Tabs (Lucide Icons, No Emojis) */}
          <div className="w-full max-w-[420px] flex items-center justify-between gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 mb-1 z-10 shadow-2xs">
            {GENDER_TABS.map((tab) => {
              const active = filters.gender === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onUpdateFilters({ gender: tab.id })}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-[#0284c7] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <IconComp
                    size={13}
                    className={active ? 'text-[#0284c7]' : 'text-slate-400'}
                  />
                  <span>{isAr ? tab.labelAr : tab.labelFr}</span>
                </button>
              );
            })}
          </div>

          {currentProduct ? (
            <div className="relative w-full flex items-center justify-center z-10">
              {/* 2nd Card Behind (3D Depth Stack - Tinder Deck) */}
              {nextNextProduct && (
                <div className="absolute top-0 w-full max-w-[400px] h-[480px] sm:h-[520px] rounded-[32px] bg-white border border-[#E8E2D6] opacity-45 scale-[0.92] translate-y-6 rotate-[-2deg] pointer-events-none transition-all duration-300 shadow-md z-0 overflow-hidden flex flex-col justify-between p-4">
                  <div className="flex justify-between items-center opacity-50">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                      {nextNextProduct.brandLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {nextNextProduct.price} MAD
                    </span>
                  </div>
                  <div className="relative w-36 h-36 mx-auto my-auto opacity-50 overflow-hidden">
                    <Image
                      src={nextNextProduct.images[0] || '/images/placeholder-perfume.png'}
                      alt=""
                      fill
                      unoptimized={true}
                      className="object-contain mix-blend-multiply scale-[1.3]"
                    />
                  </div>
                  <div className="opacity-50">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {nextNextProduct.name}
                    </h4>
                  </div>
                </div>
              )}

              {/* 1st Card Behind (3D Depth Stack - Tinder Deck) */}
              {nextProduct && (
                <div className="absolute top-0 w-full max-w-[400px] h-[480px] sm:h-[520px] rounded-[32px] bg-white border border-[#E8E2D6] opacity-85 scale-[0.96] translate-y-3 rotate-[2deg] pointer-events-none transition-all duration-300 shadow-xl z-10 overflow-hidden flex flex-col justify-between p-4">
                  <div className="flex justify-between items-center opacity-70">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                      {nextProduct.brandLabel}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {nextProduct.price} MAD
                    </span>
                  </div>
                  <div className="relative w-44 h-44 mx-auto my-auto opacity-80 overflow-hidden">
                    <Image
                      src={nextProduct.images[0] || '/images/placeholder-perfume.png'}
                      alt=""
                      fill
                      unoptimized={true}
                      className="object-contain mix-blend-multiply scale-[1.35]"
                    />
                  </div>
                  <div className="opacity-70">
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
                      {nextProduct.subcategoryLabel}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 truncate">
                      {nextProduct.name}
                    </h4>
                  </div>
                </div>
              )}

              {/* Active Front Card */}
              <ScentMatchCard
                product={currentProduct}
                onSwipe={onSwipe}
                onOpenDetails={onOpenDetails}
                onUndo={onUndo}
                canUndo={canUndo}
                locale={locale}
                isFront={true}
              />
            </div>
          ) : (
            /* Empty Queue State */
            <div className="p-10 rounded-[32px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md shadow-xl z-10">
              <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-500 mx-auto shadow-2xs">
                <Sparkles size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {isAr ? 'اكتملت جميع عطور هذه التصفية !' : 'Vous avez exploré cette sélection !'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isAr
                  ? 'يمكنك الآن إطلاق التحليل لرؤية بصمتك العطرية، أو توسيع نطاق الفلاتر لاكتشاف المزيد.'
                  : 'Vous avez suffisamment d\'interactions pour révéler votre ADN olfactif, ou vous pouvez élargir vos filtres.'}
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={onFinishAnalysis}
                  className="w-full py-3.5 bg-[#0f172a] hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer active:scale-98"
                >
                  {isAr ? 'الكشف عن بصمتي العطرية الآن' : 'Révéler mon ADN Olfactif'}
                </button>
                <button
                  onClick={() => onUpdateFilters({ gender: 'all', family: 'all', minPrice: 250, maxPrice: 650 })}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {isAr ? 'إعادة ضبط الفلاتر' : 'Réinitialiser les filtres'}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ================= RIGHT PANEL: LIKED FRAGRANCES & DNA SUMMARY ================= */}
        <aside className="col-span-3 space-y-5 bg-white/95 dark:bg-slate-900/60 p-6 rounded-[32px] border border-[#E8E2D6] dark:border-slate-800 shadow-sm backdrop-blur-sm">
          {/* Liked Perfumes Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-emerald-500 fill-emerald-500" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  {isAr ? 'قائمة الإعجابات' : 'Coups de Cœur'}
                </span>
              </div>
              <span className="text-xs font-black text-emerald-500">
                {likedProducts.length}
              </span>
            </div>

            {likedProducts.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  {isAr ? 'لم تسجل أي إعجاب بعد' : 'Glissez vers la droite pour ajouter vos coups de cœur'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                {likedProducts.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onOpenDetails(p)}
                    className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-sky-300 cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-11 h-11 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 p-1 flex-shrink-0 border border-[#E8E2D6] dark:border-slate-700">
                        <Image
                          src={p.images[0] || '/images/placeholder-perfume.png'}
                          alt={p.name}
                          fill
                          className="object-contain mix-blend-multiply dark:mix-blend-normal p-0.5"
                          sizes="44px"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {p.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {p.brandLabel} · {p.price} MAD
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!p.inStock) return;
                          addToCart({
                            id: p.id,
                            slug: p.slug,
                            name: p.name,
                            price: p.price,
                            image: p.images[0] || '/images/placeholder-perfume.png',
                            images: p.images,
                            inStock: p.inStock
                          });
                          setAddedId(p.id);
                          setTimeout(() => setAddedId(null), 1800);
                        }}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          addedId === p.id
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 hover:text-sky-500 border-slate-200 dark:border-slate-700'
                        }`}
                        title={isAr ? "إضافة للسلة" : "Ajouter au Panier"}
                      >
                        {addedId === p.id ? <Check size={13} /> : <ShoppingBag size={13} />}
                      </button>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Scent DNA Reveal Action Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3.5 shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-sky-400" />
              <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                {isAr ? 'البصمة العطرية' : 'ADN Olfactif'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'خوارزمية الذكاء الاصطناعي تحلل اختياراتك بدقة لتكشف لك عن شخصيتك وتوصيك بأفضل العطور.'
                : 'Notre moteur analyse vos coups de cœur pour révéler votre signature olfactive sur-mesure.'}
            </p>
            <button
              onClick={onFinishAnalysis}
              disabled={!canFinish || isAnalyzing}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                canFinish
                  ? 'bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-300 hover:to-sky-500 text-white shadow-md active:scale-98'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <Sparkles size={14} />
              <span>
                {isAnalyzing
                  ? (isAr ? 'جارٍ التحليل...' : 'Analyse en cours...')
                  : (isAr ? 'كشف بصمتي العطرية' : 'Révéler mon ADN Olfactif')}
              </span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
