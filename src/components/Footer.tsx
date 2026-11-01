'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDictionary } from '@/context/DictionaryContext';
import { 
  Phone, 
  Mail, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Banknote, 
  Headphones,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function Footer() {
  const dict = useDictionary();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const isAr = locale === 'ar';
  const isEn = locale === 'en';

  const [config, setConfig] = useState<any>({});
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(console.error);

    fetch('/api/brands')
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(console.error);
  }, []);

  const phone = config.contactPhone || '+212 663-380011';
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const emailAddr = config.contactEmail || 'contact@nayparfum.ma';
  const whatsappUrl = config.whatsappUrl || 'https://api.whatsapp.com/send?phone=212663380011';

  return (
    <footer className="bg-gradient-to-b from-[#FCFBF9] via-[#FAF8F5] to-[#F4F0E8] border-t border-[#E8E2D5] text-[#111827] overflow-hidden pb-28 sm:pb-32 lg:pb-16 pt-10 sm:pt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* ========================================================
            1. TOP REASSURANCE STRIP (4 TRUST PILLARS)
            Builds Immediate Prestige & E-Commerce Credibility
            ======================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-10 sm:mb-14 pb-8 sm:pb-12 border-b border-[#ECE5D8]">
          {/* Pillar 1: Delivery */}
          <div className="bg-white/80 rounded-2xl border border-[#EAE3D5] p-3 sm:p-4 flex items-start gap-2.5 shadow-2xs">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0284c7]/10 flex items-center justify-center text-[#0284c7] shrink-0 mt-0.5">
              <Truck size={17} />
            </div>
            <div>
              <h5 className="text-[11px] sm:text-[12.5px] font-bold text-[#111827] leading-tight">
                {isAr ? 'توصيل سريع 24/48 ساعة' : isEn ? 'Express Delivery 24/48h' : 'Livraison Express 24/48h'}
              </h5>
              <p className="text-[9.5px] sm:text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                {isAr ? 'كافة مدن المملكة' : isEn ? 'Nationwide Morocco' : 'Partout au Maroc'}
              </p>
            </div>
          </div>

          {/* Pillar 2: COD */}
          <div className="bg-white/80 rounded-2xl border border-[#EAE3D5] p-3 sm:p-4 flex items-start gap-2.5 shadow-2xs">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0284c7]/10 flex items-center justify-center text-[#0284c7] shrink-0 mt-0.5">
              <Banknote size={17} />
            </div>
            <div>
              <h5 className="text-[11px] sm:text-[12.5px] font-bold text-[#111827] leading-tight">
                {isAr ? 'معاينة قبل الدفع' : isEn ? 'Inspection Before Payment' : 'Paiement à la livraison'}
              </h5>
              <p className="text-[9.5px] sm:text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                {isAr ? 'افتح الكولية وتأكد بنفسك' : isEn ? 'Inspect package first' : 'Vérifiez votre colis'}
              </p>
            </div>
          </div>

          {/* Pillar 3: Authenticity */}
          <div className="bg-white/80 rounded-2xl border border-[#EAE3D5] p-3 sm:p-4 flex items-start gap-2.5 shadow-2xs">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0284c7]/10 flex items-center justify-center text-[#0284c7] shrink-0 mt-0.5">
              <ShieldCheck size={17} />
            </div>
            <div>
              <h5 className="text-[11px] sm:text-[12.5px] font-bold text-[#111827] leading-tight">
                {isAr ? 'ضمان الأصالة 100%' : isEn ? '100% Guaranteed Authentic' : '100% Authentique & Garanti'}
              </h5>
              <p className="text-[9.5px] sm:text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                {isAr ? 'عطور مختومة وتيسترات أصلية' : isEn ? 'Sealed bottles & testers' : 'Flacons scellés & certifiés'}
              </p>
            </div>
          </div>

          {/* Pillar 4: VIP Concierge */}
          <div className="bg-white/80 rounded-2xl border border-[#EAE3D5] p-3 sm:p-4 flex items-start gap-2.5 shadow-2xs">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0284c7]/10 flex items-center justify-center text-[#0284c7] shrink-0 mt-0.5">
              <Headphones size={17} />
            </div>
            <div>
              <h5 className="text-[11px] sm:text-[12.5px] font-bold text-[#111827] leading-tight">
                {isAr ? 'مستشار عطري متاح 7/7' : isEn ? 'VIP Concierge 7/7' : 'Conseil Olfactif VIP 7j/7'}
              </h5>
              <p className="text-[9.5px] sm:text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                {isAr ? 'استشارة فورية عبر واتساب' : isEn ? 'Instant WhatsApp advice' : 'Accompagnement dédié'}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. MAIN FOOTER CONTENT GRID
            Brand + Direct Concierge + Links + Newsletter Card
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* LEFT COLUMN: MAISON IDENTITY & VIP CONTACT (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              {/* Brand Logo */}
              <Link href={`/${locale}/`} aria-label="NAY Parfums - Accueil" className="inline-flex items-center group">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 transition-colors duration-300 bg-[#111827] group-hover:bg-[#0284c7]"
                  style={{
                    maskImage: 'url("/images/nay/Artboard%202.png")',
                    WebkitMaskImage: 'url("/images/nay/Artboard%202.png")',
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                  }}
                />
              </Link>

              {/* Maison Description */}
              <p className="mt-4 text-[#4B5563] text-[12.5px] sm:text-[13px] leading-[1.7] max-w-sm">
                {dict.footer.aboutText}
              </p>

              {/* VIP Concierge Instant Action Badges */}
              <div className="mt-6 flex flex-col sm:flex-row lg:flex-col gap-2">
                {/* WhatsApp Action Pill */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all text-emerald-800 group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[11.5px] font-bold block leading-tight">
                        {isAr ? 'مستشار واتساب فوري' : 'WhatsApp Concierge VIP'}
                      </span>
                      <span className="text-[9.5px] text-emerald-700/80 font-medium">
                        {phone} · {isAr ? 'رد فوري' : 'Réponse rapide 7j/7'}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-emerald-700 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform rtl:rotate-180" />
                </a>

                {/* Direct Phone Call Pill */}
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5E0D4] transition-all text-[#111827] group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#0284c7]/10 text-[#0284c7] flex items-center justify-center shrink-0">
                      <Phone size={14} />
                    </div>
                    <div>
                      <span className="text-[11.5px] font-bold block leading-tight">
                        {isAr ? 'اتصال مباشر' : 'Appel Direct'}
                      </span>
                      <span className="text-[9.5px] text-[#6B7280]">
                        {phone}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-[#6B7280] group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform rtl:rotate-180" />
                </a>
              </div>
            </div>

            {/* Circular Luxury Social Buttons */}
            <div className="mt-6 pt-5 border-t border-[#ECE5D8]">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#6B7280] block mb-3">
                {isAr ? 'تابعونا على وسائل التواصل' : 'Rejoignez la communauté'}
              </span>
              <div className="flex items-center gap-2.5">
                {config.instagramUrl && (
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram NAY Parfums"
                    className="w-9 h-9 rounded-full bg-white hover:bg-[#E1306C] hover:text-white border border-[#E5E0D4] hover:border-transparent flex items-center justify-center text-[#111827] transition-all duration-200 shadow-2xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </a>
                )}
                {config.tiktokUrl && (
                  <a
                    href={config.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok NAY Parfums"
                    className="w-9 h-9 rounded-full bg-white hover:bg-black hover:text-white border border-[#E5E0D4] hover:border-transparent flex items-center justify-center text-[#111827] transition-all duration-200 shadow-2xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                  </a>
                )}
                {config.facebookUrl && (
                  <a
                    href={config.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook NAY Parfums"
                    className="w-9 h-9 rounded-full bg-white hover:bg-[#1877F2] hover:text-white border border-[#E5E0D4] hover:border-transparent flex items-center justify-center text-[#111827] transition-all duration-200 shadow-2xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                  </a>
                )}
                {config.whatsappUrl && (
                  <a
                    href={config.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp NAY Parfums"
                    className="w-9 h-9 rounded-full bg-white hover:bg-[#25D366] hover:text-white border border-[#E5E0D4] hover:border-transparent flex items-center justify-center text-[#111827] transition-all duration-200 shadow-2xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* CENTER COLUMNS: CATEGORIES & MARQUES (lg:col-span-4) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-6 sm:gap-8">
            {/* Univers / Boutique */}
            <div>
              <h4 className="text-[10.5px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#111827] mb-3.5 sm:mb-5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                <span>{dict.footer.boutique}</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href={`/${locale}/testeurs`} className="text-[12px] sm:text-[12.5px] font-bold text-[#0284c7] hover:text-[#0369a1] transition-colors inline-flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#0284c7] shrink-0" />
                    <span>{dict.footer.testers}</span>
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/parfums-originaux`} className="text-[12px] sm:text-[12.5px] text-[#4B5563] hover:text-[#111827] transition-colors block">
                    {dict.footer.sealedPerfumes}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/parfums-orientaux`} className="text-[12px] sm:text-[12.5px] text-[#4B5563] hover:text-[#111827] transition-colors block">
                    {dict.footer.orientalPerfumes}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/coffrets`} className="text-[12px] sm:text-[12.5px] text-[#4B5563] hover:text-[#111827] transition-colors block">
                    {dict.footer.giftSets}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/master-copier`} className="text-[12px] sm:text-[12.5px] text-[#4B5563] hover:text-[#111827] transition-colors block">
                    {dict.footer.masterCopy}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/shop`} className="text-[12px] sm:text-[12.5px] font-semibold text-[#111827] hover:text-[#0284c7] transition-colors block pt-1 border-t border-black/5">
                    {dict.nav.allFragrances}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Marques & Service */}
            <div>
              <h4 className="text-[10.5px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#111827] mb-3.5 sm:mb-5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                <span>{dict.nav.brands}</span>
              </h4>
              <ul className="space-y-2.5">
                {brands.slice(0, 5).map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={`/${locale}/brands/${b.slug}`}
                      className="text-[12px] sm:text-[12.5px] text-[#4B5563] hover:text-[#111827] transition-colors block"
                    >
                      {b.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={`/${locale}/shop`} className="text-[10.5px] font-bold tracking-wider text-[#0284c7] hover:underline uppercase inline-block pt-1">
                    {dict.footer.viewAll}
                  </Link>
                </li>
              </ul>

              {/* Quick Customer Care Links */}
              <div className="mt-5 pt-4 border-t border-black/5">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-2">
                  {dict.footer.customerService}
                </span>
                <ul className="space-y-1.5 text-[11.5px]">
                  <li>
                    <Link href={`/${locale}/suivi-commande`} className="text-[#4B5563] hover:text-[#0284c7] transition-colors block">
                      {dict.footer.orderTracking}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/faq`} className="text-[#4B5563] hover:text-[#0284c7] transition-colors block">
                      {dict.footer.faq}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: "LE CERCLE PRIVÉ" NEWSLETTER CARD (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] p-4 sm:p-6 shadow-xs relative overflow-hidden">
              {/* Subtle Ambient Radial Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles size={14} className="text-[#0284c7]" />
                <span className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-[#0284c7]">
                  {isAr ? 'الدائرة الخاصة' : 'LE CERCLE PRIVÉ'}
                </span>
              </div>

              <h4 className="text-[14px] sm:text-[15px] font-bold text-[#111827] tracking-tight">
                {dict.footer.newsletter}
              </h4>
              <p className="text-[#6B7280] text-[11.5px] sm:text-[12px] leading-[1.6] mt-1 mb-4">
                {dict.footer.newsletterDesc}
              </p>

              {/* Newsletter Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setStatus('loading');
                  try {
                    const res = await fetch('/api/newsletter', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setStatus('success');
                      setMessage(data.message || dict.footer.newsletterSuccess);
                      setEmail('');
                    } else {
                      setStatus('error');
                      setMessage(data.error || "Erreur lors de l'inscription");
                    }
                  } catch {
                    setStatus('error');
                    setMessage('Erreur réseau');
                  }
                }}
                className="space-y-2.5"
              >
                <div className="relative flex items-center">
                  <Mail size={15} className="absolute left-3 rtl:left-auto rtl:right-3 text-[#9CA3AF] pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={dict.footer.emailPlaceholder}
                    disabled={status === 'loading'}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D4] rounded-xl py-2.5 pl-9 pr-3 rtl:pl-3 rtl:pr-9 text-[12px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0284c7] focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-[#111827] hover:bg-[#0284c7] text-white py-2.5 px-4 rounded-xl text-[11px] font-bold tracking-[0.14em] uppercase transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99]"
                >
                  <span>{status === 'loading' ? dict.footer.sending : dict.footer.subscribe}</span>
                  <ArrowRight size={13} className="rtl:rotate-180" />
                </button>

                {message && (
                  <div className={`text-[11px] flex items-center gap-1.5 pt-1 ${status === 'success' ? 'text-emerald-600 font-semibold' : 'text-red-500'}`}>
                    {status === 'success' && <CheckCircle2 size={13} />}
                    <span>{message}</span>
                  </div>
                )}
              </form>

              {/* Privacy Reassurance Note */}
              <p className="text-[10px] text-[#9CA3AF] mt-3 leading-snug">
                {isAr 
                  ? '🔒 نحن نحترم خصوصيتك بالكامل. يمكنك إلغاء الاشتراك في أي وقت.' 
                  : '🔒 Confidentialité respectée. Désinscription en 1 clic à tout moment.'}
              </p>
            </div>
          </div>

        </div>

        {/* ========================================================
            3. FOOTER BASE: LEGAL LINKS, PAYMENT BADGES & COPYRIGHT
            Spacious clearance (pb-28) ensures no collision with taskbar
            ======================================================== */}
        <div className="mt-12 pt-6 border-t border-[#ECE5D8] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#6B7280]">
          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-[10.5px] uppercase tracking-wider">
            <Link href={`/${locale}/blog`} className="hover:text-[#111827] font-semibold transition-colors">
              {dict.footer.blog}
            </Link>
            <span className="text-[#D1D5DB]">·</span>
            <Link href={`/${locale}/legal/terms`} className="hover:text-[#111827] transition-colors">
              {dict.footer.terms}
            </Link>
            <span className="text-[#D1D5DB]">·</span>
            <Link href={`/${locale}/legal/privacy`} className="hover:text-[#111827] transition-colors">
              {dict.footer.privacy}
            </Link>
            <span className="text-[#D1D5DB]">·</span>
            <Link href={`/${locale}/contact`} className="hover:text-[#111827] transition-colors">
              {dict.footer.contact}
            </Link>
            <span className="text-[#D1D5DB]">·</span>
            <Link href={`/${locale}/legal/returns`} className="hover:text-[#111827] transition-colors">
              {dict.footer.returns}
            </Link>
          </div>

          {/* Copyright & Country Badge */}
          <div className="flex items-center gap-2 text-center md:text-right">
            <span>
              © {new Date().getFullYear()} NAY Parfums. {dict.footer.copyright}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-black/5 text-[9px] font-bold text-[#4B5563]">
              🇲🇦 MAROC
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
