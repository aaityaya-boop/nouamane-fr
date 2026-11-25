'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ArrowRight, Truck, AlertCircle } from 'lucide-react';
import { MaisonDiamondIcon } from '@/components/icons/MaisonIcons';
import { formatMAD, isProductInStock, type Product } from '@/lib/products';
import { getProductEditionInfo } from '@/lib/productEdition';

type QuickBuyModalProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
};

const FREE_SHIPPING_THRESHOLD = 800;
const STANDARD_SHIPPING_FEE = 35;

/** Broadcasts overlay state so floating widgets (WhatsApp / AI Assistant) stay hidden while QuickBuy is open. */
function setFloatingWidgetsHidden(hidden: boolean) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __nayOverlayCount?: number };
  const current = w.__nayOverlayCount ?? 0;
  const next = hidden ? current + 1 : Math.max(0, current - 1);
  w.__nayOverlayCount = next;
  document.body.dataset.hideFloatingWidgets = next > 0 ? 'true' : 'false';
  window.dispatchEvent(
    new CustomEvent('nay-floating-widgets-toggle', { detail: { hidden: next > 0 } })
  );
}

/** Formats up to 3 authentic top/heart/base olfactory notes as refined editorial accord prose. */
function getEditorialAccord(product: Product, isAr: boolean): string {
  if (!product.notes) return '';
  const raw = [
    product.notes.top?.[0],
    product.notes.heart?.[0],
    product.notes.base?.[0],
  ].filter((n): n is string => Boolean(n && n.trim()));
  const unique = Array.from(new Set(raw)).slice(0, 3);
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return isAr ? `${unique[0]} و ${unique[1]}` : `${unique[0]} & ${unique[1]}`;
  return isAr
    ? `${unique[0]}، ${unique[1]} و ${unique[2]}`
    : `${unique[0]}, ${unique[1]} & ${unique[2]}`;
}

