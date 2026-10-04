'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Printer,
  Download,
  ArrowLeft,
  Share2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Clock,
  Package,
  FileText,
  BadgeCheck,
  Award,
  Check,
  Copy,
  Receipt,
  Truck,
  HeartHandshake
} from 'lucide-react';
import { formatMAD } from '@/lib/products';

interface OrderItem {
  id?: string | number;
  name: string;
  size?: string;
  price: number;
  quantity: number;
  sku?: string;
  image?: string;
  concentration?: string;
  brand?: string;
}

export default function InvoiceClient({ order }: { order: any }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Delay slightly to ensure images & fonts are fully loaded before print dialog
    const timer = setTimeout(() => {
      // Check if user came with ?autoPrint=1 or default
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('print') === '1') {
          window.print();
        }
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const items: OrderItem[] = Array.isArray(order.items)
    ? order.items
    : (() => {
        try {
          return JSON.parse(order.items || '[]');
        } catch {
          return [];
        }
      })();

  const formattedDate = new Date(order.createdAt).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const invoiceUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `https://nayparfum.ma/invoice/${order.orderNumber}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=0f172a&data=${encodeURIComponent(invoiceUrl)}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(invoiceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isCOD = !order.paymentMethod || order.paymentMethod === 'cod';

  return (
    <div className="bg-slate-100/70 min-h-screen text-slate-900 py-6 sm:py-12 px-3 sm:px-6 font-sans antialiased print:bg-white print:p-0 print:m-0">
      {/* 🎛️ TOP INTERACTIVE ACTIONS TOOLBAR (SCREEN ONLY) */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Boutique</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">
                Facture Commande #{order.orderNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copier le lien direct de la facture"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Lien copié !' : 'Partager'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-[#1D9BF0] hover:from-slate-900 hover:to-sky-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer size={16} />
              <span>Imprimer / Sauvegarder PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📜 LUXURY INVOICE SHEET (A4 PROPORTIONS) */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-200/90 rounded-3xl shadow-xl p-6 sm:p-12 relative overflow-hidden print:border-none print:shadow-none print:rounded-none print:p-8 print:max-w-full">
        {/* Subtle Watermark Emblem in Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.025] select-none">
          <div className="relative w-[500px] h-[500px]">
            <Image
              src="/images/nay/nay-emblem.png"
              alt="NAY Emblem Watermark"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* 👑 HEADER: BRANDING & INVOICE METADATA */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b-2 border-slate-900">
          {/* Brand Identity with User's Emblem & Wordmark */}
          <div className="space-y-3">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 p-1 rounded-2xl bg-white border border-sky-100 shadow-2xs">
                <Image
                  src="/images/nay/nay-emblem.png"
                  alt="Emblème NAY Parfums"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>

              <div>
                <div className="relative w-28 h-9 sm:w-32 sm:h-10">
                  <Image
                    src="/images/nay/nay-wordmark.png"
                    alt="NAY Parfums"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
                <p className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-bold text-[#1D9BF0] mt-0.5">
                  MAISON DE HAUTE PARFUMERIE • MAROC
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-light max-w-sm leading-relaxed">
              Créations olfactives d'exception, testeurs certifiés et parfums de prestige.
            </p>
          </div>

          {/* Official Invoice Badge & Details */}
          <div className="text-left md:text-right space-y-2 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-widest shadow-2xs">
              <Receipt size={13} className="text-[#1D9BF0]" />
              <span>FACTURE OFFICIELLE</span>
            </div>

            <div className="space-y-1">
              <div className="text-base sm:text-lg font-extrabold font-mono text-slate-900 tracking-wider">
                N° {order.orderNumber}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Date d'émission : <strong className="text-slate-900">{formattedDate}</strong>
              </div>
            </div>

            {/* Payment Method Badge */}
            <div className="pt-1">
              {isCOD ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                  <Truck size={13} className="text-amber-600" />
                  <span>Règlement : À la livraison (Espèces)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Règlement : Acquitté en ligne (Carte Bancaire)</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 🏢 BENTO CARDS: ÉMETTEUR VS CLIENT FACTURÉ */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-8">
          {/* Émetteur (Maison NAY Parfums) */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1D9BF0]">
              <Sparkles size={14} />
              <span>ÉMETTEUR & MAISON</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="font-extrabold text-sm text-slate-900">
                Maison NAY Parfums SARL
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={13} className="text-slate-400 shrink-0" />
                <span>Atelier & Distribution : Casablanca, Maroc</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span>Conciergerie VIP : +212 663-380011</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span>Email officiel : contact@nayparfum.ma</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Globe size={13} className="text-slate-400 shrink-0" />
                <span>Boutique en ligne : www.nayparfum.ma</span>
              </div>
            </div>
          </div>

          {/* Client (Facturé à) */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Package size={14} className="text-[#1D9BF0]" />
              <span>FACTURÉ À (CLIENT DESTINATAIRE)</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>{order.customerName || 'Client NAY'}</span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  Client Vérifié
                </span>
              </div>
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p>{order.shippingAddress || 'Adresse sur demande'}</p>
                  <p className="font-semibold text-slate-800">
                    {order.shippingCity}
                    {order.shippingPostalCode ? `, ${order.shippingPostalCode}` : ''} • Maroc
                  </p>
                </div>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="font-mono">{order.customerPhone}</span>
                </div>
              )}
              {order.customerEmail && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span>{order.customerEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🛍️ TABLEAU DES ARTICLES & FRAGRANCES COMMANDÉES */}
        <div className="relative z-10 mb-8 rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Désignation & Fragrance</th>
                <th className="py-3.5 px-4 text-center">Format / Réf</th>
                <th className="py-3.5 px-4 text-center">Qté</th>
                <th className="py-3.5 px-4 text-right">Prix Unitaire</th>
                <th className="py-3.5 px-4 text-right">Total Ligne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  {/* Designation */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900 leading-tight">
                        {item.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        {item.brand && (
                          <span className="font-semibold text-[#1D9BF0]">{item.brand}</span>
                        )}
                        {item.concentration && (
                          <>
                            <span>•</span>
                            <span>{item.concentration}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Format & Sku */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <div className="space-y-0.5">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {item.size || '100ml'}
                      </span>
                      {item.sku && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.sku}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Quantité */}
                  <td className="py-4 px-4 text-center font-bold text-slate-900 text-sm whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-800">
                      {item.quantity}
                    </span>
                  </td>

                  {/* Prix Unitaire */}
                  <td className="py-4 px-4 text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                    {formatMAD(item.price)}
                  </td>

                  {/* Total Ligne */}
                  <td className="py-4 px-4 text-right font-extrabold text-slate-900 font-mono text-sm whitespace-nowrap">
                    {formatMAD(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 💰 VENTILATION FINANCIÈRE & SCEAU D'AUTHENTICITÉ */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-10">
          {/* Sceau d'Authenticité & QR Code Sécurisé */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/50 via-white to-amber-50/30 border border-sky-100 flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 bg-white p-1 rounded-xl border border-sky-200 shadow-2xs">
                {/* Embedded QR Code image pointing to invoice */}
                <Image
                  src={qrCodeUrl}
                  alt="QR Code Vérification"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-[11px]">
                  <BadgeCheck size={15} className="text-[#1D9BF0]" />
                  <span>VÉRIFICATION D'AUTHENTICITÉ</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug font-light">
                  Scannez ce QR Code pour vérifier l'authenticité de votre commande et accéder au suivi en temps réel sur <strong>nayparfum.ma</strong>.
                </p>
              </div>
            </div>

            {/* Quality Guarantee Seal */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 text-[11px]">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <span>Garantie 100% flacons d'origine • Emballage sécurisé anti-choc • Flacon sous scellé.</span>
            </div>
          </div>

          {/* Calcul du Total & Règlements */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/90 space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Sous-total des articles</span>
                <span className="font-mono font-semibold text-slate-800">{formatMAD(order.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Frais de livraison</span>
                  <span className="text-[10px] text-slate-400 font-light">(Express Maroc)</span>
                </div>
                <span className="font-mono font-semibold text-slate-800">
                  {order.shippingCost === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-[10px]">Offerte</span>
                  ) : (
                    formatMAD(order.shippingCost)
                  )}
                </span>
              </div>

              {order.discount && order.discount > 0 ? (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Remise accordée {order.promoCode ? `(${order.promoCode})` : ''}</span>
                  <span className="font-mono font-bold">-{formatMAD(order.discount)}</span>
                </div>
              ) : null}
            </div>

            {/* Total Highlighted Box */}
            <div className="pt-3 border-t border-slate-200">
              <div className="bg-slate-950 text-white rounded-xl p-4 flex items-center justify-between shadow-md">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-sky-400">
                    TOTAL NET À PAYER (TTC)
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Toutes taxes comprises • En Dirhams
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                  {formatMAD(order.total)}
                </div>
              </div>
            </div>

            {/* Payment terms footnote */}
            <div className="text-[10px] text-slate-500 text-right pt-1">
              Mode convenu : {isCOD ? 'Espèces à la remise du colis' : 'Paiement déjà validé par carte'}
            </div>
          </div>
        </div>

        {/* 📜 SIGNATURE, TAMPON OFFICIEL & REMERCIEMENTS */}
        <div className="relative z-10 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          {/* Recommandations de conservation */}
          <div className="space-y-1 max-w-md text-left">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
              <Sparkles size={13} className="text-[#1D9BF0]" />
              <span>Conservation de votre fragrance</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              « Pour préserver toute la richesse olfactive de vos essences précieuses, conservez vos flacons à l'abri de la lumière directe, de l'humidité et des variations excessives de température. »
            </p>
          </div>

          {/* Tampon & Cachet Officiel NAY */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#1D9BF0]/40 flex flex-col items-center justify-center text-center p-1 transform rotate-[-8deg] bg-sky-50/20 select-none">
              <span className="text-[8px] font-black uppercase text-[#1D9BF0] tracking-tighter">NAY PARFUMS</span>
              <span className="text-[7px] font-bold text-slate-600 uppercase">CONTRÔLÉ</span>
              <span className="text-[6px] text-slate-400 font-mono">CASABLANCA</span>
              <BadgeCheck size={11} className="text-[#1D9BF0] mt-0.5" />
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Service Expéditions & Qualité
              </div>
              <div className="font-serif italic font-bold text-slate-800 text-sm mt-0.5">
                Direction NAY Parfums
              </div>
              <div className="text-[9px] text-slate-400">
                Cachet électronique certifié
              </div>
            </div>
          </div>
        </div>

        {/* 💖 FOOTER COURTESY NOTE */}
        <div className="relative z-10 mt-8 pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-1">
          <p className="font-medium text-slate-600">
            Merci pour votre confiance. Maison NAY Parfums vous souhaite une expérience sensorielle inoubliable.
          </p>
          <p className="text-[10px] text-slate-400">
            Pour toute question concernant cette facture ou votre commande, notre conciergerie est disponible au <strong>+212 663-380011</strong> ou sur <strong>contact@nayparfum.ma</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
