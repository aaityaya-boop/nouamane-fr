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
  Zap,
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
  Sparkles,
  ShoppingBag,
  HelpCircle,
  Info,
  Clock,
  PackageCheck,
  Wind,
  Droplets,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-16 sm:pt-20 lg:pt-24 pb-2 sm:pb-3">
        <nav className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-[#9A9A9A] overflow-x-auto no-scrollbar whitespace-nowrap py-1">
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

      {/* ====== MAIN HERO: SPLIT GALLERY & BUYBOX ====== */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-8 lg:py-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* -------- LEFT: LUXURY GALLERY (cols 12 -> 7) -------- */}
          <div className="lg:col-span-7 min-w-0">
            <div
              className="relative aspect-square sm:aspect-[4/5] bg-gradient-to-b from-[#fdfdfb] to-white rounded-2xl sm:rounded-3xl overflow-hidden border border-[#e0ddd4] shadow-xs group select-none touch-pan-y"
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
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 700px"
                  style={{
                    transformOrigin: zoomPos ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
                    transform: zoomPos ? 'scale(1.75)' : 'scale(1)',
                  }}
                  className="object-cover transition-transform duration-200 ease-out"
                  priority
                />
              </div>

              {/* Badges on Gallery */}
              <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10 flex flex-wrap items-center gap-1.5 pointer-events-none">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-sm">
                  {isTesterProduct ? 'Testeur de Parfum' : isOrientalProduct ? 'Parfum Oriental' : 'Édition Originale'}
                </span>
                {product.originalPrice && product.originalPrice > currentPrice && (
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-[#0ea5e9] text-white px-2.5 py-1.5 rounded-full shadow-sm">
                    -{Math.round((1 - currentPrice / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Wishlist Button on Gallery */}
              <button
                onClick={handleWishlistToggle}
                className={`absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 backdrop-blur-md border border-[#e0ddd4] hover:bg-white flex items-center justify-center shadow-md transition-all active:scale-95 ${
                  isFavorite ? 'text-rose-500' : 'text-[#1A1A1A] hover:text-rose-500'
                }`}
                aria-label="Ajouter aux favoris"
              >
                <Heart
                  size={18}
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

          {/* -------- RIGHT: PRODUCT BUYBOX & TRUST (cols 12 -> 5) -------- */}
          <div className="lg:col-span-5 min-w-0 space-y-5">
            {/* Brand & Badge Header */}
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Link
                  href={`/${locale}/brands/${product.brand}`}
                  className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9] hover:underline transition"
                >
                  {product.brandLabel}
                </Link>
                <span
                  className={`text-[9.5px] sm:text-[10px] font-bold tracking-[0.14em] uppercase px-3 py-1 rounded-full border shadow-2xs backdrop-blur-xs transition-colors ${edition.badgeBg} ${edition.textColor} ${edition.borderColor}`}
                  title={edition.label}
                >
                  {edition.label}
                </span>
              </div>

              <h1 className="heading-font text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide text-[#1A1A1A] mt-2 leading-tight">
                {product.name}
              </h1>

              {cleanTagline && (
                <p className="mt-1.5 text-[13px] sm:text-[14px] text-[#6B7280] font-medium leading-relaxed">
                  {cleanTagline}
                </p>
              )}

              {/* Reviews Badge */}
              <div className="mt-3 flex items-center gap-2 text-[12px]">
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
                <span className="font-bold text-[#1A1A1A]">
                  {(product.rating || 5).toFixed(1)}
                </span>
                <span className="text-[#9A9A9A]">·</span>
                <a
                  href="#reviews"
                  className="text-[#6B6B6B] hover:text-[#0ea5e9] underline underline-offset-2 transition"
                >
                  {product.reviewCount || reviews.length} {t.info.verifiedReviews}
                </a>
              </div>
            </div>

            {/* Price Presentation Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e0ddd4] shadow-xs flex items-baseline justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A] block mb-0.5">
                  Prix au Maroc
                </span>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="heading-font text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
                    {formatMAD(currentPrice)}
                  </span>
                  {product.originalPrice && product.originalPrice > currentPrice && (
                    <span className="text-[14px] text-[#9A9A9A] line-through font-medium">
                      {formatMAD(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-end gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {inStock ? 'En stock' : 'Rupture'}
                </span>
                <span className="text-[10px] text-[#888] block mt-0.5">
                  TTC · Paiement à la livraison
                </span>
              </div>
            </div>

            {/* Size / Variant Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A] block mb-2">
                  {t.selector.selectSize}
                </label>
                <div
                  className={`grid ${
                    product.sizes.length === 1
                      ? 'grid-cols-1'
                      : product.sizes.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-3'
                  } gap-2.5`}
                >
                  {product.sizes.map((size) => (
                    <button
                      key={size.label}
                      type="button"
                      onClick={() => setSelectedSize(size.label)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        selectedSize === size.label
                          ? 'border-[#0ea5e9] bg-sky-50/50 ring-2 ring-[#0ea5e9]/20 shadow-xs'
                          : 'border-[#e0ddd4] hover:border-[#0ea5e9]/50 bg-white'
                      }`}
                    >
                      <div className="text-[13px] font-bold text-[#1A1A1A]">{size.label}</div>
                      <div className="text-[11px] text-[#0ea5e9] font-semibold mt-0.5">
                        {formatMAD(size.price)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Strict Dual Purchase Buttons */}
            <div ref={ctaSectionRef} className="space-y-3 pt-1">
              {inStock ? (
                <>
                  {/* Top Row: Quantity Stepper + Secondary "Ajouter au panier" */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="flex items-center justify-between border border-[#e0ddd4] rounded-xl sm:rounded-2xl bg-white h-12 sm:h-14 w-28 sm:w-32 shrink-0 shadow-xs px-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={!inStock}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B6B6B] hover:bg-[#fafaf7] active:scale-95 transition"
                        aria-label="Diminuer"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="text-[14px] sm:text-[15px] font-bold text-[#1A1A1A]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={!inStock}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B6B6B] hover:bg-[#fafaf7] active:scale-95 transition"
                        aria-label="Augmenter"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    {/* Secondary CTA: Ajouter au panier */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isAdding || isBuyingNow}
                      className={`flex-1 h-12 sm:h-14 border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white rounded-xl sm:rounded-2xl text-[12.5px] sm:text-[14px] font-bold tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.99] bg-white shadow-xs ${
                        isAdded ? '!border-emerald-600 !text-emerald-700 !bg-emerald-50' : ''
                      }`}
                    >
                      {isAdding ? (
                        <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
                      ) : isAdded ? (
                        <>
                          <Check className="w-5 h-5 text-emerald-600" />
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

                  {/* Primary CTA: Acheter maintenant (Direct Luxury Instant Buy) */}
                  <button
                    type="button"
                    id="buy-now-main-button"
                    onClick={handleBuyNow}
                    disabled={isBuyingNow || isAdding}
                    className="group relative w-full h-13 sm:h-14 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 hover:from-black hover:via-slate-900 hover:to-black text-white rounded-xl sm:rounded-2xl flex items-center justify-between px-4 sm:px-6 transition-all duration-300 shadow-xl shadow-slate-950/20 hover:shadow-2xl hover:shadow-slate-950/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] border border-slate-800/80 overflow-hidden cursor-pointer"
                  >
                    {/* Subtle Luxury Sheen Sweep Effect on Hover */}
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                    {isBuyingNow ? (
                      <div className="w-full flex items-center justify-center gap-2.5">
                        <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[13px] font-bold text-white/90 uppercase tracking-wider">
                          {locale === 'ar' ? 'جارٍ التحويل إلى الدفع...' : 'Redirection sécurisée...'}
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Left: Luxury Icon + Action Text */}
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform duration-200">
                            <ShoppingBag size={16} strokeWidth={2.2} />
                          </div>
                          <span className="font-extrabold text-[13px] sm:text-[14.5px] uppercase tracking-wider text-white truncate">
                            {t.actions.buyNow || (locale === 'ar' ? 'اشتري الآن' : 'Acheter maintenant')}
                          </span>
                        </div>

                        {/* Right: Price Capsule + Directional Progression Arrow */}
                        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pl-2 rtl:pl-0 rtl:pr-2">
                          <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white font-black text-[13px] sm:text-[14px] tracking-tight backdrop-blur-xs border border-white/10 shadow-2xs">
                            {formatMAD(currentPrice * quantity)}
                          </span>
                          <ArrowRight size={17} strokeWidth={2.5} className="text-white/70 group-hover:text-white group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-all duration-300 shrink-0" />
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
                      <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={16} />
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
                        <Sparkles size={16} />
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

            <div className="shrink-0 flex items-center gap-1.5">
              {inStock ? (
                <button
                  type="button"
                  id="buy-now-sticky-button"
                  onClick={handleBuyNow}
                  disabled={isBuyingNow || isAdding}
                  className="group relative h-11 px-4 sm:px-5 text-[12px] font-extrabold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 hover:from-black hover:to-black text-white shadow-lg shadow-slate-950/20 active:scale-95 transition-all cursor-pointer border border-slate-800 overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
                  {isBuyingNow ? (
                    <div className="w-4 h-4 border-2 border-white/90 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag size={14} strokeWidth={2.2} className="text-white/90 shrink-0" />
                      <span>{locale === 'ar' ? 'اشتري الآن' : 'Acheter'}</span>
                      <ArrowRight size={13} strokeWidth={2.5} className="text-white/70 group-hover:translate-x-0.5 rtl:rotate-180 transition-transform shrink-0" />
                    </>
                  )}
                </button>
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
