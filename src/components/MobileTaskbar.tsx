'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Search, ShoppingBag, Heart } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

const SearchModal = dynamic(() => import('./SearchModal'), { ssr: false });

export default function MobileTaskbar() {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const isAr = locale === 'ar';
  
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  const { count: wishlistCount } = useWishlist();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Determine active tab
  const isCheckout = pathname?.includes('/checkout') || pathname?.includes('/order-confirmation');
  const isProduct = pathname?.includes('/product/');
  if (isCheckout || isProduct) return null;

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/` || pathname === '/';
  const isShop = pathname?.includes('/shop') || pathname?.includes('/parfums-originaux') || pathname?.includes('/testeurs');
  const isCart = pathname?.includes('/cart');
  const isWishlist = pathname?.includes('/wishlist');

  return (
    <>
      <nav
        aria-label="Navigation mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/92 backdrop-blur-2xl border-t border-[#ECEAE4]/90 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] px-2 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] transition-all select-none print:hidden rounded-t-[22px]"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-end">
          
          {/* TAB 1: Accueil */}
          <Link
            href={`/${locale}`}
            className={`flex flex-col items-center justify-center pb-1 transition-all duration-200 active:scale-90 ${
              isHome ? 'text-[#111827]' : 'text-[#64748b] hover:text-[#111827]'
            }`}
          >
            <div className="relative flex flex-col items-center justify-center h-6">
              <Home 
                size={20} 
                strokeWidth={isHome ? 2.3 : 1.7} 
                className={isHome ? 'text-[#111827]' : 'text-[#64748b]'} 
              />
              {isHome && (
                <span className="absolute -bottom-1.5 w-1.5 h-1 rounded-full bg-[#0284c7]" />
              )}
            </div>
            <span className={`text-[10px] mt-1.5 tracking-tight leading-none ${
              isHome ? 'font-bold text-[#111827]' : 'font-medium text-[#64748b]'
            } ${isAr ? 'font-arabic' : 'font-body-modern'}`}>
              {isAr ? 'الرئيسية' : 'Accueil'}
            </span>
          </Link>

          {/* TAB 2: Boutique */}
          <Link
            href={`/${locale}/shop`}
            className={`flex flex-col items-center justify-center pb-1 transition-all duration-200 active:scale-90 ${
              isShop ? 'text-[#111827]' : 'text-[#64748b] hover:text-[#111827]'
            }`}
          >
            <div className="relative flex flex-col items-center justify-center h-6">
              <Compass 
                size={20} 
                strokeWidth={isShop ? 2.3 : 1.7} 
                className={isShop ? 'text-[#111827]' : 'text-[#64748b]'} 
              />
              {isShop && (
                <span className="absolute -bottom-1.5 w-1.5 h-1 rounded-full bg-[#0284c7]" />
              )}
            </div>
            <span className={`text-[10px] mt-1.5 tracking-tight leading-none ${
              isShop ? 'font-bold text-[#111827]' : 'font-medium text-[#64748b]'
            } ${isAr ? 'font-arabic' : 'font-body-modern'}`}>
              {isAr ? 'المتجر' : 'Boutique'}
            </span>
          </Link>

          {/* TAB 3 (CENTER): PANIER - Elevated Luxury Medallion */}
          <Link
            href={`/${locale}/cart`}
            aria-label={isAr ? `السلة (${cartCount} منتجات)` : `Panier (${cartCount} articles)`}
            className="relative flex flex-col items-center justify-center -mt-5 group"
          >
            <div
              className={`w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ring-[3.5px] ring-white ${
                isCart
                  ? 'bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] text-white shadow-[0_8px_20px_-2px_rgba(2,132,199,0.45)]'
                  : 'bg-gradient-to-b from-[#1e293b] to-[#0f172a] text-white shadow-[0_8px_20px_-2px_rgba(15,23,42,0.35)] group-hover:from-[#0f172a] group-hover:to-black'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <ShoppingBag 
                  size={21} 
                  strokeWidth={2.1} 
                  className="text-white drop-shadow-xs" 
                />
                {cartCount > 0 && (
                  <span className="absolute -top-3.5 -right-3.5 min-w-[19px] h-[19px] px-1 bg-[#0284c7] text-white text-[9.5px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white shadow-md leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-[10px] mt-1.5 tracking-tight leading-none ${
              isCart ? 'font-bold text-[#0284c7]' : 'font-semibold text-[#0f172a]'
            } ${isAr ? 'font-arabic' : 'font-body-modern'}`}>
              {isAr ? 'السلة' : 'Panier'}
            </span>
          </Link>

          {/* TAB 4: Recherche */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label={isAr ? "البحث في العطور" : "Rechercher un parfum"}
            className="flex flex-col items-center justify-center pb-1 transition-all duration-200 active:scale-90 text-[#64748b] hover:text-[#111827] cursor-pointer"
          >
            <div className="relative flex flex-col items-center justify-center h-6">
              <Search size={20} strokeWidth={1.8} />
            </div>
            <span className={`text-[10px] mt-1.5 tracking-tight leading-none font-medium text-[#64748b] ${
              isAr ? 'font-arabic' : 'font-body-modern'
            }`}>
              {isAr ? 'بحث' : 'Recherche'}
            </span>
          </button>

          {/* TAB 5: Wishlist / Favoris (Replacing 3 points with direct Wishlist access) */}
          <Link
            href={`/${locale}/wishlist`}
            aria-label={isAr ? `المفضلة (${wishlistCount} منتجات)` : `Favoris (${wishlistCount} articles)`}
            className={`flex flex-col items-center justify-center pb-1 transition-all duration-200 active:scale-90 ${
              isWishlist ? 'text-rose-500' : 'text-[#64748b] hover:text-[#111827]'
            }`}
          >
            <div className="relative flex flex-col items-center justify-center h-6">
              <Heart 
                size={20} 
                strokeWidth={isWishlist ? 2.2 : 1.7} 
                className={isWishlist ? 'text-rose-500 fill-rose-500' : 'text-[#64748b]'} 
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold bg-rose-500 text-white shadow-2xs leading-none">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
              {isWishlist && (
                <span className="absolute -bottom-1.5 w-1.5 h-1 rounded-full bg-rose-500" />
              )}
            </div>
            <span className={`text-[10px] mt-1.5 tracking-tight leading-none ${
              isWishlist ? 'font-bold text-rose-500' : 'font-medium text-[#64748b]'
            } ${isAr ? 'font-arabic' : 'font-body-modern'}`}>
              {isAr ? 'المفضلة' : 'Favoris'}
            </span>
          </Link>

        </div>
      </nav>

      {/* Interactive Search Modal triggered from Taskbar */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
