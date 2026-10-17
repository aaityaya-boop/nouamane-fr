'use client';

/**
 * HOMEPAGE — NAY Parfums
 * Featured products logic: Bestsellers · New Arrivals · Seasonal Trends
 * Positioning: Authorized designer perfume retailer in Morocco
 */

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import SplitTypographyHero from '@/components/SplitTypographyHero';
import BrandsMarquee from '@/components/BrandsMarquee';
import FAQ from '@/components/FAQ';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false });
import {
  ArrowRight,
  MoveRight,
  Star,
  Truck,
  ShieldCheck,
  Gift,
  BadgeCheck,
  Sparkles,
  Flame,
  Leaf,
  Sun,
} from 'lucide-react';
import {
  Product,
  getSeasonalTrends,
  MAIN_CATEGORIES,
} from '@/lib/products';

const fadeUpProps: any = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8, ease: 'easeOut' }
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const staggerItem: any = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

export default function HomePageClient({ 
  products, 
  config, 
  latestReviews = [],
  initialBrands = []
}: { 
  products: Product[], 
  config?: any, 
  latestReviews?: any[],
  initialBrands?: any[]
}) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const newArrivalsDefault = [...products].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()).slice(0, 4);

  const currentMonth = new Date().getMonth();
  const isFallWinter = currentMonth >= 8 || currentMonth <= 1;

  const [brands, setBrands] = useState<any[]>(initialBrands);
  const [homepageConfig, setHomepageConfig] = useState<any>(config || null);

  const seasonalTitleFull = homepageConfig?.seasonalTrendTitle || (isFallWinter ? 'Tendances Automne-Hiver' : 'Tendances Printemps-Été');
  const seasonalTitleParts = seasonalTitleFull.split(' ');
  const titleFirstPart = seasonalTitleParts[0] || 'Tendances';
  const titleSecondPart = seasonalTitleParts.slice(1).join(' ') || (isFallWinter ? 'Automne-Hiver' : 'Printemps-Été');
  
  // Extract seasons based on keywords in the title so the button links correctly
  let extractedSeasons: string[] = [];
  const lowerTitle = seasonalTitleFull.toLowerCase();
  if (lowerTitle.includes('automne')) extractedSeasons.push('Automne');
  if (lowerTitle.includes('hiver')) extractedSeasons.push('Hiver');
  if (lowerTitle.includes('printemps')) extractedSeasons.push('Printemps');
  if (lowerTitle.includes('été') || lowerTitle.includes('ete') || lowerTitle.includes('étè')) extractedSeasons.push('Été');
  
  const seasonQueryParam = extractedSeasons.length > 0 
    ? extractedSeasons.join(',') 
    : (isFallWinter ? 'Automne,Hiver' : 'Printemps,Été');

  const displaySeasonalSubtitle = homepageConfig?.seasonalTrendSubtitle || (isFallWinter
    ? 'Nos parfums chauds, épicés et enveloppants pour la saison froide.'
    : 'Nos fragrances fraîches, solaires et florales pour la belle saison.');

  useEffect(() => {
    if (initialBrands.length === 0) {
      fetch('/api/brands')
        .then(res => res.json())
        .then(data => setBrands(data))
        .catch(console.error);
    }

    if (!config) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => setHomepageConfig(data))
        .catch(console.error);
    }
  }, [initialBrands.length, config]);

  // Use admin-configured products if set, else fallback to tag-based
  const bestsellersDisplay = (() => {
    try {
      const slugs: string[] = JSON.parse(homepageConfig?.featuredBestsellers || '[]');
      if (slugs.length >= 1) {
        const configured = slugs.map(s => products.find(p => p.slug === s)).filter(Boolean) as typeof products;
        if (configured.length < 4) {
          const fallback = products.filter(p => p.tags.includes('bestseller') && !configured.find(c => c.id === p.id));
          const padding = fallback.length >= (4 - configured.length) ? fallback : products.filter(p => !configured.find(c => c.id === p.id));
          return [...configured, ...padding.slice(0, 4 - configured.length)];
        }
        return configured;
      }
    } catch {}
    const tagged = products.filter(p => p.tags.includes('bestseller'));
    return tagged.length >= 4 ? tagged.slice(0, 8) : products.slice(0, 8);
  })();

  const seasonalTrends = (() => {
    try {
      const slugs: string[] = JSON.parse(homepageConfig?.featuredSeasonal || '[]');
      if (slugs.length >= 1) {
        const configured = slugs.map(s => products.find(p => p.slug === s)).filter(Boolean) as typeof products;
        if (configured.length < 4) {
          const fallback = products.filter(p => (p.tags.includes('seasonal-fall') || p.tags.includes('seasonal-spring')) && !configured.find(c => c.id === p.id));
          const padding = fallback.length >= (4 - configured.length) ? fallback : products.filter(p => p.gender === 'women' && !configured.find(c => c.id === p.id));
          return [...configured, ...padding.slice(0, 4 - configured.length)];
        }
        return configured;
      }
    } catch {}
    const tagged = products.filter(p => p.tags.includes('seasonal-fall') || p.tags.includes('seasonal-spring'));
    return tagged.length >= 4 ? tagged.slice(0, 8) : products.filter(p => p.gender === 'women').slice(0, 8);
  })();

  const newArrivals = (() => {
    try {
      const slugs: string[] = JSON.parse(homepageConfig?.featuredLatest || '[]');
      if (slugs.length >= 1) {
        const configured = slugs.map(s => products.find(p => p.slug === s)).filter(Boolean) as typeof products;
        if (configured.length < 4) {
          const padding = newArrivalsDefault.filter(p => !configured.find(c => c.id === p.id));
          return [...configured, ...padding.slice(0, 4 - configured.length)];
        }
        return configured;
      }
    } catch {}
    return newArrivalsDefault;
  })();

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] overflow-x-hidden">
      <Header />

      {/* ===============================
          HERO (SPLIT TYPOGRAPHY)
          =============================== */}
      <SplitTypographyHero config={config} />
      {/* ===============================
          CATEGORY SHORTCUTS (Minimalist Editorial Aura)
          =============================== */}
      <section className="relative w-full bg-white overflow-hidden">
        {/* Subtle background aura to link with Hero */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#0ea5e9]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#0ea5e9]/5 rounded-full blur-[100px] pointer-events-none translate-y-1/3 translate-x-1/3" />

        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 lg:pt-32 pb-16">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.5em] uppercase text-[#0ea5e9] mb-6">
              Nos collections
            </span>
            <h2 className="heading-font text-5xl sm:text-6xl lg:text-7xl tracking-tight text-[#111] leading-none">
              Parcourir par <span className="font-serif italic font-light text-[#0ea5e9]">&nbsp;Catégorie</span>
            </h2>
          </div>
        </div>

        {/* Three-column Glassmorphism Marketing Cards */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 pb-24 lg:pb-32">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {MAIN_CATEGORIES.map((cat, index) => (
              <motion.div
                variants={staggerItem}
                key={cat.slug}
                className="group cursor-pointer relative h-auto min-h-[340px] rounded-[30px] overflow-hidden bg-gradient-to-br from-[#f8fafc] to-white border border-[#e0ddd4] hover:border-[#0ea5e9]/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-700"
              >
                <Link href={`/${locale}/shop/${cat.slug}`} className="flex flex-col h-full w-full p-8 lg:p-10 relative z-10">
                  {/* Subtle Background Accent */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#0ea5e9]/5 rounded-full blur-[40px] translate-x-1/3 -translate-y-1/3 group-hover:scale-150 transition-transform duration-1000 pointer-events-none" />

                  <div className="mt-auto z-20">
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#0ea5e9] mb-3 block">
                          Collection 0{index + 1}
                        </span>
                        <h3 className="heading-font text-3xl lg:text-4xl text-[#1A1A1A] tracking-wide group-hover:text-[#0ea5e9] transition-colors duration-500">
                          {cat.labelShort}
                        </h3>
                      </div>
                      {/* Elegant CTA Arrow */}
                      <div className="w-12 h-12 rounded-full border border-[#e0ddd4] bg-white flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#1A1A1A] group-hover:text-white group-hover:border-[#1A1A1A] transition-all duration-500 flex-shrink-0 shadow-sm">
                        <ArrowRight size={18} />
                      </div>
                    </div>

                    <p className="text-[#6B6B6B] text-[13px] font-light leading-[1.7] tracking-wide line-clamp-2 lg:pr-12">
                      {cat.description}
                    </p>
                    
                    {/* Secondary Action / Trust Signal */}
                    <div className="mt-8 pt-6 border-t border-[#e0ddd4]/60 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A] font-semibold group-hover:text-[#0ea5e9] transition-colors">Explorer</span>
                      <span className="text-[9px] uppercase tracking-widest text-[#0ea5e9] font-bold bg-[#0ea5e9]/10 px-3 py-1.5 rounded-full border border-[#0ea5e9]/20">
                        Qualité Premium
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===============================
          FEATURED — BESTSELLERS
          =============================== */}
      <section className="relative bg-[#f8fafc] border-y border-[#e0ddd4] overflow-hidden py-24 lg:py-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-tr from-[#0ea5e9]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-16 relative z-10">
          <SectionHeader
            icon={<Flame size={16} className="text-[#0ea5e9]" />}
            eyebrow="Les plus vendus au Maroc"
            title="Bestsellers"
            subtitle="Les fragrances plébiscitées par nos clients ce mois-ci."
            linkLabel="Voir tous les bestsellers"
            linkHref={`/${locale}/shop`}
          />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-10 pb-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7"
          >
            {bestsellersDisplay.map((p) => (
              <motion.div variants={staggerItem} key={p.id}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===============================
          COFFRETS CADEAUX (FULL-BLEED CAROUSEL)
          =============================== */}
      <section className="relative w-full py-20 lg:py-32 overflow-hidden flex items-center my-20">
        {/* Background Image / Cover */}
        <div className="absolute inset-0 z-0">
          <Image 
            src={config?.coffretsCoverImage || "/images/category/pack-decouverte-luxe.jpg"} 
            alt="L'Art d'Offrir" 
            fill 
            className="object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/20" />
        </div>

        <div className="relative z-10 w-full flex flex-col lg:flex-row items-center">
          {/* Left Side: Text Content */}
          <div className="w-full lg:w-[40%] px-6 lg:pl-[max(2.5rem,calc((100vw-1400px)/2+2.5rem))] mb-12 lg:mb-0">
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37] mb-6 flex items-center gap-2">
              <Sparkles size={14} /> L'Art d'Offrir
            </span>
            <h2 className="heading-font text-5xl md:text-7xl text-white tracking-wide mb-6 leading-tight">Coffrets Cadeaux</h2>
            <p className="text-white/80 text-[16px] leading-relaxed mb-10 max-w-md">
              Découvrez nos éditions spéciales conçues pour laisser une empreinte inoubliable. L'assemblage parfait de nos fragrances signatures, présenté dans un écrin d'exception.
            </p>
            <Link href={`/${locale}/coffrets`} className="inline-flex items-center gap-3 bg-white text-black text-[13px] font-medium px-8 py-4 rounded-full hover:bg-[#D4AF37] hover:text-white transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.3)] group">
              Explorer la Collection
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Right Side: Carousel */}
          <div className="w-full lg:w-[60%] pl-6 lg:pl-12">
            <div className="flex gap-6 lg:gap-8 overflow-x-auto snap-x snap-mandatory pb-12 pr-6 lg:pr-10 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {products.filter(p => p.subcategory === 'coffrets').map((p) => (
                <div key={p.id} className="min-w-[280px] max-w-[320px] w-[75vw] snap-start flex-shrink-0">
                  <div className="bg-white rounded-[32px] p-2 shadow-2xl h-full border border-white/20 transform hover:-translate-y-2 transition-transform duration-500">
                    <ProductCard product={p} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ===============================
          FEATURED — NEW ARRIVALS
          =============================== */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <SectionHeader
          icon={<Sparkles size={16} className="text-[#0ea5e9]" />}
          eyebrow=""
          title="Les dernières sorties"
          subtitle="Découvrez les nouvelles créations qui viennent d'arriver dans nos rayons."
          linkLabel="Voir toutes les nouveautés"
          linkHref={`/${locale}/shop`}
        />
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7"
        >
          {newArrivals.map((p) => (
            <motion.div variants={staggerItem} key={p.id}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===============================
          FEATURED — SEASONAL
          =============================== */}
      <section className="relative bg-gradient-to-br from-[#fefce8] via-[#f0f9ff] to-[#e0f2fe] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        
        {/* Decorative elements for summer vibes */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#fde047] rounded-full blur-[150px] opacity-30 pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#38bdf8] rounded-full blur-[150px] opacity-20 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24 lg:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                {isFallWinter ? <Leaf size={14} className="text-[#ea580c]" /> : <Sun size={14} className="text-[#eab308]" />}
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#0ea5e9]">Édition saisonnière</span>
              </div>
              <h2 className="heading-font text-5xl lg:text-7xl text-[#1A1A1A] tracking-wide">
                {titleFirstPart}<br />
                <span className="text-[#0ea5e9] italic">{titleSecondPart}</span>
              </h2>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-4">
              <p className="text-[#1A1A1A]/70 text-[14px] max-w-xs text-left lg:text-right font-medium">{displaySeasonalSubtitle}</p>
              <Link href={`/${locale}/shop?seasons=${seasonQueryParam}`} className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A] border border-[#1A1A1A]/30 hover:bg-[#0ea5e9] hover:border-[#0ea5e9] hover:text-white transition-all px-6 py-3 rounded-full">
                Explorer la sélection <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7"
          >
            {seasonalTrends.map((p) => (
              <motion.div variants={staggerItem} key={p.id}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===============================
          BRAND SHOWCASE (5 Marques Mythiques)
          =============================== */}
      <section id="brands" className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">
            L'Élite de la Parfumerie
          </span>
          <h2 className="heading-font text-5xl lg:text-6xl mt-4 tracking-wide">
            5 Marques Mythiques
          </h2>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col md:flex-row h-[900px] md:h-[700px] w-full gap-3 overflow-hidden group/accordion"
        >
          {[
            { name: 'Yves Saint Laurent', slug: 'yves-saint-laurent', logo: '/logos/ysl.png', img: 'https://images.pexels.com/photos/11216321/pexels-photo-11216321.jpeg?auto=compress&cs=tinysrgb&w=800' },
            { name: 'Valentino', slug: 'valentino', logo: '/logos/valentino.jpg', img: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800' },
            { name: 'Jean Paul Gaultier', slug: 'jean-paul-gaultier', logo: '/logos/jean-paul-gaultier.png', img: 'https://images.pexels.com/photos/1961791/pexels-photo-1961791.jpeg?auto=compress&cs=tinysrgb&w=800' },
            { name: 'Dior', slug: 'dior', logo: '/logos/dior.jpeg', img: 'https://images.pexels.com/photos/432059/pexels-photo-432059.jpeg?auto=compress&cs=tinysrgb&w=800' },
            { name: 'Giorgio Armani', slug: 'armani', logo: '/logos/armani.png', img: 'https://images.pexels.com/photos/1961795/pexels-photo-1961795.jpeg?auto=compress&cs=tinysrgb&w=800' }
          ].map((brand) => (
            <motion.div 
              variants={staggerItem} 
              key={brand.slug} 
              className="brand-slice group relative flex-1 md:hover:flex-[4] transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden rounded-3xl cursor-pointer"
            >
              <Link href={`/${locale}/brands/${brand.slug}`} className="block w-full h-full bg-white relative">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  className="object-contain p-10 mix-blend-multiply opacity-30 group-hover:opacity-100 transition-all duration-[1.5s] scale-90 group-hover:scale-100"
                />
                
                {/* Vertical Text (Collapsed state on desktop) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 md:opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none">
                  <span className="heading-font text-[#1A1A1A] text-3xl -rotate-90 whitespace-nowrap tracking-widest">{brand.name}</span>
                </div>

                {/* Content shown on hover */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none transform translate-y-8 group-hover:translate-y-0 z-10">
                  <span className="text-[12px] font-bold tracking-[0.3em] uppercase text-white bg-[#1A1A1A] shadow-xl px-6 py-3 rounded-full border border-black/10">
                    Découvrir {brand.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===============================
          VALUE PROPOSITIONS
          =============================== */}
      <section className="bg-[#f8fafc] text-[#1A1A1A]">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8"
        >
          {[
            { icon: <BadgeCheck size={22} strokeWidth={1.5} />, title: '100% Authentiques', desc: 'Nos parfums proviennent directement des distributeurs officiels de chaque maison. Facture d\'origine sur demande.' },
            { icon: <Truck size={22} strokeWidth={1.5} />, title: 'Livraison 35Dh', desc: 'Livraison partout au Maroc avec 35Dh en 24-48h. Suivi par SMS et WhatsApp inclus.' },
            { icon: <ShieldCheck size={22} strokeWidth={1.5} />, title: 'Paiement à la livraison', desc: 'Payez en toute sérénité à la réception. Aucun risque, aucune surprise.' },
            { icon: <Star size={22} strokeWidth={1.5} />, title: 'Authenticité garantie', desc: 'Tous nos parfums sont 100% originaux et certifiés authentiques.' },
          ].map((item) => (
            <motion.div variants={staggerItem} key={item.title} className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#0ea5e9]/40 text-[#0ea5e9] mb-4">
                {item.icon}
              </div>
              <h3 className="heading-font text-xl tracking-wide mb-2 text-[#1A1A1A]">{item.title}</h3>
              <p className="text-[13px] text-[#1A1A1A]/70 leading-[1.7]">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===============================
          TESTIMONIALS (AVIS CLIENTS) — Redesigned
          =============================== */}
      <section className="relative bg-[#0D0D0D] overflow-hidden py-28 lg:py-40">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0ea5e9]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0ea5e9]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-20 gap-8"
          >
            <div>
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#0ea5e9] mb-6 block">
                Ils nous font confiance
              </span>
              <h2 className="heading-font text-5xl lg:text-8xl text-white tracking-wide leading-none">
                Avis de<br /><span className="text-[#9A9A9A] italic">nos clients</span>
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="heading-font text-5xl text-white">4.9</div>
                <div className="flex gap-1 justify-center mt-2">
                  {[...Array(5)].map((_, j) => <Star key={j} size={12} className="text-[#0ea5e9] fill-[#0ea5e9]" />)}
                </div>
                <div className="text-[11px] text-[#9A9A9A] mt-1">Note moyenne</div>
              </div>
              <div className="w-[1px] h-16 bg-white/10" />
              <div className="text-center">
                <div className="heading-font text-5xl text-white">500+</div>
                <div className="text-[11px] text-[#9A9A9A] mt-1">Clients satisfaits</div>
              </div>
            </div>
          </motion.div>

          {/* Reviews grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {(latestReviews && latestReviews.length > 0 ? latestReviews : [
              { comment: "C'est la 3ème fois kanakhd mn 3andkom. Service top w la livraison sur Casablanca kant f 24h. Le parfum Amouage rah 100% original w chadda fih ri7a mzyan!", author: "Yassir B.", city: "Casablanca", product: { name: "Amouage Interlude Man" }, rating: 5 },
              { comment: "Franchement j'avais des doutes, mais sda9 site sadi9. Khdit Baccarat Rouge tester, c'est l'original. Tbarkallah 3likom, bonne continuation.", author: "Mounia T.", city: "Marrakech", product: { name: "Baccarat Rouge 540" }, rating: 5 },
              { comment: "Service client f lmostawa. 3awnoni n3zal parfum li bghit. La livraison l Tanger kant rapide w l'emballage n9i. Recommandé à 100%!", author: "Ayoub R.", city: "Tanger", product: { name: "Armani Stronger With You" }, rating: 5 },
              { comment: "J'étais fatigué d'acheter des parfums chez des revendeurs douteux. La garantie d'authenticité et la livraison rapide de NAY font toute la différence. Stronger With You est parfait!", author: "Hassan L.", city: "Casablanca", product: { name: "Armani Stronger With You" }, rating: 5 },
              { comment: "Expérience incroyable. Le parfum est arrivé dans un emballage soigné en moins de 48h. L'odeur est 100% authentique. Je recommande à tous mes proches.", author: "Salma B.", city: "Rabat", product: { name: "YSL Libre Eau de Parfum" }, rating: 5 },
              { comment: "Un service client exceptionnel et un choix incroyable des plus grandes maisons de luxe. C'est de loin ma meilleure expérience d'achat de parfum au Maroc.", author: "Youssef E.", city: "Tanger", product: { name: "Valentino Uomo Intense" }, rating: 5 },
            ]).map((review: any, i: number) => (
              <motion.div
                variants={staggerItem}
                key={review.id || i}
                className={`relative group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 flex flex-col justify-between ${
                  i === 1 ? 'lg:mt-12' : i === 3 ? 'lg:mt-8' : i === 5 ? 'lg:mt-16' : ''
                }`}
              >
                {/* Quote mark */}
                <div className="absolute top-6 right-8 text-[80px] leading-none text-white/5 font-serif select-none">"</div>
                
                <div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} size={13} className="text-[#0ea5e9] fill-[#0ea5e9]" />
                    ))}
                  </div>
                  <blockquote className="text-[15px] text-white/80 leading-[1.9] mb-8">
                    {review.comment}
                  </blockquote>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-6">
                  <div>
                    <div className="text-[12px] font-bold tracking-[0.2em] uppercase text-white">
                      {review.author}
                    </div>
                    <div className="text-[11px] text-[#9A9A9A] mt-1">
                      Client vérifié · {review.city}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#0ea5e9] font-bold tracking-wide text-right max-w-[120px]">
                    {review.product?.name}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-16 flex justify-center">
            <Link href={`/${locale}/shop`} className="text-white border border-white/30 hover:bg-white hover:text-black transition-all px-8 py-4 rounded-full text-[12px] font-bold tracking-[0.15em] uppercase text-center inline-flex items-center gap-2">
              Vous avez acheté chez nous ? Laissez un avis ! <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <BrandsMarquee brands={brands} />
      <FAQ />

      <Footer />
      <CartDrawer />
    </div>
  );
}

/* ============================================================
   SECTION HEADER — reusable
   ============================================================ */
function SectionHeader({
  icon,
  eyebrow,
  title,
  subtitle,
  linkLabel,
  linkHref,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  linkLabel: string;
  linkHref: string;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">
            {eyebrow}
          </span>
        </div>
        <h2 className="heading-font text-4xl lg:text-5xl tracking-wide">{title}</h2>
        <p className="mt-3 text-[14px] text-[#6B6B6B] max-w-lg">{subtitle}</p>
      </div>
      <Link
        href={linkHref}
        className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#6B6B6B] hover:text-[#0ea5e9] transition-colors group self-start"
      >
        {linkLabel}
        <span className="block w-8 h-px bg-[#6B6B6B] group-hover:bg-[#0ea5e9] transition-colors" />
      </Link>
    </motion.div>
  );
}



