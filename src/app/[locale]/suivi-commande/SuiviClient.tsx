'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
  RefreshCw,
  Sparkles,
  ShoppingBag,
  Check,
  Copy,
  Search,
  MessageCircle,
  ChevronDown,
  Calendar,
  Lock
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { POPULAR_COUNTRIES, ALL_COUNTRIES, type CountryCode } from '@/lib/countryCodes';

interface SuiviClientProps {
  initialOrderNumber?: string;
  initialOrder?: any;
}

const DEMO_ORDER = {
  orderNumber: 'NAY-2026-9842',
  customerName: 'Youssef El Alami',
  customerPhone: '+212 661-122334',
  shippingAddress: 'Boulevard d\'Anfa, Résidence Les Fleurs, Appt 14',
  shippingCity: 'Casablanca',
  status: 'shipped',
  paymentMethod: 'cod',
  total: 334,
  subtotal: 299,
  shippingCost: 35,
  createdAt: new Date().toISOString(),
  items: [
    {
      id: 101,
      name: 'Armani Code EDT',
      size: '100ml',
      price: 299,
      quantity: 1,
      image: '/images/products/armani-code.jpg',
    },
  ],
  timeline: [
    {
      id: 'evt-1',
      status: 'CONFIRMED',
      title: 'Commande validée par l\'Atelier',
      description: 'Coordonnées confirmées. Flacon assigné pour préparation.',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'evt-2',
      status: 'PREPARED',
      title: 'Contrôle qualité & emballage soigné',
      description: 'Flacon testeur vérifié, étiquette d\'authenticité apposée et calage anti-choc.',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'evt-3',
      status: 'SHIPPED',
      title: 'Colis expédié & en cours d\'acheminement',
      description: 'Prise en charge logistique effectuée. Livraison en cours.',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ],
};

export default function SuiviClient({
  initialOrderNumber = '',
  initialOrder = null,
}: SuiviClientProps) {
  const searchParams = useSearchParams();
  const urlOrder = searchParams?.get('order') || searchParams?.get('orderNumber') || searchParams?.get('id') || '';
  const isDemoParam = searchParams?.get('demo') === '1';
  const effectiveInitialOrder = initialOrderNumber || urlOrder || (isDemoParam ? 'NAY-2026-9842' : '');

  const [orderNumber, setOrderNumber] = useState(effectiveInitialOrder);
  const [phoneInput, setPhoneInput] = useState(isDemoParam ? '0661122334' : '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<any>(initialOrder || (isDemoParam ? DEMO_ORDER : null));
  const [invoiceToken, setInvoiceToken] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // International Country Code Selector State
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(POPULAR_COUNTRIES[0]); // Default: Morocco 🇲🇦
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryPickerRef = useRef<HTMLDivElement>(null);

  // Close country picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryPickerRef.current && !countryPickerRef.current.contains(event.target as Node)) {
        setIsCountryPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = ALL_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dial.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  useEffect(() => {
    if (urlOrder && !orderNumber) {
      setOrderNumber(urlOrder);
    }
  }, [urlOrder, orderNumber]);

  // Demo auto-activation
  useEffect(() => {
    if (isDemoParam && !verifiedOrder) {
      setVerifiedOrder(DEMO_ORDER);
      setOrderNumber(DEMO_ORDER.orderNumber);
      setPhoneInput('0661122334');
    }
  }, [isDemoParam, verifiedOrder]);

  // Check sessionStorage for previous verification
  useEffect(() => {
    const targetOrder = (orderNumber || urlOrder || initialOrderNumber || '').trim().toUpperCase();
    if (targetOrder && typeof window !== 'undefined' && !verifiedOrder) {
      const saved = sessionStorage.getItem(`tracking_verified_${targetOrder}`);
      const savedToken = sessionStorage.getItem(`invoice_token_${targetOrder}`);
      if (savedToken) {
        setInvoiceToken(savedToken);
      }
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.orderNumber) {
            setVerifiedOrder(parsed);
          }
        } catch {}
      }
    }
  }, [orderNumber, urlOrder, initialOrderNumber, verifiedOrder]);

  const executeLookup = async (targetOrder: string, targetPhone: string) => {
    // Demo bypass for test reference
    if (targetOrder.toUpperCase() === 'NAY-2026-9842' || targetOrder.toUpperCase() === 'DEMO') {
      setVerifiedOrder(DEMO_ORDER);
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
          phone: targetPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Numéro de téléphone incorrect pour cette commande.');
      }

      setVerifiedOrder(data.order);
      if (data.invoiceToken) {
        setInvoiceToken(data.invoiceToken);
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `tracking_verified_${data.order.orderNumber.toUpperCase()}`,
          JSON.stringify(data.order)
        );
        if (data.invoiceToken) {
          sessionStorage.setItem(
            `invoice_token_${data.order.orderNumber.toUpperCase()}`,
            data.invoiceToken
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la vérification');
    } finally {
      setIsVerifying(false);
    }
  };

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

    const fullPhone = `${selectedCountry.dial} ${phoneInput}`.trim();
    await executeLookup(targetOrder, fullPhone);
  };

  const handleRefresh = async () => {
    if (!verifiedOrder) return;
    const fullPhone = `${selectedCountry.dial} ${phoneInput}`.trim();
    await executeLookup(verifiedOrder.orderNumber, fullPhone);
  };

  const handleCopy = (text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  // Determine active stage from order status
  const getStatusStage = (status?: string): number => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'livré' || s === 'livree') return 4;
    if (s === 'shipped' || s === 'expédié' || s === 'expediee' || s === 'in_transit') return 3;
    if (s === 'preparing' || s === 'prepared' || s === 'en préparation' || s === 'confirmed' || s === 'confirmée') return 2;
    return 1;
  };

  const currentStage = verifiedOrder ? getStatusStage(verifiedOrder.status) : 3;
  const isCOD = !verifiedOrder?.paymentMethod || verifiedOrder?.paymentMethod === 'cod';

  const whatsappMessage = verifiedOrder
    ? encodeURIComponent(
        `Bonjour Maison NAY Parfums, je vous écris concernant le suivi de ma commande #${verifiedOrder.orderNumber} (au nom de ${verifiedOrder.customerName}).`
      )
    : encodeURIComponent('Bonjour Maison NAY Parfums, je souhaite suivre ma commande.');

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#1A1A1A] font-sans selection:bg-[#0ea5e9] selection:text-white flex flex-col justify-between">
      
      {/* 1. SIMPLE STANDARD SITE HEADER (BRAND DESIGN) */}
      <Header />

      {/* 2. MAIN TRACKING CONTENT */}
      <main className="pt-24 sm:pt-28 lg:pt-36 pb-20 flex-1">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* ========================================================
              STATE 1: VERIFICATION & SEARCH FORM (BRAND STYLE)
              ======================================================== */}
          {!verifiedOrder ? (
            <div className="max-w-xl mx-auto space-y-6 animate-fadeIn py-6 sm:py-10">
              
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284c7] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
                  Atelier NAY · Suivi de Commande
                </div>
                <h1 className="heading-font text-2xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
                  Suivre votre commande en direct
                </h1>
                <p className="text-[13px] text-[#6B6B6B] max-w-md mx-auto leading-relaxed">
                  Renseignez votre numéro de commande et votre numéro de téléphone pour afficher l&apos;état d&apos;avancement de votre flacon.
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-white border border-[#e0ddd4] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                
                <form onSubmit={handleVerify} className="space-y-4">
                  
                  {/* Order Number */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A]">
                      Numéro de Commande *
                    </label>
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                      <input
                        type="text"
                        required
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="EX : NAY-2026-9842"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-[14px] bg-[#fafaf7] border border-[#e0ddd4] focus:bg-white focus:border-[#0ea5e9] focus:outline-none font-mono font-bold uppercase text-[#1A1A1A]"
                      />
                    </div>
                  </div>

                  {/* Phone with World Country Code & Flag Dropdown */}
                  <div ref={countryPickerRef} className="relative space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A4A4A]">
                      Téléphone de Livraison *
                    </label>

                    <div className="relative flex rounded-xl border border-[#e0ddd4] bg-[#fafaf7] focus-within:border-[#0ea5e9] focus-within:bg-white transition-all">
                      {/* Country Selector Trigger */}
                      <button
                        type="button"
                        onClick={() => setIsCountryPickerOpen(!isCountryPickerOpen)}
                        className="flex items-center gap-2 px-3 bg-[#f0ede4] hover:bg-[#e8e4d8] border-r border-[#e0ddd4] text-[13px] font-bold text-[#1A1A1A] select-none shrink-0 transition cursor-pointer"
                        title="Changer le pays / indicatif"
                        aria-expanded={isCountryPickerOpen}
                      >
                        <span className="relative flex items-center justify-center w-5 h-3.5 rounded-[2px] overflow-hidden shadow-2xs border border-black/10 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                            alt={selectedCountry.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        </span>
                        <span>{selectedCountry.dial}</span>
                        <ChevronDown size={13} className={`text-[#888] transition-transform duration-200 ${isCountryPickerOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Phone Number Input */}
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="06 XX XX XX XX"
                        className="w-full px-3.5 py-3 text-[14px] bg-transparent focus:outline-none font-mono font-medium text-[#1A1A1A]"
                      />
                    </div>

                    {/* Country Code Popover Dropdown */}
                    {isCountryPickerOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-80 sm:w-96 bg-white border border-[#e0ddd4] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                        {/* Search Bar */}
                        <div className="p-3 border-b border-[#f1f1eb] bg-[#fafaf7]">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Rechercher un pays ou indicatif…"
                              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-white border border-[#e0ddd4] rounded-xl focus:outline-none focus:border-[#0ea5e9]"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Country List */}
                        <div className="max-h-60 overflow-y-auto divide-y divide-[#f5f5f0] text-[13px]">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => (
                              <button
                                key={`${c.code}-${c.dial}`}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setIsCountryPickerOpen(false);
                                  setCountrySearch('');
                                }}
                                className={`w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-sky-50/60 transition ${
                                  selectedCountry.code === c.code ? 'bg-sky-50 font-bold text-[#0284c7]' : 'text-[#1A1A1A]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="relative flex items-center justify-center w-5 h-3.5 rounded-[2px] overflow-hidden shadow-2xs border border-black/10 shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                                      alt={c.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  </span>
                                  <span className="truncate">{c.name}</span>
                                </div>
                                <span className="text-[12px] font-mono text-[#6B6B6B] shrink-0 font-semibold">{c.dial}</span>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-[#888] text-[12px]">Aucun pays trouvé.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white font-bold text-[14px] shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Vérification en direct…</span>
                      </>
                    ) : (
                      <>
                        <Truck size={16} />
                        <span>Vérifier le statut de ma commande</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                </form>

                {/* Instant Demo Link */}
                <div className="pt-4 border-t border-[#f1f1eb] text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifiedOrder(DEMO_ORDER);
                      setOrderNumber(DEMO_ORDER.orderNumber);
                      setPhoneInput('0661122334');
                    }}
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0284c7] hover:text-[#0369a1] transition hover:underline cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Visualiser un exemple de suivi en direct</span>
                  </button>
                </div>

              </div>

              {/* Trust Footer */}
              <div className="p-4 rounded-2xl bg-white border border-[#e0ddd4] flex items-center justify-between text-[11px] text-[#6B6B6B]">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#0ea5e9]" />
                  <span>Données commande chiffrées & protégées</span>
                </div>
                <a
                  href={`https://wa.me/212663380011?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0284c7] font-bold hover:underline"
                >
                  Besoin d&apos;aide WhatsApp
                </a>
              </div>

            </div>
          ) : (
            /* ========================================================
                STATE 2: LIVE TRACKING CONNECTED WITH ADMIN PANEL
                ======================================================== */
            <div className="space-y-6 animate-fadeIn">
              
              {/* TOP HEADER CARD */}
              <div className="bg-white border border-[#e0ddd4] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f1f1eb] pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {verifiedOrder.status === 'delivered'
                          ? 'Colis Livré & Réceptionné'
                          : verifiedOrder.status === 'shipped'
                          ? 'Colis en cours d\'acheminement'
                          : verifiedOrder.status === 'preparing' || verifiedOrder.status === 'prepared'
                          ? 'En cours de préparation à l\'Atelier'
                          : 'Commande Validée & Enregistrée'}
                      </span>
                    </div>
                    <h1 className="heading-font text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] mt-2">
                      Commande #{verifiedOrder.orderNumber}
                    </h1>
                    <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                      Client : <strong>{verifiedOrder.customerName}</strong> · Destination : <strong>{verifiedOrder.shippingCity || 'Maroc'}</strong>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopy(verifiedOrder.orderNumber)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e0ddd4] text-[12px] font-bold text-[#1A1A1A] hover:bg-[#fafaf7] transition cursor-pointer"
                    >
                      {copiedTracking ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} className="text-[#6B6B6B]" />
                          <span>Copier le N°</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={isVerifying}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e0ddd4] text-[12px] font-bold text-[#1A1A1A] hover:bg-[#fafaf7] transition cursor-pointer"
                      title="Actualiser depuis le panneau d'administration"
                    >
                      <RefreshCw size={14} className={isVerifying ? 'animate-spin text-[#0ea5e9]' : 'text-[#6B6B6B]'} />
                      <span>Actualiser</span>
                    </button>

                    <Link
                      href={`/invoice/${verifiedOrder.orderNumber}${invoiceToken ? `?token=${encodeURIComponent(invoiceToken)}` : ''}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-[12px] font-bold shadow-md shadow-sky-500/20 hover:from-[#0284c7] hover:to-[#0369a1] transition"
                    >
                      <FileText size={14} />
                      <span>Facture Fiscale</span>
                    </Link>
                  </div>
                </div>

                {/* DESTINATION & FINANCIAL HIGHLIGHT */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#fafaf7] border border-[#e0ddd4] grid sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#888] block">
                      Adresse de Livraison
                    </span>
                    <div className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                      <MapPin size={15} className="text-[#0ea5e9] shrink-0" />
                      <span>{verifiedOrder.shippingAddress}, {verifiedOrder.shippingCity}</span>
                    </div>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#e0ddd4] pt-3 sm:pt-0 sm:pl-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#888] block">
                      Montant à Régler au Livreur
                    </span>
                    <span className="heading-font text-2xl font-extrabold text-[#0284c7]">
                      {formatMAD(verifiedOrder.total)}
                    </span>
                    <span className="text-[11px] text-[#6B6B6B] block">
                      {isCOD ? 'Espèces à la remise en mains propres' : 'Déjà payé'}
                    </span>
                  </div>
                </div>

                {/* LIVE ADMIN TIMELINE OR STEPPER */}
                <div className="pt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#4A4A4A] flex items-center gap-2">
                      <Truck size={15} className="text-[#0ea5e9]" />
                      <span>Avancement de votre commande</span>
                    </h3>
                    <span className="text-[11px] text-[#0ea5e9] font-bold">
                      Connecté en temps réel
                    </span>
                  </div>

                  {/* If custom timeline events exist from Admin panel */}
                  {verifiedOrder.timeline && verifiedOrder.timeline.length > 0 ? (
                    <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e0ddd4]">
                      {verifiedOrder.timeline.map((evt: any, idx: number) => (
                        <div key={evt.id || idx} className="relative">
                          <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                            <Check size={14} strokeWidth={3} />
                          </div>
                          <div className="bg-[#fafaf7] border border-[#e0ddd4] rounded-2xl p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="text-[13px] font-bold text-[#1A1A1A]">
                                {evt.title}
                              </span>
                              {evt.createdAt && (
                                <span className="text-[11px] text-[#888] font-mono">
                                  {new Date(evt.createdAt).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                            {evt.description && (
                              <p className="text-[12px] text-[#6B6B6B] mt-1 leading-relaxed">
                                {evt.description}
                              </p>
                            )}
                            {evt.carrier && (
                              <div className="mt-2 text-[11px] text-[#0284c7] font-semibold flex items-center gap-1.5">
                                <Truck size={13} />
                                <span>Transporteur : {evt.carrier} {evt.trackingNumber ? `(Réf : ${evt.trackingNumber})` : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Default 4-Stage Progressive Timeline */
                    <div className="grid sm:grid-cols-4 gap-3 pt-2">
                      
                      <div className={`p-4 rounded-2xl border transition-all ${
                        currentStage >= 1 ? 'bg-sky-50/70 border-sky-200 text-[#0284c7]' : 'bg-[#fafaf7] border-[#e0ddd4] text-[#888]'
                      }`}>
                        <div className="w-7 h-7 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center font-bold text-[11px] mb-2">
                          1
                        </div>
                        <div className="text-[12px] font-bold text-[#1A1A1A]">1. Reçue</div>
                        <div className="text-[10px] text-[#6B6B6B] mt-0.5">Enregistrée à l&apos;Atelier</div>
                      </div>

                      <div className={`p-4 rounded-2xl border transition-all ${
                        currentStage >= 2 ? 'bg-sky-50/70 border-sky-200 text-[#0284c7]' : 'bg-[#fafaf7] border-[#e0ddd4] text-[#888]'
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] mb-2 ${
                          currentStage >= 2 ? 'bg-[#0ea5e9] text-white' : 'bg-[#e0ddd4] text-[#666]'
                        }`}>
                          2
                        </div>
                        <div className="text-[12px] font-bold text-[#1A1A1A]">2. Préparée</div>
                        <div className="text-[10px] text-[#6B6B6B] mt-0.5">Contrôle flacon & calage</div>
                      </div>

                      <div className={`p-4 rounded-2xl border transition-all ${
                        currentStage >= 3 ? 'bg-sky-50/70 border-sky-200 text-[#0284c7]' : 'bg-[#fafaf7] border-[#e0ddd4] text-[#888]'
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] mb-2 ${
                          currentStage >= 3 ? 'bg-[#0ea5e9] text-white animate-pulse' : 'bg-[#e0ddd4] text-[#666]'
                        }`}>
                          3
                        </div>
                        <div className="text-[12px] font-bold text-[#1A1A1A]">3. Expédiée</div>
                        <div className="text-[10px] text-[#6B6B6B] mt-0.5">En cours de tournée</div>
                      </div>

                      <div className={`p-4 rounded-2xl border transition-all ${
                        currentStage >= 4 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-[#fafaf7] border-[#e0ddd4] text-[#888]'
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] mb-2 ${
                          currentStage >= 4 ? 'bg-emerald-600 text-white' : 'bg-[#e0ddd4] text-[#666]'
                        }`}>
                          4
                        </div>
                        <div className="text-[12px] font-bold text-[#1A1A1A]">4. Livrée</div>
                        <div className="text-[10px] text-[#6B6B6B] mt-0.5">Remise en main propre</div>
                      </div>

                    </div>
                  )}

                </div>

              </div>

              {/* PACKAGE CONTENTS & GUARANTEE CARD */}
              <div className="bg-white border border-[#e0ddd4] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#f1f1eb]">
                  <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#4A4A4A]">
                    <Package size={15} className="text-[#0ea5e9]" />
                    <span>Contenu de votre colis</span>
                  </div>
                  <span className="text-[11px] text-[#888]">
                    {verifiedOrder.items?.length || 1} article(s)
                  </span>
                </div>

                <div className="divide-y divide-[#f1f1eb] text-[13px]">
                  {(verifiedOrder.items || []).map((item: any, i: number) => (
                    <div key={i} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-[#1A1A1A] truncate">{item.name}</div>
                        <div className="text-[11px] text-[#888] mt-0.5">
                          {item.size || '100ml'} · Quantité : {item.quantity || 1}
                        </div>
                      </div>
                      <div className="font-bold text-[#1A1A1A] shrink-0">
                        {formatMAD(item.price * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sceau Officiel de Garantie NAY */}
                <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#0284c7] font-bold text-[12px]">
                    <Sparkles size={15} />
                    <span>Garantie Sérénité NAY : Essayez avant de payer</span>
                  </div>
                  <p className="text-[12px] text-[#555] leading-relaxed">
                    Vous avez le droit légitime d&apos;ouvrir votre colis en présence du livreur et de vérifier votre flacon avant tout paiement. Si le parfum vous convient, vous réglez en espèces. Sinon, vous ne payez rien.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px]">
                  <button
                    type="button"
                    onClick={() => setVerifiedOrder(null)}
                    className="text-[#0284c7] hover:underline font-bold"
                  >
                    ← Suivre une autre commande
                  </button>

                  <a
                    href={`https://wa.me/212663380011?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#1A1A1A] hover:text-[#0ea5e9] font-semibold transition"
                  >
                    <MessageCircle size={15} className="text-[#0ea5e9]" />
                    <span>Besoin d&apos;aide ? Échangez sur WhatsApp : <strong>+212 663-380011</strong></span>
                  </a>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
