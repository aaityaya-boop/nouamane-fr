import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  return {
    title: 'Politique de Confidentialité',
    description: 'Politique de confidentialité et protection des données personnelles de NAY Parfums.',
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/legal/privacy`,
    },
  };
}

export default function PrivacyPage() {
  return (
    <div className="bg-[#fafaf7] min-h-screen text-[#1A1A1A]">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-32 lg:py-48">
        <h1 className="heading-font text-4xl lg:text-5xl mb-10">Politique de Confidentialité</h1>
        
        <div className="space-y-8 text-[15px] leading-relaxed text-[#6B6B6B]">
          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">1. Collecte des données personnelles</h2>
            <p>Nous collectons les données suivantes lors de votre commande : nom, prénom, adresse e-mail, numéro de téléphone, et adresse postale. Ces données sont strictement nécessaires au traitement et à l'expédition de votre commande.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">2. Utilisation des données</h2>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Traiter et expédier vos commandes.</li>
              <li>Vous contacter concernant votre commande ou pour le suivi de livraison.</li>
              <li>Vous envoyer notre newsletter si vous y avez explicitement souscrit.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">3. Protection de vos données</h2>
            <p>NAY Parfums met en œuvre toutes les mesures de sécurité nécessaires pour protéger vos données contre tout accès non autorisé. Vos données ne sont jamais vendues ou cédées à des tiers, à l'exception de nos prestataires de livraison.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">4. Vos droits</h2>
            <p>Conformément à la loi en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ce droit en nous contactant à l'adresse email : contact@nayparfum.ma.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
