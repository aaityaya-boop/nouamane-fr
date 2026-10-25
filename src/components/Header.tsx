'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, User, Heart, Compass, Menu, X, ChevronDown, Package, ChevronRight, ShieldCheck, Truck, Sparkles, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { MAIN_CATEGORIES } from '@/lib/products';
import { useDictionary } from '@/context/DictionaryContext';
import LanguageSwitcher from './LanguageSwitcher';

const SearchModal = dynamic(() => import('./SearchModal'), { ssr: false });

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAllMobileBrands, setShowAllMobileBrands] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'women' | 'men' | 'testers' | 'unisex' | 'brands' | 'bundles' | 'originaux' | null>(null);
  const { getItemCount } = useCart();
  const pathname = usePathname();
  const dict = useDictionary();
  const cartCount = getItemCount();
  const { count: wishlistCount } = useWishlist();

  const locale = pathname?.split('/')[1] || 'fr';
  const isHome = pathname === `/${locale}`;

  const [brands, setBrands] = useState<any[]>([]);
  useEffect(() => {
    if ((activeMenu === 'brands' || isMobileMenuOpen) && brands.length === 0) {
      fetch('/api/brands')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setBrands(data);
        })
        .catch(console.error);
    }
  }, [activeMenu, isMobileMenuOpen, brands.length]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine if header should be solid white
  const isSolid = !isHome || isScrolled || activeMenu !== null || isMobileMenuOpen;

  return (
    <>
      <header
        onMouseLeave={() => setActiveMenu(null)}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isSolid ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#e0ddd4]/60' : 'bg-[#FAF9F6]/85 backdrop-blur-md border-b border-[#111]/5'
        }`}
      >

        

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* DESKTOP BAR (lg+) */}
          <div className="hidden lg:flex items-center justify-between h-[75px]">
            {/* LEFT NAV (Desktop) */}
            <nav className="flex items-center gap-5 xl:gap-7 flex-1">
              {['women', 'men', 'testers', 'originaux', 'brands', 'bundles'].map((menuKey) => {
                const labels: any = {
                  women: dict.nav?.women || 'Femme',
                  men: dict.nav?.men || 'Homme',
                  testers: dict.nav?.testers || 'Testeurs',
                  originaux: dict.nav?.originaux || 'Parfums Originaux',
                  brands: dict.nav?.brands || 'Marques',
                  bundles: dict.nav?.bundles || 'Coffrets Cadeaux'
                };
                return (
                  <div 
                    key={menuKey} 
                    className="h-full flex items-center"
                    onMouseEnter={() => setActiveMenu(menuKey as any)}
                  >
                    <button
                      className={`text-[11px] font-bold tracking-[0.12em] xl:tracking-[0.14em] uppercase transition-colors duration-300 flex items-center gap-1.5 h-[75px] border-b-2 whitespace-nowrap ${
                        activeMenu === menuKey ? 'border-[#0ea5e9] text-[#0ea5e9]' : 'border-transparent text-[#1A1A1A] hover:text-[#0ea5e9]'
                      }`}
                    >
                      {labels[menuKey]}
                    </button>
                  </div>
                );
              })}
            </nav>

            {/* LOGO (Desktop) */}
            <div className="flex-shrink-0 flex justify-center px-4">
              <Link href={`/${locale}`} aria-label="NAY Parfums - Accueil" className="group flex flex-col items-center">
                <div
                  className="w-16 h-16 lg:w-20 lg:h-20 transition-colors duration-300 group-hover:bg-[#0ea5e9] bg-[#1A1A1A]"
                  style={{
                    maskImage: 'url("/images/nay/Artboard%202.png")',
                    WebkitMaskImage: 'url("/images/nay/Artboard%202.png")',
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                  }}
                />
              </Link>
            </div>

            {/* RIGHT ICONS (Desktop) */}
            <div className="flex-1 flex items-center justify-end gap-5 lg:gap-6">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="transition-colors duration-300 text-[#1A1A1A] hover:text-[#0ea5e9] p-2"
                aria-label="Recherche"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>

              <Link
                href={`/${locale}/wishlist`}
                className="transition-colors duration-300 relative p-2 text-[#1A1A1A] hover:text-rose-500"
                aria-label={`Favoris (${wishlistCount} articles)`}
              >
                <Heart className="w-[18px] h-[18px]" strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center rounded-full leading-none">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                id="header-cart-icon"
                href={`/${locale}/cart`}
                className="transition-colors duration-300 relative p-2 text-[#1A1A1A] hover:text-[#0ea5e9]"
                aria-label={`Panier (${cartCount} articles)`}
              >
                <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#0ea5e9] text-white text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center rounded-full leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                href={`/${locale}/account`}
                className="transition-colors duration-300 text-[#1A1A1A] hover:text-[#0ea5e9] p-2"
                aria-label="Mon Compte"
              >
                <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </Link>

              <div>
                <LanguageSwitcher />
              </div>
            </div>
          </div>

          {/* MOBILE 3-ZONE BALANCED BAR (< lg) */}
          <div className="lg:hidden flex items-center justify-between h-[60px] w-full">
            {/* ZONE 1: LEFT (Menu + Search, 44px targets) */}
            <div className="flex-1 flex items-center justify-start gap-0.5">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-11 h-11 flex items-center justify-center text-[#1A1A1A] hover:text-[#0ea5e9] active:scale-95 transition-all -ml-1.5"
                aria-label={isMobileMenuOpen ? "Fermer le menu" : "Menu de navigation"}
              >
                {isMobileMenuOpen ? <X size={22} strokeWidth={1.8} /> : <Menu size={22} strokeWidth={1.8} />}
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-11 h-11 flex items-center justify-center text-[#1A1A1A] hover:text-[#0ea5e9] active:scale-95 transition-all"
                aria-label="Recherche rapide"
              >
                <Search size={20} strokeWidth={1.8} />
              </button>
            </div>

            {/* ZONE 2: CENTER (Centered NAY Logo Monogram) */}
            <div className="flex-shrink-0 flex items-center justify-center px-1">
              <Link href={`/${locale}`} aria-label="NAY Parfums - Accueil" className="group flex flex-col items-center">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 transition-colors duration-300 group-hover:bg-[#0ea5e9] bg-[#1A1A1A]"
                  style={{
                    maskImage: 'url("/images/nay/Artboard%202.png")',
                    WebkitMaskImage: 'url("/images/nay/Artboard%202.png")',
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                  }}
                />
              </Link>
            </div>

            {/* ZONE 3: RIGHT (Wishlist + Cart, 44px targets) */}
            <div className="flex-1 flex items-center justify-end gap-0.5">
              <Link
                href={`/${locale}/wishlist`}
                className="w-11 h-11 relative flex items-center justify-center text-[#1A1A1A] hover:text-rose-500 active:scale-95 transition-all"
                aria-label={`Favoris (${wishlistCount} articles)`}
              >
                <Heart size={20} strokeWidth={1.8} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center rounded-full leading-none shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                id="header-cart-icon-mobile"
                href={`/${locale}/cart`}
                className="w-11 h-11 relative flex items-center justify-center text-[#1A1A1A] hover:text-[#0ea5e9] active:scale-95 transition-all -mr-1.5"
                aria-label={`Panier (${cartCount} articles)`}
              >
                <ShoppingBag size={20} strokeWidth={1.8} />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-[#0ea5e9] text-white text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center rounded-full leading-none shadow-xs">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MEGA MENUS DESKTOP */}
        {/* ============================================================== */}
        <AnimatePresence>
          {activeMenu && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block absolute top-[60px] lg:top-[75px] left-0 right-0 bg-white/95 backdrop-blur-xl shadow-2xl border-t border-[#e0ddd4]/60"
            >
              <div 
                className="max-w-[1400px] mx-auto px-10 py-10 flex gap-16 overflow-y-auto lux-scrollbar overscroll-contain"
                style={{ maxHeight: 'calc(100vh - 100px)' }}
              >
                
                {/* --- WOMEN MEGA MENU --- */}
                {activeMenu === 'women' && (
                  <>
                    <div className="flex-1 grid grid-cols-3 gap-12">
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">Familles Olfactives</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women?sub=floral`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Floraux</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women?sub=oriental`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Orientaux</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women?sub=woody`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Boisés</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women?sub=fresh`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Frais</Link></li>
                          <li className="pt-2"><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women`} className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] flex items-center gap-1">Tous les Parfums Femme <ChevronRight size={14}/></Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">Collections & Formats</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs/women`} className="text-[13px] font-semibold text-[#0ea5e9] hover:text-[#0284c7] transition-colors flex items-center gap-2">✨ Testeurs Femme (Qualité Supérieure)</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/parfums-originaux`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Originaux Scellés</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/master-copier`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Master Copy</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Toute la Sélection Femme</Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">Marques Phares</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/brands/yves-saint-laurent`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Yves Saint Laurent</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/brands/valentino`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Valentino</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/brands/armani`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Giorgio Armani</Link></li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {/* --- MEN MEGA MENU --- */}
                {activeMenu === 'men' && (
                  <>
                    <div className="flex-1 grid grid-cols-3 gap-12">
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">Familles Olfactives</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men?sub=woody`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Boisés</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men?sub=oriental`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Orientaux</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men?sub=aromatic`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Aromatiques</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men?sub=fresh`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Frais</Link></li>
                          <li className="pt-2"><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men`} className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] flex items-center gap-1">Tous les Parfums Homme <ChevronRight size={14}/></Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">Collections & Formats</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs/men`} className="text-[13px] font-semibold text-[#0ea5e9] hover:text-[#0284c7] transition-colors flex items-center gap-2">✨ Testeurs Homme (Qualité Supérieure)</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/parfums-originaux`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Originaux Scellés</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/master-copier`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Parfums Master Copy</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Toute la Sélection Homme</Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">Marques Phares</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/brands/armani`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Giorgio Armani</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/brands/yves-saint-laurent`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Yves Saint Laurent</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/brands/valentino`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Valentino</Link></li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {/* --- TESTEURS MEGA MENU --- */}
                {activeMenu === 'testers' && (
                  <>
                    <div className="flex-1 grid grid-cols-3 gap-12">
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">Catégories Testeurs</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs/women`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors flex items-center justify-between font-medium">Testeurs Femme <ChevronRight size={14} className="text-[#9A9A9A]"/></Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs/men`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors flex items-center justify-between font-medium">Testeurs Homme <ChevronRight size={14} className="text-[#9A9A9A]"/></Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors flex items-center justify-between font-medium">Tous les Testeurs de Luxe <ChevronRight size={14} className="text-[#9A9A9A]"/></Link></li>
                          <li className="pt-2"><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs`} className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] flex items-center gap-1">Voir tout le catalogue testeurs <ChevronRight size={14}/></Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">Grandes Maisons en Testeur</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs?brand=dior`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Dior</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs?brand=chanel`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Chanel</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs?brand=yves-saint-laurent`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Yves Saint Laurent</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs?brand=tom-ford`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Tom Ford</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs?brand=armani`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Giorgio Armani</Link></li>
                        </ul>
                      </div>
                      <div className="bg-[#f8fafc] border border-[#e0ddd4] p-6 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="text-[#0ea5e9] text-[10px] font-bold uppercase tracking-widest mb-2 block">100% Flacons Authentiques</span>
                          <h4 className="heading-font text-xl text-[#1A1A1A] mb-2">Testeurs de Démonstration</h4>
                          <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                            Même jus prestigieux, même sillage et tenue irréprochable que les flacons retail, conditionnés en boîte neutre de testeur à un tarif exceptionnel.
                          </p>
                        </div>
                        <Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs`} className="mt-4 bg-[#111] text-white text-[11px] font-bold uppercase tracking-wider py-2.5 px-4 rounded-full text-center hover:bg-[#0ea5e9] transition-colors">
                          Accéder aux Testeurs
                        </Link>
                      </div>
                    </div>
                  </>
                )}

                {/* --- ORIGINAUX MEGA MENU --- */}
                {activeMenu === 'originaux' && (
                  <div className="w-full flex-1">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-6">Authenticité & Prestige</div>
                    <div className="grid grid-cols-2 gap-8">
                      <Link href={`/${locale}/parfums-originaux`} onClick={() => setActiveMenu(null)} className="group cursor-pointer flex items-center bg-[#f8fafc] border border-[#e0ddd4] p-8 rounded-xl hover:border-[#0ea5e9] hover:shadow-2xl transition-all">
                        <div className="flex-1">
                          <span className="text-[#0ea5e9] text-[10px] font-bold uppercase tracking-widest mb-3 block">Collection Scellée</span>
                          <h3 className="heading-font text-2xl text-[#1A1A1A] mb-3 group-hover:text-[#0ea5e9] transition-colors">Parfums Originaux</h3>
                          <p className="text-[13px] text-[#6B6B6B] mb-6 leading-relaxed">
                            Parfums 100% originaux dans leurs boîtes commerciales officielles scellées.
                          </p>
                          <span className="bg-[#111] text-white text-[12px] px-6 py-2.5 rounded-full inline-block group-hover:bg-[#0ea5e9] group-hover:text-white transition-all shadow-md">
                            Explorer les Originaux
                          </span>
                        </div>
                      </Link>
                      <Link href={`/${locale}/parfums-orientaux`} onClick={() => setActiveMenu(null)} className="group cursor-pointer flex items-center bg-[#f8fafc] border border-[#e0ddd4] p-8 rounded-xl hover:border-[#d97706] hover:shadow-2xl transition-all">
                        <div className="flex-1">
                          <span className="text-[#d97706] text-[10px] font-bold uppercase tracking-widest mb-3 block">Maison d'Orient</span>
                          <h3 className="heading-font text-2xl text-[#1A1A1A] mb-3 group-hover:text-[#d97706] transition-colors">Parfums Orientaux & Arabes</h3>
                          <p className="text-[13px] text-[#6B6B6B] mb-6 leading-relaxed">
                            Lattafa, Asad, Yara, Afnan, Khamrah et les plus grands chefs-d'œuvre de la parfumerie orientale.
                          </p>
                          <span className="bg-[#111] text-white text-[12px] px-6 py-2.5 rounded-full inline-block group-hover:bg-[#d97706] group-hover:text-white transition-all shadow-md">
                            Explorer les Orientaux
                          </span>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}

                {/* --- UNISEX & COFFRETS MEGA MENU --- */}
                {activeMenu === 'unisex' && (
                  <>
                    <div className="flex-1 grid grid-cols-2 gap-12">
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">Idées Cadeaux</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/coffrets`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Coffrets Cadeaux</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/coffrets`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Coffrets Découverte</Link></li>
                          <li className="pt-2"><Link onClick={() => setActiveMenu(null)} href={`/${locale}/coffrets`} className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] flex items-center gap-1">Tout voir <ChevronRight size={14}/></Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">Parfums de niche / Unisexe</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/unisex`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">Collection Privée & Unisexe</Link></li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {/* --- BRANDS MEGA MENU --- */}
                {activeMenu === 'brands' && (
                  <div className="w-full">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-6">Toutes Nos Maisons</div>
                    <div className="grid grid-cols-4 gap-6">
                      {brands.map((brand) => (
                        <Link
                          key={brand.slug}
                          href={`/${locale}/brands/${brand.slug}`}
                          onClick={() => setActiveMenu(null)}
                          className="group border border-[#e0ddd4] bg-white rounded-xl overflow-hidden hover:border-[#0ea5e9] transition-all hover:shadow-lg flex flex-col"
                        >
                          <div className="relative h-24 w-full flex items-center justify-center p-6">
                            <Image 
                              src={brand.image || `/images/brands/${brand.slug?.toLowerCase()}-logo.jpg`} 
                              alt={brand.name} 
                              fill
                              sizes="(max-width: 768px) 100vw, 200px"
                              className="object-contain p-4 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 mix-blend-multiply" 
                            />
                          </div>
                          <div className="p-3 bg-[#f8fafc] flex justify-between items-center border-t border-[#e0ddd4] mt-auto">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors line-clamp-1">{brand.label}</span>
                            <ChevronRight size={14} className="text-[#9A9A9A] group-hover:text-[#0ea5e9] transition-colors flex-shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* --- BUNDLES MEGA MENU --- */}
                {activeMenu === 'bundles' && (
                  <div className="w-full flex-1">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-6">Nos Éditions Spéciales</div>
                    <div className="grid grid-cols-1 gap-12">
                      {/* Coffrets Cadeaux Card */}
                      <Link href={`/${locale}/coffrets`} onClick={() => setActiveMenu(null)} className="group cursor-pointer flex items-center bg-[#f8fafc] border border-[#e0ddd4] p-8 rounded-xl hover:border-[#9E1B1B] hover:shadow-2xl transition-all">
                        <div className="flex-1">
                          <span className="text-[#9E1B1B] text-[10px] font-bold uppercase tracking-widest mb-3 block">Offrez l'Inoubliable</span>
                          <h3 className="heading-font text-3xl text-[#1A1A1A] mb-4 group-hover:text-[#9E1B1B] transition-colors">Découvrez Nos Coffrets Cadeaux</h3>
                          <p className="text-[14px] text-[#6B6B6B] mb-8 leading-relaxed max-w-lg">
                            Des assemblages uniques de nos fragrances les plus prestigieuses. Présentés dans des écrins luxueux, nos coffrets sont l'expression parfaite de l'élégance à offrir ou à s'offrir.
                          </p>
                          <span className="bg-[#111] text-white text-[13px] px-8 py-3 rounded-full inline-block group-hover:bg-[#9E1B1B] group-hover:text-white transition-all shadow-md group-hover:shadow-lg">
                            Explorer la Collection
                          </span>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="lg:hidden bg-white border-t border-[#e0ddd4] overflow-y-auto shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 60px)' }}
            >
              <div className="px-5 py-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] space-y-6">
                {/* Drawer Top Header: Language Switcher & Quick Close */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#e0ddd4]/70">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A]">
                      {dict.common?.language || 'Langue'}
                    </span>
                    <LanguageSwitcher />
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-10 h-10 rounded-full bg-[#f4f3ef] hover:bg-[#e0ddd4] flex items-center justify-center text-[#1A1A1A] transition-colors active:scale-95"
                    aria-label="Fermer le menu"
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>

                {/* Instant Mobile Search Bar */}
                <div 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="flex items-center gap-3 bg-[#f8fafc] border border-[#e0ddd4] rounded-2xl px-4 py-3.5 cursor-text hover:border-[#0ea5e9] transition-colors shadow-xs"
                >
                  <Search className="w-5 h-5 text-[#0ea5e9]" />
                  <span className="text-[13px] text-[#6B6B6B] flex-1 font-medium">
                    {dict.nav?.searchPlaceholder || 'Rechercher un parfum, une marque...'}
                  </span>
                </div>

                {/* Collections Exclusives Block */}
                <div className="rounded-2xl bg-gradient-to-br from-[#faf9f6] via-white to-[#f4f3ef] border border-[#e0ddd4] p-4 space-y-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#1A1A1A]">
                      {dict.nav?.collections || 'Collections Privées'}
                    </span>
                  </div>

                  <Link 
                    href={`/${locale}/testeurs`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e0ddd4]/80 text-[#0ea5e9] font-bold text-[14px] shadow-xs hover:border-[#0ea5e9] transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#0ea5e9]" />
                      <span>{dict.nav?.testersLuxury || 'Testeurs de Luxe (Authentiques)'}</span>
                    </span>
                    <ChevronRight size={16} className="rtl:rotate-180 text-[#0ea5e9]" />
                  </Link>

                  <Link 
                    href={`/${locale}/parfums-originaux`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e0ddd4]/80 text-[#1A1A1A] font-semibold text-[13.5px] hover:text-[#0ea5e9] transition-all"
                  >
                    <span>{dict.nav?.originauxSealed || 'Parfums Originaux Scellés'}</span>
                    <ChevronRight size={16} className="rtl:rotate-180 text-[#9A9A9A]" />
                  </Link>

                  <Link 
                    href={`/${locale}/parfums-orientaux`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e0ddd4]/80 text-[#1A1A1A] font-semibold text-[13.5px] hover:text-[#0ea5e9] transition-all"
                  >
                    <span>{dict.nav?.orientalArab || 'Parfums Orientaux & Arabes'}</span>
                    <ChevronRight size={16} className="rtl:rotate-180 text-[#9A9A9A]" />
                  </Link>

                  <Link 
                    href={`/${locale}/coffrets`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e0ddd4]/80 text-[#1A1A1A] font-semibold text-[13.5px] hover:text-[#0ea5e9] transition-all"
                  >
                    <span>{dict.nav?.bundles || 'Coffrets Cadeaux'}</span>
                    <ChevronRight size={16} className="rtl:rotate-180 text-[#9A9A9A]" />
                  </Link>

                  <Link 
                    href={`/${locale}/shop`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1A1A1A] text-white font-bold text-[13px] tracking-wider uppercase shadow-md active:scale-98 transition-all mt-1"
                  >
                    <span>{dict.nav?.allBoutique || 'Toute La Boutique'}</span>
                    <ChevronRight size={16} className="rtl:rotate-180 text-white" />
                  </Link>
                </div>

                {/* Luxury Reassurance Banner */}
                <div className="bg-[#f0f9ff] border border-sky-200/70 rounded-2xl p-3.5 space-y-1.5 text-center">
                  <div className="text-[11px] font-bold text-[#0369a1] flex items-center justify-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#0ea5e9]" />
                    <span>0 DH d'avance · Essayez avant de payer</span>
                  </div>
                  <p className="text-[10px] text-sky-800/80 leading-relaxed">
                    Livraison 24–48h partout au Maroc avec inspection du colis avant paiement.
                  </p>
                </div>

                {/* Gender Universes */}
                <div className="space-y-4">
                  {MAIN_CATEGORIES.map((cat) => {
                    const catTitle = cat.slug === 'women' ? (dict.categories?.womenLabel || cat.label)
                      : cat.slug === 'men' ? (dict.categories?.menLabel || cat.label)
                      : (dict.categories?.unisexLabel || cat.label);
                    return (
                      <div key={cat.slug} className="border-b border-[#e0ddd4]/70 pb-4 last:border-0 last:pb-0">
                        <Link 
                          href={`/${locale}/shop/${cat.slug}`} 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="heading-font text-xl text-[#1A1A1A] font-bold flex items-center justify-between mb-2.5"
                        >
                          <span>{catTitle}</span>
                          <ChevronRight size={15} className="rtl:rotate-180 text-[#9A9A9A]" />
                        </Link>
                        <div className="grid grid-cols-2 gap-2 pl-2 rtl:pl-0 rtl:pr-2">
                          {cat.subcategories.map(sub => {
                            const rawLabel = (sub as any).label;
                            const subLabel = sub.key === 'floral' ? (dict.categories?.subFloral || rawLabel)
                              : sub.key === 'oriental' ? (dict.categories?.subOriental || rawLabel)
                              : sub.key === 'fresh' ? (dict.categories?.subFresh || rawLabel)
                              : sub.key === 'woody' ? (dict.categories?.subWoody || rawLabel)
                              : sub.key === 'aromatic' ? (dict.categories?.subAromatic || rawLabel)
                              : rawLabel;
                            return (
                              <Link 
                                key={sub.slug}
                                href={`/${locale}/shop/${cat.slug}?sub=${sub.slug}`} 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-[13px] text-[#6B6B6B] hover:text-[#0ea5e9] py-1 transition-colors"
                              >
                                {subLabel}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Brands Preview */}
                <div className="border-b border-[#e0ddd4]/70 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="heading-font text-xl text-[#1A1A1A] font-bold">{dict.nav?.brands || 'Marques'}</div>
                    {brands.length > 4 && (
                      <button
                        onClick={() => setShowAllMobileBrands(!showAllMobileBrands)}
                        className="text-[#0ea5e9] text-xs font-bold px-2 py-1"
                      >
                        {showAllMobileBrands ? (dict.nav?.seeLess || 'Voir moins') : (dict.nav?.seeMore || 'Voir plus')}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(showAllMobileBrands ? brands : brands.slice(0, 4)).map(brand => (
                      <Link 
                        key={brand.slug}
                        href={`/${locale}/brands/${brand.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex flex-col items-center justify-center border border-[#e0ddd4] bg-[#f8fafc] rounded-xl p-2.5 hover:border-[#0ea5e9] transition-colors"
                      >
                        <div className="relative w-full h-8 mb-1.5">
                          <Image 
                            src={brand.image || `/images/brands/${brand.slug?.toLowerCase()}-logo.jpg`} 
                            alt={brand.name} 
                            fill
                            sizes="(max-width: 768px) 50vw, 100px"
                            className="object-contain mix-blend-multiply grayscale opacity-70" 
                          />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] text-center line-clamp-1">{brand.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* VIP WhatsApp Concierge & Support */}
                <a
                  href="https://wa.me/212663380011?text=Bonjour%20NAY%20Parfum,%20je%20souhaite%20des%20conseils%20ou%20passer%20une%20commande."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] py-3.5 px-4 rounded-2xl shadow-md active:scale-98 transition-all"
                >
                  <MessageCircle size={18} />
                  <span>Assistance VIP WhatsApp (Conseil & Commande)</span>
                </a>

                {/* Mobile Secondary Utility Nav */}
                <div className="pt-2 flex flex-col gap-3.5 text-[#1A1A1A]">
                  <Link
                    href={`/${locale}/suivi-commande`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between text-[14px] font-medium text-[#1A1A1A] p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-[#0ea5e9]" />
                      <span>{dict.nav?.trackOrder || 'Suivi de commande'}</span>
                    </span>
                    <ChevronRight size={15} className="text-[#9A9A9A] rtl:rotate-180" />
                  </Link>

                  <Link
                    href={`/${locale}/wishlist`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between text-[14px] font-medium text-[#1A1A1A] p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>{dict.nav?.wishlist || 'Mes Favoris'}</span>
                    </span>
                    <span className="text-[11px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  </Link>

                  <Link
                    href={`/${locale}/account`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between text-[14px] font-medium text-[#1A1A1A] p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <User className="w-4 h-4 text-[#6B6B6B]" />
                      <span>{dict.nav?.account || 'Mon Compte'}</span>
                    </span>
                    <ChevronRight size={15} className="text-[#9A9A9A] rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* SEARCH MODAL */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
