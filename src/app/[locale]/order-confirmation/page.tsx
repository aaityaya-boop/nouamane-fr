'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
  Share2,
  Printer,
} from 'lucide-react';

type OrderConfirmation = {
  orderNumber: string;
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
  const orderNumber = searchParams.get('order');
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('nouamaneLastOrder');
    if (saved) {
      try {
        setOrder(JSON.parse(saved));
      } catch {
        setOrder(null);
      }
    }
  }, []);

  const handleCopyOrder = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Estimate delivery: 3 business days
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
  const deliveryStr = estimatedDelivery.toLocaleDateString('fr-MA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen">
      <Header />

      <main className="pt-28 lg:pt-36 pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          {/* ========== SUCCESS HERO ========== */}
          <div className="text-center pb-14 pt-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 border border-green-200 text-green-600 mb-6 animate-[bounce_1s_ease-out]">
              <Check size={40} strokeWidth={1.8} />
            </div>

            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">
              Commande confirmée
            </span>

            <h1 className="heading-font text-4xl lg:text-6xl mt-4 tracking-wide leading-none">
              Merci{order?.customerName ? `, ${order.customerName.split(' ')[0]}` : ''} !
            </h1>

            <p className="mt-5 text-[15px] lg:text-base text-[#6B6B6B] max-w-lg mx-auto leading-relaxed">
              Votre commande a été reçue avec succès. Un email de confirmation
              vient de vous être envoyé
              {order?.customerEmail ? ` à ${order.customerEmail}` : ''}.
            </p>

            {/* Order number */}
            <div className="mt-8 inline-flex items-center gap-3 bg-white border border-[#e0ddd4] border border-[#e0ddd4] rounded-full px-6 py-3">
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#9A9A9A]">
                Numéro de commande
              </span>
              <span className="text-[13px] font-mono font-semibold text-[#1A1A1A]">
                {order?.orderNumber || orderNumber || '—'}
              </span>
              <button
                onClick={handleCopyOrder}
                className="text-[#0ea5e9] hover:text-[#7e22ce] transition-colors"
                title="Copier"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            {/* Print Button */}
            {(order?.orderNumber || orderNumber) && (
              <div className="mt-6">
                <Link
                  href={`/invoice/${order?.orderNumber || orderNumber}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.1em] uppercase text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors"
                >
                  <Printer size={16} /> Imprimer la facture (PDF)
                </Link>
              </div>
            )}
          </div>

          {/* ========== TIMELINE ========== */}
          <div className="bg-white border border-[#e0ddd4] rounded-2xl border border-[#e0ddd4] p-6 lg:p-10 mb-8">
            <h2 className="heading-font text-xl lg:text-2xl mb-8 tracking-wide flex items-center gap-3">
              <Truck size={18} className="text-[#0ea5e9]" />
              Suivi de votre commande
            </h2>

            <div className="relative">
              <div className="absolute left-4 top-6 bottom-6 w-px bg-[#e0ddd4]" />

              <TimelineStep
                icon={<Check size={16} />}
                title="Commande reçue"
                subtitle={`Aujourd'hui, ${new Date().toLocaleTimeString(
                  'fr-MA',
                  { hour: '2-digit', minute: '2-digit' }
                )}`}
                active
                completed
              />
              <TimelineStep
                icon={<Package size={16} />}
                title="Préparation du colis"
                subtitle="Sous 24 heures"
                active
              />
              <TimelineStep
                icon={<Truck size={16} />}
                title="En livraison"
                subtitle="Livraison estimée"
              />
              <TimelineStep
                icon={<Home size={16} />}
                title="Livrée"
                subtitle={deliveryStr}
                isLast
              />
            </div>
          </div>

          {order && (
            <>
              {/* ========== ORDER DETAILS ========== */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Shipping */}
                <div className="bg-white border border-[#e0ddd4] rounded-2xl border border-[#e0ddd4] p-6 lg:p-8">
                  <h3 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#9A9A9A] mb-4 flex items-center gap-2">
                    <MapPin size={12} /> Adresse de livraison
                  </h3>
                  <div className="text-[14px] text-[#1A1A1A] leading-[1.7]">
                    <div className="font-semibold">{order.customerName}</div>
                    <div>{order.shippingAddress}</div>
                    <div>
                      {order.shippingCity}
                      {order.shippingPostalCode
                        ? `, ${order.shippingPostalCode}`
                        : ''}
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#eeece5] text-[#6B6B6B] text-[13px] flex items-center gap-2">
                      <Phone size={12} /> {order.customerPhone}
                    </div>
                    <div className="text-[#6B6B6B] text-[13px] flex items-center gap-2 mt-1">
                      <Mail size={12} /> {order.customerEmail}
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white border border-[#e0ddd4] rounded-2xl border border-[#e0ddd4] p-6 lg:p-8">
                  <h3 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#9A9A9A] mb-4">
                    Mode de paiement
                  </h3>
                  <div className="text-[14px] text-[#1A1A1A]">
                    {order.paymentMethod === 'cod' ? (
                      <>
                        <div className="font-semibold flex items-center gap-2">
                          💵 Paiement à la livraison
                        </div>
                        <div className="text-[13px] text-[#6B6B6B] mt-2 leading-relaxed">
                          Merci de préparer{' '}
                          <span className="font-semibold text-[#1A1A1A]">
                            {formatMAD(order.total)}
                          </span>{' '}
                          en espèces pour le livreur.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold flex items-center gap-2">
                          💳 Carte bancaire
                        </div>
                        <div className="text-[13px] text-[#6B6B6B] mt-2">
                          Paiement effectué avec succès.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ========== ITEMS ========== */}
              <div className="bg-white border border-[#e0ddd4] rounded-2xl border border-[#e0ddd4] p-6 lg:p-8 mb-8">
                <h3 className="heading-font text-xl mb-6 tracking-wide">
                  Détails de votre commande
                </h3>

                <div className="divide-y divide-[#eeece5]">
                  {order.items.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex items-center gap-4 py-4"
                    >
                      <div className="relative w-16 h-20 bg-transparent rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="heading-font text-lg text-[#1A1A1A]">
                          {item.name}
                        </div>
                        <div className="text-[11px] tracking-[0.1em] uppercase text-[#9A9A9A]">
                          {item.size} · Quantité : {item.quantity}
                        </div>
                      </div>
                      <div className="text-[14px] font-semibold text-[#1A1A1A]">
                        {formatMAD(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-[#e0ddd4] space-y-2.5">
                  <SummaryRow label="Sous-total" value={formatMAD(order.subtotal)} />
                  <SummaryRow
                    label="Livraison"
                    value={order.shippingCost === 0 ? 'Gratuite' : formatMAD(order.shippingCost)}
                    green={order.shippingCost === 0}
                  />
                  <SummaryRow label="Total" value={formatMAD(order.total)} bold />
                </div>
              </div>

              {/* ========== NEXT STEPS ========== */}
              <div className="bg-transparent rounded-2xl p-6 lg:p-8 border border-[#e0ddd4] text-center">
                <h3 className="heading-font text-2xl mb-3 tracking-wide">
                  Et maintenant ?
                </h3>
                <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-6 max-w-md mx-auto">
                  Notre équipe prépare votre commande à Fès. Vous recevrez un
                  SMS avec le suivi dès l&apos;expédition. Une question ?
                  Contactez-nous par WhatsApp.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href="https://api.whatsapp.com/send?phone=212663380011"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-[11px] font-semibold tracking-[0.15em] uppercase rounded-full transition-colors"
                  >
                    <Phone size={14} /> WhatsApp
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 bg-[#f8fafc] hover:bg-black text-white px-6 py-3 text-[11px] font-semibold tracking-[0.15em] uppercase rounded-full transition-colors"
                  >
                    <Share2 size={14} /> Nous suivre
                  </a>
                </div>
              </div>
            </>
          )}

          {/* ========== CTA ========== */}
          <div className="mt-14 text-center">
            <Link
              href="/shop"
              className="btn-outline-blue inline-flex items-center gap-3 px-10 py-4 text-[11px] rounded-full"
            >
              Continuer les achats
            </Link>
          </div>
        </div>
      </main>

      {/* ========== GOOGLE CUSTOMER REVIEWS ========== */}
      {order && (
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
              `
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
  icon,
  title,
  subtitle,
  active,
  completed,
  isLast,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active?: boolean;
  completed?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className={`flex gap-4 relative ${isLast ? '' : 'pb-8'}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 ${
          completed
            ? 'bg-green-600 border-green-600 text-white'
            : active
            ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white'
            : 'bg-white border border-[#e0ddd4] border-[#e0ddd4] text-[#9A9A9A]'
        }`}
      >
        {icon}
      </div>
      <div className="pt-1">
        <div
          className={`text-[14px] font-semibold ${
            active || completed ? 'text-[#1A1A1A]' : 'text-[#9A9A9A]'
          }`}
        >
          {title}
        </div>
        <div className="text-[12px] text-[#9A9A9A] mt-0.5">{subtitle}</div>
      </div>
    </div>
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
      className={`flex justify-between items-baseline ${
        bold ? 'pt-3 mt-1 border-t border-[#e0ddd4]' : ''
      }`}
    >
      <span
        className={`${
          bold
            ? 'text-[10px] font-bold tracking-[0.25em] uppercase text-[#9A9A9A]'
            : 'text-[14px] text-[#6B6B6B]'
        }`}
      >
        {label}
      </span>
      <span
        className={`${
          bold
            ? 'heading-font text-2xl font-medium text-[#1A1A1A]'
            : green
            ? 'text-[14px] text-green-600 font-medium'
            : 'text-[14px] text-[#1A1A1A] font-medium'
        }`}
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
          <div className="text-[#9A9A9A] text-sm tracking-widest">
            Chargement…
          </div>
        </div>
      }
    >
      <OrderConfirmationInner />
    </Suspense>
  );
}
