import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  return {
    title: 'Découverte',
    description: 'Choisissez votre univers olfactif : Parfums Originaux, Master Copy, ou Testeurs Originaux.',
    openGraph: {
      title: 'Découverte | NAY Parfums',
      description: 'Choisissez votre univers olfactif : Parfums Originaux, Master Copy, ou Testeurs Originaux.',
      url: `https://nayparfum.ma/${currentLocale}/decouverte`,
    },
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/decouverte`,
    },
  };
}

export default async function DecouvertePage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  const choices = [
    {
      id: 'testeurs',
      title: "Testeurs Originaux",
      subtitle: "Le Luxe Authentique",
      description: "Vos parfums de créateurs favoris en format testeur 100% authentique. Toute l'essence du luxe, à un tarif exclusif.",
      buttonText: "Voir les Testeurs",
      link: `/${locale}/testeurs`,
      color: "hover:border-[#0ea5e9]",
      themeText: "text-[#0ea5e9]",
      themeBg: "bg-[#0ea5e9]",
      bgHover: "group-hover:bg-white"
    },
    {
      id: 'master',
      title: "Master Copy",
      subtitle: "L'Art de la Perfection",
      description: "Les plus grandes fragrances mondiales recréées avec une précision chirurgicale, à un prix irrésistible. Sentez le luxe sans compromis.",
      buttonText: "Découvrir la Perfection",
      link: `/${locale}/master-copier`,
      color: "hover:border-[#111]",
      themeText: "text-[#111]",
      themeBg: "bg-[#111]",
      bgHover: "group-hover:bg-white"
    },
    {
      id: 'originaux',
      title: "Parfums Originaux",
      subtitle: "L'Élégance de l'Authenticité",
      description: "Découvrez une sélection de parfums originaux d'exception, intenses et longue tenue.",
      buttonText: "Découvrir les Originaux",
      link: `/${locale}/parfums-originaux`,
      color: "hover:border-[#0ea5e9]",
      themeText: "text-[#0ea5e9]",
      themeBg: "bg-[#0ea5e9]",
      bgHover: "group-hover:bg-white"
    }
  ];

  return (
    <main className="min-h-screen bg-[#FCFCFC] text-[#111] selection:bg-[#0ea5e9] selection:text-white flex flex-col">
      <Header />
      
      {/* Intro Section */}
      <section className="pt-32 pb-12 px-6 text-center max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-center gap-4 mb-6 animate-[fade-in-up_1s_ease-out_forwards]">
          <div className="h-[1px] w-8 sm:w-12 bg-[#111]/20"></div>
          <span className="text-[#111]/60 text-[9px] sm:text-[10px] font-bold tracking-[0.4em] uppercase">Votre Voyage Olfactif</span>
          <div className="h-[1px] w-8 sm:w-12 bg-[#111]/20"></div>
        </div>
        <h1 className="heading-font text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light mb-6 leading-tight animate-[fade-in-up_1s_ease-out_0.2s_forwards]">
          Choisissez votre <span className="font-serif italic text-[#0ea5e9]">Univers</span>
        </h1>
        <p className="text-[13px] md:text-[15px] text-[#666] font-light max-w-2xl mx-auto leading-[2] tracking-[0.1em] uppercase animate-[fade-in-up_1s_ease-out_0.4s_forwards]">
          Trois expériences uniques. Une seule promesse d'excellence. Laissez-vous guider vers la fragrance qui révélera votre identité.
        </p>
      </section>

      {/* Choices Grid */}
      <section className="flex-1 px-4 sm:px-6 md:px-12 pb-24 max-w-[1800px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full min-h-[60vh]">
          {choices.map((choice, index) => (
            <Link 
              key={choice.id}
              href={choice.link}
              className={`group relative overflow-hidden flex flex-col justify-end p-8 sm:p-12 min-h-[450px] lg:min-h-full rounded-[30px] border border-[#e0ddd4] bg-white transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 ${choice.color}`}
              style={{ animationDelay: `${0.6 + index * 0.2}s` }}
            >
              {/* Hover Typography Background */}
              <div className={`absolute inset-0 z-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${choice.themeBg}`}>
                {/* Huge decorative category name */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                   <span className="font-serif italic text-7xl md:text-8xl lg:text-[110px] text-white/10 whitespace-nowrap -rotate-12 scale-90 group-hover:scale-100 transition-transform duration-1000 ease-out">
                     {choice.title}
                   </span>
                </div>
              </div>

              {/* Default State Background (Solid White with subtle gradient) */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] to-white z-0 group-hover:opacity-0 transition-opacity duration-700" />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full transition-all duration-1000">
                <span className={`text-[10px] font-bold tracking-[0.3em] uppercase mb-4 transition-colors duration-700 ${choice.themeText} group-hover:text-white/80`}>
                  {choice.subtitle}
                </span>
                
                <h2 className="heading-font text-4xl sm:text-5xl text-[#1A1A1A] group-hover:text-white transition-colors duration-700 mb-6 leading-tight">
                  {choice.title}
                </h2>
                
                <p className="text-[14px] text-[#6B6B6B] group-hover:text-gray-300 transition-colors duration-700 mb-12 leading-relaxed max-w-sm">
                  {choice.description}
                </p>
                
                <div className="mt-auto">
                  <div className="inline-flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full border border-[#e0ddd4] group-hover:border-transparent ${choice.bgHover} flex items-center justify-center transition-all duration-500 group-hover:shadow-lg`}>
                      <svg className={`w-4 h-4 text-[#111] transition-all duration-500 transform group-hover:translate-x-1 ${choice.themeText.replace('text-', 'group-hover:text-')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A] group-hover:text-white transition-colors duration-500">
                      {choice.buttonText}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
