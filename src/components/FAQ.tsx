
'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';

const FAQ_DATA = {
  en: {
    helpCenter: "Help Center",
    title: "Frequently Asked Questions",
    subtitle: "Clear answers for designer perfume shoppers. Authenticity, delivery, returns, payment, and care — everything you need to know.",
    items: [
      {
        category: 'Authenticity',
        question: 'Are these perfumes real or authentic?',
        answer: 'Every perfume we sell is 100% authentic. We source directly from official brand distributors and authorized suppliers. Each bottle arrives sealed in its original packaging with the brand\'s batch code intact. We also include a certificate of authenticity upon request.',
      },
      {
        category: 'Authenticity',
        question: 'How can I verify my perfume is genuine?',
        answer: 'Check the batch code printed on the box or bottle on a website like CheckFresh. You can also contact the brand\'s customer service with the batch code. We guarantee every product and will replace any item free of charge if proven otherwise.',
      },
      {
        category: 'Product details',
        question: 'What is the difference between EDT, EDP, and Parfum?',
        answer: 'EDT (Eau de Toilette) is lighter and ideal for daytime. EDP (Eau de Parfum) is richer and lasts longer — the most popular choice. Parfum (Extrait) is the most concentrated, the most expensive, and the longest lasting.',
      },
      {
        category: 'Product details',
        question: 'Which size should I buy?',
        answer: 'Choose 30–40ml if you like variety or want to test a new scent. 50–75ml is the standard daily wear size. 100ml or more is best value if it is already your signature fragrance.',
      },
      {
        category: 'Shipping',
        question: 'How fast is delivery in Morocco?',
        answer: 'We ship from Casablanca. Orders placed before 2 PM are dispatched the same day. Expect 24–48 hours in Casablanca, Rabat, Marrakech, Fès, and Tangier. Other cities arrive in 2–4 business days.',
      },
      {
        category: 'Shipping',
        question: 'Do you deliver outside Morocco?',
        answer: 'Currently we deliver across Morocco only. We are working on international shipping for the MENA region and Europe. Subscribe to our newsletter to be the first to know.',
      },
      {
        category: 'Returns',
        question: 'What is your return policy?',
        answer: 'You have 7 days from delivery to report any issue. Returns are accepted for defective, damaged, or incorrect items delivered, with return shipping costs fully covered by NAY Parfum. For hygiene and authenticity reasons, opened and used perfumes cannot be returned for change of mind.',
      },
      {
        category: 'Returns',
        question: 'What if my order arrives damaged or wrong?',
        answer: 'Report it within 24 to 48 hours with a photo of the damage or wrong item. NAY Parfum covers all return shipping fees and will send an immediate replacement or issue a full refund — whichever you prefer.',
      },
      {
        category: 'Payment',
        question: 'How do I pay for my order?',
        answer: 'We exclusively offer Cash on Delivery (Paiement à la livraison) everywhere in Morocco. You only pay when you receive your order in your hands, ensuring a 100% risk-free experience.',
      },
      {
        category: 'Product care',
        question: 'How should I store my perfume?',
        answer: 'Keep it away from direct sunlight, heat, and humidity. A cool, dark drawer or closet is ideal. Avoid the bathroom shelf — moisture damages the fragrance over time.',
      },
      {
        category: 'Product care',
        question: 'How do I make my fragrance last longer on skin?',
        answer: 'Apply to pulse points: neck, wrists, and behind the ears. Moisturized skin holds scent longer, so apply right after showering. Layering with a matching body lotion also helps.',
      },
    ]
  },
  fr: {
    helpCenter: "Centre d'Aide",
    title: "Questions Fréquentes",
    subtitle: "Des réponses claires pour vos achats de parfums de luxe. Authenticité, livraison, retours, paiement et entretien — tout ce que vous devez savoir.",
    items: [
      {
        category: 'Authenticité',
        question: 'Ces parfums sont-ils vrais ou authentiques ?',
        answer: 'Chaque parfum que nous vendons est 100% authentique. Nous nous approvisionnons directement auprès des distributeurs officiels de la marque et des fournisseurs agréés. Chaque flacon arrive scellé dans son emballage d\'origine avec son code de lot.',
      },
      {
        category: 'Authenticité',
        question: 'Comment puis-je vérifier que mon parfum est authentique ?',
        answer: 'Vérifiez le code de lot imprimé sur la boîte ou le flacon sur un site comme CheckFresh. Vous pouvez également contacter le service client de la marque. Nous garantissons chaque produit.',
      },
      {
        category: 'Détails du produit',
        question: 'Quelle est la différence entre EDT, EDP et Parfum ?',
        answer: 'EDT (Eau de Toilette) est plus léger, idéal pour la journée. EDP (Eau de Parfum) est plus riche et dure plus longtemps — le choix le plus populaire. Le Parfum (Extrait) est le plus concentré et tient le plus longtemps.',
      },
      {
        category: 'Détails du produit',
        question: 'Quelle contenance dois-je choisir ?',
        answer: 'Choisissez 30–40ml si vous aimez changer ou tester. 50–75ml est la taille standard pour un usage quotidien. 100ml ou plus offre le meilleur rapport qualité/prix si c\'est déjà votre parfum signature.',
      },
      {
        category: 'Livraison',
        question: 'Quelle est la rapidité de la livraison au Maroc ?',
        answer: 'Nous expédions depuis Fès et Casablanca. Les commandes passées avant 14h partent le jour même. Comptez 24 à 48 heures pour les grandes villes. Les autres villes sont livrées en 2 à 4 jours ouvrables.',
      },
      {
        category: 'Livraison',
        question: 'Livrez-vous hors du Maroc ?',
        answer: 'Actuellement, nous livrons uniquement au Maroc. Nous travaillons sur la livraison internationale pour la région MENA et l\'Europe.',
      },
      {
        category: 'Retours',
        question: 'Quelle est votre politique de retour ?',
        answer: 'Vous disposez d\'un délai de 7 jours après livraison pour signaler un problème avec votre parfum. Les retours sont acceptés en cas de produit défectueux, endommagé ou non conforme, et les frais de retour sont intégralement pris en charge par NAY Parfum. Pour des raisons évidentes d\'hygiène, les parfums ouverts et utilisés ne peuvent faire l\'objet d\'un retour de convenance.',
      },
      {
        category: 'Retours',
        question: 'Que faire si ma commande arrive endommagée ou incorrecte ?',
        answer: 'Signalez-le dans les 24 à 48 heures avec une photo. NAY Parfum prend en charge l\'intégralité des frais de retour et vous propose au choix le renvoi immédiat d\'un produit conforme ou le remboursement intégral.',
      },
      {
        category: 'Paiement',
        question: 'Comment puis-je payer ma commande ?',
        answer: 'Nous proposons exclusivement le Paiement à la livraison (Cash on Delivery) partout au Maroc. Vous ne payez que lorsque vous recevez la commande entre vos mains.',
      },
      {
        category: 'Entretien',
        question: 'Comment conserver mon parfum ?',
        answer: 'Gardez-le à l\'abri de la lumière directe du soleil, de la chaleur et de l\'humidité. Un tiroir frais et sombre est idéal. Évitez la salle de bain — l\'humidité abîme la fragrance avec le temps.',
      },
      {
        category: 'Entretien',
        question: 'Comment faire tenir mon parfum plus longtemps sur la peau ?',
        answer: 'Appliquez sur les points de pulsation : cou, poignets et derrière les oreilles. Une peau hydratée retient mieux le parfum, appliquez donc juste après la douche.',
      },
    ]
  },
  ar: {
    helpCenter: "مركز المساعدة",
    title: "الأسئلة الشائعة",
    subtitle: "إجابات واضحة لمشتري العطور الفاخرة. الأصالة، التوصيل، الإرجاع، الدفع، والعناية — كل ما تحتاج إلى معرفته.",
    items: [
      {
        category: 'الأصالة',
        question: 'هل هذه العطور أصلية؟',
        answer: 'كل عطر نبيعه أصلي 100٪. نحصل عليها مباشرة من الموزعين الرسميين للماركات. تصل كل زجاجة مغلفة في عبوتها الأصلية مع بقاء كود الدفعة الخاص بالماركة سليمًا.',
      },
      {
        category: 'الأصالة',
        question: 'كيف يمكنني التحقق من أن عطري أصلي؟',
        answer: 'تحقق من رمز الدفعة (Batch code) المطبوع على العلبة أو الزجاجة على موقع مثل CheckFresh. نحن نضمن كل منتج.',
      },
      {
        category: 'تفاصيل المنتج',
        question: 'ما هو الفرق بين EDT و EDP و Parfum؟',
        answer: 'EDT (ماء التواليت) أخف ومثالي للنهار. EDP (ماء العطر) أكثر ثراءً ويدوم لفترة أطول — الخيار الأكثر شيوعًا. Parfum هو الأكثر تركيزًا والأطول ثباتًا.',
      },
      {
        category: 'تفاصيل المنتج',
        question: 'ما الحجم الذي يجب أن أشتريه؟',
        answer: 'اختر 30–40 مل إذا كنت ترغب في التغيير أو اختبار عطر جديد. 50–75 مل هو الحجم القياسي للاستخدام اليومي. 100 مل أو أكثر هو الأفضل قيمة إذا كان عطرك المفضل.',
      },
      {
        category: 'الشحن',
        question: 'ما مدى سرعة التوصيل في المغرب؟',
        answer: 'يتم إرسال الطلبات المؤكدة قبل الساعة 2 ظهرًا في نفس اليوم. توقع من 24 إلى 48 ساعة في المدن الكبرى (الدار البيضاء، الرباط، مراكش، فاس، طنجة). تصل المدن الأخرى خلال 2–4 أيام عمل.',
      },
      {
        category: 'الشحن',
        question: 'هل تقومون بالتوصيل خارج المغرب؟',
        answer: 'حاليًا نحن نوصل داخل المغرب فقط. نحن نعمل على الشحن الدولي لمنطقة الشرق الأوسط وأوروبا قريبا.',
      },
      {
        category: 'الإرجاع',
        question: 'ما هي سياسة الإرجاع الخاصة بكم؟',
        answer: 'لديك مهلة 7 أيام من تاريخ الاستلام للإبلاغ عن أي مشكلة في العطر. يُقبل الإرجاع في حال استلام منتج معيب أو تالف أو غير مطابق للطلب، وتتحمل NAY Parfum مصاريف الشحن للإرجاع بالكامل. ولأسباب صحية، لا يمكن إرجاع العطور المفتوحة والمستعملة لمجرد تغيير الرأي.',
      },
      {
        category: 'الإرجاع',
        question: 'ماذا لو وصل طلبي تالفًا أو خاطئًا؟',
        answer: 'أبلغ عن ذلك خلال 24 إلى 48 ساعة مع صورة للتلف أو العنصر الخاطئ. تتكفل NAY Parfum بكافة مصاريف الشحن للإرجاع، ونوفر لك فوراً إما استبدال المنتج أو استرداد المبلغ بالكامل — وفقاً لاختيارك.',
      },
      {
        category: 'الدفع',
        question: 'كيف أدفع مقابل طلبي؟',
        answer: 'نحن نقدم الدفع عند الاستلام (Paiement à la livraison) حصريًا في كل مكان في المغرب. أنت تدفع فقط عندما تتسلم طلبك بين يديك.',
      },
      {
        category: 'العناية بالمنتج',
        question: 'كيف يجب أن أقوم بتخزين عطري؟',
        answer: 'احفظه بعيدًا عن أشعة الشمس المباشرة والحرارة والرطوبة. الدرج البارد والمظلم هو الخيار المثالي. تجنب وضعه في الحمام لأن الرطوبة تتلف العطر بمرور الوقت.',
      },
      {
        category: 'العناية بالمنتج',
        question: 'كيف أجعل عطري يدوم لفترة أطول على البشرة؟',
        answer: 'ضعه على نقاط النبض: الرقبة والمعصمين وخلف الأذنين. البشرة المرطبة تحتفظ بالعطر لفترة أطول، لذا ضعه بعد الاستحمام مباشرة.',
      },
    ]
  }
};

