'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RecentlyViewed from '@/components/RecentlyViewed';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import {
  Star,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Heart,
  Truck,
  ShieldCheck,
  Check,
  ChevronRight as Chev,
  ChevronDown,
  Gift,
  MessageCircle,
  ShoppingBag,
  HelpCircle,
  Info,
  Clock,
  PackageCheck,
  Wind,
  Droplets,
  BadgeCheck,
  ArrowRight,
  Award,
} from 'lucide-react';
import { PerfumeBottleIcon, CodCashIcon } from '@/components/icons/MaisonIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { formatMAD, Product, isProductInStock } from '@/lib/products';
import { getProductEditionInfo } from '@/lib/productEdition';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { usePreferences } from '@/context/PreferencesContext';
import ReactMarkdown from 'react-markdown';
import { translations, Locale } from './translations';
import { getProductFaq } from '@/lib/seoFaq';
import { translatePerfumeNote, translateOlfactoryFamily, translateSeason, translateConcentration } from '@/lib/perfumeNotes';
import { localizeLongDescription, localizeShortDescription } from '@/lib/localizeDescription';

/* ============================================================
   NAY PARFUM — LUXURY PRODUCT PAGE V2
   Discover · Explore · Understand · Trust · Purchase
   ============================================================ */

export default function ProductClient({
  product,
  relatedProducts,
  initialReviews,
  includedProducts,
  locale: propLocale,
}: {
  product: Product;
  relatedProducts: Product[];
  initialReviews: any[];
  includedProducts?: Product[];
  locale?: Locale;
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 
      ? (product.sizes.length > 1 ? product.sizes[1].label : product.sizes[0].label)
      : ''
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(product.slug);
  const pathname = usePathname();
  const rawLocale = propLocale || (pathname?.split('/')[1] as Locale) || 'fr';
  const locale: Locale = (['fr', 'en', 'ar'].includes(rawLocale) ? rawLocale : 'fr') as Locale;
  const t = translations[locale] || translations.fr;

  // Accordion open/close state — all closed by default as requested
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    description: false,
    notes: false,
    specs: false,
    delivery: false,
    faq: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [reviews, setReviews] = useState(initialReviews);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(5);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    author: '',
    city: '',
    rating: 5,
    title: '',
    comment: '',
  });
  const { customer, setCustomer } = useAuth();
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewAuthStep, setReviewAuthStep] = useState<'login' | 'signup' | 'review'>('login');
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  const { addRecentlyViewed } = usePreferences();

  // Mobile Sticky Bar state
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  // Desktop Hover Zoom State
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);

  const handleGalleryMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y });
  };

  const handleGalleryMouseLeave = () => {
    setZoomPos(null);
  };

  // Mobile Swipe Gesture Handlers (Pure native touch events, no extra deps)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  const handleGalleryTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchDeltaXRef.current = 0;
  };

  const handleGalleryTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = touchStartXRef.current - currentX;
    const deltaY = touchStartYRef.current - currentY;
    touchDeltaXRef.current = deltaX;
  };

  const handleGalleryTouchEnd = () => {
    if (touchStartXRef.current === null || product.images.length <= 1) return;
    const swipeThreshold = 40;
    if (touchDeltaXRef.current > swipeThreshold) {
      // Swiped Left -> Next image
      setSelectedImage((prev) => (prev + 1) % product.images.length);
    } else if (touchDeltaXRef.current < -swipeThreshold) {
      // Swiped Right -> Previous image
      setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchDeltaXRef.current = 0;
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!ctaSectionRef.current) {
        setShowStickyBar(window.scrollY > 700);
        return;
      }
      const rect = ctaSectionRef.current.getBoundingClientRect();
      setShowStickyBar(rect.bottom < 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    addRecentlyViewed(product.id);

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [product.sku || product.id.toString()],
        content_type: 'product',
        content_name: product.name,
        value: Math.max(Number(product.price.toFixed(2)), 0.01),
        currency: 'MAD',
      });
    }
  }, [product.id, product.sku, product.name, product.price, addRecentlyViewed]);

  useEffect(() => {
    if (customer) {
      setReviewAuthStep('review');
      setReviewFormData((prev) => ({ ...prev, author: customer.name }));
    }
  }, [customer]);

  const handleReviewAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault();
    setLoadingAuth(true);
    setAuthError('');
    try {
      const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomer(data.customer);
        setReviewAuthStep('review');
      } else {
        setAuthError(data.error || 'Une erreur est survenue');
      }
    } catch {
      setAuthError('Erreur de connexion');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setAuthError('');
      setLoadingAuth(true);
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('@/lib/firebase');
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCustomer(data.customer);
        setReviewAuthStep('review');
      } else {
        setAuthError(data.error || 'Erreur lors de la connexion Google');
      }
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(`Erreur Google: ${error.message || error.code || 'Inconnue'}`);
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  const currentSize = product.sizes?.find((s) => s.label === selectedSize);
  const currentPrice = currentSize?.price || product.price;
  const inStock = isProductInStock(product);

  const isTesterProduct = Boolean(
    product.isTester ||
    product.slug?.toLowerCase().includes('tester') ||
    product.name?.toLowerCase().includes('testeur')
  );
  const edition = useMemo(() => getProductEditionInfo(product, locale), [product, locale]);
  const isOrientalProduct = Boolean(
    product.subcategory === 'arabic' ||
    (product.subcategory as string) === 'oriental' ||
    (product.subcategoryLabel && product.subcategoryLabel.toLowerCase().includes('oriental')) ||
    (product.subcategoryLabel && product.subcategoryLabel.toLowerCase().includes('orient')) ||
    (product.brandLabel && product.brandLabel.toLowerCase().includes('lattafa'))
  );

  const handleBuyNow = () => {
    if (isBuyingNow || isAdding || !inStock) return;
    setIsBuyingNow(true);

    const finalSize = selectedSize;

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: [product.sku || product.id.toString()],
        content_type: 'product',
        content_name: product.name,
        value: Math.max(Number((currentPrice * quantity).toFixed(2)), 0.01),
        currency: 'MAD',
        num_items: quantity,
      });
    }

    const query = new URLSearchParams({
      buyNow: '1',
      slug: product.slug,
      qty: String(Math.max(1, Math.min(quantity, 10))),
    });
    if (finalSize) {
      query.set('size', finalSize);
    }

    router.push(`/${locale}/checkout?${query.toString()}`);
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (isAdding || !inStock) return;
    setIsAdding(true);

    const finalSize = selectedSize;

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [product.sku || product.id.toString()],
        content_type: 'product',
        content_name: product.name,
        value: Math.max(Number((currentPrice * quantity).toFixed(2)), 0.01),
        currency: 'MAD',
      });
    }

    addToCart(
      {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        price: currentPrice,
        images: product.images,
        inStock: product.inStock,
        stock: product.stock,
      },
      quantity,
      finalSize
    );

    setIsAdding(false);
    setIsAdded(true);
    window.dispatchEvent(new Event('openCart'));

    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product.slug);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewFormData),
      });
      if (res.ok) {
        const newReview = {
          id: Date.now(),
          ...reviewFormData,
          createdAt: new Date().toISOString(),
          verified: false,
        };
        setReviews([newReview, ...reviews]);
        setIsReviewModalOpen(false);
        setReviewFormData({ author: '', city: '', rating: 5, title: '', comment: '' });
      } else {
        alert(t.reviews.error);
      }
    } catch (error) {
      console.error(error);
      alert(t.reviews.error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Olfactory notes presence check
  const hasNotes = Boolean(
    product.notes &&
      ((product.notes.top && product.notes.top.length > 0) ||
        (product.notes.heart && product.notes.heart.length > 0) ||
        (product.notes.base && product.notes.base.length > 0))
  );

  // Clean tagline formatter to avoid unparsed markdown or raw dashes
  const cleanTagline = useMemo(() => {
    if (!product.tagline) return null;
    let text = localizeShortDescription(product.tagline, locale);
    if (!text) return null;
    // Strip leading bullets/dashes
    text = text.replace(/^[-*•\s]+/, '');
    // Strip markdown bold/italic
    text = text.replace(/[*_]{1,3}/g, '');
    text = text.trim();
    if (!text || text.length < 2) return null;
    return text;
  }, [product.tagline, locale]);

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen pb-24 lg:pb-16 overflow-x-hidden">
      <Header />

      {/* BREADCRUMB */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-[34px] pt-[62px] sm:pt-[76px] lg:pt-[89px] pb-[8px] sm:pb-[13px]">
        <nav className="flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11px] text-[#8C827A] overflow-x-auto no-scrollbar whitespace-nowrap py-1 tracking-[0.02em]">
          <Link href={`/${locale}`} className="hover:text-[#0ea5e9] shrink-0 transition">
            {t.breadcrumb.home}
          </Link>
          <Chev size={12} className="shrink-0 text-[#ccc]" />
          <Link href={`/${locale}/shop`} className="hover:text-[#0ea5e9] shrink-0 transition">
            {t.breadcrumb.shop}
          </Link>
          <Chev size={12} className="shrink-0 text-[#ccc]" />
          <Link
            href={`/${locale}/shop/${product.gender}`}
            className="hover:text-[#0ea5e9] shrink-0 transition"
          >
            {t.genderMap[product.gender as keyof typeof t.genderMap]
              ? `Parfums ${t.genderMap[product.gender as keyof typeof t.genderMap]}`
              : product.subcategoryLabel}
          </Link>
          {product.brand && (
            <>
              <Chev size={12} className="shrink-0 text-[#ccc]" />
              <Link
                href={`/${locale}/brands/${product.brand}`}
                className="hover:text-[#0ea5e9] shrink-0 transition"
              >
                {product.brandLabel}
              </Link>
            </>
          )}
          <Chev size={12} className="shrink-0 text-[#ccc]" />
          <span className="text-[#1A1A1A] font-semibold shrink-0 truncate max-w-[140px] sm:max-w-none">
            {product.name}
          </span>
        </nav>
      </div>

      {/* ====== MAIN HERO: GOLDEN RATIO SPLIT GALLERY (1.618fr) & BUYBOX (1fr) ====== */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-[34px] pt-[8px] pb-[21px] sm:py-[21px] lg:py-[34px]">
        <div className="grid lg:grid-cols-[1.618fr_1fr] gap-[21px] lg:gap-[34px] items-start">
          
          {/* -------- LEFT: LUXURY GOLDEN SPIRAL GALLERY (61.8% Desktop / Above-Fold Balanced Mobile) -------- */}
          <div className="min-w-0 lg:sticky lg:top-[89px]">
            <div
              className="relative aspect-[1.272/1] sm:aspect-[1.272/1] lg:aspect-[1/1.02] bg-gradient-to-b from-[#FAF9F5] to-white rounded-[16px] sm:rounded-[21px] overflow-hidden border border-[#E5E0D6] shadow-xs group select-none touch-pan-y"
              onTouchStart={handleGalleryTouchStart}
              onTouchMove={handleGalleryTouchMove}
              onTouchEnd={handleGalleryTouchEnd}
            >
              <div
                className="relative w-full h-full overflow-hidden cursor-crosshair"
                onMouseMove={handleGalleryMouseMove}
                onMouseLeave={handleGalleryMouseLeave}
              >
                <Image
                  id="main-product-image"
                  src={product.images[selectedImage] || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 62vw, 780px"
                  style={{
                    transformOrigin: zoomPos ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
                    transform: zoomPos ? 'scale(1.75)' : 'scale(1)',
                  }}
                  className="object-contain sm:object-cover p-2 sm:p-0 transition-transform duration-200 ease-out"
                  priority
                />
              </div>

              {/* Badges on Gallery */}
              <div className="absolute top-[13px] left-[13px] sm:top-[21px] sm:left-[21px] z-10 flex flex-wrap items-center gap-[8px] pointer-events-none">
                <span className="text-[9.5px] sm:text-[10px] font-bold tracking-[0.14em] uppercase bg-[#111827]/85 backdrop-blur-md text-white px-3 py-1 rounded-full shadow-sm">
                  {isTesterProduct ? 'Testeur de Parfum' : isOrientalProduct ? 'Parfum Oriental' : 'Édition Originale'}
                </span>
                {product.originalPrice && product.originalPrice > currentPrice && (
                  <span className="text-[9.5px] sm:text-[10px] font-bold tracking-wider uppercase bg-[#0ea5e9] text-white px-2.5 py-1 rounded-full shadow-sm tabular-nums">
                    -{Math.round((1 - currentPrice / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Wishlist Button on Gallery (Golden 38-42px circle) */}
              <button
                onClick={handleWishlistToggle}
                className={`absolute top-[13px] right-[13px] sm:top-[21px] sm:right-[21px] z-10 w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] rounded-full bg-white/95 backdrop-blur-md border border-[#E5E0D6] hover:bg-white flex items-center justify-center shadow-sm transition-all active:scale-95 ${
                  isFavorite ? 'text-rose-500 border-rose-200' : 'text-[#1A1A1A] hover:text-rose-500'
                }`}
                aria-label="Ajouter aux favoris"
              >
                <Heart
                  size={17}
                  className={isFavorite ? 'fill-rose-500 text-rose-500' : 'fill-none'}
                />
              </button>

              {/* Mobile Image Counter Pill */}
              {product.images.length > 1 && (
                <div className="absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 z-10 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-bold tracking-widest">
                  {selectedImage + 1} / {product.images.length}
                </div>
              )}

              {/* Mobile Pagination Dots */}
              {product.images.length > 1 && (
                <div className="absolute bottom-3.5 left-3.5 sm:hidden z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md">
                  {product.images.map((_, dotIdx) => (
                    <span
                      key={dotIdx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        selectedImage === dotIdx ? 'bg-white w-4' : 'bg-white/50 w-1.5'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage(
                        (selectedImage - 1 + product.images.length) % product.images.length
                      )
                    }
                    className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 bg-white/90 backdrop-blur-md border border-[#e0ddd4] hover:bg-white rounded-full flex items-center justify-center shadow-md text-[#1A1A1A] transition active:scale-95 z-10"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImage((selectedImage + 1) % product.images.length)
                    }
                    className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 bg-white/90 backdrop-blur-md border border-[#e0ddd4] hover:bg-white rounded-full flex items-center justify-center shadow-md text-[#1A1A1A] transition active:scale-95 z-10"
                    aria-label="Image suivante"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Row */}
            {product.images.length > 1 && (
              <div className="mt-3.5 sm:mt-5 flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === i
                        ? 'border-[#0ea5e9] ring-2 ring-[#0ea5e9]/25 shadow-sm scale-102'
                        : 'border-[#e0ddd4] hover:border-[#0ea5e9]/40 opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Afficher la photo ${i + 1}`}
                  >
                    <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* -------- RIGHT: GOLDEN BUYBOX (38.2% Desktop / Fibonacci Vertical Rhythm) -------- */}
          <div className="min-w-0 space-y-[13px] sm:space-y-[21px]">
            {/* Brand & Badge Header */}
            <div>
              <div className="flex items-center justify-between gap-[8px] flex-wrap">
                <Link
                  href={`/${locale}/brands/${product.brand}`}
                  className="text-[10.5px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#0284c7] hover:underline transition"
                >
                  {product.brandLabel}
                </Link>
                <span
                  className={`text-[9px] sm:text-[10px] font-bold tracking-[0.14em] uppercase px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border shadow-2xs backdrop-blur-xs transition-colors ${edition.badgeBg} ${edition.textColor} ${edition.borderColor}`}
                  title={edition.label}
                >
                  {edition.label}
                </span>
              </div>

              <h1 className="heading-font text-[24px] sm:text-[29px] lg:text-[34px] font-extrabold tracking-[-0.02em] text-[#1A1A1A] mt-[8px] leading-[1.18]">
                {product.name}
              </h1>

              {cleanTagline && (
                <p className="mt-[6px] sm:mt-[8px] text-[13px] sm:text-[14.5px] text-[#6B7280] font-medium leading-[1.618]">
                  {cleanTagline}
                </p>
              )}

              {/* Reviews Badge */}
              <div className="mt-[8px] sm:mt-[13px] flex items-center gap-2 text-[12px]">
                <div className="flex gap-0.5 text-[#0ea5e9]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={
                        i < Math.floor(product.rating || 5)
                          ? 'fill-[#0ea5e9] text-[#0ea5e9]'
                          : 'fill-[#e0ddd4] text-[#e0ddd4]'
                      }
                    />
                  ))}
                </div>
                <span className="font-bold text-[#1A1A1A] tabular-nums">
                  {(product.rating || 5).toFixed(1)}
                </span>
                <span className="text-[#9A9A9A]">·</span>
                <a
                  href="#reviews"
                  className="text-[#6B6B6B] hover:text-[#0ea5e9] underline underline-offset-2 transition font-medium"
                >
                  {product.reviewCount || reviews.length} {t.info.verifiedReviews}
                </a>
              </div>
            </div>

            {/* Golden Price Presentation Card */}
            <div className="p-[13px] sm:p-[21px] rounded-[16px] sm:rounded-[21px] bg-white border border-[#E5E0D6] shadow-xs flex items-center justify-between gap-[13px]">
              <div className="min-w-0">
                <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-[#8C827A] block mb-0.5">
                  Prix au Maroc
                </span>
                <div className="flex items-baseline gap-[8px] sm:gap-[13px] flex-wrap">
                  <span className="heading-font text-[26px] sm:text-[34px] font-extrabold text-[#111827] tabular-nums leading-none tracking-[-0.02em]">
                    {formatMAD(currentPrice)}
                  </span>
                  {product.originalPrice && product.originalPrice > currentPrice && (
                    <span className="text-[13px] sm:text-[15px] text-[#9A9A9A] line-through font-medium tabular-nums">
                      {formatMAD(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] sm:text-[12px] text-emerald-700 font-bold flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  {inStock ? 'En stock' : 'Rupture'}
                </span>
                <span className="text-[10px] text-[#8C827A] block mt-0.5 font-medium">
                  TTC · Paiement COD
                </span>
              </div>
            </div>

            {/* Size / Variant Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4A4A4A] block mb-[8px]">
                  {t.selector.selectSize}
                </label>
                <div
                  className={`grid ${
                    product.sizes.length === 1
                      ? 'grid-cols-1'
                      : product.sizes.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-3'
                  } gap-[8px] sm:gap-[13px]`}
                >
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize === size.label;
                    return (
                      <button
                        key={size.label}
                        type="button"
                        onClick={() => setSelectedSize(size.label)}
                        className={`relative py-2.5 px-3 sm:p-3 rounded-[13px] sm:rounded-[16px] border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0284c7] bg-sky-50/70 ring-2 ring-[#0ea5e9]/20 shadow-xs'
                            : 'border-[#E5E0D6] hover:border-[#0ea5e9]/50 bg-white'
                        }`}
                      >
                        <div className="text-[13px] sm:text-[13.5px] font-extrabold text-[#111827] leading-tight">
                          {size.label}
                        </div>
                        <div className={`text-[11px] font-bold mt-0.5 tabular-nums ${isSelected ? 'text-[#0284c7]' : 'text-[#6B7280]'}`}>
                          {formatMAD(size.price)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Golden Ratio Dual Purchase Buttons */}
            <div ref={ctaSectionRef} className="space-y-[10px] sm:space-y-[13px] pt-0.5">
              {inStock ? (
                <>
                  {/* Row 1 (Golden 1 : 1.618): Quantity Stepper + "Ajouter au panier" */}
                  <div className="flex items-center gap-[8px] sm:gap-[13px]">
                    <div className="flex items-center justify-between border border-[#E5E0D6] rounded-[13px] sm:rounded-[16px] bg-white h-[48px] sm:h-[55px] w-[108px] sm:w-[124px] shrink-0 shadow-2xs px-1.5">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={!inStock}
                        className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[#555] hover:bg-[#FAF9F5] active:scale-95 transition cursor-pointer"
                        aria-label="Diminuer"
                      >
                        <Minus size={14} strokeWidth={2.4} />
                      </button>
                      <span className="text-[14px] sm:text-[15px] font-extrabold text-[#111827] tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={!inStock}
                        className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[#555] hover:bg-[#FAF9F5] active:scale-95 transition cursor-pointer"
                        aria-label="Augmenter"
                      >
                        <Plus size={14} strokeWidth={2.4} />
                      </button>
                    </div>

                    {/* Secondary CTA: Ajouter au panier */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isAdding || isBuyingNow}
                      className={`flex-1 h-[48px] sm:h-[55px] border-[1.5px] border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white rounded-[13px] sm:rounded-[16px] text-[12.5px] sm:text-[14px] font-bold tracking-[0.04em] flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-white shadow-2xs cursor-pointer ${
                        isAdded ? '!border-emerald-600 !text-emerald-700 !bg-emerald-50' : ''
                      }`}
                    >
                      {isAdding ? (
                        <div className="w-5 h-5 border-2 border-[#111827] border-t-transparent rounded-full animate-spin" />
                      ) : isAdded ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Ajouté au panier !</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 shrink-0" />
                          <span>Ajouter au panier</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Row 2: Hero Primary CTA — Crafted Haute Parfumerie Order Button */}
                  <button
                    type="button"
                    id="buy-now-main-button"
                    onClick={handleBuyNow}
                    disabled={isBuyingNow || isAdding}
                    className="group relative w-full h-[52px] sm:h-[55px] bg-[#111827] hover:bg-black text-white rounded-[13px] sm:rounded-[16px] flex items-center justify-between px-[16px] sm:px-[21px] transition-colors duration-200 shadow-md shadow-slate-950/15 active:scale-[0.99] border border-[#1F2937] cursor-pointer"
                  >
                    {isBuyingNow ? (
                      <div className="w-full flex items-center justify-center gap-2.5">
                        <div className="w-4 h-4 border-2 border-white/85 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[12.5px] font-bold text-white/95 uppercase tracking-[0.08em]">
                          {locale === 'ar' ? 'جارٍ التحويل إلى الدفع...' : 'Redirection sécurisée...'}
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Left: Handcrafted COD Cash Icon + Action Label */}
                        <div className="flex items-center gap-[10px] sm:gap-[13px] min-w-0">
                          <CodCashIcon size={19} className="text-[#E5E0D6] group-hover:text-white transition-colors shrink-0" />
                          <span className="font-bold text-[12.5px] sm:text-[13.5px] uppercase tracking-[0.09em] text-white truncate">
                            {t.actions.buyNow || (locale === 'ar' ? 'اشتري الآن' : 'Acheter maintenant')}
                          </span>
                        </div>

                        {/* Right: Editorial Hairline Separator + Price + Arrow */}
                        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 pl-3 border-l border-white/15 rtl:pl-0 rtl:pr-3 rtl:border-l-0 rtl:border-r">
                          <span className="font-bold text-[13.5px] sm:text-[14.5px] tracking-tight tabular-nums text-white">
                            {formatMAD(currentPrice * quantity)}
                          </span>
                          <ArrowRight size={15} strokeWidth={2.2} className="text-white/75 group-hover:text-white group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180 transition-transform duration-200 shrink-0" />
                        </div>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center font-bold text-[13px]">
                  {t.info.outOfStock || 'Actuellement en rupture de stock'}
                </div>
              )}
            </div>

            {/* ====== LUXURY BUYBOX REASSURANCE TRIO ====== */}
            <div className="pt-2 space-y-2.5">
              {/* 3 Pillars of Trust in a Balanced 3-Card Row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {/* Pillar 1: Essayez avant de payer */}
                <div className="p-3 rounded-2xl bg-white border border-[#e0ddd4] shadow-xs flex flex-col items-center justify-between hover:border-[#0ea5e9]/40 transition">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-100 flex items-center justify-center mb-1.5">
                    <PackageCheck size={16} strokeWidth={2.2} />
                  </div>
                  <span className="font-extrabold text-[11px] sm:text-[12px] text-[#1A1A1A] block leading-tight">
                    {locale === 'ar' ? 'جرّب قبل الدفع' : 'Essayez avant de payer'}
                  </span>
                  <span className="text-[9.5px] text-[#6B7280] block mt-1 leading-snug">
                    {locale === 'ar' ? 'افحص عطرك أمام الموزع' : 'Testez devant le livreur'}
                  </span>
                </div>

                {/* Pillar 2: Livraison Rapide */}
                <div className="p-3 rounded-2xl bg-white border border-[#e0ddd4] shadow-xs flex flex-col items-center justify-between hover:border-[#0ea5e9]/40 transition">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-1.5">
                    <Truck size={16} strokeWidth={2.2} />
                  </div>
                  <span className="font-extrabold text-[11px] sm:text-[12px] text-[#1A1A1A] block leading-tight">
                    {locale === 'ar' ? 'توصيل 24 / 48 ساعة' : 'Livraison 24h/48h'}
                  </span>
                  <span className="text-[9.5px] text-[#6B7280] block mt-1 leading-snug">
                    {locale === 'ar' ? 'توصيل سريع بكل مدن المغرب' : 'Partout au Maroc avec suivi'}
                  </span>
                </div>

                {/* Pillar 3: Authenticité */}
                <div className="p-3 rounded-2xl bg-white border border-[#e0ddd4] shadow-xs flex flex-col items-center justify-between hover:border-[#0ea5e9]/40 transition">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-1.5">
                    <ShieldCheck size={16} strokeWidth={2.2} />
                  </div>
                  <span className="font-extrabold text-[11px] sm:text-[12px] text-[#1A1A1A] block leading-tight">
                    {isTesterProduct 
                      ? (locale === 'ar' ? 'تيستر أصلي 100%' : 'Testeur Authentique')
                      : (locale === 'ar' ? 'عطر أصلي 100%' : '100% Authentique')}
                  </span>
                  <span className="text-[9.5px] text-[#6B7280] block mt-1 leading-snug">
                    {locale === 'ar' ? 'نفس الجودة والثبات الرسمي' : 'Même jus & même sillage'}
                  </span>
                </div>
              </div>

              {/* Discreet WhatsApp Advisor Link & Reassurance Anchor */}
              <div className="pt-1 flex items-center justify-between text-[11.5px] px-1 text-[#6B7280]">
                <a
                  href={`https://api.whatsapp.com/send?phone=212663380011&text=${encodeURIComponent(
                    `Bonjour NAY Parfum, j'aimerais avoir un conseil personnalisé sur ${product.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition"
                >
                  <MessageCircle size={14} className="text-emerald-600 shrink-0" />
                  <span>{locale === 'ar' ? 'استشارة فورية مع خبير العطور عبر واتساب' : 'Besoin d’un conseil ? Échangez sur WhatsApp'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setOpenSections((prev) => ({ ...prev, delivery: true }));
                    const el = document.getElementById('accordions-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[#9CA3AF] hover:text-[#0ea5e9] transition text-[11px] underline underline-offset-2"
                >
                  {locale === 'ar' ? 'تفاصيل الضمانات ↓' : 'Détails des garanties ↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== LUXURY PRODUCT INFORMATION ACCORDIONS ====== */}
      <section id="accordions-section" className="bg-white border-y border-[#e0ddd4] py-12 lg:py-16">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          
          {/* Accordion 1: Description & Histoire */}
          <div className="border border-[#e0ddd4] rounded-2xl overflow-hidden bg-[#fafaf7]/50">
            <button
              type="button"
              onClick={() => toggleSection('description')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#fafaf7] transition"
              aria-expanded={openSections.description}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center font-bold text-[12px]">
                  01
                </div>
                <h2 className="heading-font text-lg sm:text-xl font-bold text-[#1A1A1A]">
                  L&apos;Histoire & la Description du Parfum
                </h2>
              </div>
              <ChevronDown
                size={18}
                className={`text-[#6B6B6B] transition-transform duration-300 ${
                  openSections.description ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openSections.description && (
              <div className="p-5 sm:p-6 pt-0 border-t border-[#f1f1eb] bg-white">
                <div className="prose prose-[#555] max-w-none text-[15px] leading-relaxed pt-4">
                  {product.longDescription ? (
                    <ReactMarkdown>{localizeLongDescription(product.longDescription, product, locale)}</ReactMarkdown>
                  ) : (
                    <p>{localizeShortDescription(product.description, locale)}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: Pyramide & Notes Olfactives (Only when data exists) */}
          {hasNotes && (
            <div className="border border-[#e0ddd4] rounded-2xl overflow-hidden bg-[#fafaf7]/50">
              <button
                type="button"
                onClick={() => toggleSection('notes')}
                className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#fafaf7] transition"
                aria-expanded={openSections.notes}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center font-bold text-[12px]">
                    02
                  </div>
                  <h2 className="heading-font text-lg sm:text-xl font-bold text-[#1A1A1A]">
                    Pyramide & Notes Olfactives
                  </h2>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-[#6B6B6B] transition-transform duration-300 ${
                    openSections.notes ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openSections.notes && (
                <div className="p-5 sm:p-6 pt-0 border-t border-[#f1f1eb] bg-white">
                  <div className="grid md:grid-cols-3 gap-4 sm:gap-6 pt-4">
                    {/* Top notes */}
                    {product.notes.top && product.notes.top.length > 0 && (
                      <div className="p-5 rounded-2xl bg-[#fafaf7] border border-[#e0ddd4] space-y-3">
                        <div className="flex items-center gap-2 text-[#0ea5e9]">
                          <Wind size={18} />
                          <h3 className="heading-font text-[15px] font-bold text-[#1A1A1A]">Notes de Tête</h3>
                        </div>
                        <p className="text-[11px] text-[#888]">L&apos;envolée olfactive immédiate (0–15 min)</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {product.notes.top.map((note) => (
                            <span key={note} className="text-[12px] font-medium bg-white px-2.5 py-1 rounded-lg border border-[#e0ddd4] text-[#1A1A1A]">
                              {translatePerfumeNote(note, locale)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Heart notes */}
                    {product.notes.heart && product.notes.heart.length > 0 && (
                      <div className="p-5 rounded-2xl bg-[#fafaf7] border border-[#e0ddd4] space-y-3">
                        <div className="flex items-center gap-2 text-[#0ea5e9]">
                          <Heart size={18} />
                          <h3 className="heading-font text-[15px] font-bold text-[#1A1A1A]">Notes de Cœur</h3>
                        </div>
                        <p className="text-[11px] text-[#888]">La personnalité & le sillage (15 min–4h)</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {product.notes.heart.map((note) => (
                            <span key={note} className="text-[12px] font-medium bg-white px-2.5 py-1 rounded-lg border border-[#e0ddd4] text-[#1A1A1A]">
                              {translatePerfumeNote(note, locale)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Base notes */}
                    {product.notes.base && product.notes.base.length > 0 && (
                      <div className="p-5 rounded-2xl bg-[#fafaf7] border border-[#e0ddd4] space-y-3">
                        <div className="flex items-center gap-2 text-[#0ea5e9]">
                          <Droplets size={18} />
                          <h3 className="heading-font text-[15px] font-bold text-[#1A1A1A]">Notes de Fond</h3>
                        </div>
                        <p className="text-[11px] text-[#888]">La tenue & la signature durable (4h+)</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {product.notes.base.map((note) => (
                            <span key={note} className="text-[12px] font-medium bg-white px-2.5 py-1 rounded-lg border border-[#e0ddd4] text-[#1A1A1A]">
                              {translatePerfumeNote(note, locale)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accordion 3: Fiche Technique & Spécifications */}
          <div className="border border-[#e0ddd4] rounded-2xl overflow-hidden bg-[#fafaf7]/50">
            <button
              type="button"
              onClick={() => toggleSection('specs')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#fafaf7] transition"
              aria-expanded={openSections.specs}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center font-bold text-[12px]">
                  03
                </div>
                <h2 className="heading-font text-lg sm:text-xl font-bold text-[#1A1A1A]">
                  Fiche Technique & Caractéristiques
                </h2>
              </div>
              <ChevronDown
                size={18}
                className={`text-[#6B6B6B] transition-transform duration-300 ${
                  openSections.specs ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openSections.specs && (
              <div className="p-5 sm:p-6 pt-0 border-t border-[#f1f1eb] bg-white">
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-4 text-[13px]">
                  <div className="p-3.5 rounded-xl bg-[#fafaf7] border border-[#eeece5]">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Maison</dt>
                    <dd className="font-bold text-[#1A1A1A] mt-0.5">{product.brandLabel}</dd>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#fafaf7] border border-[#eeece5]">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Format</dt>
                    <dd className="font-bold text-[#1A1A1A] mt-0.5">{product.isTester ? 'Testeur Officiel' : 'Parfum Original'}</dd>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#fafaf7] border border-[#eeece5]">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Genre</dt>
                    <dd className="font-bold text-[#1A1A1A] mt-0.5">
                      {product.gender === 'women' ? 'Femme' : product.gender === 'men' ? 'Homme' : 'Unisexe'}
                    </dd>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#fafaf7] border border-[#eeece5]">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Contenance</dt>
                    <dd className="font-bold text-[#1A1A1A] mt-0.5">{currentSize?.label || '100ml'}</dd>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#fafaf7] border border-[#eeece5]">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Famille</dt>
                    <dd className="font-bold text-[#1A1A1A] mt-0.5">{translateOlfactoryFamily(product.subcategoryLabel || '', locale)}</dd>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#fafaf7] border border-[#eeece5]">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A]">Règlement</dt>
                    <dd className="font-bold text-[#1A1A1A] mt-0.5">Espèces à la livraison</dd>
                  </div>
                </dl>

                {/* Format Authenticity Clarity inside Accordion 3 */}
                <div className="mt-4 p-4 rounded-2xl bg-[#fafaf7] border border-[#e0ddd4] space-y-1.5">
                  {isTesterProduct ? (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                        <PerfumeBottleIcon size={16} />
                      </div>
                      <div className="text-[12px] text-[#555] leading-relaxed">
                        <strong className="text-[#1A1A1A] block font-bold text-[13px] mb-1">
                          {locale === 'ar' ? 'ما هو تيستر العطر ؟' : 'Format Testeur de Parfum :'}
                        </strong>
                        {locale === 'ar'
                          ? 'التيستر هو زجاجة عطر أصلية موجهة لمنصات العرض والتجربة في المتاجر الرسمية. يحتوي على نفس التركيز، نفس النوتات العطرية، ونفس الثبات والفوحان تماماً كما في العطر التجاري، ويُقدّم في تغليف التيستر المخصص دون كلفة التسويق الإضافية.'
                          : "Flacon officiel issu des circuits de démonstration des marques et parfumeries agréées. Il renferme exactement le même parfum, les mêmes notes olfactives et la même tenue que le flacon commercial, présenté sous conditionnement testeur selon arrivage, sans surcoût d'emballage marketing."}
                      </div>
                    </div>
                  ) : isOrientalProduct ? (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Award size={16} />
                      </div>
                      <div className="text-[12px] text-[#555] leading-relaxed">
                        <strong className="text-[#1A1A1A] block font-bold text-[13px] mb-1">
                          {locale === 'ar' ? 'عطر شرقي أصيل :' : 'Parfum Oriental Authentique :'}
                        </strong>
                        {locale === 'ar'
                          ? 'إبداع أصلي من أرقى دور العطور الشرقية، في عبوته وتغليفه الأصلي المغلق، تم اختياره لقوة فوحانه وثراء مكوناته النبيلة.'
                          : "Création originale de haute parfumerie orientale, conditionnée dans son flacon et packaging officiel d'origine, sélectionnée pour l'intensité de son sillage et la richesse de ses matières nobles."}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                        <BadgeCheck size={16} />
                      </div>
                      <div className="text-[12px] text-[#555] leading-relaxed">
                        <strong className="text-[#1A1A1A] block font-bold text-[13px] mb-1">
                          {locale === 'ar' ? 'إصدار أصلي مختوم :' : 'Édition Originale Scellée :'}
                        </strong>
                        {locale === 'ar'
                          ? 'زجاجة جديدة تماماً داخل علبتها وتغليفها الأصلي المحكم من دار العطور، مطابقة تماماً لما يُعرض في البوتيكات المعتمدة.'
                          : "Flacon neuf sous emballage et blister d'origine scellé par la maison de parfum, identique à la présentation en boutique agréée."}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Accordion 4: Livraison & Expérience Try Before You Pay */}
          <div className="border border-[#e0ddd4] rounded-2xl overflow-hidden bg-[#fafaf7]/50">
            <button
              type="button"
              onClick={() => toggleSection('delivery')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#fafaf7] transition"
              aria-expanded={openSections.delivery}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center font-bold text-[12px]">
                  04
                </div>
                <h2 className="heading-font text-lg sm:text-xl font-bold text-[#1A1A1A]">
                  Livraison Sécurisée & Expérience &laquo; Essayez avant de payer &raquo;
                </h2>
              </div>
              <ChevronDown
                size={18}
                className={`text-[#6B6B6B] transition-transform duration-300 ${
                  openSections.delivery ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openSections.delivery && (
              <div className="p-5 sm:p-6 pt-0 border-t border-[#f1f1eb] bg-white">
                <div className="space-y-4 pt-4 text-[13px] text-[#555] leading-relaxed">
                  <div className="p-4 rounded-xl bg-[#fafaf7] border border-[#eeece5] space-y-2">
                    <div className="flex items-center gap-2 text-[#0ea5e9] font-bold text-[13px]">
                      <Truck size={17} />
                      <span>Livraison généralement sous 24 à 48h après expédition</span>
                    </div>
                    <p className="text-[12px] text-[#555] leading-relaxed">
                      Le délai de livraison est généralement de 24 à 48 heures à compter de l&apos;expédition de votre colis. En cas d&apos;indisponibilité immédiate du parfum, sa préparation et son expédition peuvent nécessiter un délai supplémentaire.
                    </p>
                    <p className="text-[12px] text-[#6B6B6B] italic">
                      Le délai total peut atteindre environ 72 heures selon la disponibilité du parfum. Notre équipe et le livreur coordonnent la réception avec vous par téléphone.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/70 space-y-1.5">
                    <div className="flex items-center gap-2 text-[#0ea5e9] font-bold text-[13px]">
                      <PackageCheck size={17} />
                      <span>Essayez avant de payer</span>
                    </div>
                    <p className="text-[12px] text-[#4A4A4A] leading-relaxed">
                      Testez votre parfum devant le livreur. S&apos;il vous convient, vous payez. Sinon, vous ne payez rien. Le colis nous est immédiatement retourné sans aucun frais pour vous.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 5: Questions Fréquentes FAQ */}
          <div className="border border-[#e0ddd4] rounded-2xl overflow-hidden bg-[#fafaf7]/50">
            <button
              type="button"
              onClick={() => toggleSection('faq')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#fafaf7] transition"
              aria-expanded={openSections.faq}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center font-bold text-[12px]">
                  05
                </div>
                <h2 className="heading-font text-lg sm:text-xl font-bold text-[#1A1A1A]">
                  Questions Fréquentes sur ce Parfum
                </h2>
              </div>
              <ChevronDown
                size={18}
                className={`text-[#6B6B6B] transition-transform duration-300 ${
                  openSections.faq ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openSections.faq && (
              <div className="p-5 sm:p-6 pt-0 border-t border-[#f1f1eb] bg-white space-y-3 pt-4">
                {getProductFaq(product, locale).map((faq) => (
                  <div key={faq.question} className="p-4 rounded-xl bg-[#fafaf7] border border-[#eeece5]">
                    <h3 className="text-[13px] font-bold text-[#1A1A1A] mb-1.5 flex items-start gap-2">
                      <span className="text-[#0ea5e9]">✦</span>
                      <span>{faq.question}</span>
                    </h3>
                    <p className="text-[12px] text-[#555] leading-relaxed pl-4">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ====== REVIEWS SECTION ====== */}
      <section id="reviews" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[320px_1fr] gap-10">
          {/* Rating Summary */}
          <div className="lg:sticky lg:top-28 self-start">
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9]">
              {t.reviews.title}
            </span>
            <h2 className="heading-font text-2xl lg:text-3xl mt-1.5 tracking-wide">
              {reviews.length} {t.reviews.count}
            </h2>

            <div className="flex items-center gap-3 mt-4">
              <div className="heading-font text-4xl font-bold text-[#1A1A1A]">
                {(product.rating || 5).toFixed(1)}
              </div>
              <div>
                <div className="flex gap-0.5 text-[#0ea5e9]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < Math.floor(product.rating || 5)
                          ? 'fill-[#0ea5e9] text-[#0ea5e9]'
                          : 'fill-[#e0ddd4] text-[#e0ddd4]'
                      }
                    />
                  ))}
                </div>
                <div className="text-[11px] text-[#9A9A9A] mt-0.5">{t.reviews.outOf5}</div>
              </div>
            </div>

            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="w-full mt-6 py-3 px-4 rounded-2xl border border-[#0ea5e9] text-[#0ea5e9] hover:bg-[#0ea5e9] hover:text-white transition font-bold text-[12px] tracking-wider"
            >
              {t.reviews.leaveReview}
            </button>
          </div>

          {/* Reviews List */}
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-[#e0ddd4]">
                <p className="text-[#9A9A9A] text-sm">{t.reviews.noReviews}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.slice(0, visibleReviewsCount).map((review) => (
                  <article
                    key={review.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-[#e0ddd4] shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-50 text-[#0ea5e9] flex items-center justify-center heading-font font-bold">
                          {review.author ? review.author.charAt(0) : 'C'}
                        </div>
                        <div>
                          <div className="font-bold text-[14px] text-[#1A1A1A]">{review.author}</div>
                          <div className="text-[11px] text-[#9A9A9A]">
                            <span suppressHydrationWarning>
                              {review.city} · {new Date(review.createdAt).toLocaleDateString('fr-MA', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-[#0ea5e9]">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < review.rating
                                ? 'fill-[#0ea5e9] text-[#0ea5e9]'
                                : 'fill-[#e0ddd4] text-[#e0ddd4]'
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {review.title && (
                      <h4 className="heading-font text-lg font-bold mt-3 text-[#1A1A1A]">
                        {review.title}
                      </h4>
                    )}
                    <p className="mt-1.5 text-[13px] text-[#555] leading-relaxed">
                      {review.comment}
                    </p>
                  </article>
                ))}

                {reviews.length > visibleReviewsCount && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setVisibleReviewsCount((prev) => prev + 5)}
                      className="px-6 py-2.5 rounded-full border border-[#0ea5e9] text-[#0ea5e9] text-[12px] font-bold hover:bg-[#0ea5e9] hover:text-white transition"
                    >
                      Voir plus d&apos;avis ({reviews.length - visibleReviewsCount} restants)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====== RELATED RECOMMENDATIONS ====== */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-[#e0ddd4] py-12 lg:py-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center mb-8">
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9]">
                Recommandations
              </span>
              <h2 className="heading-font text-2xl lg:text-3xl mt-1 font-bold">
                Vous aimerez aussi
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} showRating={false} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== RECENTLY VIEWED ====== */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pb-12">
        <RecentlyViewed currentProductId={product.id} />
      </div>

      <Footer />
      <CartDrawer />

      {/* ====== MOBILE STICKY PURCHASE BAR (Section 13) ====== */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-[#e0ddd4] shadow-[0_-8px_25px_rgba(0,0,0,0.08)] px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-11 h-11 relative rounded-xl bg-[#fafaf7] overflow-hidden border border-[#eeece5] shrink-0">
                <Image
                  src={product.images[0] || '/placeholder.jpg'}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-[#1A1A1A] truncate">{product.name}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedSize && (
                    <span className="text-[10px] font-bold text-[#6B6B6B] bg-[#fafaf7] px-1.5 py-0.5 rounded border border-[#e0ddd4]">
                      {selectedSize}
                    </span>
                  )}
                  <span className="text-[13px] font-bold text-[#0ea5e9]">
                    {formatMAD(currentPrice * quantity)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Check size={11} /> 0 DH d&apos;avance
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {inStock ? (
                <>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isAdding || isBuyingNow}
                    aria-label="Ajouter au panier"
                    className={`w-11 h-11 rounded-[12px] border flex items-center justify-center transition active:scale-95 ${
                      isAdded
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-[#E5E0D6] bg-white text-[#111827] hover:border-[#111827]'
                    }`}
                  >
                    {isAdded ? <Check size={17} strokeWidth={2.5} /> : <ShoppingBag size={17} strokeWidth={2.1} />}
                  </button>
                  <button
                    type="button"
                    id="buy-now-sticky-button"
                    onClick={handleBuyNow}
                    disabled={isBuyingNow || isAdding}
                    className="group relative h-11 px-4 sm:px-5 text-[12px] font-bold uppercase tracking-[0.06em] rounded-[12px] flex items-center justify-center gap-2 bg-[#111827] hover:bg-black text-white shadow-md active:scale-95 transition-colors cursor-pointer border border-[#1F2937]"
                  >
                    {isBuyingNow ? (
                      <div className="w-4 h-4 border-2 border-white/90 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CodCashIcon size={17} className="text-[#E5E0D6] shrink-0" />
                        <span>{locale === 'ar' ? 'اشتري الآن' : 'Commander'}</span>
                        <ArrowRight size={13} strokeWidth={2.2} className="text-white/75 group-hover:translate-x-0.5 rtl:rotate-180 transition-transform shrink-0" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="bg-red-50 text-red-600 border border-red-200 px-3 h-10 text-[11px] rounded-xl font-bold uppercase"
                >
                  Rupture
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== REVIEW MODAL ====== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsReviewModalOpen(false)}
          />
          <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
            {reviewAuthStep === 'login' && !customer && (
              <div className="text-center py-4">
                <h3 className="heading-font text-2xl mb-2">{t.reviews.loginTitle}</h3>
                <p className="text-[#6B6B6B] text-[13px] mb-6">{t.reviews.loginDesc}</p>
                {authError && (
                  <div className="bg-red-50 text-red-600 text-[12px] p-2 rounded mb-4">
                    {authError}
                  </div>
                )}
                <form className="space-y-4" onSubmit={(e) => handleReviewAuth(e, 'login')}>
                  <input
                    required
                    type="email"
                    placeholder={t.reviews.email}
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    className="w-full border border-[#e0ddd4] rounded-lg px-4 py-3 text-[13px]"
                  />
                  <input
                    required
                    type="password"
                    placeholder={t.reviews.password}
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    className="w-full border border-[#e0ddd4] rounded-lg px-4 py-3 text-[13px]"
                  />
                  <button
                    type="submit"
                    disabled={loadingAuth}
                    className="w-full btn-blue py-3 rounded-full text-[12px] font-bold"
                  >
                    {loadingAuth ? 'Connexion...' : 'Se Connecter'}
                  </button>
                </form>
              </div>
            )}

            {(reviewAuthStep === 'review' || customer) && (
              <>
                <h3 className="heading-font text-2xl mb-6">{t.reviews.reviewTitle}</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#9A9A9A] mb-1">
                        {t.reviews.nameLabel}
                      </label>
                      <input
                        required
                        type="text"
                        value={reviewFormData.author}
                        onChange={(e) =>
                          setReviewFormData({ ...reviewFormData, author: e.target.value })
                        }
                        className="w-full border border-[#e0ddd4] rounded-lg px-4 py-2 text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#9A9A9A] mb-1">
                        {t.reviews.cityLabel}
                      </label>
                      <input
                        required
                        type="text"
                        value={reviewFormData.city}
                        onChange={(e) =>
                          setReviewFormData({ ...reviewFormData, city: e.target.value })
                        }
                        className="w-full border border-[#e0ddd4] rounded-lg px-4 py-2 text-[13px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#9A9A9A] mb-2">
                      {t.reviews.ratingLabel}
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                        >
                          <Star
                            size={24}
                            className={
                              star <= reviewFormData.rating
                                ? 'text-[#0ea5e9] fill-[#0ea5e9]'
                                : 'text-[#e0ddd4] fill-[#e0ddd4]'
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#9A9A9A] mb-1">
                      {t.reviews.reviewTitleLabel}
                    </label>
                    <input
                      required
                      type="text"
                      value={reviewFormData.title}
                      onChange={(e) =>
                        setReviewFormData({ ...reviewFormData, title: e.target.value })
                      }
                      className="w-full border border-[#e0ddd4] rounded-lg px-4 py-2 text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#9A9A9A] mb-1">
                      {t.reviews.reviewLabel}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reviewFormData.comment}
                      onChange={(e) =>
                        setReviewFormData({ ...reviewFormData, comment: e.target.value })
                      }
                      className="w-full border border-[#e0ddd4] rounded-lg px-4 py-2 text-[13px] resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className="flex-1 btn-outline-blue py-3 text-[11px] rounded-full"
                    >
                      {t.reviews.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="flex-1 btn-blue py-3 text-[11px] rounded-full"
                    >
                      {isSubmittingReview ? t.reviews.publishing : t.reviews.publish}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
