'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, calculatePromoDiscount } from '@/context/CartContext';
import { formatMAD, MOROCCAN_CITIES } from '@/lib/products';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, CountryCode } from '@/lib/countryCodes';
import Cookies from 'js-cookie';
import {
  Lock,
  Truck,
  Banknote,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Tag,
  CheckCircle2,
  XCircle,
  Phone,
  Check,
  PackageCheck,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  MapPin,
  User,
  MessageCircle,
  Clock,
  Search,
} from 'lucide-react';
import FreeGiftSelector from '@/components/FreeGiftSelector';
import { useAuth } from '@/context/AuthContext';
import PromoAuthModal from '@/components/PromoAuthModal';

/* Top 14 Moroccan destinations for instant selection */
const TOP_MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Tanger',
  'Fès',
  'Agadir',
  'Mohammedia',
  'Salé',
  'Meknès',
  'Kénitra',
  'Tétouan',
  'El Jadida',
  'Oujda',
  'Nador',
];

const OTHER_CITIES = MOROCCAN_CITIES.filter((c) => !TOP_MOROCCAN_CITIES.includes(c));

function CheckoutPageInner() {
  const {
    cart,
    getSubtotal,
    clearCart,
    shippingFee,
    appliedPromo,
    applyPromo,
    removePromo,
    appliedDeal,
    dealDiscount,
    selectedFreeGift,
  } = useCart();

  const searchParams = useSearchParams();
  const isBuyNow = searchParams?.get('buyNow') === '1';
  const buyNowSlug = searchParams?.get('slug') || '';
  const buyNowQty = searchParams?.get('qty') || '1';
  const buyNowSize = searchParams?.get('size') || '';

  const [buyNowData, setBuyNowData] = useState<{
    item: any;
    subtotal: number;
    shipping: number;
    total: number;
  } | null>(null);
  const [buyNowLoading, setBuyNowLoading] = useState(isBuyNow);
  const [buyNowError, setBuyNowError] = useState<string | null>(null);

  // Mobile Order Summary Accordion State
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Country Code Picker State (Default: Morocco +212)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(POPULAR_COUNTRIES[0]);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryPickerRef = useRef<HTMLDivElement>(null);

  // Success Celebration Modal State
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderNumber: string;
    invoiceToken: string | null;
    customerName: string;
    total: number;
    city: string;
  } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Close country picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryPickerRef.current && !countryPickerRef.current.contains(event.target as Node)) {
        setIsCountryPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchParams.get('previewCelebration') === '1') {
      setOrderSuccessData({
        orderNumber: 'NAY-2026-9412',
        invoiceToken: 'DEMO-TOKEN',
        customerName: 'Youssef El Alami',
        total: 334,
        city: 'Casablanca',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isBuyNow) {
      setBuyNowLoading(false);
      return;
    }
    if (!buyNowSlug) {
      setBuyNowError('Identifiant produit manquant');
      setBuyNowLoading(false);
      return;
    }

    let isMounted = true;
    setBuyNowLoading(true);
    setBuyNowError(null);

    const query = new URLSearchParams({
      slug: buyNowSlug,
      qty: buyNowQty,
    });
    if (buyNowSize) {
      query.set('size', buyNowSize);
    }

    fetch(`/api/checkout/buy-now?${query.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || err.error || 'Erreur lors de la validation du produit.');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setBuyNowData(data);
          setBuyNowLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[Buy Now] Resolution error:', err);
          setBuyNowError(err.message || 'Impossible de charger ce produit.');
          setBuyNowLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isBuyNow, buyNowSlug, buyNowQty, buyNowSize]);

  // Authoritative items and calculations
  const effectiveCart = isBuyNow
    ? (buyNowData?.item ? [buyNowData.item] : [])
    : cart;
  const { customer } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingPromoCode, setPendingPromoCode] = useState('');

  // Auto prefill pending welcome promo if available
  useEffect(() => {
    try {
      const pending = localStorage.getItem('pending_welcome_promo');
      if (pending && !promoInput && !appliedPromo) {
        setPromoInput(pending);
      }
    } catch {}
  }, [appliedPromo, promoInput]);

  const subtotal = isBuyNow
    ? (buyNowData?.subtotal || 0)
    : getSubtotal();

  const shipping = isBuyNow
    ? (buyNowData?.shipping ?? (subtotal >= 800 ? 0 : 35))
    : (shippingFee || 0);

  // Calculate discount using accurate scope and product targeting
  const promoDiscount = !isBuyNow ? calculatePromoDiscount(effectiveCart, appliedPromo) : 0;
  const totalDiscount = !isBuyNow ? (appliedPromo ? promoDiscount : dealDiscount) : 0;
  const total = isBuyNow
    ? (buyNowData?.total ?? (subtotal + shipping))
    : Math.max(0, subtotal - totalDiscount) + shipping;

  // Free shipping threshold indicator (800 MAD)
  const freeShippingThreshold = 800;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Casablanca',
    postalCode: '',
    notes: '',
    paymentMethod: 'cod' as 'cod' | 'card',
  });

  // Pre-fill form from authenticated customer if available
  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || customer.name.split(' ')[0] || '',
        lastName: prev.lastName || customer.name.split(' ').slice(1).join(' ') || '',
        email: prev.email || customer.email || '',
        phone: prev.phone || customer.phone || '',
        address: prev.address || customer.address || '',
        city: prev.city || customer.city || 'Casablanca',
        postalCode: prev.postalCode || customer.postalCode || '',
      }));
    }
  }, [customer]);

  // Facebook Pixel InitiateCheckout event
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq && effectiveCart.length > 0) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: effectiveCart.map((item) => item.sku || item.id.toString()),
        content_type: 'product',
        value: Math.max(Number(subtotal.toFixed(2)), 0.01),
        currency: 'MAD',
        num_items: effectiveCart.length,
      });
    }
  }, [effectiveCart.length, subtotal]);

  // Real-time abandoned checkout lead capture
  useEffect(() => {
    if (isBuyNow || !cart || cart.length === 0) return;
    const hasContact = Boolean(form.phone.trim() || form.email.trim() || form.firstName.trim());
    if (!hasContact) return;

    const timer = setTimeout(() => {
      let sessionId = Cookies.get('nouamaneSession');
      if (!sessionId) {
        sessionId =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        Cookies.set('nouamaneSession', sessionId, { expires: 365, path: '/' });
      }

      fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          items: cart,
          totalValue: subtotal,
          customerName: `${form.firstName} ${form.lastName}`.trim(),
          customerPhone: `${selectedCountry.dial} ${form.phone.trim()}`,
          customerEmail: form.email.trim(),
          customerCity: form.city,
          status: 'ACTIVE',
        }),
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [form.phone, form.firstName, form.lastName, form.email, form.city, cart, subtotal, isBuyNow, selectedCountry.dial]);

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyPromo = async (codeToOverride?: string) => {
    const code = (typeof codeToOverride === 'string' ? codeToOverride : promoInput)
      .trim()
      .toUpperCase();
    if (!code) return;

    if (!customer) {
      setPendingPromoCode(code);
      setShowAuthModal(true);
      return;
    }

    setIsApplyingPromo(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const res = await fetch('/api/checkout/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          items: cart,
          subtotal,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        applyPromo({
          code: data.code,
          type: data.type,
          value: data.value,
          applicableScope: data.applicableScope,
          categories: data.categories,
          productIds: data.productIds,
          minOrderAmount: data.minOrderAmount,
          minQuantity: data.minQuantity || 0,
          description: data.description,
        });
        const scopeNotice =
          data.applicableScope === 'SPECIFIC_PRODUCTS'
            ? ' (sur parfums sélectionnés)'
            : data.applicableScope === 'CATEGORIES'
            ? ' (sur catégories ciblées)'
            : '';
        setPromoSuccess(`Code ${data.code} appliqué avec succès${scopeNotice} !`);
        setPromoInput('');
        setPendingPromoCode('');
      } else if (data.requiresAccount) {
        setPendingPromoCode(code);
        setShowAuthModal(true);
      } else {
        setPromoError(data.error || 'Code promo invalide');
        removePromo();
      }
    } catch {
      setPromoError('Erreur de validation du code promo');
      removePromo();
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    removePromo();
    setPromoSuccess('');
    setPromoError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveCart.length === 0 || isSubmitting) return;

    const cleanPhone = form.phone.replace(/[\s\-\.\(\)]/g, '');
    if (cleanPhone.length < 6) {
      alert('Veuillez renseigner un numéro de téléphone WhatsApp valide pour coordonner la livraison.');
      return;
    }

    const fullPhoneNumber = form.phone.startsWith('+')
      ? form.phone.trim()
      : `${selectedCountry.dial} ${form.phone.trim()}`;

    if (appliedPromo && !customer) {
      setPendingPromoCode(appliedPromo.code);
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `${form.firstName} ${form.lastName}`.trim(),
          customerEmail: form.email,
          customerPhone: fullPhoneNumber,
          shippingAddress: form.address,
          shippingCity: form.city,
          shippingPostalCode: form.postalCode,
          paymentMethod: form.paymentMethod,
          items: effectiveCart,
          subtotal,
          shippingCost: shipping,
          total,
          promoCode: isBuyNow
            ? null
            : appliedPromo?.code ||
              (appliedDeal ? `OFFRE:${appliedDeal.badgeText || appliedDeal.title}` : null),
          discount: isBuyNow ? null : totalDiscount > 0 ? totalDiscount : null,
          selectedFreeGift: isBuyNow ? null : appliedPromo ? null : selectedFreeGift || null,
          sessionId: Cookies.get('nouamaneSession') || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Order failed');
      }

      const { orderNumber, invoiceToken } = await res.json();

      Cookies.remove('nouamaneSession');

      const confirmationData = {
        orderNumber,
        invoiceToken: invoiceToken || null,
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerEmail: form.email,
        customerPhone: fullPhoneNumber,
        shippingAddress: form.address,
        shippingCity: form.city,
        shippingPostalCode: form.postalCode,
        paymentMethod: form.paymentMethod,
        items: effectiveCart,
        subtotal,
        shippingCost: shipping,
        total,
        promoCode: isBuyNow
          ? null
          : appliedPromo?.code ||
            (appliedDeal ? `OFFRE:${appliedDeal.badgeText || appliedDeal.title}` : null),
        discount: isBuyNow ? null : totalDiscount > 0 ? totalDiscount : null,
        selectedFreeGift: isBuyNow ? null : appliedPromo ? null : selectedFreeGift || null,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('nouamaneLastOrder', JSON.stringify(confirmationData));

      const trackingCart = [...effectiveCart];
      const trackingTotal = total;

      if (!isBuyNow) {
        clearCart();
        removePromo();
        Cookies.remove('nouamaneSession');
      }

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          content_ids: trackingCart.map((item) => item.sku || item.id.toString()),
          content_type: 'product',
          value: Math.max(Number(trackingTotal.toFixed(2)), 0.01),
          currency: 'MAD',
          contents: trackingCart.map((item) => ({
            id: item.sku || item.id.toString(),
            quantity: item.quantity,
            item_price: Number(item.price.toFixed(2)),
          })),
        });
      }

      // Trigger Celebration Modal with Luxury Animation before redirect
      setOrderSuccessData({
        orderNumber,
        invoiceToken: invoiceToken || null,
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        total,
        city: form.city,
      });

      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors de la validation. Veuillez vérifier vos informations et réessayer.');
      setIsSubmitting(false);
    }
  };

  const handleMobileSubmitClick = () => {
    if (formRef.current) {
      if (formRef.current.reportValidity()) {
        formRef.current.requestSubmit();
      }
    }
  };

  const backHref = isBuyNow && buyNowSlug ? `/${locale}/product/${buyNowSlug}` : `/${locale}/cart`;

  // Filtered countries for search
  const filteredCountries = ALL_COUNTRIES.filter((c) => {
    const q = countrySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  /* ---- BUY NOW LOADING GUARD ---- */
  if (isBuyNow && buyNowLoading) {
    return (
      <div className="bg-[#fafaf7] min-h-screen flex flex-col justify-between">
        <LuxuryTunnelHeader backHref={backHref} isBuyNow={isBuyNow} locale={locale} />
        <div className="max-w-md mx-auto py-24 text-center px-6">
          <div className="w-12 h-12 border-3 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="heading-font text-xl font-bold text-[#1A1A1A]">Sécurisation de votre commande…</h2>
          <p className="text-[#6B6B6B] text-[13px] mt-1.5 font-medium">Préparation de votre flacon d&apos;exception en direct de l&apos;Atelier.</p>
        </div>
        <LuxuryTunnelFooter />
      </div>
    );
  }

  /* ---- BUY NOW ERROR GUARD ---- */
  if (isBuyNow && (buyNowError || !buyNowData)) {
    return (
      <div className="bg-[#fafaf7] min-h-screen flex flex-col justify-between">
        <LuxuryTunnelHeader backHref={backHref} isBuyNow={isBuyNow} locale={locale} />
        <div className="max-w-md mx-auto py-24 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-5 shadow-xs">
            <XCircle size={32} />
          </div>
          <h1 className="heading-font text-2xl sm:text-3xl font-bold mb-2 text-[#1A1A1A]">
            Flacon momentanément indisponible
          </h1>
          <p className="text-[#6B6B6B] text-[13px] mb-8 leading-relaxed">
            {buyNowError || 'Ce parfum est actuellement indisponible ou le lien a expiré.'}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-[13px] font-bold rounded-full hover:from-[#0284c7] hover:to-[#0369a1] transition shadow-md shadow-sky-500/25"
          >
            Découvrir nos parfums en stock
          </Link>
        </div>
        <LuxuryTunnelFooter />
      </div>
    );
  }

  /* ---- EMPTY CART GUARD ---- */
  if (!isBuyNow && cart.length === 0) {
    return (
      <div className="bg-[#fafaf7] min-h-screen flex flex-col justify-between">
        <LuxuryTunnelHeader backHref={`/${locale}/shop`} isBuyNow={false} locale={locale} />
        <div className="max-w-md mx-auto py-24 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1A1A1A] mx-auto mb-5 shadow-xs">
            <ShoppingBag size={28} />
          </div>
          <h1 className="heading-font text-2xl sm:text-3xl font-bold mb-2 text-[#1A1A1A]">
            Votre sélection est vide
          </h1>
          <p className="text-[#6B6B6B] text-[13px] mb-8 leading-relaxed">
            Sélectionnez votre parfum ou testeur officiel avant de finaliser votre commande.
          </p>
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-[13px] font-bold rounded-full hover:from-[#0284c7] hover:to-[#0369a1] transition shadow-md shadow-sky-500/25"
          >
            Explorer la boutique
          </Link>
        </div>
        <LuxuryTunnelFooter />
      </div>
    );
  }

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen flex flex-col justify-between selection:bg-[#0ea5e9] selection:text-white pb-24 lg:pb-0">
      
      {/* 1. DEDICATED LUXURY CHECKOUT HEADER WITH PROMINENT NAY LOGO */}
      <LuxuryTunnelHeader backHref={backHref} isBuyNow={isBuyNow} locale={locale} />

      {/* 2. SLENDER TV NEWS TICKER MARQUEE (COMPACT & SLEEK) */}
      <div className="bg-[#1A1A1A] text-white py-1 sm:py-1.5 overflow-hidden border-b border-[#2A2A2A] select-none">
        <div
          className="flex w-max animate-marquee hover:[animation-play-state:paused]"
          style={{ animationDuration: '28s' }}
        >
          {[0, 1].map((copyIndex) => (
            <div
              key={copyIndex}
              className="flex items-center gap-6 sm:gap-10 shrink-0 pr-6 sm:pr-10 text-[10px] sm:text-[11px] font-medium tracking-wider uppercase"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
                <span className="font-bold text-white">PAIEMENT EN ESPÈCES À LA LIVRAISON</span>
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5 text-white">
                <PackageCheck size={13} className="text-[#0ea5e9]" />
                <span>Ouvrez & testez votre flacon devant le livreur</span>
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5 text-white">
                <Truck size={13} className="text-[#0ea5e9]" />
                <span>Livraison express 24h / 48h partout au Maroc</span>
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5 text-white">
                <ShieldCheck size={13} className="text-[#0ea5e9]" />
                <span>Parfums & Testeurs 100% Authentiques</span>
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5 text-white">
                <Sparkles size={13} className="text-[#0ea5e9]" />
                <span>Règlement sécurisé en mains propres</span>
              </span>
              <span className="text-white/30">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MAIN CHECKOUT CONTAINER */}
      <main className="flex-1 py-8 sm:py-12 lg:py-16">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* TITLE & STEP BREADCRUMB */}
          <div className="mb-8 sm:mb-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-[#0284c7] text-[11px] font-bold uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
              Commande Express · Paiement à la livraison
            </div>
            <h1 className="heading-font text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1A1A1A]">
              Finaliser votre commande
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#6B6B6B] mt-1.5 max-w-2xl">
              Remplissez vos coordonnées ci-dessous. Le livreur coordonnera avec vous par téléphone avant son passage.
            </p>

            {/* Visual Stepper */}
            <div className="mt-6 pt-5 border-t border-[#e0ddd4] grid grid-cols-3 max-w-xl text-[11px] sm:text-[12px] font-bold">
              <div className="flex items-center gap-2 text-[#1A1A1A]">
                <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                <span className="truncate">Coordonnées</span>
              </div>
              <div className="flex items-center gap-2 text-[#1A1A1A]">
                <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                <span className="truncate">Livraison Maroc</span>
              </div>
              <div className="flex items-center gap-2 text-[#0284c7]">
                <span className="w-5 h-5 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                <span className="truncate">Paiement COD</span>
              </div>
            </div>
          </div>

          {/* MOBILE ONLY: EXPANDABLE ORDER SUMMARY DRAWER */}
          <div className="lg:hidden mb-6 bg-white border border-[#e0ddd4] rounded-2xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileSummaryOpen((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#fafaf7] transition"
              aria-expanded={mobileSummaryOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShoppingBag size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <span>Voir le récapitulatif</span>
                    <span className="text-[11px] font-normal text-[#6B6B6B]">
                      ({effectiveCart.length} article{effectiveCart.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="text-[11px] text-[#0ea5e9] font-medium flex items-center gap-1 mt-0.5">
                    <span>{mobileSummaryOpen ? 'Masquer le détail' : 'Toucher pour afficher les détails'}</span>
                    {mobileSummaryOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[16px] font-extrabold text-[#1A1A1A] tracking-tight">
                  {formatMAD(total)}
                </span>
                <span className="block text-[10px] text-[#0ea5e9] font-bold">
                  {shipping === 0 ? 'Livraison offerte' : '+35 DH livraison'}
                </span>
              </div>
            </button>

            {/* Expandable Content */}
            {mobileSummaryOpen && (
              <div className="p-4 pt-0 border-t border-[#f1f1eb] bg-[#fafaf7]/50 divide-y divide-[#f1f1eb]">
                <div className="py-3 space-y-3 max-h-64 overflow-y-auto">
                  {effectiveCart.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex items-center gap-3">
                      <div className="relative w-12 h-14 bg-white rounded-xl border border-[#E8E2D6] overflow-hidden shrink-0 flex items-center justify-center">
                        <Image src={item.image} alt={item.name} fill className="object-contain scale-120 mix-blend-multiply" />
                        <span className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-[#1A1A1A] truncate">{item.name}</div>
                        <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">{item.size}</div>
                      </div>
                      <div className="text-[13px] font-bold text-[#1A1A1A]">
                        {formatMAD(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 space-y-1.5 text-[12px]">
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Sous-total</span>
                    <span className="font-semibold text-[#1A1A1A]">{formatMAD(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Frais de livraison</span>
                    <span className={shipping === 0 ? 'text-[#0ea5e9] font-bold' : 'text-[#1A1A1A] font-semibold'}>
                      {shipping === 0 ? 'Livraison Gratuite (0 MAD)' : formatMAD(shipping)}
                    </span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-[#0ea5e9] font-semibold">
                      <span>Remise</span>
                      <span>-{formatMAD(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[14px] font-extrabold text-[#1A1A1A] pt-2 border-t border-[#e0ddd4]">
                    <span>Total à régler au livreur</span>
                    <span className="text-[#1A1A1A]">{formatMAD(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MAIN CHECKOUT GRID (NO items-start SO ASIDE COLUMN STRETCHES FOR SMOOTH STICKY) */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="grid lg:grid-cols-[1fr_450px] gap-8 lg:gap-12"
          >
            {/* LEFT COLUMN: THE FORM */}
            <div className="space-y-6 sm:space-y-8">
              
              {/* SECTION 01: CONTACT */}
              <LuxuryFormSection
                number="01"
                title="Informations du Destinataire"
                subtitle="Ces informations permettent au transporteur de vous contacter avant la livraison."
                icon={<User size={18} />}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <LuxuryInput
                    label="Prénom *"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="Votre prénom"
                    value={form.firstName}
                    onChange={(v) => update('firstName', v)}
                    required
                  />
                  <LuxuryInput
                    label="Nom de famille *"
                    name="lastName"
                    autoComplete="family-name"
                    placeholder="Votre nom"
                    value={form.lastName}
                    onChange={(v) => update('lastName', v)}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Phone with World Country Code Picker + Flag Dropdown */}
                  <div ref={countryPickerRef} className="relative">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A] mb-1.5 flex items-center justify-between">
                      <span>Téléphone WhatsApp *</span>
                      <span className="text-[10px] text-[#0284c7] font-semibold normal-case">Numéro de livraison</span>
                    </label>

                    <div className="relative flex rounded-xl border border-[#e0ddd4] bg-white focus-within:border-[#0ea5e9] focus-within:ring-2 focus-within:ring-[#0ea5e9]/15 transition-all">
                      {/* Country Selector Trigger */}
                      <button
                        type="button"
                        onClick={() => setIsCountryPickerOpen(!isCountryPickerOpen)}
                        className="flex items-center gap-2 px-3 bg-[#fafaf7] hover:bg-[#f0ede4] border-r border-[#e0ddd4] text-[13px] font-bold text-[#1A1A1A] select-none shrink-0 transition cursor-pointer"
                        title="Changer le pays / indicatif"
                        aria-expanded={isCountryPickerOpen}
                      >
                        <span className="relative flex items-center justify-center w-5 h-3.5 rounded-[2px] overflow-hidden shadow-2xs border border-black/10 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                            alt={selectedCountry.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        </span>
                        <span>{selectedCountry.dial}</span>
                        <ChevronDown size={13} className={`text-[#888] transition-transform duration-200 ${isCountryPickerOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Phone Number Input */}
                      <input
                        type="tel"
                        inputMode="tel"
                        name="phone"
                        autoComplete="tel"
                        required
                        placeholder="06 XX XX XX XX"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        className="w-full px-3.5 py-3 text-[14px] bg-transparent focus:outline-none placeholder:text-[#9A9A9A] font-medium text-[#1A1A1A]"
                      />
                    </div>

                    {/* Country Code Popover Dropdown */}
                    {isCountryPickerOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-80 sm:w-96 bg-white border border-[#e0ddd4] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                        {/* Search Bar */}
                        <div className="p-3 border-b border-[#f1f1eb] bg-[#fafaf7]">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Rechercher un pays ou indicatif…"
                              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-white border border-[#e0ddd4] rounded-xl focus:outline-none focus:border-[#0ea5e9]"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Country List */}
                        <div className="max-h-60 overflow-y-auto divide-y divide-[#f5f5f0] text-[13px]">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => (
                              <button
                                key={`${c.code}-${c.dial}`}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setIsCountryPickerOpen(false);
                                  setCountrySearch('');
                                }}
                                className={`w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-sky-50/60 transition ${
                                  selectedCountry.code === c.code ? 'bg-sky-50 font-bold text-[#0284c7]' : 'text-[#1A1A1A]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="relative flex items-center justify-center w-5 h-3.5 rounded-[2px] overflow-hidden shadow-2xs border border-black/10 shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                                      alt={c.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  </span>
                                  <span className="truncate">{c.name}</span>
                                </div>
                                <span className="text-[12px] font-mono text-[#6B6B6B] shrink-0 font-semibold">{c.dial}</span>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-[#888] text-[12px]">Aucun pays trouvé.</div>
                          )}
                        </div>
                      </div>
                    )}

                    <span className="text-[10px] text-[#6B6B6B] mt-1 block">
                      Le livreur vous appellera sur ce numéro pour coordonner l&apos;heure de passage.
                    </span>
                  </div>

                  <LuxuryInput
                    label="Adresse email (Optionnel)"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="exemple@email.com"
                    value={form.email}
                    onChange={(v) => update('email', v)}
                    helper="Pour recevoir votre reçu détaillé et votre numéro de suivi de colis"
                  />
                </div>
              </LuxuryFormSection>

              {/* SECTION 02: SHIPPING ADDRESS */}
              <LuxuryFormSection
                number="02"
                title="Adresse de Livraison au Maroc"
                subtitle="Indiquez l'adresse de votre domicile ou de votre lieu de travail."
                icon={<MapPin size={18} />}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* City Select */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A] mb-1.5 block">
                      Ville de destination *
                    </label>
                    <div className="relative">
                      <select
                        name="city"
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        required
                        className="w-full border border-[#e0ddd4] rounded-xl px-4 py-3 text-[14px] bg-white font-medium text-[#1A1A1A] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/15 transition appearance-none cursor-pointer"
                      >
                        <optgroup label="Grandes Villes">
                          {TOP_MOROCCAN_CITIES.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Toutes les villes du Royaume">
                          {OTHER_CITIES.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none"
                      />
                    </div>
                  </div>

                  <LuxuryInput
                    label="Code postal (Optionnel)"
                    name="postalCode"
                    autoComplete="postal-code"
                    placeholder="Ex : 20000"
                    value={form.postalCode}
                    onChange={(v) => update('postalCode', v)}
                  />
                </div>

                <LuxuryInput
                  label="Adresse complète *"
                  name="address"
                  autoComplete="street-address"
                  placeholder="Quartier, résidence, rue, n° d'immeuble, appartement ou repère…"
                  value={form.address}
                  onChange={(v) => update('address', v)}
                  required
                />

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A] mb-1.5 block">
                    Instructions particulières pour le livreur (Optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    rows={2}
                    placeholder="Ex : Appeler 30 minutes avant, livrer au bureau 2ème étage, laisser au concierge si absent…"
                    className="w-full border border-[#e0ddd4] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/15 transition resize-none bg-white placeholder:text-[#9A9A9A]"
                  />
                </div>

                {/* Delivery Guarantee Pill */}
                <div className="p-4 rounded-xl bg-[#fafaf7] border border-[#e0ddd4] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0ea5e9] border border-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div className="text-[12px] text-[#555] leading-relaxed">
                    <strong className="text-[#1A1A1A] block font-bold text-[13px] mb-0.5">
                      Expédition soignée sous 24h à 48h
                    </strong>
                    Votre colis est soigneusement préparé dans notre atelier et confié à notre transporteur express. Vous recevrez une confirmation et un appel téléphonique préalable pour convenir du moment idéal de remise.
                  </div>
                </div>
              </LuxuryFormSection>

              {/* SECTION 03: PAYMENT (CLEAN & DIRECT COD SELECTION) */}
              <LuxuryFormSection
                number="03"
                title="Mode de Règlement"
                subtitle="Vous ne réglez rien en ligne. Paiement sécurisé à la réception du colis."
                icon={<Banknote size={18} />}
              >
                {/* Active COD Radio Tile */}
                <div className="p-5 rounded-2xl border-2 border-[#1A1A1A] bg-[#fafaf7] shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-[#1A1A1A]">
                          Paiement en espèces à la livraison (Cash on Delivery)
                        </div>
                        <p className="text-[12px] text-[#6B6B6B] mt-0.5 leading-relaxed">
                          Réglez directement en dirhams (MAD) au livreur lors de la remise de votre colis en mains propres.
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-[#1A1A1A] text-white px-2.5 py-1 rounded-full shrink-0">
                      <Check size={11} strokeWidth={3} className="text-[#0ea5e9]" /> Recommandé au Maroc
                    </span>
                  </div>
                </div>
              </LuxuryFormSection>

            </div>

            {/* RIGHT COLUMN: STICKY ORDER SUMMARY (TRACKS PAGE VIEW ON SCROLL) */}
            <aside className="self-stretch">
              <div className="lg:sticky lg:top-28 z-10 bg-white border border-[#e0ddd4] rounded-3xl p-6 lg:p-7 shadow-xs space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#f1f1eb]">
                  <div>
                    <h2 className="heading-font text-lg sm:text-xl font-bold text-[#1A1A1A] tracking-tight">
                      Votre Commande
                    </h2>
                    <span className="text-[11px] text-[#6B6B6B] block mt-0.5">
                      {effectiveCart.length} article{effectiveCart.length > 1 ? 's' : ''} sélectionné{effectiveCart.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {isBuyNow && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider">
                      <ShoppingBag size={11} /> Achat Direct
                    </span>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {effectiveCart.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#fafaf7] border border-[#e0ddd4]"
                    >
                      <div className="relative w-14 h-16 bg-white rounded-xl border border-[#E8E2D6] overflow-hidden shrink-0 flex items-center justify-center">
                        <Image
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name}
                          fill
                          className="object-contain scale-120 mix-blend-multiply"
                        />
                        <span className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-[#1A1A1A] truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                            {item.size || '100ml'}
                          </span>
                          <span className="text-[11px] text-[#6B6B6B]">Qté : {item.quantity}</span>
                        </div>
                      </div>

                      <div className="text-[14px] font-extrabold text-[#1A1A1A] shrink-0 text-right">
                        {formatMAD(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Free Progress Bar (Brand Sky Blue) */}
                <div className="p-3.5 rounded-2xl bg-[#fafaf7] border border-[#e0ddd4] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                      <Truck size={14} className="text-[#0ea5e9]" />
                      <span>Livraison Offerte</span>
                    </span>
                    <span className="font-semibold text-[#0284c7]">
                      {shipping === 0 ? 'Offerte (0 MAD)' : `Dès 800 MAD`}
                    </span>
                  </div>
                  <div className="w-full bg-[#eeece5] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0ea5e9] h-full rounded-full transition-all duration-500"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#6B6B6B]">
                    {shipping === 0
                      ? 'Félicitations ! Vous profitez de la livraison gratuite partout au Maroc.'
                      : `Ajoutez encore ${formatMAD(amountToFreeShipping)} pour bénéficier des frais de port offerts.`}
                  </p>
                </div>

                {/* Promo Code Input */}
                <div className="pt-2">
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#6B6B6B]">
                      Code Promotionnel
                    </span>
                    {!customer && (
                      <span className="text-[10px] text-[#0284c7] font-semibold flex items-center gap-1">
                        <Lock size={10} /> Réservé membres
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Ex : NAYDAY"
                      className="flex-1 border border-[#e0ddd4] rounded-xl px-3 py-2 text-[13px] bg-white uppercase placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#0ea5e9]"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      disabled={isApplyingPromo || !promoInput.trim()}
                      className="bg-[#1A1A1A] hover:bg-black text-white px-4 rounded-xl text-[11px] font-bold uppercase transition disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {isApplyingPromo ? '…' : 'Appliquer'}
                    </button>
                  </div>

                  {!appliedPromo && (
                    <div className="mt-2 p-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 flex items-center justify-between gap-2 shadow-2xs">
                      <span className="text-[10.5px] text-amber-900 font-bold truncate">
                        Offre NAYDAY (-10% dès 2 parfums)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyPromo('NAYDAY')}
                        className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[9.5px] uppercase tracking-wider shrink-0 transition cursor-pointer"
                      >
                        Appliquer
                      </button>
                    </div>
                  )}

                  {promoError && (
                    <div className="text-rose-600 text-[11px] mt-1.5 flex items-center gap-1">
                      <XCircle size={12} /> {promoError}
                    </div>
                  )}
                  {promoSuccess && !appliedPromo && (
                    <div className="text-[#0284c7] text-[11px] mt-1.5 flex items-center gap-1">
                      <CheckCircle2 size={12} /> {promoSuccess}
                    </div>
                  )}
                  {appliedPromo && (
                    <div className="mt-2.5 flex items-center justify-between bg-sky-50 border border-sky-200 px-3 py-2 rounded-xl">
                      <div className="flex items-center gap-1.5 text-[#0284c7] text-[12px] font-bold">
                        <Tag size={13} />
                        <span>Code {appliedPromo.code} appliqué</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-[11px] text-[#0284c7] underline hover:text-[#0369a1]"
                      >
                        Retirer
                      </button>
                    </div>
                  )}
                </div>

                {!appliedPromo && (
                  <div className="pt-1">
                    <FreeGiftSelector />
                  </div>
                )}

                {/* Price Calculations */}
                <div className="pt-3 border-t border-[#f1f1eb] space-y-2 text-[13px]">
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Sous-total articles</span>
                    <span className="text-[#1A1A1A] font-semibold">{formatMAD(subtotal)}</span>
                  </div>

                  {!appliedPromo && dealDiscount > 0 && appliedDeal && (
                    <div className="flex justify-between text-[#1A1A1A] bg-[#fafaf7] px-2.5 py-1.5 rounded-lg border border-[#e0ddd4] text-[12px] font-semibold">
                      <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-[#0ea5e9]" /> {appliedDeal.badgeText || appliedDeal.title}</span>
                      <span className="text-[#0284c7]">-{formatMAD(dealDiscount)}</span>
                    </div>
                  )}

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-[#0284c7] font-semibold">
                      <span>Remise code promo</span>
                      <span>-{formatMAD(promoDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Livraison partout au Maroc</span>
                    <span className={shipping === 0 ? 'text-[#0ea5e9] font-bold' : 'text-[#1A1A1A] font-semibold'}>
                      {shipping === 0 ? 'Gratuite (0 MAD)' : formatMAD(shipping)}
                    </span>
                  </div>
                </div>

                {/* Big Authoritative Total Box */}
                <div className="pt-4 border-t border-[#e0ddd4] flex justify-between items-baseline">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
                      Total à régler au livreur
                    </span>
                    <span className="text-[11px] text-[#0284c7] font-bold flex items-center gap-1 mt-0.5">
                      <Check size={12} strokeWidth={3} /> Espèces à la réception
                    </span>
                  </div>
                  <span className="heading-font text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
                    {formatMAD(total)}
                  </span>
                </div>

                {/* CONFIRMER MA COMMANDE IN BRAND VIBRANT BLUE GRADIENT */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-[14px] sm:text-[15px] font-bold tracking-wide rounded-2xl shadow-xl shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2.5 transition border border-sky-400/30 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Confirmer ma commande · {formatMAD(total)}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-[#6B6B6B] text-center leading-relaxed">
                  🛡️ Aucun paiement en ligne · Vous avez le droit d&apos;inspecter votre commande avant de régler.
                </p>

                {/* Direct WhatsApp Concierge Assistance */}
                <div className="pt-4 border-t border-[#f1f1eb] text-center">
                  <a
                    href="https://wa.me/212663380011?text=Bonjour,%20j%27ai%20une%20question%20concernant%20ma%20commande%20sur%20NAY%20Parfum"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#1A1A1A] hover:text-[#0ea5e9] transition"
                  >
                    <MessageCircle size={15} className="text-[#0ea5e9]" />
                    <span>Besoin d&apos;aide ? Échangez sur WhatsApp : <strong>+212 663-380011</strong></span>
                  </a>
                </div>

              </div>
            </aside>

          </form>
        </div>
      </main>

      {/* 4. MOBILE STICKY BOTTOM CHECKOUT BAR (BRAND COLOR BUTTON) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e0ddd4] p-3 px-4 shadow-[0_-8px_25px_rgba(0,0,0,0.12)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#6B6B6B] block uppercase tracking-wider font-bold">
              Total à la livraison :
            </span>
            <span className="heading-font text-xl font-extrabold text-[#1A1A1A] tracking-tight">
              {formatMAD(total)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleMobileSubmitClick}
            disabled={isSubmitting}
            className="flex-1 max-w-[240px] h-12 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] active:from-[#0284c7] active:to-[#0369a1] text-white text-[13px] font-bold rounded-xl shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 transition"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Commander ({formatMAD(total)})</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. DEDICATED LUXURY CHECKOUT FOOTER */}
      <LuxuryTunnelFooter />

      {/* 6. CELEBRATION SUCCESS ANIMATION MODAL */}
      {orderSuccessData && (
        <OrderCelebrationModal
          data={orderSuccessData}
          locale={locale}
          onRedirect={() => {
            router.push(`/${locale}/order-confirmation?order=${orderSuccessData.orderNumber}`);
          }}
        />
      )}

      {/* Promo Authentication Modal */}
      <PromoAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        promoCode={pendingPromoCode || promoInput}
        onSuccess={() => {
          const target = pendingPromoCode || promoInput;
          if (target) {
            setTimeout(() => {
              handleApplyPromo(target);
            }, 100);
          }
        }}
      />
    </div>
  );
}

/* ============================================================
   CELEBRATION SUCCESS MODAL WITH LUXURY ANIMATION
   ============================================================ */

function OrderCelebrationModal({
  data,
  locale,
  onRedirect,
}: {
  data: {
    orderNumber: string;
    invoiceToken: string | null;
    customerName: string;
    total: number;
    city: string;
  };
  locale: string;
  onRedirect: () => void;
}) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRedirect]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-sky-100 overflow-hidden">
        
        {/* Subtle Decorative Golden/Cyan Glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#0ea5e9]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Celebration Icon with Pulse */}
        <div className="relative mx-auto mb-5 w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0ea5e9]/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-sky-400 text-white flex items-center justify-center shadow-xl shadow-sky-500/30">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>

        {/* Order Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284c7] text-[11px] font-bold uppercase tracking-wider mb-2">
          <Sparkles size={12} className="text-[#0ea5e9]" /> Commande Confirmée avec Succès
        </div>

        <h3 className="heading-font text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
          Merci pour votre commande !
        </h3>

        <p className="text-[13px] text-[#6B6B6B] mt-1.5 leading-relaxed">
          {data.customerName ? `Félicitations ${data.customerName}, votre ` : 'Votre '}parfum d&apos;exception est en cours de préparation dans notre Atelier de Casablanca.
        </p>

        {/* Order Number Box */}
        <div className="my-5 p-4 rounded-2xl bg-[#fafaf7] border border-[#e0ddd4] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#888] block">N° de Commande</span>
            <span className="font-mono font-bold text-[#1A1A1A] text-[15px]">{data.orderNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#888] block">À régler au livreur</span>
            <span className="heading-font font-extrabold text-[#0284c7] text-[16px]">{formatMAD(data.total)}</span>
          </div>
        </div>

        {/* 3 Status Points */}
        <div className="space-y-2 text-left text-[12px] text-[#555] mb-6">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[#0ea5e9] shrink-0" strokeWidth={3} />
            <span>Colis emballé avec soin & contrôle d&apos;authenticité</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[#0ea5e9] shrink-0" strokeWidth={3} />
            <span>Expédition express sous 24h à 48h vers <strong>{data.city}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[#0ea5e9] shrink-0" strokeWidth={3} />
            <span>Ouvrez et testez votre flacon avant de régler en espèces</span>
          </div>
        </div>

        {/* Countdown & Immediate Button */}
        <button
          type="button"
          onClick={onRedirect}
          className="w-full h-13 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white font-bold text-[14px] rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Consulter mon reçu officiel</span>
          <ArrowRight size={16} />
        </button>

        <p className="text-[11px] text-[#9A9A9A] mt-2.5">
          Redirection automatique dans {countdown}s…
        </p>

      </div>
    </div>
  );
}

/* ============================================================
   ELEGANT LUXURY TUNNEL SUB-COMPONENTS WITH PROMINENT LOGO
   ============================================================ */

function LuxuryTunnelHeader({
  backHref,
  isBuyNow,
  locale,
}: {
  backHref: string;
  isBuyNow: boolean;
  locale: string;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e0ddd4] shadow-2xs">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
        {/* Left: Back Link */}
        <Link
          href={backHref}
          className="flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13px] font-bold text-[#6B6B6B] hover:text-[#1A1A1A] transition"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">
            {isBuyNow ? 'Retour à la fiche produit' : 'Retour au panier'}
          </span>
          <span className="sm:hidden">Retour</span>
        </Link>

        {/* Center: Real NAY Brand Logo (Enlarged and bold) */}
        <Link
          href={`/${locale}`}
          aria-label="NAY Parfums - Accueil"
          className="flex items-center justify-center group active:scale-95 transition-transform py-2"
        >
          <div
            className="w-28 h-16 sm:w-36 sm:h-20 lg:w-44 lg:h-24 transition-colors duration-300 group-hover:bg-[#0ea5e9] bg-[#1A1A1A]"
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

        {/* Right: Security Trust Pill (Brand Styled) */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-[#fafaf7] border border-[#e0ddd4] text-[#1A1A1A] text-[11px] font-bold shadow-2xs">
          <ShieldCheck size={14} className="text-[#0ea5e9] shrink-0" />
          <span className="hidden sm:inline">Paiement 100% Sécurisé</span>
          <span className="sm:hidden">Sécurisé</span>
        </div>
      </div>
    </header>
  );
}

function LuxuryTunnelFooter() {
  return (
    <footer className="mt-12 sm:mt-16 border-t border-[#e0ddd4] bg-white py-10 text-[#6B6B6B] text-[12px]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-[#f1f1eb] text-center md:text-left">
          <div className="space-y-1">
            <h5 className="font-bold text-[#1A1A1A] text-[13px] flex items-center justify-center md:justify-start gap-1.5">
              <ShieldCheck size={15} className="text-[#0ea5e9]" /> Authenticité 100%
            </h5>
            <p className="text-[11px] text-[#6B6B6B]">Même jus, même sillage et formulation certifiée.</p>
          </div>

          <div className="space-y-1">
            <h5 className="font-bold text-[#1A1A1A] text-[13px] flex items-center justify-center md:justify-start gap-1.5">
              <PackageCheck size={15} className="text-[#0ea5e9]" /> Test devant livreur
            </h5>
            <p className="text-[11px] text-[#6B6B6B]">Inspectez votre flacon en main propre avant de régler.</p>
          </div>

          <div className="space-y-1">
            <h5 className="font-bold text-[#1A1A1A] text-[13px] flex items-center justify-center md:justify-start gap-1.5">
              <Truck size={15} className="text-[#0ea5e9]" /> Livraison 24h/48h
            </h5>
            <p className="text-[11px] text-[#6B6B6B]">Expédition partout au Maroc avec coordination préalable.</p>
          </div>

          <div className="space-y-1">
            <h5 className="font-bold text-[#1A1A1A] text-[13px] flex items-center justify-center md:justify-start gap-1.5">
              <Phone size={15} className="text-[#0ea5e9]" /> Atelier Client NAY
            </h5>
            <p className="text-[11px] text-[#6B6B6B]">Conseil personnalisé & suivi WhatsApp 7j/7.</p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#9A9A9A]">
          <span>© 2026 NAY Parfum Maroc · Tous droits réservés.</span>
          <div className="flex items-center gap-4">
            <Link href="/legal/terms" target="_blank" className="hover:text-[#1A1A1A] transition">
              Conditions Générales de Vente
            </Link>
            <span>•</span>
            <Link href="/legal/privacy" target="_blank" className="hover:text-[#1A1A1A] transition">
              Politique de Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LuxuryFormSection({
  number,
  title,
  subtitle,
  icon,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-[#e0ddd4] rounded-3xl p-5 sm:p-7 lg:p-8 shadow-xs">
      <div className="flex items-start gap-3.5 sm:gap-4 mb-6 pb-4 border-b border-[#f1f1eb]">
        <span className="heading-font text-2xl sm:text-3xl font-extrabold text-[#0ea5e9]/70 leading-none shrink-0 mt-0.5">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="heading-font text-[16px] sm:text-[18px] font-extrabold tracking-tight text-[#1A1A1A] flex items-center gap-2">
            {icon && <span className="text-[#0ea5e9] shrink-0">{icon}</span>}
            <span>{title}</span>
          </h3>
          <p className="text-[12px] text-[#6B6B6B] mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function LuxuryInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  required,
  helper,
}: {
  label: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  helper?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A] mb-1.5 block">
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full border border-[#e0ddd4] rounded-xl px-4 py-3 text-[14px] bg-white font-medium text-[#1A1A1A] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/15 transition-all placeholder:text-[#9A9A9A]"
      />
      {helper && <span className="text-[10px] text-[#6B6B6B] mt-1 block">{helper}</span>}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#fafaf7] min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}
