'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface PromoAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoCode?: string;
  onSuccess: () => void;
}

export default function PromoAuthModal({
  isOpen,
  onClose,
  promoCode,
  onSuccess,
}: PromoAuthModalProps) {
  const { setCustomer } = useAuth();
  const [mode, setMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'REGISTER' && !name.trim()) {
      setError('Veuillez entrer votre nom complet.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'REGISTER' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'REGISTER'
        ? { name: name.trim(), email: email.trim().toLowerCase(), password }
        : { email: email.trim().toLowerCase(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Une erreur est survenue lors de l\'authentification.');
      }

      // Update global auth context
      if (data.customer) {
        setCustomer(data.customer);
      }

      // Trigger automatic promo code apply
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setError('');
      setIsLoading(true);

      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('@/lib/firebase');

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.customer) {
          setCustomer(data.customer);
        }
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Erreur lors de la connexion Google');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Erreur Google: ${err.message || 'Échec de la connexion'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e0ddd4] overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-[#1A1A1A]">
        {/* Subtle Top Accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#38bdf8]" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F5F5F3] hover:bg-[#e0ddd4] text-[#1A1A1A] flex items-center justify-center transition-colors cursor-pointer z-20"
          aria-label="Fermer"
        >
          <X size={15} />
        </button>

        {/* Modal Header */}
        <div className="p-7 sm:p-8 pb-0 text-center">
          {/* Brand Emblem */}
          <div className="relative w-12 h-12 mx-auto mb-3">
            <Image
              src="/images/nay/nay-emblem.png"
              alt="NAY Emblem"
              fill
              className="object-contain"
              priority
            />
          </div>

          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9] mb-1.5 block">
            Privilège Membre NAY
          </span>

          <h3 className="heading-font text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            {mode === 'REGISTER' ? 'Créer un compte' : 'Connexion Client'}
          </h3>

          <p className="text-[#6B6B6B] text-[13px] mt-1.5 max-w-xs mx-auto leading-relaxed">
            {promoCode ? (
              <>
                Pour appliquer le code promo{' '}
                <span className="font-bold text-[#1A1A1A] underline decoration-[#0ea5e9] decoration-2">
                  « {promoCode} »
                </span>
                , veuillez vous inscrire ou vous connecter.
              </>
            ) : (
              <>Un compte client est nécessaire pour activer vos réductions et offres exclusives.</>
            )}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-7 sm:p-8 pt-5 space-y-4">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-[#F5F5F3] rounded-2xl text-xs font-bold border border-[#e0ddd4]/70">
            <button
              type="button"
              onClick={() => { setMode('REGISTER'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                mode === 'REGISTER'
                  ? 'bg-white text-[#1A1A1A] shadow-xs'
                  : 'text-[#9A9A9A] hover:text-[#1A1A1A]'
              }`}
            >
              Créer mon compte
            </button>
            <button
              type="button"
              onClick={() => { setMode('LOGIN'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                mode === 'LOGIN'
                  ? 'bg-white text-[#1A1A1A] shadow-xs'
                  : 'text-[#9A9A9A] hover:text-[#1A1A1A]'
              }`}
            >
              Déjà client ?
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'REGISTER' && (
              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Yassine Benali"
                  className="w-full bg-[#F5F5F3] border border-transparent rounded-xl px-4 py-3 text-[13px] text-[#1A1A1A] placeholder:text-[#9A9A9A] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@example.com"
                className="w-full bg-[#F5F5F3] border border-transparent rounded-xl px-4 py-3 text-[13px] text-[#1A1A1A] placeholder:text-[#9A9A9A] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'REGISTER' ? 'Minimum 6 caractères' : 'Votre mot de passe'}
                className="w-full bg-[#F5F5F3] border border-transparent rounded-xl px-4 py-3 text-[13px] text-[#1A1A1A] placeholder:text-[#9A9A9A] focus:bg-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 bg-[#1A1A1A] hover:bg-black text-white rounded-full text-[13px] font-bold tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Vérification...</span>
              ) : (
                <>
                  <span>
                    {mode === 'REGISTER'
                      ? 'Créer mon compte & Débloquer le code'
                      : 'Se connecter & Débloquer le code'}
                  </span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Social Auth Separator */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#e0ddd4]"></div>
            <span className="flex-shrink-0 mx-3 text-[#9A9A9A] text-[10px] font-bold uppercase tracking-wider">
              Ou continuer avec
            </span>
            <div className="flex-grow border-t border-[#e0ddd4]"></div>
          </div>

          {/* Google 1-Click Auth */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white border border-[#e0ddd4] text-[#1A1A1A] py-3 rounded-full text-[13px] font-bold tracking-wider hover:bg-[#F5F5F3] hover:border-gray-300 transition-all flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </button>

          {/* Member perks */}
          <div className="pt-3 border-t border-[#e0ddd4]/60 grid grid-cols-2 gap-2 text-[11px] text-[#6B6B6B]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span>Réduction immédiate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#0ea5e9] shrink-0" />
              <span>Suivi commande en direct</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
