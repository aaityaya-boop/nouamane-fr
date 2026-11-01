'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Heart,
  Bookmark,
  X,
  Info,
  Users,
  Compass,
  Check,
  User,
  Layers
} from 'lucide-react';
import { QueueProduct, ScentMatchFilters, SwipeAction, GenderFilter } from '@/lib/scentMatch/types';
import ScentMatchCard from './ScentMatchCard';

interface ScentMatchMobileProps {
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

export default function ScentMatchMobile({
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
}: ScentMatchMobileProps) {
  const isAr = locale === 'ar';
  const totalSwipes = likedProducts.length + passedProducts.length;
  const progressPercent = Math.min(100, Math.round((totalSwipes / recommendedSwipes) * 100));
  const canFinish = totalSwipes >= minSwipes;

  const nextProduct = queue[currentIndex + 1] || null;
  const nextNextProduct = queue[currentIndex + 2] || null;

  // Active filter count (excluding default gender='all')
  const activeCustomFiltersCount =
    (filters.family !== 'all' ? 1 : 0) +
    (filters.minPrice !== 250 || filters.maxPrice !== 650 ? 1 : 0);

  const GENDER_TABS: Array<{
    id: GenderFilter;
    labelFr: string;
    labelAr: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { id: 'all', labelFr: 'Tous', labelAr: 'الكل', icon: Sparkles },
    { id: 'men', labelFr: 'Homme', labelAr: 'رجال', icon: User },
    { id: 'women', labelFr: 'Femme', labelAr: 'نساء', icon: Heart },
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

  return (
    <div className="w-full flex flex-col justify-between min-h-[calc(100vh-60px)] pt-[62px] pb-[85px] px-3 overflow-hidden select-none relative">
      {/* Dynamic Ambient Background Aura */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <div className={`w-[450px] h-[450px] rounded-full bg-gradient-radial ${auraGlow} blur-3xl opacity-70 transition-colors duration-700`} />
      </div>

      {/* TINDER-STYLE TOP DISCOVERY & FILTER BAR */}
      <div className="space-y-2.5 mb-2 z-20 relative">
        {/* Row 1: Brand Identifier & Quick Mode Shortcuts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
              NAY SCENT MATCH
            </span>
            {typeof totalEligible === 'number' && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                · {totalEligible} {isAr ? 'عطر' : 'parfums'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Friend Duo Button */}
            <button
              onClick={onOpenFriendMatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10.5px] font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
              title="Duo Amis"
            >
              <Users size={13} className="text-sky-500" />
              <span>{isAr ? 'دعوَة صديق' : 'Duo'}</span>
            </button>

            {/* Filter Drawer Trigger with Active Count */}
            <button
              onClick={onOpenFilterDrawer}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-2xs border cursor-pointer active:scale-95 ${
                activeCustomFiltersCount > 0
                  ? 'bg-sky-50 dark:bg-sky-950 border-sky-300 text-sky-600 dark:text-sky-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <SlidersHorizontal size={12} />
              <span>{isAr ? 'فلاتر' : 'Filtres'}</span>
              {activeCustomFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-black flex items-center justify-center">
                  {activeCustomFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Tinder Quick Gender Filter Pills (Lucide Icons, No Emojis) */}
        <div className="flex items-center justify-between gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
          {GENDER_TABS.map((tab) => {
            const active = filters.gender === tab.id;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onUpdateFilters({ gender: tab.id })}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-[#0284c7] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <IconComp
                  size={12}
                  className={active ? 'text-[#0284c7]' : 'text-slate-400'}
                />
                <span>{isAr ? tab.labelAr : tab.labelFr}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Progress Bar */}
        <div className="flex items-center gap-2.5 px-0.5">
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 shadow-2xs"
            />
          </div>
          <span className="text-[10px] font-black text-sky-500 whitespace-nowrap">
            {totalSwipes} / {recommendedSwipes}
          </span>
        </div>
      </div>

      {/* FLOATING UNLOCK BUTTON IF READY */}
      {canFinish && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-1.5 z-20 relative"
        >
          <button
            onClick={onFinishAnalysis}
            disabled={isAnalyzing}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <Sparkles size={15} />
            <span>
              {isAnalyzing
                ? (isAr ? 'جارٍ تحليل بصمتك...' : 'Analyse en cours...')
                : (isAr ? 'كشف بصمتي العطرية الآن' : 'Révéler mon ADN Olfactif')}
            </span>
          </button>
        </motion.div>
      )}

      {/* SWIPE CARD CONTAINER WITH 3D DECK DEPTH */}
      <div className="flex-1 flex items-center justify-center relative w-full my-auto z-10">
        {currentProduct ? (
          <div className="relative w-full flex items-center justify-center">
            {/* 2nd Card Behind (3D Stack Depth - Tinder Deck) */}
            {nextNextProduct && (
              <div className="absolute top-0 w-full max-w-[400px] h-[480px] sm:h-[520px] rounded-[32px] bg-white border border-[#E8E2D6] opacity-45 scale-[0.92] translate-y-6 rotate-[-2deg] pointer-events-none transition-all duration-300 shadow-md z-0 overflow-hidden flex flex-col justify-between p-4">
                <div className="flex justify-between items-center opacity-50">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">{nextNextProduct.brandLabel}</span>
                  <span className="text-xs font-bold text-slate-800">{nextNextProduct.price} MAD</span>
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
                  <h4 className="text-xs font-bold text-slate-800 truncate">{nextNextProduct.name}</h4>
                </div>
              </div>
            )}

            {/* 1st Card Behind (3D Stack Depth - Tinder Deck) */}
            {nextProduct && (
              <div className="absolute top-0 w-full max-w-[400px] h-[480px] sm:h-[520px] rounded-[32px] bg-white border border-[#E8E2D6] opacity-85 scale-[0.96] translate-y-3 rotate-[2deg] pointer-events-none transition-all duration-300 shadow-xl z-10 overflow-hidden flex flex-col justify-between p-4">
                <div className="flex justify-between items-center opacity-70">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">{nextProduct.brandLabel}</span>
                  <span className="text-xs font-black text-slate-900">{nextProduct.price} MAD</span>
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
                  <h4 className="text-sm font-black text-slate-900 truncate">{nextProduct.name}</h4>
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
          <div className="p-8 rounded-[32px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-sm shadow-xl z-10">
            <div className="w-14 h-14 rounded-full bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-500 mx-auto shadow-2xs">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isAr ? 'انتهت عطور هذه التصفية' : 'Fin de la sélection'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr
                ? 'يمكنك الآن إطلاق التحليل لرؤية بصمتك العطرية أو تغيير الفلاتر.'
                : 'Vous avez exploré tous les parfums de cette sélection. Révélez votre ADN ou élargissez vos filtres.'}
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={onFinishAnalysis}
                className="w-full py-3 bg-[#0f172a] hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md cursor-pointer transition-all active:scale-98"
              >
                {isAr ? 'الكشف عن بصمتي' : 'Révéler mon ADN'}
              </button>
              <button
                onClick={() => onUpdateFilters({ gender: 'all', family: 'all', minPrice: 250, maxPrice: 650 })}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {isAr ? 'إعادة ضبط الفلاتر' : 'Réinitialiser les filtres'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
