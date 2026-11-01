'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRightLeft,
  Check,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  Flame,
  Clock,
  Wind,
  Star,
  Sun,
  Moon,
  Trash2,
  ExternalLink,
  Layers,
  ChevronRight,
  ShieldCheck,
  Feather,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { useComparison } from '@/context/ComparisonContext';
import { formatMAD, isProductInStock, type Product } from '@/lib/products';
import { translatePerfumeNote } from '@/lib/perfumeNotes';
import { getFragranticaData, getPerfumerVerdict, type FragranticaData } from '@/lib/fragranticaData';

export default function ComparisonModal() {
  const { comparedProducts, isModalOpen, closeModal, removeFromCompare, clearCompare } = useComparison();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const isAr = locale === 'ar';

  // Mobile dedicated tab state: 'split' (side-by-side) or index of product (0, 1, 2)
  const [mobileTab, setMobileTab] = useState<'split' | number>('split');

  // Lock body scroll when open and handle Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, closeModal]);

  // Precompute Fragrantica data for each compared product
  const fragranticaMap = useMemo(() => {
    const map = new Map<string, FragranticaData>();
    for (const p of comparedProducts) {
      map.set(p.slug, getFragranticaData(p));
    }
    return map;
  }, [comparedProducts]);

  // Handcrafted perfumer's comparative verdict
  const perfumerVerdict = useMemo(() => {
    return getPerfumerVerdict(comparedProducts, isAr);
  }, [comparedProducts, isAr]);

  if (!isModalOpen) return null;

  const handleBuyNow = (product: Product) => {
    if (!isProductInStock(product)) return;
    closeModal();
    const defaultSize = product.sizes[0]?.label || '100ml';
    const query = new URLSearchParams({
      buyNow: '1',
      slug: product.slug,
      qty: '1',
      size: defaultSize,
    });
    router.push(`/${locale}/checkout?${query.toString()}`);
  };

  const colCount = Math.max(1, comparedProducts.length);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Soft Luxury Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-[#0c1017]/65 backdrop-blur-md"
        />

        {/* Modal Window — NAY Haute Parfumerie Atelier Theme */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-6xl max-h-[92vh] bg-[#FAF9F6] text-[#1A1A1A] rounded-3xl shadow-[0_25px_80px_rgba(15,23,42,0.22)] border border-[#E5E0D8] flex flex-col overflow-hidden z-10"
        >
          {/* 1. ATELIER HEADER BAR */}
          <div className="px-5 sm:px-8 py-3.5 sm:py-4 border-b border-[#E5E0D8] bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284c7] flex items-center justify-center shadow-xs shrink-0">
                <Compass size={20} strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="heading-font text-base sm:text-xl font-black text-[#1A1A1A] tracking-tight">
                    {isAr ? 'مقارن العطور والتحليل الشمي' : 'Cabinet d’Analyses Olfactives'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F0FDF4] text-[#15803d] border border-[#BBF7D0]">
                    <Sparkles size={10} /> {isAr ? 'بيانات Fragrantica.fr' : 'Certifié Fragrantica.fr'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-[12px] text-[#6B7280] flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-[#1A1A1A]">
                    {isAr
                      ? `${comparedProducts.length} عطور في المقارنة`
                      : `${comparedProducts.length} parfum${comparedProducts.length > 1 ? 's' : ''} en comparaison (max. 3)`}
                  </span>
                  <span className="text-[#D1D5DB]">•</span>
                  <span className="text-[#0284c7] font-medium hidden sm:inline">
                    {isAr ? 'الأكوردات الرسمية، الثبات، والفوحان' : 'Accords officiels, Tenue & Sillage authentiques'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {comparedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={clearCompare}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-[#6B7280] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition"
                  title={isAr ? 'تفريغ المقارنة' : 'Vider la sélection'}
                >
                  <Trash2 size={13} />
                  <span>{isAr ? 'تفريغ' : 'Vider'}</span>
                </button>
              )}
              <button
                onClick={closeModal}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-[#E5E0D8] text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] flex items-center justify-center transition active:scale-95 shadow-xs"
                aria-label={isAr ? 'إغلاق المقارنة' : 'Fermer le comparateur'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 2. UNIQUE MOBILE SEGMENTED CONTROL (Only visible on small screens) */}
          {comparedProducts.length > 1 && (
            <div className="sm:hidden px-3 py-2 bg-white border-b border-[#E5E0D8] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setMobileTab('split')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition flex items-center gap-1 ${
                  mobileTab === 'split'
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
                }`}
              >
                <ArrowRightLeft size={12} />
                <span>{isAr ? 'مقارنة جنباً لجنب' : 'Face-à-Face'}</span>
              </button>

              {comparedProducts.map((p, idx) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setMobileTab(idx)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition line-clamp-1 max-w-[150px] ${
                    mobileTab === idx
                      ? 'bg-[#0ea5e9] text-white shadow-xs'
                      : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
                  }`}
                >
                  <span>{idx + 1}. {p.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          )}

          {/* 3. MODAL MAIN BODY */}
          <div className="overflow-x-auto overflow-y-auto p-3 sm:p-6 md:p-8 space-y-6 sm:space-y-7 lux-scrollbar">
            {comparedProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-[#E5E0D8]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284c7]">
                  <Compass size={28} />
                </div>
                <p className="text-[16px] font-bold text-[#1A1A1A] mb-1">
                  {isAr ? 'لا توجد عطور محددة للمقارنة' : 'Aucun parfum sélectionné pour la comparaison.'}
                </p>
                <p className="text-[12px] text-[#6B7280] max-w-sm mx-auto mb-5">
                  {isAr
                    ? 'اختر حتى 3 عطور من الكتالوج لمشاهدة تحليل الأكوردات والثبات على غرار Fragrantica.'
                    : "Sélectionnez jusqu'à 3 parfums depuis la boutique pour comparer leurs accords olfactifs, leur tenue et leur sillage."}
                </p>
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 rounded-xl text-[12px] font-bold bg-[#1A1A1A] hover:bg-black text-white transition active:scale-95 shadow-md"
                >
                  {isAr ? 'تصفح الكتالوج' : 'Explorer le catalogue'}
                </button>
              </div>
            ) : (
              <div className={`${mobileTab === 'split' ? 'min-w-[560px] sm:min-w-0' : 'w-full'} space-y-6 sm:space-y-7`}>
                
                {/* A. PRODUCT FLACON SHOWCASE CARDS */}
                <div
                  className={`grid gap-4 sm:gap-5 ${
                    mobileTab !== 'split'
                      ? 'grid-cols-1'
                      : colCount === 1
                      ? 'grid-cols-1 max-w-md mx-auto'
                      : colCount === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-3'
                  }`}
                >
                  {comparedProducts
                    .filter((_, idx) => mobileTab === 'split' || mobileTab === idx)
                    .map((p, idx) => {
                      const inStock = isProductInStock(p);
                      const fragData = fragranticaMap.get(p.slug);
                      const realIndex = mobileTab === 'split' ? idx : (typeof mobileTab === 'number' ? mobileTab : idx);

                      return (
                        <div
                          key={p.slug}
                          className="relative bg-white border border-[#E5E0D8] rounded-3xl p-4 sm:p-6 flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-[#0ea5e9]/50 transition-all group"
                        >
                          {/* Remove X Button */}
                          <button
                            onClick={() => removeFromCompare(p.slug)}
                            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#F3F4F6] text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition flex items-center justify-center text-[10px]"
                            aria-label={`Retirer ${p.name}`}
                            title={isAr ? `إزالة ${p.name}` : `Retirer ${p.name}`}
                          >
                            <X size={13} />
                          </button>

                          {/* Top Badge: Maison & Index */}
                          <div className="self-start mb-1 flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0ea5e9] bg-[#F0F9FF] px-2.5 py-0.5 rounded-full border border-[#BAE6FD]">
                              {isAr ? `عطر ${String.fromCharCode(65 + realIndex)}` : `Flacon ${String.fromCharCode(65 + realIndex)}`}
                            </span>
                          </div>

                          {/* High-Resolution Flacon Pedestal */}
                          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-b from-[#FAF9F6] to-[#F3F4F6] p-2 overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                            <Image
                              src={p.images[0] || '/placeholder.jpg'}
                              alt={p.name}
                              fill
                              className="object-contain p-2"
                              sizes="(max-width: 768px) 150px, 180px"
                            />
                          </div>

                          {/* Brand & Name */}
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B7280] mb-0.5">
                            {p.brandLabel}
                          </span>
                          <Link
                            href={`/${locale}/product/${p.slug}`}
                            onClick={closeModal}
                            className="text-[14px] sm:text-[16px] font-bold text-[#1A1A1A] hover:text-[#0ea5e9] transition line-clamp-1 group-hover:underline"
                          >
                            {fragData?.fragranticaName || p.name}
                          </Link>

                          {/* Character tags */}
                          {fragData?.characterTags && (
                            <div className="flex flex-wrap justify-center gap-1 mt-2">
                              {(isAr ? fragData.characterTagsAr || fragData.characterTags : fragData.characterTags).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Price & Stock Pill */}
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <span className="text-[17px] sm:text-[18px] font-black text-[#1A1A1A]">
                              {formatMAD(p.price)}
                            </span>
                            {inStock ? (
                              <span className="inline-flex items-center gap-1 text-[#15803d] text-[10px] font-bold bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse" />
                                {isAr ? 'متوفر' : 'En stock'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 text-[10px] font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                {isAr ? 'غير متوفر' : 'Rupture'}
                              </span>
                            )}
                          </div>

                          {/* Signature Noir Obsidienne CTA Button */}
                          <button
                            type="button"
                            onClick={() => handleBuyNow(p)}
                            disabled={!inStock}
                            className={`mt-4 w-full py-2.5 px-3 rounded-xl text-[11px] sm:text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-sm ${
                              inStock
                                ? 'bg-[#1A1A1A] hover:bg-black text-white cursor-pointer shadow-black/10'
                                : 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border border-[#E5E7EB]'
                            }`}
                          >
                            <ShoppingBag size={14} strokeWidth={2.2} className="shrink-0" />
                            <span>{inStock ? (isAr ? 'شراء الآن' : 'Acheter maintenant') : (isAr ? 'نفذ المخزون' : 'Rupture')}</span>
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* B. LE VERDICT DU PARFUMEUR — HAND-CRAFTED EDITORIAL SYNTHESIS */}
                {perfumerVerdict.verdict && (
                  <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FBF8F1] border border-[#E8DFD0] rounded-3xl p-5 sm:p-6 shadow-[0_4px_25px_rgba(180,140,80,0.06)] relative overflow-hidden">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] flex items-center justify-center shrink-0 shadow-xs">
                        <Feather size={18} strokeWidth={2.2} />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                            {isAr ? 'خلاصة خبير العطور' : 'Le Verdict du Nez'}
                          </span>
                          <h3 className="heading-font text-[13px] sm:text-[15px] font-black text-[#1A1A1A]">
                            {perfumerVerdict.headline}
                          </h3>
                        </div>
                        <p className="text-[12px] sm:text-[13px] text-[#4B5563] leading-relaxed">
                          {perfumerVerdict.verdict}
                        </p>
                        <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#0284c7]">
                          <Sparkles size={12} />
                          <span>{perfumerVerdict.keyDifferentiator}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* C. ACCORDS PRINCIPAUX (FRAGRANTICA SWATCH PALETTE) */}
                <div className="bg-white border border-[#E5E0D8] rounded-3xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4 border-b border-[#F3F4F6] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                        <Flame size={16} />
                      </div>
                      <div>
                        <h3 className="text-[13px] sm:text-[15px] font-black uppercase tracking-wider text-[#1A1A1A]">
                          {isAr ? 'الأكوردات الرئيسية (ACCORDS PRINCIPAUX)' : 'Nuancier des Accords Principaux'}
                        </h3>
                        <p className="text-[11px] text-[#6B7280]">
                          {isAr
                            ? 'النسبة المئوية لبروز الروائح بناءً على تصنيف مجتمع الخبراء الدولي'
                            : 'Dominance relative des accords olfactifs certifiés par la communauté Fragrantica'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`grid gap-5 sm:gap-6 ${
                      mobileTab !== 'split'
                        ? 'grid-cols-1'
                        : colCount === 1
                        ? 'grid-cols-1'
                        : colCount === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                    }`}
                  >
                    {comparedProducts
                      .filter((_, idx) => mobileTab === 'split' || mobileTab === idx)
                      .map((p) => {
                        const fragData = fragranticaMap.get(p.slug);
                        const accords = fragData?.accords || [];

                        return (
                          <div
                            key={p.slug}
                            className="bg-[#FAF9F6] border border-[#EAE6DE] rounded-2xl p-4 sm:p-5 flex flex-col justify-start"
                          >
                            <div className="text-[12px] font-extrabold text-[#1A1A1A] uppercase tracking-wider mb-3">
                              {p.name}
                            </div>

                            {accords.length === 0 ? (
                              <div className="text-center py-6 text-[12px] text-[#9CA3AF]">
                                {isAr ? 'الأكوردات قيد المعالجة' : 'Accords en cours de calcul'}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {accords.map((accord) => (
                                  <div key={accord.name} className="relative w-full">
                                    <div
                                      className="h-8 rounded-lg flex items-center justify-between px-3 text-[12px] sm:text-[13px] font-bold shadow-xs transition-transform hover:scale-[1.01] border border-black/5"
                                      style={{
                                        width: `${accord.percentage}%`,
                                        minWidth: '120px',
                                        backgroundColor: accord.color,
                                        color: accord.textColor,
                                      }}
                                      title={`${accord.name}: ${accord.percentage}%`}
                                    >
                                      <span className="truncate pr-1 whitespace-nowrap">
                                        {isAr ? accord.nameAr || accord.name : accord.name}
                                      </span>
                                      <span className="text-[10px] font-black opacity-85 shrink-0">
                                        {accord.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* D. PERFORMANCE & EVALUATION (TÉNACITÉ · SILLAGE · VOTE) */}
                <div className="bg-white border border-[#E5E0D8] rounded-3xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4 border-b border-[#F3F4F6] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-[#0284c7] flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                      <div>
                        <h3 className="text-[13px] sm:text-[15px] font-black uppercase tracking-wider text-[#1A1A1A]">
                          {isAr ? 'الأداء والثبات والفوحان (PERFORMANCE)' : 'Performance, Longévité & Sillage'}
                        </h3>
                        <p className="text-[11px] text-[#6B7280]">
                          {isAr
                            ? 'إحصائيات مجتمعية حقيقية حول عدد ساعات الثبات وقوة الانتشار'
                            : 'Scores réels mesurés sur des milliers d’utilisateurs vérifiés'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`grid gap-5 sm:gap-6 ${
                      mobileTab !== 'split'
                        ? 'grid-cols-1'
                        : colCount === 1
                        ? 'grid-cols-1'
                        : colCount === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                    }`}
                  >
                    {comparedProducts
                      .filter((_, idx) => mobileTab === 'split' || mobileTab === idx)
                      .map((p) => {
                        const fragData = fragranticaMap.get(p.slug);
                        const perf = fragData?.performance;

                        return (
                          <div
                            key={p.slug}
                            className="bg-[#FAF9F6] border border-[#EAE6DE] rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
                          >
                            <div className="text-[12px] font-extrabold text-[#1A1A1A] uppercase tracking-wider mb-1">
                              {p.name}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              {/* 1: Ténacité */}
                              <div className="bg-white border border-[#E5E0D8] rounded-xl p-3 flex flex-col justify-between shadow-xs">
                                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                                  {isAr ? 'الثبات' : 'Ténacité'}
                                </span>
                                <div className="my-1.5 font-bold text-[12px] sm:text-[13px] text-[#1A1A1A] capitalize leading-tight">
                                  {isAr ? perf?.longevityAr || perf?.longevity : perf?.longevity}
                                </div>
                                <span className="text-[9px] text-[#9CA3AF]">
                                  {perf?.longevityVotes}
                                </span>
                              </div>

                              {/* 2: Sillage */}
                              <div className="bg-white border border-[#E5E0D8] rounded-xl p-3 flex flex-col justify-between shadow-xs">
                                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                                  {isAr ? 'الفوحان' : 'Sillage'}
                                </span>
                                <div className="my-1.5 font-bold text-[12px] sm:text-[13px] text-[#1A1A1A] capitalize leading-tight">
                                  {isAr ? perf?.sillageAr || perf?.sillage : perf?.sillage}
                                </div>
                                <span className="text-[9px] text-[#9CA3AF]">
                                  {perf?.sillageVotes}
                                </span>
                              </div>

                              {/* 3: Note / Vote */}
                              <div className="bg-[#FFFDF4] border border-[#FDE68A] rounded-xl p-3 flex flex-col justify-between shadow-xs">
                                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#B45309]">
                                  {isAr ? 'التقييم' : 'Vote'}
                                </span>
                                <div className="my-1.5 font-black text-[15px] sm:text-[16px] text-[#B45309] flex items-center justify-center gap-1">
                                  <Star size={13} fill="currentColor" />
                                  <span>{perf?.rating.toFixed(2)}</span>
                                </div>
                                <span className="text-[9px] text-[#9CA3AF]">
                                  {perf?.ratingVotes}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* E. SAISONNALITÉ & MOMENT D'USAGE */}
                <div className="bg-white border border-[#E5E0D8] rounded-3xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4 border-b border-[#F3F4F6] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                        <Sun size={16} />
                      </div>
                      <div>
                        <h3 className="text-[13px] sm:text-[15px] font-black uppercase tracking-wider text-[#1A1A1A]">
                          {isAr ? 'الفصول ومناسبات الاستخدام' : "Saison Idéale & Moment d'Usage"}
                        </h3>
                        <p className="text-[11px] text-[#6B7280]">
                          {isAr
                            ? 'أفضل فصول الارتداء وتوزيع الأداء بين النهار والليل'
                            : 'Profil climatique recommandé et répartition optimale Jour / Nuit'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`grid gap-5 sm:gap-6 ${
                      mobileTab !== 'split'
                        ? 'grid-cols-1'
                        : colCount === 1
                        ? 'grid-cols-1'
                        : colCount === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                    }`}
                  >
                    {comparedProducts
                      .filter((_, idx) => mobileTab === 'split' || mobileTab === idx)
                      .map((p) => {
                        const fragData = fragranticaMap.get(p.slug);
                        const seasonality = fragData?.seasonality;

                        return (
                          <div
                            key={p.slug}
                            className="bg-[#FAF9F6] border border-[#EAE6DE] rounded-2xl p-4 sm:p-5 space-y-4"
                          >
                            <div className="text-[12px] font-extrabold text-[#1A1A1A] uppercase tracking-wider">
                              {p.name}
                            </div>

                            {/* Seasons row */}
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#6B7280] block mb-2">
                                {isAr ? 'الفصول الملائمة' : 'Saisons optimales'}
                              </span>
                              <div className="grid grid-cols-4 gap-1.5 text-center">
                                {seasonality?.seasons.map((s) => (
                                  <div
                                    key={s.name}
                                    className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center transition shadow-xs ${
                                      s.isTop
                                        ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E] font-black'
                                        : 'bg-white border-[#E5E0D8] text-[#6B7280]'
                                    }`}
                                  >
                                    <span>{isAr ? s.nameAr : s.name}</span>
                                    <span className="text-[9px] opacity-80 font-semibold mt-0.5">
                                      {s.percentage}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Day vs Night distribution bar */}
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-[#6B7280] mb-1.5">
                                <span className="flex items-center gap-1 text-[#B45309]">
                                  <Sun size={13} /> {isAr ? 'نهاراً' : 'Jour'} {seasonality?.dayPercentage}%
                                </span>
                                <span className="flex items-center gap-1 text-[#4338CA]">
                                  <Moon size={13} /> {isAr ? 'ليلاً' : 'Nuit'} {seasonality?.nightPercentage}%
                                </span>
                              </div>
                              <div className="w-full h-3 rounded-full bg-white overflow-hidden flex border border-[#E5E0D8] p-0.5 shadow-inner">
                                <div
                                  style={{ width: `${seasonality?.dayPercentage || 50}%` }}
                                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                                  title={`Jour: ${seasonality?.dayPercentage}%`}
                                />
                                <div
                                  style={{ width: `${seasonality?.nightPercentage || 50}%` }}
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                  title={`Nuit: ${seasonality?.nightPercentage}%`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* F. PYRAMIDE OLFACTIVE (NOTES BOTANIQUES EN BADGES ÉLÉGANTS) */}
                <div className="bg-white border border-[#E5E0D8] rounded-3xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4 border-b border-[#F3F4F6] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                        <Layers size={16} />
                      </div>
                      <div>
                        <h3 className="text-[13px] sm:text-[15px] font-black uppercase tracking-wider text-[#1A1A1A]">
                          {isAr ? 'الهرم العطري والمكونات' : 'Pyramide Olfactive Détaillée'}
                        </h3>
                        <p className="text-[11px] text-[#6B7280]">
                          {isAr
                            ? 'المكونات العطرية المقسمة بين الافتتاحية والقلب والقاعدة'
                            : 'Évolution de la fragrance : Envolée de tête, Cœur de caractère et Fond de sillage'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`grid gap-5 sm:gap-6 ${
                      mobileTab !== 'split'
                        ? 'grid-cols-1'
                        : colCount === 1
                        ? 'grid-cols-1'
                        : colCount === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                    }`}
                  >
                    {comparedProducts
                      .filter((_, idx) => mobileTab === 'split' || mobileTab === idx)
                      .map((p) => {
                        const topNotes = p.notes?.top || [];
                        const heartNotes = p.notes?.heart || [];
                        const baseNotes = p.notes?.base || [];

                        return (
                          <div
                            key={p.slug}
                            className="bg-[#FAF9F6] border border-[#EAE6DE] rounded-2xl p-4 sm:p-5 space-y-4"
                          >
                            <div className="text-[12px] font-extrabold text-[#1A1A1A] uppercase tracking-wider">
                              {p.name}
                            </div>

                            {/* Notes de tête */}
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0284c7] flex items-center gap-1.5 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                                {isAr ? 'افتتاحية العطر (Notes de tête)' : 'Notes de tête'}
                              </span>
                              {topNotes.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {topNotes.map((note) => (
                                    <span
                                      key={note}
                                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-[#0369a1] border border-[#BAE6FD] shadow-xs"
                                    >
                                      {translatePerfumeNote(note, locale as any)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#9CA3AF]">—</span>
                              )}
                            </div>

                            {/* Notes de cœur */}
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B45309] flex items-center gap-1.5 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
                                {isAr ? 'قلب العطر (Notes de cœur)' : 'Notes de cœur'}
                              </span>
                              {heartNotes.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {heartNotes.map((note) => (
                                    <span
                                      key={note}
                                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-[#92400E] border border-[#FDE68A] shadow-xs"
                                    >
                                      {translatePerfumeNote(note, locale as any)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#9CA3AF]">—</span>
                              )}
                            </div>

                            {/* Notes de fond */}
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7C2D12] flex items-center gap-1.5 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#7C2D12]" />
                                {isAr ? 'قاعدة العطر (Notes de fond)' : 'Notes de fond'}
                              </span>
                              {baseNotes.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {baseNotes.map((note) => (
                                    <span
                                      key={note}
                                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-[#78350F] border border-[#FED7AA] shadow-xs"
                                    >
                                      {translatePerfumeNote(note, locale as any)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#9CA3AF]">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* G. SPÉCIFICATIONS ET GARANTIES NAY */}
                <div className="bg-white border border-[#E5E0D8] rounded-3xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4 border-b border-[#F3F4F6] pb-3">
                    <h3 className="text-[13px] sm:text-[15px] font-black uppercase tracking-wider text-[#1A1A1A]">
                      {isAr ? 'المواصفات وضمانات المتجر' : 'Spécifications & Détails du Flacon'}
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px] sm:text-[13px] border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-[#6B7280] bg-[#FAF9F6] w-36 sm:w-44">
                            {isAr ? 'الماركة' : 'Maison'}
                          </td>
                          {comparedProducts
                            .filter((_, idx) => mobileTab === 'split' || mobileTab === idx)
                            .map((p) => (
                              <td key={p.slug} className="py-2.5 px-3 font-bold text-[#1A1A1A]">
                                {p.brandLabel}
                              </td>
                            ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-[#6B7280] bg-[#FAF9F6]">
                            {isAr ? 'الفئة / الجنس' : 'Genre'}
                          </td>
                          {comparedProducts
                            .filter((_, idx) => mobileTab === 'split' || mobileTab === idx)
                            .map((p) => (
                              <td key={p.slug} className="py-2.5 px-3 capitalize text-[#374151]">
                                {p.gender === 'women'
                                  ? (isAr ? 'نسائي' : 'Femme')
                                  : p.gender === 'men'
                                  ? (isAr ? 'رجالي' : 'Homme')
                                  : (isAr ? 'للجنسين / مختلط' : 'Mixte / Unisexe')}
                              </td>
                            ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-[#6B7280] bg-[#FAF9F6]">
                            {isAr ? 'العائلة العطرية' : 'Famille olfactive'}
                          </td>
                          {comparedProducts
                            .filter((_, idx) => mobileTab === 'split' || mobileTab === idx)
                            .map((p) => (
                              <td key={p.slug} className="py-2.5 px-3 capitalize text-[#0284c7] font-bold">
                                {p.subcategoryLabel || p.subcategory || '—'}
                              </td>
                            ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-[#6B7280] bg-[#FAF9F6]">
                            {isAr ? 'الأحجام المتاحة' : 'Contenance'}
                          </td>
                          {comparedProducts
                            .filter((_, idx) => mobileTab === 'split' || mobileTab === idx)
                            .map((p) => (
                              <td key={p.slug} className="py-2.5 px-3 text-[#374151]">
                                {p.sizes && p.sizes.length > 0
                                  ? p.sizes.map((s) => s.label).join(', ')
                                  : '100ml'}
                              </td>
                            ))}
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-[#6B7280] bg-[#FAF9F6]">
                            {isAr ? 'الأصالة' : 'Authenticité'}
                          </td>
                          {comparedProducts
                            .filter((_, idx) => mobileTab === 'split' || mobileTab === idx)
                            .map((p) => (
                              <td key={p.slug} className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1.5 text-[#15803d] font-bold text-[11px]">
                                  <ShieldCheck size={15} /> {isAr ? 'تيستر أصلي 100%' : 'Testeur Authentique 100%'}
                                </span>
                              </td>
                            ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. ATELIER FOOTER BAR */}
          <div className="px-5 sm:px-8 py-3.5 border-t border-[#E5E0D8] bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 text-[11px] text-[#6B7280]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#15803d]" />
              <span>
                {isAr
                  ? 'بيانات التحليل مستوحاة ومدققة عبر مجتمع fragrantica.fr'
                  : 'Données certifiées issues de la base analytique Fragrantica.fr'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-[#1A1A1A] hover:bg-[#F3F4F6] transition border border-[#E5E0D8] font-bold text-[11px]"
              >
                {isAr ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
