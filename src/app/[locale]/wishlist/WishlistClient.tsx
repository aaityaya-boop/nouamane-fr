'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/context/WishlistContext';
import { Product } from '@/lib/products';

type WishlistClientProps = {
  products: Product[];
  locale: string;
};

export default function WishlistClient({ products, locale }: WishlistClientProps) {
  const { wishlist, isLoaded, clearWishlist } = useWishlist();

  // Resolve slugs against verified catalogue
  const favoriteProducts = isLoaded
    ? products.filter((p) => wishlist.includes(p.slug))
    : [];

  const isArabic = locale === 'ar';

  const t = {
    eyebrow: isArabic ? 'قائمة الرغبات الخاصة' : 'Ma Sélection Privée',
    title: isArabic ? 'عطوري المفضلة' : 'Mes Favoris',
    itemsCount: (n: number) =>
      isArabic
        ? `${n} ${n === 1 ? 'عطر' : 'عطور'}`
        : `${n} ${n === 1 ? 'fragrance enregistrée' : 'fragrances enregistrées'}`,
    emptyTitle: isArabic ? 'قائمة رغباتك فارغة حالياً' : 'Votre liste de favoris est vide',
    emptyDesc: isArabic
      ? 'احفظ عطورك المفضلة بالنقر على رمز القلب لتتمكن من العودة إليها وطلبها بسهولة في أي وقت.'
      : 'Enregistrez vos parfums coups de cœur en cliquant sur l\'icône cœur pour les retrouver et les commander en toute simplicité.',
    browseShop: isArabic ? 'استكشف تشكيلة العطور' : 'Explorer la boutique',
    clearAll: isArabic ? 'إفراغ القائمة' : 'Vider mes favoris',
    clearConfirm: isArabic
      ? 'هل أنت متأكد من رغبتك في إفراغ قائمة العطور المفضلة؟'
      : 'Êtes-vous sûr de vouloir vider votre liste de favoris ?',
  };

  const handleClear = () => {
    if (window.confirm(t.clearConfirm)) {
      clearWishlist();
    }
  };

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24 sm:pt-32 pb-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* Header Title Section */}
          <div className="border-b border-[#e0ddd4] pb-6 sm:pb-8 mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9]">
                {t.eyebrow}
              </span>
              <h1 className="heading-font text-3xl sm:text-4xl lg:text-5xl mt-2 tracking-wide font-bold">
                {t.title}
              </h1>
              {isLoaded && favoriteProducts.length > 0 && (
                <p className="text-[13px] text-[#6B6B6B] mt-2">
                  {t.itemsCount(favoriteProducts.length)}
                </p>
              )}
            </div>

            {isLoaded && favoriteProducts.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[12px] font-semibold text-[#888] hover:text-red-500 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Trash2 size={15} />
                <span>{t.clearAll}</span>
              </button>
            )}
          </div>

          {/* Loading Skeleton */}
          {!isLoaded ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[#eeece5] rounded-2xl" />
              ))}
            </div>
          ) : favoriteProducts.length === 0 ? (
            /* Empty State */
            <div className="max-w-md mx-auto text-center py-16 sm:py-24 px-4 bg-white rounded-3xl border border-[#e0ddd4] shadow-xs">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-6">
                <Heart size={28} className="fill-none" />
              </div>
              <h2 className="heading-font text-2xl font-bold text-[#1A1A1A] mb-3">
                {t.emptyTitle}
              </h2>
              <p className="text-[13px] text-[#6B6B6B] leading-relaxed mb-8 max-w-sm mx-auto">
                {t.emptyDesc}
              </p>
              <Link
                href={`/${locale}/shop`}
                className="btn-blue inline-flex items-center gap-2 px-8 py-3.5 text-[13px] font-bold rounded-xl shadow-md active:scale-98"
              >
                <ShoppingBag size={16} />
                <span>{t.browseShop}</span>
              </Link>
            </div>
          ) : (
            /* Grid of Favorited Products */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {favoriteProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
