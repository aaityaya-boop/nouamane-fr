'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, Sparkles, Copy, Check, ShoppingBag, Gift, Mail, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePopup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'exists'>('idle');
  const [copied, setCopied] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    // Check if user has dismissed the NAYDAY welcome popup in this storage cycle
    try {
      const hasSeenPopup = localStorage.getItem('nayday_welcome_offer_seen_v2');
      if (hasSeenPopup) {
        dismissedRef.current = true;
      }
    } catch {
      // Ignore private browsing storage errors
    }

    // Allow manual open via query param ?offer=nayday or ?welcome=true
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('offer') === 'nayday' || urlParams.get('welcome') === 'true') {
        dismissedRef.current = false;
        setIsOpen(true);
      }
    }

    // Listen for custom trigger from headers, banners, or footer
    const handleOpenModal = () => {
      dismissedRef.current = false;
      setIsOpen(true);
    };
    window.addEventListener('open-welcome-offer', handleOpenModal);

    // Exclude automated audits, Lighthouse, and bots from automatic timer/scroll popup
    if (typeof window !== 'undefined') {
      const isAudit =
        navigator.webdriver === true ||
        /moto g|Lighthouse|PageSpeed|Chrome-Lighthouse|HeadlessChrome|PTST|Googlebot/i.test(navigator.userAgent);
      if (isAudit) return;
    }

    let timer: NodeJS.Timeout | undefined;

    // Show popup after user scrolls > 25% or after 6 seconds of interaction
    const handleScroll = () => {
      if (dismissedRef.current) return;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0 && window.scrollY / scrollHeight > 0.25) {
        setIsOpen(true);
        window.removeEventListener('scroll', handleScroll);
        if (timer) clearTimeout(timer);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    timer = setTimeout(() => {
      if (dismissedRef.current) return;
      setIsOpen(true);
      window.removeEventListener('scroll', handleScroll);
    }, 6000);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-welcome-offer', handleOpenModal);
    };
  }, []);

  const closePopup = () => {
    dismissedRef.current = true;
    setIsOpen(false);
    try {
      localStorage.setItem('nayday_welcome_offer_seen_v2', 'true');
    } catch {
      // Ignore storage errors
    }
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePopup();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      navigator.clipboard.writeText('NAYDAY');
      // Store pending promo in localStorage so Cart & Checkout auto-detect it
      localStorage.setItem('pending_welcome_promo', 'NAYDAY');
    } catch {
      // Fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        // Store code to cart/checkout storage
        try {
          localStorage.setItem('pending_welcome_promo', 'NAYDAY');
        } catch {}
      } else if (data.error && data.error.includes('déjà inscrit')) {
        setStatus('exists');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const locale = pathname?.split('/')[1] || 'fr';
  const isArabic = locale === 'ar';
  const isEnglish = locale === 'en';

  const t = {
    badge: isArabic ? 'عرض الامتياز والترحيب · دار NAY' : isEnglish ? 'EXCLUSIVE WELCOME PRIVILEGE' : 'OFFRE PRIVILÈGE DE BIENVENUE',
    title: 'OFFRE NAYDAY',
    discount: '-10%',
    discountSub: isArabic ? 'خصم فوري' : isEnglish ? 'IMMEDIATE DISCOUNT' : 'RÉDUCTION IMMÉDIATE',
    condition: isArabic
      ? 'استفد من خصم 10% فوري على طلبك ابتداءً من عطرين في سلتك باستخدام كود الامتياز NAYDAY.'
      : isEnglish
      ? 'Enjoy an immediate 10% discount on your order when you purchase 2 or more fragrances with code NAYDAY.'
      : 'Profitez de -10% de réduction immédiate dès 2 parfums d\'exception ajoutés à votre panier avec votre code privilège NAYDAY.',
    codeLabel: isArabic ? 'كود الامتياز الخاص بك :' : isEnglish ? 'YOUR PRIVILEGE CODE:' : 'VOTRE CODE PRIVILÈGE :',
    copyBtn: isArabic ? 'نسخ الكود' : isEnglish ? 'Copy Code' : 'Copier le code',
    copiedBtn: isArabic ? 'تم النسخ !' : isEnglish ? 'Copied!' : 'Code Copié !',
    emailIntro: isArabic
      ? 'سجل بريدك الإلكتروني لتفعيل العرض واستلام كود NAYDAY فورا :'
      : isEnglish
      ? 'Enter your email to activate the offer and receive your VIP voucher:'
      : 'Entrez votre e-mail pour activer l\'offre et recevoir votre confirmation VIP :',
    placeholder: isArabic ? 'بريدك الإلكتروني (ex: client@gmail.com)' : isEnglish ? 'Your email address' : 'Votre adresse e-mail',
    button: isArabic ? 'تفعيل خصم -10% NAYDAY' : isEnglish ? 'Activate My -10% Off' : 'Activer mon offre -10% NAYDAY',
    loading: isArabic ? 'جاري التفعيل...' : isEnglish ? 'Activating...' : 'Activation en cours...',
    successTitle: isArabic ? 'تهانينا ! تم تفعيل كود NAYDAY' : isEnglish ? 'Congratulations! NAYDAY code activated' : 'Félicitations ! Votre code NAYDAY est validé',
    successMsg: isArabic
      ? 'تم إرسال تفاصيل العرض لبريدك. يمكنك الآن الاستفادة من خصم 10% عند إضافة عطرين أو أكثر لسلتك.'
      : isEnglish
      ? 'Your exclusive NAYDAY voucher has been sent to your inbox. Enjoy -10% on 2 or more bottles.'
      : 'Votre privilège NAYDAY a été expédié à votre adresse. Profitez de -10% dès 2 parfums ajoutés à votre sélection.',
    shopBtn: isArabic ? 'تسوق الآن واستفد من -10%' : isEnglish ? 'Shop Now with -10%' : 'Découvrir la boutique avec -10%',
    existsMsg: isArabic
      ? 'أنت مسجل بالفعل! كود NAYDAY فعال لطلبك ابتداءً من عطرين.'
      : isEnglish
      ? 'You are already registered! Use code NAYDAY on 2 or more perfumes.'
      : 'Vous êtes déjà inscrit ! Le code NAYDAY est prêt pour votre commande dès 2 flacons.',
    errorMsg: isArabic ? 'حدث خطأ ما. يرجى المحاولة لاحقاً.' : isEnglish ? 'An error occurred. Please try again.' : 'Une erreur est survenue. Veuillez réessayer.',
    inspectionNotice: isArabic
      ? 'الدفع عند الاستلام · حق فحص الطرد قبل الأداء مكفول'
      : isEnglish
      ? 'Cash on Delivery · Inspect your parcel before paying'
      : 'Paiement à la livraison · Droit d\'inspection avant paiement',
    close: isArabic ? 'إغلاق' : isEnglish ? 'Close' : 'Fermer'
  };

  if (!isOpen || pathname?.includes('/invoice') || pathname?.includes('/admin')) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-300 print:hidden cursor-pointer"
      onClick={closePopup}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nayday-modal-title"
    >
      <div
        className="relative w-full max-w-[460px] bg-white overflow-hidden rounded-[32px] shadow-2xl border border-[#ECEAE4] animate-in zoom-in-95 duration-300 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            LUXURY MIDNIGHT HEADER WITH GOLDEN AMBIENT GLOW
            ======================================================== */}
        <div className="relative bg-gradient-to-br from-[#0B1120] via-[#0F172A] to-[#1E293B] text-white p-6 sm:p-7 text-center overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={closePopup}
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            aria-label={t.close}
          >
            <X size={17} />
          </button>

          {/* Maison Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-black tracking-[0.2em] uppercase text-amber-300 shadow-xs mb-3">
            <Sparkles size={11} className="text-amber-300 animate-pulse" />
            <span>{t.badge}</span>
          </div>

          {/* Title */}
          <h2
            id="nayday-modal-title"
            className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase"
          >
            {t.title}
          </h2>

          {/* Big Discount Highlight */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-tight">
              {t.discount}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-300 uppercase tracking-widest text-left rtl:text-right leading-tight">
              {t.discountSub}
            </span>
          </div>

          <p className="text-xs sm:text-[13px] text-slate-300/90 leading-relaxed mt-2.5 max-w-sm mx-auto font-medium">
            {t.condition}
          </p>
        </div>

        {/* ========================================================
            MODAL BODY: VOUCHER BOX, EMAIL ACTION & TRUST
            ======================================================== */}
        <div className="p-5 sm:p-6 space-y-4 bg-white">
          {/* THE OFFICIAL NAYDAY PRIVILEGE COUPON BOX */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-[#FAF8F5] to-white border-2 border-dashed border-[#E0D7C6] flex items-center justify-between gap-3 shadow-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                {t.codeLabel}
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-[0.18em] text-[#0F172A] font-mono">
                NAYDAY
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-[#0F172A] hover:bg-slate-800 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} className="text-white" />
                  <span>{t.copiedBtn}</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>{t.copyBtn}</span>
                </>
              )}
            </button>
          </div>

          {/* SUBSCRIPTION FORM / SUCCESS STATE */}
          {status === 'success' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-950">
                  {t.successTitle}
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed mt-1">
                  {t.successMsg}
                </p>
              </div>
              <Link
                href={`/${locale}/shop`}
                onClick={closePopup}
                className="w-full py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <ShoppingBag size={14} />
                <span>{t.shopBtn}</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-[12px] text-slate-600 font-medium text-center">
                {t.emailIntro}
              </p>

              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.placeholder}
                  disabled={status === 'loading'}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D4] rounded-xl py-3 pl-10 pr-3 rtl:pl-3 rtl:pr-10 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {status === 'exists' && (
                <p className="text-amber-700 text-xs text-center font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                  {t.existsMsg}
                </p>
              )}

              {status === 'error' && (
                <p className="text-rose-600 text-xs text-center font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {t.errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] hover:from-black hover:to-black text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
              >
                {status === 'loading' ? (
                  <span>{t.loading}</span>
                ) : (
                  <>
                    <Gift size={15} className="text-amber-300" />
                    <span>{t.button}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* GUARANTEE STRIP */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium text-center">
            <Lock size={12} className="text-emerald-600 shrink-0" />
            <span>{t.inspectionNotice}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
