'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, User, Menu, X, ChevronDown, Package, ChevronRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { useCart } from '@/context/CartContext';
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

  const locale = pathname?.split('/')[1] || 'fr';
  const isHome = pathname === `/${locale}`;

  const [brands, setBrands] = useState<any[]>([]);
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    const fetchBrands = () => {
      if (brands.length === 0) {
        fetch('/api/brands')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setBrands(data);
          })
          .catch(console.error);
      }
    };

    if (activeMenu === 'brands' || isMobileMenuOpen) {
      fetchBrands();
    } else {
      timer = setTimeout(fetchBrands, 3500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
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
          isSolid ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-[#e0ddd4]/60' : 'bg-transparent'
        }`}
      >

        

        <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-[60px] lg:h-[75px]">
            {/* LEFT NAV (Desktop) */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7 flex-1">
              {['women', 'men', 'testers', 'originaux', 'brands', 'bundles'].map((menuKey) => {
                const labels: any = { women: 'Femme', men: 'Homme', testers: 'Testeurs', originaux: 'Parfums Originaux', brands: 'Marques', bundles: 'Coffrets Cadeaux' };
                return (
                  <div 
                    key={menuKey} 
                    className="h-full flex items-center"
                    onMouseEnter={() => setActiveMenu(menuKey as any)}
                  >
                    <button
                      className={`text-[11px] font-bold tracking-[0.12em] xl:tracking-[0.14em] uppercase transition-colors duration-300 flex items-center gap-1.5 h-[75px] border-b-2 whitespace-nowrap ${
                        activeMenu === menuKey ? 'border-[#0ea5e9] text-[#0ea5e9]' : 'border-transparent ' + (isSolid ? 'text-[#1A1A1A]' : 'text-white hover:text-white/80')
                      }`}
                    >
                      {labels[menuKey]}
                    </button>
                  </div>
                );
              })}

            </nav>

            {/* LOGO */}
            <div className="flex-shrink-0 flex justify-center px-4">
              <Link href={`/${locale}`} aria-label="NAY Parfums - Accueil" className="group flex flex-col items-center">
                <div
                  className={`w-16 h-16 lg:w-20 lg:h-20 transition-colors duration-300 group-hover:bg-[#0ea5e9] ${
                    isSolid ? 'bg-[#1A1A1A]' : 'bg-white'
                  }`}
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

            {/* RIGHT ICONS */}
            <div className="flex-1 flex items-center justify-end gap-5 lg:gap-6">
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`hidden lg:block transition-colors duration-300 ${
                  isSolid ? 'text-[#1A1A1A] hover:text-[#0ea5e9]' : 'text-white hover:text-white/80'
                }`}
                aria-label="Recherche"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>

              <Link
                id="header-cart-icon"
                href={`/${locale}/cart`}
                className={`transition-colors duration-300 relative flex items-center justify-center min-w-[44px] min-h-[44px] -mr-1 ${
                  isSolid ? 'text-[#1A1A1A] hover:text-[#0ea5e9]' : 'text-white hover:text-white/80'
                }`}
                aria-label={`Panier (${cartCount} articles)`}
              >
                <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-[#0ea5e9] text-white text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center rounded-full leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                href={`/${locale}/account`}
                className={`hidden lg:block transition-colors duration-300 ${
                  isSolid ? 'text-[#1A1A1A] hover:text-[#0ea5e9]' : 'text-white hover:text-white/80'
                }`}
                aria-label="Mon Compte"
              >
                <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </Link>

              <div className="hidden lg:block">
                <LanguageSwitcher />
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 ${isSolid ? 'text-[#1A1A1A]' : 'text-white'}`}
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
              </button>
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
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs/women`} className="text-[13px] font-semibold text-[#0ea5e9] hover:text-[#0284c7] transition-colors flex items-center gap-2">✨ Testeurs Femme (100% Authentiques)</Link></li>
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
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs/men`} className="text-[13px] font-semibold text-[#0ea5e9] hover:text-[#0284c7] transition-colors flex items-center gap-2">✨ Testeurs Homme (100% Authentiques)</Link></li>
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
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors flex items-center justify-between font-medium">Tous les Testeurs Originaux <ChevronRight size={14} className="text-[#9A9A9A]"/></Link></li>
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
              className="lg:hidden bg-white border-t border-[#e0ddd4] overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 60px)' }}
            >
              <div className="px-6 py-8 space-y-8">
                {/* Mobile Search Bar */}
                <div 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="flex items-center gap-3 bg-[#f8fafc] border border-[#e0ddd4] rounded-xl px-4 py-3 cursor-text"
                >
                  <Search className="w-5 h-5 text-[#9A9A9A]" />
                  <span className="text-[14px] text-[#9A9A9A]">Rechercher un parfum, une marque...</span>
                </div>

                {/* Mobile Categories */}
                <div className="space-y-6">
                  {/* EXPLORER SECTION (Added for Mobile) */}
                  <div className="border-b border-[#e0ddd4] pb-6 bg-[#f8fafc] -mx-6 px-6 pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
                      <div className="heading-font text-2xl text-[#1A1A1A]">Collections</div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 pl-4 border-l-2 border-[#0ea5e9]/50">
                      <Link 
                        href={`/${locale}/testeurs`} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[15px] font-bold text-[#0ea5e9] flex items-center justify-between"
                      >
                        ✨ Testeurs de Luxe (Authentiques) <ChevronRight size={16} />
                      </Link>
                      <Link 
                        href={`/${locale}/parfums-originaux`} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[14px] font-medium text-[#1A1A1A] flex items-center justify-between"
                      >
                        Parfums Originaux Scellés <ChevronRight size={16} />
                      </Link>
                      <Link 
                        href={`/${locale}/parfums-orientaux`} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[14px] font-medium text-[#1A1A1A] flex items-center justify-between"
                      >
                        Parfums Orientaux & Arabes <ChevronRight size={16} />
                      </Link>
                      <Link 
                        href={`/${locale}/coffrets`} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[14px] font-medium text-[#1A1A1A] flex items-center justify-between"
                      >
                        Coffrets Cadeaux <ChevronRight size={16} />
                      </Link>
                      <Link 
                        href={`/${locale}/master-copier`} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[14px] text-[#555] flex items-center justify-between"
                      >
                        Parfums Master Copy <ChevronRight size={16} />
                      </Link>
                      <Link 
                        href={`/${locale}/shop`} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[14px] font-bold text-[#111] uppercase tracking-wider flex items-center justify-between pt-2 border-t border-[#e0ddd4]"
                      >
                        Toute La Boutique (Tous les parfums) <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>

                  {MAIN_CATEGORIES.map((cat) => (
                    <div key={cat.slug} className="border-b border-[#e0ddd4] pb-6 last:border-0 last:pb-0">
                      <Link 
                        href={`/${locale}/shop/${cat.slug}`} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="heading-font text-2xl text-[#1A1A1A] block mb-4"
                      >
                        {cat.label}
                      </Link>
                      <div className="grid grid-cols-2 gap-3 pl-2">
                        {cat.subcategories.map(sub => (
                          <Link 
                            key={sub.slug}
                            href={`/${locale}/shop/${cat.slug}?sub=${sub.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-[14px] text-[#6B6B6B]"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="border-b border-[#e0ddd4] pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="heading-font text-2xl text-[#1A1A1A]">Marques</div>
                      {brands.length > 4 && (
                        <button
                          onClick={() => setShowAllMobileBrands(!showAllMobileBrands)}
                          className="text-[#9E1B1B] text-sm font-semibold px-2 py-1 flex items-center gap-1"
                        >
                          {showAllMobileBrands ? '(-) Voir moins' : '(+) Voir plus'}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-2">
                      {(showAllMobileBrands ? brands : brands.slice(0, 4)).map(brand => (
                        <Link 
                          key={brand.slug}
                          href={`/${locale}/brands/${brand.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex flex-col items-center justify-center border border-[#e0ddd4] bg-[#f8fafc] rounded-lg p-3 hover:border-[#0ea5e9] transition-colors"
                        >
                          <div className="relative w-full h-10 mb-2">
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

                  <div className="border-b border-[#e0ddd4] pb-6">
                    <Link 
                      href={`/${locale}/coffrets`} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="heading-font text-2xl text-[#1A1A1A] flex items-center gap-3 mb-2"
                    >
                      Coffrets Cadeaux
                    </Link>
                    <p className="text-[13px] text-[#9A9A9A]">Découvrez nos packs exclusifs (Jour & Nuit, Découverte...)</p>
                  </div>
                </div>

                {/* Mobile Footer Nav */}
                <div className="pt-6 border-t border-[#e0ddd4] flex flex-col gap-5">
                  <Link
                    href={`/${locale}/suivi-commande`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-[15px] font-medium text-[#1A1A1A]"
                  >
                    <Package className="w-5 h-5 text-[#6B6B6B]" /> Suivi de commande
                  </Link>
                  <Link
                    href={`/${locale}/account`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-[15px] font-medium text-[#1A1A1A]"
                  >
                    <User className="w-5 h-5 text-[#6B6B6B]" /> Mon Compte
                  </Link>
                  <Link
                    href={`/${locale}/cart`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-[15px] font-medium text-[#1A1A1A]"
                  >
                    <ShoppingBag className="w-5 h-5 text-[#6B6B6B]" /> Mon Panier ({cartCount})
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
