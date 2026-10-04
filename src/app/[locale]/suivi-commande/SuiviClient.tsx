'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  FileText,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  HelpCircle
} from 'lucide-react';
import { formatMAD } from '@/lib/products';

interface SuiviClientProps {
  initialOrderNumber?: string;
  initialOrder?: any;
}

export default function SuiviClient({
  initialOrderNumber = '',
  initialOrder = null
}: SuiviClientProps) {
  const searchParams = useSearchParams();
  const urlOrder = searchParams?.get('order') || searchParams?.get('orderNumber') || searchParams?.get('id') || '';
  const effectiveInitialOrder = initialOrderNumber || urlOrder || '';

  const [orderNumber, setOrderNumber] = useState(effectiveInitialOrder);
  const [phoneInput, setPhoneInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<any>(initialOrder);

  useEffect(() => {
    if (urlOrder && !orderNumber) {
      setOrderNumber(urlOrder);
    }
  }, [urlOrder, orderNumber]);

  // Check sessionStorage for previous verification
  useEffect(() => {
    const targetOrder = (orderNumber || urlOrder || initialOrderNumber || '').trim().toUpperCase();
    if (targetOrder && typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`tracking_verified_${targetOrder}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.orderNumber) {
            setVerifiedOrder(parsed);
          }
        } catch {}
      }
    }
  }, [orderNumber, urlOrder, initialOrderNumber]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrder = (orderNumber || urlOrder || initialOrderNumber || '').trim();
    if (!targetOrder) {
      setErrorMsg('Veuillez renseigner votre numéro de commande.');
      return;
    }
    if (!phoneInput.trim()) {
      setErrorMsg('Veuillez saisir votre numéro de téléphone.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders/verify-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: targetOrder,
          phone: phoneInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Numéro de téléphone incorrect pour cette commande.');
      }

      setVerifiedOrder(data.order);
      // Cache verification in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `tracking_verified_${data.order.orderNumber.toUpperCase()}`,
          JSON.stringify(data.order)
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la vérification');
    } finally {
      setIsVerifying(false);
    }
  };

  // Determine active step from order status
  const getTrackingStep = (status?: string): number => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'livré' || s === 'livree') return 5;
    if (s === 'shipped' || s === 'expédié' || s === 'expediee' || s === 'in_transit') return 4;
    if (s === 'preparing' || s === 'en préparation' || s === 'prepared') return 3;
    if (s === 'confirmed' || s === 'confirmée' || s === 'confirmee') return 2;
    return 2; // Default confirmed
  };

  const activeStep = verifiedOrder ? getTrackingStep(verifiedOrder.status) : 2;

  const isCOD = !verifiedOrder?.paymentMethod || verifiedOrder?.paymentMethod === 'cod';

  const whatsappMessage = verifiedOrder
    ? encodeURIComponent(
        `Bonjour NAY Parfums, je vous écris concernant le suivi de ma commande #${verifiedOrder.orderNumber} (au nom de ${verifiedOrder.customerName}).`
      )
    : encodeURIComponent('Bonjour NAY Parfums, je souhaite suivre ma commande.');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src="/images/nay/nay-emblem.png"
                alt="NAY"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="relative w-24 h-7">
              <Image
                src="/images/nay/nay-wordmark.png"
                alt="NAY Parfums"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#1D9BF0]">
            Suivi de Commande en Direct
          </p>
        </div>

        {/* 🔒 STATE 1: PHONE VERIFICATION GATE (IF NOT VERIFIED) */}
        {!verifiedOrder ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 border border-sky-100 text-[#1D9BF0] flex items-center justify-center">
                <ShieldCheck size={28} />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Vérification de Sécurité Client
              </h1>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Pour protéger la confidentialité de votre commande et accéder au suivi en direct de votre colis,
                veuillez confirmer votre numéro de téléphone utilisé lors de votre achat.
              </p>
            </div>

            {orderNumber && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-500">Numéro de Commande :</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {orderNumber}
                </span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              {!orderNumber && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    N° de Commande <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="ex: NF-MUR4E9OH-518"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-900 focus:outline-hidden font-mono uppercase"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Votre Numéro de Téléphone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="06 12 34 56 78 (ou +212...)"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1D9BF0] focus:outline-hidden font-mono tracking-wide"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Numéro marocain renseigné lors de la commande (ex: 0694... ou 07...)
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 rounded-xl bg-[#1D9BF0] hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Vérification en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Déverrouiller le Suivi de mon Colis</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <a
                href={`https://wa.me/212663380011?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5"
              >
                <Phone size={13} className="text-emerald-500" />
                <span>Besoin d'aide ? Contactez notre conciergerie WhatsApp : +212 663-380011</span>
              </a>
            </div>
          </div>
        ) : (
          /* 📦 STATE 2: LIVE TRACKING DASHBOARD (UNLOCKED) */
          <div className="space-y-6 animate-fadeIn">
            {/* Tracking Hero Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Suivi Actif
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    Commande #{verifiedOrder.orderNumber}
                  </h2>
                </div>

                <Link
                  href={`/invoice/${verifiedOrder.orderNumber}`}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <FileText size={14} />
                  <span>Voir la Facture</span>
                </Link>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#1D9BF0]">
                    Statut Actuel
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    {activeStep >= 5
                      ? 'Colis Livré & Réceptionné 🎉'
                      : activeStep === 4
                      ? 'En Cours d’Acheminement & Livraison 🚚'
                      : activeStep === 3
                      ? 'Colis Préparé & Remis au Transporteur'
                      : 'Commande Confirmée & Validée'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Destination : <strong className="text-slate-800">{verifiedOrder.shippingCity}</strong>
                  </div>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-white border border-sky-200 flex items-center justify-center text-[#1D9BF0] shadow-2xs shrink-0">
                  <Truck size={24} />
                </div>
              </div>

              {/* 5-Step Visual Timeline Stepper */}
              <div className="py-2 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Progression de la livraison
                </div>

                <div className="space-y-3">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">1. Commande Validée</div>
                      <div className="text-[11px] text-slate-500">
                        Votre commande a été confirmée par notre service client NAY Parfums.
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      activeStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-[#1D9BF0] text-white animate-pulse'
                    }`}>
                      {activeStep >= 3 ? '✓' : '2'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">2. Préparation & Emballage Soigné</div>
                      <div className="text-[11px] text-slate-500">
                        Flacons contrôlés et emballés sous protection anti-choc dans notre atelier.
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      activeStep >= 4 ? 'bg-emerald-500 text-white' : activeStep === 3 ? 'bg-[#1D9BF0] text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {activeStep >= 4 ? '✓' : '3'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">3. Expédition & Prise en Charge</div>
                      <div className="text-[11px] text-slate-500">
                        Prise en charge par le transporteur (Amana Express / Flotte NAY Parfums).
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      activeStep >= 5 ? 'bg-emerald-500 text-white' : activeStep === 4 ? 'bg-[#1D9BF0] text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {activeStep >= 5 ? '✓' : '4'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">4. En Cours de Livraison</div>
                      <div className="text-[11px] text-slate-500">
                        Le livreur se présentera à votre adresse : {verifiedOrder.shippingCity}.
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      activeStep >= 5 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      5
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">5. Colis Remis au Client</div>
                      <div className="text-[11px] text-slate-500">
                        Remise en main propre contre règlement.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Details & Package Content */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Package size={14} className="text-[#1D9BF0]" />
                <span>Contenu du Colis & Adresse</span>
              </h3>

              {/* Items */}
              <div className="divide-y divide-slate-100 text-xs">
                {verifiedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Format: {item.size || '100ml'} • Quantité : {item.quantity}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">
                      {formatMAD(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Payment details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    Montant à Régler
                  </div>
                  <div className="text-xs text-slate-600">
                    {isCOD ? 'Espèces à la livraison' : 'Déjà payé par carte'}
                  </div>
                </div>
                <div className="text-xl font-extrabold text-[#1D9BF0] font-mono">
                  {formatMAD(verifiedOrder.total)}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-3 bg-slate-50/70 rounded-xl text-xs space-y-1 text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400" />
                  <span>Adresse : {verifiedOrder.shippingAddress}, {verifiedOrder.shippingCity}</span>
                </div>
                <div>Destinataire : {verifiedOrder.customerName}</div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href={`https://wa.me/212663380011?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Phone size={15} />
                <span>Contacter le Livreur sur WhatsApp</span>
              </a>

              <Link
                href="/"
                className="w-full sm:w-auto py-3 px-5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <ShoppingBag size={15} />
                <span>Boutique NAY</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
