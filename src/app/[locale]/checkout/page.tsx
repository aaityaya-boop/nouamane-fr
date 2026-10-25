'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart, calculatePromoDiscount } from '@/context/CartContext';
import { formatMAD, MOROCCAN_CITIES } from '@/lib/products';
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
  Zap,
  Phone,
  Check,
  PackageCheck,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import FreeGiftSelector from '@/components/FreeGiftSelector';
import { useAuth } from '@/context/AuthContext';
import PromoAuthModal from '@/components/PromoAuthModal';

/* ============================================================
   NAY CONFIDENCE CHECKOUT
   Contact · Livraison · Paiement · Récapitulatif
   ============================================================ */

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
    if (typeof window !== 'undefined' && window.fbq && cart.length > 0) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: cart.map((item) => item.sku || item.id.toString()),
        content_type: 'product',
        value: Math.max(Number(subtotal.toFixed(2)), 0.01),
        currency: 'MAD',
        num_items: cart.length,
      });
    }
  }, [cart.length, subtotal]);

  // Real-time abandoned checkout lead capture (captures contact info in background)
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
          customerPhone: form.phone.trim(),
          customerEmail: form.email.trim(),
          customerCity: form.city,
          status: 'ACTIVE',
        }),
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [form.phone, form.firstName, form.lastName, form.email, form.city, cart, subtotal, isBuyNow]);

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
          customerPhone: form.phone,
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
        customerPhone: form.phone,
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

      const trackingCart = [...cart];
      const trackingTotal = total;

      // 🔒 ONLY clear shopping cart if this was standard cart checkout!
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

      router.push(`/${locale}/order-confirmation?order=${orderNumber}`);
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors de la validation. Veuillez vérifier vos informations et réessayer.');
      setIsSubmitting(false);
    }
  };

  /* ---- BUY NOW LOADING GUARD ---- */
  if (isBuyNow && buyNowLoading) {
    return (
      <div className="bg-[#fafaf7] min-h-screen">
        <Header />
        <div className="max-w-md mx-auto pt-40 pb-24 text-center px-6">
          <div className="w-10 h-10 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6B6B] text-[13px] font-medium tracking-wide">
            Préparation de votre commande directe…
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  /* ---- BUY NOW ERROR GUARD ---- */
  if (isBuyNow && (buyNowError || !buyNowData)) {
    return (
      <div className="bg-[#fafaf7] min-h-screen">
        <Header />
        <div className="max-w-md mx-auto pt-40 pb-24 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-6">
            <XCircle size={32} />
          </div>
          <h1 className="heading-font text-2xl sm:text-3xl font-bold mb-3 text-[#1A1A1A]">
            Produit indisponible
          </h1>
          <p className="text-[#6B6B6B] text-[13px] mb-8 leading-relaxed">
            {buyNowError || 'Ce produit est actuellement indisponible ou le lien est invalide.'}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="btn-blue inline-block px-10 py-3.5 text-[12px] font-bold rounded-full shadow-md"
          >
            Explorer la boutique
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  /* ---- EMPTY CART GUARD ---- */
  if (!isBuyNow && cart.length === 0) {
    return (
      <div className="bg-[#fafaf7] min-h-screen">
        <Header />
        <div className="max-w-md mx-auto pt-40 pb-24 text-center px-6">
          <h1 className="heading-font text-3xl sm:text-4xl mb-4 font-bold text-[#1A1A1A]">
            Votre panier est vide
          </h1>
          <p className="text-[#6B6B6B] mb-8 text-[13px]">
            Ajoutez au moins un parfum à votre panier avant de passer commande.
          </p>
          <Link
            href={`/${locale}/shop`}
            className="btn-blue inline-block px-10 py-3.5 text-[12px] font-bold rounded-full shadow-md"
          >
            Explorer le catalogue
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen">
      <Header />

      <main className="pt-20 sm:pt-28 lg:pt-36 pb-16 sm:pb-24">
        <div className="max-w-[1360px] mx-auto px-3.5 sm:px-6 lg:px-8">
          {/* Top Navigation & Contextual Trust Header */}
          <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
            <Link
              href={isBuyNow && buyNowSlug ? `/${locale}/product/${buyNowSlug}` : `/${locale}/cart`}
              className="text-[#6B6B6B] hover:text-[#0ea5e9] flex items-center gap-1.5 text-[12px] sm:text-[13px] font-semibold transition"
            >
              <ChevronLeft size={16} />
              <span>{isBuyNow ? 'Retour au produit' : 'Retour au panier'}</span>
            </Link>

            {/* Micro Trust Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Paiement à la livraison · 100% Sécurisé</span>
            </div>
          </div>

          {/* Page Title */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9]">
                Commande Express & Sécurisée
              </span>
            </div>
            <h1 className="heading-font text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1A1A1A]">
              Finaliser votre commande
            </h1>
            <p className="text-[12px] sm:text-[13px] text-[#6B6B6B] mt-1">
              Remplissez vos coordonnées pour recevoir votre colis sous 24h à 48h partout au Maroc.
            </p>
          </div>

          {/* MOBILE-ONLY: Collapsible Top Summary Card */}
          <div className="lg:hidden mb-6 bg-white border border-[#e0ddd4] rounded-2xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileSummaryOpen((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#fafaf7] transition"
              aria-expanded={mobileSummaryOpen}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-sky-50 text-[#0ea5e9] flex items-center justify-center shrink-0">
                  <PackageCheck size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <span>Récapitulatif</span>
                    <span className="text-[10px] font-normal text-[#6B6B6B]">
                      ({effectiveCart.length} article{effectiveCart.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="text-[11px] text-[#0ea5e9] font-medium flex items-center gap-0.5">
                    <span>{mobileSummaryOpen ? 'Masquer le détail' : 'Afficher le détail'}</span>
                    {mobileSummaryOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[14px] font-bold text-[#1A1A1A]">
                  {formatMAD(total)}
                </span>
                <span className="block text-[10px] text-emerald-600 font-medium">
                  {shipping === 0 ? 'Livraison offerte' : '+35 DH livraison'}
                </span>
              </div>
            </button>

            {/* Accordion Body */}
            {mobileSummaryOpen && (
              <div className="p-4 pt-0 border-t border-[#f1f1eb] bg-[#fafaf7]/50 divide-y divide-[#f1f1eb]">
                <div className="py-3 space-y-2.5 max-h-60 overflow-y-auto">
                  {effectiveCart.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex items-center gap-3">
                      <div className="relative w-11 h-11 bg-white rounded-lg border border-[#e0ddd4] overflow-hidden shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                        <span className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-[#1A1A1A] truncate">{item.name}</div>
                        <div className="text-[10px] text-[#6B6B6B] uppercase">{item.size}</div>
                      </div>
                      <div className="text-[12px] font-bold text-[#1A1A1A]">
                        {formatMAD(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 space-y-1 text-[12px]">
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Sous-total</span>
                    <span>{formatMAD(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Livraison</span>
                    <span>{shipping === 0 ? 'Gratuite' : formatMAD(shipping)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Remise</span>
                      <span>-{formatMAD(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] font-bold text-[#1A1A1A] pt-1">
                    <span>Total à régler</span>
                    <span className="text-[#0ea5e9]">{formatMAD(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 min-w-0"
          >
            {/* ============ LEFT: FORM ============ */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 min-w-0">
              {/* --- 1. CONTACT --- */}
              <FormCard
                number="01"
                title="Informations de contact"
                subtitle="Nous vous contacterons par téléphone et WhatsApp pour confirmer l'expédition."
              >
                <div className="grid sm:grid-cols-2 gap-4 min-w-0">
                  <TextField
                    name="firstName"
                    autoComplete="given-name"
                    label="Prénom"
                    placeholder="Votre prénom"
                    value={form.firstName}
                    onChange={(v) => update('firstName', v)}
                    required
                  />
                  <TextField
                    name="lastName"
                    autoComplete="family-name"
                    label="Nom"
                    placeholder="Votre nom de famille"
                    value={form.lastName}
                    onChange={(v) => update('lastName', v)}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4 min-w-0">
                  <TextField
                    name="phone"
                    autoComplete="tel"
                    type="tel"
                    inputMode="tel"
                    label="Téléphone WhatsApp *"
                    placeholder="+212 6 XX XX XX XX"
                    value={form.phone}
                    onChange={(v) => update('phone', v)}
                    required
                    helper="Numéro utilisé pour coordonner la livraison avec le livreur"
                  />
                  <TextField
                    name="email"
                    autoComplete="email"
                    label="Adresse email *"
                    type="email"
                    placeholder="exemple@email.com"
                    value={form.email}
                    onChange={(v) => update('email', v)}
                    required
                    helper="Pour recevoir votre reçu et numéro de suivi"
                  />
                </div>
              </FormCard>

              {/* --- 2. SHIPPING --- */}
              <FormCard
                number="02"
                title="Adresse de livraison"
                subtitle={
                  shipping === 0
                    ? '🎉 Félicitations : Livraison Gratuite activée (1 à 3 jours).'
                    : 'Livraison express partout au Maroc avec 35 DH en 1 à 3 jours.'
                }
                icon={<Truck size={18} />}
              >
                <TextField
                  name="address"
                  autoComplete="street-address"
                  label="Adresse de livraison complète"
                  placeholder="Quartier, résidence, rue, n° d'immeuble ou maison…"
                  value={form.address}
                  onChange={(v) => update('address', v)}
                  required
                />

                <div className="grid sm:grid-cols-2 gap-4 min-w-0">
                  <div className="min-w-0">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A] mb-1.5 block">
                      Ville *
                    </label>
                    <div className="relative">
                      <select
                        name="city"
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        required
                        className="w-full border border-[#e0ddd4] rounded-xl px-4 py-3 text-[14px] bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20 transition appearance-none cursor-pointer"
                      >
                        {MOROCCAN_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none"
                      />
                    </div>
                  </div>

                  <TextField
                    name="postalCode"
                    autoComplete="postal-code"
                    label="Code postal (optionnel)"
                    placeholder="Ex : 20000"
                    value={form.postalCode}
                    onChange={(v) => update('postalCode', v)}
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A] mb-1.5 block">
                    Instructions particulières pour le livreur (optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    rows={2}
                    placeholder="Ex : Appeler 30 min avant, livrer au bureau, étage 2…"
                    className="w-full border border-[#e0ddd4] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20 transition resize-none bg-white placeholder:text-[#9A9A9A]"
                  />
                </div>

                {/* Approved Delivery Reassurance Banner */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#0ea5e9] font-bold text-[13px]">
                    <Truck size={17} />
                    <span>Livraison généralement sous 24 à 48h après expédition</span>
                  </div>
                  <p className="text-[12px] text-[#555] leading-relaxed">
                    Le délai de livraison est généralement de 24 à 48 heures à compter de l&apos;expédition de votre colis. En cas d&apos;indisponibilité immédiate du parfum, sa préparation et son expédition peuvent nécessiter un délai supplémentaire.
                  </p>
                  <p className="text-[11px] text-[#6B6B6B]">
                    Le délai total peut atteindre environ 72 heures selon la disponibilité du parfum. Notre équipe et le livreur coordonnent la réception avec vous par téléphone.
                  </p>
                </div>
              </FormCard>

              {/* --- 3. PAYMENT --- */}
              <FormCard
                number="03"
                title="Mode de paiement"
                subtitle="Vous ne payez rien en ligne. Le règlement s'effectue à la livraison."
                icon={<Lock size={18} />}
              >
                <div className="grid gap-3">
                  <PaymentOption
                    selected={form.paymentMethod === 'cod'}
                    onClick={() => update('paymentMethod', 'cod')}
                    icon={<Banknote size={22} />}
                    title="Paiement à la livraison (Cash on Delivery)"
                    subtitle="Réglez directement en espèces au livreur lors de la remise de votre colis en main propre"
                    badge="Recommandé au Maroc"
                  />
                </div>

                {/* Feature 01 & 02: Try Before You Pay — Verified Policy Trust Card & 3-Step Explanation */}
                <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/50 border border-sky-200/80 shadow-xs space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center text-[#0ea5e9] shrink-0 mt-0.5">
                      <PackageCheck size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="heading-font text-[14px] sm:text-[15px] font-bold text-[#1A1A1A] leading-snug">
                        Essayez d&apos;abord. Payez seulement si vous aimez.
                      </h3>
                      <p className="text-[12px] text-[#4A4A4A] mt-1.5 leading-relaxed">
                        Ouvrez votre colis et testez votre parfum devant le livreur. S&apos;il vous convient, vous payez. Sinon, vous ne payez rien, même pas la livraison. Le colis nous est retourné sans frais.
                      </p>
                    </div>
                  </div>

                  {/* Feature 02: 3-Step Visual Progression */}
                  <div className="pt-3 border-t border-sky-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="bg-white/80 rounded-xl p-2.5 border border-sky-100 flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        1
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-[#1A1A1A]">01 — Recevez</div>
                        <div className="text-[10px] text-[#6B6B6B] leading-tight">Recevez votre commande.</div>
                      </div>
                    </div>

                    <div className="bg-white/80 rounded-xl p-2.5 border border-sky-100 flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        2
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-[#1A1A1A]">02 — Testez</div>
                        <div className="text-[10px] text-[#6B6B6B] leading-tight">Ouvrez et testez votre parfum devant le livreur.</div>
                      </div>
                    </div>

                    <div className="bg-white/80 rounded-xl p-2.5 border border-sky-100 flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        3
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-[#1A1A1A]">03 — Décidez</div>
                        <div className="text-[10px] text-[#6B6B6B] leading-tight">S&apos;il vous plaît, payez. Sinon, retour gratuit sans aucun paiement.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </FormCard>
            </div>

            {/* ============ RIGHT: ORDER SUMMARY ============ */}
            <aside className="min-w-0">
              <div className="lg:sticky lg:top-28 bg-white border border-[#e0ddd4] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xs min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 min-w-0 mb-5 pb-4 border-b border-[#f1f1eb]">
                  <div className="min-w-0">
                    <h2 className="heading-font text-lg sm:text-xl font-bold tracking-wide text-[#1A1A1A]">
                      Votre commande
                    </h2>
                    <p className="text-[11px] text-[#6B6B6B]">
                      {effectiveCart.length} article{effectiveCart.length > 1 ? 's' : ''} sélectionné{effectiveCart.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  {isBuyNow && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-[#0ea5e9] text-[11px] font-bold border border-sky-100 shrink-0">
                      <Zap size={12} className="fill-[#0ea5e9]" /> Achat Immédiat
                    </span>
                  )}
                </div>

                {/* Product Items List */}
                <div className="space-y-3.5 pb-5 border-b border-[#f1f1eb] max-h-72 overflow-y-auto lux-scrollbar min-w-0">
                  {effectiveCart.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex gap-3 items-center min-w-0 p-2 rounded-xl bg-[#fafaf7] border border-[#e0ddd4]/60"
                    >
                      <div className="relative w-14 h-16 bg-white rounded-lg border border-[#e0ddd4] overflow-hidden shrink-0">
                        <Image
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#1A1A1A] truncate">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#0ea5e9] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                            {item.size}
                          </span>
                          <span className="text-[11px] text-[#6B6B6B]">
                            Qté : {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="text-[13px] font-bold text-[#1A1A1A] shrink-0 text-right">
                        {formatMAD(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code & Discounts */}
                <div className="space-y-3 py-4 border-b border-[#f1f1eb] min-w-0">
                  {/* Promo Input */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-[#6B6B6B]">
                        Code promo
                      </span>
                      <span className="text-[10px] text-sky-600 font-medium flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                        <Lock size={10} /> Compte membre
                      </span>
                    </div>

                    <div className="flex gap-2 min-w-0">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="Ex : NAY10"
                        className="flex-1 min-w-0 border border-[#e0ddd4] rounded-xl px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#0ea5e9] uppercase placeholder:text-[#9A9A9A]"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyPromo()}
                        disabled={isApplyingPromo || !promoInput.trim()}
                        className="bg-[#1A1A1A] hover:bg-black text-white px-4 rounded-xl text-[11px] font-bold uppercase transition disabled:opacity-50 shrink-0"
                      >
                        {isApplyingPromo ? '…' : 'Appliquer'}
                      </button>
                    </div>

                    {promoError && (
                      <div className="text-red-500 text-[11px] mt-1.5 flex items-center gap-1">
                        <XCircle size={12} /> {promoError}
                      </div>
                    )}
                    {promoSuccess && !appliedPromo && (
                      <div className="text-emerald-600 text-[11px] mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={12} /> {promoSuccess}
                      </div>
                    )}
                    {appliedPromo && (
                      <div className="mt-2.5 flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                        <div className="flex items-center gap-1.5 text-emerald-800 text-[12px] font-bold">
                          <Tag size={13} />
                          <span>{appliedPromo.code}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-[11px] text-emerald-700 underline hover:text-emerald-900"
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

                  {/* Calculations */}
                  <div className="pt-2 space-y-2 text-[13px]">
                    <div className="flex justify-between text-[#6B6B6B]">
                      <span>Sous-total</span>
                      <span className="text-[#1A1A1A] font-semibold">{formatMAD(subtotal)}</span>
                    </div>

                    {!appliedPromo && dealDiscount > 0 && appliedDeal && (
                      <div className="flex justify-between text-[#0ea5e9] bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-200 text-[12px] font-semibold">
                        <span>🎉 {appliedDeal.badgeText || appliedDeal.title}</span>
                        <span>-{formatMAD(dealDiscount)}</span>
                      </div>
                    )}

                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Remise ({appliedPromo?.code})</span>
                        <span>-{formatMAD(promoDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#6B6B6B]">
                      <span>Frais de livraison</span>
                      <span className={shipping === 0 ? 'text-emerald-600 font-bold' : 'text-[#1A1A1A] font-semibold'}>
                        {shipping === 0 ? 'Gratuite (0 MAD)' : formatMAD(shipping)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final Total Display */}
                <div className="py-4 my-2 flex justify-between items-baseline">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A9A9A] block">
                      Total à payer à la livraison
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      Paiement en espèces au livreur
                    </span>
                  </div>
                  <span className="heading-font text-3xl font-bold text-[#1A1A1A]">
                    {formatMAD(total)}
                  </span>
                </div>

                {/* Visually Dominant Purchase CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-blue w-full h-14 text-[14px] sm:text-[15px] font-bold tracking-wider rounded-2xl shadow-xl shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 transition"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Confirmer ma commande · {formatMAD(total)}</span>
                    </>
                  )}
                </button>

                {/* Feature 03: Final Purchase Reassurance */}
                <div className="text-center mt-3 space-y-1">
                  <span className="text-[11px] font-semibold text-[#0ea5e9] flex items-center justify-center gap-1.5">
                    <Sparkles size={13} className="shrink-0 text-[#0ea5e9]" />
                    Testez devant le livreur. Aucun paiement si le parfum ne vous convient pas.
                  </span>
                  <span className="text-[11px] text-[#6B6B6B] block">
                    🔒 Aucune carte bancaire requise · Règlement à la livraison
                  </span>
                </div>

                {/* Contextual Verified Trust Badges */}
                <div className="mt-6 pt-5 border-t border-[#f1f1eb] space-y-3">
                  <div className="flex items-center gap-2.5 text-[12px] text-[#4A4A4A]">
                    <ShieldCheck size={16} className="text-[#0ea5e9] shrink-0" />
                    <span><strong>Testeurs & Parfums de Qualité</strong> · Mêmes notes, même sillage & même odeur</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[12px] text-[#4A4A4A]">
                    <Truck size={16} className="text-[#0ea5e9] shrink-0" />
                    <span><strong>Livraison rapide & suivie</strong> partout au Maroc</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[12px] text-[#4A4A4A]">
                    <Phone size={16} className="text-[#0ea5e9] shrink-0" />
                    <span>
                      Support client WhatsApp / Tél :{' '}
                      <a
                        href="tel:+212663380011"
                        className="font-bold text-[#1A1A1A] hover:text-[#0ea5e9] transition"
                      >
                        +212 663-380011
                      </a>
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-[#9A9A9A] text-center mt-5 leading-relaxed">
                  En confirmant votre commande, vous acceptez nos{' '}
                  <Link href="/legal/terms" target="_blank" className="underline hover:text-[#0ea5e9]">
                    conditions générales de vente
                  </Link>
                  .
                </p>
              </div>
            </aside>
          </form>
        </div>
      </main>

      <Footer />

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
   REUSABLE FORM PRIMITIVES
   ============================================================ */

function FormCard({
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
    <section className="bg-white border border-[#e0ddd4] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xs min-w-0">
      <div className="flex items-start gap-2.5 sm:gap-4 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-[#f1f1eb] min-w-0">
        <span className="heading-font text-xl sm:text-2xl lg:text-3xl font-bold text-[#0ea5e9]/40 leading-none shrink-0 mt-0.5">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="heading-font text-[15px] sm:text-lg lg:text-xl font-bold tracking-wide flex items-center gap-2 flex-wrap min-w-0 text-[#1A1A1A]">
            {icon && <span className="text-[#0ea5e9] shrink-0">{icon}</span>}
            <span className="break-words">{title}</span>
          </h2>
          <p className="text-[11px] sm:text-[12px] text-[#6B6B6B] mt-0.5 break-words">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3.5 sm:space-y-4 min-w-0">{children}</div>
    </section>
  );
}

function TextField({
  name,
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  placeholder,
  autoComplete,
  required,
  helper,
}: {
  name?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  helper?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A] mb-1.5 block">
        {label}
      </label>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full border border-[#e0ddd4] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20 transition-all bg-white placeholder:text-[#9A9A9A]"
      />
      {helper && <span className="text-[10px] text-[#9A9A9A] mt-1 block">{helper}</span>}
    </div>
  );
}

function PaymentOption({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all w-full min-w-0 ${
        selected
          ? 'border-[#0ea5e9] bg-sky-50/30 shadow-xs ring-1 ring-[#0ea5e9]/30'
          : 'border-[#e0ddd4] hover:border-[#0ea5e9]/50 bg-white'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
          selected ? 'border-[#0ea5e9]' : 'border-[#e0ddd4]'
        }`}
      >
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />}
      </div>
      <div className={`shrink-0 mt-0.5 sm:mt-0 ${selected ? 'text-[#0ea5e9]' : 'text-[#6B6B6B]'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] sm:text-[14px] font-bold text-[#1A1A1A] flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="break-words">{title}</span>
          {badge && (
            <span className="text-[9px] font-bold tracking-wider uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0">
              {badge}
            </span>
          )}
        </div>
        <div className="text-[11px] sm:text-[12px] text-[#6B6B6B] mt-0.5 break-words">{subtitle}</div>
      </div>
    </button>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#fafaf7] min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}
