'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Award,
  Compass,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Check
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';

export default function SharedResultPage({
  params
}: {
  params: Promise<{ locale: string; shareToken: string }>;
}) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'fr';
  const shareToken = resolvedParams?.shareToken;
  const isAr = locale === 'ar';
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedItems, setAddedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!shareToken) return;
    fetch(`/api/scent-match/share/${shareToken}`)
      .then((res) => {
        if (!res.ok) throw new Error('Result not found');
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError('Introuvable');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Impossible de charger ce résultat.');
      })
      .finally(() => setLoading(false));
  }, [shareToken]);

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '/images/placeholder-perfume.png',
      images: product.images,
      inStock: product.inStock
    });
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#090d16]">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <Sparkles className="animate-spin text-sky-500 mx-auto" size={32} />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {isAr ? 'جارٍ تحميل البصمة العطرية...' : 'Chargement de l\'ADN Olfactif...'}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#090d16]">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {isAr ? 'البصمة العطرية غير موجودة' : 'Résultat Introuvable'}
            </h2>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'ربما انتهت صلاحية هذا الرابط أو تم نقله.'
                : 'Ce lien de partage n\'existe pas ou a expiré.'}
            </p>
            <Link
              href={`/${locale}/scent-match`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-sky-500 text-white font-extrabold text-xs uppercase tracking-wider"
            >
              <span>{isAr ? 'اكتشف بصمتك الخاصة' : 'Créer mon Scent Match'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { personality, dnaScores, favoriteNotes, topMatches, participantName } = data;

  return (
    <div className={`min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#090d16] text-[#1A1A1A] dark:text-slate-100 ${isAr ? 'font-arabic' : 'font-sans'}`}>
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* TOP CTA CALLOUT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 shadow-xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400">
              {isAr ? 'اكتشاف مشارك' : 'Profil Olfactif Partagé'}
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {isAr ? `البصمة العطرية الخاصة بـ ${participantName}` : `L'ADN Olfactif de ${participantName}`}
            </h2>
          </div>
          <Link
            href={`/${locale}/scent-match`}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all self-start sm:self-auto"
          >
            <Compass size={15} />
            <span>{isAr ? 'اكتشف بصمتك أنت أيضاً' : 'Trouver mon Propre ADN'}</span>
          </Link>
        </div>

        {/* HERO CARD */}
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-900 via-[#0c1424] to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-slate-800">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="text-sky-400" size={20} />
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
                {isAr ? 'النمط العطري الملكي' : 'Archétype Signature'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {isAr ? personality.titleAr : personality.titleFr}
            </h1>
            <p className="text-base italic text-sky-200/90 font-medium">
              "{isAr ? personality.taglineAr : personality.taglineFr}"
            </p>
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              {isAr ? personality.descriptionAr : personality.descriptionFr}
            </p>

            {/* Favorite Notes */}
            <div className="pt-2 flex flex-wrap gap-2">
              {favoriteNotes.map((note: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15 backdrop-blur-md"
                >
                  ✨ {note}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* TOP MATCHES */}
        <div className="space-y-6">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {isAr ? 'العطور المتوافقة مع هذا النمط' : 'Les Fragrances Idéales Associées'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topMatches.map((item: any, idx: number) => {
              const isAdded = addedItems[item.product.id];
              return (
                <div
                  key={item.product.id}
                  className="rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-lg flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {item.product.brandLabel}
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {item.matchScore}% Match
                    </span>
                  </div>

                  <div className="flex items-center gap-4 my-2">
                    <div className="relative w-24 h-28 flex-shrink-0 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2">
                      <Image
                        src={item.product.images?.[0] || '/images/placeholder-perfume.png'}
                        alt={item.product.name}
                        fill
                        className="object-contain p-1"
                        sizes="96px"
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                        {item.product.name}
                      </h4>
                      <p className="text-xs font-bold text-sky-600 dark:text-sky-400">
                        {item.product.subcategoryLabel}
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                        {item.product.price} MAD
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-2">
                    <button
                      onClick={() => handleAddToCart(item.product)}
                      className={`py-2.5 px-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        isAdded
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-900 hover:bg-sky-600 text-white dark:bg-sky-500'
                      }`}
                    >
                      {isAdded ? <Check size={14} /> : <ShoppingBag size={14} />}
                      <span>{isAdded ? (isAr ? 'تمت الإضافة' : 'Ajouté') : (isAr ? 'إضافة للسلة' : 'Commander')}</span>
                    </button>

                    <Link
                      href={`/${locale}/product/${item.product.slug}`}
                      className="py-2.5 px-3 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-center hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {isAr ? 'تفاصيل' : 'Fiche Produit'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM CALL TO ACTION */}
        <div className="text-center p-8 rounded-[32px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {isAr ? 'تريد معرفة عطرك الخاص ؟' : 'Envie de découvrir votre propre parfum signature ?'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr
              ? 'قم بتجربة NAY Scent Match التفاعلية مجاناً واحصل على تحليل مفصل لذوقك العطري.'
              : 'Participez à l\'expérience interactive NAY Scent Match et révélez vos affinités olfactives.'}
          </p>
          <div className="pt-2">
            <Link
              href={`/${locale}/scent-match`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-black text-xs uppercase tracking-wider shadow-md"
            >
              <span>{isAr ? 'بدء تجربتي الخاصة' : 'Lancer mon Scent Match'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
