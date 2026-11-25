'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, calculatePromoDiscount } from '@/context/CartContext';
import { formatMAD, MOROCCAN_CITIES } from '@/lib/products';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, CountryCode } from '@/lib/countryCodes';
import { validateAndNormalizePhone, formatCheckoutPhone } from '@/lib/phone';
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
  AlertCircle,
  Mail,
} from 'lucide-react';
import FreeGiftSelector from '@/components/FreeGiftSelector';
import { useAuth } from '@/context/AuthContext';
import PromoAuthModal from '@/components/PromoAuthModal';

/* Quick-tap Moroccan cities for 1-touch mobile checkout */
const QUICK_PICK_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Tanger',
  'Fès',
  'Agadir',
];

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

  // Inline Form Validation / Submission Errors
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

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

  // Live step progress indicators
  const step1Done = Boolean(
    form.firstName.trim() && form.lastName.trim() && form.phone.trim().length >= 8
  );
  const step2Done = Boolean(form.city.trim() && form.address.trim().length >= 4);

  // Pre-fill form from authenticated customer if available
  useEffect(() => {
    if (customer) {
      const cleanCustEmail =
        customer.email && !customer.email.endsWith('@noemail.nayparfum.local')
          ? customer.email
          : '';
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || customer.name.split(' ')[0] || '',
        lastName: prev.lastName || customer.name.split(' ').slice(1).join(' ') || '',
        email: prev.email || cleanCustEmail,
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
          customerPhone: formatCheckoutPhone(form.phone, selectedCountry.dial),
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
    if (submitError) setSubmitError(null);
    if (field === 'phone' && phoneError) setPhoneError(null);
    if (field === 'email' && emailError) setEmailError(null);
  };

  const scrollToError = () => {
    setTimeout(() => {
      errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
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

    setSubmitError(null);
    setPhoneError(null);
    setEmailError(null);

    const fullPhoneNumber = formatCheckoutPhone(form.phone, selectedCountry.dial);
    const phoneCheck = validateAndNormalizePhone(fullPhoneNumber);
    if (!phoneCheck.isValid) {
      const msg =
        phoneCheck.error ||
        'Veuillez renseigner un numéro de téléphone WhatsApp valide (ex: 06 XX XX XX XX ou 07 XX XX XX XX).';
      setPhoneError(msg);
      setSubmitError(msg);
      scrollToError();
      return;
    }

    // Email is completely optional — validate format ONLY if the client typed something
    const trimmedEmail = form.email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      const msg = "L'adresse email semble invalide. Corrigez-la ou laissez le champ vide.";
      setEmailError(msg);
      setSubmitError(msg);
      scrollToError();
      return;
    }

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
          customerEmail: trimmedEmail,
          customerPhone: fullPhoneNumber,
          shippingAddress: form.address.trim(),
          shippingCity: form.city,
          shippingPostalCode: form.postalCode.trim(),
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
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Order failed');
      }

      const { orderNumber, invoiceToken } = await res.json();

      Cookies.remove('nouamaneSession');

      const confirmationData = {
        orderNumber,
        invoiceToken: invoiceToken || null,
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerEmail: trimmedEmail,
        customerPhone: fullPhoneNumber,
        shippingAddress: form.address.trim(),
        shippingCity: form.city,
        shippingPostalCode: form.postalCode.trim(),
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
    } catch (err: any) {
      console.error(err);
      setSubmitError(
        err?.message && err.message !== 'Order failed'
          ? err.message
          : 'Une erreur est survenue lors de la validation. Veuillez vérifier vos informations et réessayer.'
      );
      scrollToError();
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
      <div className="bg-[#fafaf7] w-full max-w-full overflow-x-clip min-h-screen flex flex-col justify-between">
        <LuxuryTunnelHeader backHref={backHref} isBuyNow={isBuyNow} locale={locale} />
        <div className="max-w-md mx-auto py-24 text-center px-6">
          <div className="w-12 h-12 border-[3px] border-[#0ea5e9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="heading-font text-xl font-bold text-[#1A1A1A]">Sécurisation de votre commande…</h2>
          <p className="text-[#6B6B6B] text-[13px] mt-1.5 font-medium">
            Préparation de votre flacon d&apos;exception en direct de l&apos;Atelier.
          </p>
        </div>
        <LuxuryTunnelFooter />
      </div>
    );
  }

  /* ---- BUY NOW ERROR GUARD ---- */
  if (isBuyNow && (buyNowError || !buyNowData)) {
    return (
      <div className="bg-[#fafaf7] w-full max-w-full overflow-x-clip min-h-screen flex flex-col justify-between">
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
      <div className="bg-[#fafaf7] w-full max-w-full overflow-x-clip min-h-screen flex flex-col justify-between">
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

  const firstItem = effectiveCart[0];
  const totalUnits = effectiveCart.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

  return (
    <div className="bg-[#f8f7f3] text-[#111827] w-full max-w-full overflow-x-clip min-h-screen flex flex-col justify-between selection:bg-[#0ea5e9] selection:text-white pb-28 lg:pb-0">
      {/* 1. DEDICATED LUXURY CHECKOUT HEADER */}
      <LuxuryTunnelHeader backHref={backHref} isBuyNow={isBuyNow} locale={locale} />

      {/* 2. SLEEK REASSURANCE TICKER */}
      <div className="w-full max-w-full bg-[#0f172a] text-white py-1.5 overflow-hidden border-b border-white/10 select-none">
        <div
          className="flex w-max animate-marquee hover:[animation-play-state:paused]"
          style={{ animationDuration: '30s' }}
        >
          {[0, 1].map((copyIndex) => (
            <div
              key={copyIndex}
              className="flex items-center gap-6 sm:gap-10 shrink-0 pr-6 sm:pr-10 text-[10px] sm:text-[11px] font-medium tracking-wider uppercase"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
                <span className="font-bold text-white">0 DH À PAYER EN LIGNE</span>
              </span>
              <span className="text-white/25">•</span>
              <span className="flex items-center gap-1.5 text-slate-100">
                <PackageCheck size={13} className="text-[#38bdf8]" />
                <span>Ouvrez & vérifiez votre flacon devant le livreur</span>
              </span>
              <span className="text-white/25">•</span>
              <span className="flex items-center gap-1.5 text-slate-100">
                <Truck size={13} className="text-[#38bdf8]" />
                <span>Livraison express 24h / 48h partout au Maroc</span>
              </span>
              <span className="text-white/25">•</span>
              <span className="flex items-center gap-1.5 text-slate-100">
                <ShieldCheck size={13} className="text-[#38bdf8]" />
                <span>Parfums & Testeurs 100% Authentiques</span>
              </span>
              <span className="text-white/25">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MAIN CHECKOUT WORKSPACE */}
      <main className="flex-1 w-full max-w-full overflow-x-clip py-5 sm:py-9 lg:py-12">
        <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-6 lg:px-8">
          {/* EXECUTIVE HERO HEADER & LIVE INTERACTIVE STEPPER */}
          <div className="mb-5 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-[#0284c7] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse shrink-0" />
                  <span>Commande Express · Paiement à la livraison</span>
                </div>
                <h1 className="heading-font text-[22px] sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-[#0f172a] leading-tight">
                  Finaliser votre commande
                </h1>
                <p className="text-[12.5px] sm:text-[14px] text-[#64748b] mt-1 leading-relaxed max-w-xl">
                  Complétez vos coordonnées en 30 secondes. Aucun paiement par carte requis.
                </p>
              </div>

              {/* Compact Trust Chip (Desktop) */}
              <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-[#e6e2d8] shadow-2xs shrink-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600">
                  <ShieldCheck size={17} />
                </div>
                <div className="text-left">
                  <div className="text-[12px] font-bold text-[#0f172a] leading-tight">Paiement en mains propres</div>
                  <div className="text-[11px] text-[#64748b]">Vérification avant règlement</div>
                </div>
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="mt-4 sm:mt-6 bg-white border border-[#e6e2d8] rounded-2xl px-3 py-3 sm:px-5 sm:py-3.5 shadow-[0_1px_8px_rgba(15,23,42,0.03)]">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 items-center">
                <StepIndicator
                  number={1}
                  label="Coordonnées"
                  mobileLabel="Contact"
                  completed={step1Done}
                  active={!step1Done}
                />
                <StepIndicator
                  number={2}
                  label="Livraison"
                  mobileLabel="Livraison"
                  completed={step2Done}
                  active={step1Done && !step2Done}
                />
                <StepIndicator
                  number={3}
                  label="Paiement COD"
                  mobileLabel="Paiement"
                  completed={false}
                  active={step1Done && step2Done}
                />
              </div>
            </div>
          </div>

          {/* MOBILE ONLY: PREMIUM EXPANDABLE ORDER SUMMARY CARD */}
          <div className="lg:hidden mb-5 w-full min-w-0 bg-white border border-[#e6e2d8] rounded-2xl shadow-[0_2px_14px_rgba(15,23,42,0.04)] overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileSummaryOpen((prev) => !prev)}
              className="w-full p-3.5 flex items-center justify-between gap-3 text-left active:bg-[#fafaf7] transition cursor-pointer"
              aria-expanded={mobileSummaryOpen}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative w-11 h-12 rounded-xl bg-[#fafaf7] border border-[#e6e2d8] overflow-hidden shrink-0 flex items-center justify-center">
                  {firstItem?.image ? (
                    <Image
                      src={firstItem.image}
                      alt={firstItem.name}
                      fill
                      sizes="44px"
                      className="object-contain p-1 mix-blend-multiply"
                    />
                  ) : (
                    <ShoppingBag size={18} className="text-[#0ea5e9]" />
                  )}
                  <span className="absolute -top-0.5 -right-0.5 bg-[#0f172a] text-white min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold">
                    {totalUnits}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-[#0f172a] truncate">
                    Commande · {effectiveCart.length} article{effectiveCart.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-[11px] text-[#0284c7] font-semibold flex items-center gap-1 mt-0.5">
                    <span>{mobileSummaryOpen ? 'Masquer le détail' : 'Voir le détail'}</span>
                    {mobileSummaryOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[16px] font-extrabold text-[#0f172a] tracking-tight tabular-nums block leading-tight">
                  {formatMAD(total)}
                </span>
                <span
                  className={`inline-block text-[10px] font-bold mt-0.5 ${
                    shipping === 0 ? 'text-emerald-600' : 'text-[#64748b]'
                  }`}
                >
                  {shipping === 0 ? 'Livraison offerte' : `+${formatMAD(shipping)} livraison`}
                </span>
              </div>
            </button>

            {mobileSummaryOpen && (
              <div className="px-3.5 pb-4 pt-3 border-t border-[#f0ede6] bg-[#fafaf7]/70 space-y-3.5">
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {effectiveCart.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white border border-[#ece8df] min-w-0"
                    >
                      <div className="relative w-11 h-13 bg-[#fafaf7] rounded-lg border border-[#ece8df] overflow-hidden shrink-0 flex items-center justify-center">
                        <Image
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name}
                          fill
                          sizes="44px"
                          className="object-contain p-0.5 mix-blend-multiply"
                        />
                        <span className="absolute -top-0.5 -right-0.5 bg-[#0f172a] text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-[#0f172a] truncate">{item.name}</div>
                        <div className="text-[10px] text-[#64748b] uppercase font-semibold">
                          {item.size || '100ml'} · Qté {item.quantity}
                        </div>
                      </div>
                      <div className="text-[13px] font-extrabold text-[#0f172a] shrink-0 tabular-nums">
                        {formatMAD(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Free shipping progress on mobile */}
                <div className="p-3 rounded-xl bg-white border border-[#ece8df] space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-[#0f172a] flex items-center gap-1.5">
                      <Truck size={13} className="text-[#0ea5e9] shrink-0" />
                      <span>Livraison Offerte</span>
                    </span>
                    <span className="font-bold text-[#0284c7] shrink-0">
                      {shipping === 0 ? 'Débloquée !' : 'Dès 800 MAD'}
                    </span>
                  </div>
                  <div className="w-full bg-[#eeece5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] h-full rounded-full transition-all duration-500"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                  <p className="text-[10.5px] text-[#64748b]">
                    {shipping === 0
                      ? 'Livraison gratuite partout au Maroc incluse.'
                      : `Plus que ${formatMAD(amountToFreeShipping)} pour la livraison offerte.`}
                  </p>
                </div>

                {/* Totals breakdown */}
                <div className="pt-2 border-t border-[#e6e2d8] space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between text-[#64748b]">
                    <span>Sous-total</span>
                    <span className="font-semibold text-[#0f172a] tabular-nums">{formatMAD(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#64748b]">
                    <span>Livraison Maroc</span>
                    <span
                      className={
                        shipping === 0
                          ? 'text-emerald-600 font-bold'
                          : 'text-[#0f172a] font-semibold tabular-nums'
                      }
                    >
                      {shipping === 0 ? 'Gratuite (0 MAD)' : formatMAD(shipping)}
                    </span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-[#0284c7] font-semibold">
                      <span>Remise</span>
                      <span className="tabular-nums">-{formatMAD(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[14px] font-extrabold text-[#0f172a] pt-2 border-t border-[#e6e2d8]">
                    <span>Total à régler au livreur</span>
                    <span className="tabular-nums">{formatMAD(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INLINE ERROR BANNER (REPLACES HARSH BROWSER ALERT) */}
          {submitError && (
            <div
              ref={errorBannerRef}
              role="alert"
              className="mb-5 w-full min-w-0 p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-2xs"
            >
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[12.5px] sm:text-[13px] font-medium leading-relaxed min-w-0 flex-1">
                {submitError}
              </div>
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold shrink-0 cursor-pointer"
                aria-label="Fermer l'alerte"
              >
                ✕
              </button>
            </div>
          )}

          {/* MAIN CHECKOUT GRID — minmax(0,1fr) GUARANTEES ZERO MOBILE OVERFLOW */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_430px] gap-5 sm:gap-7 lg:gap-10 w-full min-w-0"
          >
            {/* LEFT COLUMN: STRUCTURED FORM SECTIONS */}
            <div className="min-w-0 w-full space-y-5 sm:space-y-6">
              {/* SECTION 01: CONTACT */}
              <LuxuryFormSection
                number="01"
                title="Informations du Destinataire"
                subtitle="Le livreur vous contactera par téléphone ou WhatsApp avant son passage."
                icon={<User size={17} />}
                completed={step1Done}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 min-w-0">
                  <LuxuryInput
                    label="Prénom"
                    requiredMark
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="Votre prénom"
                    value={form.firstName}
                    onChange={(v) => update('firstName', v)}
                    required
                  />
                  <LuxuryInput
                    label="Nom de famille"
                    requiredMark
                    name="lastName"
                    autoComplete="family-name"
                    placeholder="Votre nom"
                    value={form.lastName}
                    onChange={(v) => update('lastName', v)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 min-w-0">
                  {/* Phone with World Country Code Picker + Flag Dropdown */}
                  <div ref={countryPickerRef} className="relative min-w-0 w-full">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1.5 flex items-center justify-between gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span>Téléphone WhatsApp</span>
                        <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-[#0284c7] font-semibold normal-case bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                        Contact livraison
                      </span>
                    </label>

                    <div
                      className={`flex w-full min-w-0 rounded-xl border bg-white overflow-hidden transition-all ${
                        phoneError
                          ? 'border-rose-400 ring-2 ring-rose-500/15'
                          : 'border-[#dcd8ce] focus-within:border-[#0ea5e9] focus-within:ring-3 focus-within:ring-[#0ea5e9]/15'
                      }`}
                    >
                      {/* Country Selector Trigger */}
                      <button
                        type="button"
                        onClick={() => setIsCountryPickerOpen(!isCountryPickerOpen)}
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 bg-[#f8f7f3] hover:bg-[#f0ede4] border-r border-[#e4e0d6] text-[13px] font-bold text-[#0f172a] select-none shrink-0 transition cursor-pointer"
                        title="Changer le pays / indicatif"
                        aria-expanded={isCountryPickerOpen}
                      >
                        <span className="relative flex items-center justify-center w-5 h-3.5 rounded-[2px] overflow-hidden shadow-2xs border border-black/10 shrink-0">
                          <img
                            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                            alt={selectedCountry.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        </span>
                        <span className="tabular-nums">{selectedCountry.dial}</span>
                        <ChevronDown
                          size={13}
                          className={`text-[#64748b] transition-transform duration-200 ${
                            isCountryPickerOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Phone Number Input — w-0 flex-1 min-w-0 prevents horizontal blowout on mobile */}
                      <input
                        type="tel"
                        inputMode="tel"
                        name="phone"
                        autoComplete="tel"
                        required
                        placeholder="06 XX XX XX XX"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        className="flex-1 min-w-0 w-0 px-3 py-3 text-[16px] sm:text-[14px] bg-transparent focus:outline-none placeholder:text-[#94a3b8] font-medium text-[#0f172a]"
                      />
                    </div>

                    {/* Country Code Popover Dropdown (Bounded inside mobile viewport) */}
                    {isCountryPickerOpen && (
                      <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-96 mt-1.5 max-w-full bg-white border border-[#e0ddd4] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                        <div className="p-2.5 border-b border-[#f1f1eb] bg-[#fafaf7]">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Rechercher un pays ou indicatif…"
                              className="w-full min-w-0 pl-8 pr-3 py-2 text-[14px] sm:text-[12px] bg-white border border-[#e0ddd4] rounded-xl focus:outline-none focus:border-[#0ea5e9]"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto divide-y divide-[#f5f5f0] text-[13px]">
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
                                className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-sky-50/60 transition cursor-pointer ${
                                  selectedCountry.code === c.code
                                    ? 'bg-sky-50 font-bold text-[#0284c7]'
                                    : 'text-[#0f172a]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="relative flex items-center justify-center w-5 h-3.5 rounded-[2px] overflow-hidden shadow-2xs border border-black/10 shrink-0">
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
                                <span className="text-[12px] font-mono text-[#64748b] shrink-0 font-semibold">
                                  {c.dial}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-[#94a3b8] text-[12px]">
                              Aucun pays trouvé.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {phoneError ? (
                      <span className="text-[11px] text-rose-600 font-medium mt-1.5 block leading-snug">
                        {phoneError}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#64748b] mt-1.5 block leading-snug">
                        Indispensable pour coordonner l&apos;heure de remise.
                      </span>
                    )}
                  </div>

                  {/* Email Field — Clearly Optional & Zero-Friction */}
                  <LuxuryInput
                    label="Adresse email"
                    optionalBadge
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="exemple@email.com"
                    value={form.email}
                    onChange={(v) => update('email', v)}
                    error={emailError}
                    helper="Facultatif — vous pouvez commander sans email."
                    leftIcon={<Mail size={15} className="text-[#94a3b8]" />}
                  />
                </div>
              </LuxuryFormSection>

              {/* SECTION 02: SHIPPING ADDRESS */}
              <LuxuryFormSection
                number="02"
                title="Adresse de Livraison au Maroc"
                subtitle="Indiquez votre domicile ou lieu de travail pour une livraison rapide."
                icon={<MapPin size={17} />}
                completed={step2Done}
              >
                {/* Quick City Picker Pills */}
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-2 flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span>Ville de destination</span>
                      <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] font-medium normal-case text-[#64748b]">
                      Sélection rapide
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {QUICK_PICK_CITIES.map((city) => {
                      const active = form.city === city;
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => update('city', city)}
                          className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer border ${
                            active
                              ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                              : 'bg-[#f8f7f3] text-[#334155] border-[#e2ded5] hover:border-[#0ea5e9] hover:text-[#0284c7]'
                          }`}
                        >
                          {city}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 min-w-0">
                  {/* City Select */}
                  <div className="min-w-0 w-full">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1.5 block">
                      Toutes les villes du Maroc
                    </label>
                    <div className="relative w-full min-w-0">
                      <select
                        name="city"
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        required
                        className="w-full min-w-0 max-w-full border border-[#dcd8ce] rounded-xl px-3.5 py-3 text-[16px] sm:text-[14px] bg-white font-medium text-[#0f172a] focus:outline-none focus:border-[#0ea5e9] focus:ring-3 focus:ring-[#0ea5e9]/15 transition cursor-pointer"
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
                    </div>
                  </div>

                  <LuxuryInput
                    label="Code postal"
                    optionalBadge
                    name="postalCode"
                    autoComplete="postal-code"
                    placeholder="Ex : 20000"
                    value={form.postalCode}
                    onChange={(v) => update('postalCode', v)}
                  />
                </div>

                <LuxuryInput
                  label="Adresse complète"
                  requiredMark
                  name="address"
                  autoComplete="street-address"
                  placeholder="Quartier, résidence, rue, n° d'immeuble ou repère…"
                  value={form.address}
                  onChange={(v) => update('address', v)}
                  required
                />

                <div className="min-w-0 w-full">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1.5 flex items-center gap-2 flex-wrap">
                    <span>Instructions pour le livreur</span>
                    <span className="text-[10px] font-semibold normal-case tracking-normal px-2 py-0.5 rounded-full bg-slate-100 text-[#64748b] border border-slate-200/80">
                      Optionnel
                    </span>
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    rows={2}
                    placeholder="Ex : Appeler 30 min avant, livrer au bureau, laisser au concierge…"
                    className="w-full min-w-0 max-w-full border border-[#dcd8ce] rounded-xl px-3.5 py-2.5 text-[16px] sm:text-[13.5px] focus:outline-none focus:border-[#0ea5e9] focus:ring-3 focus:ring-[#0ea5e9]/15 transition resize-none bg-white placeholder:text-[#94a3b8] text-[#0f172a]"
                  />
                </div>

                {/* Delivery Guarantee Pill */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#f8f7f3] border border-[#e6e2d8] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-200/70 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div className="text-[12px] text-[#475569] leading-relaxed min-w-0">
                    <strong className="text-[#0f172a] block font-bold text-[13px] mb-0.5">
                      Expédition express 24h à 48h vers {form.city}
                    </strong>
                    Préparation soignée dans notre atelier & appel préalable du livreur pour convenir du créneau qui vous arrange.
                  </div>
                </div>
              </LuxuryFormSection>

              {/* SECTION 03: PAYMENT (EXECUTIVE COD EXPERIENCE) */}
              <LuxuryFormSection
                number="03"
                title="Mode de Règlement"
                subtitle="Zéro risque : vous ne réglez rien en ligne."
                icon={<Banknote size={17} />}
              >
                {/* Active COD Radio Tile */}
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-[#0f172a] bg-gradient-to-br from-white via-[#fafaf7] to-sky-50/40 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-5 h-5 mt-0.5 rounded-full border-2 border-[#0f172a] flex items-center justify-center shrink-0 bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] sm:text-[15px] font-bold text-[#0f172a]">
                            Paiement en espèces à la livraison
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase bg-[#0f172a] text-white px-2 py-0.5 rounded-full">
                            <Check size={10} strokeWidth={3} className="text-[#38bdf8]" /> Recommandé
                          </span>
                        </div>
                        <p className="text-[12px] sm:text-[12.5px] text-[#64748b] mt-1 leading-relaxed">
                          Réglez <strong className="text-[#0f172a] tabular-nums">{formatMAD(total)}</strong> directement en dirhams (MAD) au livreur lors de la remise de votre colis.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3-Pillar COD Confidence Strip */}
                  <div className="mt-4 pt-3.5 border-t border-[#e6e2d8] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11.5px]">
                    <div className="flex items-center gap-2 text-[#334155] font-medium">
                      <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center shrink-0">
                        <Banknote size={13} />
                      </span>
                      <span>0 DH d&apos;avance en ligne</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#334155] font-medium">
                      <span className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-200/70 text-[#0284c7] flex items-center justify-center shrink-0">
                        <PackageCheck size={13} />
                      </span>
                      <span>Vérification devant livreur</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#334155] font-medium">
                      <span className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center shrink-0">
                        <ShieldCheck size={13} />
                      </span>
                      <span>Authenticité garantie</span>
                    </div>
                  </div>
                </div>
              </LuxuryFormSection>
            </div>

            {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
            <aside className="min-w-0 w-full self-stretch">
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto z-10 w-full min-w-0 bg-white border border-[#e6e2d8] rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-[0_6px_30px_rgba(15,23,42,0.05)] space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#f0ede6]">
                  <div className="min-w-0">
                    <h2 className="heading-font text-[17px] sm:text-xl font-extrabold text-[#0f172a] tracking-tight">
                      Votre Commande
                    </h2>
                    <span className="text-[11.5px] text-[#64748b] block mt-0.5">
                      {effectiveCart.length} référence{effectiveCart.length > 1 ? 's' : ''} · {totalUnits} unité{totalUnits > 1 ? 's' : ''}
                    </span>
                  </div>
                  {isBuyNow && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0f172a] text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
                      <ShoppingBag size={11} /> Express
                    </span>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-0.5">
                  {effectiveCart.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#f8f7f3] border border-[#e8e4db] min-w-0"
                    >
                      <div className="relative w-13 h-15 bg-white rounded-xl border border-[#e8e4db] overflow-hidden shrink-0 flex items-center justify-center">
                        <Image
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name}
                          fill
                          sizes="52px"
                          className="object-contain p-1 mix-blend-multiply"
                        />
                        <span className="absolute -top-0.5 -right-0.5 bg-[#0f172a] text-white min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-[#0f172a] truncate">{item.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                            {item.size || '100ml'}
                          </span>
                          <span className="text-[11px] text-[#64748b]">Qté : {item.quantity}</span>
                        </div>
                      </div>

                      <div className="text-[13.5px] font-extrabold text-[#0f172a] shrink-0 text-right tabular-nums">
                        {formatMAD(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Free Progress Bar */}
                <div className="p-3.5 rounded-2xl bg-[#f8f7f3] border border-[#e8e4db] space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11.5px]">
                    <span className="font-bold text-[#0f172a] flex items-center gap-1.5 min-w-0">
                      <Truck size={14} className="text-[#0ea5e9] shrink-0" />
                      <span className="truncate">Livraison Offerte</span>
                    </span>
                    <span
                      className={`font-bold shrink-0 ${
                        shipping === 0 ? 'text-emerald-600' : 'text-[#0284c7]'
                      }`}
                    >
                      {shipping === 0 ? 'Offerte (0 MAD)' : 'Dès 800 MAD'}
                    </span>
                  </div>
                  <div className="w-full bg-[#e6e2d8] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        shipping === 0
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-[#0ea5e9] to-[#0284c7]'
                      }`}
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#64748b] leading-snug">
                    {shipping === 0
                      ? 'Félicitations ! Vous profitez de la livraison gratuite partout au Maroc.'
                      : `Ajoutez encore ${formatMAD(amountToFreeShipping)} pour bénéficier de la livraison offerte.`}
                  </p>
                </div>

                {/* Promo Code Input */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10.5px] font-bold tracking-wider uppercase text-[#64748b]">
                      Code Promotionnel
                    </span>
                    {!customer && (
                      <span className="text-[10px] text-[#0284c7] font-semibold flex items-center gap-1">
                        <Lock size={10} /> Réservé membres
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 min-w-0 w-full">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Ex : NAY10"
                      className="flex-1 min-w-0 w-0 border border-[#dcd8ce] rounded-xl px-3 py-2.5 text-[16px] sm:text-[13px] bg-white uppercase placeholder:text-[#94a3b8] text-[#0f172a] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/15"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      disabled={isApplyingPromo || !promoInput.trim()}
                      className="bg-[#0f172a] hover:bg-black text-white px-3.5 sm:px-4 rounded-xl text-[11px] font-bold uppercase tracking-wide transition disabled:opacity-45 shrink-0 cursor-pointer"
                    >
                      {isApplyingPromo ? '…' : 'Appliquer'}
                    </button>
                  </div>

                  {promoError && (
                    <div className="text-rose-600 text-[11.5px] mt-1.5 flex items-center gap-1">
                      <XCircle size={12} className="shrink-0" /> <span>{promoError}</span>
                    </div>
                  )}
                  {promoSuccess && !appliedPromo && (
                    <div className="text-[#0284c7] text-[11.5px] mt-1.5 flex items-center gap-1">
                      <CheckCircle2 size={12} className="shrink-0" /> <span>{promoSuccess}</span>
                    </div>
                  )}
                  {appliedPromo && (
                    <div className="mt-2.5 flex items-center justify-between gap-2 bg-sky-50 border border-sky-200 px-3 py-2 rounded-xl">
                      <div className="flex items-center gap-1.5 text-[#0284c7] text-[12px] font-bold min-w-0">
                        <Tag size={13} className="shrink-0" />
                        <span className="truncate">Code {appliedPromo.code} appliqué</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-[11px] text-[#0284c7] underline hover:text-[#0369a1] shrink-0 cursor-pointer"
                      >
                        Retirer
                      </button>
                    </div>
                  )}
                </div>

                {!appliedPromo && (
                  <div className="pt-0.5 min-w-0">
                    <FreeGiftSelector />
                  </div>
                )}

                {/* Price Calculations */}
                <div className="pt-3.5 border-t border-[#f0ede6] space-y-2 text-[13px]">
                  <div className="flex justify-between gap-2 text-[#64748b]">
                    <span>Sous-total articles</span>
                    <span className="text-[#0f172a] font-semibold tabular-nums">{formatMAD(subtotal)}</span>
                  </div>

                  {!appliedPromo && dealDiscount > 0 && appliedDeal && (
                    <div className="flex justify-between gap-2 text-[#0f172a] bg-[#f8f7f3] px-2.5 py-1.5 rounded-lg border border-[#e6e2d8] text-[12px] font-semibold">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Sparkles size={13} className="text-[#0ea5e9] shrink-0" />
                        <span className="truncate">{appliedDeal.badgeText || appliedDeal.title}</span>
                      </span>
                      <span className="text-[#0284c7] shrink-0 tabular-nums">-{formatMAD(dealDiscount)}</span>
                    </div>
                  )}

                  {promoDiscount > 0 && (
                    <div className="flex justify-between gap-2 text-[#0284c7] font-semibold">
                      <span>Remise code promo</span>
                      <span className="tabular-nums">-{formatMAD(promoDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between gap-2 text-[#64748b]">
                    <span>Livraison ({form.city})</span>
                    <span
                      className={
                        shipping === 0
                          ? 'text-emerald-600 font-bold'
                          : 'text-[#0f172a] font-semibold tabular-nums'
                      }
                    >
                      {shipping === 0 ? 'Gratuite (0 MAD)' : formatMAD(shipping)}
                    </span>
                  </div>
                </div>

                {/* Authoritative Total Box */}
                <div className="pt-4 border-t border-[#e6e2d8] flex justify-between items-end gap-2">
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748b] block">
                      Total à régler au livreur
                    </span>
                    <span className="text-[11px] text-[#0284c7] font-bold flex items-center gap-1 mt-0.5">
                      <Check size={12} strokeWidth={3} className="shrink-0" /> Espèces à la réception
                    </span>
                  </div>
                  <span className="heading-font text-[26px] sm:text-3xl font-extrabold text-[#0f172a] tracking-tight tabular-nums shrink-0 leading-none">
                    {formatMAD(total)}
                  </span>
                </div>

                {/* Primary CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-13 sm:h-14 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-[14px] sm:text-[15px] font-bold tracking-wide rounded-2xl shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 transition border border-sky-400/30 cursor-pointer px-4"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={15} className="shrink-0" />
                      <span className="truncate">Confirmer · {formatMAD(total)}</span>
                      <ArrowRight size={16} className="shrink-0" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-[#64748b] text-center leading-relaxed flex items-start justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#0ea5e9] shrink-0 mt-0.5" />
                  <span>Aucun paiement en ligne · Vérifiez votre colis avant de régler.</span>
                </p>

                {/* Direct WhatsApp Concierge Assistance */}
                <div className="pt-3.5 border-t border-[#f0ede6] text-center">
                  <a
                    href="https://wa.me/212663380011?text=Bonjour,%20j%27ai%20une%20question%20concernant%20ma%20commande%20sur%20NAY%20Parfum"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-wrap items-center justify-center gap-1.5 text-[12px] font-semibold text-[#334155] hover:text-[#0284c7] transition"
                  >
                    <MessageCircle size={15} className="text-emerald-600 shrink-0" />
                    <span>Besoin d&apos;aide ? WhatsApp :</span>
                    <strong className="text-[#0f172a]">+212 663-380011</strong>
                  </a>
                </div>
              </div>
            </aside>
          </form>
        </div>
      </main>

      {/* 4. MOBILE STICKY BOTTOM CHECKOUT BAR (PERFECTLY SIZED FOR 320px–430px PHONES) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#e6e2d8] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-3.5 shadow-[0_-10px_30px_rgba(15,23,42,0.10)]">
        <div className="w-full max-w-lg mx-auto flex items-center justify-between gap-3 min-w-0">
          <div className="shrink-0">
            <span className="text-[9.5px] text-[#64748b] block uppercase tracking-wider font-bold leading-tight">
              À la livraison
            </span>
            <span className="heading-font text-[19px] font-extrabold text-[#0f172a] tracking-tight tabular-nums leading-tight">
              {formatMAD(total)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleMobileSubmitClick}
            disabled={isSubmitting}
            className="flex-1 min-w-0 h-12 px-4 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] active:from-[#0284c7] active:to-[#0369a1] text-white text-[13.5px] font-bold rounded-xl shadow-md shadow-sky-500/25 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={16} className="shrink-0" />
                <span className="truncate">Commander</span>
                <ArrowRight size={15} className="shrink-0" />
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
   LIVE INTERACTIVE STEP INDICATOR
   ============================================================ */

function StepIndicator({
  number,
  label,
  mobileLabel,
  completed,
  active,
}: {
  number: number;
  label: string;
  mobileLabel?: string;
  completed?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-all ${
          completed
            ? 'bg-emerald-500 text-white shadow-xs'
            : active
            ? 'bg-[#0ea5e9] text-white shadow-xs ring-3 ring-sky-500/20'
            : 'bg-[#f1efe9] text-[#64748b] border border-[#dedad0]'
        }`}
      >
        {completed ? <Check size={13} strokeWidth={3} /> : number}
      </span>
      <span
        className={`text-[11px] sm:text-[12.5px] font-bold truncate transition-colors ${
          completed
            ? 'text-emerald-700'
            : active
            ? 'text-[#0f172a]'
            : 'text-[#64748b]'
        }`}
      >
        {mobileLabel ? (
          <>
            <span className="sm:hidden">{mobileLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </>
        ) : (
          label
        )}
      </span>
    </div>
  );
}

/* ============================================================
   CELEBRATION SUCCESS MODAL WITH LUXURY ANIMATION
   ============================================================ */

function OrderCelebrationModal({
  data,
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
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#0ea5e9]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284c7] text-[11px] font-bold uppercase tracking-wider mb-2">
          <Sparkles size={12} className="text-[#0ea5e9]" /> Commande Confirmée avec Succès
        </div>

        <h3 className="heading-font text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
          Merci pour votre commande !
        </h3>

        <p className="text-[13px] text-[#64748b] mt-1.5 leading-relaxed">
          {data.customerName ? `Félicitations ${data.customerName}, votre ` : 'Votre '}parfum d&apos;exception est en cours de préparation dans notre Atelier.
        </p>

        <div className="my-5 p-4 rounded-2xl bg-[#f8f7f3] border border-[#e6e2d8] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#64748b] block">
              N° de Commande
            </span>
            <span className="font-mono font-bold text-[#0f172a] text-[15px]">{data.orderNumber}</span>
          </div>
          <div className="text-center sm:text-right">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#64748b] block">
              À régler au livreur
            </span>
            <span className="heading-font font-extrabold text-[#0284c7] text-[16px] tabular-nums">
              {formatMAD(data.total)}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-left text-[12px] text-[#475569] mb-6">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[#0ea5e9] shrink-0" strokeWidth={3} />
            <span>Colis emballé avec soin & contrôle d&apos;authenticité</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[#0ea5e9] shrink-0" strokeWidth={3} />
            <span>
              Expédition express sous 24h à 48h vers <strong>{data.city}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[#0ea5e9] shrink-0" strokeWidth={3} />
            <span>Ouvrez et testez votre flacon avant de régler en espèces</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRedirect}
          className="w-full h-13 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white font-bold text-[14px] rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Consulter mon reçu officiel</span>
          <ArrowRight size={16} />
        </button>

        <p className="text-[11px] text-[#94a3b8] mt-2.5">
          Redirection automatique dans {countdown}s…
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   ELEGANT LUXURY TUNNEL SUB-COMPONENTS
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
    <header className="sticky top-0 z-40 w-full max-w-full bg-white/95 backdrop-blur-md border-b border-[#e6e2d8] shadow-[0_1px_12px_rgba(15,23,42,0.03)]">
      <div className="w-full max-w-[1280px] mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Left: Back Link */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#f8f7f3] hover:bg-[#efece4] border border-[#e6e2d8] text-[12px] sm:text-[13px] font-bold text-[#334155] hover:text-[#0f172a] transition shrink-0"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">
            {isBuyNow ? 'Retour au produit' : 'Retour au panier'}
          </span>
          <span className="sm:hidden">Retour</span>
        </Link>

        {/* Center: Real NAY Brand Logo */}
        <Link
          href={`/${locale}`}
          aria-label="NAY Parfums - Accueil"
          className="flex items-center justify-center group active:scale-95 transition-transform shrink-0"
        >
          <div
            className="w-24 h-12 sm:w-32 sm:h-16 lg:w-40 lg:h-20 transition-colors duration-300 group-hover:bg-[#0ea5e9] bg-[#0f172a]"
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

        {/* Right: Security Trust Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold shrink-0">
          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">Commande 100% Sécurisée</span>
          <span className="sm:hidden">Sécurisé</span>
        </div>
      </div>
    </header>
  );
}

function LuxuryTunnelFooter() {
  return (
    <footer className="mt-10 sm:mt-16 w-full max-w-full border-t border-[#e6e2d8] bg-white py-8 sm:py-10 text-[#64748b] text-[12px]">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 pb-7 border-b border-[#f0ede6] text-center md:text-left">
          <div className="space-y-1">
            <h5 className="font-bold text-[#0f172a] text-[12.5px] sm:text-[13px] flex items-center justify-center md:justify-start gap-1.5">
              <ShieldCheck size={15} className="text-[#0ea5e9] shrink-0" /> Authenticité 100%
            </h5>
            <p className="text-[11px] text-[#64748b]">Même jus, même sillage et formulation certifiée.</p>
          </div>

          <div className="space-y-1">
            <h5 className="font-bold text-[#0f172a] text-[12.5px] sm:text-[13px] flex items-center justify-center md:justify-start gap-1.5">
              <PackageCheck size={15} className="text-[#0ea5e9] shrink-0" /> Test devant livreur
            </h5>
            <p className="text-[11px] text-[#64748b]">Inspectez votre flacon en main propre avant de régler.</p>
          </div>

          <div className="space-y-1">
            <h5 className="font-bold text-[#0f172a] text-[12.5px] sm:text-[13px] flex items-center justify-center md:justify-start gap-1.5">
              <Truck size={15} className="text-[#0ea5e9] shrink-0" /> Livraison 24h/48h
            </h5>
            <p className="text-[11px] text-[#64748b]">Expédition partout au Maroc avec coordination préalable.</p>
          </div>

          <div className="space-y-1">
            <h5 className="font-bold text-[#0f172a] text-[12.5px] sm:text-[13px] flex items-center justify-center md:justify-start gap-1.5">
              <Phone size={15} className="text-[#0ea5e9] shrink-0" /> Atelier Client NAY
            </h5>
            <p className="text-[11px] text-[#64748b]">Conseil personnalisé & suivi WhatsApp 7j/7.</p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#94a3b8]">
          <span>© 2026 NAY Parfum Maroc · Tous droits réservés.</span>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link href="/legal/terms" target="_blank" className="hover:text-[#0f172a] transition">
              Conditions Générales de Vente
            </Link>
            <span>•</span>
            <Link href="/legal/privacy" target="_blank" className="hover:text-[#0f172a] transition">
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
  completed,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  completed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full min-w-0 bg-white border border-[#e6e2d8] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-[0_2px_18px_rgba(15,23,42,0.035)]">
      <div className="flex items-start gap-3 sm:gap-3.5 mb-5 pb-4 border-b border-[#f0ede6]">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-[13px] sm:text-[14px] transition-colors ${
            completed
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
              : 'bg-sky-50 text-[#0284c7] border border-sky-200/70'
          }`}
        >
          {completed ? <Check size={17} strokeWidth={2.75} /> : number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="heading-font text-[15.5px] sm:text-[18px] font-extrabold tracking-tight text-[#0f172a] flex items-center gap-2 leading-snug">
            {icon && <span className="text-[#0ea5e9] shrink-0">{icon}</span>}
            <span className="break-words">{title}</span>
          </h3>
          <p className="text-[12px] text-[#64748b] mt-0.5 leading-relaxed">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4 min-w-0">{children}</div>
    </section>
  );
}

function LuxuryInput({
  label,
  requiredMark,
  optionalBadge,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  required,
  helper,
  error,
  leftIcon,
}: {
  label: string;
  requiredMark?: boolean;
  optionalBadge?: boolean;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  helper?: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 w-full">
      <label className="text-[11px] font-bold uppercase tracking-wider text-[#334155] mb-1.5 flex items-center justify-between gap-2 flex-wrap">
        <span className="flex items-center gap-1">
          <span>{label}</span>
          {requiredMark && <span className="text-rose-500">*</span>}
        </span>
        {optionalBadge && (
          <span className="text-[10px] font-semibold normal-case tracking-normal px-2 py-0.5 rounded-full bg-slate-100 text-[#64748b] border border-slate-200/80">
            Optionnel
          </span>
        )}
      </label>
      <div className="relative w-full min-w-0">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`w-full min-w-0 max-w-full border rounded-xl ${
            leftIcon ? 'pl-10 pr-3.5' : 'px-3.5'
          } py-3 text-[16px] sm:text-[14px] bg-white font-medium text-[#0f172a] focus:outline-none transition-all placeholder:text-[#94a3b8] ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
              : 'border-[#dcd8ce] focus:border-[#0ea5e9] focus:ring-3 focus:ring-[#0ea5e9]/15'
          }`}
        />
      </div>
      {error ? (
        <span className="text-[11px] text-rose-600 font-medium mt-1.5 block leading-snug">{error}</span>
      ) : helper ? (
        <span className="text-[11px] text-[#64748b] mt-1.5 block leading-snug">{helper}</span>
      ) : null}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#f8f7f3] min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}
