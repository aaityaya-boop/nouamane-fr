'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatMAD, isProductInStock, type Product } from '@/lib/products';

type QuickBuyModalProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function QuickBuyModal({ product, isOpen, onClose }: QuickBuyModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';

  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedSizeIndex(0);
      setQuantity(1);
      setIsSubmitting(false);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const inStock = isProductInStock(product);
  const availableSizes = product.sizes && product.sizes.length > 0
    ? product.sizes
    : [{ label: 'Format standard', ml: 50, price: product.price }];

  const currentSize = availableSizes[selectedSizeIndex] || availableSizes[0];
  const unitPrice = currentSize.price || product.price;
  const totalPrice = unitPrice * quantity;
  const maxStock = typeof product.stock === 'number' && product.stock > 0 ? Math.min(product.stock, 10) : 10;

  const handleBuyNow = () => {
    if (!inStock || isSubmitting) return;
    setIsSubmitting(true);

    const query = new URLSearchParams({
      buyNow: '1',
      slug: product.slug,
      qty: String(quantity),
      size: currentSize.label,
    });

    onClose();
    router.push(`/${locale}/checkout?${query.toString()}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window: Bottom Sheet on Mobile, Centered Modal on Tablet/Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e0ddd4] p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#f8fafc] border border-[#e0ddd4] overflow-hidden shrink-0">
                <Image
                  src={product.images[0] || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9]">
                  {product.brandLabel}
                </span>
                <h3 className="heading-font text-base sm:text-lg font-bold text-[#1A1A1A] line-clamp-1">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[15px] font-bold text-[#1A1A1A]">
                    {formatMAD(unitPrice)}
                  </span>
                  {product.originalPrice && product.originalPrice > unitPrice && (
                    <span className="text-[11px] text-[#9A9A9A] line-through">
                      {formatMAD(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-slate-200 flex items-center justify-center transition shrink-0 active:scale-95"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Size / Variant Selector (if multiple sizes exist) */}
          {availableSizes.length > 1 && (
            <div className="mb-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-2">
                Choisir le format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableSizes.map((s, idx) => (
                  <button
                    key={`${s.label}-${idx}`}
                    type="button"
                    onClick={() => setSelectedSizeIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      selectedSizeIndex === idx
                        ? 'border-[#0ea5e9] bg-sky-50/50 ring-1 ring-[#0ea5e9]'
                        : 'border-[#e0ddd4] hover:border-slate-400 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-[12px] font-bold text-[#1A1A1A]">{s.label}</div>
                      <div className="text-[11px] text-[#0ea5e9] font-medium">{formatMAD(s.price)}</div>
                    </div>
                    {selectedSizeIndex === idx && (
                      <Check size={14} className="text-[#0ea5e9] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6 flex items-center justify-between py-2.5 border-y border-[#e0ddd4]">
            <span className="text-[12px] font-bold text-[#1A1A1A]">Quantité</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-[#e0ddd4] flex items-center justify-center text-[#1A1A1A] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
                aria-label="Diminuer la quantité"
              >
                <Minus size={15} />
              </button>
              <span className="text-[15px] font-bold w-6 text-center text-[#1A1A1A]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                disabled={quantity >= maxStock}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-[#e0ddd4] flex items-center justify-center text-[#1A1A1A] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
                aria-label="Augmenter la quantité"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Order Summary & Direct Buy Now Button */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] text-[#6B6B6B]">Total estimé</span>
            <span className="text-[18px] font-bold text-[#1A1A1A]">{formatMAD(totalPrice)}</span>
          </div>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!inStock || isSubmitting}
            className={`group relative w-full h-13 sm:h-14 px-5 rounded-2xl text-[13px] font-extrabold tracking-wider uppercase flex items-center justify-between shadow-xl transition-all active:scale-[0.98] overflow-hidden ${
              inStock
                ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 hover:from-black hover:via-slate-900 hover:to-black text-white border border-slate-800 shadow-slate-950/25 cursor-pointer'
                : 'bg-slate-100 text-[#9A9A9A] cursor-not-allowed border border-slate-200'
            }`}
          >
            {/* Subtle Luxury Sheen Sweep Effect on Hover */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

            {isSubmitting ? (
              <div className="w-full flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                  {locale === 'ar' ? 'جارٍ التحويل...' : 'Redirection sécurisée...'}
                </span>
              </div>
            ) : inStock ? (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <ShoppingBag size={15} strokeWidth={2.2} />
                  </div>
                  <span className="truncate">
                    {locale === 'ar' ? 'اشتري الآن' : 'ACHETER MAINTENANT'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 pl-2 rtl:pl-0 rtl:pr-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white font-black text-xs tracking-tight border border-white/10">
                    {formatMAD(totalPrice)}
                  </span>
                  <ArrowRight size={16} strokeWidth={2.5} className="text-white/70 group-hover:text-white group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-all duration-200" />
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 text-slate-500 font-bold text-xs uppercase">
                <AlertCircle size={16} />
                <span>{locale === 'ar' ? 'غير متوفر حالياً' : 'RUPTURE DE STOCK'}</span>
              </div>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
