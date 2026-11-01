'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Star, Flower, Sun, Leaf, Snowflake, Sparkles, ArrowRightLeft, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useComparison } from '@/context/ComparisonContext';
import { useDictionary } from '@/context/DictionaryContext';
import { formatMAD, type Product, isProductInStock } from '@/lib/products';
import { getProductEditionInfo } from '@/lib/productEdition';
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
  const isAr = locale === 'ar';
  const inStock = isProductInStock(product);
  const edition = getProductEditionInfo(product, locale);
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

  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;

    let defaultCap: string | undefined = undefined;
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      defaultCap = product.sizes[0].label;
    } else if (typeof product.sizes === 'string') {
      try {
        const parsed = JSON.parse(product.sizes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          defaultCap = parsed[0].label;
        }
      } catch {}
    }

    addToCart(product, 1, defaultCap);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    setIsQuickBuyOpen(true);
  };

  const pImage = product.images?.[0] || '/placeholder.jpg';

  return (
    <>
      <motion.div
        variants={{ hidden: { opacity: 0.01, y: 30 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-full js-fallback-opacity"
      >
        <Link
          href={`/${locale}/product/${product.slug}`}
          className="product-card group flex flex-col justify-between h-full bg-white border border-[#E8E2D6] rounded-2xl sm:rounded-[22px] overflow-hidden hover:border-[#0284c7]/40 hover:shadow-[0_12px_28px_-8px_rgba(2,132,199,0.08)] transition-all duration-300 shadow-2xs relative"
        >
          {/* ========================================================
              1. FLACON SHOWCASE (Full visibility, no cut-off)
              ======================================================== */}
          <div className="relative w-full h-[185px] sm:h-[240px] lg:h-[300px] overflow-hidden bg-gradient-to-b from-[#FCFBF9] to-[#F7F4EE] border-b border-[#ECE7DD] flex items-center justify-center">
            
            {/* Flacon Image */}
            <Image
              src={pImage}
              alt={`Parfum ${product.name} au Maroc - NAY Parfums`}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-2 scale-110 sm:scale-125 group-hover:scale-118 sm:group-hover:scale-132 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(17,24,39,0.12)]"
            />

            {/* Out of Stock Overlay */}
            {!inStock && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center p-2 text-center">
                <span className="text-[9.5px] sm:text-[11px] font-bold tracking-widest text-red-600 uppercase bg-white border border-red-200 px-3 py-1.5 rounded-full shadow-md">
                  {dict.productCard?.outOfStock || 'Rupture de stock'}
                </span>
              </div>
            )}

            {/* Brand Badge (Top-Left) — max-w prevents overlap with heart */}
            <div className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 rtl:left-auto rtl:right-2 rtl:sm:right-2.5 z-20 max-w-[calc(100%-44px)] flex items-center gap-1">
              <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.12em] uppercase bg-white/95 border border-[#E5E0D4] backdrop-blur-xs text-[#111827] px-2 py-0.5 rounded-full shadow-2xs truncate">
                {product.brandLabel}
              </span>
            </div>

            {/* Actions (Top-Right): Heart on Mobile, Heart+Compare on Desktop */}
            <div className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 rtl:right-auto rtl:left-2 rtl:sm:left-2.5 z-20 flex items-center gap-1.5">
              {/* Compare Toggle (Desktop only to prevent mobile cramping) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCompare(product);
                }}
                className={`hidden sm:flex w-7 h-7 sm:w-8 sm:h-8 rounded-full items-center justify-center transition-all backdrop-blur-md shadow-2xs ${
                  isComparedProduct
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'bg-white/90 hover:bg-white text-[#6B7280] hover:text-[#0284c7] border border-[#E5E0D4]'
                }`}
                aria-label={isComparedProduct ? 'Retirer du comparateur' : 'Comparer ce parfum'}
                title={isComparedProduct ? 'Retirer du comparateur' : 'Comparer ce parfum'}
              >
                <ArrowRightLeft size={12} className={isComparedProduct ? 'stroke-[2.5] text-white' : 'text-[#6B7280]'} />
              </button>

              {/* Wishlist Heart Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist(product.slug);
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-2xs cursor-pointer ${
                  isFavorite
                    ? 'bg-white text-rose-500 ring-1 ring-rose-200'
                    : 'bg-white/95 hover:bg-white text-[#6B7280] hover:text-rose-500 border border-[#E5E0D4]'
                }`}
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart size={13} className={isFavorite ? 'fill-rose-500 text-rose-500' : 'fill-none text-[#6B7280]'} />
              </button>
            </div>

            {/* Perfume Edition / Type Minimalist Badge (Bottom-Left) */}
            <div className="absolute bottom-2 sm:bottom-2.5 left-2 sm:left-2.5 rtl:left-auto rtl:right-2 rtl:sm:right-2.5 z-20 flex items-center">
              <span
                className={`text-[8px] sm:text-[8.5px] font-bold tracking-[0.14em] uppercase px-2 sm:px-2.5 py-0.5 rounded-full border shadow-2xs backdrop-blur-xs transition-colors ${edition.badgeBg} ${edition.textColor} ${edition.borderColor}`}
                title={edition.label}
              >
                {edition.label}
              </span>
            </div>

            {/* Bestseller / New Tag (Bottom-Right of Image) */}
            {(isBestseller || isNew) && (
              <div className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 z-10 flex items-center gap-1">
                {isBestseller && (
                  <span className="text-[7.5px] sm:text-[8px] font-bold tracking-wider uppercase bg-[#111827] text-white px-2 py-0.5 rounded-full shadow-2xs">
                    {dict.productCard?.bestseller || 'Bestseller'}
                  </span>
                )}
                {isNew && !isBestseller && (
                  <span className="text-[7.5px] sm:text-[8px] font-bold tracking-wider uppercase bg-[#0284c7] text-white px-2 py-0.5 rounded-full shadow-2xs">
                    {dict.productCard?.new || 'Nouveau'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ========================================================
              2. CARD DETAILS & INFORMATION
              ======================================================== */}
          <div className="p-2.5 sm:p-3.5 bg-white flex flex-col justify-between flex-1">
            <div>
              {/* Product Name */}
              <h3 className="font-display-modern text-[12px] sm:text-[13.5px] font-bold text-[#111827] tracking-tight leading-snug group-hover:text-[#0284c7] transition-colors line-clamp-2 min-h-[32px] sm:min-h-[36px]">
                {product.name}
              </h3>

              {/* Subtitle */}
              <p className="text-[9px] sm:text-[10px] font-medium tracking-wide uppercase text-[#8C827A] mt-0.5 truncate">
                {product.subcategoryLabel} · {genderLabel}
              </p>

              {/* Rating */}
              {showRating && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        className={
                          i < Math.floor(product.rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[#E5E0D4] fill-[#E5E0D4]'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-[#9CA3AF] font-medium">
                    {Number(product.rating).toFixed(1)} ({product.reviewCount})
                  </span>
                </div>
              )}
            </div>

            {/* ========================================================
                3. PRICE ROW & CALL TO ACTION
                ======================================================== */}
            <div className="mt-2 pt-1.5 border-t border-[#F0EBE1]">
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-[13px] sm:text-[14.5px] font-extrabold text-[#111827] whitespace-nowrap" dir="ltr">
                    {formatMAD(product.price)}
                  </span>
                  {isDiscounted && product.originalPrice && (
                    <span className="text-[9.5px] sm:text-[10.5px] text-[#9CA3AF] line-through whitespace-nowrap" dir="ltr">
                      {formatMAD(product.originalPrice)}
                    </span>
                  )}
                </div>
                {isDiscounted && product.originalPrice && (
                  <span className="text-[8px] font-bold text-rose-600 bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 rounded leading-none shrink-0" dir="ltr">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Action Button: Luxury Full-Width "Ajouter au panier" */}
              {inStock ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full h-8 sm:h-9 rounded-xl text-[10.5px] sm:text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-2xs ${
                    isAdded
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#111827] hover:bg-[#0284c7] text-white'
                  }`}
                  aria-label={isAr ? `أضف ${product.name} إلى السلة` : `Ajouter ${product.name} au panier`}
                >
                  {isAdded ? (
                    <>
                      <Check size={12} strokeWidth={2.5} />
                      <span className={isAr ? 'font-arabic' : 'font-body-modern'}>
                        {isAr ? 'تمت الإضافة ✓' : 'Ajouté ✓'}
                      </span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={12} strokeWidth={2.2} className="text-white/90 shrink-0" />
                      <span className={`truncate ${isAr ? 'font-arabic' : 'font-body-modern'}`}>
                        {isAr ? 'أضف للسلة' : 'Ajouter au panier'}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full h-8 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-[9.5px] font-bold tracking-wider uppercase flex items-center justify-center">
                  {dict.productCard?.outOfStock || 'Rupture de stock'}
                </div>
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
