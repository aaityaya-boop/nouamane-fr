'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  RotateCcw,
  Check,
  ChevronRight as Chev,
  ChevronDown,
  Package,
  Gift,
  MessageCircle,
  Eye,
  Flame,
  Droplets,
  Wind,
  BadgeCheck,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { formatMAD, Product, isProductInStock } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { usePreferences } from '@/context/PreferencesContext';
import ReactMarkdown from 'react-markdown';
import { translations, Locale } from './translations';

/* ============================================================
   PRODUCT DETAIL PAGE
   Left: Gallery · Right: Info · Below: Reviews · Related
   ============================================================ */

export default function ProductClient({
  product,
  relatedProducts,
  initialReviews,
  includedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
  initialReviews: any[];
  includedProducts?: Product[];
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 
      ? (product.sizes.length > 1 ? product.sizes[1].label : product.sizes[0].label)
      : ''
  ); // Default to middle size if available, else first size, or empty if no sizes
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const pathname = usePathname();
  const locale = (pathname?.split('/')[1] || 'fr') as Locale;
  const t = translations[locale] || translations.fr;

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
  const isInWishlist = customer?.wishlist?.includes(product.slug) || false;
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewAuthStep, setReviewAuthStep] = useState<'login' | 'signup' | 'review'>('login');
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  const { addRecentlyViewed } = usePreferences();

  // Marketing states
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    // Scroll listener for sticky bar
    const handleScroll = () => {
      // Show sticky bar when scrolled past a certain point (e.g. 600px)
      if (window.scrollY > 700) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Track browsing activity via cookies (recently viewed memory)
    addRecentlyViewed(product.id);

    // Facebook Pixel ViewContent Tracking
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [product.sku || product.id.toString()],
        content_type: 'product',
        content_name: product.name,
        value: Math.max(Number((product.price).toFixed(2)), 0.01),
        currency: 'MAD'
      });
    }
  }, [product.id, product.sku, product.name, product.price, addRecentlyViewed]);

  useEffect(() => {
    if (customer) {
      setReviewAuthStep('review');
      setReviewFormData(prev => ({ ...prev, author: customer.name }));
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
    } catch (err) {
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
        body: JSON.stringify({ idToken })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCustomer(data.customer);
        setReviewAuthStep('review');
      } else {
        setAuthError(data.error || 'Erreur lors de la connexion Google');
      }
    } catch (error: any) {
      console.error("Google Auth Full Error:", error);
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

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (isAdding || !inStock) return;
    setIsAdding(true);

    const finalSize = selectedSize;

    // Facebook Pixel Tracking
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [product.sku || product.id.toString()],
        content_type: 'product',
        content_name: product.name,
        value: Math.max(Number((currentPrice * quantity).toFixed(2)), 0.01),
        currency: 'MAD'
      });
    }

    // Luxury Confetti & Shockwave Effect
    if (e && typeof document !== 'undefined') {
      const button = e.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // 1. Shockwave
      const shockwave = document.createElement('div');
      shockwave.className = 'btn-shockwave';
      button.appendChild(shockwave);
      setTimeout(() => shockwave.remove(), 600);

      // 2. Confetti Explosion
      const colors = ['#D4AF37', '#FFDF73', '#C0C0C0', '#ffffff'];
      for (let i = 0; i < 40; i++) {
        const confetti = document.createElement('div');
        confetti.className = (product.subcategory === 'coffrets') ? 'romantic-heart' : 'luxury-confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${x}px`;
        confetti.style.top = `${y}px`;
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = (product.subcategory === 'coffrets') ? 100 + Math.random() * 100 : 50 + Math.random() * 150;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 80;
        
        confetti.style.setProperty('--tx', `${tx}px`);
        confetti.style.setProperty('--ty', `${ty}px`);
        confetti.style.setProperty('--r', `${Math.random() * 720}deg`);
        
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1000);
      }
      
      const cartIcon = document.getElementById('header-cart-icon');
      if (cartIcon) {
        cartIcon.classList.add('scale-125');
        setTimeout(() => cartIcon.classList.remove('scale-125'), 300);
      }
    }

    // Process logic after brief delay for visual effect
    setTimeout(() => {
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
    }, 400); // 400ms is perfect for feeling the button press before drawer opens
  };

  const handleWishlistToggle = async () => {
    if (!customer) {
      alert("Connectez-vous pour ajouter aux favoris.");
      return;
    }
    
    setIsWishlistLoading(true);
    try {
      const action = isInWishlist ? 'remove' : 'add';
      const res = await fetch('/api/account/wishlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug: product.slug, action })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCustomer(data.customer);
        }
      } else {
        alert("Erreur lors de l'ajout aux favoris.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewFormData)
      });
      if (res.ok) {
        const newReview = {
          id: Date.now(),
          ...reviewFormData,
          createdAt: new Date().toISOString(),
          verified: false
        };
        setReviews([newReview, ...reviews]);
        setIsReviewModalOpen(false);
        setReviewFormData({ author: '', city: '', rating: 5, title: '', comment: '' });
      } else {
        alert("t.reviews.error");
      }
    } catch (error) {
      console.error(error);
      alert("t.reviews.error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.floor(r.rating) === star).length;
    return {
      star,
      count,
      percent: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
    };
  });

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen">
      <Header />

      {/* BREADCRUMB */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-28 lg:pt-32 pb-4">
        <nav className="flex items-center gap-2 text-[11px] text-[#9A9A9A]">
          <Link href={`/${locale}`} className="hover:text-[#0ea5e9]">{t.breadcrumb.home}</Link>
          <Chev size={12} />
          <Link href={`/${locale}/shop`} className="hover:text-[#0ea5e9]">{t.breadcrumb.shop}</Link>
          <Chev size={12} />
          <Link
            href={`/${locale}/shop/${product.gender}`}
            className="hover:text-[#0ea5e9]"
          >
            {product.subcategoryLabel}
          </Link>
          <Chev size={12} />
          <span className="text-[#1A1A1A]">{product.name}</span>
        </nav>
      </div>

      {/* ====== SPLIT PRODUCT DETAIL ====== */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* -------- IMAGE GALLERY -------- */}
          <div>
            <div className="relative aspect-[4/5] bg-transparent rounded-2xl overflow-hidden">
              <Image
                id="main-product-image"
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />

              {/* Arrows */}
              <button
                onClick={() =>
                  setSelectedImage(
                    (selectedImage - 1 + product.images.length) %
                      product.images.length
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white border border-[#e0ddd4]/85 hover:bg-white border border-[#e0ddd4] rounded-full flex items-center justify-center shadow-sm text-[#1A1A1A]"
                aria-label="Image précédente"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() =>
                  setSelectedImage((selectedImage + 1) % product.images.length)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white border border-[#e0ddd4]/85 hover:bg-white border border-[#e0ddd4] rounded-full flex items-center justify-center shadow-sm text-[#1A1A1A]"
                aria-label="Image suivante"
              >
                <ChevronRight size={18} />
              </button>

              {/* Wishlist */}
              <button
                disabled={isWishlistLoading}
                onClick={handleWishlistToggle}
                className={`absolute top-5 right-5 w-11 h-11 bg-white border border-[#e0ddd4]/85 hover:bg-white border border-[#e0ddd4] rounded-full flex items-center justify-center shadow-sm transition-colors ${isInWishlist ? 'text-red-500' : 'text-[#1A1A1A]'}`}
                aria-label="Ajouter aux favoris"
              >
                <Heart size={16} strokeWidth={1.6} fill={isInWishlist ? "currentColor" : "none"} />
              </button>

              <span className="absolute top-5 left-5 text-[9px] font-bold tracking-[0.2em] uppercase bg-[#f8fafc] text-white px-3 py-1.5 rounded-full">
                {product.brandLabel}
              </span>
            </div>

            {/* Thumbnails */}
            <div className="mt-5 grid grid-cols-4 gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                    selectedImage === i
                      ? 'border-[#0ea5e9]'
                      : 'border-transparent hover:border-[#e0ddd4]'
                  }`}
                >
                  <div className="relative w-full h-full bg-transparent">
                    <Image src={img} alt="" fill className="object-cover" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* -------- INFO -------- */}
          <div>
            <Link
              href={`/${locale}/brands/${product.brand}`}
              className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9] hover:text-[#7e22ce]"
            >
              {product.brandLabel}{product.isTester ? ` · ${t.info.authentic}` : ''}
            </Link>

            <h1 className="heading-font text-4xl lg:text-5xl xl:text-6xl mt-3 tracking-wide leading-none">
              {product.name}
            </h1>

            <div className="mt-3 italic text-[15px] text-[#6B6B6B]">
              {product.tagline}
            </div>

            {/* Rating */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.floor(product.rating)
                        ? 'text-[#0ea5e9] fill-[#0ea5e9]'
                        : 'text-[#e0ddd4] fill-[#e0ddd4]'
                    }
                  />
                ))}
              </div>
                <span className="text-[13px] font-bold text-[#1A1A1A] mr-1">
                  {product.rating.toFixed(1)}
                </span>
              <a
                href="#reviews"
                className="text-[13px] text-[#9A9A9A] underline hover:text-[#0ea5e9]"
              >
                {product.reviewCount} avis vérifiés
              </a>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold text-[#1A1A1A]">
                  {formatMAD(currentPrice)}
                </span>
                {product.originalPrice && product.originalPrice > currentPrice && (
                  <>
                    <span className="text-[15px] text-[#9A9A9A] line-through decoration-[#0ea5e9]/40 font-medium">
                      {formatMAD(product.originalPrice)}
                    </span>
                    <span className="bg-[#0ea5e9]/10 text-[#0ea5e9] px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase">
                      {t.info.save} {Math.round((1 - currentPrice / product.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              <span className="text-[13px] text-[#9A9A9A]">
                {currentSize?.label || ""} {product.isTester ? t.info.tester : ""}
              </span>
            </div>

            {/* CREDIBILITY & TRUST SIGNALS */}
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-[13px] text-[#1A1A1A] font-medium bg-[#fafaf7] w-fit px-4 py-2.5 rounded-xl border border-[#e0ddd4]">
                <ShieldCheck size={18} className="text-[#0ea5e9]" />
                <span>{t.trust.cod}</span>
              </div>
              {product.isTester ? (
                <div className="flex items-center gap-3 text-[13px] text-[#1A1A1A] font-medium bg-[#fafaf7] w-fit px-4 py-2.5 rounded-xl border border-[#e0ddd4]">
                  <BadgeCheck size={18} className="text-[#0ea5e9]" />
                  <span>{t.trust.original}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-[13px] text-[#1A1A1A] font-medium bg-[#fafaf7] w-fit px-4 py-2.5 rounded-xl border border-[#e0ddd4]">
                  <Sparkles size={18} className="text-[#0ea5e9]" />
                  <span>Qualité Premium Supérieure</span>
                </div>
              )}
            </div>

            {/* SIZE SELECTOR */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A]">
                  Sélectionnez la Contenance
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size.label}
                    onClick={() => setSelectedSize(size.label)}
                    className={`relative flex flex-col items-center justify-center py-4 px-3 rounded-xl border transition-all duration-300 ${
                      selectedSize === size.label
                        ? 'border-[#0ea5e9] bg-[#f8fafc] ring-1 ring-[#0ea5e9] shadow-sm'
                        : 'border-[#e0ddd4] bg-white text-[#6B6B6B] hover:border-[#9A9A9A]'
                    }`}
                  >
                    <span className={`text-[13px] font-semibold tracking-[0.05em] mb-1 ${selectedSize === size.label ? 'text-[#1A1A1A]' : ''}`}>
                      {size.label}
                    </span>
                    <span className={`text-[11px] ${selectedSize === size.label ? 'text-[#0ea5e9] font-medium' : 'text-[#9A9A9A]'}`}>
                      {formatMAD(size.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* QUANTITY + ADD */}
            <div className="mt-8 flex flex-col md:flex-row items-center gap-4">
              <div className={`flex w-full md:w-auto items-center justify-between border border-[#e0ddd4] rounded-xl bg-white ${!inStock ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!inStock}
                  className="w-12 h-14 flex items-center justify-center text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#fafaf7] rounded-l-xl transition disabled:cursor-not-allowed"
                  aria-label="Diminuer"
                >
                  <Minus size={16} />
                </button>
                <div className="px-6 text-[15px] font-semibold text-[#1A1A1A]">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!inStock}
                  className="w-12 h-14 flex items-center justify-center text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#fafaf7] rounded-r-xl transition disabled:cursor-not-allowed"
                  aria-label="Augmenter"
                >
                  <Plus size={16} />
                </button>
              </div>

              {inStock ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`btn-blue flex-1 w-full h-14 text-[13px] rounded-xl flex items-center justify-center gap-2 transition-all relative overflow-hidden ${
                    isAdded ? '!bg-green-600 hover:!bg-green-700' : 'hover:shadow-lg hover:shadow-[#0ea5e9]/20'
                  } ${isAdding ? 'opacity-80' : ''}`}
                >
                  {isAdding ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isAdded ? (
                    <>
                      <Check size={18} /> {t.actions.addSuccess}
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      Ajouter au panier — {formatMAD(currentPrice * quantity)}
                    </>
                  )}
                  {/* Subtle shine effect */}
                  {!isAdded && !isAdding && <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]" />}
                </motion.button>
              ) : (
                <button
                  disabled
                  className="bg-red-50 text-red-600 border border-red-200 flex-1 w-full h-14 text-[13px] rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest font-bold cursor-not-allowed shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  {t.info.outOfStock || 'Rupture de stock'}
                </button>
              )}
            </div>

            
            {/* GIFT OPTION */}
            <div className="mt-4">
              <a 
                href={`https://api.whatsapp.com/send?phone=212663380011&text=${encodeURIComponent("Bonjour, j'aimerais offrir " + product.name + " en cadeau et personnaliser mon emballage.")}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-[#f8fafc] border border-[#e0ddd4] text-[#1A1A1A] py-4 rounded-xl hover:bg-white hover:border-[#0ea5e9] transition-all group"
              >
                <Gift className="text-[#0ea5e9] group-hover:scale-110 transition-transform" size={20} />
                <span className="text-[13px] font-semibold tracking-wide">C'est pour offrir ? Personnalisez votre cadeau</span>
              </a>
            </div>

            {/* TRUST BADGES / SHIPPING PERKS */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-[#e0ddd4]">
              <PerkItem icon={<BadgeCheck size={20} className="text-[#0ea5e9]" />} label={t.perks.authLabel} sublabel={t.perks.authSub} />
              <PerkItem icon={<Truck size={20} className="text-[#0ea5e9]" />} label={t.perks.expressLabel} sublabel={t.perks.expressSub} />
              <PerkItem icon={<ShieldCheck size={20} className="text-[#0ea5e9]" />} label={t.perks.secureLabel} sublabel={t.perks.secureSub} />
              <PerkItem icon={<RotateCcw size={20} className="text-[#0ea5e9]" />} label={t.perks.returnLabel} sublabel={t.perks.returnSub} />
            </div>

            <div className="mt-6 p-5 bg-gradient-to-r from-[#f8fafc] to-white rounded-xl border border-[#0ea5e9]/20 flex gap-4 items-center hover:border-[#0ea5e9]/40 transition">
              <div className="text-[#0ea5e9] bg-[#0ea5e9]/10 p-3 rounded-full">
                <MessageCircle size={24} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#1A1A1A] mb-0.5">{t.support.title}</p>
                <p className="text-[12px] text-[#6B6B6B]">{t.support.desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== PRO DESCRIPTION: SEO & MARKETING LAYOUT ====== */}
      <section className="bg-white border-y border-[#e0ddd4]">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-10 py-16 lg:py-24 space-y-20">
          
          {/* L'Histoire (Description) */}
          <div className="text-left md:text-center prose prose-lg prose-[#555] max-w-none mx-auto">
            {product.longDescription ? (
              <ReactMarkdown 
                components={{
                  h1: ({node, ...props}) => <h2 className="heading-font text-3xl md:text-5xl text-[#1A1A1A] tracking-wide mb-6 text-center" {...props} />,
                  h2: ({node, ...props}) => <h3 className="heading-font text-2xl md:text-3xl text-[#1A1A1A] mt-8 mb-4 text-center" {...props} />,
                  h3: ({node, ...props}) => <h4 className="heading-font text-xl text-[#1A1A1A] mt-6 mb-3" {...props} />,
                  p: ({node, ...props}) => <p className="text-[16px] md:text-[18px] text-[#555] leading-[2] font-light mb-4" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside text-left mx-auto max-w-2xl text-[16px] md:text-[18px] text-[#555] leading-[2] font-light mb-4 space-y-2" {...props} />,
                  li: ({node, ...props}) => <li {...props} />
                }}
              >
                {product.longDescription}
              </ReactMarkdown>
            ) : (
              <>
                <h2 className="heading-font text-3xl md:text-5xl text-[#1A1A1A] tracking-wide mb-6 text-center">{t.description.history}</h2>
                <p className="text-[16px] md:text-[18px] text-[#555] leading-[2] font-light text-center">
                  {product.description}
                </p>
              </>
            )}
          </div>

          <div className="w-px h-24 bg-gradient-to-b from-[#e0ddd4] to-transparent mx-auto" />

          {/* Pyramide Olfactive */}
          <div>
            <div className="text-center mb-12">
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#0ea5e9] mb-3 block flex items-center justify-center gap-2">
                <Sparkles size={14} /> {t.description.compositionTitle}
              </span>
              <h2 className="heading-font text-3xl md:text-5xl text-[#1A1A1A] tracking-wide">{t.description.pyramid}</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 md:gap-6 text-center">
              {[
                { title: t.description.topNotes, desc: t.description.topDesc, items: product.notes.top || [], icon: <Wind size={24} className="text-[#0ea5e9]" /> },
                { title: t.description.heartNotes, desc: t.description.heartDesc, items: product.notes.heart || [], icon: <Heart size={24} className="text-[#0ea5e9]" /> },
                { title: t.description.baseNotes, desc: t.description.baseDesc, items: product.notes.base || [], icon: <Droplets size={24} className="text-[#0ea5e9]" /> },
              ].map((n, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  key={n.title} 
                  className="bg-white rounded-[32px] p-8 border border-[#e0ddd4] shadow-sm hover:shadow-xl hover:border-[#0ea5e9]/30 transition-all duration-500 relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                    {n.icon}
                  </div>
                  <div className="w-14 h-14 mx-auto bg-[#f8fafc] rounded-2xl flex items-center justify-center mb-6 text-[#0ea5e9] shadow-inner">
                    {n.icon}
                  </div>
                  <h3 className="heading-font text-2xl text-[#1A1A1A] mb-2">{n.title}</h3>
                  <p className="text-[11px] font-bold tracking-widest uppercase text-[#9A9A9A] mb-6">{n.desc}</p>
                  <ul className="space-y-3 relative z-10">
                    {n.items.map((item) => (
                      <li key={item} className="text-[15px] text-[#555] font-medium bg-[#f8fafc] py-2 px-4 rounded-lg inline-block w-full">
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Caractéristiques Clés */}
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-[40px] p-10 md:p-16 text-white text-center shadow-[0_20px_40px_rgba(0,0,0,0.2)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h2 className="heading-font text-3xl md:text-5xl tracking-wide mb-12 relative z-10">{t.essence.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 relative z-10">
              <div className="flex flex-col items-center gap-4 bg-white/5 p-6 rounded-3xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A]">{t.essence.concentration}</span>
                <span className="text-lg font-semibold tracking-wide text-[#0ea5e9]">{t.essence.edp}</span>
              </div>
              <div className="flex flex-col items-center gap-4 bg-white/5 p-6 rounded-3xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A]">{t.essence.gender}</span>
                <span className="text-lg font-semibold tracking-wide text-white">{product.gender === 'women' ? t.genderMap.women : product.gender === 'men' ? t.genderMap.men : t.genderMap.unisex}</span>
              </div>
              <div className="flex flex-col items-center gap-4 bg-white/5 p-6 rounded-3xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A]">{t.essence.family}</span>
                <span className="text-lg font-semibold tracking-wide text-white">{product.subcategoryLabel}</span>
              </div>
              <div className="flex flex-col items-center gap-4 bg-white/5 p-6 rounded-3xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A]">{t.essence.season}</span>
                <span className="text-lg font-semibold tracking-wide text-white">{product.perfectSeason || t.essence.allSeasons}</span>
              </div>
            </div>
          </div>

          {/* Pourquoi Choisir */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="heading-font text-3xl text-[#1A1A1A] tracking-wide mb-6">{t.whyChoose.title} {product.name} ?</h2>
              <p className="text-[15px] text-[#555] leading-relaxed mb-6">{t.whyChoose.desc}</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-[#0ea5e9] mt-1 shrink-0" />
                  <span className="text-[#1A1A1A] font-medium text-[14px]">{t.whyChoose.bullet1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-[#0ea5e9] mt-1 shrink-0" />
                  <span className="text-[#1A1A1A] font-medium text-[14px]">{product.isTester ? t.whyChoose.bullet2 : 'Qualité Premium Supérieure'} {product.brandLabel}</span>
                </li>
              </ul>
            </div>
            <div className="bg-[#f8fafc] p-8 rounded-[32px] border border-[#e0ddd4]">
              <h3 className="heading-font text-2xl text-[#1A1A1A] tracking-wide mb-4">{t.whenToWear.title}</h3>
              <p className="text-[14px] text-[#555] leading-relaxed mb-0">{t.whenToWear.desc}</p>
            </div>
          </div>

        </div>
      </section>

      {/* ====== REVIEWS ====== */}
      <section id="reviews" className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[320px_1fr] gap-12">
          {/* Rating Summary */}
          <div className="lg:sticky lg:top-28 self-start">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">{t.reviews.title}</span>
            <h2 className="heading-font text-3xl lg:text-4xl mt-2 tracking-wide">{product.reviewCount} {t.reviews.count}</h2>

            <div className="flex items-center gap-3 mt-6">
              <div className="heading-font text-5xl text-[#1A1A1A] mb-2">
                {product.rating.toFixed(1)}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < Math.floor(product.rating)
                          ? 'text-[#0ea5e9] fill-[#0ea5e9]'
                          : 'text-[#e0ddd4] fill-[#e0ddd4]'
                      }
                    />
                  ))}
                </div>
                <div className="text-[11px] text-[#9A9A9A] mt-1">{t.reviews.outOf5}</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="mt-8 space-y-2">
              {ratingBreakdown.map((r) => (
                <div key={r.star} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#6B6B6B] w-4">{r.star}</span>
                  <Star size={12} className="text-[#0ea5e9] fill-[#0ea5e9]" />
                  <div className="flex-1 h-1.5 bg-[#eeece5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0ea5e9]"
                      style={{ width: `${r.percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#9A9A9A] w-6 text-right">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={() => setIsReviewModalOpen(true)} className="btn-outline-blue w-full mt-8 py-3 text-[11px] rounded-full">{t.reviews.leaveReview}</button>
          </div>

          {/* Reviews list */}
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-14">
                <p className="text-[#9A9A9A] text-sm">{t.reviews.noReviews}</p>
              </div>
            ) : (
              <div className="space-y-10">
                {reviews.slice(0, visibleReviewsCount).map((review) => (
                  <article
                    key={review.id}
                    className="pb-10 border-b border-[#e0ddd4] last:border-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-transparent flex items-center justify-center heading-font text-[#0ea5e9]">
                            {review.author.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-[14px] text-[#1A1A1A]">
                              {review.author}
                            </div>
                            <div className="text-[11px] text-[#9A9A9A]">
                              <span suppressHydrationWarning>
                                {review.city} · {new Date(review.createdAt).toLocaleDateString('fr-MA', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={
                                  i < review.rating
                                    ? 'text-[#0ea5e9] fill-[#0ea5e9]'
                                    : 'text-[#e0ddd4] fill-[#e0ddd4]'
                                }
                              />
                            ))}
                          </div>
                          {review.verified && (
                            <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-green-600 flex items-center gap-1">
                              <Check size={11} /> {t.reviews.verified}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <h4 className="heading-font text-xl mt-4 text-[#1A1A1A]">
                      {review.title}
                    </h4>
                    <p className="mt-2 text-[14px] text-[#6B6B6B] leading-[1.8]">
                      {review.comment}
                    </p>
                  </article>
                ))}
              </div>
            )}
            {reviews.length > visibleReviewsCount && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={() => setVisibleReviewsCount(prev => prev + 5)}
                  className="px-6 py-2.5 rounded-full border border-[#0ea5e9] text-[#0ea5e9] text-[12px] font-bold tracking-wide hover:bg-[#0ea5e9] hover:text-white transition-colors"
                >
                  Voir plus d'avis ({reviews.length - visibleReviewsCount} restants)
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====== RELATED ====== */}
      {relatedProducts.length > 0 && (
        <section className="bg-transparent border-t border-[#e0ddd4]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16 lg:py-20">
            <div className="text-center mb-12">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">{t.related.title}</span>
              <h2 className="heading-font text-3xl lg:text-4xl mt-2 tracking-wide">{t.related.subtitle}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} showRating={false} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== REVIEW MODAL ====== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 p-6 lg:p-8 max-h-[90vh] overflow-y-auto">
            
            {reviewAuthStep === 'login' && !customer && (
              <div className="text-center py-4">
                <h3 className="heading-font text-2xl mb-2">{t.reviews.loginTitle}</h3>
                <p className="text-[#6B6B6B] text-[13px] mb-6">{t.reviews.loginDesc}</p>
                
                {authError && <div className="bg-red-50 text-red-600 text-[12px] p-2 rounded mb-4">{authError}</div>}

                <form className="space-y-4" onSubmit={(e) => handleReviewAuth(e, 'login')}>
                  <div>
                    <input required type="email" placeholder={t.reviews.email} value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} className="w-full border border-[#e0ddd4] rounded-lg px-4 py-3 text-[13px] focus:outline-none focus:border-[#0ea5e9]" />
                  </div>
                  <div>
                    <input required type="password" placeholder={t.reviews.password} value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full border border-[#e0ddd4] rounded-lg px-4 py-3 text-[13px] focus:outline-none focus:border-[#0ea5e9]" />
                  </div>
                  <button type="submit" disabled={loadingAuth} className="w-full btn-blue py-3 rounded-full text-[12px] mt-4 font-bold tracking-wider disabled:opacity-70">
                    {loadingAuth ? 'Connexion...' : 'Se Connecter'}
                  </button>
                </form>
                
                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Ou continuer avec</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                
                <button type="button" onClick={handleGoogleAuth} disabled={loadingAuth} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-full text-[12px] font-bold tracking-wider hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <div className="mt-6 text-[12px] text-[#6B6B6B]"> {t.reviews.newCustomer} <button onClick={() => {setReviewAuthStep('signup'); setAuthError('');}} className="text-[#0ea5e9] font-bold underline">{t.reviews.createAccount}</button>
                </div>
              </div>
            )}

            {reviewAuthStep === 'signup' && !customer && (
              <div className="text-center py-4">
                <h3 className="heading-font text-2xl mb-2">{t.reviews.signupTitle}</h3>
                <p className="text-[#6B6B6B] text-[13px] mb-6">{t.reviews.signupDesc}</p>
                
                {authError && <div className="bg-red-50 text-red-600 text-[12px] p-2 rounded mb-4">{authError}</div>}

                <form className="space-y-4" onSubmit={(e) => handleReviewAuth(e, 'register')}>
                  <div>
                    <input required type="text" placeholder={t.reviews.fullName} value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} className="w-full border border-[#e0ddd4] rounded-lg px-4 py-3 text-[13px] focus:outline-none focus:border-[#0ea5e9]" />
                  </div>
                  <div>
                    <input required type="email" placeholder={t.reviews.email} value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} className="w-full border border-[#e0ddd4] rounded-lg px-4 py-3 text-[13px] focus:outline-none focus:border-[#0ea5e9]" />
                  </div>
                  <div>
                    <input required type="password" placeholder={t.reviews.password} value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full border border-[#e0ddd4] rounded-lg px-4 py-3 text-[13px] focus:outline-none focus:border-[#0ea5e9]" />
                  </div>
                  <button type="submit" disabled={loadingAuth} className="w-full btn-blue py-3 rounded-full text-[12px] mt-4 font-bold tracking-wider disabled:opacity-70">
                    {loadingAuth ? 'Inscription...' : "S'inscrire"}
                  </button>
                </form>
                
                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Ou continuer avec</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                
                <button type="button" onClick={handleGoogleAuth} disabled={loadingAuth} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-full text-[12px] font-bold tracking-wider hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <div className="mt-6 text-[12px] text-[#6B6B6B]"> {t.reviews.alreadyAccount} <button onClick={() => {setReviewAuthStep('login'); setAuthError('');}} className="text-[#0ea5e9] font-bold underline">{t.reviews.loginLink}</button>
                </div>
              </div>
            )}

            {(reviewAuthStep === 'review' || customer) && (
              <>
                <h3 className="heading-font text-2xl mb-6">{t.reviews.reviewTitle}</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[#9A9A9A] mb-1">{t.reviews.nameLabel}</label>
                      <input required type="text" value={reviewFormData.author} onChange={e => setReviewFormData({...reviewFormData, author: e.target.value})} className="w-full border border-[#e0ddd4] rounded-lg px-4 py-2 text-[13px] focus:outline-none focus:border-[#0ea5e9]" placeholder={t.reviews.namePlace} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[#9A9A9A] mb-1">{t.reviews.cityLabel}</label>
                      <input required type="text" value={reviewFormData.city} onChange={e => setReviewFormData({...reviewFormData, city: e.target.value})} className="w-full border border-[#e0ddd4] rounded-lg px-4 py-2 text-[13px] focus:outline-none focus:border-[#0ea5e9]" placeholder={t.reviews.cityPlace} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[#9A9A9A] mb-2">{t.reviews.ratingLabel}</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button type="button" key={star} onClick={() => setReviewFormData({...reviewFormData, rating: star})}>
                          <Star size={24} className={star <= reviewFormData.rating ? 'text-[#0ea5e9] fill-[#0ea5e9]' : 'text-[#e0ddd4] fill-[#e0ddd4]'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[#9A9A9A] mb-1">{t.reviews.reviewTitleLabel}</label>
                    <input required type="text" value={reviewFormData.title} onChange={e => setReviewFormData({...reviewFormData, title: e.target.value})} className="w-full border border-[#e0ddd4] rounded-lg px-4 py-2 text-[13px] focus:outline-none focus:border-[#0ea5e9]" placeholder={t.reviews.reviewTitlePlace} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[#9A9A9A] mb-1">{t.reviews.reviewLabel}</label>
                    <textarea required rows={4} value={reviewFormData.comment} onChange={e => setReviewFormData({...reviewFormData, comment: e.target.value})} className="w-full border border-[#e0ddd4] rounded-lg px-4 py-2 text-[13px] focus:outline-none focus:border-[#0ea5e9] resize-none" placeholder={t.reviews.reviewPlace}></textarea>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsReviewModalOpen(false)} className="flex-1 btn-outline-blue py-3 text-[11px] rounded-full">{t.reviews.cancel}</button>
                    <button type="submit" disabled={isSubmittingReview} className="flex-1 btn-blue py-3 text-[11px] rounded-full disabled:opacity-50">
                      {isSubmittingReview ? 'Envoi...' : 'Publier'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pb-16">
        <RecentlyViewed currentProductId={product.id} />
      </div>
      <Footer />
      <CartDrawer />

      {/* ====== STICKY ADD TO CART BAR ====== */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e0ddd4] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-4 md:py-4 md:px-8 flex items-center justify-between gap-4"
          >
            <div className="hidden md:flex items-center gap-4">
              <div className="w-12 h-12 relative rounded bg-[#f8fafc] overflow-hidden">
                <Image src={product.images[0]} alt="" fill className="object-cover" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#1A1A1A] line-clamp-1">{product.name}</div>
                <div className="text-[12px] text-[#6B6B6B]">{formatMAD(currentPrice)} {currentSize ? `- ${currentSize.label}` : ""}</div>
              </div>
            </div>
            <div className="flex-1 md:flex-none flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
              <div className="md:hidden">
                <div className="text-[16px] font-bold text-[#1A1A1A]">{formatMAD(currentPrice)}</div>
                <div className="text-[11px] text-[#0ea5e9]">{t.sticky.cod}</div>
              </div>
              
              {inStock ? (
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => handleAddToCart(), 300);
                  }}
                  className={`btn-blue px-8 py-3.5 text-[12px] rounded-xl flex items-center justify-center gap-2 transition-all ${
                    isAdded ? '!bg-green-600' : 'hover:shadow-lg'
                  }`}
                >
                  {isAdded ? <><Check size={16} /> {t.actions.added}</> : <><ShoppingBag size={16} /> {t.actions.add}</>}
                </button>
              ) : (
                <button
                  disabled
                  className="bg-red-50 text-red-600 border border-red-200 px-8 py-3.5 text-[12px] rounded-xl flex items-center justify-center gap-2 cursor-not-allowed font-bold uppercase tracking-wider"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  {t.info.outOfStock || 'Rupture de stock'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PerkItem({ icon, label, sublabel }: { icon: React.ReactNode; label: string; sublabel: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="w-12 h-12 rounded-full bg-[#f8fafc] border border-[#0ea5e9]/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-[12px] font-bold text-[#1A1A1A]">{label}</div>
        <div className="text-[11px] text-[#6B6B6B] leading-tight">{sublabel}</div>
      </div>
    </div>
  );
}
