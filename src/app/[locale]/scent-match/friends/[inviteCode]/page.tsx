'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Users,
  Heart,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  Check,
  RotateCcw,
  Compass
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useScentMatchSession } from '@/lib/scentMatch/useScentMatchSession';
import ScentMatchCard from '@/components/scentMatch/ScentMatchCard';
import ScentMatchDetailsModal from '@/components/scentMatch/ScentMatchDetailsModal';
import { QueueProduct } from '@/lib/scentMatch/types';

export default function FriendMatchPage({
  params
}: {
  params: Promise<{ locale: string; inviteCode: string }>;
}) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'fr';
  const inviteCode = resolvedParams?.inviteCode?.toUpperCase();
  const isAr = locale === 'ar';
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [roomData, setRoomData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [friendNameInput, setFriendNameInput] = useState('');
  const [isSwipingDuo, setIsSwipingDuo] = useState(false);
  const [addedItems, setAddedItems] = useState<Record<number, boolean>>({});
  const [detailsProduct, setDetailsProduct] = useState<QueueProduct | null>(null);

  const {
    sessionId,
    queue,
    currentIndex,
    currentProduct,
    likedProducts,
    passedProducts,
    swipe,
    undo,
    undoStack
  } = useScentMatchSession(locale);

  // Poll or fetch room data
  const fetchRoom = async () => {
    if (!inviteCode) return;
    try {
      const res = await fetch(`/api/scent-match/friends?inviteCode=${inviteCode}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRoomData(json.data);
      } else {
        setError('Salon introuvable');
      }
    } catch (e) {
      console.error(e);
      setError('Impossible de charger ce salon duo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, [inviteCode]);

  const handleStartSwiping = () => {
    if (!friendNameInput.trim()) return;
    setIsSwipingDuo(true);
  };

  const handleFinishFriendSwipes = async () => {
    setLoading(true);
    try {
      await fetch('/api/scent-match/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          inviteCode,
          friendSessionId: sessionId,
          friendName: friendNameInput.trim() || 'Ami(e)'
        })
      });
      await fetchRoom();
      setIsSwipingDuo(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
          <Sparkles className="animate-spin text-sky-500" size={32} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#090d16]">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {isAr ? 'صالون التحدي غير متاح' : 'Salon Introuvable'}
            </h2>
            <Link
              href={`/${locale}/scent-match`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-sky-500 text-white font-extrabold text-xs uppercase tracking-wider"
            >
              <span>{isAr ? 'العودة إلى الاكتشاف' : 'Retour à Scent Match'}</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isCompleted = roomData.status === 'BOTH_COMPLETED';

  return (
    <div className={`min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#090d16] text-[#1A1A1A] dark:text-slate-100 ${isAr ? 'font-arabic' : 'font-sans'}`}>
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* DUO HERO CARD */}
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-900 via-[#0c1424] to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-slate-800 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sky-400 text-xs font-bold uppercase tracking-widest border border-white/15">
            <Users size={15} />
            <span>{isAr ? 'تحدي التوافق العطري بين صديقين' : 'Match Olfactif Duo'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            {roomData.hostName} & {roomData.friendName || (isAr ? 'الصديق(ة)' : 'Ami(e)')}
          </h1>

          {isCompleted ? (
            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-lg shadow-lg">
                <Heart size={20} className="fill-slate-950" />
                <span>{roomData.compatibilityScore}% {isAr ? 'نسبة التوافق العطري' : 'd\'Harmonie Olfactive'}</span>
              </div>
              <p className="text-sm font-semibold text-sky-200">
                {roomData.sharedArchetype}
              </p>
            </div>
          ) : (
            <p className="text-slate-300 text-sm max-w-lg mx-auto">
              {isAr
                ? `لقد قام ${roomData.hostName} باختيار عطوره المفضلة وينتظرك لمعرفة نسبة التوافق بينكما واكتشاف العطور التي أحببتماها معاً !`
                : `${roomData.hostName} a swipé ses parfums favoris. À votre tour de swiper pour révéler vos coups de cœur communs !`}
            </p>
          )}
        </div>

        {/* SWIPING STEP FOR THE FRIEND */}
        {!isCompleted && !isSwipingDuo && (
          <div className="max-w-md mx-auto p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-center">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isAr ? 'جاهز للتحدي ؟ أدخل اسمك للبدء' : 'Prêt(e) à relever le défi ?'}
            </h3>
            <input
              type="text"
              placeholder={isAr ? 'اسمك المستعار' : 'Votre Prénom'}
              value={friendNameInput}
              onChange={(e) => setFriendNameInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm font-semibold outline-none focus:border-sky-500"
            />
            <button
              onClick={handleStartSwiping}
              disabled={!friendNameInput.trim()}
              className="w-full py-3.5 bg-slate-900 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all disabled:opacity-50"
            >
              {isAr ? 'بدء اختيار عطوري المفضلة' : 'Commencer mes Swipes Duo'}
            </button>
          </div>
        )}

        {!isCompleted && isSwipingDuo && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-between max-w-sm mx-auto text-xs font-bold text-slate-500">
              <span>{isAr ? `إعجاباتك : ${likedProducts.length}` : `Vos coups de cœur : ${likedProducts.length}`}</span>
              {likedProducts.length >= 3 && (
                <button
                  onClick={handleFinishFriendSwipes}
                  className="px-4 py-1.5 rounded-full bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider"
                >
                  {isAr ? 'كشف النتائج المشتركة' : 'Voir nos Résultats'}
                </button>
              )}
            </div>

            <div className="flex justify-center py-4">
              {currentProduct ? (
                <ScentMatchCard
                  product={currentProduct}
                  onSwipe={swipe}
                  onOpenDetails={(p) => setDetailsProduct(p)}
                  onUndo={undo}
                  canUndo={undoStack.length > 0}
                  locale={locale}
                  isFront={true}
                />
              ) : (
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                  <h3 className="font-extrabold text-slate-900 dark:text-white">
                    {isAr ? 'أحسنت ! اكتملت جولتك' : 'Tour de découverte terminé !'}
                  </h3>
                  <button
                    onClick={handleFinishFriendSwipes}
                    className="px-6 py-3 bg-sky-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl"
                  >
                    {isAr ? 'مقارنة النتيجة مع صديقي' : 'Calculer notre Harmonie'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COMPLETED RESULTS: MUTUAL LIKED PERFUMES */}
        {isCompleted && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                  {isAr ? 'التوافق التام' : 'Harmonie Partagée'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {isAr ? 'العطور التي أحببتماها معاً' : 'Vos Coups de Cœur Communs'}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {roomData.mutualLikedProducts?.length || 0} {isAr ? 'عطور مشتركة' : 'parfums en commun'}
              </span>
            </div>

            {(!roomData.mutualLikedProducts || roomData.mutualLikedProducts.length === 0) ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 text-slate-500 text-xs">
                <p>
                  {isAr
                    ? 'أذواقكم متمايزة ومكملة لبعضها البعض ! رغم عدم وجود نفس العطر، يمكنكم تجربة جولة ثانية.'
                    : 'Vos sensibilités sont subtilement différentes et complémentaires ! Vous pouvez recommencer pour affiner vos accords.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roomData.mutualLikedProducts.map((p: any) => {
                  const isAdded = addedItems[p.id];
                  return (
                    <div
                      key={p.id}
                      className="rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-lg flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {p.brandLabel}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                          {isAr ? 'محبوب من كلاكما ❤️' : 'Aimé par vous deux ❤️'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 my-2">
                        <div className="relative w-24 h-28 flex-shrink-0 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2">
                          <Image
                            src={p.images?.[0] || '/images/placeholder-perfume.png'}
                            alt={p.name}
                            fill
                            className="object-contain p-1"
                            sizes="96px"
                          />
                        </div>
                        <div className="space-y-1 flex-1">
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                            {p.name}
                          </h4>
                          <p className="text-xs font-bold text-sky-600 dark:text-sky-400">
                            {p.subcategoryLabel}
                          </p>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                            {p.price} MAD
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-2">
                        <button
                          onClick={() => handleAddToCart(p)}
                          className={`py-2.5 px-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                            isAdded ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white dark:bg-sky-500'
                          }`}
                        >
                          {isAdded ? <Check size={14} /> : <ShoppingBag size={14} />}
                          <span>{isAdded ? (isAr ? 'تمت الإضافة' : 'Ajouté') : (isAr ? 'إهداء أو شراء' : 'Commander')}</span>
                        </button>

                        <Link
                          href={`/${locale}/product/${p.slug}`}
                          className="py-2.5 px-3 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-center hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {isAr ? 'تفاصيل' : 'Fiche Produit'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <ScentMatchDetailsModal
        product={detailsProduct}
        isOpen={Boolean(detailsProduct)}
        onClose={() => setDetailsProduct(null)}
        locale={locale}
      />

      <Footer />
    </div>
  );
}
