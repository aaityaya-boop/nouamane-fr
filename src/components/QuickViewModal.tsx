'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ShoppingBag, Star, ChevronRight } from 'lucide-react';
import { formatMAD, type Product, isProductInStock } from '@/lib/products';
import { useCart } from '@/context/CartContext';

type QuickViewModalProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!product) return null;
  const inStock = isProductInStock(product);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-white rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.3)] max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-20 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors border border-[#e0ddd4]"
            >
              <X size={18} />
            </button>

            {/* Left: Image */}
            <div className="w-full md:w-1/2 relative h-[300px] md:h-auto bg-[#f8fafc]">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
              {/* Brand Badge */}
              <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-white/90 backdrop-blur-sm text-[#1A1A1A] px-4 py-2 rounded-full shadow-sm">
                  {product.brandLabel}
                </span>
                {!inStock && (
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase bg-white/95 text-red-600 border border-red-200 px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Rupture de stock
                  </span>
                )}
              </div>
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col overflow-y-auto lux-scrollbar">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9] mb-3">
                Aperçu Rapide
              </span>
              <h2 className="heading-font text-3xl md:text-4xl text-[#1A1A1A] tracking-wide mb-2">
                {product.name}
              </h2>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.floor(product.rating) ? 'text-[#0ea5e9] fill-[#0ea5e9]' : 'text-[#e0ddd4] fill-[#e0ddd4]'}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-[#9A9A9A]">({product.reviewCount} avis)</span>
              </div>

              <p className="text-[14px] text-[#555] leading-relaxed mb-8 line-clamp-3">
                {product.description}
              </p>

              <div className="mb-8">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#9A9A9A] block mb-3">
                  Notes Principales
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.notes.top.slice(0, 4).map((n: string) => (
                    <span key={n} className="text-[11px] font-medium tracking-wide bg-[#f4f4f4] text-[#1A1A1A] px-3 py-1.5 rounded-full border border-[#e0ddd4]">
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-[#e0ddd4]">
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-3xl font-semibold text-[#1A1A1A]">
                    {formatMAD(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg text-[#9A9A9A] line-through">
                      {formatMAD(product.originalPrice)}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {inStock ? (
                    <button
                      onClick={() => {
                        addToCart(
                          { id: product.id, sku: product.sku, slug: product.slug, name: product.name, price: product.price, images: product.images, inStock: product.inStock, stock: product.stock },
                          1,
                          product.sizes[0]?.label || '50ml'
                        );
                        onClose();
                      }}
                      className="flex-1 bg-[#1A1A1A] text-white h-14 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-[#0ea5e9] transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} />
                      Commander maintenant
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 bg-[#eeece5] text-red-600 border border-red-200 h-14 rounded-full text-[11px] font-bold tracking-widest uppercase cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Rupture de stock
                    </button>
                  )}
                  <Link
                    href={`/${locale}/product/${product.slug}`}
                    className="flex-1 border border-[#1A1A1A] text-[#1A1A1A] h-14 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-2"
                  >
                    Voir Détails <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
