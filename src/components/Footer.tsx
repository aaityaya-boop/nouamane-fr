'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MAIN_CATEGORIES } from '@/lib/products';
import { useDictionary } from '@/context/DictionaryContext';
import { Phone, Mail, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export default function Footer() {
  const dict = useDictionary();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
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

  return (
    <footer className="bg-[#fafaf7] border-t border-[#e0ddd4] text-[#1A1A1A]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-y-14 gap-x-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <Link href={`/${locale}/`} aria-label="NAY Parfums - Accueil" className="inline-block group">
              <div
                  className="w-16 h-16 lg:w-20 lg:h-20 transition-colors duration-500 bg-[#1A1A1A] group-hover:bg-[#0ea5e9]"
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

            <p className="mt-6 max-w-xs text-[#1A1A1A]/80 text-[14px] leading-[1.7]">
              {dict.footer.aboutText}
            </p>

            <div className="mt-8 space-y-2.5 text-[13px] text-[#1A1A1A]/85">
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="text-[#0ea5e9]" />
                <span>{config.contactPhone || '+212 663-380011'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={14} className="text-[#0ea5e9]" />
                <span>{config.contactEmail || 'contact@nayparfum.ma'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-6 mt-8">
              {config.instagramUrl && (
                <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram NAY Parfums" className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]/75 hover:text-[#0ea5e9] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  Instagram
                </a>
              )}
              {config.facebookUrl && (
                <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook NAY Parfums" className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]/75 hover:text-[#0ea5e9] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                  Facebook
                </a>
              )}
              {config.tiktokUrl && (
                <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok NAY Parfums" className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]/75 hover:text-[#0ea5e9] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                  TikTok
                </a>
              )}
              {config.whatsappUrl && (
                <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp NAY Parfums" className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]/75 hover:text-[#0ea5e9] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  WhatsApp
                </a>
              )}
              {!config.instagramUrl && !config.facebookUrl && !config.tiktokUrl && !config.whatsappUrl && (
                <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]/50">
                  Réseaux sociaux bientôt disponibles
                </div>
              )}
            </div>
          </div>

          {/* Boutique */}
          <div className="md:col-span-3">
            <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#1A1A1A]/50 mb-6">
              {dict.footer.boutique}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/testeurs`} className="text-[13px] font-semibold text-[#0ea5e9] hover:text-[#0284c7] transition-colors inline-flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#0ea5e9]" />
                  <span>Testeurs de Luxe</span>
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/parfums-originaux`} className="text-[13px] text-[#1A1A1A]/70 hover:text-[#0ea5e9] transition-colors">
                  Parfums Originaux
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/parfums-orientaux`} className="text-[13px] text-[#1A1A1A]/70 hover:text-[#0ea5e9] transition-colors">
                  Parfums Orientaux
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/coffrets`} className="text-[13px] text-[#1A1A1A]/70 hover:text-[#0ea5e9] transition-colors">
                  Coffrets Cadeaux
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/master-copier`} className="text-[13px] text-[#1A1A1A]/70 hover:text-[#0ea5e9] transition-colors">
                  Master Copy
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/shop`} className="text-[13px] font-medium text-[#1A1A1A]/90 hover:text-[#0ea5e9] transition-colors">
                  {dict.nav.allFragrances}
                </Link>
              </li>
            </ul>
          </div>

          {/* Marques */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#1A1A1A]/50 mb-6">
              {dict.nav.brands}
            </h4>
            <ul className="space-y-4">
              {brands.slice(0, 5).map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/${locale}/brands/${b.slug}`}
                    className="text-[13px] text-[#1A1A1A]/70 hover:text-[#0ea5e9] transition-colors"
                  >
                    {b.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`/${locale}/shop`} className="text-[11px] font-bold tracking-wider text-[#0ea5e9] hover:text-[#0284c7] transition-colors uppercase mt-2 inline-block">
                  + Voir toutes
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-3">
            <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#1A1A1A]/50 mb-6">
              {dict.footer.newsletter}
            </h4>
            <p className="text-[#1A1A1A]/60 text-[13px] leading-[1.7] mb-6">
              {dict.footer.newsletterDesc}
            </p>

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
                    setMessage(data.message || 'Inscription réussie ! Votre e-mail avec -10% vous a été envoyé.');
                    setEmail('');
                  } else {
                    setStatus('error');
                    setMessage(data.error || 'Erreur lors de l\'inscription');
                  }
                } catch {
                  setStatus('error');
                  setMessage('Erreur réseau');
                }
              }}
              className="flex flex-col gap-2.5"
            >
              <div className="flex items-center border-b border-[#1A1A1A]/20 pb-3 gap-3 group focus-within:border-[#0ea5e9] transition-colors">
                <Mail size={15} className="text-[#1A1A1A]/40 group-focus-within:text-[#0ea5e9] transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VOTRE EMAIL"
                  className="flex-1 bg-transparent text-[#1A1A1A] text-[11px] tracking-[0.15em] placeholder:text-[#1A1A1A]/50 focus:outline-none"
                  disabled={status === 'loading'}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="text-[#0ea5e9] text-[10px] font-bold tracking-[0.2em] uppercase hover:text-[#0284c7] transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <span>{status === 'loading' ? 'Envoi...' : "S'inscrire"}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
              {message && (
                <div className={`text-[11px] flex items-center gap-1.5 pt-1 ${status === 'success' ? 'text-emerald-600 font-medium' : 'text-red-500'}`}>
                  {status === 'success' && <CheckCircle2 size={13} />}
                  <span>{message}</span>
                </div>
              )}
            </form>

            <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 text-[10px] tracking-[0.15em] text-[#1A1A1A]/50 uppercase">
              <Link href={`/${locale}/blog`} className="hover:text-[#1A1A1A]/70 font-bold transition-colors">Journal & Blog</Link>
              <Link href={`/${locale}/legal/terms`} className="hover:text-[#1A1A1A]/70 transition-colors">Conditions</Link>
              <Link href={`/${locale}/legal/privacy`} className="hover:text-[#1A1A1A]/70 transition-colors">Confidentialité</Link>
              <Link href={`/${locale}/contact`} className="hover:text-[#1A1A1A]/70 transition-colors">Contact</Link>
              <Link href={`/${locale}/suivi-commande`} className="hover:text-[#1A1A1A]/70 transition-colors">Suivi de commande</Link>
              <Link href={`/${locale}/legal/returns`} className="hover:text-[#1A1A1A]/70 transition-colors">Retours</Link>
              <Link href={`/${locale}/faq`} className="hover:text-[#1A1A1A]/70 transition-colors">FAQ</Link>
            </div>

            <div className="mt-4 text-[10px] text-[#1A1A1A]/40">
              © {new Date().getFullYear()} NAY Parfums. Revendeur autorisé au Maroc.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
