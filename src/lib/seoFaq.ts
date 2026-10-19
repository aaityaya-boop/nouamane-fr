import { Product } from '@/lib/products';

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Generates dynamic, keyword-rich and factually accurate FAQ items for Moroccan product search intent.
 */
export function getProductFaq(product: Product, locale: string = 'fr'): FaqItem[] {
  const isTester = product.isTester ?? true;
  const brand = product.brandLabel || 'la marque';
  const family = product.subcategoryLabel || 'Fragrance de prestige';

  if (locale === 'ar') {
    const productTypeAr = isTester ? 'تستر' : 'عطر';
    return [
      {
        question: `هل ${productTypeAr} عطر ${product.name} أصلي ومضمون 100%؟`,
        answer: `نعم، ${productTypeAr} عطر ${product.name} من دار ${brand} المعروض لدى NAY Parfum أصلي 100%. يحتوي تماماً على نفس العطر ونفس التركيز ودرجة الثبات كالزجاجة التجارية، مع إمكانية التحقق من كود الدفعة الرسمي (batch code) المحفور على القارورة.`
      },
      {
        question: `ما هي مدة وتكلفة التوصيل لعطر ${product.name} في المغرب؟`,
        answer: `يتم التوصيل في المغرب خلال 24 إلى 48 ساعة عمل إلى الدار البيضاء، الرباط، مراكش، فاس، طنجة، أكادير وكافة المدن المغربية. تكلفة الشحن 35 درهم، والتوصيل مجاني 100% للطلبات ابتداءً من 800 درهم.`
      },
      {
        question: `كيف تتم عملية الدفع عند استلام الطلب؟`,
        answer: `تستفيد من ميزة الدفع الآمن نقداً عند الاستلام (Cash on Delivery). لا تدفع أي مبلغ مسبقاً بل تدفع بعد استلام وفحص طردك مباشرة من موزعنا المعتمد بالمغرب.`
      },
      {
        question: `ما هي درجة ثبات ${product.name} في المناخ المغربي؟`,
        answer: `يتميز ${product.name} بثبات استثنائي يدوم من 8 إلى 12 ساعة وأكثر على البشرة والملابس مع فوحان جذاب. صُممت تركيبته لتلائم درجات الحرارة والرطوبة في المناخ المغربي بأناقة تدوم طوال اليوم.`
      }
    ];
  }

  if (locale === 'en') {
    const productTypeEn = isTester ? 'tester' : 'fragrance';
    return [
      {
        question: `Is the ${productTypeEn} of ${product.name} 100% authentic?`,
        answer: `Yes, the ${productTypeEn} of ${product.name} by ${brand} sold on NAY Parfum is 100% authentic. It contains the exact same formulation, concentration, and longevity as the commercial boxed version, verified by its official batch code.`
      },
      {
        question: `What are the delivery times and shipping fees for ${product.name} in Morocco?`,
        answer: `Delivery across Morocco takes 24h to 48h to Casablanca, Rabat, Marrakech, Fes, Tangier, Agadir and all cities. Shipping is 35 MAD, and completely free on orders above 800 MAD.`
      },
      {
        question: `How does payment work for my order?`,
        answer: `You enjoy secure Cash on Delivery (COD). You only pay in cash upon receiving and inspecting your package directly from our courier partner in Morocco.`
      },
      {
        question: `What is the longevity and performance of ${product.name} in Moroccan climate?`,
        answer: `${product.name} offers remarkable longevity of 8h to 12h+ on skin and clothes with a refined trail. Its balanced formula perfectly withstands Morocco's climate conditions.`
      }
    ];
  }

  const productType = isTester ? 'testeur' : 'parfum';
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
 * Generates dynamic FAQ items for Parfums Originaux (scellés) collection page.
 */
export function getOriginauxCategoryFaq(): FaqItem[] {
  return [
    {
      question: "Vos parfums scellés sont-ils 100% originaux et garantis ?",
      answer: "Absolument. Tous les parfums proposés sur NAY Parfum proviennent de circuits de distribution agréés en Europe. Chaque flacon est livré dans son emballage d'origine scellé sous cellophane avec code de lot (batch code) officiel vérifiable."
    },
    {
      question: "Quelle est la différence entre un parfum original scellé et un testeur ?",
      answer: "Le jus, la concentration d'essence et le flacon en verre sont strictement identiques. Le parfum original scellé comprend le coffret commercial complet de luxe, idéal pour offrir en cadeau. Le testeur est livré dans un carton neutre, offrant une économie de 30% à 50% pour un usage personnel."
    },
    {
      question: "Quels sont les délais et tarifs de livraison au Maroc ?",
      answer: "La livraison est effectuée en 24h à 48h ouvrables à Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir et partout au Maroc. Les frais de port s'élèvent à 35 MAD et la livraison est 100% gratuite dès 800 MAD d'achat."
    },
    {
      question: "Comment régler ma commande en toute sécurité ?",
      answer: "Vous bénéficiez du paiement en espèces à la livraison (Cash on Delivery). Vous réglez directement auprès du transporteur après avoir reçu et inspecté votre colis."
    }
  ];
}

/**
 * Generates dynamic FAQ items for Parfums Orientaux collection page.
 */
export function getOrientalCategoryFaq(): FaqItem[] {
  return [
    {
      question: "Pourquoi les parfums orientaux sont-ils si populaires au Maroc ?",
      answer: "La parfumerie orientale est intimement liée à l'art de vivre marocain. Riches en bois de oud noble, ambre chaud, fève tonka et épices précieuses, les parfums orientaux offrent une signature olfactive envoûtante, un sillage affirmé et une tenue remarquable de plus de 12 heures."
    },
    {
      question: "Quelle est la différence entre un parfum occidental et un parfum oriental ?",
      answer: "Les créations occidentales privilégient généralement les notes de tête hespéridées ou florales légères, tandis que les parfums orientaux s'appuient sur des matières premières denses et chaleureuses (résines, encens, cuir, vanille, ambre gris) qui projettent avec puissance et évoluent harmonieusement sur la peau."
    },
    {
      question: "Comment porter un parfum oriental sous le climat marocain ?",
      answer: "Durant les saisons fraîches (automne et hiver) ou en soirée, les parfums orientaux s'expriment à merveille. Lors des fortes chaleurs estivales, privilégiez une application modérée sur les vêtements ou choisissez des compositions équilibrées avec des notes fraîches (rose, bergamote, fruits méditerranéens)."
    },
    {
      question: "Quelles sont les conditions de commande et de paiement au Maroc ?",
      answer: "NAY Parfum expédie votre commande en 24h à 48h partout au Maroc avec suivi de livraison et paiement en espèces à la réception (Cash on Delivery) pour une tranquillité d'esprit absolue."
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
