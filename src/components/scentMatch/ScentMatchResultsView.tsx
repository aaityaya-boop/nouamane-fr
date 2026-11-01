'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Share2,
  Copy,
  Check,
  ShoppingBag,
  MessageCircle,
  Users,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Compass,
  Award
} from 'lucide-react';
import { ScentDNAAnalysisResult, MatchedPerfume } from '@/lib/scentMatch/types';
import { useCart } from '@/context/CartContext';

interface ScentMatchResultsViewProps {
  analysis: ScentDNAAnalysisResult;
  locale?: string;
  onRestart: () => void;
  onOpenFriendMatch: () => void;
}

export default function ScentMatchResultsView({
  analysis,
  locale = 'fr',
  onRestart,
  onOpenFriendMatch
}: ScentMatchResultsViewProps) {
  const isAr = locale === 'ar';
  const { addToCart } = useCart();
  const [copied, setCopied] = useState(false);
  const [addedItems, setAddedItems] = useState<Record<number, boolean>>({});

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/scent-match/results/${analysis.shareToken}`
    : `/scent-match/results/${analysis.shareToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddToCart = (item: MatchedPerfume) => {
    addToCart({
      id: item.product.id,
      slug: item.product.slug,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images[0] || '/images/placeholder-perfume.png',
      images: item.product.images,
      inStock: item.product.inStock
    });
    setAddedItems((prev) => ({ ...prev, [item.product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.product.id]: false }));
    }, 2500);
  };

  const whatsappMessage = encodeURIComponent(
    isAr
      ? `مرحباً دار NAY Parfums، لقد قمت باكتشاف بصمتي العطرية عبر Scent Match! نمطي العطري هو "${analysis.personality.titleAr}" مع توافق بنسبة ممتازة. أود استشارة خبير العطور لديكم أو طلب العطر الموصى به: ${shareUrl}`
      : `Bonjour Maison NAY Parfums, j'ai réalisé mon Scent Match ! Mon profil olfactif est "${analysis.personality.titleFr}" avec comme parfum idéal "${analysis.topMatches[0]?.product.name || ''}". J'aimerais commander ou avoir conseil : ${shareUrl}`
  );

  const whatsappShareText = encodeURIComponent(
    isAr
      ? `اكتشف بصمتك العطرية في دار NAY Parfums! لقد حصلت على نمط "${analysis.personality.titleAr}". اكتشف نمطك وعطرك المثالي هنا : ${shareUrl}`
      : `Découvre ta signature olfactive sur NAY Parfums ! J'ai obtenu le profil "${analysis.personality.titleFr}". Trouve ton parfum signature ici : ${shareUrl}`
  );

  const dimensionLabels: Record<string, { labelFr: string; labelAr: string; color: string }> = {
    woody: { labelFr: 'Boisé & Noble', labelAr: 'خشبي ونبيل', color: 'from-amber-600 to-amber-800' },
    oriental: { labelFr: 'Oriental & Ambré', labelAr: 'شرقي وعنبري', color: 'from-amber-500 to-rose-600' },
    floral: { labelFr: 'Floral Délicat', labelAr: 'زهري رقيق', color: 'from-rose-400 to-pink-500' },
    fresh: { labelFr: 'Frais & Hespéridé', labelAr: 'منعش وحمضي', color: 'from-sky-400 to-teal-500' },
    spicy: { labelFr: 'Épicé & Vibrant', labelAr: 'متبل وجريء', color: 'from-red-500 to-amber-500' },
    sweet: { labelFr: 'Gourmand & Sucré', labelAr: 'حلو ومخملي', color: 'from-orange-400 to-amber-600' }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* HEADER BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-300 text-xs font-bold uppercase tracking-widest shadow-xs">
          <Sparkles size={14} className="text-sky-500 animate-spin-slow" />
          <span>{isAr ? 'البصمة العطرية الحصرية' : 'ADN Olfactif Certifié Maison NAY'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          {isAr ? 'نتائج اكتشافك العطري' : 'Votre Signature Olfactive Révélée'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          {isAr
            ? 'بناءً على تفاعلاتك واختياراتك المفضلة، قمنا بتحليل شخصيتك العطرية وتحديد أرقى العطور المتوافقة تماماً مع ذوقك.'
            : 'Grâce à l\'analyse fine de vos coups de cœur, voici votre archétype olfactif et la sélection exclusive de fragrances qui sublimeront votre présence.'}
        </p>
      </motion.div>

      {/* ARCHETYPE HERO CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-900 via-[#0c1424] to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-slate-800"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="text-sky-400" size={20} />
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
                {isAr ? 'النمط العطري الملكي' : 'Profil Signature'}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {isAr ? analysis.personality.titleAr : analysis.personality.titleFr}
            </h2>
            <p className="text-base italic text-sky-200/90 font-medium">
              "{isAr ? analysis.personality.taglineAr : analysis.personality.taglineFr}"
            </p>
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              {isAr ? analysis.personality.descriptionAr : analysis.personality.descriptionFr}
            </p>

            {/* Signature Notes Pill Cloud */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                {isAr ? 'النوتات المفضلة في بصمتك :' : 'Accords Olfactifs Clés :'}
              </span>
              <div className="flex flex-wrap gap-2">
                {analysis.favoriteNotes.map((note, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15 backdrop-blur-md shadow-xs flex items-center gap-1.5"
                  >
                    <Sparkles size={11} className="text-sky-300" />
                    <span>{note}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scent DNA Dimensions Radar */}
          <div className="md:col-span-4 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {isAr ? 'توزيع الأبعاد' : 'Spectre ADN'}
              </span>
              <span className="text-xs text-sky-400 font-extrabold">100% Harmonie</span>
            </div>

            <div className="space-y-3">
              {Object.entries(analysis.dnaScores).map(([key, val]) => {
                const info = dimensionLabels[key] || {
                  labelFr: key,
                  labelAr: key,
                  color: 'from-sky-400 to-sky-600'
                };
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        {isAr ? info.labelAr : info.labelFr}
                      </span>
                      <span className="font-extrabold text-white">{val}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${info.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* TOP MATCHES SECTION */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-sky-500">
              {isAr ? 'عطورك المتطابقة' : 'Sélection Sur-Mesure'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {isAr ? 'أفضل العطور المطابقة لبصمتك' : 'Vos Meilleurs Matchs Olfactifs'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {analysis.topMatches.length} {isAr ? 'عطور مختارة' : 'parfums recommandés avec explication'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysis.topMatches.map((item, idx) => {
            const isAdded = addedItems[item.product.id];
            return (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * idx }}
                className="relative rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-lg flex flex-col justify-between hover:shadow-xl transition-all"
              >
                {/* Match Score Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-extrabold text-xs">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {item.product.brandLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800">
                    <Sparkles size={13} />
                    <span>{item.matchScore}% Match</span>
                  </div>
                </div>

                {/* Product Layout */}
                <div className="flex items-center gap-5 my-2">
                  <div className="relative w-28 h-32 flex-shrink-0 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2 border border-slate-100 dark:border-slate-800">
                    <Image
                      src={item.product.images[0] || '/images/placeholder-perfume.png'}
                      alt={item.product.name}
                      fill
                      className="object-contain p-1 mix-blend-multiply dark:mix-blend-normal"
                      sizes="120px"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      {item.product.name}
                    </h4>
                    <p className="text-xs font-bold text-sky-600 dark:text-sky-400">
                      {item.product.subcategoryLabel}
                    </p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white pt-1">
                      {item.product.price} MAD
                    </p>
                  </div>
                </div>

                {/* Explanation Box */}
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                    {isAr ? 'لماذا هذا الاختيار ؟' : 'Pourquoi ce Match ?'}
                  </span>
                  <p className="leading-relaxed">
                    {isAr ? item.explanationAr : item.explanationFr}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-extrabold text-xs transition-all shadow-sm ${
                      isAdded
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-900 hover:bg-sky-600 text-white dark:bg-sky-500 dark:hover:bg-sky-400'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={15} />
                        <span>{isAr ? 'تمت الإضافة !' : 'Ajouté !'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={15} />
                        <span>{isAr ? 'إضافة إلى السلة' : 'Ajouter au Panier'}</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/${locale}/product/${item.product.slug}`}
                    className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>{isAr ? 'تفاصيل العطر' : 'Fiche Produit'}</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* SHARE & SOCIAL ACTIONS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-[32px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isAr ? 'مشاركة النتيجة أو مطابقتها مع صديق' : 'Partagez & Comparez avec un(e) Proche'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              {isAr
                ? 'رابط حصري فريد لنتيجتك دون أي معلومات خاصة.'
                : 'Lien public anonymisé et sécurisé pour faire découvrir votre ADN ou matcher à deux.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Match With Friends CTA */}
            <button
              onClick={onOpenFriendMatch}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Users size={16} />
              <span>{isAr ? 'تحدي المطابقة مع صديق' : 'Matcher avec un(e) Ami(e)'}</span>
            </button>

            {/* WhatsApp Advisor / Share */}
            <a
              href={`https://wa.me/212663380011?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle size={16} />
              <span>{isAr ? 'استشارة خبير واتساب' : 'Conseil Expert WhatsApp'}</span>
            </a>
          </div>
        </div>

        {/* Share Link Row */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#111827] p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent px-3 text-xs text-slate-600 dark:text-slate-300 outline-none select-all font-mono"
          />
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-900 hover:bg-sky-600 text-white dark:bg-sky-500 dark:hover:bg-sky-400'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>{isAr ? 'تم النسخ' : 'Copié !'}</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>{isAr ? 'نسخ الرابط' : 'Copier'}</span>
              </>
            )}
          </button>
        </div>

        {/* RESTART */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-sky-500 transition-colors"
          >
            <RotateCcw size={15} />
            <span>{isAr ? 'بدء تجربة جديدة' : 'Recommencer une nouvelle session Scent Match'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
