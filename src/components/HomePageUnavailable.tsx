'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { RotateCw, Sparkles, MessageCircle } from 'lucide-react';

interface HomePageUnavailableProps {
  locale: string;
}

export default function HomePageUnavailable({ locale }: HomePageUnavailableProps) {
  const isAr = locale === 'ar';
  const isEn = locale === 'en';

  const title = isAr 
    ? 'المجموعة غير متوفرة حالياً'
    : isEn 
    ? 'Collection Temporarily Unavailable'
    : 'Sélection Momentanément Indisponible';

  const message = isAr
    ? 'تشكيلتنا غير متوفرة حالياً. يرجى إعادة المحاولة بعد لحظات.'
    : isEn
    ? 'Our selection is temporarily unavailable. Please try again in a few moments.'
    : 'Notre sélection est momentanément indisponible. Veuillez réessayer dans quelques instants.';

  const retryText = isAr
    ? 'إعادة المحاولة'
    : isEn
    ? 'Retry'
    : 'Réessayer';

  const contactText = isAr
    ? 'تواصل معنا عبر واتساب'
    : isEn
    ? 'Contact us on WhatsApp'
    : 'Contacter notre conseiller WhatsApp';

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#1A1A1A] flex flex-col justify-between overflow-x-hidden">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#e0ddd4] p-8 sm:p-10 text-center shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0ea5e9] mb-5">
            <Sparkles size={24} strokeWidth={1.75} />
          </div>
          
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9] block mb-2">
            NAY Parfums
          </span>
          
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
            {title}
          </h1>
          
          <p className="text-[13px] text-slate-600 leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full py-3.5 px-6 rounded-full bg-[#1A1A1A] hover:bg-[#0ea5e9] text-white text-[12px] font-bold uppercase tracking-[0.15em] transition shadow-xs flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <RotateCw size={15} />
              <span>{retryText}</span>
            </button>
            
            <a
              href="https://wa.me/212663380011"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 transition flex items-center justify-center gap-2"
            >
              <MessageCircle size={15} className="text-emerald-600" />
              <span>{contactText}</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
