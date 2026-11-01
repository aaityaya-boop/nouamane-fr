'use client';

/**
 * CartDrawer — Premium responsive sliding cart drawer.
 * Triggered by CustomEvent('openCart').
 * Provides instant feedback, item quantity adjustments, free shipping meter,
 * express checkout link, and a continue shopping action.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, ShoppingBag, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart, calculatePromoDiscount } from '@/context/CartContext';
import Image from 'next/image';
import { formatMAD } from '@/lib/products';
import FreeGiftSelector from '@/components/FreeGiftSelector';
import { useDictionary } from '@/context/DictionaryContext';

export default function CartDrawer() {
  const dict = useDictionary();
  const [isOpen, setIsOpen] = useState(false);
  const { cart, removeFromCart, updateQuantity, getSubtotal, shippingFee, appliedPromo, appliedDeal, dealDiscount } = useCart();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const isRTL = locale === 'ar';
  const subtotal = getSubtotal();
  const promoDiscount = calculatePromoDiscount(cart, appliedPromo);
  const effectiveDiscount = appliedPromo ? promoDiscount : dealDiscount;
  const totalAfterDiscount = Math.max(0, subtotal - effectiveDiscount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('openCart', handler);
    return () => window.removeEventListener('openCart', handler);
  }, []);

  // Keyboard accessibility (Escape key to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const expressCheckoutText = (dict.cartDrawer as any).expressCheckout || "Commander (Paiement Express)";
  const continueShoppingText = (dict.cartDrawer as any).continueShopping || "Continuer mes achats";
  const viewFullCartText = (dict.cartDrawer as any).viewFullCart || "Voir le panier détaillé";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: isRTL ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-white border-l rtl:border-l-0 rtl:border-r border-[#e0ddd4] h-full flex flex-col shadow-2xl z-10"
            role="dialog"
            aria-modal="true"
            aria-label={dict.cartDrawer.title}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-[#e0ddd4] bg-white">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} className="text-[#0ea5e9]" />
                <h2 className="heading-font text-lg sm:text-xl font-bold tracking-wide text-[#1A1A1A]">
                  {dict.cartDrawer.title}
                </h2>
                {totalItemsCount > 0 && (
                  <span className="text-[11px] font-bold bg-[#f1f5f9] text-[#0ea5e9] px-2 py-0.5 rounded-full border border-sky-100">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#888] hover:text-[#1A1A1A] p-2 rounded-full hover:bg-neutral-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 rtl:-ml-2 rtl:mr-0"
                aria-label="Fermer le panier"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                <div className="w-16 h-16 border border-[#e0ddd4] rounded-full flex items-center justify-center mb-6 bg-[#fafaf7] text-neutral-400">
                  <ShoppingBag size={26} />
                </div>
                <div className="heading-font text-xl font-bold text-[#1A1A1A] mb-2">
                  {dict.cartDrawer.emptyTitle}
                </div>
                <p className="text-[13px] text-[#888] max-w-[240px] leading-relaxed">
                  {dict.cartDrawer.emptyDesc}
                </p>
                <Link
                  href={`/${locale}/shop`}
                  onClick={() => setIsOpen(false)}
                  className="mt-8 btn-blue px-8 py-3 text-[12px] font-bold rounded-xl inline-block"
                >
                  {dict.cartDrawer.browseShop}
                </Link>
              </div>
            ) : (
              <>
                {/* Free Shipping Progress Indicator */}
                <div className="px-5 sm:px-7 pt-4 pb-3 border-b border-[#eeece5] bg-[#fafaf7]">
                  <div className="flex justify-between items-end mb-1.5 text-[12px] font-semibold text-[#1A1A1A]">
                    <span>
                      {subtotal >= 800 
                        ? dict.cartDrawer.freeShippingUnlocked 
                        : dict.cartDrawer.freeShippingRemaining.replace('{amount}', formatMAD(800 - subtotal))}
                    </span>
                    <span className="text-[11px] text-[#0ea5e9] font-bold">
                      {Math.min(Math.round((subtotal / 800) * 100), 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#e5e5e0] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-sky-400 to-[#0ea5e9] h-full transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${Math.min((subtotal / 800) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 divide-y divide-[#eeece5]">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex gap-4 py-4 first:pt-1 last:pb-1"
                    >
                      <Link
                        href={`/${locale}/product/${item.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="w-20 h-24 bg-white rounded-2xl overflow-hidden shrink-0 relative border border-[#E8E2D6] flex items-center justify-center group shadow-2xs"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-contain scale-120 group-hover:scale-125 transition-transform duration-300 mix-blend-multiply"
                        />
                      </Link>

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <Link
                              href={`/${locale}/product/${item.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="heading-font text-[14px] sm:text-[15px] font-bold text-[#1A1A1A] hover:text-[#0ea5e9] truncate transition-colors"
                            >
                              {item.name}
                            </Link>
                            <span className="font-bold text-[#1A1A1A] text-[13px] sm:text-[14px] whitespace-nowrap">
                              {formatMAD(item.price * item.quantity)}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#888] mt-0.5">
                            {item.size} · Eau de Parfum
                          </div>
                          <div className="text-[11px] text-[#0ea5e9] font-medium mt-0.5">
                            {formatMAD(item.price)} / unité
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity stepper */}
                          <div className="flex items-center border border-[#e0ddd4] rounded-lg bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                              className="w-9 h-9 flex items-center justify-center text-[#666] hover:text-[#1A1A1A] active:bg-[#fafaf7] active:scale-95 transition"
                              aria-label={dict.cartDrawer.decrease}
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-[#1A1A1A]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                              className="w-9 h-9 flex items-center justify-center text-[#666] hover:text-[#1A1A1A] active:bg-[#fafaf7] active:scale-95 transition"
                              aria-label={dict.cartDrawer.increase}
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id, item.size)}
                            className="text-[#aaa] hover:text-red-500 p-2 rounded-md hover:bg-red-50 active:scale-95 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                            aria-label={dict.cartDrawer.remove}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-[#e0ddd4] p-4 sm:p-6 bg-[#fafaf7] space-y-2.5 sm:space-y-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  {appliedPromo && promoDiscount > 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-neutral-900">{dict.cartDrawer.promoCode} ({appliedPromo.code})</div>
                          <div className="text-[10px] text-emerald-600">{dict.cartDrawer.discountApplied}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-emerald-600">-{formatMAD(promoDiscount)}</div>
                    </div>
                  ) : !appliedPromo && appliedDeal && dealDiscount > 0 ? (
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-[#0ea5e9] shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-neutral-900">{appliedDeal.badgeText || appliedDeal.title}</div>
                          <div className="text-[10px] text-neutral-500">{dict.cartDrawer.autoDealApplied}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-[#0ea5e9]">-{formatMAD(dealDiscount)}</div>
                    </div>
                  ) : null}

                  {!appliedPromo && <FreeGiftSelector compact />}

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-[#888]">
                        {dict.cartDrawer.subtotal}
                      </span>
                      <span className={`text-[15px] font-bold ${effectiveDiscount > 0 ? 'line-through text-neutral-400' : 'text-[#1A1A1A]'}`}>
                        {formatMAD(subtotal)}
                      </span>
                    </div>

                    {effectiveDiscount > 0 && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600">
                          {dict.cartDrawer.totalWithDiscount}
                        </span>
                        <span className="text-xl font-bold text-emerald-700">
                          {formatMAD(totalAfterDiscount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Primary: Express Checkout Button */}
                  <Link
                    href={`/${locale}/checkout`}
                    onClick={() => setIsOpen(false)}
                    className="btn-blue w-full h-12 text-[14px] font-bold rounded-xl inline-flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.99] transition"
                  >
                    <span>{expressCheckoutText}</span>
                    <ArrowRight size={16} />
                  </Link>

                  {/* Secondary: Continue Shopping Button */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full h-11 text-[13px] font-bold rounded-xl border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition active:scale-[0.99]"
                  >
                    {continueShoppingText}
                  </button>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#888]">
                    <Link
                      href={`/${locale}/cart`}
                      onClick={() => setIsOpen(false)}
                      className="hover:text-[#0ea5e9] underline"
                    >
                      {viewFullCartText}
                    </Link>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <ShieldCheck size={13} />
                      <span>{shippingFee === 0 ? dict.cartDrawer.freeShippingText : dict.cartDrawer.shippingNotice.replace('{fee}', String(shippingFee))}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
