import { Product } from '@/lib/products';

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Generates dynamic, keyword-rich and factually accurate FAQ items for Moroccan product search intent.
 */
export function getProductFaq(product: Product): FaqItem[] {
  const isTester = product.isTester ?? true;
  const productType = isTester ? 'testeur' : 'parfum';
  const productTypeCap = isTester ? 'Testeur Original' : 'Parfum Original Scellé';
  const brand = product.brandLabel || 'la marque';
  const family = product.subcategoryLabel || 'Fragrance de prestige';

  const notesList: string[] = [];
  if (product.notes?.top?.length) {
    notesList.push(`Notes de tête : ${product.notes.top.slice(0, 4).join(', ')}`);
  }
  if (product.notes?.heart?.length) {
    notesList.push(`Notes de cœur : ${product.notes.heart.slice(0, 4).join(', ')}`);
  }
  if (product.notes?.base?.length) {
    notesList.push(`Notes de fond : ${product.notes.base.slice(0, 4).join(', ')}`);
  }
  const notesText = notesList.length > 0 ? notesList.join(' · ') + '.' : 'Composition riche en essences rares et précieuses.';

  return [
    {
      question: `Le ${productType} de ${product.name} est-il 100% original ?`,
      answer: `Oui, le ${productType} de ${product.name} par ${brand} vendu sur NAY Parfum est 100% authentique. Il contient exactement le même jus, la même concentration et la même tenue olfactive que le flacon commercial sous blister, vérifiable par son code de lot (batch code) officiel.`
    },
    {
      question: `Quels sont les délais et tarifs de livraison pour ${product.name} au Maroc ?`,
      answer: `La livraison au Maroc est assurée en 24h à 48h ouvrables à Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir et dans toutes les villes du royaume. Les frais de livraison sont de 35 MAD, et la livraison est 100% offerte dès 800 MAD d'achat.`
    },
    {
      question: `Comment se déroule le paiement de ma commande ?`,
      answer: `Vous bénéficiez du paiement sécurisé à la livraison (Cash on Delivery). Vous ne payez qu'après réception de votre colis en espèces auprès de notre livreur partenaire au Maroc.`
    },
    {
      question: `Quelle est la pyramide olfactive et la tenue de ${product.name} sous le climat marocain ?`,
      answer: `${product.name} (${family}) offre une tenue remarquable de 8h à 12h+ et un sillage affirmé. ${notesText} Sa formule résiste idéalement aux températures et à l'hygrométrie du climat marocain.`
    }
  ];
}

/**
 * Generates dynamic FAQ items for Brand landing pages.
 */
export function getBrandFaq(brandLabel: string): FaqItem[] {
  return [
    {
      question: `Où acheter des testeurs et parfums ${brandLabel} 100% originaux au Maroc ?`,
      answer: `NAY Parfum propose une collection exclusive de parfums et testeurs ${brandLabel} 100% originaux au Maroc. Tous nos flacons proviennent directement des circuits agréés et sont disponibles au meilleur prix en MAD avec livraison express à domicile.`
    },
    {
      question: `Quelle est la différence entre un testeur ${brandLabel} et un flacon sous blister ?`,
      answer: `Le jus, la concentration et la tenue d'un testeur ${brandLabel} sont rigoureusement identiques à la version commerciale scellée. La seule différence réside dans le packaging (boîte de testeur économique), vous permettant de réaliser une économie de 30% à 50% sur le tarif boutique au Maroc.`
    },
    {
      question: `Quels sont les modes de paiement et garanties pour les parfums ${brandLabel} ?`,
      answer: `Nous garantissons l'authenticité intégrale de chaque flacon ${brandLabel} avec un délai de rétractation de 7 jours. Le règlement s'effectue en espèces à la livraison (Cash on Delivery) après réception de votre colis partout au Maroc.`
    }
  ];
}

/**
 * Generates dynamic FAQ items for Category & Testeurs collection pages.
 */
export function getCategoryFaq(categoryLabel: string, isTester: boolean = true): FaqItem[] {
  const typeText = isTester ? 'testeurs de parfums' : 'parfums originaux';
  return [
    {
      question: `Pourquoi acheter des ${typeText} ${categoryLabel.toLowerCase()} chez NAY Parfum Maroc ?`,
      answer: `NAY Parfum sélectionne rigoureusement les meilleurs ${typeText} ${categoryLabel.toLowerCase()} des plus grandes maisons de luxe mondiales. Chaque flacon est 100% authentique, vérifié par son batch code, proposé au meilleur prix en MAD avec livraison express au Maroc.`
    },
    {
      question: `Les ${typeText} ont-ils la même tenue et projection ?`,
      answer: `Absolument. Les testeurs sont fabriqués dans les mêmes usines et sur les mêmes lignes de production que les flacons grand public. La concentration en huiles parfumées et la pyramide olfactive sont 100% identiques.`
    },
    {
      question: `Quelles sont les conditions de livraison et de paiement au Maroc ?`,
      answer: `Livraison rapide en 24h à 48h sur Casablanca, Rabat, Marrakech, Tanger, Fès, Meknès, Oujda, Agadir et tout le Maroc. Paiement en espèces à la livraison (COD) et livraison offerte dès 800 MAD d'achat.`
    }
  ];
}

/**
 * Builds Schema.org FAQPage JSON-LD.
 */
export function createFaqJsonLd(faqItems: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
