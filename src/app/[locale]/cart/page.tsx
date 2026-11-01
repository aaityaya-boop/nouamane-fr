'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart, calculatePromoDiscount } from '@/context/CartContext';
import { usePathname } from 'next/navigation';
import { formatMAD } from '@/lib/products';
import { getTrueProductCapacity, getPerfumeConcentration } from '@/lib/perfumeCapacity';
import {
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Tag,
  CheckCircle2,
  XCircle,
  Lock,
  ChevronRight,
  PackageCheck,
  MessageCircle,
  Check
} from 'lucide-react';
import FreeGiftSelector from '@/components/FreeGiftSelector';
import { useAuth } from '@/context/AuthContext';
import PromoAuthModal from '@/components/PromoAuthModal';

const FREE_SHIPPING_THRESHOLD = 800;

/* ============================================================
   CART PAGE — Redesigned High-End Luxury Experience
   ============================================================ */

function CartFlaconImage({ src, alt }: { src?: string; alt: string }) {
  const fallbackImg = '/images/flacon_dior_homme_intense.png';
  const initial = src && src.trim() !== '' && !src.includes('placeholder') ? src : fallbackImg;
  const [imgSrc, setImgSrc] = useState(initial);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src && src.trim() !== '' && !src.includes('placeholder')) {
      setImgSrc(src);
      setHasError(false);
    } else {
      setImgSrc(fallbackImg);
    }
  }, [src]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Image
        src={hasError ? fallbackImg : imgSrc}
        alt={alt}
        fill
        sizes="110px"
        onError={() => {
          setHasError(true);
          setImgSrc(fallbackImg);
        }}
        className="object-contain scale-125 group-hover:scale-130 transition-transform duration-300 mix-blend-multiply"
      />
    </div>
  );
}

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getSubtotal,
    shippingFee,
    appliedPromo,
    applyPromo,
    removePromo,
    appliedDeal,
    dealDiscount,
  } = useCart();
  const { customer } = useAuth();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const subtotal = getSubtotal();
  const shipping = shippingFee || 0;

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingPromoCode, setPendingPromoCode] = useState('');

  // Calculate discount
  const promoDiscount = calculatePromoDiscount(cart, appliedPromo);
  const totalDiscount = appliedPromo ? promoDiscount : dealDiscount;
  const total = Math.max(0, subtotal - totalDiscount) + shipping;

  // Free shipping progress calculations
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleApplyPromo = async (codeToOverride?: string) => {
    const code = (typeof codeToOverride === 'string' ? codeToOverride : promoInput).trim().toUpperCase();
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

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen selection:bg-[#0ea5e9] selection:text-white">
      <Header />

      <main className="pt-24 sm:pt-28 lg:pt-36 pb-48 lg:pb-24">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* HEADER & TUNNEL STEPPER */}
          <div className="mb-8 lg:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e0ddd4] pb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284c7] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
                  Atelier NAY · Panier Officiel
                </div>
                <h1 className="heading-font text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
                  {cart.length === 0 ? 'Votre sélection est vide' : `Mon Panier (${cart.length})`}
                </h1>
              </div>

              {/* Visual 3-Step Stepper */}
              <div className="flex items-center gap-3 text-[11px] sm:text-[12px] font-bold">
                <div className="flex items-center gap-1.5 text-[#0284c7]">
                  <span className="w-5 h-5 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Panier</span>
                </div>
                <ChevronRight size={14} className="text-[#bbb]" />
                <div className="flex items-center gap-1.5 text-[#888]">
                  <span className="w-5 h-5 rounded-full bg-[#e0ddd4] text-[#666] flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Livraison</span>
                </div>
                <ChevronRight size={14} className="text-[#bbb]" />
                <div className="flex items-center gap-1.5 text-[#888]">
                  <span className="w-5 h-5 rounded-full bg-[#e0ddd4] text-[#666] flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Paiement COD</span>
                </div>
              </div>
            </div>

            {/* FREE SHIPPING PROGRESS METER (If cart has items) */}
            {cart.length > 0 && (
              <div className="mt-5 p-4 rounded-2xl bg-white border border-[#e0ddd4] shadow-xs">
                <div className="flex items-center justify-between gap-2 text-[12px] sm:text-[13px] mb-2 font-medium">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-[#0ea5e9] shrink-0" />
                    {remainingForFreeShipping > 0 ? (
                      <span>
                        Ajoutez encore <strong className="text-[#0284c7] font-bold">{formatMAD(remainingForFreeShipping)}</strong> pour profiter de la <strong>Livraison Gratuite</strong> partout au Maroc !
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <Check size={15} strokeWidth={3} className="text-emerald-600" />
                        Félicitations ! Vous bénéficiez de la Livraison Gratuite Offerte !
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-[11px] text-[#6B6B6B] shrink-0 hidden sm:inline">
                    {subtotal} / {FREE_SHIPPING_THRESHOLD} MAD
                  </span>
                </div>
                
                {/* Visual Bar */}
                <div className="w-full h-2.5 bg-[#f0ede6] rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] transition-all duration-500 ease-out"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {cart.length === 0 ? (
            /* ===== EMPTY CART STATE ===== */
            <div className="max-w-md mx-auto text-center py-16 sm:py-24 bg-white border border-[#e0ddd4] rounded-3xl p-8 shadow-xs">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#fafaf7] border border-[#e0ddd4] flex items-center justify-center mb-5 text-[#888]">
                <ShoppingBag size={32} strokeWidth={1.5} />
              </div>
              <h2 className="heading-font text-2xl font-bold text-[#1A1A1A] mb-2">
                Votre panier est actuellement vide
              </h2>
              <p className="text-[13px] text-[#6B6B6B] mb-8 leading-relaxed">
                Découvrez nos testeurs authentiques de grandes maisons et nos parfums de niche scellés à prix d&apos;exception.
              </p>
              <Link
                href={`/${locale}/shop`}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-[13px] font-bold rounded-2xl shadow-lg shadow-sky-500/25 transition active:scale-95"
              >
                <span>Explorer la boutique</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            /* ===== CART CONTENT GRID (Creative & Elevated Luxury Architecture) ===== */
            <div className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
              
              {/* LEFT COLUMN: ATELIER PRODUCT LIST */}
              <div className="space-y-4">
                <div className="bg-white border border-[#E5E0D6] rounded-3xl p-4 sm:p-7 shadow-xs divide-y divide-[#F1EDE4]">
                  {cart.map((item) => {
                    const trueCapacity = getTrueProductCapacity(item.name, item.slug, item.size).toUpperCase();
                    const concentration = getPerfumeConcentration(item.name);

                    return (
                      <div
                        key={`${item.id}-${item.size}`}
                        className="py-5 sm:py-6 first:pt-0 last:pb-0 flex flex-row items-center gap-3.5 sm:gap-6 group/item"
                      >
                        {/* Product Flacon Thumbnail in Creative Studio Pedestal */}
                        <Link
                          href={`/${locale}/product/${item.slug}`}
                          className="w-22 h-24 sm:w-26 sm:h-28 rounded-2xl bg-white border border-[#E8E2D6] relative overflow-hidden shrink-0 group flex items-center justify-center p-1 shadow-2xs hover:border-[#0ea5e9]/50 transition-all duration-300"
                        >
                          <CartFlaconImage
                            src={item.image}
                            alt={item.name}
                          />
                        </Link>

                        {/* Product Details (Refined Typography & Spacing) */}
                        <div className="flex-1 min-w-0 space-y-2 w-full">
                          
                          {/* Row 1: Product Title & Delete Button */}
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              href={`/${locale}/product/${item.slug}`}
                              className="heading-font text-[14px] sm:text-[17px] font-bold text-[#1A1A1A] hover:text-[#0ea5e9] transition line-clamp-2 leading-snug"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id, item.size)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[#9A9A9A] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0 -mr-1"
                              title="Supprimer cet article"
                              aria-label="Supprimer cet article"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Row 2: True Capacity & Concentration Chips */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] sm:text-[10.5px] font-extrabold tracking-wider uppercase text-[#0284c7] bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200/80 shadow-2xs">
                              {trueCapacity}
                            </span>
                            <span className="text-[11px] sm:text-[12px] text-[#555] font-semibold">
                              {concentration}
                            </span>
                            <span className="text-[10.5px] text-emerald-700 font-semibold hidden sm:inline-flex items-center gap-1.5 ml-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              En stock à l&apos;Atelier
                            </span>
                          </div>

                          {/* Row 3: Interactive Quantity & Line Total */}
                          <div className="pt-1 flex items-center justify-between gap-3">
                            {/* Quantity Pill with Matte Finish */}
                            <div className="inline-flex items-center bg-[#FAF9F5] border border-[#E0DDD4] rounded-full p-0.5 sm:p-1 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#E0DDD4] hover:bg-[#F0EDE4] flex items-center justify-center text-[#555] hover:text-[#1A1A1A] transition active:scale-95 cursor-pointer shadow-2xs"
                                aria-label="Diminuer la quantité"
                              >
                                <Minus size={12} strokeWidth={2.5} />
                              </button>
                              <span className="w-7 sm:w-10 text-center font-mono font-bold text-xs sm:text-sm text-[#1A1A1A]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#E0DDD4] hover:bg-[#F0EDE4] flex items-center justify-center text-[#555] hover:text-[#1A1A1A] transition active:scale-95 cursor-pointer shadow-2xs"
                                aria-label="Augmenter la quantité"
                              >
                                <Plus size={12} strokeWidth={2.5} />
                              </button>
                            </div>

                            {/* Line Total & Unit Price */}
                            <div className="text-right">
                              <div className="heading-font text-base sm:text-xl font-extrabold text-[#1A1A1A] tracking-tight">
                                {formatMAD(item.price * item.quantity)}
                              </div>
                              <div className="text-[10px] sm:text-[11px] text-[#888] font-medium">
                                {formatMAD(item.price)} / unité
                              </div>
                            </div>
                          </div>

                          {/* Row 4: Professional Vector Reassurance Badge (Authenticity Guaranteed) */}
                          <div className="pt-2 flex items-center gap-2 sm:gap-4 text-[10.5px] sm:text-[11px] text-[#6B6B6B] border-t border-[#F5F2EB] mt-2">
                            <div className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                              <ShieldCheck size={13} className="text-[#0ea5e9] shrink-0" />
                              <span>Bouchon d&apos;origine & flacon vérifié</span>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Back to Catalog Link */}
                <div className="pt-2">
                  <Link
                    href={`/${locale}/shop`}
                    className="inline-flex items-center gap-2 text-[12px] font-bold text-[#6B6B6B] hover:text-[#0ea5e9] transition group cursor-pointer"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    <span>Continuer mes achats</span>
                  </Link>
                </div>
              </div>

              {/* RIGHT COLUMN: STICKY HAUTE PARFUMERIE ORDER SUMMARY */}
              <aside className="self-stretch">
                <div className="lg:sticky lg:top-28 bg-white border border-[#E5E0D6] rounded-3xl p-6 lg:p-7 shadow-xs space-y-5">
                  
                  {/* Summary Title & Security Badge */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#F1EDE4]">
                    <div>
                      <h3 className="heading-font text-xl font-bold text-[#1A1A1A] tracking-tight">
                        Récapitulatif
                      </h3>
                      <span className="text-[11px] text-[#6B6B6B] block mt-0.5 font-medium">
                        {cart.length} article{cart.length > 1 ? 's' : ''} sélectionné{cart.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                      <ShieldCheck size={12} /> 100% Sécurisé
                    </span>
                  </div>

                  {/* Free Gift Selector (if eligible) */}
                  {!appliedPromo && (
                    <div className="pt-1">
                      <FreeGiftSelector />
                    </div>
                  )}

                  {/* Promo Code Box */}
                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A]">
                        Code Promotionnel
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAuthModal(true)}
                        className="text-[10px] text-[#0284c7] hover:text-[#0ea5e9] font-semibold flex items-center gap-1 cursor-pointer transition hover:underline"
                      >
                        <Lock size={10} /> Réservé membres
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="EX : CODE PROMO"
                        className="flex-1 border border-[#E0DDD4] rounded-xl px-3.5 py-2.5 text-[13px] bg-white uppercase placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#0ea5e9] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyPromo()}
                        disabled={isApplyingPromo || !promoInput.trim()}
                        className="bg-[#1A1A1A] hover:bg-black text-white px-4 rounded-xl text-[11px] font-bold uppercase transition disabled:opacity-50 shrink-0 cursor-pointer shadow-xs active:scale-95"
                      >
                        {isApplyingPromo ? '…' : 'Appliquer'}
                      </button>
                    </div>

                    {promoError && (
                      <div className="text-rose-600 text-[11px] flex items-center gap-1">
                        <XCircle size={12} /> {promoError}
                      </div>
                    )}
                    {promoSuccess && !appliedPromo && (
                      <div className="text-[#0284c7] text-[11px] flex items-center gap-1">
                        <CheckCircle2 size={12} /> {promoSuccess}
                      </div>
                    )}
                    {appliedPromo && (
                      <div className="flex items-center justify-between bg-sky-50 border border-sky-200 px-3.5 py-2 rounded-xl">
                        <div className="flex items-center gap-1.5 text-[#0284c7] text-[12px] font-bold">
                          <Tag size={13} />
                          <span>Code {appliedPromo.code} appliqué</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-[11px] text-[#0284c7] underline hover:text-[#0369a1] font-semibold cursor-pointer"
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Calculations */}
                  <div className="pt-3 border-t border-[#F1EDE4] space-y-2.5 text-[13px]">
                    <div className="flex justify-between text-[#6B6B6B]">
                      <span>Sous-total articles</span>
                      <span className="text-[#1A1A1A] font-semibold">{formatMAD(subtotal)}</span>
                    </div>

                    {!appliedPromo && dealDiscount > 0 && appliedDeal && (
                      <div className="flex items-center justify-between text-[#1A1A1A] bg-[#FAF9F5] px-3 py-2 rounded-xl border border-[#E0DDD4] text-[12px] font-semibold">
                        <span className="inline-flex items-center gap-1.5 text-[#0284c7]">
                          <Tag size={13} className="text-[#0ea5e9]" />
                          <span>{appliedDeal.badgeText || appliedDeal.title}</span>
                        </span>
                        <span className="text-[#0284c7]">-{formatMAD(dealDiscount)}</span>
                      </div>
                    )}

                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-[#0284c7] font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag size={13} />
                          <span>Remise code promo</span>
                        </span>
                        <span>-{formatMAD(promoDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#6B6B6B]">
                      <span className="inline-flex items-center gap-1.5">
                        <Truck size={14} className="text-[#0ea5e9]" />
                        <span>Livraison partout au Maroc</span>
                      </span>
                      <span className={shipping === 0 ? 'text-emerald-700 font-bold' : 'text-[#1A1A1A] font-semibold'}>
                        {shipping === 0 ? 'Gratuite (0 MAD)' : formatMAD(shipping)}
                      </span>
                    </div>
                  </div>

                  {/* Total Box */}
                  <div className="pt-4 border-t border-[#E0DDD4] flex justify-between items-baseline">
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

                  {/* High-Impact CTA Button in Brand Vibrant Blue Gradient */}
                  <Link
                    href={`/${locale}/checkout`}
                    className="w-full h-14 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-[15px] font-bold tracking-wide rounded-2xl shadow-xl shadow-sky-500/25 active:scale-[0.99] flex items-center justify-center gap-2.5 transition border border-sky-400/30 cursor-pointer"
                  >
                    <Lock size={16} />
                    <span>Passer commande · {formatMAD(total)}</span>
                    <ArrowRight size={16} />
                  </Link>

                  {/* Guarantee Callout Banner (NO RAW EMOJIS) */}
                  <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100/90 flex items-start gap-2.5 text-[11.5px] text-slate-700 leading-snug">
                    <ShieldCheck size={16} className="text-[#0ea5e9] shrink-0 mt-0.5" />
                    <span><strong>0 MAD d&apos;avance</strong> · Vous inspectez et testez votre flacon en main propre avant de régler le livreur.</span>
                  </div>

                  {/* Trust Reassurance Badges with Vector Icons */}
                  <div className="pt-3 border-t border-[#F1EDE4] space-y-2 text-[11.5px] text-[#555]">
                    <div className="flex items-center gap-2.5">
                      <Truck size={14} className="text-[#0ea5e9] shrink-0" />
                      <span>Livraison express 24h / 48h partout au Maroc</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <PackageCheck size={14} className="text-[#0ea5e9] shrink-0" />
                      <span>Testez votre flacon en main propre devant le livreur</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={14} className="text-[#0ea5e9] shrink-0" />
                      <span>Parfums & Testeurs certifiés authentiques</span>
                    </div>
                  </div>

                  {/* Direct WhatsApp Concierge Assistance */}
                  <div className="pt-3 border-t border-[#F1EDE4] text-center">
                    <a
                      href="https://wa.me/212663380011?text=Bonjour,%20j%27ai%20une%20question%20sur%20mon%20panier%20sur%20NAY%20Parfum"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[11.5px] font-semibold text-[#1A1A1A] hover:text-[#0ea5e9] transition"
                    >
                      <MessageCircle size={15} className="text-[#0ea5e9]" />
                      <span>Besoin d&apos;aide ? WhatsApp : <strong>+212 663-380011</strong></span>
                    </a>
                  </div>

                </div>
              </aside>

            </div>
          )}

        </div>
      </main>

      <Footer />
      <CartDrawer />

      {/* Obligatory Account Modal to Unlock Promo Code */}
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
