'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, User, Heart, Compass, Menu, X, MoreHorizontal, ChevronDown, Package, ChevronRight, ShieldCheck, Truck, MessageCircle, Crown, Gift, Flower2, Gem, TreePine, Leaf, Moon, Wind, Droplets } from 'lucide-react';
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
  const [activeGenderTab, setActiveGenderTab] = useState<'men' | 'women' | 'unisex'>('men');
  const { getItemCount } = useCart();
  const pathname = usePathname();
  const dict = useDictionary();
  const cartCount = getItemCount();
  const { count: wishlistCount } = useWishlist();

  const locale = pathname?.split('/')[1] || 'fr';
  const isAr = locale === 'ar';
  const isEn = locale === 'en';
  const isHome = pathname === `/${locale}`;

  const menuT = {
    olfactoryFamilies: isAr ? 'العائلات العطرية' : isEn ? 'Olfactory Families' : 'Familles Olfactives',
    collectionsFormats: isAr ? 'التشكيلات والأنواع' : isEn ? 'Collections & Formats' : 'Collections & Formats',
    flagshipBrands: isAr ? 'أشهر الماركات' : isEn ? 'Iconic Houses' : 'Marques Phares',
    testerCategories: isAr ? 'فئات التيستور' : isEn ? 'Tester Categories' : 'Catégories Testeurs',
    housesTesters: isAr ? 'أفخم العطور تيستور' : isEn ? 'Houses in Tester' : 'Grandes Maisons en Testeur',
    authenticityTitle: isAr ? 'الأصالة والامتياز' : isEn ? 'Authenticity & Prestige' : 'Authenticité & Prestige',
    allHouses: isAr ? 'جميع دور العطور' : isEn ? 'All Fragrance Houses' : 'Toutes Nos Maisons',
    giftIdeas: isAr ? 'أفكار هدايا فاخرة' : isEn ? 'Gift Ideas' : 'Idées Cadeaux',
    privateNiche: isAr ? 'عطور النيش وتشكيلة خاصة' : isEn ? 'Niche & Private Blends' : 'Parfums de niche / Unisexe',
    
    floral: isAr ? 'عطور زهرية' : isEn ? 'Floral Fragrances' : 'Parfums Floraux',
    oriental: isAr ? 'عطور شرقية' : isEn ? 'Oriental Fragrances' : 'Parfums Orientaux',
    woody: isAr ? 'عطور خشبية' : isEn ? 'Woody Fragrances' : 'Parfums Boisés',
    fresh: isAr ? 'عطور منعشة' : isEn ? 'Fresh & Citrus Fragrances' : 'Parfums Frais',
    aromatic: isAr ? 'عطور عشبية وأروماتك' : isEn ? 'Aromatic & Herbal' : 'Parfums Aromatiques',
    
    allWomen: isAr ? 'جميع عطور النساء' : isEn ? "All Women's Fragrances" : 'Tous les Parfums Femme',
    allMen: isAr ? 'جميع عطور الرجال' : isEn ? "All Men's Fragrances" : 'Tous les Parfums Homme',
    
    testersWomen: isAr ? '✨ تيستور نسائي (جودة عالية)' : isEn ? "✨ Women's Testers (Superior Quality)" : '✨ Testeurs Femme (Qualité Supérieure)',
    testersMen: isAr ? '✨ تيستور رجالي (جودة عالية)' : isEn ? "✨ Men's Testers (Superior Quality)" : '✨ Testeurs Homme (Qualité Supérieure)',
    allTesters: isAr ? 'جميع عطور التيستور الفاخرة' : isEn ? 'All Luxury Testers' : 'Tous les Testeurs de Luxe',
    seeAllTesters: isAr ? 'عرض دليل التيستور بالكامل' : isEn ? 'View All Testers Catalog' : 'Voir tout le catalogue testeurs',
    
    originauxSealed: isAr ? 'عطور أصلية بكرتونتها ومختومة' : isEn ? 'Sealed Original Perfumes' : 'Parfums Originaux Scellés',
    masterCopy: isAr ? 'عطور ماستر كوبي' : isEn ? 'Master Copy Perfumes' : 'Parfums Master Copy',
    allWomenSelection: isAr ? 'تشكيلة النساء الكاملة' : isEn ? "Full Women's Selection" : 'Toute la Sélection Femme',
    allMenSelection: isAr ? 'تشكيلة الرجال الكاملة' : isEn ? "Full Men's Selection" : 'Toute la Sélection Homme',
    
    testerBannerBadge: isAr ? 'قوارير أصلية 100%' : isEn ? '100% Authentic Flacons' : '100% Flacons Authentiques',
    testerBannerTitle: isAr ? 'عطور التيستور الأصلية' : isEn ? 'Authentic Factory Testers' : 'Testeurs de Démonstration',
    testerBannerDesc: isAr ? 'نفس الزيوت الأصلية ونفس الثبات الفواح، في علب التيستور المعتمدة بسعر استثنائي.' : isEn ? 'Identical luxury juice, notes, and 8-14h sillage in neutral tester packaging at up to 70% privilege savings.' : 'Même jus prestigieux, même sillage et tenue irréprochable que les flacons retail, conditionnés en boîte neutre de testeur à un tarif exceptionnel.',
    testerBannerCta: isAr ? 'اكتشف التيستور' : isEn ? 'Explore Testers' : 'Accéder aux Testeurs',
    
    originauxBadge: isAr ? 'تشكيلة مختومة' : isEn ? 'Sealed Collection' : 'Collection Scellée',
    originauxTitle: isAr ? 'عطور أصلية مختومة' : isEn ? 'Sealed Original Perfumes' : 'Parfums Originaux',
    originauxDesc: isAr ? 'عطور أصلية 100% في علبها التجارية الرسمية والمختومة.' : isEn ? '100% genuine retail perfumes in official manufacturer sealed boxes.' : 'Parfums 100% originaux dans leurs boîtes commerciales officielles scellées.',
    originauxCta: isAr ? 'استكشف الأصلي' : isEn ? 'Explore Originals' : 'Explorer les Originaux',
    
    orientalBadge: isAr ? 'عطور الشرق الفاخرة' : isEn ? 'House of the Orient' : "Maison d'Orient",
    orientalTitle: isAr ? 'عطور شرقية وعربية' : isEn ? 'Oriental & Arabian Fragrances' : 'Parfums Orientaux & Arabes',
    orientalDesc: isAr ? 'لطافة، أسد، يارا، أفنان، خمرة وأعرق إبداعات العطور الشرقية.' : isEn ? "Lattafa, Asad, Yara, Afnan, Khamrah and the finest oriental perfume masterpieces." : "Lattafa, Asad, Yara, Afnan, Khamrah et les plus grands chefs-d'œuvre de la parfumerie orientale.",
    orientalCta: isAr ? 'استكشف الشرقي' : isEn ? 'Explore Oriental' : 'Explorer les Orientaux',
    
    giftSets: isAr ? 'صناديق هدايا' : isEn ? 'Luxury Gift Sets' : 'Coffrets Cadeaux',
    discoverySets: isAr ? 'صناديق اكتشاف' : isEn ? 'Discovery Sets' : 'Coffrets Découverte',
    seeAll: isAr ? 'عرض الكل' : isEn ? 'View All' : 'Tout voir',
    privateUnisex: isAr ? 'التشكيلة الخاصة وعطور لكلا الجنسين' : isEn ? 'Private Collection & Unisex' : 'Collection Privée & Unisexe',
  };

  const selectedCategory = MAIN_CATEGORIES.find(c => c.slug === activeGenderTab);
  const selectedCatTitle = selectedCategory?.slug === 'women' ? (dict.categories?.womenLabel || selectedCategory.label)
    : selectedCategory?.slug === 'men' ? (dict.categories?.menLabel || selectedCategory.label)
    : (dict.categories?.unisexLabel || selectedCategory?.label);

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

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      // Autohide / reveal on scroll direction
      if (currentScrollY <= 25) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollYRef.current + 8) {
        // Scrolling down -> hide head taskbar
        setShowHeader(false);
      } else if (currentScrollY < lastScrollYRef.current - 8) {
        // Scrolling up -> show head taskbar
        setShowHeader(true);
      }

      lastScrollYRef.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen to mobile taskbar triggers for the drawer
  useEffect(() => {
    const handleToggle = () => setIsMobileMenuOpen(prev => !prev);
    const handleClose = () => setIsMobileMenuOpen(false);
    const handleOpen = () => setIsMobileMenuOpen(true);

    window.addEventListener('toggle-mobile-menu', handleToggle);
    window.addEventListener('close-mobile-menu', handleClose);
    window.addEventListener('open-mobile-menu', handleOpen);

    return () => {
      window.removeEventListener('toggle-mobile-menu', handleToggle);
      window.removeEventListener('close-mobile-menu', handleClose);
      window.removeEventListener('open-mobile-menu', handleOpen);
    };
  }, []);

  // Sync mobile menu state back to taskbar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mobile-menu-state', { detail: { isOpen: isMobileMenuOpen } }));
  }, [isMobileMenuOpen]);

  // Close drawer on page route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Determine if header should be solid white
  const isSolid = !isHome || isScrolled || activeMenu !== null || isMobileMenuOpen;
  const isHeaderVisible = showHeader || isMobileMenuOpen;

  return (
    <>
      {/* MOBILE HEAD TASKBAR (< lg): Autohides on scroll down, reveals on scroll up */}
      <header
        className={`lg:hidden fixed top-0 left-0 w-full z-40 transition-transform duration-300 ease-in-out select-none print:hidden ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isSolid 
            ? 'bg-white border-b border-[#ECEAE4] shadow-[0_2px_15px_rgba(0,0,0,0.04)]' 
            : 'bg-[#FAF9F6] border-b border-[#111]/5'
        }`}
      >
        <div className="grid grid-cols-3 items-center h-[58px] px-3 sm:px-4">
          
          {/* LEFT: Menu Drawer Trigger (Modern Menu Icon) */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label={isAr ? "القائمة الرئيسية" : "Menu de navigation"}
              className="w-10 h-10 -ml-1 rtl:-ml-0 rtl:-mr-1 rounded-full flex items-center justify-center text-[#111827] hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
            >
              <Menu size={22} strokeWidth={2} className="text-[#111827]" />
            </button>
          </div>

          {/* CENTER: NAY Logo Monogram (Locked to exact dead center & Bigger) */}
          <div className="flex items-center justify-center">
            <Link 
              href={`/${locale}`} 
              aria-label="NAY Parfums - Accueil" 
              className="flex items-center justify-center group active:scale-95 transition-transform"
            >
              <div
                className="w-24 h-11 sm:w-28 sm:h-12 transition-colors duration-300 group-hover:bg-[#0ea5e9] bg-[#111827]"
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

          {/* RIGHT: Profile/Account + Language Switcher */}
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/${locale}/account`}
              aria-label={isAr ? "حسابي الشخصي" : "Mon Compte"}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#111827] hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
            >
              <User size={19} strokeWidth={1.9} className="text-[#111827]" />
            </Link>
            <div className="flex items-center justify-center min-w-[34px]">
              <LanguageSwitcher />
            </div>
          </div>

        </div>
      </header>

      {/* DESKTOP HEADER (Only visible on screens >= lg; completely removed on mobile) */}
      <header
        onMouseLeave={() => setActiveMenu(null)}
        className={`hidden lg:block fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isSolid ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#e0ddd4]/60' : 'bg-[#FAF9F6]/85 backdrop-blur-md border-b border-[#111]/5'
        }`}
      >

        

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 relative">
          {/* DESKTOP BAR (lg+): True 3-Zone Equilibrium with Centered NAY Logo */}
          <div className="hidden lg:flex items-center justify-between h-[78px]">
            {/* LEFT NAV (Desktop): Core Fragrance Collections */}
            <nav className="flex items-center gap-4 xl:gap-6 flex-1 pr-16">
              {['women', 'men', 'testers', 'originaux', 'brands', 'bundles'].map((menuKey) => {
                const labels: any = {
                  women: dict.nav?.women || 'Femme',
                  men: dict.nav?.men || 'Homme',
                  testers: dict.nav?.testers || 'Testeurs',
                  originaux: dict.nav?.originaux || 'Parfums Originaux',
                  brands: dict.nav?.brands || 'Maisons',
                  bundles: dict.nav?.bundles || 'Coffrets Cadeaux'
                };
                return (
                  <div 
                    key={menuKey} 
                    className="h-full flex items-center"
                    onMouseEnter={() => setActiveMenu(menuKey as any)}
                  >
                    <button
                      className={`text-[11px] font-bold tracking-[0.12em] xl:tracking-[0.14em] uppercase transition-colors duration-300 flex items-center gap-1.5 h-[78px] border-b-2 whitespace-nowrap cursor-pointer ${
                        activeMenu === menuKey ? 'border-[#0ea5e9] text-[#0ea5e9]' : 'border-transparent text-[#1A1A1A] hover:text-[#0ea5e9]'
                      }`}
                    >
                      {labels[menuKey]}
                    </button>
                  </div>
                );
              })}
            </nav>

            {/* CENTER: NAY Logo Monogram (Locked to Mathematical Dead Center) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto z-20">
              <Link href={`/${locale}`} aria-label="NAY Parfums - Accueil" className="group flex flex-col items-center">
                <div
                  className="w-24 h-14 lg:w-28 lg:h-16 transition-colors duration-300 group-hover:bg-[#0ea5e9] bg-[#1A1A1A]"
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

            {/* RIGHT UTILITIES & SCENT MATCH (Desktop): Relocated Scent Match with Breathing Room */}
            <div className="flex-1 flex items-center justify-end gap-3 xl:gap-5 pl-16">
              {/* Creative Placement: Scent Match interactive discovery pill */}
              <Link
                href={`/${locale}/scent-match`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-50 via-sky-50/80 to-sky-100/70 border border-sky-300/80 text-[#0284c7] hover:bg-[#0ea5e9] hover:text-white hover:border-[#0ea5e9] transition-all text-[11px] font-extrabold uppercase tracking-wider shadow-2xs hover:shadow-md hover:scale-105 whitespace-nowrap group cursor-pointer"
              >
                <Compass size={13} className="text-[#0ea5e9] group-hover:text-white transition-colors" />
                <span>{isAr ? 'عطور على مقاسك' : 'Scent Match'}</span>
              </Link>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="transition-colors duration-300 text-[#1A1A1A] hover:text-[#0ea5e9] p-2 cursor-pointer"
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

              <div className="pl-1 border-l border-slate-200">
                <LanguageSwitcher />
              </div>
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
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">{menuT.olfactoryFamilies}</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women?sub=floral`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.floral}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women?sub=oriental`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.oriental}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women?sub=woody`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.woody}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women?sub=fresh`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.fresh}</Link></li>
                          <li className="pt-2"><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women`} className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] flex items-center gap-1">{menuT.allWomen} <ChevronRight size={14}/></Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">{menuT.collectionsFormats}</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs/women`} className="text-[13px] font-semibold text-[#0ea5e9] hover:text-[#0284c7] transition-colors flex items-center gap-2">{menuT.testersWomen}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/parfums-originaux`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.originauxSealed}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/master-copier`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.masterCopy}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/women`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.allWomenSelection}</Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">{menuT.flagshipBrands}</div>
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
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">{menuT.olfactoryFamilies}</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men?sub=woody`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.woody}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men?sub=oriental`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.oriental}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men?sub=aromatic`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.aromatic}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men?sub=fresh`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.fresh}</Link></li>
                          <li className="pt-2"><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men`} className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] flex items-center gap-1">{menuT.allMen} <ChevronRight size={14}/></Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">{menuT.collectionsFormats}</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs/men`} className="text-[13px] font-semibold text-[#0ea5e9] hover:text-[#0284c7] transition-colors flex items-center gap-2">{menuT.testersMen}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/parfums-originaux`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.originauxSealed}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/master-copier`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.masterCopy}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/men`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.allMenSelection}</Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">{menuT.flagshipBrands}</div>
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
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">{menuT.testerCategories}</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs/women`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors flex items-center justify-between font-medium">{menuT.testersWomen} <ChevronRight size={14} className="text-[#9A9A9A]"/></Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs/men`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors flex items-center justify-between font-medium">{menuT.testersMen} <ChevronRight size={14} className="text-[#9A9A9A]"/></Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors flex items-center justify-between font-medium">{menuT.allTesters} <ChevronRight size={14} className="text-[#9A9A9A]"/></Link></li>
                          <li className="pt-2"><Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs`} className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] flex items-center gap-1">{menuT.seeAllTesters} <ChevronRight size={14}/></Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">{menuT.housesTesters}</div>
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
                          <span className="text-[#0ea5e9] text-[10px] font-bold uppercase tracking-widest mb-2 block">{menuT.testerBannerBadge}</span>
                          <h4 className="heading-font text-xl text-[#1A1A1A] mb-2">{menuT.testerBannerTitle}</h4>
                          <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                            {menuT.testerBannerDesc}
                          </p>
                        </div>
                        <Link onClick={() => setActiveMenu(null)} href={`/${locale}/testeurs`} className="mt-4 bg-[#111] text-white text-[11px] font-bold uppercase tracking-wider py-2.5 px-4 rounded-full text-center hover:bg-[#0ea5e9] transition-colors">
                          {menuT.testerBannerCta}
                        </Link>
                      </div>
                    </div>
                  </>
                )}

                {/* --- ORIGINAUX MEGA MENU --- */}
                {activeMenu === 'originaux' && (
                  <div className="w-full flex-1">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-6">{menuT.authenticityTitle}</div>
                    <div className="grid grid-cols-2 gap-8">
                      <Link href={`/${locale}/parfums-originaux`} onClick={() => setActiveMenu(null)} className="group cursor-pointer flex items-center bg-[#f8fafc] border border-[#e0ddd4] p-8 rounded-xl hover:border-[#0ea5e9] hover:shadow-2xl transition-all">
                        <div className="flex-1">
                          <span className="text-[#0ea5e9] text-[10px] font-bold uppercase tracking-widest mb-3 block">{menuT.originauxBadge}</span>
                          <h3 className="heading-font text-2xl text-[#1A1A1A] mb-3 group-hover:text-[#0ea5e9] transition-colors">{menuT.originauxTitle}</h3>
                          <p className="text-[13px] text-[#6B6B6B] mb-6 leading-relaxed">
                            {menuT.originauxDesc}
                          </p>
                          <span className="bg-[#111] text-white text-[12px] px-6 py-2.5 rounded-full inline-block group-hover:bg-[#0ea5e9] group-hover:text-white transition-all shadow-md">
                            {menuT.originauxCta}
                          </span>
                        </div>
                      </Link>
                      <Link href={`/${locale}/parfums-orientaux`} onClick={() => setActiveMenu(null)} className="group cursor-pointer flex items-center bg-[#f8fafc] border border-[#e0ddd4] p-8 rounded-xl hover:border-[#d97706] hover:shadow-2xl transition-all">
                        <div className="flex-1">
                          <span className="text-[#d97706] text-[10px] font-bold uppercase tracking-widest mb-3 block">{menuT.orientalBadge}</span>
                          <h3 className="heading-font text-2xl text-[#1A1A1A] mb-3 group-hover:text-[#d97706] transition-colors">{menuT.orientalTitle}</h3>
                          <p className="text-[13px] text-[#6B6B6B] mb-6 leading-relaxed">
                            {menuT.orientalDesc}
                          </p>
                          <span className="bg-[#111] text-white text-[12px] px-6 py-2.5 rounded-full inline-block group-hover:bg-[#d97706] group-hover:text-white transition-all shadow-md">
                            {menuT.orientalCta}
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
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">{menuT.giftIdeas}</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/coffrets`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.giftSets}</Link></li>
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/coffrets`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.discoverySets}</Link></li>
                          <li className="pt-2"><Link onClick={() => setActiveMenu(null)} href={`/${locale}/coffrets`} className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] flex items-center gap-1">{menuT.seeAll} <ChevronRight size={14}/></Link></li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-5">{menuT.privateNiche}</div>
                        <ul className="space-y-4">
                          <li><Link onClick={() => setActiveMenu(null)} href={`/${locale}/shop/unisex`} className="text-[13px] text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors">{menuT.privateUnisex}</Link></li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {/* --- BRANDS MEGA MENU --- */}
                {activeMenu === 'brands' && (
                  <div className="w-full">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-6">{menuT.allHouses}</div>
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

      </header>

      {/* ============================================================== */}
      {/* MOBILE FULL-SCREEN LUXURY DRAWER (Minimalist & Creative, like Homepage) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="lg:hidden fixed inset-0 z-[130] bg-[#FAF9F5] overflow-y-auto flex flex-col"
          >
            <div className="px-4.5 py-4 pb-32 space-y-5 max-w-lg mx-auto w-full">
              {/* Drawer Top Header: Language Switcher, Centered NAY Logo & Quick Close */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#ECE7DD]">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                </div>
                
                {/* Centered NAY Brand Monogram */}
                <Link 
                  href={`/${locale}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="NAY Parfums - Accueil"
                  className="flex items-center justify-center"
                >
                  <div
                    className="w-24 h-11 bg-[#111827] hover:bg-[#0284c7] transition-colors"
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

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-white border border-[#ECE7DD] hover:bg-[#F2EFE9] flex items-center justify-center text-[#111827] transition-colors active:scale-95 cursor-pointer shadow-2xs"
                  aria-label="Fermer le menu"
                >
                  <X size={17} strokeWidth={2.2} />
                </button>
              </div>

              {/* Instant Mobile Search Bar */}
              <div 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="flex items-center gap-3 bg-white border border-[#ECE7DD] hover:border-[#0ea5e9] rounded-2xl px-4 py-3 cursor-pointer transition-all shadow-2xs group"
              >
                <Search className="w-4 h-4 text-[#0ea5e9] group-hover:scale-110 transition-transform" />
                <span className="text-[13px] text-slate-400 flex-1 font-medium">
                  {dict.nav?.searchPlaceholder || 'Rechercher un parfum, une marque...'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-md">
                  {isAr ? 'بحث' : 'Rechercher'}
                </span>
              </div>

              {/* SECTION 1: GAMMES ET COLLECTIONS (Atelier 2x2 Grid) */}
              <div>
                {/* NAY SCENT MATCH HERO BANNER */}
                <Link
                  href={`/${locale}/scent-match`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mb-3 block p-3.5 rounded-2xl bg-gradient-to-r from-[#111827] via-[#1e293b] to-[#0f172a] text-white shadow-sm border border-[#0ea5e9]/30 hover:border-[#0ea5e9] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-[#38bdf8] shrink-0">
                        <Compass size={17} strokeWidth={2.2} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9.5px] font-black uppercase tracking-widest text-[#38bdf8]">BOUSSOLE OLFACTIVE IA</span>
                          <span className="text-slate-500 text-[10px]">·</span>
                          <span className="text-[10px] text-slate-300 font-medium">{isAr ? 'حصري' : 'Nouveau'}</span>
                        </div>
                        <h4 className="text-[13px] font-black text-white group-hover:text-sky-300 transition-colors">
                          {isAr ? 'اكتشف بصمتك العطرية (Scent Match)' : 'NAY Scent Match — Trouver mon ADN'}
                        </h4>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-sky-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                </Link>

                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                    <span className="text-[10.5px] font-black tracking-[0.2em] uppercase text-[#111827]">
                      {isAr ? 'التشكيلات والباقات' : 'COLLECTIONS & GAMMES'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isAr ? '4 اختيارات' : '4 Formats'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Testeurs de Luxe */}
                  <Link
                    href={`/${locale}/testeurs`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 rounded-2xl bg-white border border-[#ECE7DD] hover:border-[#0ea5e9] flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-200/60 flex items-center justify-center text-[#0ea5e9] text-xs">
                        <Droplets size={13} strokeWidth={2.2} />
                      </span>
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full">
                        {isAr ? 'الأكثر طلباً' : '299-499 DH'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                        {isAr ? 'تيسترات أصلية' : 'Testeurs de Luxe'}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {isAr ? 'نفس الجودة والعطر' : "Flacons d'Atelier vérifiés"}
                      </p>
                    </div>
                  </Link>

                  {/* Parfums Originaux Scellés */}
                  <Link
                    href={`/${locale}/parfums-originaux`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 rounded-2xl bg-white border border-[#ECE7DD] hover:border-[#0ea5e9] flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 text-xs">
                        <ShieldCheck size={13} strokeWidth={2.2} />
                      </span>
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                        {isAr ? 'أصلي 100%' : '100% Scellé'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                        {isAr ? 'عطور أصلية' : 'Parfums Originaux'}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {isAr ? 'علب ريتيل بالبليستر' : 'Boîtes retail officielles'}
                      </p>
                    </div>
                  </Link>

                  {/* Master Copy */}
                  <Link
                    href={`/${locale}/master-copier`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 rounded-2xl bg-white border border-[#ECE7DD] hover:border-[#0ea5e9] flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 text-xs">
                        <Crown size={13} strokeWidth={2.2} />
                      </span>
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        {isAr ? 'إلهام 1:1' : 'Master Copy'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                        {isAr ? 'ماستر كوبي' : 'Éditions Master Copy'}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {isAr ? 'جودة وتطابق ممتاز' : 'Sillages Haute Niche 1:1'}
                      </p>
                    </div>
                  </Link>

                  {/* Coffrets Cadeaux */}
                  <Link
                    href={`/${locale}/coffrets`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 rounded-2xl bg-white border border-[#ECE7DD] hover:border-[#0ea5e9] flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 text-xs">
                        <Gift size={13} strokeWidth={2.2} />
                      </span>
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                        {isAr ? 'فاخر' : 'Prestige'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                        {isAr ? 'علب الهدايا' : 'Coffrets Cadeaux'}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {isAr ? 'إهداء فاخر لا يُنسى' : "Écrins d'exception à offrir"}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Toute La Boutique Full-Width Minimalist Pill */}
                <Link
                  href={`/${locale}/shop`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2.5 w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#111827] hover:bg-[#0ea5e9] text-white transition-all shadow-xs group"
                >
                  <span className="text-[12px] font-bold tracking-widest uppercase flex items-center gap-2.5">
                    <ShoppingBag size={14} className="text-[#0ea5e9] group-hover:text-white transition-colors" />
                    <span>{dict.nav?.allBoutique || 'Toute La Boutique (Tous Les Parfums)'}</span>
                  </span>
                  <ChevronRight size={15} className="rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* SECTION 2: LUXURY REASSURANCE CAPSULE */}
              <div className="bg-white border border-[#ECE7DD] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-[#0ea5e9] shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h5 className="text-[11.5px] font-bold text-slate-900 leading-tight">
                      {isAr ? '0 درهم تسبيق · معاينة قبل الخلاص' : "0 DH d'avance · Inspectez avant de payer"}
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      {isAr ? 'توصيل 24-48 ساعة بكل مدن المغرب' : 'Livraison express 24–48h partout au Maroc'}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-md shrink-0">
                  100% SÉCURISÉ
                </span>
              </div>

              {/* SECTION 3: CREATIVE INTERACTIVE UNIVERS OLFACTIFS (Segmented Tabs) */}
              <div>
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                    <span className="text-[10.5px] font-black tracking-[0.2em] uppercase text-[#111827]">
                      {isAr ? 'العوالم العطرية' : 'UNIVERS OLFACTIFS'}
                    </span>
                  </div>
                  <Link
                    href={`/${locale}/shop`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-[10.5px] font-bold text-sky-600 hover:text-sky-700"
                  >
                    {isAr ? 'عرض الكل' : 'Voir tout'}
                  </Link>
                </div>

                {/* Minimalist Segmented Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#ECE7DD]/60 rounded-2xl border border-[#ECE7DD] mb-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveGenderTab('men')}
                    className={`py-2 px-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeGenderTab === 'men'
                        ? 'bg-white text-slate-900 shadow-2xs border border-[#ECE7DD]'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <User size={13} className={activeGenderTab === 'men' ? 'text-[#0ea5e9]' : 'text-slate-400'} strokeWidth={2.2} />
                    <span>{isAr ? 'رجال' : 'Homme'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveGenderTab('women')}
                    className={`py-2 px-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeGenderTab === 'women'
                        ? 'bg-white text-slate-900 shadow-2xs border border-[#ECE7DD]'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Flower2 size={13} className={activeGenderTab === 'women' ? 'text-rose-500' : 'text-slate-400'} strokeWidth={2.2} />
                    <span>{isAr ? 'نساء' : 'Femme'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveGenderTab('unisex')}
                    className={`py-2 px-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeGenderTab === 'unisex'
                        ? 'bg-white text-slate-900 shadow-2xs border border-[#ECE7DD]'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Gem size={13} className={activeGenderTab === 'unisex' ? 'text-indigo-500' : 'text-slate-400'} strokeWidth={2.2} />
                    <span>{isAr ? 'مختلط' : 'Unisexe'}</span>
                  </button>
                </div>

                {/* Active Tab Olfactory Families Card */}
                {selectedCategory && (
                  <div className="bg-white rounded-2xl border border-[#ECE7DD] p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          activeGenderTab === 'men' 
                            ? 'bg-sky-50 border-sky-200/80 text-[#0ea5e9]'
                            : activeGenderTab === 'women'
                            ? 'bg-rose-50 border-rose-200/80 text-rose-500'
                            : 'bg-indigo-50 border-indigo-200/80 text-indigo-600'
                        }`}>
                          {activeGenderTab === 'men' ? (
                            <User size={15} strokeWidth={2.2} />
                          ) : activeGenderTab === 'women' ? (
                            <Flower2 size={15} strokeWidth={2.2} />
                          ) : (
                            <Gem size={15} strokeWidth={2.2} />
                          )}
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-900 leading-tight">
                            {selectedCatTitle}
                          </h4>
                          <span className="text-[9.5px] font-medium text-slate-400">
                            {activeGenderTab === 'men' 
                              ? (isAr ? 'كاريزما، ثبات وقوة السيلّاج' : 'Charisme, tenue & sillage puissant')
                              : activeGenderTab === 'women'
                              ? (isAr ? 'أنوثة راقية وجاذبية لا تقاوم' : 'Élégance, sensualité & coup de cœur')
                              : (isAr ? 'عطور النيش الفاخرة والتوازن المتكامل' : 'Haute niche & équilibre d\'exception')}
                          </span>
                        </div>
                      </div>
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                        {activeGenderTab === 'men' ? (isAr ? 'الأكثر طلباً' : 'Best-Seller') : activeGenderTab === 'women' ? (isAr ? 'المفضل' : 'Coup de Cœur') : (isAr ? 'نيش فاخر' : 'Haute Niche')}
                      </span>
                    </div>

                    {/* Creative Pill Chips for Subcategories with Vector Icons */}
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCategory.subcategories.map((sub) => {
                        const rawLabel = (sub as any).label;
                        const subLabel = sub.key === 'floral' ? (dict.categories?.subFloral || rawLabel)
                          : sub.key === 'oriental' ? (dict.categories?.subOriental || rawLabel)
                          : sub.key === 'fresh' ? (dict.categories?.subFresh || rawLabel)
                          : sub.key === 'woody' ? (dict.categories?.subWoody || rawLabel)
                          : sub.key === 'aromatic' ? (dict.categories?.subAromatic || rawLabel)
                          : rawLabel;

                        const iconConfig = sub.key === 'floral'
                          ? { icon: <Flower2 size={13} strokeWidth={2.2} />, style: 'bg-rose-50 text-rose-600 border-rose-200/80' }
                          : sub.key === 'oriental'
                          ? { icon: <Moon size={13} strokeWidth={2.2} />, style: 'bg-amber-50 text-amber-700 border-amber-200/80' }
                          : sub.key === 'fresh'
                          ? { icon: <Wind size={13} strokeWidth={2.2} />, style: 'bg-sky-50 text-sky-600 border-sky-200/80' }
                          : sub.key === 'woody'
                          ? { icon: <TreePine size={13} strokeWidth={2.2} />, style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' }
                          : sub.key === 'aromatic'
                          ? { icon: <Leaf size={13} strokeWidth={2.2} />, style: 'bg-teal-50 text-teal-700 border-teal-200/80' }
                          : { icon: <Compass size={13} strokeWidth={2.2} />, style: 'bg-slate-50 text-slate-700 border-slate-200/80' };

                        return (
                          <Link
                            key={sub.slug}
                            href={`/${locale}/shop/${selectedCategory.slug}?sub=${sub.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF9F5] hover:bg-sky-50 border border-[#ECE7DD] hover:border-sky-300 transition-all group"
                          >
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${iconConfig.style}`}>
                              {iconConfig.icon}
                            </span>
                            <span className="text-[12px] font-semibold text-slate-700 group-hover:text-sky-700 transition-colors truncate">
                              {subLabel}
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Link to full category */}
                    <Link
                      href={`/${locale}/shop/${selectedCategory.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-2 px-3 rounded-xl bg-[#FAF9F5] hover:bg-sky-50 text-slate-800 hover:text-[#0ea5e9] border border-[#ECE7DD] text-[11.5px] font-bold flex items-center justify-between transition-colors mt-1"
                    >
                      <span>
                        {isAr ? `استكشف جميع عطور ${selectedCatTitle}` : `Explorer tout l'univers ${selectedCatTitle}`}
                      </span>
                      <ChevronRight size={13} className="rtl:rotate-180" />
                    </Link>
                  </div>
                )}
              </div>

              {/* SECTION 4: BRANDS */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                    <span className="text-[10.5px] font-black tracking-[0.2em] uppercase text-[#111827]">
                      {dict.nav?.brands || 'MARQUES DE PRESTIGE'}
                    </span>
                  </div>
                  {brands.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMobileBrands(!showAllMobileBrands)}
                      className="text-[#0ea5e9] text-xs font-bold cursor-pointer"
                    >
                      {showAllMobileBrands ? (dict.nav?.seeLess || 'Voir moins') : (dict.nav?.seeMore || 'Voir plus')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(showAllMobileBrands ? brands : brands.slice(0, 4)).map((brand) => (
                    <Link 
                      key={brand.slug}
                      href={`/${locale}/brands/${brand.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 border border-[#ECE7DD] bg-white rounded-xl p-2.5 hover:border-[#0ea5e9] transition-all shadow-2xs group"
                    >
                      <div className="relative w-7 h-7 shrink-0">
                        <Image 
                          src={brand.image || `/images/brands/${brand.slug?.toLowerCase()}-logo.jpg`} 
                          alt={brand.name} 
                          fill
                          sizes="32px"
                          className="object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" 
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide truncate group-hover:text-sky-600 transition-colors">
                        {brand.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* SECTION 5: VIP WHATSAPP & SECONDARY UTILITY */}
              <div className="space-y-3 pt-1">
                <a
                  href="https://wa.me/212663380011?text=Bonjour%20NAY%20Parfum,%20je%20souhaite%20des%20conseils%20ou%20passer%20une%20commande."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-bold text-[12.5px] py-3.5 px-4 rounded-2xl shadow-sm active:scale-98 transition-all"
                >
                  <MessageCircle size={16} />
                  <span>{isAr ? 'استشارة VIP عبر واتساب (طلب فوري)' : 'Assistance VIP WhatsApp (Conseil & Commande)'}</span>
                </a>

                {/* Minimalist Utility Pills */}
                <div className="grid grid-cols-3 gap-2 text-[#1A1A1A]">
                  <Link
                    href={`/${locale}/suivi-commande`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex flex-col items-center justify-center text-center p-2.5 bg-white border border-[#ECE7DD] rounded-xl hover:border-sky-300 transition-all shadow-2xs"
                  >
                    <Package className="w-4 h-4 text-[#0ea5e9] mb-1" />
                    <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                      {dict.nav?.trackOrder || 'Suivi Colis'}
                    </span>
                  </Link>

                  <Link
                    href={`/${locale}/wishlist`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex flex-col items-center justify-center text-center p-2.5 bg-white border border-[#ECE7DD] rounded-xl hover:border-rose-300 transition-all shadow-2xs relative"
                  >
                    <Heart className="w-4 h-4 text-rose-500 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                      {dict.nav?.wishlist || 'Favoris'}
                    </span>
                    {wishlistCount > 0 && (
                      <span className="absolute top-1 right-2 text-[8px] font-bold bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href={`/${locale}/account`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex flex-col items-center justify-center text-center p-2.5 bg-white border border-[#ECE7DD] rounded-xl hover:border-sky-300 transition-all shadow-2xs"
                  >
                    <User className="w-4 h-4 text-slate-600 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-700 leading-tight">
                      {dict.nav?.account || 'Compte'}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH MODAL */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
