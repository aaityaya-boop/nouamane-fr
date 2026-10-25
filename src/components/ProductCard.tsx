'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Star, Flower, Sun, Leaf, Snowflake, Sparkles, Zap, ArrowRightLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useComparison } from '@/context/ComparisonContext';
import { useDictionary } from '@/context/DictionaryContext';
import { formatMAD, type Product, isProductInStock } from '@/lib/products';
import QuickBuyModal from '@/components/QuickBuyModal';

type ProductCardProps = {
  product: Product;
  showRating?: boolean;
  onQuickView?: (product: Product) => void;
};

export default function ProductCard({ product, showRating = true, onQuickView }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isCompared, toggleCompare } = useComparison();
  const isFavorite = isInWishlist(product.slug);
  const isComparedProduct = isCompared(product.slug);
  const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);

  const dict = useDictionary();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const inStock = isProductInStock(product);
  const isBestseller = product.tags.includes('bestseller');
  const isNew = product.tags.includes('new-arrival') && product.subcategory !== 'coffrets';
  const isDiscounted = !!product.originalPrice && product.originalPrice > product.price;

  const genderLabel = product.gender === 'women'
    ? (dict.productCard?.women || 'Femme')
    : product.gender === 'men'
    ? (dict.productCard?.men || 'Homme')
    : (dict.productCard?.unisex || 'Mixte');

  const seasonLabel = product.perfectSeason === 'Printemps'
    ? (dict.productCard?.spring || 'Printemps')
    : product.perfectSeason === 'Été'
    ? (dict.productCard?.summer || 'Été')
    : product.perfectSeason === 'Automne'
    ? (dict.productCard?.autumn || 'Automne')
    : product.perfectSeason === 'Hiver'
    ? (dict.productCard?.winter || 'Hiver')
    : product.perfectSeason === 'Toutes Saisons'
    ? (dict.productCard?.allSeasons || 'Toutes Saisons')
    : product.perfectSeason;

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    setIsQuickBuyOpen(true);
  };

  return (
    <>
      <motion.div
        variants={{ hidden: { opacity: 0.01, y: 30 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-full js-fallback-opacity"
      >
        <Link
          href={`/${locale}/product/${product.slug}`}
          className="product-card group block h-full bg-white border border-[#e0ddd4]/80 rounded-2xl sm:rounded-[24px] overflow-hidden hover:border-[#1A1A1A]/30 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out"
        >
          <div className="relative aspect-[4/5] sm:aspect-auto sm:h-[320px] lg:h-[380px] overflow-hidden bg-[#f8fafc]">
            <Image
              src={product.images[0] || '/placeholder.jpg'}
              alt={`Parfum ${product.name} au Maroc - NAY Parfums`}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover perfume-bottle group-hover:scale-110 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
            />

            {/* Subtle Dark Gradient that sweeps up on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Desktop Hover Action Tray */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full px-5 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 delay-75 z-30">
              {!inStock ? (
                <span className="bg-white/95 backdrop-blur-sm text-red-600 border border-red-200 text-[10px] font-bold tracking-widest uppercase px-6 py-2.5 rounded-full whitespace-nowrap shadow-xl">
                  {dict.productCard?.outOfStock || 'Rupture de stock'}
                </span>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleQuickBuy}
                    className="flex-1 bg-[#1A1A1A] hover:bg-[#0ea5e9] text-white text-[10px] font-bold tracking-wider uppercase py-2.5 px-3 rounded-full shadow-lg transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                    aria-label={`Achat rapide ${product.name}`}
                  >
                    <Zap size={13} className="fill-[#0ea5e9] group-hover:fill-white text-[#0ea5e9] group-hover:text-white" />
                    <span>Achat Rapide</span>
                  </button>

                  {onQuickView ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="bg-white/90 hover:bg-white text-[#1A1A1A] text-[10px] font-bold tracking-wider uppercase py-2.5 px-3.5 rounded-full shadow-lg transition-colors flex items-center justify-center shrink-0"
                      aria-label="Aperçu rapide"
                      title="Aperçu rapide"
                    >
                      Aperçu
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {!inStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4">
                <span className="text-[11px] font-bold tracking-widest text-red-600 uppercase bg-white border border-red-200 px-4 py-2 rounded-full shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  {dict.productCard?.outOfStock || 'Rupture de stock'}
                </span>
              </div>
            )}

            {/* Top-Right Action Buttons: Wishlist & Compare */}
            <div className="absolute top-2.5 sm:top-3.5 right-2.5 sm:right-3.5 rtl:right-auto rtl:left-2.5 rtl:sm:left-3.5 z-30 flex items-center gap-1.5 sm:gap-2">
              {/* Compare Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCompare(product);
                }}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-2xs ${
                  isComparedProduct
                    ? 'bg-[#0ea5e9] text-white shadow-sm ring-2 ring-[#0ea5e9]/40'
                    : 'bg-white/85 hover:bg-white text-[#6B6B6B] hover:text-[#0ea5e9]'
                }`}
                aria-label={isComparedProduct ? 'Retirer du comparateur' : 'Comparer ce parfum'}
                title={isComparedProduct ? 'Retirer du comparateur' : 'Comparer ce parfum'}
              >
                <ArrowRightLeft size={13} className={isComparedProduct ? 'stroke-[2.5] text-white' : 'text-slate-700'} />
              </button>

              {/* Wishlist Heart Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist(product.slug);
                }}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-2xs ${
                  isFavorite
                    ? 'bg-white text-rose-500 shadow-sm ring-1 ring-rose-200'
                    : 'bg-white/85 hover:bg-white text-[#6B6B6B] hover:text-rose-500'
                }`}
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart size={14} className={isFavorite ? 'fill-rose-500 text-rose-500' : 'fill-none text-slate-700'} />
              </button>
            </div>

            {/* Brand badge (top-left) */}
            <div className="absolute top-2.5 sm:top-3.5 left-2.5 sm:left-3.5 rtl:left-auto rtl:right-2.5 rtl:sm:right-3.5 flex flex-col items-start rtl:items-end gap-1 z-20">
              <span className="text-[8.5px] sm:text-[9px] font-bold tracking-[0.16em] uppercase bg-white/95 border border-[#e0ddd4] backdrop-blur-sm text-[#1A1A1A] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-2xs">
                {product.brandLabel}
              </span>
              {product.perfectSeason && (
                <span className="hidden sm:flex text-[8px] font-semibold tracking-[0.15em] uppercase bg-[#fafaf7]/90 border border-[#e0ddd4] backdrop-blur-sm text-[#6B6B6B] px-2.5 py-1 rounded-full shadow-sm items-center gap-1">
                  {product.perfectSeason === 'Printemps' && <Flower size={10} />}
                  {product.perfectSeason === 'Été' && <Sun size={10} />}
                  {product.perfectSeason === 'Automne' && <Leaf size={10} />}
                  {product.perfectSeason === 'Hiver' && <Snowflake size={10} />}
                  {product.perfectSeason === 'Toutes Saisons' && <Sparkles size={10} />}
                  {seasonLabel}
                </span>
              )}
            </div>

            {/* Bestseller / New ribbon (top-right under actions) */}
            {(isBestseller || isNew || isDiscounted) && (
              <div className="absolute top-11 sm:top-14 right-2.5 sm:right-3.5 rtl:right-auto rtl:left-2.5 rtl:sm:left-3.5 flex flex-col gap-1 items-end rtl:items-start">
                {isDiscounted && (
                  <span className="text-[9px] font-bold tracking-[0.15em] uppercase bg-red-500 text-white px-3 py-1.5 rounded-full">
                    {dict.productCard?.sale || 'Promo'}
                  </span>
                )}
                {isBestseller && (
                  <span className="text-[9px] font-bold tracking-[0.15em] uppercase bg-[#111] text-white px-3 py-1.5 rounded-full">
                    {dict.productCard?.bestseller || 'Bestseller'}
                  </span>
                )}
                {isNew && !isBestseller && (
                  <span className="text-[9px] font-bold tracking-[0.15em] uppercase bg-[#0ea5e9] text-white px-3 py-1.5 rounded-full">
                    {dict.productCard?.new || 'Nouveau'}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 lg:p-5 relative bg-white flex flex-col justify-between flex-1">
            <h3 className="heading-font text-[13px] sm:text-[14.5px] lg:text-[18px] font-semibold text-[#1A1A1A] tracking-normal leading-snug group-hover:text-[#0ea5e9] transition-colors duration-300 line-clamp-2 min-h-[2.6em]">
              {product.name}
            </h3>
            <p className="text-[9.5px] sm:text-[10.5px] font-medium tracking-[0.1em] uppercase text-[#888] mt-0.5 sm:mt-1 truncate">
              {product.subcategoryLabel} · {genderLabel}
            </p>

            {showRating && (
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i < Math.floor(product.rating)
                          ? 'text-[#0ea5e9] fill-[#0ea5e9]'
                          : 'text-[#e0ddd4] fill-[#e0ddd4]'
                      }
                    />
                  ))}
                </div>
                <span className="text-[10px] sm:text-[11px] text-[#9A9A9A]">
                  {Number(product.rating).toFixed(1)} ({product.reviewCount})
                </span>
              </div>
            )}

            {/* Bottom Row: Price & Mobile/Desktop Direct Quick Buy Button */}
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#f1f1eb] flex items-center justify-between gap-1.5 sm:gap-2">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="text-[14px] sm:text-[15px] font-bold text-[#1A1A1A] whitespace-nowrap">
                  {formatMAD(product.price)}
                </span>
                {isDiscounted && product.originalPrice && (
                  <span className="text-[11px] text-[#9A9A9A] line-through whitespace-nowrap">
                    {formatMAD(product.originalPrice)}
                  </span>
                )}
              </div>

              {inStock ? (
                <button
                  type="button"
                  onClick={handleQuickBuy}
                  className="min-h-[36px] sm:min-h-[38px] px-3.5 py-2 sm:px-4 sm:py-2 rounded-full bg-[#1A1A1A] hover:bg-[#0ea5e9] text-white text-[10.5px] sm:text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition shadow-2xs active:scale-95 shrink-0 relative after:absolute after:-inset-1.5 after:content-['']"
                  aria-label={`Acheter ${product.name}`}
                >
                  <Zap size={12} className="fill-[#0ea5e9] text-[#0ea5e9]" />
                  <span>Acheter</span>
                </button>
              ) : (
                <span className="text-[10px] font-bold tracking-wider uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full whitespace-nowrap">
                  Rupture
                </span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Quick Buy Selection Modal (multi-variant) */}
      <QuickBuyModal
        product={product}
        isOpen={isQuickBuyOpen}
        onClose={() => setIsQuickBuyOpen(false)}
      />
    </>
  );
}
