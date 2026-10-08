'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart, calculatePromoDiscount } from '@/context/CartContext';
import { usePathname } from 'next/navigation';
import { formatMAD } from '@/lib/products';
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, Truck, ShieldCheck, Gift, Tag, CheckCircle2, XCircle, Lock } from 'lucide-react';
import FreeGiftSelector from '@/components/FreeGiftSelector';
import { useAuth } from '@/context/AuthContext';
import PromoAuthModal from '@/components/PromoAuthModal';

/* ============================================================
   CART PAGE — Full-page cart with summary
   ============================================================ */

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getSubtotal, shippingFee, appliedPromo, applyPromo, removePromo, appliedDeal, dealDiscount } = useCart();
  const { customer } = useAuth();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const subtotal = getSubtotal();
  const shipping = shippingFee || 0;
  
  // Promo Code State
  const [promoInput, setPromoInput] = React.useState('');
  const [promoError, setPromoError] = React.useState('');
  const [promoSuccess, setPromoSuccess] = React.useState('');
  const [isApplyingPromo, setIsApplyingPromo] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [pendingPromoCode, setPendingPromoCode] = React.useState('');

  // Calculate discount using accurate scope and product targeting
  // 🔒 When a promo code is active, DO NOT cumulate with other deals or free offers: give ONLY the promo code bonus!
  const promoDiscount = calculatePromoDiscount(cart, appliedPromo);
  const totalDiscount = appliedPromo ? promoDiscount : dealDiscount;
  const total = Math.max(0, subtotal - totalDiscount) + shipping;

  const handleApplyPromo = async (codeToOverride?: string) => {
    const code = (typeof codeToOverride === 'string' ? codeToOverride : promoInput).trim().toUpperCase();
    if (!code) return;

    // 🔒 If customer has no account / is not logged in, prompt obligatory account creation!
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
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen">
      <Header />

      <main className="pt-28 lg:pt-36 pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="mb-10 lg:mb-14">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">
              Votre Panier
            </span>
            <h1 className="heading-font text-4xl lg:text-6xl mt-3 tracking-wide">
              {cart.length === 0 ? 'Panier vide' : `Panier (${cart.length})`}
            </h1>
          </div>

          {cart.length === 0 ? (
            /* ===== EMPTY STATE ===== */
            <div className="max-w-md mx-auto text-center py-16">
              <div className="inline-flex w-20 h-20 items-center justify-center border border-[#e0ddd4] rounded-full mb-6 text-[#9A9A9A]">
                <ShoppingBag size={28} strokeWidth={1.4} />
              </div>
              <h2 className="heading-font text-2xl text-[#1A1A1A] mb-3">
                Votre panier est vide
              </h2>
              <p className="text-[14px] text-[#6B6B6B] mb-8">
                Découvrez notre collection de parfums de niche marocains,
                distillés à la main à Fès.
              </p>
              <Link
                href="/shop"
                className="btn-blue inline-flex items-center gap-3 px-10 py-4 text-[11px] rounded-full"
              >
                Voir la boutique
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            /* ===== CART GRID ===== */
            <div className="grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-14">
              {/* ITEMS */}
              <section>
                {/* Cart header row - desktop only */}
                <div className="hidden lg:grid grid-cols-[1fr_140px_140px_60px] gap-4 pb-4 border-b border-[#e0ddd4] text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A]">
                  <div>Produit</div>
                  <div className="text-center">Quantité</div>
                  <div className="text-right">Prix</div>
                  <div></div>
                </div>

                <div className="divide-y divide-[#e0ddd4]">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="py-6 lg:grid lg:grid-cols-[1fr_140px_140px_60px] lg:gap-4 lg:items-center flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      {/* Product */}
                      <div className="flex gap-4 lg:gap-5 flex-1">
                        <Link
                          href={`/${locale}/product/${item.slug}`}
                          className="w-24 h-28 bg-transparent rounded-xl overflow-hidden flex-shrink-0 relative"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </Link>
                        <div>
                          <Link
                            href={`/${locale}/product/${item.slug}`}
                            className="heading-font text-xl text-[#1A1A1A] hover:text-[#0ea5e9]"
                          >
                            {item.name}
                          </Link>
                          <div className="text-[11px] font-medium tracking-[0.1em] uppercase text-[#9A9A9A] mt-1">
                            {item.size} · Eau de Parfum
                          </div>
                          <div className="text-[13px] text-[#6B6B6B] mt-1">
                            {formatMAD(item.price)} l&apos;unité
                          </div>

                          {/* Mobile controls */}
                          <div className="lg:hidden flex items-center gap-4 mt-4">
                            <div className="flex items-center border border-[#e0ddd4] rounded-full">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.size, item.quantity - 1)
                                }
                                className="w-9 h-9 flex items-center justify-center text-[#9A9A9A] hover:text-[#1A1A1A]"
                              >
                                <Minus size={13} />
                              </button>
                              <div className="px-4 text-sm font-mono">
                                {item.quantity}
                              </div>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.size, item.quantity + 1)
                                }
                                className="w-9 h-9 flex items-center justify-center text-[#9A9A9A] hover:text-[#1A1A1A]"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <div className="ml-auto font-semibold text-[#1A1A1A]">
                              {formatMAD(item.price * item.quantity)}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id, item.size)}
                              className="text-[#D4D4D4] hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Quantity - Desktop */}
                      <div className="hidden lg:flex justify-center">
                        <div className="flex items-center border border-[#e0ddd4] rounded-full">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.size, item.quantity - 1)
                            }
                            className="w-9 h-9 flex items-center justify-center text-[#9A9A9A] hover:text-[#1A1A1A]"
                          >
                            <Minus size={13} />
                          </button>
                          <div className="px-4 text-sm font-mono">
                            {item.quantity}
                          </div>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.size, item.quantity + 1)
                            }
                            className="w-9 h-9 flex items-center justify-center text-[#9A9A9A] hover:text-[#1A1A1A]"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Price - Desktop */}
                      <div className="hidden lg:block text-right font-semibold text-[#1A1A1A]">
                        {formatMAD(item.price * item.quantity)}
                      </div>

                      {/* Remove - Desktop */}
                      <div className="hidden lg:flex justify-end">
                        <button
                          onClick={() => removeFromCart(item.id, item.size)}
                          className="text-[#D4D4D4] hover:text-red-400"
                          aria-label="Retirer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <Link
                    href="/shop"
                    className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#0ea5e9] hover:text-[#7e22ce]"
                  >
                    ← Continuer les achats
                  </Link>
                </div>
              </section>

              {/* ORDER SUMMARY */}
              <aside>
                <div className="lg:sticky lg:top-28 bg-white border border-[#e0ddd4] rounded-2xl border border-[#e0ddd4] p-8 shadow-sm">
                  <h3 className="heading-font text-2xl tracking-wide">
                    Récapitulatif
                  </h3>

                  {!appliedPromo && (
                    <div className="mt-4">
                      <FreeGiftSelector />
                    </div>
                  )}

                  <div className="mt-5 space-y-3 pb-6 border-b border-[#e0ddd4]">
                    <div className="flex justify-between text-[14px]">
                      <span className="text-[#6B6B6B]">Sous-total</span>
                      <span className="text-[#1A1A1A] font-medium">
                        {formatMAD(subtotal)}
                      </span>
                    </div>

                    {!appliedPromo && dealDiscount > 0 && appliedDeal && (
                      <div className="flex justify-between text-[14px] text-[#0ea5e9] bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span>🎉</span>
                          <span>{appliedDeal.badgeText || appliedDeal.title}</span>
                        </div>
                        <span className="font-bold text-xs">
                          -{formatMAD(dealDiscount)}
                        </span>
                      </div>
                    )}

                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-[14px] text-green-600">
                        <span>Code promo ({appliedPromo?.code})</span>
                        <span className="font-medium">
                          -{formatMAD(promoDiscount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-[14px]">
                      <span className="text-[#6B6B6B]">Livraison</span>
                      <span className="text-[#1A1A1A] font-medium">
                        {shipping === 0 ? 'Gratuite' : formatMAD(shipping)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-6">
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#9A9A9A]">
                      Total
                    </span>
                    <span className="heading-font text-3xl font-medium text-[#1A1A1A]">
                      {formatMAD(total)}
                    </span>
                  </div>

                  <Link
                    href="/checkout"
                    className="btn-blue w-full inline-flex items-center justify-center gap-2 py-4 mt-6 text-[11px] rounded-full"
                  >
                    Passer commande
                    <ArrowRight size={14} />
                  </Link>

                  {/* Trust */}
                  <div className="mt-6 space-y-3 pt-6 border-t border-[#e0ddd4]">
                    <TrustItem
                      icon={<Truck size={14} />}
                      label={shippingFee === 0 ? 'Livraison Gratuite ! 🎉' : `Livraison partout au Maroc avec ${shippingFee}Dh`}
                    />
                    <TrustItem
                      icon={<Gift size={14} />}
                      label="Authenticité garantie à 100%"
                    />
                    <TrustItem
                      icon={<ShieldCheck size={14} />}
                      label="Paiement sécurisé · Cash on delivery disponible"
                    />
                  </div>

                  {/* Promo */}
                  <div className="mt-6 pt-6 border-t border-[#e0ddd4]">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A]">
                        Code promo
                      </label>
                      <span className="text-[10px] text-sky-600 font-medium normal-case flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                        <Lock size={10} /> Compte membre requis
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="Votre code"
                        className="flex-1 border border-[#e0ddd4] rounded-lg px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#0ea5e9] uppercase"
                      />
                      <button 
                        onClick={() => handleApplyPromo()}
                        disabled={isApplyingPromo || !promoInput.trim()}
                        className="btn-outline-blue px-5 py-2.5 text-[11px] rounded-lg disabled:opacity-50"
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

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-3 text-[12px] text-[#6B6B6B]">
      <span className="text-[#0ea5e9] mt-0.5">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
