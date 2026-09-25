'use client';

/**
 * CartDrawer — Lightweight side drawer.
 * Triggered by CustomEvent('openCart'). Redirects to full /cart page for checkout.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { formatMAD } from '@/lib/products';
import FreeGiftSelector from '@/components/FreeGiftSelector';

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, removeFromCart, updateQuantity, getSubtotal, shippingFee, appliedDeal, dealDiscount } = useCart();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const subtotal = getSubtotal();
  const totalAfterDiscount = Math.max(0, subtotal - dealDiscount);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('openCart', handler);
    return () => window.removeEventListener('openCart', handler);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full max-w-md bg-white border border-[#e0ddd4] h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-8 py-7 border-b border-[#e0ddd4]">
          <h2 className="heading-font text-2xl tracking-wider text-[#1A1A1A]">
            Votre Panier
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors"
            aria-label="Fermer"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
            <div className="w-20 h-20 border border-[#e0ddd4] rounded-full flex items-center justify-center mb-8">
              <span className="text-3xl">✦</span>
            </div>
            <div className="heading-font text-2xl text-[#1A1A1A] mb-3">
              Votre panier est vide
            </div>
            <p className="text-[13px] text-[#9A9A9A] max-w-[240px] leading-relaxed">
              Découvrez notre collection exclusive de parfums de niche
              marocains.
            </p>
            <Link
              href={`/${locale}/shop`}
              onClick={() => setIsOpen(false)}
              className="mt-10 btn-outline-blue px-10 py-4 text-[11px] rounded-full inline-block"
            >
              Voir la boutique
            </Link>
          </div>
        ) : (
          <>
            <div className="px-8 pt-6 pb-2 border-b border-[#eeece5] bg-[#fafaf7]">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[12px] font-semibold text-[#1A1A1A]">
                  {getSubtotal() >= 800 
                    ? 'Félicitations ! Livraison gratuite débloquée 🎉' 
                    : `Plus que ${formatMAD(800 - getSubtotal())} pour la livraison gratuite`}
                </span>
              </div>
              <div className="w-full bg-[#eeece5] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0ea5e9] h-full transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${Math.min((getSubtotal() / 800) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="flex gap-5 pb-6 border-b border-[#eeece5] last:border-0"
                >
                  <Link
                    href={`/${locale}/product/${item.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="w-24 h-28 bg-transparent rounded-xl overflow-hidden flex-shrink-0 relative"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div>
                        <Link
                          href={`/${locale}/product/${item.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="heading-font text-lg text-[#1A1A1A] tracking-wide hover:text-[#0ea5e9]"
                        >
                          {item.name}
                        </Link>
                        <div className="text-[11px] font-medium tracking-[0.1em] text-[#9A9A9A] mt-0.5">
                          {item.size} · Eau de Parfum
                        </div>
                      </div>
                      <div className="text-right font-semibold text-[#1A1A1A] text-sm">
                        {formatMAD(item.price * item.quantity)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-[#e0ddd4] rounded-full">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.size, item.quantity - 1)
                          }
                          className="w-9 h-9 flex items-center justify-center text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <div className="px-4 text-sm font-mono text-[#1A1A1A]">
                          {item.quantity}
                        </div>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.size, item.quantity + 1)
                          }
                          className="w-9 h-9 flex items-center justify-center text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="text-[#D4D4D4] hover:text-red-400 transition-colors"
                        aria-label="Retirer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#e0ddd4] p-6 bg-[#fafaf7] space-y-3">
              {appliedDeal && dealDiscount > 0 && (
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎉</span>
                    <div>
                      <div className="text-xs font-bold text-neutral-900">{appliedDeal.badgeText || appliedDeal.title}</div>
                      <div className="text-[10px] text-neutral-500">Offre automatique appliquée</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-[#0ea5e9]">-{formatMAD(dealDiscount)}</div>
                </div>
              )}

              <FreeGiftSelector compact />

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A]">
                    Sous-total
                  </span>
                  <span className={`text-sm ${dealDiscount > 0 ? 'line-through text-neutral-400' : 'heading-font font-medium text-[#1A1A1A]'}`}>
                    {formatMAD(subtotal)}
                  </span>
                </div>

                {dealDiscount > 0 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-600">
                      Total avec remise
                    </span>
                    <span className="text-2xl heading-font font-medium text-emerald-700">
                      {formatMAD(totalAfterDiscount)}
                    </span>
                  </div>
                )}
              </div>

              <Link
                href={`/${locale}/cart`}
                onClick={() => setIsOpen(false)}
                className="btn-blue w-full py-3.5 text-[11px] rounded-full inline-block text-center"
              >
                Voir le panier & Commander
              </Link>

              <p className="text-center text-[10px] tracking-[0.2em] text-[#C5C5C5] uppercase">
                {shippingFee === 0 ? 'Livraison Gratuite ! 🎉' : `Livraison partout au Maroc avec ${shippingFee}Dh`}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
