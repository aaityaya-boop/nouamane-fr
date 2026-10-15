import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  return {
    title: 'Conditions Générales de Vente',
    description: 'Conditions générales de vente de la boutique en ligne NAY Parfums au Maroc.',
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/legal/terms`,
    },
  };
}

export default function TermsPage() {
  return (
    <div className="bg-[#fafaf7] min-h-screen text-[#1A1A1A]">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-32 lg:py-48">
        <h1 className="heading-font text-4xl lg:text-5xl mb-10">Conditions Générales de Vente</h1>
        
        <div className="space-y-8 text-[15px] leading-relaxed text-[#6B6B6B]">
          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">1. Objet</h2>
            <p>Les présentes Conditions Générales de Vente (CGV) régissent les ventes de parfums sur le site NAY Parfums. En validant votre commande, vous acceptez sans réserve ces conditions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">2. Produits</h2>
            <p>Les produits proposés sont des parfums 100% authentiques provenant des distributeurs officiels au Maroc. Les photographies sont les plus fidèles possibles mais n'ont pas de valeur contractuelle.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">3. Prix</h2>
            <p>Les prix de nos produits sont indiqués en Dirham Marocain (MAD), toutes taxes comprises. NAY Parfums se réserve le droit de modifier ses prix à tout moment.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">4. Commandes et Paiement</h2>
            <p>Le paiement s'effectue exclusivement à la livraison (Cash on Delivery). Le client s'engage à payer le montant exact indiqué lors de la validation de la commande au livreur.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">5. Livraison</h2>
            <p>La livraison est effectuée partout au Maroc. Les frais de livraison sont ajoutés au total de la commande avant validation finale. Les délais de livraison moyens sont de 24 à 48 heures ouvrées.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