import { motion, AnimatePresence } from 'framer-motion';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const pathname = usePathname();
  
  const locale = pathname.split('/')[1] || 'fr';
  const data = FAQ_DATA[locale as keyof typeof FAQ_DATA] || FAQ_DATA['fr'];

  return (
    <section className="relative overflow-hidden bg-white border border-[#e0ddd4] text-[#1A1A1A] py-20 lg:py-28 border-t border-gray-100">
      <div className="relative max-w-[900px] mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16 scroll-reveal">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9] mb-3 block" style={{ fontFamily: "\'Montserrat\', sans-serif" }}>
            {data.helpCenter}
          </span>
          <h2 className="heading-font text-4xl lg:text-5xl mt-3 tracking-wide text-[#1A1A1A]">
            {data.title}
          </h2>
          <p className="mt-5 text-gray-500 text-[15px] leading-relaxed" style={{ fontFamily: "\'Montserrat\', sans-serif", fontWeight: 500 }}>
            {data.subtitle}
          </p>
        </div>

        <div className="grid gap-4">
          {data.items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="scroll-reveal rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-sm"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-5 px-6 lg:px-8 py-6 text-left transition-colors"
                >
                  <div>
                    <div 
                      className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2" 
                      style={{ fontFamily: "\'Montserrat\', sans-serif" }}
                    >
                      {item.category}
                    </div>
                    <div 
                      className="text-lg lg:text-xl text-[#1A1A1A] font-semibold"
                      style={{ fontFamily: "\'Montserrat\', sans-serif" }}
                    >
                      {item.question}
                    </div>
                  </div>
                  <ChevronDown
                    size={22}
                    className={`text-[#0ea5e9] flex-shrink-0 transition-transform duration-400 ease-out ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div 
                        className="px-6 lg:px-8 pb-7 pt-2 text-[15px] leading-relaxed text-gray-600 font-medium"
                        style={{ fontFamily: "\'Montserrat\', sans-serif" }}
                      >
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
