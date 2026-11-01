'use client';

import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, Truck, Sparkles, RefreshCw, HelpCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

interface FAQLocaleData {
  helpCenter: string;
  title: string;
  subtitle: string;
  filterAll: string;
  items: FAQItem[];
}

const FAQ_DATA: Record<string, FAQLocaleData> = {
  fr: {
    helpCenter: "Centre d'Aide & Transparence",
    title: "Questions Fréquentes & Conseils",
    subtitle: "Toutes les réponses claires sur nos parfums, nos testeurs, la livraison express et l'inspection de votre colis au Maroc.",
    filterAll: "Toutes les questions",
    items: [
      {
        category: 'Parfums & Testeurs',
        question: "Qu'est-ce qu'un testeur de parfum et pourquoi est-il proposé à prix avantageux ?",
        answer: "Un testeur de parfum est un flacon dédié à la découverte olfactive, conditionné en boîte neutre protectrice (blanche ou kraft). Il offre un sillage intense et une excellente tenue tout en supprimant le surcoût des coffrets de luxe commerciaux et des intermédiaires, ce qui vous permet de profiter de fragrances de renom à des tarifs particulièrement avantageux.",
      },
      {
        category: 'Parfums & Testeurs',
        question: "Comment vérifier le flacon et les détails de mon parfum ?",
        answer: "Chaque flacon dispose de ses références olfactives et indications de fabrication gravées au laser ou imprimées sur le flacon et son étui. Nous vous encourageons à vérifier la qualité du spray, l'intégrité de la bouteille et son sillage dès réception.",
      },
      {
        category: 'Livraison & Contrôle',
        question: "Puis-je ouvrir et inspecter mon colis avant de payer le livreur au Maroc ?",
        answer: "Oui, absolument ! Chez NAY Parfums, nous appliquons une politique de transparence totale : vous avez le droit d'ouvrir le carton d'expédition devant le coursier, de vérifier le flacon et son intégrité avant de régler le montant en espèces. C'est l'assurance d'un achat 100% serein et sans risque partout au Maroc.",
      },
      {
        category: 'Livraison & Contrôle',
        question: "Quelles sont les villes couvertes au Maroc et quels sont les délais de livraison ?",
        answer: "Nous livrons dans l'ensemble du Royaume du Maroc. Livraison express en 24h à 48h pour Casablanca, Rabat-Salé, Marrakech, Tanger, Fès, Meknès, Agadir, Kénitra, Tétouan, Mohammedia, El Jadida et Oujda. Pour les autres villes et provinces (Béni Mellal, Nador, Laâyoune, Dakhla, Taroudant...), la livraison s'effectue en 48h à 72h ouvrables avec suivi d'expédition et appel du livreur avant livraison.",
      },
      {
        category: 'Formulations & Performance',
        question: "Quelle est la différence entre une Eau de Toilette (EDT), une Eau de Parfum (EDP) et un Extrait de Parfum ?",
        answer: "La différence réside dans le pourcentage de concentration en huiles parfumées pures : l'Eau de Toilette (EDT, 8 à 12%) est fraîche et légère, idéale pour le jour ou l'été ; l'Eau de Parfum (EDP, 15 à 20%) offre une intensité remarquable et une tenue de 8 à 12 heures, c'est le choix le plus plébiscité ; l'Extrait de Parfum / Parfum (20 à 40%) est la formulation la plus noble et concentrée, laissant un sillage majestueux qui persiste plus de 24 heures sur peau et vêtements.",
      },
      {
        category: 'Formulations & Performance',
        question: "La tenue et le sillage d'un testeur sont-ils performants ?",
        answer: "Oui, tout à fait. Nos flacons testeurs sont rigoureusement sélectionnés pour leur sillage généreux et leur excellente tenue (8 à 12 heures pour une Eau de Parfum), vous garantissant une expérience olfactive riche et fidèle.",
      },
      {
        category: 'Paiement & Retours',
        question: "Comment se déroule le paiement à la livraison (Cash on Delivery) ?",
        answer: "Le règlement se fait exclusivement en espèces (Dirham marocain — MAD) à la remise du colis en main propre. Aucun paiement par carte bancaire n'est requis sur le site internet. Vous commandez en quelques clics sans engagement préalable et vous réglez uniquement après vérification de votre commande auprès du coursier.",
      },
      {
        category: 'Paiement & Retours',
        question: "Quelle est votre politique de garantie et de remplacement si le flacon est endommagé ?",
        answer: "Votre satisfaction est garantie. En cas de dommage durant l'acheminement ou de non-conformité constatée, vous disposez de 7 jours après livraison pour nous contacter via WhatsApp (+212 663-380011). NAY Parfums prend en charge l'intégralité des frais de retour et expédie immédiatement un nouveau flacon de remplacement ou effectue un remboursement total selon votre choix.",
      },
      {
        category: 'Entretien & Climat',
        question: "Comment bien conserver ses parfums face à la chaleur et au climat marocain ?",
        answer: "Le soleil direct et les températures élevées sont les deux ennemis des huiles essentielles. Au Maroc, nous conseillons de ranger vos flacons dans un endroit frais, sec et sombre, idéalement un tiroir, un dressing ou une pièce tempérée (18°C-22°C). Ne laissez jamais vos flacons dans une voiture stationnée au soleil ou sur l'étagère humide d'une salle de bain.",
      },
      {
        category: 'Entretien & Climat',
        question: "Comment maximiser la tenue de son parfum tout au long de la journée ?",
        answer: "Appliquez sur les zones de pulsation thermique où les vaisseaux sanguins affleurent : la base du cou, derrière les lobes d'oreilles, sur le torse et l'intérieur des poignets (sans les frotter pour ne pas briser les molécules). Une peau bien hydratée retient le parfum deux fois plus longtemps : appliquez-le idéalement juste après la douche.",
      },
    ]
  },
  ar: {
    helpCenter: "مركز المساعدة والخدمات",
    title: "الأسئلة الشائعة والإرشادات",
    subtitle: "إجابات واضحة ومفصلة حول عطورنا، تسترات العطور الفاخرة، التوصيل السريع ومعاينة الطرد قبل الدفع بالمغرب.",
    filterAll: "جميع الأسئلة",
    items: [
      {
        category: 'العطور والتسترات',
        question: "ما هو عطر التيستر (Tester) ولماذا يتوفر بسعر اقتصادي مناسب؟",
        answer: "عطر التيستر (Tester) هو قنينة مخصصة للتجربة والاستخدام الشخصي، تأتي في علبة كرتونية بسيطة بدون تكاليف التغليف الباذخ والعلب التجارية. يوفر ثباتاً ممتازاً وفوحاناً قوياً وبنفس الطابع العطري المميز، مما يتيح لك الاستمتاع بعطورك المفضلة بأسعار اقتصادية وجودة عالية.",
      },
      {
        category: 'العطور والتسترات',
        question: "كيف يمكنني معاينة جودة العطر والتأكد من تفاصيله؟",
        answer: "تحمل القنينات تفاصيلها وسعتها ورموزها، ونحن نضمن لكم معاينة القنينة وفحصها والتأكد من حالتها ورائحتها فور استلامها من الموزع وقبل سداد المبلغ.",
      },
      {
        category: 'التوصيل والمعاينة بالمغرب',
        question: "هل يمكنني فتح الطرد ومعاينة القنينة قبل دفع المبلغ للموزع في المغرب؟",
        answer: "نعم، بالتأكيد! نحن في NAY Parfums نعتمد سياسة الثقة والشفافية التامة: يحق لك فتح كرتون الشحن أمام موزع التوصيل، ومعاينة القنينة والتأكد من سلامتها وجودتها قبل تسليم المبلغ نقداً. نضمن لك تجربة شراء آمنة 100% وخالية من أي مخاطرة في جميع أنحاء المغرب.",
      },
      {
        category: 'التوصيل والمعاينة بالمغرب',
        question: "ما هي المدن المشمولة بالتوصيل في المغرب وكم تستغرق مدة الطلب؟",
        answer: "نوفر التوصيل لكافة مدن وأقاليم المملكة المغربية. التوصيل سريع خلال 24 إلى 48 ساعة في الدار البيضاء الكبرى، الرباط، سلا، مراكش، طنجة، فاس، مكناس، أكادير، القنيطرة، تطوان، المحمدية، الجديدة، ووجدة. أما باقي المدن والمناطق (بني ملال، الناظور، العيون، الداخلة، تارودانت...) فيتم التوصيل خلال 48 إلى 72 ساعة عمل مع اتصال هاتفي من الموزع قبل الوصول.",
      },
      {
        category: 'التركيز والتركيبة',
        question: "ما هو الفرق بين ماء التواليت (EDT) وماء العطر (EDP) وخلاصة العطر (Parfum/Extrait)؟",
        answer: "الفرق يكمن في نسبة تركيز الزيوت العطرية النقية: ماء التواليت (EDT بنسبة 8-12%) خفيف ومنعش ومثالي للنهار أو الصيف؛ ماء العطر (EDP بنسبة 15-20%) يوفر ثباتاً ممتازاً من 8 إلى 12 ساعة وهو الخيار الأكثر طلباً وملاءمة للمناسبات؛ أما خلاصة العطر (Parfum / Extrait بنسبة 20-40%) فهي أرقى وأقوى درجات التركيز ويترك فوحاناً استثنائياً يدوم أكثر من 24 ساعة على البشرة والملابس.",
      },
      {
        category: 'التركيز والتركيبة',
        question: "هل ثبات وفوحان عطر التيستر قوي ويدوم طويلاً؟",
        answer: "نعم، يتم اختيار كافة عطور التيستر لدينا بعناية فائقة لضمان ثبات عالي وفوحان ملموس يدوم طوال اليوم على البشرة والملابس ليمنحكم حضوراً جذاباً.",
      },
      {
        category: 'الدفع والإرجاع',
        question: "كيف تتم عملية الدفع عند الاستلام (Cash on Delivery)؟",
        answer: "يتم الدفع نقداً بالدرهم المغربي (MAD) فقط عند استلام طلبيتك بين يديك مباشرة. لا يتطلب الموقع أي دفع مسبق بالبطاقة البنكية. تسجل طلبك في ثوانٍ معدودة، ولا تدفع للموزع إلا بعد استلام الطرد والتأكد من محتواه.",
      },
      {
        category: 'الدفع والإرجاع',
        question: "ما هي سياسة الضمان والاستبدال في حال وجود أي ضرر أثناء الشحن؟",
        answer: "رضاكم التام مضمون. في حال حدوث أي تلف أثناء الشحن أو عدم مطابقة للمواصفات، تتوفر لديك مهلة 7 أيام للتواصل معنا عبر واتساب (+212 663-380011). تتحمل NAY Parfums كافة تكاليف الشحن وتوفر لك فوراً إما إرسال قنينة بديلة جديدة أو استرجاع المبلغ كاملاً وفق رغبتك.",
      },
      {
        category: 'العناية والمناخ',
        question: "كيف أحافظ على جودة العطور في ظل حرارة الطقس والمناخ بالمغرب؟",
        answer: "أشعة الشمس المباشرة والحرارة المرتفعة تسرع تفكك الجزيئات العطرية الحساسة. ننصح دائماً بحفظ العطور في مكان مظلم وجاف ومعتدل الحرارة (بين 18 و 22 درجة مئوية) كخزانة الملابس أو الدرج. تجنب تماماً ترك العطور في درج السيارة أو على رفوف الحمام المعرضة للبخار والحرارة المتغيرة.",
      },
      {
        category: 'العناية والمناخ',
        question: "كيف أجعل ثبات العطر يدوم لأطول فترة ممكنة على الجلد؟",
        answer: "رش العطر على نقاط النبض الدافئة التي تساعد على انتشار الجزيئات: جانبي الرقبة، خلف الأذنين، ومنطقة المعصمين (دون فركها لمنع تكسير الروابط العطرية). البشرة الرطبة تحتفظ بالعطر مرتين أطول مقارنة بالبشرة الجافة، لذا يفضل وضعه بعد الاستحمام مباشرة أو بعد استخدام مرطب خفيف بدون رائحة.",
      },
    ]
  },
  en: {
    helpCenter: "Help Center & Advice",
    title: "Frequently Asked Questions",
    subtitle: "Clear answers regarding our luxury perfumes, premium testers, express Morocco shipping, and inspecting your order before cash payment.",
    filterAll: "All questions",
    items: [
      {
        category: 'Fragrances & Testers',
        question: "What is a perfume tester and why is it attractively priced?",
        answer: "A perfume tester is a display flacon packaged in a simple neutral carton. It delivers intense projection and strong longevity without the markup of retail luxury gift packaging, offering an outstanding fragrance experience at a fraction of the cost.",
      },
      {
        category: 'Fragrances & Testers',
        question: "How can I verify the bottle and details of my perfume?",
        answer: "Each bottle bears its production references and capacity markings. We invite you to inspect the bottle's spray quality, glass integrity, and sillage upon delivery before paying the courier.",
      },
      {
        category: 'Shipping & Inspection',
        question: "Can I open and inspect my package before paying cash on delivery in Morocco?",
        answer: "Yes, absolutely! At NAY Parfums, we prioritize client trust: you are entitled to open the shipping carton in front of the courier, inspect the bottle and check its condition before handing over cash payment. 100% risk-free shopping across Morocco.",
      },
      {
        category: 'Shipping & Inspection',
        question: "Which Moroccan cities do you deliver to and what are the delivery times?",
        answer: "We deliver across all Moroccan regions. Express shipping takes 24 to 48 hours for Casablanca, Rabat-Salé, Marrakech, Tangier, Fès, Meknès, Agadir, Kenitra, Tetouan, Mohammedia, El Jadida, and Oujda. For other cities and provinces (Beni Mellal, Nador, Laâyoune, Dakhla, Taroudant...), delivery takes 48 to 72 business hours with dispatch tracking and a phone call prior to arrival.",
      },
      {
        category: 'Formulations & Performance',
        question: "What is the difference between Eau de Toilette (EDT), Eau de Parfum (EDP), and Extrait de Parfum?",
        answer: "The distinction lies in perfume oil concentration: Eau de Toilette (EDT, 8–12%) is light and crisp, ideal for daily office or summer wear; Eau de Parfum (EDP, 15–20%) provides rich projection lasting 8–12 hours, making it the most popular choice; Extrait de Parfum / Parfum (20–40%) is the most precious concentration, leaving an opulent sillage that lingers for over 24 hours on skin and fabrics.",
      },
      {
        category: 'Formulations & Performance',
        question: "How do testers perform in terms of longevity and projection?",
        answer: "Our tester flacons are strictly selected for their rich, powerful projection and long-lasting persistence (8 to 12 hours for Eau de Parfum), ensuring a memorable fragrance experience.",
      },
      {
        category: 'Payment & Returns',
        question: "How does Cash on Delivery (COD) payment work in Morocco?",
        answer: "Payment is completed strictly in Moroccan Dirhams (MAD) in cash upon receiving your package in your hands. No credit card or online pre-payment is needed. You place your order in 30 seconds and only pay the delivery agent once your package is physically handed over and inspected.",
      },
      {
        category: 'Payment & Returns',
        question: "What is your warranty and replacement policy if an item arrives damaged?",
        answer: "Your satisfaction is unconditionally guaranteed. If your bottle sustains any damage in transit or presents an irregularity, you have 7 days from delivery to notify us on WhatsApp (+212 663-380011). NAY Parfums assumes 100% of return shipping costs and will immediately ship a brand-new replacement bottle or issue a full refund according to your preference.",
      },
      {
        category: 'Care & Climate',
        question: "How should I store luxury perfumes in Morocco's warm climate?",
        answer: "Intense sunlight and elevated temperatures accelerate the breakdown of delicate natural citrus and floral molecules. In Morocco, we recommend storing your bottles in a cool, dark place away from direct sunlight (18°C–22°C), such as an enclosed closet, dresser, or temperature-controlled bedroom. Never leave perfume bottles inside a parked car in the sun or on a humid bathroom shelf.",
      },
      {
        category: 'Care & Climate',
        question: "How can I maximize my perfume's longevity and scent trail on skin?",
        answer: "Spray onto pulse points where blood vessels radiate body heat: the sides of your neck, behind ear lobes, on the collarbone, and inside wrists (never rub wrists together as friction fractures top notes). Moisturized skin holds perfume twice as long as dry skin, so applying immediately after a shower yields optimal performance.",
      },
    ]
  }
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const pathname = usePathname();
  
  const locale = (pathname?.split('/')[1] || 'fr') as keyof typeof FAQ_DATA;
  const data = FAQ_DATA[locale] || FAQ_DATA['fr'];
  const isAr = locale === 'ar';

  const categories = Array.from(new Set(data.items.map(item => item.category)));

  const filteredItems = selectedCategory === 'all' 
    ? data.items 
    : data.items.filter(item => item.category === selectedCategory);

  // Schema.org FAQPage JSON-LD for Search Engines and AI Overviews (Google, Perplexity, Claude, ChatGPT Search)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.items.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <section className="relative overflow-hidden bg-white text-slate-900 py-20 lg:py-28 border-t border-slate-200/80">
      {/* Dynamic JSON-LD structured data for FAQ Rich Snippets and LLMs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Subtle Sky Blue Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#0ea5e9]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-[960px] mx-auto px-6 lg:px-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-100/80 text-[10.5px] font-bold tracking-[0.2em] uppercase text-[#0ea5e9] mb-4">
            <ShieldCheck size={14} className="text-[#0ea5e9]" />
            <span>{data.helpCenter}</span>
          </div>
          <h2 className="heading-font text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 leading-tight">
            {data.title}
          </h2>
          <p className="mt-4 text-slate-600 text-[14.5px] sm:text-[15.5px] leading-relaxed font-normal">
            {data.subtitle}
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setOpenIndex(0);
            }}
            className={`px-4 py-2 rounded-full text-[12px] font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            {data.filterAll}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setOpenIndex(0);
              }}
              className={`px-4 py-2 rounded-full text-[12px] font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0ea5e9] text-white shadow-sm shadow-[#0ea5e9]/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion Items */}
        <div className="grid gap-3.5">
          {filteredItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'border-[#0ea5e9]/40 bg-white shadow-[0_8px_25px_rgba(14,165,233,0.06)] ring-1 ring-[#0ea5e9]/20'
                    : 'border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-5 px-6 lg:px-8 py-5 sm:py-6 text-left rtl:text-right transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="pr-2 rtl:pr-0 rtl:pl-2">
                    <span className="inline-block text-[10px] font-bold tracking-[0.16em] uppercase text-[#0ea5e9] mb-1.5">
                      {item.category}
                    </span>
                    <h3 className="text-[16px] sm:text-[17.5px] font-bold text-slate-950 leading-snug">
                      {item.question}
                    </h3>
                  </div>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isOpen ? 'bg-[#0ea5e9] text-white rotate-180' : 'bg-white border border-slate-200 text-slate-600'
                  }`}>
                    <ChevronDown size={18} />
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 lg:px-8 pb-6 pt-1 text-[14px] sm:text-[14.5px] leading-relaxed text-slate-600 border-t border-slate-100">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Direct WhatsApp Verification Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left rtl:sm:text-right">
            <div className="w-12 h-12 rounded-full bg-[#0ea5e9]/20 border border-[#0ea5e9]/40 flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} className="text-[#0ea5e9]" />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-white">
                {isAr ? 'هل لديك استفسار حول عطر معين أو كود دفعة؟' : 'Une question sur un parfum ou un Batch Code spécifique ?'}
              </h4>
              <p className="text-[12.5px] text-slate-400 mt-0.5">
                {isAr ? 'فريقنا متاح عبر واتساب لتقديم صور حقيقية فورية للقنينة المتوفرة بالمخزن.' : 'Notre équipe vous répond sur WhatsApp avec des photos réelles du flacon en stock.'}
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/212663380011?text=Bonjour,%20je%20souhaite%20des%20informations%20sur%20un%20parfum%20NAY"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-[12.5px] font-bold transition-colors whitespace-nowrap shadow-md shadow-[#0ea5e9]/30"
          >
            <span>{isAr ? 'تواصل عبر واتساب' : 'Conseil Personnalisé'}</span>
          </a>
        </div>

      </div>
    </section>
  );
}
