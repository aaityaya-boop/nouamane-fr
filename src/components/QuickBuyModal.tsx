'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Zap, Check, AlertCircle } from 'lucide-react';
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
            className={`w-full py-3.5 px-6 rounded-2xl text-[13px] font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
              inStock
                ? 'btn-blue shadow-sky-500/25'
                : 'bg-slate-100 text-[#9A9A9A] cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : inStock ? (
              <>
                <Zap size={16} className="fill-current" />
                <span>ACHETER MAINTENANT</span>
              </>
            ) : (
              <>
                <AlertCircle size={16} />
                <span>RUPTURE DE STOCK</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
