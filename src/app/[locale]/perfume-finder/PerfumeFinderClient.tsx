'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Check,
  ArrowRight,
  Gift,
  Briefcase,
  Moon,
  Sun,
  Flame,
  Droplets,
  Wind,
  Flower2,
  TreePine,
  ShieldCheck,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Product, isProductInStock, formatMAD } from '@/lib/products';

type PerfumeFinderClientProps = {
  products: Product[];
  locale: string;
};

type Answers = {
  gender: 'men' | 'women' | 'unisex' | 'any';
  family: 'woody' | 'floral' | 'oriental' | 'fresh' | 'arabic' | 'any';
  occasion: 'daily' | 'evening' | 'work' | 'gift' | 'any';
  budget: 'under300' | 'prestige' | 'any';
};

export default function PerfumeFinderClient({ products, locale }: PerfumeFinderClientProps) {
  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<Answers>({
    gender: 'any',
    family: 'any',
    occasion: 'any',
    budget: 'any',
  });

  const isArabic = locale === 'ar';

  // Step 1: Gender choices
  const GENDER_OPTIONS = [
    {
      id: 'men' as const,
      title: isArabic ? 'عطور رجالية' : 'Pour Homme',
      subtitle: isArabic ? 'سحر، جاذبية ونوتات خشبية وقوية' : 'Charisme, présence et élégance masculine',
      badge: isArabic ? 'رجالي' : 'Homme',
    },
    {
      id: 'women' as const,
      title: isArabic ? 'عطور نسائية' : 'Pour Femme',
      subtitle: isArabic ? 'رقة، أنوثة طاغية ونوتات زهرية فاخرة' : 'Délicatesse, sillage floral et séduction raffinée',
      badge: isArabic ? 'نسائي' : 'Femme',
    },
    {
      id: 'unisex' as const,
      title: isArabic ? 'عطور مشتركة (يونيسكس)' : 'Mixte & Partagé',
      subtitle: isArabic ? 'إبداعات نيش حصرية تناسب الجميع' : 'Fragrances de niche et créations sans distinction',
      badge: isArabic ? 'مشترك' : 'Unisexe',
    },
    {
      id: 'any' as const,
      title: isArabic ? 'لست متأكداً / للجميع' : 'Peu importe',
      subtitle: isArabic ? 'استكشف كافة العطور بدون تصنيف مسبق' : 'Explorer toutes les créations sans filtre de genre',
      badge: isArabic ? 'الكل' : 'Tous',
    },
  ];

  // Step 2: Olfactory family choices
  const FAMILY_OPTIONS = [
    {
      id: 'woody' as const,
      title: isArabic ? 'خشبي وأروماتيك' : 'Boisé & Épicé',
      subtitle: isArabic ? 'خشب الأرز، خشب الصندل، الباتشولي ونجيل الهند' : 'Cèdre, santal crémeux, vétiver et poivre noir',
      icon: <TreePine size={22} className="text-amber-700" />,
    },
    {
      id: 'floral' as const,
      title: isArabic ? 'زهري وناعم' : 'Floral & Délicat',
      subtitle: isArabic ? 'الياسمين، الورد البلغاري وزهر البرتقال' : 'Jasmin sambac, rose impériale, fleur d\'oranger',
      icon: <Flower2 size={22} className="text-rose-500" />,
    },
    {
      id: 'oriental' as const,
      title: isArabic ? 'شرقي وعنبري' : 'Oriental & Ambré',
      subtitle: isArabic ? 'فانيليا البوربون، العنبر الدافئ وحبوب التونكا' : 'Vanille bourbon addictive, ambre chaud et fève tonka',
      icon: <Flame size={22} className="text-amber-500" />,
    },
    {
      id: 'fresh' as const,
      title: isArabic ? 'منعش وحمضي' : 'Frais & Hespéridé',
      subtitle: isArabic ? 'البرغموت الإيطالي، نوتات بحرية ولمسات خضراء' : 'Bergamote de Calabre, embruns marins et agrumes',
      icon: <Droplets size={22} className="text-sky-500" />,
    },
    {
      id: 'arabic' as const,
      title: isArabic ? 'شرقي عربي وعود' : 'Oriental Arabe & Oud',
      subtitle: isArabic ? 'العود الملكي، الزعفران، والمسك الفاخر' : 'Oud noble, safran précieux et accords de caractère',
      icon: <Sparkles size={22} className="text-amber-600" />,
    },
    {
      id: 'any' as const,
      title: isArabic ? 'لست متأكداً / مقترحات متنوعة' : 'Peu importe / Découverte',
      subtitle: isArabic ? 'دعني أكتشف أفضل ما يناسبني من جميع العائلات' : 'Ouvert à toutes les familles olfactives',
      icon: <Compass size={22} className="text-neutral-500" />,
    },
  ];

  // Step 3: Occasion choices
  const OCCASION_OPTIONS = [
    {
      id: 'daily' as const,
      title: isArabic ? 'استعمال يومي وتوقيع شخصي' : 'Quotidien & Signature',
      subtitle: isArabic ? 'عطر خفيف وثابت يرافقك طوال اليوم' : 'Élégant, versatile et parfait pour chaque journée',
      icon: <Sun size={20} className="text-amber-500" />,
    },
    {
      id: 'evening' as const,
      title: isArabic ? 'سهرات ومناسبات خاصة' : 'Soirées & Événements',
      subtitle: isArabic ? 'سياج قوي، ساحر ولا يُنسى' : 'Sillage remarquable, magnétique et tenue maximale',
      icon: <Moon size={20} className="text-indigo-500" />,
    },
    {
      id: 'work' as const,
      title: isArabic ? 'العمل والمكتب' : 'Travail & Bureau',
      subtitle: isArabic ? 'راقي، محترم وغير مزعج' : 'Raffiné, structuré et professionnel',
      icon: <Briefcase size={20} className="text-slate-600" />,
    },
    {
      id: 'gift' as const,
      title: isArabic ? 'هدية راقية' : 'Cadeau de Prestige',
      subtitle: isArabic ? 'اختيار مؤكد يرضي مختلف الأذواق الفاخرة' : 'Valeur sûre, flacon iconique et succès garanti',
      icon: <Gift size={20} className="text-rose-500" />,
    },
    {
      id: 'any' as const,
      title: isArabic ? 'لكل الأوقات' : 'Toutes Occasions',
      subtitle: isArabic ? 'مناسب في كل الظروف والمواسم' : 'Polyvalent et adaptable à toutes vos envies',
      icon: <Check size={20} className="text-emerald-500" />,
    },
  ];

  // Step 4: Budget choices
  const BUDGET_OPTIONS = [
    {
      id: 'under300' as const,
      title: isArabic ? 'تسترات فاخرة (≤ 299 درهم)' : 'Testeurs de Luxe (≤ 299 MAD)',
      subtitle: isArabic ? 'نفس النوتات والرائحة الأصلية بأفضل سعر بالمغرب' : 'Mêmes notes olfactives et haute tenue au meilleur prix',
      badge: '299 MAD',
    },
    {
      id: 'prestige' as const,
      title: isArabic ? 'إصدارات برستيج (300 إلى 450 درهم)' : 'Éditions Rares (300 - 450 MAD)',
      subtitle: isArabic ? 'أحجام خاصة وتشكيلات نيش وباقات حصرية' : 'Grands formats et sélections rares en coffrets',
      badge: '300-450 MAD',
    },
    {
      id: 'any' as const,
      title: isArabic ? 'جميع الأسعار' : 'Tous les budgets',
      subtitle: isArabic ? 'عرض أفضل الترشيحات مهما كانت الفئة' : 'Voir les meilleures recommandations du catalogue',
      badge: isArabic ? 'الكل' : 'Tous',
    },
  ];

  // Deterministic scoring recommendation algorithm
  const recommendations = useMemo(() => {
    if (step < 5) return [];

    // Filter in-stock first if possible
    const scored = products
      .filter((p) => isProductInStock(p))
      .map((product) => {
        let score = 0;
        const reasons: string[] = [];

        // 1. Gender match
        if (answers.gender === 'any') {
          score += 20;
        } else if (product.gender === answers.gender) {
          score += 40;
          reasons.push(product.gender === 'men' ? 'Pour Homme' : product.gender === 'women' ? 'Pour Femme' : 'Unisexe');
        } else if (product.gender === 'unisex') {
          score += 30;
          reasons.push('Unisexe');
        } else {
          score -= 100; // Strong penalty if gender conflicts
        }

        // 2. Olfactory Family match
        if (answers.family === 'any') {
          score += 20;
        } else if (product.subcategory === answers.family) {
          score += 45;
          reasons.push(`Famille ${product.subcategoryLabel || product.subcategory}`);
        } else if (
          product.subcategoryLabel &&
          product.subcategoryLabel.toLowerCase().includes(answers.family)
        ) {
          score += 35;
          reasons.push(`Notes ${product.subcategoryLabel}`);
        }

        // 3. Budget match
        if (answers.budget === 'under300') {
          if (product.price <= 299) {
            score += 30;
            reasons.push('Prix accessible');
          } else {
            score -= 20;
          }
        } else if (answers.budget === 'prestige') {
          if (product.price > 299 && product.price <= 450) {
            score += 30;
            reasons.push('Édition Prestige');
          }
        } else {
          score += 15;
        }

        // 4. Occasion soft match
        if (answers.occasion === 'daily') {
          if (['fresh', 'floral', 'aromatic'].includes(product.subcategory)) score += 15;
        } else if (answers.occasion === 'evening') {
          if (['oriental', 'woody', 'arabic'].includes(product.subcategory)) score += 15;
        } else if (answers.occasion === 'gift') {
          if (product.tags?.includes('bestseller')) {
            score += 20;
            reasons.push('Bestseller plébiscité');
          }
        }

        // Availability bonus
        if (isProductInStock(product)) {
          score += 10;
        }

        return { product, score, reasons };
      });

    // Sort descending by score, filter out heavy mismatches
    const filtered = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

    // Fallback if no exact match: take top in-stock products
    if (filtered.length === 0) {
      return products.filter((p) => isProductInStock(p)).slice(0, 4).map((product) => ({
        product,
        score: 50,
        reasons: ['Recommandation découverte'],
      }));
    }

    return filtered.slice(0, 8);
  }, [step, answers, products]);

  const handleSelect = (field: keyof Answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    if (step < 4) {
      setStep((prev) => prev + 1);
    } else {
      setStep(5); // Show results
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setAnswers({ gender: 'any', family: 'any', occasion: 'any', budget: 'any' });
    setStep(1);
  };

  const progressPercentage = step >= 5 ? 100 : Math.round((step / 4) * 100);

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24 sm:pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Progress Header */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.2em] uppercase text-[#888] mb-3">
              <span className="flex items-center gap-1.5 text-[#0ea5e9]">
                <Compass size={15} />
                <span>{isArabic ? 'المستشار العطري الذكي' : 'Conseiller Olfactif NAY'}</span>
              </span>
              <span>
                {step < 5 ? (isArabic ? `المرحلة ${step} من 4` : `Étape ${step} sur 4`) : (isArabic ? 'النتيجة' : 'Vos Recommandations')}
              </span>
            </div>

            <div className="w-full bg-[#e5e5e0] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-[#0ea5e9] h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={handleBack}
                className="mt-4 text-[12px] font-semibold text-[#888] hover:text-[#1A1A1A] transition flex items-center gap-1 rtl:flex-row-reverse"
              >
                <ChevronLeft size={16} />
                <span>{isArabic ? 'رجوع' : 'Retour à l\'étape précédente'}</span>
              </button>
            )}
          </div>

          {/* QUESTION STEPS */}
          <AnimatePresence mode="wait">
            {/* STEP 1: GENDER */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center max-w-xl mx-auto mb-8">
                  <h1 className="heading-font text-2xl sm:text-4xl font-bold tracking-wide">
                    {isArabic ? 'لمن تبحث عن العطر ؟' : 'Pour qui cherchez-vous un parfum ?'}
                  </h1>
                  <p className="text-[13px] sm:text-[14px] text-[#6B6B6B] mt-2">
                    {isArabic
                      ? 'حدد الفئة لتوجيه التوصيات بدقة حسب الميول والتوليفات المناسبة'
                      : 'Choisissez le profil pour orienter les créations les plus adaptées.'}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect('gender', opt.id)}
                      className={`p-5 sm:p-6 rounded-2xl border text-left rtl:text-right transition-all bg-white hover:border-[#0ea5e9] hover:shadow-md group flex flex-col justify-between min-h-[120px] ${
                        answers.gender === opt.id ? 'border-[#0ea5e9] ring-2 ring-[#0ea5e9]/20' : 'border-[#e0ddd4]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="heading-font text-lg sm:text-xl font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors">
                          {opt.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f1f5f9] text-[#666] px-2.5 py-0.5 rounded-full">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#777] leading-relaxed">
                        {opt.subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: FAMILY */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center max-w-xl mx-auto mb-8">
                  <h2 className="heading-font text-2xl sm:text-4xl font-bold tracking-wide">
                    {isArabic ? 'أي عالم عطري يجذبك أكثر ؟' : 'Quelle atmosphère olfactive préférez-vous ?'}
                  </h2>
                  <p className="text-[13px] sm:text-[14px] text-[#6B6B6B] mt-2">
                    {isArabic
                      ? 'اختر النوتات والمزاج العطري الذي ترتاح له حواسك'
                      : 'Les familles olfactives définissent le caractère et le sillage du parfum.'}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {FAMILY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect('family', opt.id)}
                      className={`p-5 rounded-2xl border text-left rtl:text-right transition-all bg-white hover:border-[#0ea5e9] hover:shadow-md group flex items-start gap-4 ${
                        answers.family === opt.id ? 'border-[#0ea5e9] ring-2 ring-[#0ea5e9]/20' : 'border-[#e0ddd4]'
                      }`}
                    >
                      <div className="p-3 rounded-xl bg-[#f8fafc] shrink-0 border border-[#eeece5]">
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="heading-font text-[16px] sm:text-lg font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors truncate">
                          {opt.title}
                        </div>
                        <p className="text-[11px] sm:text-[12px] text-[#777] mt-1 leading-snug">
                          {opt.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: OCCASION */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center max-w-xl mx-auto mb-8">
                  <h2 className="heading-font text-2xl sm:text-4xl font-bold tracking-wide">
                    {isArabic ? 'ما هي المناسبة الرئيسية للاستعمال ؟' : 'Pour quelle occasion principale ?'}
                  </h2>
                  <p className="text-[13px] sm:text-[14px] text-[#6B6B6B] mt-2">
                    {isArabic
                      ? 'نوازن بين فوحان العطر وطبيعته ليتماشى مع لحظتك'
                      : 'L\'intensité et la projection du parfum s\'adaptent au contexte.'}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {OCCASION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect('occasion', opt.id)}
                      className={`p-5 rounded-2xl border text-left rtl:text-right transition-all bg-white hover:border-[#0ea5e9] hover:shadow-md group flex items-start gap-4 ${
                        answers.occasion === opt.id ? 'border-[#0ea5e9] ring-2 ring-[#0ea5e9]/20' : 'border-[#e0ddd4]'
                      }`}
                    >
                      <div className="p-3 rounded-xl bg-[#f8fafc] shrink-0 border border-[#eeece5]">
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="heading-font text-[16px] sm:text-lg font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors truncate">
                          {opt.title}
                        </div>
                        <p className="text-[11px] sm:text-[12px] text-[#777] mt-1 leading-snug">
                          {opt.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 4: BUDGET */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center max-w-xl mx-auto mb-8">
                  <h2 className="heading-font text-2xl sm:text-4xl font-bold tracking-wide">
                    {isArabic ? 'ما هو النطاق السعري المناسب ؟' : 'Quel est votre budget souhaité ?'}
                  </h2>
                  <p className="text-[13px] sm:text-[14px] text-[#6B6B6B] mt-2">
                    {isArabic
                      ? 'جميع العطور مختارة بعناية ومضمونة بنفس النوتات والتجربة'
                      : 'Nos prix sont 100% transparents avec paiement à la livraison.'}
                  </p>
                </div>

                <div className="grid gap-4 max-w-xl mx-auto">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect('budget', opt.id)}
                      className={`p-5 sm:p-6 rounded-2xl border text-left rtl:text-right transition-all bg-white hover:border-[#0ea5e9] hover:shadow-md group flex items-center justify-between ${
                        answers.budget === opt.id ? 'border-[#0ea5e9] ring-2 ring-[#0ea5e9]/20' : 'border-[#e0ddd4]'
                      }`}
                    >
                      <div>
                        <div className="heading-font text-lg font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors">
                          {opt.title}
                        </div>
                        <p className="text-[12px] text-[#777] mt-1">
                          {opt.subtitle}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#0ea5e9] bg-sky-50 px-3 py-1.5 rounded-full border border-sky-100 shrink-0">
                        {opt.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 5: RESULTS */}
            {step === 5 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* Results Header Card */}
                <div className="bg-white border border-[#e0ddd4] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#0ea5e9]">
                      {isArabic ? 'تم تحليل تفضيلاتك بنجاح' : 'Analyse Complétée'}
                    </span>
                    <h2 className="heading-font text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-1">
                      {isArabic ? 'العطور الأكثر مطابقة لذوقك' : 'Vos Fragrances Idéales'}
                    </h2>
                    <p className="text-[13px] text-[#6B6B6B] mt-1.5">
                      {isArabic
                        ? `${recommendations.length} اقتراحات تم اختيارها بناءً على معطيات الكتالوج المتوفرة في المخزن.`
                        : `${recommendations.length} parfums sélectionnés selon vos préférences parmi notre catalogue en stock.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-outline-blue px-5 py-2.5 text-[12px] font-semibold rounded-xl inline-flex items-center gap-1.5 shrink-0"
                  >
                    <RotateCcw size={14} />
                    <span>{isArabic ? 'إعادة الاختبار' : 'Recommencer'}</span>
                  </button>
                </div>

                {/* Recommendations Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendations.map(({ product, reasons }) => (
                    <div key={product.id} className="flex flex-col h-full">
                      <div className="flex-1">
                        <ProductCard product={product} />
                      </div>
                      {/* Verified Reason Chips */}
                      {reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 px-1">
                          {reasons.slice(0, 2).map((r, i) => (
                            <span
                              key={i}
                              className="text-[9.5px] font-semibold text-[#0ea5e9] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100/80"
                            >
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom Assurance Card */}
                <div className="mt-12 p-6 sm:p-8 bg-gradient-to-r from-[#f8fafc] to-white rounded-3xl border border-[#e0ddd4] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0ea5e9] shrink-0">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#1A1A1A]">
                        {isArabic ? 'توصيل سريع مع المعاينة قبل الدفع' : 'Livraison Express & Inspection Avant Paiement'}
                      </h4>
                      <p className="text-[12px] text-[#777] mt-0.5">
                        {isArabic
                          ? 'توصيل في 24-48 ساعة لكافة المدن المغربية. الدفع نقداً عند استلام طلبيتك.'
                          : 'Livraison 24-48h partout au Maroc. Réglez en toute sérénité à la livraison.'}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/shop`}
                    className="btn-blue px-6 py-3 text-[13px] font-bold rounded-xl whitespace-nowrap shadow-md active:scale-98"
                  >
                    {isArabic ? 'تصفح كافة العطور' : 'Voir toute la boutique'}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
