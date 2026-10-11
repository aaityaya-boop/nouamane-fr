'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import { formatMAD, Product } from '@/lib/products';
import { 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  Clock, 
  Flame, 
  Sparkles, 
  HelpCircle, 
  Check, 
  PhoneCall, 
  MessageCircle, 
  PackageCheck,
  ChevronDown,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Tanger',
  'Fès',
  'Agadir',
  'Meknès',
  'Oujda',
  'Kénitra',
  'Tétouan',
  'Safi',
  'Mohammedia',
  'El Jadida',
  'Nador',
  'Béni Mellal',
  'Khémisset',
  'Taza',
  'Berkane',
  'Larache',
  'Guelmim',
  'Khouribga',
  'Settat',
  'Autre Ville (Maroc)'
];

export default function PromoClient({ 
  landingPage, 
  products, 
  pageConfig 
}: { 
  landingPage: any; 
  products: Product[]; 
  pageConfig?: any;
}) {
  // Config defaults
  const config = pageConfig || {};
  const mainProduct = products[0] || null;

  // Bundles setup
  const rawBundles = config.bundles && config.bundles.length > 0 ? config.bundles : [
    {
      id: '1',
      title: mainProduct ? `1x ${mainProduct.name}` : '1x Flacon Découverte',
      subtitle: 'Format individuel',
      qty: 1,
      price: mainProduct ? mainProduct.price : 450,
      originalPrice: mainProduct ? (mainProduct.originalPrice || Math.round(mainProduct.price * 1.35)) : 650,
      badge: 'Offre Standard',
      isPopular: false
    },
    {
      id: '2',
      title: mainProduct ? `Pack Duo (2x ${mainProduct.name})` : 'Pack Duo (2 Flacons)',
      subtitle: 'Le Choix Préféré de nos Clients',
      qty: 2,
      price: mainProduct ? Math.round(mainProduct.price * 1.75) : 790,
      originalPrice: mainProduct ? Math.round((mainProduct.originalPrice || mainProduct.price * 1.35) * 2) : 1300,
      badge: '🔥 LE PLUS COMMANDÉ · Livraison Gratuite',
      isPopular: true
    },
    {
      id: '3',
      title: mainProduct ? `Pack VIP (3x ${mainProduct.name})` : 'Pack VIP (3 Flacons)',
      subtitle: 'Idéal pour Offrir ou Partager',
      qty: 3,
      price: mainProduct ? Math.round(mainProduct.price * 2.3) : 1050,
      originalPrice: mainProduct ? Math.round((mainProduct.originalPrice || mainProduct.price * 1.35) * 3) : 1950,
      badge: '👑 SUPER ÉCONOMIE · 1 Flacon Offert',
      isPopular: false
    }
  ];

  const [selectedBundleId, setSelectedBundleId] = useState<string>(
    rawBundles.find((b: any) => b.isPopular)?.id || rawBundles[0]?.id || '1'
  );

  const activeBundle = rawBundles.find((b: any) => b.id === selectedBundleId) || rawBundles[0];

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingCity, setShippingCity] = useState('Casablanca');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccessData, setOrderSuccessData] = useState<any | null>(null);

  // FAQ open/close accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 3, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format deadline if specified in DB
  let deadlineStr = null;
  if (landingPage.deadline) {
    const d = new Date(landingPage.deadline);
    deadlineStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Handle Express COD Order Submission
  const handleExpressOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    // Validate Moroccan phone number (must start with 05, 06, 07 or +212)
    const cleanPhone = customerPhone.replace(/\s+/g, '');
    const phoneRegex = /^(?:(?:\+|00)212|0)[5-7]\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setOrderError('Veuillez entrer un numéro de téléphone marocain valide (ex: 06 12 34 56 78 ou +212 6...)');
      return;
    }

    if (!customerName.trim() || !shippingAddress.trim()) {
      setOrderError('Veuillez renseigner votre nom complet et votre adresse de livraison.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build order items based on active bundle
      const itemTitle = activeBundle ? `${activeBundle.title} (${landingPage.title})` : landingPage.title;
      const orderTotal = activeBundle ? activeBundle.price : (mainProduct?.price || 490);

      const payload = {
        customerName: customerName.trim(),
        customerEmail: `${cleanPhone.replace(/[^0-9]/g, '')}@client.nayparfum.ma`,
        customerPhone: cleanPhone,
        shippingAddress: shippingAddress.trim(),
        shippingCity: shippingCity,
        shippingPostalCode: '20000',
        paymentMethod: 'cash_on_delivery',
        items: [
          {
            id: mainProduct?.id || 9999,
            sku: (mainProduct as any)?.sku || `LP-${landingPage.slug}`,
            slug: landingPage.slug,
            name: itemTitle,
            price: orderTotal,
            quantity: 1,
            size: activeBundle?.qty ? `${activeBundle.qty}x Unités` : '100ml',
            image: landingPage.heroImage || mainProduct?.images?.[0] || '/images/nay/Artboard 2.png',
            inStock: true
          }
        ],
        subtotal: orderTotal,
        shippingCost: 0, // Free express shipping for landing pages
        total: orderTotal,
        promoCode: landingPage.slug,
        discount: activeBundle?.originalPrice ? activeBundle.originalPrice - activeBundle.price : 0
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOrderSuccessData({
          orderNumber: data.order?.orderNumber || `NF-${Date.now().toString(36).toUpperCase()}`,
          customerName,
          customerPhone,
          shippingCity,
          shippingAddress,
          total: orderTotal,
          bundleTitle: activeBundle?.title || landingPage.title
        });
      } else {
        setOrderError(data.error || 'Une erreur est survenue lors de la validation. Veuillez réessayer.');
      }
    } catch (err: any) {
      console.error('Error placing express order:', err);
      setOrderError('Impossible de joindre le serveur. Vous pouvez commander directement sur WhatsApp ci-dessous.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Order Link generator
  const getWhatsAppOrderUrl = () => {
    const rawNumber = config.whatsappNumber || '+212663380011';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const bundleText = activeBundle ? activeBundle.title : landingPage.title;
    const priceText = activeBundle ? activeBundle.price : (mainProduct?.price || 490);
    const text = encodeURIComponent(
      `Bonjour Maison NAY Parfums 🌟\nJe souhaite commander cette offre spéciale :\n\n📌 *${landingPage.title}*\n📦 Formule : *${bundleText}*\n💰 Prix : *${priceText} DH*\n🚚 Mode : Paiement à la livraison partout au Maroc\n\nMerci de me confirmer la disponibilité et le délai de livraison !`
    );
    return `https://wa.me/${cleanNumber}?text=${text}`;
  };

  const scrollToCheckout = () => {
    const el = document.getElementById('express-checkout-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = config.features && config.features.length > 0 ? config.features : [
    {
      title: '100% Authentique & Certifié',
      description: 'Produit scellé sous blister d’origine avec traçabilité et code batch européen vérifiable.',
      icon: 'ShieldCheck'
    },
    {
      title: 'Livraison Express 24h/48h',
      description: 'Livraison ultra-rapide le jour même ou 24h à Casablanca et Rabat, 48h partout ailleurs au Maroc.',
      icon: 'Truck'
    },
    {
      title: 'Paiement à la Livraison (COD)',
      description: 'Vous ne payez rien d’avance. Vous réglez en espèces directement au livreur à votre porte.',
      icon: 'PackageCheck'
    },
    {
      title: 'Vérification du Colis Possible',
      description: 'Vous pouvez ouvrir et vérifier l’état de votre commande en présence du livreur avant le paiement.',
      icon: 'Sparkles'
    }
  ];

  const reviews = config.reviews && config.reviews.length > 0 ? config.reviews : [
    {
      name: 'Salma El Amrani',
      city: 'Casablanca (Maârif)',
      rating: 5,
      date: 'Il y a 2 jours',
      comment: 'Reçu en moins de 24h à Casablanca. La qualité est tout simplement exceptionnelle, parfum authentique et tenue remarquable toute la journée. Le livreur était très courtois.'
    },
    {
      name: 'Youssef Bennani',
      city: 'Rabat (Agdal)',
      rating: 5,
      date: 'Il y a 4 jours',
      comment: 'J’ai pris le Pack Duo. Le fait de pouvoir vérifier le colis avant de payer m’a totalement rassuré. Très belle présentation luxueuse, je commanderai à nouveau !'
    },
    {
      name: 'Kenza Tazi',
      city: 'Marrakech (Guéliz)',
      rating: 5,
      date: 'Il y a 1 semaine',
      comment: 'Service impeccable. Produit conforme à 100%, emballage très soigné avec sac et ruban de prestige. Bravo Maison NAY.'
    }
  ];

  const faqs = config.faqs && config.faqs.length > 0 ? config.faqs : [
    {
      q: 'Comment se passe le paiement de ma commande ?',
      a: 'Le paiement se fait 100% en espèces (Cash on Delivery) à la réception de votre colis. Vous ne payez rien en ligne.'
    },
    {
      q: 'Puis-je ouvrir et vérifier le colis avant de régler le livreur ?',
      a: 'Oui, absolument ! Chez Maison NAY, la confiance est primordiale. Vous avez le droit d’ouvrir le colis et de vérifier vos produits devant le livreur avant de payer.'
    },
    {
      q: 'Quels sont les délais de livraison au Maroc ?',
      a: '24h pour Casablanca, Rabat, Mohammedia et Kénitra. 24h à 48h pour Marrakech, Tanger, Fès, Agadir, Oujda, Meknès et le reste du Royaume.'
    },
    {
      q: 'Les produits sont-ils authentiques ?',
      a: 'Tous nos parfums et soins proviennent exclusivement des circuits de distribution officiels européens avec codes batch d’origine vérifiables.'
    },
    {
      q: 'Comment contacter le service client en cas de question ?',
      a: 'Notre équipe marocaine est joignable 7j/7 directement sur WhatsApp au +212 663-380011 ou par email à contact@nayparfum.ma.'
    }
  ];

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#1A1A1A] font-sans antialiased selection:bg-[#B8860B]/20">
      <LandingHeader />

      {/* TOP URGENCY COUNTDOWN BAR */}
      <div className="bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] text-white border-b border-amber-600/30 sticky top-16 z-40 shadow-md">
        <div className="max-w-[1240px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              {landingPage.badgeText || 'OFFRE SPÉCIALE MAROC'}
            </span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span className="hidden sm:inline text-gray-300">
              {config.urgencyText || 'Stock limité aux 30 premières commandes d’aujourd’hui'}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1.5 text-gray-300 text-[11px]">
              <Clock size={13} className="text-amber-400 animate-pulse" />
              <span>Expire dans :</span>
            </div>
            <div className="flex items-center gap-1 font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-500/20 text-xs">
              <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span>:</span>
              <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span>:</span>
              <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE VIEWERS TICKER */}
      <div className="bg-amber-50 border-b border-amber-100 py-1.5 px-4 text-center text-[11px] text-amber-900 font-medium flex items-center justify-center gap-2">
        <Flame size={14} className="text-red-500 animate-bounce" />
        <span>
          <strong>{config.viewersCount || 19} clients</strong> consultent actuellement cette offre à Casablanca, Rabat et Marrakech.
        </span>
      </div>

      {/* HERO SECTION */}
      <section className="relative pt-8 pb-16 lg:py-20 overflow-hidden bg-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {landingPage.badgeText && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold tracking-wider uppercase mb-5 w-fit">
                <Sparkles size={13} className="text-amber-600" />
                {landingPage.badgeText}
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-[1.15] mb-5 tracking-tight">
              {landingPage.title}
            </h1>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6 font-normal">
              {landingPage.subtitle}
            </p>

            {/* Reassurance Bullet Points */}
            <div className="grid sm:grid-cols-2 gap-3 mb-8 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-800">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>100% Authentique & Scellé</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-800">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Paiement Cash à la Livraison (COD)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-800">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Possibilité d'ouvrir le colis avant de payer</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-800">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Livraison Express 24h/48h au Maroc</span>
              </div>
            </div>

            {/* Quick Pricing Pill & CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={scrollToCheckout}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl shadow-red-600/20 transform hover:-translate-y-0.5 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                <span>Commander Maintenant (Paiement à la livraison)</span>
              </button>

              <a
                href={getWhatsAppOrderUrl()}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-5 py-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle size={17} className="text-emerald-600" />
                <span>WhatsApp 1-Clic</span>
              </a>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Truck size={14} className="text-gray-400" /> Livraison Gratuite dès aujourd’hui
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-600" /> Garantie Satisfaction
              </span>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-gray-100">
              {landingPage.heroImage && (
                <Image
                  src={landingPage.heroImage}
                  alt={landingPage.title}
                  fill
                  className="object-cover"
                  priority
                />
              )}

              {/* Floating Quality Seal */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-amber-200/50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Qualité Prestige</div>
                  <div className="text-xs font-black text-gray-900">Édition Certifiée</div>
                </div>
              </div>

              {/* Bottom Reassurance Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    <Check size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Vérification à la livraison</div>
                    <div className="text-[11px] text-gray-500">Inspectez le produit avant de payer</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-gray-400 font-semibold">Paiement</div>
                  <div className="text-xs font-bold text-emerald-700">Cash (COD)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SENSORY STORYTELLING SECTION */}
      {config.story && (
        <section className="py-12 bg-[#FAF7F2] border-y border-amber-200/40">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <div className="inline-block w-10 h-1 bg-amber-600 rounded-full mb-6"></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 tracking-tight">
              L'Expérience & Le Savoir-Faire Maison NAY
            </h2>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-line italic">
              "{config.story}"
            </p>
          </div>
        </section>
      )}

      {/* BUNDLE SELECTION & EXPRESS COD ORDER SECTION */}
      <section id="express-checkout-form" className="py-16 bg-white scroll-mt-24">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Étape 1 : Choisissez Votre Formule
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 mb-3">
              Profitez des Meilleurs Tarifs au Maroc
            </h2>
            <p className="text-gray-600 text-sm">
              Sélectionnez votre pack ci-dessous puis confirmez votre commande. Vous ne payez qu'à la livraison en espèces !
            </p>
          </div>

          {/* 3 Bundles Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {rawBundles.map((bundle: any) => {
              const isSelected = selectedBundleId === bundle.id;
              const discountPercent = bundle.originalPrice 
                ? Math.round((1 - bundle.price / bundle.originalPrice) * 100) 
                : 0;

              return (
                <div
                  key={bundle.id}
                  onClick={() => setSelectedBundleId(bundle.id)}
                  className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-200 border-2 ${
                    isSelected
                      ? 'border-red-600 bg-red-50/20 shadow-xl ring-2 ring-red-600/20 scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                  }`}
                >
                  {bundle.badge && (
                    <div className={`absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md ${
                      bundle.isPopular 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-900 text-amber-300'
                    }`}>
                      {bundle.badge}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4 mt-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Quantité : {bundle.qty} {bundle.qty > 1 ? 'Unités' : 'Unité'}
                    </span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      isSelected ? 'border-red-600 bg-red-600 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{bundle.title}</h3>
                  <p className="text-xs text-gray-500 mb-6">{bundle.subtitle}</p>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-extrabold text-red-600">{formatMAD(bundle.price)}</span>
                    {bundle.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatMAD(bundle.originalPrice)}
                      </span>
                    )}
                  </div>

                  {discountPercent > 0 && (
                    <div className="inline-block bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-md mb-4">
                      Économisez {formatMAD((bundle.originalPrice || 0) - bundle.price)} (-{discountPercent}%)
                    </div>
                  )}

                  <ul className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-4">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-600" /> Flacon scellé & vérifiable
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-600" /> Livraison Gratuite Partout au Maroc
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-600" /> Paiement à la réception (Cash)
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>

          {/* FORMULAIRE DE COMMANDE EXPRESS COD */}
          <div className="max-w-2xl mx-auto bg-gradient-to-b from-gray-50 to-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 shadow-xl">
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Étape 2 : Vos Coordonnées</span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Formulaire Express (Sans Création de Compte)</h3>
                <p className="text-xs text-gray-500 mt-1">Remplissez vos informations pour une expédition immédiate.</p>
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Total à payer</div>
                <div className="text-2xl font-black text-red-600">{formatMAD(activeBundle?.price || 490)}</div>
              </div>
            </div>

            {orderError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                ⚠️ {orderError}
              </div>
            )}

            <form onSubmit={handleExpressOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nom et Prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Karim Bennani"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium bg-white"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Téléphone (WhatsApp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-xs font-bold text-gray-500 flex items-center gap-1">
                      🇲🇦
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="06 XX XX XX XX"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium bg-white"
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 block">Le livreur vous contactera sur ce numéro.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Ville de Livraison *
                  </label>
                  <select
                    value={shippingCity}
                    onChange={e => setShippingCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium bg-white"
                  >
                    {MOROCCAN_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Adresse Complète de Livraison *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Quartier, N° Immeuble, Rue ou Bureau..."
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium bg-white"
                />
              </div>

              {/* Order Recap Banner */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-600">Pack sélectionné : </span>
                  <strong className="text-gray-900">{activeBundle?.title}</strong>
                  <div className="text-emerald-700 font-semibold mt-0.5">🚚 Livraison Gratuite incluse</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 text-[11px]">Total à la réception :</div>
                  <div className="text-xl font-black text-red-600">{formatMAD(activeBundle?.price || 490)}</div>
                </div>
              </div>

              {/* Big Order Confirmation Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl shadow-red-600/30 text-sm uppercase tracking-wider flex items-center justify-center gap-2 transform active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Validation en cours...</span>
                ) : (
                  <>
                    <PackageCheck size={20} />
                    <span>CONFIRMER MA COMMANDE (PAIEMENT À LA LIVRAISON)</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-400">ou préférez-vous commander par message ?</span>
                <div className="mt-2">
                  <a
                    href={getWhatsAppOrderUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-bold text-xs hover:underline"
                  >
                    <MessageCircle size={15} />
                    <span>Commander directement via WhatsApp avec un conseiller</span>
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 4 MOROCCAN REASSURANCE PILLARS */}
      <section className="py-16 bg-[#FAF9F6] border-y border-gray-200">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat: any, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mb-4">
                  {feat.icon === 'Truck' ? <Truck size={28} /> :
                   feat.icon === 'Clock' ? <Clock size={28} /> :
                   feat.icon === 'Sparkles' ? <Sparkles size={28} /> :
                   <ShieldCheck size={28} />}
                </div>
                <h4 className="font-bold text-gray-900 text-base mb-2">{feat.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION WITH MOROCCAN PROOF */}
      <section className="py-16 bg-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill="currentColor" />
              ))}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Avis Clients Certifiés au Maroc
            </h2>
            <p className="text-xs text-gray-500">
              Plus de 4 800 commandes livrées avec succès à travers tout le Royaume.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((rev: any, idx: number) => (
              <div key={idx} className="bg-gray-50/70 p-6 rounded-2xl border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-amber-500">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400">{rev.date || 'Récemment'}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed italic mb-4">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-gray-200/50">
                  <div className="w-9 h-9 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                    {rev.name ? rev.name.charAt(0) : 'C'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <span>{rev.name}</span>
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    </div>
                    <div className="text-[11px] text-gray-500">{rev.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 bg-[#FAF9F6] border-t border-gray-200">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              Questions Fréquentes
            </h2>
            <p className="text-xs text-gray-500">
              Tout ce que vous devez savoir avant de passer votre commande.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq: any, idx: number) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-gray-900 hover:text-amber-700 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`transform transition-transform ${isOpen ? 'rotate-180 text-amber-600' : 'text-gray-400'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MOBILE STICKY FLOATING ORDER BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 md:hidden z-50 flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <div className="text-[10px] text-gray-500 font-semibold uppercase">Pack {activeBundle?.qty}x Unité(s)</div>
          <div className="text-lg font-black text-red-600">{formatMAD(activeBundle?.price || 490)}</div>
        </div>
        <button
          onClick={scrollToCheckout}
          className="flex-1 bg-red-600 active:bg-red-700 text-white py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5"
        >
          <span>Commander (Paiement livraison)</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href={getWhatsAppOrderUrl()}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-20 md:bottom-6 right-5 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
        title="Parler avec un conseiller sur WhatsApp"
      >
        <MessageCircle size={26} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
          WhatsApp Direct
        </span>
      </a>

      {/* ORDER SUCCESS MODAL */}
      {orderSuccessData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-amber-200 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 size={36} />
            </div>

            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Commande Confirmée 🎉
            </span>

            <h3 className="text-2xl font-black text-gray-900 mt-3 mb-2">
              Merci, {orderSuccessData.customerName} !
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Votre commande <strong>#{orderSuccessData.orderNumber}</strong> a été enregistrée avec succès. Notre service logistique prépare votre colis pour expédition à <strong>{orderSuccessData.shippingCity}</strong>.
            </p>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Formule :</span>
                <span className="font-bold text-gray-900">{orderSuccessData.bundleTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total à payer au livreur :</span>
                <span className="font-extrabold text-red-600 text-sm">{formatMAD(orderSuccessData.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mode de règlement :</span>
                <span className="font-bold text-emerald-700">Espèces à la livraison</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Téléphone :</span>
                <span className="font-semibold text-gray-800">{orderSuccessData.customerPhone}</span>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={`https://wa.me/212663380011?text=${encodeURIComponent(
                  `Bonjour Maison NAY, je viens de passer la commande #${orderSuccessData.orderNumber} (${orderSuccessData.bundleTitle}) pour un montant de ${orderSuccessData.total} DH à ${orderSuccessData.shippingCity}. Pouvez-vous me confirmer la livraison ?`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <MessageCircle size={16} />
                <span>Suivre ma commande sur WhatsApp</span>
              </a>

              <button
                onClick={() => setOrderSuccessData(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <LandingFooter />
    </div>
  );
}
