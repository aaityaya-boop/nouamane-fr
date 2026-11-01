'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePreferences } from '@/context/PreferencesContext';
import { usePathname } from 'next/navigation';
import { Clock, Trash2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/products';

export default function RecentlyViewed({ currentProductId }: { currentProductId?: number }) {
  const { recentlyViewed, clearRecentlyViewed, isLoaded } = usePreferences();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';

  useEffect(() => {
    let ids = recentlyViewed;
    // Fallback directly to localStorage if state is hydrating
    if (ids.length === 0 && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('nay_recently_viewed');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) ids = parsed;
        }
      } catch {}
    }

    // Filter out the current product from recently viewed
    const idsToFetch = ids.filter((id) => id !== currentProductId).slice(0, 8);

    if (idsToFetch.length === 0) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    fetch(`/api/products/recent?ids=${idsToFetch.join(',')}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error('[RecentlyViewed] Error fetching:', err))
      .finally(() => setIsLoading(false));
  }, [recentlyViewed, isLoaded, currentProductId]);

  if (products.length === 0) return null;

  const title =
    locale === 'ar'
      ? 'شوهدت مؤخراً'
      : locale === 'en'
      ? 'Recently Viewed'
      : 'Récemment consultés';

  const subtitle =
    locale === 'ar'
      ? 'العطور التي قمت بتصفحها مؤخراً'
      : locale === 'en'
      ? 'Perfumes you recently explored'
      : 'Les fragrances que vous avez récemment explorées';

  const clearText =
    locale === 'ar'
      ? 'مسح السجل'
      : locale === 'en'
      ? 'Clear history'
      : "Effacer l'historique";

  return (
    <section className="mt-6 sm:mt-20 border-t border-[#ECE7DC] pt-5 sm:pt-14">
      {/* Header with Title and Clear Action */}
      <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#0284c7]/10 flex items-center justify-center text-[#0284c7] shrink-0">
            <Clock size={12} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-[13px] sm:text-2xl font-bold text-[#111827] tracking-tight">
                {title}
              </h2>
              <span className="text-[9.5px] sm:text-[11px] font-bold text-[#0284c7] bg-[#0284c7]/10 px-1.5 py-0.2 rounded-full">
                {products.length}
              </span>
            </div>
            <p className="hidden sm:block text-[12px] text-[#6B6B6B] mt-0.5">{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            clearRecentlyViewed();
            setProducts([]);
          }}
          className="text-[10px] sm:text-[11px] font-medium text-[#9A9A9A] hover:text-red-600 transition flex items-center gap-1 py-1 px-2.5 rounded-full hover:bg-red-50 border border-transparent hover:border-red-100 shrink-0"
          aria-label={clearText}
        >
          <Trash2 size={11} />
          <span>{clearText}</span>
        </button>
      </div>

      {/* Mobile Minimalist Horizontal Rail */}
      <div className="sm:hidden -mx-4 px-4 overflow-x-auto no-scrollbar flex items-stretch gap-2.5 pb-2 pt-0.5">
        {products.map((product) => {
          const mainImg = product.images?.[0] || '';
          const discount = product.originalPrice && product.originalPrice > product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : null;

          return (
            <Link
              key={product.id}
              href={`/${locale}/product/${product.slug}`}
              className="w-[124px] shrink-0 group flex flex-col bg-white rounded-xl border border-[#ECE7DD] p-2 hover:border-[#0284c7]/40 shadow-2xs transition-all active:scale-[0.98]"
            >
              {/* Flacon Image Container */}
              <div className="w-full h-[108px] bg-white rounded-lg relative overflow-hidden flex items-center justify-center p-1.5 mb-1.5">
                {mainImg ? (
                  <Image
                    src={mainImg}
                    alt={product.name}
                    fill
                    sizes="124px"
                    unoptimized
                    className="object-contain p-1 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">NAY</div>
                )}
                {discount && (
                  <span className="absolute top-1 left-1 rtl:left-auto rtl:right-1 bg-[#111827] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-tight shadow-xs">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Brand & Name */}
              <span className="text-[8.5px] font-bold text-[#6B7280] uppercase tracking-wider truncate block">
                {product.brandLabel || product.brand}
              </span>
              <span className="text-[11px] font-semibold text-[#111827] truncate block group-hover:text-[#0284c7] transition-colors">
                {product.name}
              </span>

              {/* Price */}
              <div className="mt-auto pt-1 flex items-baseline gap-1">
                <span className="text-[11.5px] font-extrabold text-[#0284c7]">
                  {product.price} {locale === 'ar' ? 'د.م' : 'DH'}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[9px] text-[#9CA3AF] line-through">
                    {product.originalPrice}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop / Tablet Grid of Standard ProductCards */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <div key={product.id} className="h-full">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
