'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Star, Flower, Sun, Leaf, Snowflake, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatMAD, type Product, isProductInStock } from '@/lib/products';

type ProductCardProps = {
  product: Product;
  showRating?: boolean;
  onQuickView?: (product: Product) => void;
};

export default function ProductCard({ product, showRating = true, onQuickView }: ProductCardProps) {
  const { addToCart } = useCart();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const inStock = isProductInStock(product);
  const isBestseller = product.tags.includes('bestseller');
  const isNew = product.tags.includes('new-arrival') && product.subcategory !== 'coffrets';
  const isDiscounted = !!product.originalPrice && product.originalPrice > product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addToCart(
      {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        price: product.price,
        images: product.images,
        inStock: product.inStock,
        stock: product.stock,
      },
      1,
      product.sizes[0]?.label || '50ml'
    );
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0.01, y: 30 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="h-full js-fallback-opacity"
    >
      <Link
        href={`/${locale}/product/${product.slug}`}
        className="product-card group block h-full bg-white border border-[#e0ddd4] rounded-[24px] overflow-hidden hover:border-[#1A1A1A]/20 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-700 ease-out"
      >
        <div className="relative h-[340px] lg:h-[380px] overflow-hidden bg-[#f8fafc]">
        <Image
          src={product.images[0]}
          alt={`Parfum ${product.name} au Maroc - NAY Parfums`}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover perfume-bottle group-hover:scale-110 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
        />
        
        {/* Subtle Dark Gradient that sweeps up on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Hidden 'Aperçu Rapide' button that slides up */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full px-6 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 z-30">
          {!inStock ? (
            <span className="bg-white/95 backdrop-blur-sm text-red-600 border border-red-200 text-[10px] font-bold tracking-widest uppercase px-6 py-3 rounded-full whitespace-nowrap shadow-xl">
              Rupture de stock
            </span>
          ) : onQuickView ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="w-full bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-[10px] font-bold tracking-widest uppercase py-3 rounded-full shadow-xl hover:bg-[#1A1A1A] hover:text-white transition-colors flex justify-center items-center"
            >
              Aperçu Rapide
            </button>
          ) : (
            <span className="bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-[10px] font-bold tracking-widest uppercase px-6 py-3 rounded-full whitespace-nowrap shadow-xl">
              Découvrir la fragrance
            </span>
          )}
        </div>

        {!inStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4">
            <span className="text-[11px] font-bold tracking-widest text-red-600 uppercase bg-white border border-red-200 px-4 py-2 rounded-full shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Rupture de stock
            </span>
          </div>
        )}

        {/* Brand badge (top-left) */}
        <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5 z-20">
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase bg-white border border-[#e0ddd4]/95 backdrop-blur-sm text-[#1A1A1A] px-3 py-1.5 rounded-full shadow-sm">
            {product.brandLabel}
          </span>
          {product.perfectSeason && (
            <span className="text-[8px] font-semibold tracking-[0.15em] uppercase bg-[#fafaf7]/90 border border-[#e0ddd4] backdrop-blur-sm text-[#6B6B6B] px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              {product.perfectSeason === 'Printemps' && <Flower size={10} />}
              {product.perfectSeason === 'Été' && <Sun size={10} />}
              {product.perfectSeason === 'Automne' && <Leaf size={10} />}
              {product.perfectSeason === 'Hiver' && <Snowflake size={10} />}
              {product.perfectSeason === 'Toutes Saisons' && <Sparkles size={10} />}
              {product.perfectSeason}
            </span>
          )}
        </div>

        {/* Bestseller / New ribbon (top-right) */}
        {(isBestseller || isNew || isDiscounted) && (
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
            {isDiscounted && (
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase bg-red-500 text-white px-3 py-1.5 rounded-full">
                Promo
              </span>
            )}
            {isBestseller && (
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase bg-[#f8fafc] text-white px-3 py-1.5 rounded-full">
                Bestseller
              </span>
            )}
            {isNew && !isBestseller && (
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase bg-[#0ea5e9] text-white px-3 py-1.5 rounded-full">
                Nouveau
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-5 lg:px-6 py-6 lg:py-7 relative bg-white">
        <h3 className="heading-font text-xl lg:text-[22px] font-medium text-[#1A1A1A] tracking-wide leading-tight group-hover:text-[#0ea5e9] transition-colors duration-500">
          {product.name}
        </h3>
        <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#9A9A9A] mt-2">
          {product.subcategoryLabel} · {product.gender === 'women' ? 'Femme' : product.gender === 'men' ? 'Homme' : 'Mixte'}
        </p>

        {showRating && (
          <div className="flex items-center gap-2 mt-3">
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
            <span className="text-[11px] text-[#9A9A9A]">
              {Number(product.rating).toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold text-[#1A1A1A]">
              {formatMAD(product.price)}
            </span>
            {isDiscounted && product.originalPrice && (
              <span className="text-[12px] text-[#9A9A9A] line-through">
                {formatMAD(product.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-[#9A9A9A]">
            {product.sizes[Math.min(1, product.sizes.length - 1)]?.label || '50ml'}
          </span>
        </div>
      </div>
      </Link>
    </motion.div>
  );
}
