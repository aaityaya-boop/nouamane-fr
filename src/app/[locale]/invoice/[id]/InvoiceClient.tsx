'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  Check,
  Copy,
  FileText
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { generateQrCodeSvg } from '@/lib/qrCodeSvg';

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
    month: '2-digit',
    year: 'numeric'
  });

  const invoiceUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://nayparfum.ma/invoice/${order.orderNumber}`;

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const trackingPath = `/fr/suivi-commande?order=${order.orderNumber}`;
  const trackingScannableUrl = (!isLocalhost && typeof window !== 'undefined')
    ? `${window.location.origin}${trackingPath}`
    : `https://nayparfum.ma${trackingPath}`;

  const qrSvg = React.useMemo(() => {
    try {
      return generateQrCodeSvg(trackingScannableUrl, 110);
    } catch {
      return '';
    }
  }, [trackingScannableUrl]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(invoiceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCOD = !order.paymentMethod || order.paymentMethod === 'cod' || String(order.paymentMethod).toLowerCase().includes('livraison');
  const isPaid = order.status === 'delivered' || (!isCOD && order.status !== 'cancelled' && order.status !== 'refused');

  const totalAmount = Number(order.total) || 0;
  const subtotalAmount = Number(order.subtotal) || totalAmount;
  const shippingCost = Number(order.shippingCost) || 0;
  const discountAmount = Number(order.discount) || 0;

  return (
    <div className="bg-slate-200/75 min-h-screen text-slate-900 py-6 sm:py-10 px-3 sm:px-6 font-sans print:bg-white print:p-0 print:m-0 print:min-h-0 flex flex-col items-center">
      {/* 🖨️ Exact A4 Portrait Print Stylesheet (210mm x 297mm) */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          *, *:before, *:after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .no-print,
          .print\:hidden,
          [class*="print:hidden"],
          button,
          iframe,
          [class*="fixed"],
          [class*="bottom-"],
          #merchantwidget,
          #gcr-badge,
          .gcr-badge {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          .invoice-a4-sheet {
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            padding: 14mm 16mm 12mm 16mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
        }
      `}</style>

      {/* 🎛️ TOP CONTROL BAR (HIDDEN ON PRINT) */}
      <div className="w-full max-w-[210mm] mb-5 no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300/80 shadow-2xs text-xs font-semibold transition-all"
          >
            <ArrowLeft size={14} />
            <span>Retour à la Boutique</span>
          </Link>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-100/70 border border-sky-200 text-[#0284c7] text-[11px] font-semibold">
            <FileText size={13} className="text-[#1D9BF0]" />
            <span>Format A4 standard (210 × 297 mm)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white border border-slate-300/80 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
            title="Copier le lien public de cette facture"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Lien copié !' : 'Partager'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#1D9BF0] hover:bg-[#1A8CD8] active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-sky-500/20"
            title="Imprimer ou enregistrer en PDF au format A4"
          >
            <Printer size={15} />
            <span>Imprimer / Sauvegarder PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* 📜 OFFICIAL A4 INVOICE SHEET (210mm x 297mm) */}
      <div className="invoice-a4-sheet w-full max-w-[210mm] md:w-[210mm] min-h-[auto] md:min-h-[297mm] bg-white shadow-2xl shadow-slate-400/25 border border-slate-200/90 rounded-[2px] p-6 sm:p-10 md:p-12 flex flex-col justify-between text-slate-800">
        
        {/* UPPER PORTION */}
        <div>
          {/* 1. BRAND HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-slate-900">
            {/* Brand Identity - Single Official Logo */}
            <div className="flex flex-col items-start">
              <div className="h-10 flex items-center">
                <Image
                  src="/images/nay/nay-logo-tight.png"
                  alt="NAY Parfums"
                  width={128}
                  height={53}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-slate-600">
                  Parfumerie en Ligne • Partout au Maroc
                </p>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Testeurs Authentiques de Grandes Marques • 100% Digital
                </p>
              </div>
            </div>

            {/* Document Title & Meta Box */}
            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className="inline-flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  FACTURE
                </h1>
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  EXEMPLAIRE CLIENT
                </span>
              </div>
              
              <div className="mt-1.5 space-y-0.5 text-xs">
                <p className="font-mono font-bold text-[#1D9BF0] text-sm">
                  N° {order.orderNumber}
                </p>
                <p className="text-slate-600">
                  Date : <span className="font-semibold text-slate-800">{formattedDate}</span>
                </p>
                <div className="pt-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isCOD
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}
                  >
                    <span>
                      {isPaid
                        ? 'Facture Réglée'
                        : isCOD
                        ? 'Règlement à la livraison'
                        : 'En attente'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. VENDEUR & CLIENT BLOCKS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-b border-slate-200 text-xs">
            {/* Vendeur */}
            <div className="bg-slate-50/70 rounded-lg p-3.5 border border-slate-100 space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                <span>Boutique Vendeur</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">NAY Parfums</p>
              <p className="text-slate-700 font-medium">Boutique en ligne • Partout au Maroc</p>
              <p className="text-slate-700 font-mono">
                Tél : <span className="font-bold text-slate-900">+212 663-380011</span>
              </p>
              <p className="text-slate-500">contact@nayparfum.ma</p>
              <p className="text-slate-500">www.nayparfum.ma</p>
            </div>

            {/* Client / Destinataire */}
            <div className="bg-slate-50/70 rounded-lg p-3.5 border border-slate-100 space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                <span>Facturé & Livré à</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{order.customerName || 'Client NAY'}</p>
              <p className="text-slate-700 font-medium">{order.shippingAddress || 'Adresse communiquée'}</p>
              <p className="text-slate-700">
                {order.shippingCity || 'Maroc'}
                {order.shippingPostalCode ? `, CP: ${order.shippingPostalCode}` : ''}
              </p>
              <p className="text-slate-700 font-mono">
                Tél : <span className="font-bold text-slate-900">{order.customerPhone || 'N/A'}</span>
              </p>
              {order.customerEmail ? (
                <p className="text-slate-500">{order.customerEmail}</p>
              ) : (
                <p className="text-slate-400 italic">Email : Non renseigné</p>
              )}
            </div>
          </div>

          {/* 3. PRODUCTS TABLE */}
          <div className="py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-y border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-2.5 px-3">Désignation de l'article</th>
                    <th className="py-2.5 px-2 text-center">Format</th>
                    <th className="py-2.5 px-2 text-center">Quantité</th>
                    <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                          {item.brand && <span>{item.brand}</span>}
                          {item.concentration && <span>• {item.concentration}</span>}
                          {item.sku && <span>• Réf: {item.sku}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600 font-medium text-xs whitespace-nowrap">
                        {item.size || '100ml'}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-900 text-xs whitespace-nowrap">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-mono whitespace-nowrap">
                        {formatMAD(item.price)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                        {formatMAD(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                        Aucun article spécifié dans cette commande
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* LOWER PORTION: SUMMARY & FOOTER (PINNED TO A4 BOTTOM) */}
        <div className="mt-4 pt-3 border-t-2 border-slate-200">
          {/* Financial Breakdown & QR Tracking Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            
            {/* Left Box: Scannable Vector QR & Conditions */}
            <div className="space-y-3">
              <a
                href={trackingPath}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50/60 hover:border-[#1D9BF0]/40 transition-all cursor-pointer no-underline text-inherit"
                title="Scanner ou cliquer pour suivre l'acheminement de la commande"
              >
                <div
                  className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <div className="text-xs space-y-0.5 pr-1">
                  <div className="font-bold text-slate-900 group-hover:text-[#1D9BF0] transition-colors">
                    <span>Suivi en direct du colis</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Scannez pour suivre l'acheminement et la livraison en temps réel.
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Accès instantané par smartphone
                  </p>
                </div>
              </a>

              {/* Guarantees & Payment details */}
              <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                  <span>Garantie Authenticité & Qualité</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  • Testeurs de grandes marques 100% authentiques garantis par NAY Parfums.
                </p>
                <p className="text-[10px] text-slate-500">
                  • Mode de règlement :{' '}
                  <span className="font-semibold text-slate-700">
                    {isCOD ? 'Espèces à la livraison (Cash on Delivery)' : 'Paiement sécurisé par carte'}
                  </span>
                </p>
                <p className="text-[10px] text-slate-500">
                  • Livraison rapide partout au Maroc sous 24h à 48h ouvrées.
                </p>
              </div>
            </div>

            {/* Right Box: Clean Totals Card */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total</span>
                <span className="font-mono font-medium text-slate-800">{formatMAD(subtotalAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Frais de livraison</span>
                <span className="font-mono text-slate-800">
                  {shippingCost === 0 ? (
                    <span className="text-emerald-600 font-bold">Gratuite (Offerte)</span>
                  ) : (
                    formatMAD(shippingCost)
                  )}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Remise Promo {order.promoCode ? `(${order.promoCode})` : ''}</span>
                  <span className="font-mono">-{formatMAD(discountAmount)}</span>
                </div>
              )}

              <div className="pt-2.5 mt-1 border-t-2 border-slate-900 flex justify-between items-baseline">
                <div>
                  <span className="text-xs uppercase font-black tracking-wider text-slate-900 block">
                    TOTAL À PAYER
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Montant net en Dirhams marocains
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black font-mono text-[#1D9BF0]">
                  {formatMAD(totalAmount)}
                </span>
              </div>
            </div>

          </div>

          {/* 4. BRAND FOOTER (A4 STANDARD LETTERHEAD) */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left font-medium text-slate-600">
              <span>NAY Parfums — Testeurs de Parfums de Grandes Marques • Boutique 100% Digitale</span>
              <span>Livraison partout au Maroc • WhatsApp : +212 663-380011</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left text-slate-400 text-[9px]">
              <span>Merci pour votre commande et votre confiance !</span>
              <span>Document justificatif d'achat • www.nayparfum.ma</span>
            </div>

            <div className="pt-1 text-center text-slate-400 text-[9px] flex items-center justify-between">
              <span>contact@nayparfum.ma</span>
              <span className="font-mono">Page 1 / 1</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
