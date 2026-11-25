'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Star, Flower, Sun, Leaf, Snowflake, Award, ArrowRightLeft, Check } from 'lucide-react';
import { CodCashIcon } from '@/components/icons/MaisonIcons';
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
  const isEn = locale === 'en';
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
      <div className="h-full">
        <Link
          href={`/${locale}/product/${product.slug}`}
          className="product-card group flex flex-col justify-between h-full bg-white border border-[#E5E0D6] rounded-[16px] sm:rounded-[21px] overflow-hidden hover:border-[#0284c7]/45 hover:shadow-[0_14px_34px_-10px_rgba(2,132,199,0.12)] transition-all duration-300 shadow-2xs relative"
        >
          {/* ========================================================
              1. GOLDEN RATIO FLACON SHOWCASE (Clean Seamless Studio)
              ======================================================== */}
          <div className="relative w-full aspect-[1/1] sm:aspect-[1/1.04] bg-white flex items-center justify-center p-2 sm:p-3 overflow-hidden">
            
            {/* Flacon Image */}
            <Image
              src={pImage}
              alt={`Parfum ${product.name} au Maroc - NAY Parfums`}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-1.5 sm:p-2 scale-105 group-hover:scale-112 transition-transform duration-300 mix-blend-multiply"
            />

            {/* Out of Stock Overlay */}
            {!inStock && (
              <div className="absolute inset-0 bg-white/85 z-20 flex flex-col items-center justify-center p-2 text-center">
                <span className="text-[9.5px] sm:text-[11px] font-bold tracking-[0.14em] text-red-600 uppercase bg-white border border-red-200 px-3 py-1.5 rounded-full shadow-xs">
                  {dict.productCard?.outOfStock || 'Rupture de stock'}
                </span>
              </div>
            )}
          </div>

          {/* ========================================================
              2. GOLDEN RATIO TYPOGRAPHY & INFORMATION HIERARCHY
              ======================================================== */}
          <div className="p-[13px] sm:p-[16px] lg:p-[21px] bg-white flex flex-col justify-between flex-1 border-t border-[#F4F1EA]">
            <div>
              {/* Row 1: Brand & Edition (Left), Wishlist Heart & Compare (Right) */}
              <div className="flex items-center justify-between gap-[6px] mb-[6px] min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.14em] uppercase text-[#6B7280] truncate">
                    {product.brandLabel || product.brand}
                  </span>
                  <span
                    className={`text-[7.5px] sm:text-[8px] font-bold tracking-[0.10em] uppercase px-2 py-0.5 rounded-full border shrink-0 ${edition.badgeBg} ${edition.textColor} ${edition.borderColor}`}
                    title={edition.label}
                  >
                    {edition.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Desktop Compare Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCompare(product);
                    }}
                    className={`hidden sm:flex w-7 h-7 rounded-full items-center justify-center transition-all ${
                      isComparedProduct
                        ? 'bg-[#0284c7] text-white'
                        : 'text-slate-400 hover:text-[#0284c7] hover:bg-sky-50'
                    }`}
                    aria-label="Comparer ce parfum"
                    title={isComparedProduct ? 'Retirer du comparateur' : 'Comparer ce parfum'}
                  >
                    <ArrowRightLeft size={12} className={isComparedProduct ? 'stroke-[2.5] text-white' : 'text-slate-400'} />
                  </button>

                  {/* Wishlist Heart Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product.slug);
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart size={14} className={isFavorite ? 'fill-rose-500 text-rose-500' : 'fill-none text-slate-400'} />
                  </button>
                </div>
              </div>

              {/* Product Name (Golden Modular Scale: 13px mobile / 15px desktop, leading 1.32) */}
              <h3 className="font-display-modern text-[13px] sm:text-[15px] font-bold text-[#111827] tracking-[-0.015em] leading-[1.32] group-hover:text-[#0284c7] transition-colors line-clamp-2 min-h-[34px] sm:min-h-[40px]">
                {product.name}
              </h3>

              {/* Subtitle / Olfactory Family */}
              <p className="text-[9.5px] sm:text-[10.5px] font-medium tracking-[0.06em] uppercase text-[#8C827A] mt-[4px] truncate">
                {product.subcategoryLabel} · {genderLabel}
              </p>

              {/* Rating */}
              {showRating && (
                <div className="flex items-center gap-1.5 mt-[8px]">
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
                  <span className="text-[9.5px] sm:text-[10.5px] text-[#8C827A] font-semibold tabular-nums">
                    {Number(product.rating).toFixed(1)} ({product.reviewCount})
                  </span>
                </div>
              )}
            </div>

            {/* ========================================================
                3. GOLDEN PRICE ROW & DUAL 1.618 : 1 ACTION BUTTONS
                ======================================================== */}
            <div className="mt-[13px] pt-[10px] sm:pt-[13px] border-t border-[#F0EBE1]">
              <div className="flex items-baseline justify-between gap-1.5 mb-[10px] sm:mb-[13px]">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-[15px] sm:text-[18px] font-extrabold text-[#111827] whitespace-nowrap tabular-nums tracking-[-0.02em]" dir="ltr">
                    {formatMAD(product.price)}
                  </span>
                  {isDiscounted && product.originalPrice && (
                    <span className="text-[10px] sm:text-[11px] text-[#9CA3AF] line-through whitespace-nowrap tabular-nums" dir="ltr">
                      {formatMAD(product.originalPrice)}
                    </span>
                  )}
                </div>
                {isDiscounted && product.originalPrice && (
                  <span className="text-[8.5px] sm:text-[9px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200/70 px-1.5 py-0.5 rounded-[6px] leading-none shrink-0 tabular-nums" dir="ltr">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Action Buttons: Golden Ratio (1.618 Primary Add + Express Buy) */}
              {inStock ? (
                <div className="flex items-center gap-[6px] sm:gap-[8px]">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`flex-1 h-[38px] sm:h-[42px] rounded-[11px] sm:rounded-[13px] text-[11px] sm:text-[12px] font-bold tracking-[0.02em] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-2xs min-w-0 px-2.5 ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#111827] hover:bg-[#0284c7] text-white'
                    }`}
                    aria-label={isAr ? `أضف ${product.name} إلى السلة` : isEn ? `Add ${product.name} to cart` : `Ajouter ${product.name} au panier`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={13} strokeWidth={2.5} className="shrink-0" />
                        <span className={`truncate ${isAr ? 'font-arabic' : 'font-body-modern'}`}>
                          {isAr ? 'تمت الإضافة' : isEn ? 'Added' : 'Ajouté'}
                        </span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={13} strokeWidth={2.2} className="text-white/90 shrink-0" />
                        <span className={`truncate ${isAr ? 'font-arabic' : 'font-body-modern'}`}>
                          <span className="sm:hidden">{isAr ? 'أضف' : isEn ? 'Add' : 'Ajouter'}</span>
                          <span className="hidden sm:inline">{isAr ? 'أضف للسلة' : isEn ? 'Add to cart' : 'Ajouter au panier'}</span>
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickBuy}
                    title={isAr ? 'شراء الدفع عند الاستلام' : isEn ? 'Buy now (Cash on Delivery)' : 'Commander (Paiement à la livraison)'}
                    aria-label={isAr ? `شراء ${product.name}` : isEn ? `Buy ${product.name} (COD)` : `Commander ${product.name} (COD)`}
                    className="w-[38px] sm:w-auto sm:px-3 h-[38px] sm:h-[42px] rounded-[11px] sm:rounded-[13px] bg-[#FAF9F5] hover:bg-[#111827] text-[#111827] hover:text-white border border-[#E0DDD4] hover:border-[#111827] flex items-center justify-center gap-1.5 text-[11px] font-bold transition-colors duration-200 active:scale-[0.96] shrink-0 cursor-pointer"
                  >
                    <CodCashIcon size={16} className="shrink-0" />
                    <span className="hidden md:inline">{isAr ? 'شراء' : isEn ? 'Buy' : 'Acheter'}</span>
                  </button>
                </div>
              ) : (
                <div className="w-full h-[38px] sm:h-[42px] rounded-[11px] sm:rounded-[13px] bg-red-50 border border-red-200/80 text-red-600 text-[10px] font-bold tracking-wider uppercase flex items-center justify-center">
                  {dict.productCard?.outOfStock || 'Rupture de stock'}
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Buy Selection Modal (multi-variant) */}
      <QuickBuyModal
        product={product}
        isOpen={isQuickBuyOpen}
        onClose={() => setIsQuickBuyOpen(false)}
      />
    </>
  );
}