export default function QuickBuyModal({ product, isOpen, onClose }: QuickBuyModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const rawLocale = pathname?.split('/')[1] || 'fr';
  const locale = (['fr', 'en', 'ar'].includes(rawLocale) ? rawLocale : 'fr') as 'fr' | 'en' | 'ar';
  const isAr = locale === 'ar';
  const isEn = locale === 'en';
  const tr = (fr: string, en: string, ar: string) => (isAr ? ar : isEn ? en : fr);

  const [mounted, setMounted] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedSizeIndex(0);
    setQuantity(1);
    setIsSubmitting(false);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setFloatingWidgetsHidden(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      setFloatingWidgetsHidden(false);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!mounted || !product) return null;

  const inStock = isProductInStock(product);
  const edition = getProductEditionInfo(product, locale);
  const accordText = getEditorialAccord(product, isAr);

  const availableSizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : [{ label: '100ml', ml: 100, price: product.price }];

  const currentSize = availableSizes[selectedSizeIndex] || availableSizes[0];
  const unitPrice = currentSize.price || product.price;
  const totalPrice = unitPrice * quantity;
  const maxStock =
    typeof product.stock === 'number' && product.stock > 0 ? Math.min(product.stock, 10) : 10;
  const lowStock =
    typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5;

  const isDiscounted =
    Boolean(product.originalPrice) && Number(product.originalPrice) > Number(unitPrice);
  const unitSavings =
    isDiscounted && product.originalPrice
      ? Math.max(0, Math.round(product.originalPrice - unitPrice))
      : 0;
  const totalProductSavings = unitSavings * quantity;
  const discountPct =
    isDiscounted && product.originalPrice
      ? Math.round(((product.originalPrice - unitPrice) / product.originalPrice) * 100)
      : 0;

  const minQtyForFreeShipping = unitPrice > 0 ? Math.ceil(FREE_SHIPPING_THRESHOLD / unitPrice) : 3;
  const isFreeShippingUnlocked = totalPrice >= FREE_SHIPPING_THRESHOLD;
  const ledgerQuantities = [1, 2, 3].filter((q) => q <= maxStock);

  const handleBuyNow = () => {
    if (!inStock || isSubmitting) return;
    setIsSubmitting(true);

    const query = new URLSearchParams({
      buyNow: '1',
      slug: product.slug,
      qty: String(quantity),
      size: currentSize.label,
    });

    onClose();
    router.push(`/${locale}/checkout?${query.toString()}`);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-buy-title"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Quiet Warm Charcoal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#121210]/58 backdrop-blur-[3px]"
          />

          {/* Handcrafted Maison Order Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-[432px] bg-[#fdfcf9] rounded-[18px] sm:rounded-[20px] shadow-[0_28px_64px_-18px_rgba(17,17,15,0.42)] border border-[#e3ded3] overflow-hidden flex flex-col max-h-[calc(100dvh-7.25rem)] sm:max-h-[90vh]"
          >
            {/* 1. Maison Masthead Header */}
            <div className="px-4 sm:px-5 py-3 border-b border-[#ebe6dc] flex items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-2 min-w-0">
                <MaisonDiamondIcon size={10} className="text-[#111827] shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#111827] truncate">
                  {tr('NAY · HAUTE PARFUMERIE', 'NAY · FINE FRAGRANCE', 'ناي · دار العطور')}
                </span>
                {lowStock ? (
                  <span className="text-[10px] font-semibold text-amber-800 shrink-0">
                    · {tr(`${product.stock} flacons restants`, `${product.stock} left`, `${product.stock} متبقية`)}
                  </span>
                ) : (
                  <span className="hidden xs:inline text-[10px] text-[#736d65] shrink-0">
                    · {tr('Expédié 24/48h', 'Ships 24/48h', 'شحن 24/48س')}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-lg text-[#736d65] hover:text-[#111827] hover:bg-[#f4f1ea] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                aria-label={tr('Fermer', 'Close', 'إغلاق')}
              >
                <X size={15} strokeWidth={1.9} />
              </button>
            </div>

            {/* 2. Scrollable Body */}
            <div className="overflow-y-auto flex-1">
              {/* Flacon & Editorial Typography Showcase */}
              <div className="px-4 sm:px-5 py-4 bg-white border-b border-[#ebe6dc] flex items-center gap-4 min-w-0">
                <div className="relative w-22 h-26 sm:w-24 sm:h-28 shrink-0 bg-white flex items-center justify-center">
                  <Image
                    src={product.images?.[0] || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    sizes="96px"
                    className="object-contain scale-105 mix-blend-multiply"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-[#736d65]">
                    <span className="truncate">
                      {product.brandLabel || product.brand} · {edition.shortLabel}
                    </span>
                    {product.rating > 0 && (
                      <span className="shrink-0 tabular-nums text-[#111827]">
                        {Number(product.rating).toFixed(1)}/5
                      </span>
                    )}
                  </div>

                  <h3
                    id="quick-buy-title"
                    className="mt-1 font-display-modern text-[17px] sm:text-[18.5px] font-bold text-[#111827] tracking-[-0.015em] leading-[1.24] line-clamp-2"
                  >
                    {product.name}
                  </h3>

                  {accordText && (
                    <p className="mt-1 text-[11.5px] italic text-[#5f5a52] leading-snug line-clamp-1">
                      {accordText}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
                    <span
                      className="text-[19px] sm:text-[21px] font-extrabold text-[#111827] tracking-[-0.02em] tabular-nums leading-none"
                      dir="ltr"
                    >
                      {formatMAD(unitPrice)}
                    </span>
                    {isDiscounted && product.originalPrice && (
                      <span className="text-[12px] text-[#9c958b] line-through tabular-nums" dir="ltr">
                        {formatMAD(product.originalPrice)}
                      </span>
                    )}
                    {unitSavings > 0 && (
                      <span
                        className="text-[11px] font-bold text-emerald-700 tabular-nums"
                        dir="ltr"
                      >
                        -{formatMAD(unitSavings)} ({discountPct}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Multi-Volume Choice (if product offers multiple sizes) */}
              {availableSizes.length > 1 && (
                <div className="px-4 sm:px-5 pt-3.5 flex items-center gap-2 flex-wrap">
                  {availableSizes.map((s, idx) => {
                    const active = selectedSizeIndex === idx;
                    return (
                      <button
                        key={`${s.label}-${idx}`}
                        type="button"
                        onClick={() => setSelectedSizeIndex(idx)}
                        className={`px-3.5 py-1.5 rounded-lg border text-[11.5px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          active
                            ? 'border-[#111827] bg-[#111827] text-white'
                            : 'border-[#ded8cc] bg-white text-[#3f3c37] hover:border-[#111827]'
                        }`}
                      >
                        <span>{s.label}</span>
                        <span className={`tabular-nums ${active ? 'text-white/75' : 'text-[#736d65]'}`}>
                          {formatMAD(s.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. Curated Maison Formula Ledger */}
              <div className="px-4 sm:px-5 pt-3.5 pb-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5f5a52]">
                    {tr('Choisissez votre formule', 'Select your option', 'اختر عرضك')} · {currentSize.label}
                  </span>

                  {/* Subtle Fine Stepper */}
                  <div className="inline-flex items-center border border-[#ded8cc] bg-white rounded-lg overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-7 h-6 flex items-center justify-center text-[#111827] hover:bg-[#f4f1ea] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      aria-label={tr('Diminuer la quantité', 'Decrease quantity', 'إنقاص الكمية')}
                    >
                      <Minus size={11} strokeWidth={2.2} />
                    </button>
                    <span className="px-2 text-[11.5px] font-bold text-[#111827] tabular-nums border-x border-[#ebe6dc]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                      disabled={quantity >= maxStock}
                      className="w-7 h-6 flex items-center justify-center text-[#111827] hover:bg-[#f4f1ea] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      aria-label={tr('Augmenter la quantité', 'Increase quantity', 'زيادة الكمية')}
                    >
                      <Plus size={11} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>

                {/* Hairline Divided Ledger Rows with Direct Value & Savings Anchor */}
                <div className="bg-white border border-[#ded8cc] rounded-xl overflow-hidden divide-y divide-[#eeeae0]">
                  {ledgerQuantities.map((q) => {
                    const active = quantity === q;
                    const rowTotal = unitPrice * q;
                    const rowSavings = unitSavings * q;
                    const unlocksFree = q === minQtyForFreeShipping && minQtyForFreeShipping > 1;
                    const alreadyFreeHere = q === 1 && minQtyForFreeShipping === 1;

                    const label =
                      q === 1
                        ? tr('1 Flacon · Pour soi', '1 Bottle · Personal', 'قنينة واحدة · لك')
                        : q === 2
                        ? tr('2 Flacons · Duo à offrir', '2 Bottles · Gift Duo', 'قنينتان · ثنائي هدية')
                        : tr('3 Flacons · Coffret Atelier', '3 Bottles · Atelier Set', '3 قنينات · مجموعة الدار');

                    const note = unlocksFree
                      ? tr(
                          `Livraison offerte (${STANDARD_SHIPPING_FEE} MAD économisés)`,
                          `Free delivery included (save ${STANDARD_SHIPPING_FEE} MAD)`,
                          `توصيل مجاني مشمول (توفير ${STANDARD_SHIPPING_FEE} د)`
                        )
                      : alreadyFreeHere
                      ? tr('Livraison 0 DH incluse', 'Free delivery included', 'توصيل مجاني مشمول')
                      : q === 2
                      ? tr('Gardez-en un, offrez le second', 'Keep one, gift the second', 'احتفظ بواحدة وأهدِ الثانية')
                      : tr('Ouvrez & vérifiez avant de payer', 'Open & verify before paying', 'افتح وتأكد قبل الدفع');

                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuantity(q)}
                        className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-start transition-colors cursor-pointer ${
                          active ? 'bg-[#f6f3ec]' : 'bg-white hover:bg-[#faf8f4]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className={`mt-1 w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              active ? 'border-[#111827]' : 'border-[#c6bfb2]'
                            }`}
                          >
                            {active && <span className="w-2 h-2 rounded-full bg-[#111827]" />}
                          </span>

                          <div className="min-w-0">
                            <div className="text-[12.5px] font-bold text-[#111827] leading-snug">
                              {label}
                            </div>
                            <div
                              className={`text-[10.5px] leading-snug ${
                                unlocksFree || alreadyFreeHere
                                  ? 'text-emerald-700 font-semibold'
                                  : 'text-[#736d65]'
                              }`}
                            >
                              {note}
                            </div>
                          </div>
                        </div>

                        <div className="text-end shrink-0 tabular-nums" dir="ltr">
                          <div className="text-[13px] font-extrabold text-[#111827] leading-tight">
                            {formatMAD(rowTotal)}
                          </div>
                          {rowSavings > 0 && (
                            <div className="text-[10px] font-bold text-emerald-700 leading-tight mt-0.5">
                              -{formatMAD(rowSavings)}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Single-Sentence Risk Reversal + Dispatch */}
                <p className="text-[11px] text-[#5f5a52] leading-snug px-0.5">
                  <strong className="font-semibold text-[#111827]">
                    {tr('Zéro risque :', 'Zero risk:', 'بدون مخاطرة :')}
                  </strong>{' '}
                  {tr(
                    'Départ aujourd’hui · Vous testez le colis devant le livreur avant de régler.',
                    'Dispatched today · Inspect your fragrance before paying a dirham.',
                    'شحن اليوم · افحص العطر أمام الموزع قبل دفع أي درهم.'
                  )}
                </p>

                {/* Tailored CTA: "Commander maintenant!" + Shipping Truck Icon + Green Savings */}
                <div className="space-y-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!inStock || isSubmitting}
                    className={`group w-full min-h-[54px] py-2 px-3.5 sm:px-4 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      inStock
                        ? 'bg-[#111827] hover:bg-[#0284c7] text-[#fdfcf9]'
                        : 'bg-[#ebe6dc] text-[#8a8379] cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="w-full flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-[12.5px] font-bold">
                          {tr('Préparation...', 'Preparing...', 'جارٍ التجهيز...')}
                        </span>
                      </div>
                    ) : inStock ? (
                      <>
                        <span className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          <Truck size={17} strokeWidth={1.85} className="text-white/90 shrink-0" />
                          <span className="text-[12.5px] sm:text-[13.5px] font-bold tracking-wide truncate">
                            {tr('Commander maintenant!', 'Order Now!', 'اطلب الآن!')}
                          </span>
                        </span>

                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-end tabular-nums leading-tight" dir="ltr">
                            <span className="block text-[13px] sm:text-[14px] font-extrabold text-white">
                              {formatMAD(totalPrice)}
                            </span>
                            {totalProductSavings > 0 && (
                              <span className="block text-[10.5px] font-extrabold text-emerald-400">
                                -{formatMAD(totalProductSavings)}
                              </span>
                            )}
                          </span>
                          <ArrowRight
                            size={16}
                            strokeWidth={2}
                            className="group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180 transition-transform shrink-0"
                          />
                        </span>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase">
                        <AlertCircle size={15} />
                        <span>{tr('Rupture de stock', 'Out of stock', 'غير متوفر حالياً')}</span>
                      </div>
                    )}
                  </button>

                  {/* Transparent Delivery & Product Sheet Link */}
                  <div className="flex items-center justify-between gap-2 px-0.5 text-[10.5px] text-[#736d65]">
                    <span>
                      {isFreeShippingUnlocked
                        ? tr(
                            'Livraison 0 MAD incluse · Paiement à la réception',
                            'Free delivery included · Cash on delivery',
                            'توصيل مجاني · الدفع عند الاستلام'
                          )
                        : tr(
                            'Livraison +35 MAD (offerte dès 800 MAD)',
                            'Delivery +35 MAD (free from 800 MAD)',
                            'التوصيل 35 د (مجاني من 800 د)'
                          )}
                    </span>
                    <Link
                      href={`/${locale}/product/${product.slug}`}
                      onClick={onClose}
                      className="font-semibold text-[#111827] hover:text-[#0284c7] underline underline-offset-4 decoration-[#cfc8ba] hover:decoration-[#0284c7] transition-colors shrink-0"
                    >
                      {tr('Fiche détaillée →', 'Full details →', '← التفاصيل')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
