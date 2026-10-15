import React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  return {
    title: 'Politique de Retours et Remboursements',
    description: 'Politique de retour sous 7 jours et conditions d’échange chez NAY Parfums au Maroc.',
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/legal/returns`,
    },
  };
}

export default function ReturnsPage() {
  return (
    <div className="bg-[#fafaf7] min-h-screen text-[#1A1A1A]">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-32 lg:py-48">
        <h1 className="heading-font text-4xl lg:text-5xl mb-10">Politique de Retours et Remboursements</h1>
        
        <div className="space-y-8 text-[15px] leading-relaxed text-[#6B6B6B]">
          
          <p className="text-lg text-[#1A1A1A] font-medium">
            Chez Nayparfum, votre satisfaction est au cœur de notre engagement. Nous comprenons que le choix d'un parfum est une expérience très personnelle. C'est pourquoi nous avons repensé notre politique de retour pour allier flexibilité et accompagnement sur-mesure.
          </p>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">1. Retour sous 7 Jours &amp; Consultation Personnalisée</h2>
            <p>
              Vous disposez d'un délai de <strong>7 jours</strong> à compter de la date de réception de votre commande pour effectuer une demande de retour. 
            </p>
            <p className="mt-2">
              Chez Nayparfum, nous ne traitons pas les retours comme de simples transactions. Toute demande de retour donne lieu à une <strong>consultation personnalisée avec l'un de nos experts</strong>. Notre objectif ? Comprendre exactement pourquoi le produit ne vous a pas convenu afin de mieux vous guider et vous conseiller la fragrance qui correspondra parfaitement à votre profil olfactif.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">2. Conditions d'éligibilité</h2>
            <p>Afin de préserver nos standards d'hygiène stricts et de garantir l'authenticité de nos produits à tous nos clients, les retours ne sont acceptés que sous les conditions suivantes :</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>L'article doit être renvoyé dans son emballage d'origine, intact et parfaitement scellé (blister non ouvert).</li>
              <li>Le produit ne doit en aucun cas avoir été utilisé ou testé.</li>
            </ul>
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-md text-red-900/80">
              <span className="font-semibold block mb-1">Attention :</span>
              Un parfum dont le film plastique (blister) a été retiré ou endommagé, même s'il n'a jamais été vaporisé, ne pourra malheureusement ni être repris, ni échangé, ni remboursé.
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">3. La procédure de retour étape par étape</h2>
            <ul className="list-decimal pl-5 space-y-2">
              <li><strong>Contactez-nous :</strong> Écrivez à notre service client (via WhatsApp ou e-mail) dans les 7 jours suivant votre livraison.</li>
              <li><strong>La Consultation :</strong> Un membre de l'équipe Nayparfum vous contactera pour échanger avec vous sur votre commande.</li>
              <li><strong>L'Expédition :</strong> Une fois le retour approuvé, nous vous communiquerons les modalités d'expédition. (Veuillez noter que les frais de retour pour convenance personnelle restent à la charge de l'acheteur).</li>
              <li><strong>Le Remboursement :</strong> Dès réception et inspection de l'article dans nos entrepôts, nous procéderons à l'échange ou au remboursement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">4. Anomalie ou produit défectueux (Garantie Qualité)</h2>
            <p>L'excellence est notre norme. Si vous constatez le moindre problème avec votre parfum (produit endommagé pendant le transport, défaut de fabrication, ou erreur de préparation), contactez-nous immédiatement (dans les 48 heures suivant la réception).</p>
            <p className="mt-2 font-medium">Dans ce cas exceptionnel, Nayparfum prendra intégralement à sa charge les frais de retour et vous proposera deux options au choix :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Le remboursement intégral</strong> de votre commande.</li>
              <li><strong>L'échange immédiat</strong> contre le même produit, ou contre <strong>un autre parfum de votre choix</strong> (avec ajustement de la différence de prix le cas échéant).</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
