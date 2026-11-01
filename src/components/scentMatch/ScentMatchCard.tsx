'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  Heart,
  X,
  Star,
  Bookmark,
  Info,
  RotateCcw,
  ShoppingBag,
  Check,
  ChevronUp,
  Sparkles,
  Droplets,
  Flame,
  Wind
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

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-260, 260], [-14, 14]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-20, -100], [0, 1]);
  const superLikeOpacity = useTransform(y, [-15, -75], [0, 1]);

  const handleDragEnd = (event: any, info: any) => {
    const horizontalThreshold = 80;
    const verticalUpThreshold = -60;

    // Detect Swipe UP for Super Like / Details
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

  // Dynamic atmospheric halo colors matching scent universe
  const getFlaconHalo = (sub?: string) => {
    const s = (sub || '').toLowerCase();
    if (s.includes('bois') || s.includes('wood') || s.includes('oud') || s.includes('cuir')) {
      return 'from-amber-600/35 via-orange-500/20 to-amber-700/10';
    }
    if (s.includes('orient') || s.includes('ambr') || s.includes('vanill')) {
      return 'from-orange-500/35 via-amber-500/20 to-rose-600/10';
    }
    if (s.includes('flor') || s.includes('rose') || s.includes('jasmin')) {
      return 'from-rose-500/35 via-pink-400/20 to-purple-500/10';
    }
    if (s.includes('frais') || s.includes('aquat') || s.includes('agrum') || s.includes('hesp')) {
      return 'from-cyan-500/35 via-sky-400/20 to-teal-500/10';
    }
    if (s.includes('gourm') || s.includes('sucr')) {
      return 'from-amber-500/35 via-yellow-400/20 to-orange-500/10';
    }
    if (s.includes('épic') || s.includes('spic')) {
      return 'from-red-600/35 via-orange-500/20 to-amber-600/10';
    }
    return 'from-sky-500/30 via-sky-400/15 to-indigo-500/10';
  };

  const flaconHalo = getFlaconHalo(product.subcategoryLabel);

  return (
    <div className="relative w-full max-w-[390px] mx-auto flex flex-col items-center">
      {/* TINDER SWIPEABLE CARD CONTAINER */}
      <motion.div
        style={{ x, y, rotate }}
        drag={isFront}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.65}
        onDragEnd={handleDragEnd}
        className={`relative w-full h-[430px] sm:h-[480px] rounded-[28px] bg-[#0c121e] text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-700/60 overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all duration-200 flex flex-col justify-between ${
          isFront ? 'z-20' : 'z-10 pointer-events-none scale-95 opacity-80'
        }`}
      >
        {/* ========================================================
            TINDER STAMP OVERLAYS (LIKE / NOPE / SUPER LIKE)
            ======================================================== */}
        {isFront && (
          <>
            {/* LIKE / COUP DE CŒUR STAMP (Right Swipe) */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-6 left-6 z-30 pointer-events-none rotate-[-15deg] border-[3.5px] border-emerald-400 rounded-2xl px-3.5 py-1 shadow-[0_0_25px_rgba(16,185,129,0.5)] bg-emerald-950/85 backdrop-blur-md flex items-center gap-1.5"
            >
              <Heart size={18} className="text-emerald-400 fill-emerald-400" />
              <span className="text-emerald-400 font-black tracking-widest text-sm sm:text-base uppercase">
                {isAr ? 'إعجاب' : 'COUP DE CŒUR'}
              </span>
            </motion.div>

            {/* PASS / NOPE STAMP (Left Swipe) */}
            <motion.div
              style={{ opacity: passOpacity }}
              className="absolute top-6 right-6 z-30 pointer-events-none rotate-[15deg] border-[3.5px] border-rose-500 rounded-2xl px-3.5 py-1 shadow-[0_0_25px_rgba(244,63,94,0.5)] bg-rose-950/85 backdrop-blur-md flex items-center gap-1.5"
            >
              <X size={18} strokeWidth={3} className="text-rose-500" />
              <span className="text-rose-500 font-black tracking-widest text-sm sm:text-base uppercase">
                {isAr ? 'تجاوز' : 'PASSER'}
              </span>
            </motion.div>

            {/* SUPER LIKE / SAVE STAMP (Up Swipe) */}
            <motion.div
              style={{ opacity: superLikeOpacity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none border-[3px] border-sky-400 rounded-2xl px-4 py-2 shadow-[0_0_30px_rgba(56,189,248,0.6)] bg-sky-950/90 backdrop-blur-md flex items-center gap-2 whitespace-nowrap"
            >
              <Star size={18} className="text-sky-400 fill-sky-400 animate-spin" />
              <span className="text-sky-400 font-black tracking-wider text-xs uppercase">
                {isAr ? 'سوبر لايك · حفظ' : 'SUPER LIKE · SAUVEGARDE'}
              </span>
            </motion.div>
          </>
        )}

        {/* ========================================================
            CARD HEADER: Brand Tag & Stock Status & Info Pill
            ======================================================== */}
        <div className="p-4 flex items-center justify-between z-20 bg-gradient-to-b from-[#0c121e]/90 to-transparent shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-xs">
              {product.brandLabel}
            </span>
            {product.inStock && (
              <span className="text-[9.5px] font-bold text-emerald-300 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isAr ? 'متوفر' : 'En Stock'}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            aria-label="Voir la pyramide olfactive"
            title="Détails du flacon"
          >
            <Info size={15} />
          </button>
        </div>

        {/* ========================================================
            HERO PERFUME BOTTLE SHOWCASE WITH AURA
            ======================================================== */}
        <div className="relative flex-1 w-full flex items-center justify-center px-4 overflow-hidden my-auto min-h-[190px]">
          {/* Dynamic Ambient Scent Aura */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-gradient-to-tr ${flaconHalo} blur-3xl opacity-80 animate-pulse transition-all duration-700`} />
          </div>

          {/* Perfume Bottle Image (Hero Centered) */}
          <div className="relative w-full h-[180px] sm:h-[215px] flex items-center justify-center z-10">
            <Image
              src={imgSrc}
              onError={() => setImgSrc(fallbackImg)}
              alt={product.name}
              fill
              priority={isFront}
              className="object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.55)] transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 640px) 90vw, 380px"
            />
          </div>
        </div>

        {/* ========================================================
            BOTTOM TINDER PROFILE SCRIM: Details, Notes & Cart CTA
            ======================================================== */}
        <div className="p-4 pt-4 z-20 space-y-2 bg-gradient-to-t from-[#090d16] via-[#090d16]/95 to-transparent shrink-0">
          {/* Scent Universe Tag & Price Pill */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold text-[#38bdf8] uppercase tracking-widest px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30">
              {product.subcategoryLabel || 'Haute Parfumerie'}
            </span>
            <div className="text-right">
              <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                {product.price} MAD
              </span>
            </div>
          </div>

          {/* Perfume Name */}
          <h2 className="text-base sm:text-lg font-black text-white leading-tight line-clamp-1">
            {product.name}
          </h2>

          {/* Olfactory Trait Chips (Tinder Profile Tags) */}
          {allNotes.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {allNotes.map((note, idx) => (
                <span
                  key={idx}
                  className="text-[9.5px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10"
                >
                  {note}
                </span>
              ))}
            </div>
          )}

          {/* Direct 1-Click Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-2 px-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md active:scale-98 cursor-pointer ${
              isAdded
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-white hover:bg-sky-50 text-slate-950 shadow-white/10'
            }`}
          >
            {isAdded ? (
              <>
                <Check size={14} className="text-white" />
                <span>{isAr ? 'تمت الإضافة للسلة !' : 'Ajouté au Panier !'}</span>
              </>
            ) : (
              <>
                <ShoppingBag size={13} className="text-slate-950" />
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
          ICONIC TINDER FLOATING ACTION CONSOLE (5 BUTTONS)
          ======================================================== */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-4 mt-2.5 sm:mt-4 z-20">
        {/* 1. REWIND / UNDO (Amber) */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={(e) => {
            e.stopPropagation();
            if (onUndo) onUndo();
          }}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all ${
            canUndo
              ? 'bg-[#131b2c] border-amber-500/40 text-amber-400 hover:border-amber-400 hover:bg-amber-500/10 hover:scale-110 active:scale-95 shadow-md shadow-amber-500/10 cursor-pointer'
              : 'bg-slate-100 dark:bg-slate-900 border-transparent text-slate-400 dark:text-slate-700 cursor-not-allowed'
          }`}
          aria-label="Annuler la dernière action"
          title="Annuler (U)"
        >
          <RotateCcw size={15} />
        </button>

        {/* 2. PASS / NOPE (Rose) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSwipe('PASS');
          }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-[#131b2c] border-2 border-rose-500/50 text-rose-500 hover:bg-rose-500/15 hover:border-rose-400 hover:scale-110 active:scale-95 shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
          aria-label="Passer ce parfum"
          title="Passer (←)"
        >
          <X size={22} strokeWidth={2.8} />
        </button>

        {/* 3. SUPER LIKE / STAR (Cyan) */}
        <button
          type="button"
          onClick={handleSave}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border transition-all hover:scale-110 active:scale-95 shadow-md cursor-pointer ${
            isSaved
              ? 'bg-sky-500 border-sky-400 text-white shadow-sky-500/30'
              : 'bg-[#131b2c] border-sky-500/50 text-sky-400 hover:bg-sky-500/15 hover:border-sky-400 shadow-sky-500/15'
          }`}
          aria-label="Super Like & Sauvegarder"
          title="Super Like (↑)"
        >
          <Star size={17} className={isSaved ? 'fill-white' : 'fill-sky-400/20'} />
        </button>

        {/* 4. LIKE / COUP DE CŒUR (Emerald) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSwipe('LIKE');
          }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-teal-400 text-white hover:scale-110 active:scale-95 shadow-xl shadow-emerald-500/35 transition-all cursor-pointer"
          aria-label="Coup de cœur"
          title="Coup de cœur (→)"
        >
          <Heart size={22} strokeWidth={2.5} className="fill-white" />
        </button>

        {/* 5. PYRAMIDE / DETAILS (Indigo) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(product);
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[#131b2c] border border-indigo-400/40 text-indigo-400 hover:bg-indigo-500/15 hover:border-indigo-400 hover:scale-110 active:scale-95 shadow-md shadow-indigo-500/10 transition-all cursor-pointer"
          aria-label="Pyramide olfactive complète"
          title="Pyramide olfactive (Espace / I)"
        >
          <Info size={15} />
        </button>
      </div>
    </div>
  );
}
