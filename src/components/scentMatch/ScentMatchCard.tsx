'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  Heart,
  X,
  Star,
  Info,
  RotateCcw,
  ShoppingBag,
  Check,
  Sparkles
} from 'lucide-react';
import { QueueProduct, SwipeAction } from '@/lib/scentMatch/types';
import { useCart } from '@/context/CartContext';

interface ScentMatchCardProps {
  product: QueueProduct;
  onSwipe: (action: SwipeAction) => void;
  onOpenDetails: (product: QueueProduct) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isFront?: boolean;
  locale?: string;
}

export default function ScentMatchCard({
  product,
  onSwipe,
  onOpenDetails,
  onUndo,
  canUndo = false,
  isFront = true,
  locale = 'fr'
}: ScentMatchCardProps) {
  const isAr = locale === 'ar';
  const { addToCart } = useCart();
  const [isSaved, setIsSaved] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Fallback image management
  const fallbackImg = '/images/flacon_dior_homme_intense.png';
  const initialImg = product.images?.[0] && product.images[0].trim() !== '' ? product.images[0] : fallbackImg;
  const [imgSrc, setImgSrc] = useState(initialImg);

  useEffect(() => {
    if (product.images?.[0] && product.images[0].trim() !== '') {
      setImgSrc(product.images[0]);
    } else {
      setImgSrc(fallbackImg);
    }
  }, [product.images]);

  // Motion values for Tinder dragging physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-260, 260], [-18, 18]);
  const likeOpacity = useTransform(x, [25, 95], [0, 1]);
  const passOpacity = useTransform(x, [-25, -95], [0, 1]);
  const superLikeOpacity = useTransform(y, [-15, -75], [0, 1]);

  const handleDragEnd = (_event: any, info: any) => {
    const horizontalThreshold = 80;
    const verticalUpThreshold = -60;

    // Detect Swipe UP for Super Like / Save
    if (info.offset.y < verticalUpThreshold && Math.abs(info.offset.y) > Math.abs(info.offset.x) * 0.75) {
      onSwipe('SAVE');
      onOpenDetails(product);
      return;
    }

    // Detect Horizontal Swipe LIKE / PASS
    if (info.offset.x > horizontalThreshold) {
      onSwipe('LIKE');
    } else if (info.offset.x < -horizontalThreshold) {
      onSwipe('PASS');
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    onSwipe('SAVE');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) return;
    addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: imgSrc,
      images: product.images,
      inStock: product.inStock
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2200);
  };

  const allNotes = [...product.notes.top, ...product.notes.heart, ...product.notes.base].slice(0, 3);

  // Dynamic atmospheric halo colors matching fragrance universe
  const getFlaconHalo = (sub?: string) => {
    const s = (sub || '').toLowerCase();
    if (s.includes('bois') || s.includes('wood') || s.includes('oud') || s.includes('cuir')) {
      return 'from-amber-500/25 via-orange-400/20 to-amber-600/10';
    }
    if (s.includes('orient') || s.includes('ambr') || s.includes('vanill')) {
      return 'from-amber-400/30 via-orange-300/20 to-rose-400/10';
    }
    if (s.includes('flor') || s.includes('rose') || s.includes('jasmin')) {
      return 'from-rose-400/30 via-pink-300/20 to-purple-300/10';
    }
    if (s.includes('frais') || s.includes('aquat') || s.includes('agrum') || s.includes('hesp')) {
      return 'from-sky-400/30 via-cyan-300/20 to-teal-300/10';
    }
    if (s.includes('gourm') || s.includes('sucr')) {
      return 'from-amber-400/30 via-yellow-300/20 to-orange-400/10';
    }
    if (s.includes('épic') || s.includes('spic')) {
      return 'from-red-500/25 via-orange-400/20 to-amber-500/10';
    }
    return 'from-sky-400/25 via-sky-300/15 to-indigo-300/10';
  };

  const flaconHalo = getFlaconHalo(product.subcategoryLabel);

  // Realistic dynamic match percentage for Tinder-like affinity thrill
  const matchPercent = product.score || (92 + ((product.id * 7) % 8)); // 92% to 99%

  return (
    <div className="relative w-full max-w-[400px] mx-auto flex flex-col items-center">
      {/* ========================================================
          TINDER SWIPEABLE LUXURY CARD
          ======================================================== */}
      <motion.div
        style={{ x, y, rotate }}
        drag={isFront}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.65}
        onDragEnd={handleDragEnd}
        className={`relative w-full h-[480px] sm:h-[520px] rounded-[32px] bg-white border border-[#E8E2D6] shadow-[0_22px_55px_-12px_rgba(15,23,42,0.12)] overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all duration-200 flex flex-col justify-between ${
          isFront ? 'z-20' : 'z-10 pointer-events-none'
        }`}
      >
        {/* ========================================================
            TINDER DYNAMIC RUBBER STAMP OVERLAYS (LIKE / NOPE / SUPER)
            ======================================================== */}
        {isFront && (
          <>
            {/* LIKE / COUP DE CŒUR STAMP (Right Drag) */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-6 left-6 z-30 pointer-events-none rotate-[-14deg] border-[3.5px] border-emerald-500 rounded-2xl px-4 py-1.5 shadow-[0_10px_25px_rgba(16,185,129,0.35)] bg-emerald-500 text-white flex items-center gap-2"
            >
              <Heart size={20} className="fill-white" />
              <span className="font-black tracking-widest text-sm sm:text-base uppercase">
                {isAr ? 'إعجاب' : 'COUP DE CŒUR'}
              </span>
            </motion.div>

            {/* PASS / NOPE STAMP (Left Drag) */}
            <motion.div
              style={{ opacity: passOpacity }}
              className="absolute top-6 right-6 z-30 pointer-events-none rotate-[14deg] border-[3.5px] border-rose-500 rounded-2xl px-4 py-1.5 shadow-[0_10px_25px_rgba(244,63,94,0.35)] bg-rose-500 text-white flex items-center gap-2"
            >
              <X size={20} strokeWidth={3} />
              <span className="font-black tracking-widest text-sm sm:text-base uppercase">
                {isAr ? 'تجاوز' : 'PASSER'}
              </span>
            </motion.div>

            {/* SUPER LIKE / SAVE STAMP (Up Drag) */}
            <motion.div
              style={{ opacity: superLikeOpacity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none border-[3.5px] border-sky-500 rounded-2xl px-5 py-2 shadow-[0_12px_30px_rgba(56,189,248,0.4)] bg-sky-500 text-white flex items-center gap-2 whitespace-nowrap"
            >
              <Star size={20} className="fill-white animate-spin-slow" />
              <span className="font-black tracking-wider text-xs uppercase">
                {isAr ? 'سوبر لايك · حفظ' : 'SUPER LIKE · SAUVEGARDE'}
              </span>
            </motion.div>
          </>
        )}

        {/* ========================================================
            CARD HEADER: Brand Tag, Match %, Stock & Details Trigger
            ======================================================== */}
        <div className="p-4 pb-2 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
            {/* Brand Capsule */}
            <span className="text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-slate-900 text-white shadow-xs">
              {product.brandLabel}
            </span>

            {/* Tinder Match % Tag */}
            <span className="text-[9.5px] font-extrabold text-amber-700 bg-amber-500/10 border border-amber-300/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <Sparkles size={11} className="text-amber-500" />
              <span>{matchPercent}% Match</span>
            </span>

            {/* In Stock Pill */}
            {product.inStock && (
              <span className="hidden sm:inline-flex text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isAr ? 'متوفر' : 'En Stock'}</span>
              </span>
            )}
          </div>

          {/* Quick Info Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-[#E8E2D6] shadow-2xs flex items-center justify-center transition-all cursor-pointer active:scale-95"
            aria-label="Voir la pyramide olfactive"
            title="Détails du flacon"
          >
            <Info size={15} />
          </button>
        </div>

        {/* ========================================================
            HERO PERFUME BOTTLE SHOWCASE WITH SEAMLESS BLENDING
            ======================================================== */}
        <div className="relative flex-1 w-full flex flex-col items-center justify-center px-4 overflow-hidden my-auto min-h-[220px] bg-white">
          {/* Perfume Bottle Image with generous heroic scaling and mix-blend-multiply */}
          <div className="relative w-full h-[210px] sm:h-[240px] flex items-center justify-center z-10">
            <Image
              src={imgSrc}
              onError={() => setImgSrc(fallbackImg)}
              alt={product.name}
              fill
              priority={isFront}
              unoptimized={imgSrc.startsWith('http')}
              className="object-contain mix-blend-multiply scale-[1.55] sm:scale-[1.65] hover:scale-[1.75] transition-transform duration-300"
              sizes="(max-width: 640px) 90vw, 400px"
            />
          </div>

          {/* Soft Ground Contact Shadow */}
          <div className="w-36 h-2 bg-black/10 blur-xs rounded-full pointer-events-none mt-1 z-0" />
        </div>

        {/* ========================================================
            BOTTOM TINDER PROFILE SHEET: Details, Notes & 1-Click Buy
            ======================================================== */}
        <div className="p-4 pt-3 z-20 space-y-2 bg-gradient-to-t from-white via-white/95 to-white/70 border-t border-[#F0ECE1] shrink-0">
          {/* Scent Universe & Price Tag */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-200">
              {product.subcategoryLabel || 'Haute Parfumerie'}
            </span>
            <div className="flex items-baseline gap-1.5">
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through font-semibold">
                  {product.originalPrice} MAD
                </span>
              )}
              <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {product.price} MAD
              </span>
            </div>
          </div>

          {/* Perfume Name */}
          <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-1">
            {product.name}
          </h2>

          {/* Olfactory Interest Tags (Tinder Badges) */}
          {allNotes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {allNotes.map((note, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-slate-700 border border-[#E8E2D6] shadow-2xs"
                >
                  {note}
                </span>
              ))}
            </div>
          )}

          {/* Direct 1-Click Add to Cart CTA */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-2.5 px-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md active:scale-98 cursor-pointer ${
              isAdded
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/15'
            }`}
          >
            {isAdded ? (
              <>
                <Check size={14} className="text-white" />
                <span>{isAr ? 'تمت الإضافة للسلة !' : 'Ajouté au Panier !'}</span>
              </>
            ) : (
              <>
                <ShoppingBag size={13} className="text-white" />
                <span>
                  {isAr
                    ? `إضافة إلى السلة · ${product.price} درهم`
                    : `Ajouter au Panier · ${product.price} MAD`}
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ========================================================
          ICONIC TINDER FLOATING ACTION CONSOLE (5 TACTILE BUTTONS)
          ======================================================== */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 z-20">
        {/* 1. REWIND / UNDO (Amber) */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={(e) => {
            e.stopPropagation();
            if (onUndo) onUndo();
          }}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all ${
            canUndo
              ? 'bg-white border-amber-300 text-amber-500 hover:bg-amber-50 hover:border-amber-400 hover:scale-110 active:scale-95 shadow-md shadow-amber-500/15 cursor-pointer'
              : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
          }`}
          aria-label="Annuler la dernière action"
          title="Annuler (Ctrl+Z / U)"
        >
          <RotateCcw size={16} />
        </button>

        {/* 2. PASS / NOPE (Rose) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSwipe('PASS');
          }}
          className="w-14 h-14 sm:w-15 sm:h-15 rounded-full flex items-center justify-center bg-white border-2 border-rose-400 text-rose-500 hover:bg-rose-50 hover:border-rose-500 hover:scale-110 active:scale-95 shadow-xl shadow-rose-500/20 transition-all cursor-pointer"
          aria-label="Passer ce parfum"
          title="Passer (←)"
        >
          <X size={26} strokeWidth={2.8} />
        </button>

        {/* 3. SUPER LIKE / STAR (Cyan) */}
        <button
          type="button"
          onClick={handleSave}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 active:scale-95 shadow-md cursor-pointer ${
            isSaved
              ? 'bg-sky-500 border-sky-500 text-white shadow-sky-500/30'
              : 'bg-white border-sky-400 text-sky-500 hover:bg-sky-50 shadow-sky-500/15'
          }`}
          aria-label="Super Like & Sauvegarder"
          title="Super Like (↑)"
        >
          <Star size={18} className={isSaved ? 'fill-white' : 'fill-sky-400/20'} />
        </button>

        {/* 4. LIKE / COUP DE CŒUR (Emerald Gradient) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSwipe('LIKE');
          }}
          className="w-14 h-14 sm:w-15 sm:h-15 rounded-full flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-teal-400 text-white hover:scale-110 active:scale-95 shadow-xl shadow-emerald-500/35 transition-all cursor-pointer"
          aria-label="Coup de cœur"
          title="Coup de cœur (→)"
        >
          <Heart size={26} strokeWidth={2.5} className="fill-white" />
        </button>

        {/* 5. PYRAMIDE / DETAILS (Indigo) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(product);
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-white border-2 border-indigo-300 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-400 hover:scale-110 active:scale-95 shadow-md shadow-indigo-500/15 transition-all cursor-pointer"
          aria-label="Pyramide olfactive complète"
          title="Pyramide olfactive (Espace / I)"
        >
          <Info size={17} />
        </button>
      </div>
    </div>
  );
}
