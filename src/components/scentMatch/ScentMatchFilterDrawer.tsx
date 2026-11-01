'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  SlidersHorizontal,
  Check,
  Sparkles,
  Compass,
  TreePine,
  Flame,
  Flower2,
  Wind,
  Zap,
  Heart,
  Users,
  User,
  Layers,
  Sparkle
} from 'lucide-react';
import { ScentMatchFilters, GenderFilter, FragranceFamily } from '@/lib/scentMatch/types';

interface ScentMatchFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ScentMatchFilters;
  onUpdateFilters: (filters: Partial<ScentMatchFilters>) => void;
  locale?: string;
  totalEligible?: number;
}

export default function ScentMatchFilterDrawer({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  locale = 'fr',
  totalEligible
}: ScentMatchFilterDrawerProps) {
  const isAr = locale === 'ar';

  const GENDERS: Array<{
    id: GenderFilter;
    labelFr: string;
    labelAr: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { id: 'all', labelFr: 'Tous les Parfums', labelAr: 'جميع العطور', icon: Users },
    { id: 'men', labelFr: 'Pour Homme', labelAr: 'عطور رجالية', icon: User },
    { id: 'women', labelFr: 'Pour Femme', labelAr: 'عطور نسائية', icon: Heart },
    { id: 'unisex', labelFr: 'Unisexe', labelAr: 'عطور للجنسين', icon: Layers }
  ];

  const FAMILIES: Array<{
    id: FragranceFamily;
    labelFr: string;
    labelAr: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    accentColor: string;
  }> = [
    { id: 'all', labelFr: 'Toutes Familles', labelAr: 'جميع العائلات', icon: Compass, accentColor: 'text-sky-500' },
    { id: 'woody', labelFr: 'Boisé & Noble', labelAr: 'خشبي ونبيل', icon: TreePine, accentColor: 'text-amber-600' },
    { id: 'oriental', labelFr: 'Oriental & Ambré', labelAr: 'شرقي وعنبري', icon: Flame, accentColor: 'text-orange-500' },
    { id: 'floral', labelFr: 'Floral Délicat', labelAr: 'زهري رقيق', icon: Flower2, accentColor: 'text-rose-500' },
    { id: 'fresh', labelFr: 'Frais & Hespéridé', labelAr: 'منعش وحمضي', icon: Wind, accentColor: 'text-cyan-500' },
    { id: 'sweet', labelFr: 'Gourmand & Sucré', labelAr: 'حلو ومخملي', icon: Sparkle, accentColor: 'text-amber-400' },
    { id: 'spicy', labelFr: 'Épicé & Vibrant', labelAr: 'متبل وجريء', icon: Zap, accentColor: 'text-red-500' }
  ];

  const BUDGETS = [
    { label: 'Tous Prix', min: 250, max: 650 },
    { label: '< 300 MAD', min: 250, max: 300 },
    { label: '300 – 400 MAD', min: 300, max: 400 },
    { label: '> 400 MAD', min: 400, max: 650 }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: isAr ? -380 : 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: isAr ? -380 : 380, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="relative w-full max-w-md bg-white dark:bg-[#0f172a] h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white dark:from-slate-900/40 dark:to-[#0f172a]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/70 border border-sky-100 dark:border-sky-800/80 flex items-center justify-center text-sky-500 shadow-2xs">
                <SlidersHorizontal size={18} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-500 block">
                  Atelier NAY
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {isAr ? 'تخصيص الفلاتر الذكية' : 'Filtres de Découverte'}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Controls */}
          <div className="p-6 overflow-y-auto space-y-7 flex-1">
            {/* GENDER */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {isAr ? 'الفئة والأسلوب' : 'Genre & Style'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => {
                  const active = filters.gender === g.id;
                  const IconComp = g.icon;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => onUpdateFilters({ gender: g.id })}
                      className={`p-3 rounded-2xl text-xs font-bold transition-all border text-left flex items-center justify-between cursor-pointer ${
                        active
                          ? 'border-sky-500 bg-sky-50/80 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComp size={15} className={active ? 'text-sky-500' : 'text-slate-400'} />
                        <span>{isAr ? g.labelAr : g.labelFr}</span>
                      </div>
                      {active && <Check size={14} className="text-sky-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FRAGRANCE FAMILIES */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {isAr ? 'العائلة العطرية المفضلة' : 'Univers Olfactif Préféré'}
              </label>
              <div className="flex flex-wrap gap-2">
                {FAMILIES.map((f) => {
                  const active = filters.family === f.id;
                  const IconComp = f.icon;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onUpdateFilters({ family: f.id })}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-sky-500 dark:border-sky-500 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <IconComp
                        size={15}
                        className={active ? 'text-white' : f.accentColor}
                      />
                      <span>{isAr ? f.labelAr : f.labelFr}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BUDGET */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {isAr ? 'الميزانية (درهم مغربي)' : 'Budget (MAD)'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BUDGETS.map((b, i) => {
                  const active = filters.minPrice === b.min && filters.maxPrice === b.max;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onUpdateFilters({ minPrice: b.min, maxPrice: b.max })}
                      className={`p-3 rounded-2xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        active
                          ? 'border-sky-500 bg-sky-50/80 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LIVE COUNT BADGE (Displays real database count of eligible store perfumes) */}
            {typeof totalEligible === 'number' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 to-slate-50 dark:from-sky-950/30 dark:to-slate-900/60 border border-sky-100 dark:border-sky-900/40 flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {isAr ? 'عطور المتجر المتوافقة مع اختياراتك :' : 'Parfums de la boutique correspondants :'}
                  </span>
                </div>
                <span className="font-black text-sky-600 dark:text-sky-400 text-sm">
                  {totalEligible} {isAr ? 'عطر' : 'parfums'}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-slate-900 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Sparkles size={16} />
              <span>{isAr ? 'تطبيق والبدء في الاكتشاف' : 'Appliquer & Découvrir'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
