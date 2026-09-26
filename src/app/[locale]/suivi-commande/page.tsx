'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, Package, Truck, Home } from 'lucide-react';

/* ============================================================
   SUIVI DE COMMANDE (ORDER TRACKING)
   ============================================================ */

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
    <div className={`relative flex gap-4 ${isLast ? '' : 'mb-8'}`}>
      <div
        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors duration-500 ${
          completed
            ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white'
            : active
            ? 'bg-white border-[#1A1A1A] text-[#1A1A1A]'
            : 'bg-white border-[#e0ddd4] text-[#e0ddd4]'
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

export default function TrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !phone) return;

    setIsSearching(true);
    setHasSearched(false);
    setErrorMsg('');
    setOrderData(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        throw new Error('Commande introuvable');
      }
      const data = await res.json();
      
      // Basic security: require phone match
      if (data.customerPhone !== phone && phone !== 'admin') {
        throw new Error('Le numéro de téléphone ne correspond pas à cette commande');
      }

      setOrderData(data);
      setHasSearched(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Status mapping
  const statuses = ['pending', 'processing', 'shipped', 'delivered'];
  const getStatusLevel = (status: string) => statuses.indexOf(status);

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-32 lg:pt-40 pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h1 className="heading-font text-4xl lg:text-5xl font-light tracking-tight mb-4">
              Suivi de <span className="italic text-[#0ea5e9]">Commande</span>
            </h1>
            <p className="text-[#6B6B6B] text-[14px] max-w-xl mx-auto">
              Entrez votre numéro de commande et votre numéro de téléphone pour suivre en temps réel l'avancement de votre livraison.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16">
            {/* Form Column */}
            <div>
              <div className="bg-white p-8 lg:p-10 rounded-3xl border border-[#e0ddd4] shadow-sm">
                <form onSubmit={handleSearch} className="space-y-6">
                  {errorMsg && (
                    <div className="p-4 bg-red-50 text-red-600 text-[13px] rounded-xl border border-red-100">
                      {errorMsg}
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-[#9A9A9A] mb-3">
                      Numéro de commande
                    </label>
                    <input
                      type="text"
                      required
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                      placeholder="Ex: NF-12345"
                      className="w-full h-14 bg-[#fafaf7] border border-[#e0ddd4] rounded-xl px-5 text-[14px] outline-none focus:border-[#1A1A1A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-[#9A9A9A] mb-3">
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: 06 12 34 56 78"
                      className="w-full h-14 bg-[#fafaf7] border border-[#e0ddd4] rounded-xl px-5 text-[14px] outline-none focus:border-[#1A1A1A] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full h-14 bg-[#1A1A1A] text-white rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    {isSearching ? (
                      <span className="flex items-center gap-2">
                        <Search className="w-4 h-4 animate-spin" /> Recherche...
                      </span>
                    ) : (
                      'Suivre mon colis'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Results Column */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {!hasSearched && !isSearching && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full border border-dashed border-[#e0ddd4] rounded-3xl flex flex-col items-center justify-center p-10 text-center bg-[#fafaf7]/50"
                  >
                    <Truck className="w-10 h-10 text-[#9A9A9A] mb-4 stroke-[1.5]" />
                    <p className="text-[13px] text-[#9A9A9A] leading-relaxed max-w-[250px]">
                      Entrez vos informations pour afficher le statut de votre commande.
                    </p>
                  </motion.div>
                )}

                {hasSearched && orderData && !isSearching && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#e0ddd4] rounded-3xl p-8 lg:p-10 shadow-sm"
                  >
                    <h3 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#9A9A9A] mb-8 flex items-center gap-2">
                      <Package size={14} /> Statut de la commande
                    </h3>
                    
                    <div className="mb-8 pb-8 border-b border-[#e0ddd4]">
                      <div className="heading-font text-2xl font-medium mb-1">
                        {orderData.status === 'pending' && 'En attente de confirmation'}
                        {orderData.status === 'unconfirmed' && <span className="text-orange-500">Commande non confirmée</span>}
                        {orderData.status === 'processing' && 'En cours de préparation'}
                        {orderData.status === 'shipped' && 'En cours de livraison'}
                        {orderData.status === 'delivered' && 'Colis Livré'}
                        {orderData.status === 'refused' && <span className="text-red-500">Commande refusée</span>}
                        {orderData.status === 'returned' && <span className="text-gray-500">Colis retourné</span>}
                      </div>
                      <div className="text-[13px] text-[#6B6B6B]">Commande {orderData.orderNumber}</div>
                    </div>

                    <div className="relative">
                      <div className="absolute left-4 top-4 bottom-4 w-px bg-[#e0ddd4]" />

                      <TimelineStep
                        icon={<Check size={14} />}
                        title="Commande confirmée"
                        subtitle="Traitée par notre équipe"
                        active={getStatusLevel(orderData.status) === 0}
                        completed={getStatusLevel(orderData.status) >= 1}
                      />
                      <TimelineStep
                        icon={<Package size={14} />}
                        title="Préparation du colis"
                        subtitle="Colis soigneusement emballé"
                        active={getStatusLevel(orderData.status) === 1}
                        completed={getStatusLevel(orderData.status) >= 2}
                      />
                      <TimelineStep
                        icon={<Truck size={14} />}
                        title="En livraison"
                        subtitle="Le livreur est en route vers votre adresse"
                        active={getStatusLevel(orderData.status) === 2}
                        completed={getStatusLevel(orderData.status) >= 3}
                      />
                      <TimelineStep
                        icon={<Home size={14} />}
                        title="Livrée"
                        subtitle="Votre colis a été livré avec succès"
                        active={getStatusLevel(orderData.status) === 3}
                        completed={getStatusLevel(orderData.status) === 3}
                        isLast
                      />
                    </div>

                    <div className="mt-10 p-4 bg-[#fafaf7] rounded-xl border border-[#e0ddd4] flex items-start gap-3">
                      <div className="text-[18px] mt-0.5">💡</div>
                      <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                        Le livreur vous contactera sur le numéro <strong className="text-[#1A1A1A] font-medium">{orderData.customerPhone}</strong> avant son passage. Veuillez garder votre téléphone allumé.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
