'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ShieldCheck,
  Tag,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import FreeGiftSelector from '@/components/FreeGiftSelector';

/* ============================================================
   ONE-PAGE CHECKOUT
   Contact · Shipping · Payment · Summary
   ============================================================ */

export default function CheckoutPage() {
  const { cart, getSubtotal, clearCart, shippingFee, appliedPromo, applyPromo, removePromo, appliedDeal, dealDiscount, selectedFreeGift } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const subtotal = getSubtotal();
  const shipping = shippingFee || 0;
  
  // Calculate discount using accurate scope and product targeting + active deals
  const promoDiscount = calculatePromoDiscount(cart, appliedPromo);
  const totalDiscount = promoDiscount + dealDiscount;
  const total = Math.max(0, subtotal - totalDiscount) + shipping;

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
    
    saveInfo: false,
  });

  // Redirect if cart empty (client-side check after mount)
  useEffect(() => {
    // Initiate Checkout Event
    if (typeof window !== 'undefined' && window.fbq && cart.length > 0) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: cart.map(item => item.sku || item.id.toString()),
        content_type: 'product',
        value: Math.max(Number(subtotal.toFixed(2)), 0.01),
        currency: 'MAD',
        num_items: cart.length
      });
    }
  }, [cart.length, subtotal]);

  // Real-time abandoned checkout lead capture (captures contact info in background)
  useEffect(() => {
    if (!cart || cart.length === 0) return;
    const hasContact = Boolean(form.phone.trim() || form.email.trim() || form.firstName.trim());
    if (!hasContact) return;

    const timer = setTimeout(() => {
      let sessionId = Cookies.get('nouamaneSession');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
          status: 'ACTIVE'
        })
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [form.phone, form.firstName, form.lastName, form.email, form.city, cart, subtotal]);

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const res = await fetch('/api/checkout/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoInput.trim(),
          items: cart,
          subtotal,
        })
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
      } else {
        setPromoError(data.error || 'Code promo invalide');
        removePromo();
      }
    } catch (err) {
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
    if (cart.length === 0) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `${form.firstName} ${form.lastName}`,
          customerEmail: form.email,
          customerPhone: form.phone,
          shippingAddress: form.address,
          shippingCity: form.city,
          shippingPostalCode: form.postalCode,
          paymentMethod: form.paymentMethod,
          items: cart,
          subtotal,
          shippingCost: shipping,
          total,
          promoCode: appliedPromo?.code || (appliedDeal ? `OFFRE:${appliedDeal.badgeText || appliedDeal.title}` : null),
          discount: totalDiscount > 0 ? totalDiscount : null,
          selectedFreeGift: selectedFreeGift || null,
          sessionId: Cookies.get('nouamaneSession') || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Order failed');
      }

      const { orderNumber } = await res.json();

      // Clear the live cart session cookie now that order is confirmed
      Cookies.remove('nouamaneSession');

      // Persist order info for confirmation page
      const confirmationData = {
        orderNumber,
        customerName: `${form.firstName} ${form.lastName}`,
        customerEmail: form.email,
        customerPhone: form.phone,
        shippingAddress: form.address,
        shippingCity: form.city,
        shippingPostalCode: form.postalCode,
        paymentMethod: form.paymentMethod,
        items: cart,
        subtotal,
        shippingCost: shipping,
        total,
        promoCode: appliedPromo?.code || (appliedDeal ? `OFFRE:${appliedDeal.badgeText || appliedDeal.title}` : null),
        discount: totalDiscount > 0 ? totalDiscount : null,
        selectedFreeGift: selectedFreeGift || null,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('nouamaneLastOrder', JSON.stringify(confirmationData));

      const trackingCart = [...cart];
      const trackingTotal = total;

      clearCart();
      removePromo();
      
      // Facebook Pixel Tracking for Purchase
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          content_ids: trackingCart.map(item => item.sku || item.id.toString()),
          content_type: 'product',
          value: Math.max(Number(trackingTotal.toFixed(2)), 0.01),
          currency: 'MAD',
          contents: trackingCart.map(item => ({
            id: item.sku || item.id.toString(),
            quantity: item.quantity,
            item_price: Number(item.price.toFixed(2))
          }))
        });
      }

      router.push(`/order-confirmation?order=${orderNumber}`);
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  /* ---- EMPTY CART GUARD ---- */
  if (cart.length === 0) {
    return (
      <div className="bg-[#fafaf7] min-h-screen">
        <Header />
        <div className="max-w-md mx-auto pt-40 pb-24 text-center px-6">
          <h1 className="heading-font text-4xl mb-4">
            Votre panier est vide
          </h1>
          <p className="text-[#6B6B6B] mb-8">
            Ajoutez au moins un produit à votre panier avant de passer commande.
          </p>
          <Link
            href="/shop"
            className="btn-blue inline-block px-10 py-4 text-[11px] rounded-full"
          >
            Voir la boutique
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen">
      <Header />

      <main className="pt-28 lg:pt-36 pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Link
              href="/cart"
              className="text-[#9A9A9A] hover:text-[#0ea5e9] flex items-center gap-1 text-[13px]"
            >
              <ChevronLeft size={16} /> Retour au panier
            </Link>
          </div>

          <div className="mb-10">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">
              Commande sécurisée
            </span>
            <h1 className="heading-font text-4xl lg:text-5xl mt-3 tracking-wide">
              Finaliser votre commande
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-14"
          >
            {/* ============ LEFT: FORM ============ */}
            <div className="space-y-12">
              {/* --- 1. CONTACT --- */}
              <FormSection
                number="01"
                title="Informations de contact"
                subtitle="Nous vous enverrons la confirmation par email."
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextField
                    label="Prénom"
                    value={form.firstName}
                    onChange={(v) => update('firstName', v)}
                    required
                  />
                  <TextField
                    label="Nom"
                    value={form.lastName}
                    onChange={(v) => update('lastName', v)}
                    required
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => update('email', v)}
                    required
                  />
                  <TextField
                    label="Téléphone"
                    type="tel"
                    placeholder="+212 6 XX XX XX XX"
                    value={form.phone}
                    onChange={(v) => update('phone', v)}
                    required
                  />
                </div>
              </FormSection>

              {/* --- 2. SHIPPING --- */}
              <FormSection
                number="02"
                title="Adresse de livraison"
                subtitle={shippingFee === 0 ? 'Livraison Gratuite ! 🎉 (1-3 jours)' : `Livraison partout au Maroc avec ${shippingFee}Dh en 1-3 jours.`}
                icon={<Truck size={18} />}
              >
                <TextField
                  label="Adresse complète"
                  placeholder="Rue, numéro, quartier…"
                  value={form.address}
                  onChange={(v) => update('address', v)}
                  required
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-2 block">
                      Ville *
                    </label>
                    <select
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      required
                      className="w-full border border-[#e0ddd4] rounded-lg px-4 py-3 text-[14px] bg-white border border-[#e0ddd4] focus:outline-none focus:border-[#0ea5e9]"
                    >
                      {MOROCCAN_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <TextField
                    label="Code postal"
                    value={form.postalCode}
                    onChange={(v) => update('postalCode', v)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-2 block">
                    Instructions de livraison (optionnel)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    rows={3}
                    placeholder="Ex : Appeler avant livraison, étage 3, digicode…"
                    className="w-full border border-[#e0ddd4] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#0ea5e9] resize-none"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.saveInfo}
                    onChange={(e) => update('saveInfo', e.target.checked)}
                    className="w-4 h-4 accent-[#0ea5e9]"
                  />
                  <span className="text-[13px] text-[#6B6B6B]">
                    Enregistrer mes informations pour la prochaine fois
                  </span>
                </label>
              </FormSection>

              {/* --- 3. PAYMENT --- */}
              <FormSection
                number="03"
                title="Mode de paiement"
                subtitle="Paiement 100% sécurisé. Payez à la livraison si vous préférez."
                icon={<Lock size={18} />}
              >
                <div className="grid gap-3">
                  {/* Cash on delivery */}
                  <PaymentOption
                    selected={form.paymentMethod === 'cod'}
                    onClick={() => update('paymentMethod', 'cod')}
                    icon={<Banknote size={20} />}
                    title="Paiement à la livraison (Cash on Delivery)"
                    subtitle="Réglez en espèces au livreur"
                    badge="Recommandé"
                  />


                </div>
              </FormSection>
            </div>

            {/* ============ RIGHT: ORDER SUMMARY ============ */}
            <aside>
              <div className="lg:sticky lg:top-28 bg-white border border-[#e0ddd4] rounded-2xl border border-[#e0ddd4] p-6 lg:p-8 shadow-sm">
                <h3 className="heading-font text-xl tracking-wide mb-6">
                  Votre commande
                </h3>

                <div className="space-y-4 pb-6 border-b border-[#e0ddd4] max-h-72 overflow-auto">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex gap-3 items-start"
                    >
                      <div className="relative w-14 h-16 bg-transparent rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                        <span className="absolute -top-1.5 -right-1.5 bg-[#f8fafc] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="heading-font text-[15px] text-[#1A1A1A] truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] tracking-[0.1em] uppercase text-[#9A9A9A]">
                          {item.size}
                        </div>
                      </div>
                      <div className="text-[13px] font-medium text-[#1A1A1A]">
                        {formatMAD(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 py-6 border-b border-[#e0ddd4]">
                  {/* Promo Code Input */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="Code promo" 
                        className="flex-1 border border-[#e0ddd4] rounded-lg px-4 py-2.5 text-[13px] bg-white focus:outline-none focus:border-[#0ea5e9] uppercase"
                      />
                      <button 
                        type="button" 
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoInput.trim()}
                        className="bg-[#1A1A1A] text-white px-5 rounded-lg text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-black transition-colors disabled:opacity-50"
                      >
                        {isApplyingPromo ? '...' : 'Appliquer'}
                      </button>
                    </div>
                    {promoError && (
                      <div className="text-red-500 text-[11px] mt-2 flex items-center gap-1">
                        <XCircle size={12} /> {promoError}
                      </div>
                    )}
                    {promoSuccess && !appliedPromo && (
                      <div className="text-green-500 text-[11px] mt-2 flex items-center gap-1">
                        <CheckCircle2 size={12} /> {promoSuccess}
                      </div>
                    )}
                    {appliedPromo && (
                      <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                          <Tag size={14} />
                          <span className="text-[12px] font-bold tracking-wider">{appliedPromo.code}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleRemovePromo}
                          className="text-[11px] text-green-700 underline hover:text-green-900"
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mb-2">
                    <FreeGiftSelector />
                  </div>

                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6B6B6B]">Sous-total</span>
                    <span className="text-[#1A1A1A] font-medium">
                      {formatMAD(subtotal)}
                    </span>
                  </div>

                  {dealDiscount > 0 && appliedDeal && (
                    <div className="flex justify-between text-[13px] text-[#0ea5e9] bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                      <span className="font-bold flex items-center gap-1">
                        <span>🎉</span>
                        <span>{appliedDeal.badgeText || appliedDeal.title}</span>
                      </span>
                      <span className="font-bold">
                        -{formatMAD(dealDiscount)}
                      </span>
                    </div>
                  )}

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-[13px] text-green-600">
                      <span>Remise ({appliedPromo?.code})</span>
                      <span className="font-medium">
                        -{formatMAD(promoDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6B6B6B]">Livraison</span>
                    <span className="text-[#1A1A1A] font-medium">
                      {shipping === 0 ? 'Gratuite' : formatMAD(shipping)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline py-6">
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#9A9A9A]">
                    Total
                  </span>
                  <span className="heading-font text-3xl font-medium text-[#1A1A1A]">
                    {formatMAD(total)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-blue w-full py-4 text-[11px] rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Traitement…' : 'Confirmer la commande'}
                </button>

                <div className="flex items-center gap-2 justify-center mt-4 text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A]">
                  <ShieldCheck size={12} /> Transaction sécurisée SSL
                </div>

                <p className="text-[11px] text-[#9A9A9A] text-center mt-4 leading-relaxed">
                  En passant votre commande, vous acceptez nos{' '}
                  <Link href="/legal/terms" target="_blank" className="underline hover:text-[#0ea5e9]">
                    conditions générales
                  </Link>
                  .
                </p>
              </div>
            </aside>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ============================================================
   FORM PRIMITIVES
   ============================================================ */

function FormSection({
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
    <section>
      <div className="flex items-start gap-4 mb-6">
        <span className="heading-font text-3xl text-[#0ea5e9]/40 leading-none">
          {number}
        </span>
        <div>
          <h2 className="heading-font text-2xl tracking-wide flex items-center gap-3">
            {icon && <span className="text-[#0ea5e9]">{icon}</span>}
            {title}
          </h2>
          <p className="text-[13px] text-[#9A9A9A] mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4 ml-0 lg:ml-12">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-2 block">
        {label} {required && '*'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-[#e0ddd4] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#0ea5e9] transition-colors bg-white border border-[#e0ddd4]"
      />
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
      className={`text-left flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
        selected
          ? 'border-[#0ea5e9] bg-transparent/40'
          : 'border-[#e0ddd4] hover:border-[#0ea5e9]/50 bg-white border border-[#e0ddd4]'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? 'border-[#0ea5e9]' : 'border-[#e0ddd4]'
        }`}
      >
        {selected && (
          <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
        )}
      </div>
      <div className={selected ? 'text-[#0ea5e9]' : 'text-[#6B6B6B]'}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-[#1A1A1A] flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase bg-[#0ea5e9] text-white px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="text-[12px] text-[#9A9A9A]">{subtitle}</div>
      </div>
    </button>
  );
}
