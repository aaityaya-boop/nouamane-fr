'use client';

import React from 'react';
import Image from 'next/image';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import { formatMAD, Product, isProductInStock } from '@/lib/products';
import { Truck, ShieldCheck, CheckCircle2, Star, Clock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function PromoClient({ landingPage, products }: { landingPage: any, products: Product[] }) {
  const { addToCart } = useCart();
  const router = useRouter();

  const handleQuickBuy = (product: Product) => {
    if (!isProductInStock(product)) return;
    addToCart({
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: product.sizes[0]?.label || '50ml',
      inStock: product.inStock,
      stock: product.stock,
    });
    router.push('/checkout');
  };

  // Format deadline if exists
  let deadlineStr = null;
  if (landingPage.deadline) {
    const d = new Date(landingPage.deadline);
    deadlineStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <div className="bg-[#fafaf7] min-h-screen text-[#1A1A1A] font-sans selection:bg-[#0ea5e9]/20 pt-16 pb-20 lg:pb-0 relative">
      <LandingHeader />

      {deadlineStr && (
        <div className="bg-red-600 text-white text-center py-2 text-[11px] lg:text-[12px] font-bold tracking-[0.1em] uppercase shadow-md flex items-center justify-center gap-2">
          <Clock size={14} className="animate-pulse" />
          Vente Flash : Se termine le {deadlineStr}
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div className="z-10">
            {landingPage.badgeText && (
              <div className="inline-block px-3 py-1 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-full text-[10px] font-bold tracking-[0.15em] uppercase mb-6">
                {landingPage.badgeText}
              </div>
            )}
            <h1 className="heading-font text-4xl lg:text-6xl leading-[1.1] mb-6 whitespace-pre-line">
              {landingPage.title}
            </h1>
            <p className="text-gray-600 text-[15px] lg:text-[17px] leading-relaxed mb-8 max-w-lg whitespace-pre-line">
              {landingPage.subtitle}
            </p>
            <ul className="space-y-3 mb-10 text-[14px] font-medium text-gray-800">
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#0ea5e9]" /> Garantie 100% Original
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#0ea5e9]" /> Paiement Cash à la Livraison
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#0ea5e9]" /> Livraison Gratuite Express
              </li>
            </ul>
            <a href="#offres" className="inline-block bg-red-600 text-white px-10 py-4 rounded-full text-[12px] font-bold tracking-[0.15em] uppercase shadow-lg hover:bg-red-700 hover:scale-105 transition-all duration-300 w-full sm:w-auto text-center">
              Voir Les Offres
            </a>
          </div>
          <div className="relative h-[400px] lg:h-[600px] w-full rounded-2xl overflow-hidden shadow-2xl">
            {landingPage.heroImage && (
              <Image 
                src={landingPage.heroImage} 
                alt="Promo Hero" 
                fill 
                className="object-cover"
                priority
              />
            )}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-[12px] font-bold text-gray-900">Qualité Garantie</div>
                <div className="text-[10px] text-gray-500">Satisfait ou remboursé</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OFFERS SECTION */}
      <section id="offres" className="py-20 bg-[#fafaf7]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="heading-font text-3xl lg:text-4xl mb-4">Notre Sélection Exclusive</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Profitez de réductions exceptionnelles sur nos parfums. Stocks limités.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const original = product.originalPrice || Math.round(product.price * 1.3);
              const discountPercent = Math.round((1 - product.price / original) * 100);
              const inStock = isProductInStock(product);

              return (
                <div key={product.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow relative">
                  {inStock && (
                    <div className="absolute -top-4 -right-4 bg-red-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-[14px] shadow-lg transform rotate-12 z-10">
                      -{discountPercent}%
                    </div>
                  )}

                  <div className="relative aspect-square w-full mb-6 rounded-xl overflow-hidden bg-gray-50">
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                    {!inStock && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center p-4">
                        <span className="text-[11px] font-bold tracking-widest text-red-600 uppercase bg-white border border-red-200 px-4 py-2 rounded-full shadow-md flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          Rupture de stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">{product.brandLabel}</div>
                  <h3 className="heading-font text-xl mb-4 line-clamp-1">{product.name}</h3>
                  
                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-2xl font-bold text-red-600">{formatMAD(product.price)}</span>
                    <span className="text-sm text-gray-400 line-through mb-1">{formatMAD(original)}</span>
                  </div>

                  {inStock ? (
                    <button 
                      onClick={() => handleQuickBuy(product)}
                      className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-black hover:shadow-lg transition-all"
                    >
                      Commander (Paiement à la livraison)
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full bg-red-50 text-red-600 border border-red-200 py-4 rounded-xl text-[12px] font-bold tracking-[0.1em] uppercase cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Rupture de stock
                    </button>
                  )}
                  <p className="text-center text-[10px] text-gray-500 mt-3 flex items-center justify-center gap-1">
                    <Truck size={12} /> Livraison Express Gratuite
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* REASSURANCE SECTION */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6 grid sm:grid-cols-3 gap-10 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[#0ea5e9]/10 rounded-full flex items-center justify-center text-[#0ea5e9] mb-4">
              <ShieldCheck size={32} />
            </div>
            <h4 className="font-bold mb-2">100% Original</h4>
            <p className="text-sm text-gray-500">Tous nos parfums sont authentiques et scellés.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <Truck size={32} />
            </div>
            <h4 className="font-bold mb-2">Paiement à la Livraison</h4>
            <p className="text-sm text-gray-500">Ne payez que lorsque vous recevez votre commande en main propre.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
              <Star size={32} />
            </div>
            <h4 className="font-bold mb-2">Service Premium</h4>
            <p className="text-sm text-gray-500">Plus de 5000 clients satisfaits à travers le Maroc.</p>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 lg:hidden z-50">
        <a href="#offres" className="flex items-center justify-center w-full bg-red-600 text-white py-4 rounded-xl text-[12px] font-bold tracking-[0.1em] uppercase shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse">
          Profiter de l'Offre Maintenant
        </a>
      </div>

      <LandingFooter />
    </div>
  );
}
