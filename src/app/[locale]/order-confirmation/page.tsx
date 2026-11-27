'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, usePathname } from 'next/navigation';
import Script from 'next/script';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PerfumeBottleIcon, CodCashIcon } from '@/components/icons/MaisonIcons';
import { formatMAD } from '@/lib/products';
import {
  Check,
  Truck,
  Package,
  Home,
  Copy,
  Mail,
  Phone,
  MapPin,
  Printer,
  ClipboardCheck,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  ShoppingBag,
} from 'lucide-react';

function InstagramVectorIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

type OrderConfirmation = {
  orderNumber: string;
  invoiceToken?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode?: string;
  paymentMethod: 'cod';
  items: Array<{
    id: number;
    slug: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    size: string;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
};

function OrderConfirmationInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const rawLocale = pathname?.split('/')[1] || 'fr';
  const locale = (['fr', 'en', 'ar'].includes(rawLocale) ? rawLocale : 'fr') as 'fr' | 'en' | 'ar';
  const orderNumber = searchParams.get('order');
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [copied, setCopied] = useState(false);
  const [recordedAtLabel, setRecordedAtLabel] = useState("Aujourd'hui");
  const [deliveryLabel, setDeliveryLabel] = useState('Sous 24 à 48h ouvrées');

  useEffect(() => {
    const now = new Date();
    setRecordedAtLabel(
      `Aujourd'hui, ${now.toLocaleTimeString('fr-MA', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    );

    const est = new Date(now);
    est.setDate(est.getDate() + 3);
    setDeliveryLabel(
      est.toLocaleDateString('fr-MA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    );

    const saved = localStorage.getItem('nouamaneLastOrder');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!orderNumber || parsed?.orderNumber === orderNumber) {
          setOrder(parsed);
        } else {
          setOrder(null);
        }
      } catch {
        setOrder(null);
      }
    }
  }, [orderNumber]);

  const displayOrderNumber = order?.orderNumber || orderNumber || '';

  const handleCopyOrder = () => {
    if (displayOrderNumber) {
      navigator.clipboard.writeText(displayOrderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Used client-side when order & email are present for Google Customer Reviews
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

  const whatsappTrackHref = `https://api.whatsapp.com/send?phone=212663380011&text=${encodeURIComponent(
    displayOrderNumber
      ? `Bonjour NAY Parfums, je viens de valider ma commande ${displayOrderNumber}.`
      : 'Bonjour NAY Parfums, j’ai une question concernant ma commande.'
  )}`;

  const firstName = order?.customerName?.trim().split(/\s+/)[0] || '';
  const totalUnits = order?.items?.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0) || 0;

  return (
    <div className="bg-[#fafaf7] text-[#111827] min-h-screen w-full max-w-full overflow-x-clip">
      <Header />

      <main className="pt-28 sm:pt-32 lg:pt-36 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* ========== 1. ASYMMETRIC EDITORIAL HERO & ACTION TICKET ========== */}
          <div className="pb-8 sm:pb-10 mb-8 sm:mb-10 border-b border-[#e5e0d6] flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="min-w-0 max-w-2xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e3ded3] text-[10px] font-bold tracking-[0.2em] uppercase text-[#0284c7] shadow-2xs whitespace-nowrap">
                <PerfumeBottleIcon size={13} className="text-[#0284c7] shrink-0" />
                <span>Commande confirmée</span>
              </span>

              <h1 className="heading-font text-3xl sm:text-5xl lg:text-[52px] font-extrabold mt-4 tracking-tight leading-[1.06] text-[#0f172a]">
                Merci{firstName ? `, ${firstName}` : ''} !
              </h1>

              <p className="mt-3.5 text-[14.5px] sm:text-[15.5px] text-[#5f5a52] leading-relaxed max-w-xl">
                {order?.customerEmail?.trim()
                  ? `Votre sélection est enregistrée. Un récapitulatif est associé à ${order.customerEmail} et notre équipe vous contactera sur WhatsApp ou par appel avant la remise.`
                  : 'Votre sélection est enregistrée dans notre Atelier. Notre équipe vous contactera par téléphone ou WhatsApp pour confirmer votre créneau de livraison.'}
              </p>
            </div>

            {/* Interactive Reference & Official Print Ticket */}
            {displayOrderNumber && (
              <div className="w-full lg:w-[390px] bg-white border border-[#ded8cc] rounded-2xl p-4 sm:p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.08)] shrink-0">
                <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#efece4]">
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#736d65] block">
                      Référence commande
                    </span>
                    <span
                      className="mt-0.5 block font-mono text-[14px] sm:text-[15px] font-extrabold text-[#0f172a] truncate"
                      dir="ltr"
                    >
                      {displayOrderNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyOrder}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
                      copied
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-[#e3ded3] bg-[#faf8f4] text-[#0f172a] hover:border-[#0284c7] hover:text-[#0284c7]'
                    }`}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>

                <div className="pt-3.5 grid grid-cols-2 gap-2.5">
                  {order?.invoiceToken && order.invoiceToken !== 'DEMO-TOKEN' ? (
                    <a
                      href={`/${locale}/invoice/${encodeURIComponent(displayOrderNumber)}?token=${encodeURIComponent(order.invoiceToken)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-3 rounded-xl bg-[#0f172a] hover:bg-[#0284c7] text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Printer size={14} className="shrink-0" />
                      <span>Facture PDF</span>
                    </a>
                  ) : /^NF-/i.test(displayOrderNumber) ? (
                    <a
                      href={`/${locale}/invoice/${encodeURIComponent(displayOrderNumber)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-3 rounded-xl bg-[#0f172a] hover:bg-[#0284c7] text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Printer size={14} className="shrink-0" />
                      <span>Facture PDF</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="h-10 px-3 rounded-xl bg-[#0f172a] hover:bg-[#0284c7] text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Printer size={14} className="shrink-0" />
                      <span>Facture PDF</span>
                    </button>
                  )}

                  <Link
                    href={`/${locale}/suivi-commande?order=${encodeURIComponent(displayOrderNumber)}`}
                    className="h-10 px-3 rounded-xl bg-[#faf8f4] hover:bg-[#efece4] text-[#0f172a] border border-[#ded8cc] text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Search size={13} className="shrink-0" />
                    <span>Suivi live</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ========== 2. TWO-COLUMN ATELIER WORKSPACE ========== */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)] gap-6 lg:gap-8 items-stretch">
            {/* LEFT COLUMN: TRACKING TIMELINE, LOGISTICS & COMMUNITY */}
            <div className="space-y-6 min-w-0">
              {/* SUIVI DE VOTRE COMMANDE (ONLY ANIMATED MODULE ON PAGE) */}
              <section className="bg-white border border-[#e0ddd4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(15,23,42,0.03)]">
                <div className="flex items-start sm:items-center justify-between gap-3 mb-7 flex-wrap">
                  <div>
                    <h2 className="heading-font text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5 text-[#0f172a]">
                      <Truck size={20} className="text-[#0284c7] shrink-0" />
                      <span>Suivi de votre commande</span>
                    </h2>
                    <p className="text-[12px] text-[#64748b] mt-1">
                      Estimation de remise : <strong className="text-[#0f172a] font-semibold">{deliveryLabel}</strong>
                    </p>
                  </div>

                  {order?.shippingCity && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0284c7] bg-sky-50 border border-sky-100 px-3 py-1 rounded-full shrink-0">
                      <MapPin size={12} />
                      <span>Vers {order.shippingCity}</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  {/* Base Track Line */}
                  <div className="absolute left-[17px] top-5 bottom-6 w-[2px] bg-[#ece8df]" />
                  {/* Clean Progress Segment (Step 1 -> Step 2) */}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: 'top center' }}
                    className="absolute left-[17px] top-5 h-[96px] w-[2px] bg-[#0f172a]"
                  />

                  <TimelineStep
                    index={0}
                    icon={<ClipboardCheck size={15} strokeWidth={2} />}
                    title="Commande enregistrée"
                    subtitle={recordedAtLabel}
                    completed
                  />
                  <TimelineStep
                    index={1}
                    icon={<Package size={15} />}
                    title="Préparation du colis"
                    subtitle="Contrôle qualité & emballage protecteur sous 24h"
                    active
                  />
                  <TimelineStep
                    index={2}
                    icon={<Truck size={15} />}
                    title="En livraison"
                    subtitle={
                      order?.shippingCity
                        ? `Acheminement express vers ${order.shippingCity}`
                        : 'Livraison express partout au Maroc'
                    }
                  />
                  <TimelineStep
                    index={3}
                    icon={<Home size={15} />}
                    title="Livrée"
                    subtitle={`Remise en mains propres · ${deliveryLabel}`}
                    isLast
                  />
                </div>
              </section>

              {/* DELIVERY & PAYMENT ASSURANCE BENTO */}
              {order && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-white border border-[#e0ddd4] rounded-2xl p-6 shadow-[0_2px_14px_rgba(15,23,42,0.025)]">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#736d65] mb-3.5 flex items-center gap-2">
                      <MapPin size={13} className="text-[#0284c7]" />
                      <span>Destination & Contact</span>
                    </div>
                    <div className="text-[14px] text-[#0f172a] leading-relaxed">
                      <div className="font-bold text-[15px]">{order.customerName}</div>
                      <div className="text-[#475569] mt-1">{order.shippingAddress}</div>
                      <div className="text-[#475569]">
                        {order.shippingCity}
                        {order.shippingPostalCode ? `, ${order.shippingPostalCode}` : ''}
                      </div>
                      <div className="mt-4 pt-3.5 border-t border-[#f0ede6] space-y-1.5 text-[12.5px] text-[#5f5a52]">
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-[#0284c7] shrink-0" />
                          <span dir="ltr">{order.customerPhone}</span>
                        </div>
                        {order.customerEmail?.trim() && (
                          <div className="flex items-center gap-2 break-all">
                            <Mail size={13} className="text-[#0284c7] shrink-0" />
                            <span>{order.customerEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e0ddd4] rounded-2xl p-6 shadow-[0_2px_14px_rgba(15,23,42,0.025)] flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#736d65] mb-3.5 flex items-center gap-2">
                        <CodCashIcon size={14} className="text-[#0284c7]" />
                        <span>Règlement à la remise</span>
                      </div>
                      <div className="text-[15px] font-bold text-[#0f172a]">
                        Paiement à la livraison (COD)
                      </div>
                      <p className="text-[13px] text-[#5f5a52] mt-1.5 leading-relaxed">
                        Montant à préparer en espèces pour le livreur :{' '}
                        <strong className="text-[#0f172a] tabular-nums">{formatMAD(order.total)}</strong>.
                      </p>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-[#faf8f4] border border-[#ebe6dc] flex items-start gap-2.5 text-[11.5px] text-[#334155]">
                      <ShieldCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        Ouverture & vérification du flacon autorisées devant le livreur avant paiement.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* VIP COMMUNITY & CONCIERGE POST-PURCHASE SECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-[#0f172a] text-white rounded-2xl p-6 flex flex-col justify-between shadow-[0_14px_34px_-12px_rgba(15,23,42,0.35)] border border-[#1e293b]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#38bdf8] mb-2.5">
                      <InstagramVectorIcon size={14} />
                      <span>Privilège · @nayparfums</span>
                    </div>
                    <h3 className="heading-font text-[19px] font-bold text-white leading-snug">
                      Partagez votre coffret en story
                    </h3>
                    <p className="mt-2 text-[12.5px] text-slate-300 leading-relaxed">
                      Identifiez <strong className="text-white">@nayparfums</strong> à la réception de votre
                      parfum pour recevoir une attention exclusive sur votre prochaine commande.
                    </p>
                  </div>

                  <a
                    href="https://www.instagram.com/nayparfums/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 w-full h-11 px-4 rounded-xl bg-white hover:bg-[#38bdf8] text-[#0f172a] hover:text-white font-bold text-[11.5px] uppercase tracking-[0.12em] flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <InstagramVectorIcon size={15} />
                      <span>Suivre @nayparfums</span>
                    </span>
                    <ArrowRight size={15} />
                  </a>
                </div>

                <div className="bg-white border border-[#e0ddd4] rounded-2xl p-6 flex flex-col justify-between shadow-[0_2px_14px_rgba(15,23,42,0.025)]">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0284c7] mb-2.5">
                      <MessageCircle size={14} />
                      <span>Conciergerie Express · 7j/7</span>
                    </div>
                    <h3 className="heading-font text-[19px] font-bold text-[#0f172a] leading-snug">
                      Ajuster votre passage ?
                    </h3>
                    <p className="mt-2 text-[12.5px] text-[#5f5a52] leading-relaxed">
                      Modifiez votre adresse ou confirmez un créneau horaire en 1 message WhatsApp avec
                      votre référence déjà pré-remplie.
                    </p>
                  </div>

                  <a
                    href={whatsappTrackHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 w-full h-11 px-4 rounded-xl bg-[#faf8f4] hover:bg-[#0f172a] text-[#0f172a] hover:text-white border border-[#ded8cc] hover:border-[#0f172a] font-bold text-[11.5px] uppercase tracking-[0.12em] flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle size={15} className="text-emerald-600" />
                      <span>Écrire sur WhatsApp</span>
                    </span>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: STICKY PERFORATED ATELIER BORDEREAU RECEIPT */}
            <aside className="min-w-0 w-full lg:self-stretch">
              <div className="lg:sticky lg:top-28 bg-white border border-[#ded8cc] rounded-3xl overflow-hidden shadow-[0_14px_40px_-14px_rgba(15,23,42,0.1)]">
                {/* Dark Obsidian Receipt Header */}
                <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#38bdf8] block">
                      Récapitulatif officiel
                    </span>
                    <h2 className="heading-font text-[17px] font-bold tracking-wide text-white mt-0.5 truncate">
                      Votre Bordereau Atelier
                    </h2>
                  </div>
                  {order && (
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10.5px] font-bold text-slate-200 tabular-nums shrink-0">
                      {totalUnits} {totalUnits > 1 ? 'articles' : 'article'}
                    </span>
                  )}
                </div>

                {order ? (
                  <>
                    {/* Ordered Fragrances */}
                    <div className="px-6 py-2 divide-y divide-[#efece4] max-h-[340px] overflow-y-auto">
                      {order.items.map((item) => (
                        <div
                          key={`${item.id}-${item.size}`}
                          className="flex items-center gap-3.5 py-4 min-w-0"
                        >
                          <div className="relative w-14 h-16 bg-white rounded-xl border border-[#ece8df] overflow-hidden shrink-0 flex items-center justify-center p-1">
                            <Image
                              src={item.image || '/placeholder.jpg'}
                              alt={item.name}
                              fill
                              sizes="56px"
                              className="object-contain scale-110 mix-blend-multiply"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-bold text-[#0f172a] truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mt-0.5">
                              {item.size || '100ml'} · Qté {item.quantity}
                            </div>
                          </div>
                          <div className="text-[13.5px] font-extrabold text-[#0f172a] tabular-nums shrink-0" dir="ltr">
                            {formatMAD(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ticket Perforation Divider */}
                    <div className="relative px-6 py-3 flex items-center">
                      <span className="absolute -left-3 w-6 h-6 rounded-full bg-[#fafaf7] border-r border-[#ded8cc]" />
                      <div className="w-full border-t-2 border-dashed border-[#e5e0d6]" />
                      <span className="absolute -right-3 w-6 h-6 rounded-full bg-[#fafaf7] border-l border-[#ded8cc]" />
                    </div>

                    {/* Receipt Totals & Continue Shopping */}
                    <div className="px-6 pb-6 pt-2 space-y-2.5">
                      <SummaryRow label="Sous-total" value={formatMAD(order.subtotal)} />
                      <SummaryRow
                        label="Livraison Express"
                        value={order.shippingCost === 0 ? 'Offerte (0 MAD)' : formatMAD(order.shippingCost)}
                        green={order.shippingCost === 0}
                      />
                      <SummaryRow label="Total à la remise" value={formatMAD(order.total)} bold />

                      <div className="pt-4">
                        <Link
                          href={`/${locale}/shop`}
                          className="w-full h-12 px-5 rounded-xl bg-[#faf8f4] hover:bg-[#0f172a] text-[#0f172a] hover:text-white border border-[#ded8cc] hover:border-[#0f172a] text-[12.5px] font-bold tracking-wide flex items-center justify-center gap-2 transition-colors"
                        >
                          <ShoppingBag size={15} />
                          <span>Continuer mes achats</span>
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#f4f8fc] border border-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                        <ShoppingBag size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-[#0f172a]">
                          Commande enregistrée
                        </p>
                        <p className="text-[12.5px] text-[#5f5a52] mt-1 leading-relaxed">
                          Utilisez votre numéro de commande pour suivre votre colis en direct ou consulter votre facture officielle.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      {displayOrderNumber && (
                        <Link
                          href={`/${locale}/suivi-commande?order=${encodeURIComponent(displayOrderNumber)}`}
                          className="w-full h-11 px-4 rounded-xl bg-[#0f172a] hover:bg-[#0284c7] text-white text-[12.5px] font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Search size={14} />
                          <span>Suivre {displayOrderNumber}</span>
                        </Link>
                      )}
                      <Link
                        href={`/${locale}/shop`}
                        className="w-full h-11 px-4 rounded-xl bg-[#faf8f4] hover:bg-[#efece4] text-[#0f172a] border border-[#ded8cc] text-[12.5px] font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <ShoppingBag size={14} />
                        <span>Retour à la boutique</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* ========== GOOGLE CUSTOMER REVIEWS (ONLY WHEN EMAIL IS PROVIDED) ========== */}
      {order && order.customerEmail?.trim() && (
        <>
          <Script
            id="gcr-optin-code"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.renderOptIn = function() {
                  if (window.gapi && window.gapi.load) {
                    window.gapi.load('surveyoptin', function() {
                      window.gapi.surveyoptin.render({
                        "merchant_id": 5828480552,
                        "order_id": "${order.orderNumber}",
                        "email": "${order.customerEmail}",
                        "delivery_country": "MA",
                        "estimated_delivery_date": "${estimatedDelivery.toISOString().split('T')[0]}",
                        "products": [${order.items.map(item => `{"gtin":"${item.id}"}`).join(',')}]
                      });
                    });
                  }
                }
              `,
            }}
          />
          <Script src="https://apis.google.com/js/platform.js?onload=renderOptIn" strategy="afterInteractive" />
        </>
      )}

      <Footer />
    </div>
  );
}

function TimelineStep({
  index = 0,
  icon,
  title,
  subtitle,
  active,
  completed,
  isLast,
}: {
  index?: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active?: boolean;
  completed?: boolean;
  isLast?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06, ease: 'easeOut' }}
      className={`flex gap-4 relative ${isLast ? '' : 'pb-8'}`}
    >
      <div className="relative flex-shrink-0 z-10 w-9 h-9">
        <div
          className={`relative w-9 h-9 rounded-full flex items-center justify-center border-2 ${
            completed
              ? 'bg-[#0f172a] border-[#0f172a] text-white'
              : active
              ? 'bg-[#0284c7] border-[#0284c7] text-white'
              : 'bg-white border border-[#ded8cc] text-[#94a3b8]'
          }`}
        >
          {icon}
        </div>
      </div>
      <div className="pt-1 min-w-0 flex-1">
        <div
          className={`text-[14.5px] font-bold flex items-center gap-2 flex-wrap ${
            active || completed ? 'text-[#0f172a]' : 'text-[#94a3b8]'
          }`}
        >
          <span>{title}</span>
          {active && (
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-wider text-[#0284c7] bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-full">
              <motion.span
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"
              />
              <span>En cours</span>
            </span>
          )}
        </div>
        <div className="text-[12.5px] text-[#64748b] mt-0.5 leading-snug">{subtitle}</div>
      </div>
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  green,
}: {
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-baseline gap-2 ${
        bold ? 'pt-3.5 mt-1 border-t border-[#efece4]' : ''
      }`}
    >
      <span
        className={`${
          bold
            ? 'text-[10.5px] font-bold tracking-[0.18em] uppercase text-[#64748b]'
            : 'text-[13.5px] text-[#5f5a52]'
        }`}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${
          bold
            ? 'heading-font text-2xl font-extrabold text-[#0f172a]'
            : green
            ? 'text-[13.5px] text-emerald-600 font-bold'
            : 'text-[13.5px] text-[#0f172a] font-bold'
        }`}
        dir="ltr"
      >
        {value}
      </span>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fafaf7]">
          <div className="text-[#736d65] text-sm tracking-widest">Chargement…</div>
        </div>
      }
    >
      <OrderConfirmationInner />
    </Suspense>
  );
}
