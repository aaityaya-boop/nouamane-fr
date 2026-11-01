'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Check,
  Droplets,
  ShieldCheck,
  ShoppingBag,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  Layers,
  Flame,
  Wind
} from 'lucide-react';
import { QueueProduct } from '@/lib/scentMatch/types';
import { useCart } from '@/context/CartContext';

interface ScentMatchDetailsModalProps {
  product: QueueProduct | null;
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
}

export default function ScentMatchDetailsModal({
  product,
  isOpen,
  onClose,
  locale = 'fr'
}: ScentMatchDetailsModalProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const isAr = locale === 'ar';

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] || '/images/placeholder-perfume.png',
      images: product.images,
      inStock: product.inStock
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const whatsappMessage = encodeURIComponent(
    isAr
      ? `مرحباً دار NAY Parfums، أنا مهتم بعطر "${product.name}" بسعر ${product.price} درهم. هل هو متوفر للطلب ؟`
      : `Bonjour Maison NAY Parfums, je suis intéressé(e) par le parfum "${product.name}" (${product.price} MAD) découvert sur Scent Match. Est-il disponible ?`
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal / Bottom Sheet Box */}
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100) onClose();
          }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-t-[36px] sm:rounded-[32px] shadow-2xl overflow-hidden border border-[#ECEAE4] dark:border-slate-800 flex flex-col max-h-[90vh] sm:max-h-[88vh] z-10"
        >
          {/* Top Drag Handle Bar (for mobile swipe down to dismiss) */}
          <div className="w-full pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-sky-500">
                {product.brandLabel}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                {product.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* Flacon Presentation with Clean Studio Blending */}
            <div className="relative w-full h-52 sm:h-60 bg-gradient-to-b from-[#FCFBF9] to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-sky-400/20 via-sky-300/15 to-amber-300/20 blur-2xl opacity-70" />
              </div>

              {product.images[0] && (
                <div className="relative w-full h-full max-h-[220px]">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-contain p-3 drop-shadow-xl [mix-blend-mode:multiply] dark:[mix-blend-mode:normal]"
                    sizes="(max-width: 640px) 100vw, 400px"
                  />
                </div>
              )}

              <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                {product.subcategoryLabel}
              </div>

              <div className="absolute top-3 right-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
                {product.price} MAD
              </div>
            </div>

            {/* Olfactory Pyramid (Full Notes Breakdown) */}
            <div className="space-y-4 bg-slate-50/80 dark:bg-slate-900/50 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                <Sparkles size={15} className="text-amber-500" />
                <span>{isAr ? 'الهرم العطري والتكوين' : 'Pyramide Olfactive Complète'}</span>
              </div>

              {/* Tête */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-600 dark:text-sky-400">
                  <Wind size={13} />
                  <span>{isAr ? 'نوتات المقدمة (Tête)' : 'Notes de Tête (Départ) :'}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-4 rtl:pl-0 rtl:pr-4 font-medium">
                  {product.notes.top.length > 0
                    ? product.notes.top.join(' · ')
                    : (isAr ? 'انطلاقة منعشة وحيوية' : 'Accords frais et vivifiants')}
                </p>
              </div>

              {/* Cœur */}
              <div className="space-y-1 border-t border-slate-200/60 dark:border-slate-800 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-500">
                  <Flame size={13} />
                  <span>{isAr ? 'قلب العطر (Cœur)' : 'Notes de Cœur (Signature) :'}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-4 rtl:pl-0 rtl:pr-4 font-medium">
                  {product.notes.heart.length > 0
                    ? product.notes.heart.join(' · ')
                    : (isAr ? 'تناغم زهري ومتبل ساحر' : 'Florales voluptueuses et épices délicates')}
                </p>
              </div>

              {/* Fond */}
              <div className="space-y-1 border-t border-slate-200/60 dark:border-slate-800 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  <Layers size={13} />
                  <span>{isAr ? 'قاعدة العطر (Fond)' : 'Notes de Fond (Sillage Durable) :'}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-4 rtl:pl-0 rtl:pr-4 font-medium">
                  {product.notes.base.length > 0
                    ? product.notes.base.join(' · ')
                    : (isAr ? 'أخشاب نبيلة وعنبر عميق' : 'Bois précieux, ambre chaud et muscs enveloppants')}
                </p>
              </div>
            </div>

            {/* Guarantees & Authenticity Badges */}
            <div className="grid grid-cols-2 gap-3 text-[11px] font-bold">
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
                <ShieldCheck size={16} />
                <span>{isAr ? 'أصلي 100% مضمون' : '100% Authentique Certifié'}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-800/60">
                <Droplets size={16} />
                <span>{isAr ? 'توصيل سريع بكل المغرب' : 'Livraison Express Maroc'}</span>
              </div>
            </div>
          </div>

          {/* Sticky Bottom CTAs */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between gap-3">
              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer ${
                  added
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-[#0f172a] hover:bg-[#0284c7] text-white shadow-slate-900/20'
                }`}
              >
                {added ? (
                  <>
                    <Check size={16} />
                    <span>{isAr ? 'تمت الإضافة للسلة !' : 'Ajouté au Panier !'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>
                      {isAr
                        ? `إضافة إلى السلة · ${product.price} درهم`
                        : `Ajouter au Panier · ${product.price} MAD`}
                    </span>
                  </>
                )}
              </button>

              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/212663380011?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0 cursor-pointer"
                title="Consulter par WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
            </div>

            {/* Link to Full Product Page */}
            <div className="text-center pt-1">
              <Link
                href={`/${locale}/product/${product.slug}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-sky-500 transition-colors"
              >
                <span>{isAr ? 'عرض صفحة العطر الكاملة والمراجعات' : 'Consulter la fiche complète du parfum'}</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
