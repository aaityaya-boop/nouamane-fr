'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Check,
  Copy,
  ExternalLink
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
      return generateQrCodeSvg(trackingScannableUrl, 120);
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

  const isCOD = !order.paymentMethod || order.paymentMethod === 'cod';

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 py-6 px-3 sm:px-6 font-sans print:bg-white print:p-0 print:m-0 print:min-h-0">
      {/* 🖨️ Print CSS to guarantee 1-page A4 print */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* 🎛️ TOP ACTIONS (HIDDEN ON PRINT) */}
      <div className="max-w-3xl mx-auto mb-4 print:hidden flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Boutique</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copied ? 'Lien copié' : 'Partager'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Printer size={14} />
            <span>Imprimer / Sauvegarder PDF</span>
          </button>
        </div>
      </div>

      {/* 📜 SIMPLE & CREATIVE 1-PAGE INVOICE */}
      <div className="invoice-sheet max-w-3xl mx-auto bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8 text-slate-800">
        {/* HEADER */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-200">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 shrink-0">
              <Image
                src="/images/nay/nay-emblem.png"
                alt="NAY Emblem"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="relative w-24 h-7">
                <Image
                  src="/images/nay/nay-wordmark.png"
                  alt="NAY"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
              <p className="text-[10px] tracking-widest text-[#1D9BF0] font-bold uppercase mt-0.5">
                Parfums de Luxe
              </p>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="text-right">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">FACTURE</h1>
            <p className="text-xs font-mono font-bold text-[#1D9BF0] mt-0.5">
              N° {order.orderNumber}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Date : {formattedDate}
            </p>
          </div>
        </div>

        {/* 2-COLUMN INFO: VENDEUR & CLIENT */}
        <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-100 text-xs">
          {/* Vendeur */}
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Vendeur
            </p>
            <p className="font-bold text-slate-900">NAY Parfums</p>
            <p className="text-slate-600">Casablanca, Maroc</p>
            <p className="text-slate-600">WhatsApp : +212 663-380011</p>
            <p className="text-slate-500">contact@nayparfum.ma</p>
          </div>

          {/* Client */}
          <div className="text-right space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Client & Livraison
            </p>
            <p className="font-bold text-slate-900">{order.customerName}</p>
            <p className="text-slate-600">{order.shippingAddress}</p>
            <p className="text-slate-600">
              {order.shippingCity}{order.shippingPostalCode ? `, ${order.shippingPostalCode}` : ''}
            </p>
            <p className="text-slate-600 font-mono">{order.customerPhone}</p>
            {order.customerEmail && <p className="text-slate-500">{order.customerEmail}</p>}
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="py-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2">Désignation</th>
                <th className="py-2 text-center">Format</th>
                <th className="py-2 text-center">Qté</th>
                <th className="py-2 text-right">Prix Unitaire</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className="text-slate-800">
                  <td className="py-2.5 pr-2">
                    <p className="font-semibold text-slate-900 leading-tight">{item.name}</p>
                    {item.sku && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Réf: {item.sku}</p>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-500 text-[11px] whitespace-nowrap">
                    {item.size || '100ml'}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900 whitespace-nowrap">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600 font-mono whitespace-nowrap">
                    {formatMAD(item.price)}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                    {formatMAD(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL SUMMARY & COMPACT QR */}
        <div className="pt-3 border-t border-slate-200 flex flex-row justify-between items-start gap-4">
          {/* Left: Payment Mode & Scannable/Clickable Vector QR */}
          <div className="flex items-center gap-3">
            <a
              href={trackingPath}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-sky-50/60 hover:border-[#1D9BF0]/40 transition-all cursor-pointer no-underline text-inherit"
              title="Scanner ou cliquer pour suivre votre commande"
            >
              <div
                className="w-13 h-13 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="text-[11px] space-y-0.5 pr-1">
                <div className="inline-flex items-center gap-1 font-bold text-slate-800 group-hover:text-[#1D9BF0] transition-colors">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>{isCOD ? 'Paiement à la livraison' : 'Paiement sécurisé par carte'}</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                  <span>📱 Scannez pour suivre le colis</span>
                  <ExternalLink size={10} className="text-slate-400 group-hover:text-[#1D9BF0] transition-colors print:hidden shrink-0" />
                </div>
                <p className="text-[9px] text-slate-400">
                  Accès sécurisé par N° de téléphone
                </p>
              </div>
            </a>
          </div>

          {/* Right: Totals */}
          <div className="w-56 space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span className="font-mono text-slate-800">{formatMAD(order.subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Frais de livraison</span>
              <span className="font-mono text-slate-800">
                {order.shippingCost === 0 ? (
                  <span className="text-emerald-600 font-semibold">Gratuite</span>
                ) : (
                  formatMAD(order.shippingCost)
                )}
              </span>
            </div>

            {order.discount && order.discount > 0 ? (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Remise {order.promoCode ? `(${order.promoCode})` : ''}</span>
                <span className="font-mono">-{formatMAD(order.discount)}</span>
              </div>
            ) : null}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900 font-bold">
              <span className="text-xs uppercase tracking-wide">Total à payer</span>
              <span className="text-base text-[#1D9BF0] font-mono font-extrabold">
                {formatMAD(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* SIMPLE 1-LINE FOOTER */}
        <div className="mt-5 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>Merci pour votre commande ! NAY Parfums • www.nayparfum.ma</span>
          <span>WhatsApp : +212 663-380011</span>
        </div>
      </div>
    </div>
  );
}
