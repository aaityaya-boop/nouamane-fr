'use client';

import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Tag,
  KeyRound,
  Sparkles,
} from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'REGISTER' && !name.trim()) {
      setError('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Veuillez saisir une adresse e-mail valide.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'REGISTER' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'REGISTER'
          ? { name: name.trim(), email: email.trim().toLowerCase(), password }
          : { email: email.trim().toLowerCase(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Une erreur est survenue lors de l'authentification.");
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
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0b0f19]/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-[#FAF9F5] sm:rounded-3xl rounded-t-3xl shadow-2xl border border-[#ECE7DD] overflow-hidden z-10 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 text-[#1A1A1A] max-h-[92vh] flex flex-col">
        {/* Subtle Luxury Sky Accent Line */}
        <div className="h-1 bg-gradient-to-r from-[#0ea5e9] via-[#38bdf8] to-[#0284c7]" />

        {/* Modal Header & Brand Identity */}
        <div className="relative pt-6 px-6 sm:px-8 pb-3 text-center shrink-0 border-b border-[#ECE7DD]/70 bg-white/70 backdrop-blur-xs">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-[#FAF9F5] border border-[#ECE7DD] hover:bg-[#F2EFE9] text-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95 z-20"
            aria-label="Fermer"
          >
            <X size={15} strokeWidth={2.2} />
          </button>

          {/* Official Maison NAY Logo Monogram */}
          <div className="flex justify-center mb-2.5">
            <div
              className="w-24 h-11 bg-[#111827]"
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
              role="img"
              aria-label="NAY Haute Parfumerie"
            />
          </div>

          {/* Luxury Atelier Membership Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-50 border border-sky-200/80 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
            <span className="text-[10px] font-black tracking-[0.22em] uppercase text-[#0ea5e9]">
              Privilège Membre Atelier
            </span>
          </div>

          <h3 className="heading-font text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
            {mode === 'REGISTER' ? 'Rejoindre le Cercle NAY' : 'Accès Compte Membre'}
          </h3>

          <div className="mt-1.5 max-w-sm mx-auto">
            {promoCode ? (
              <div className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-[#0ea5e9]/30 px-3 py-1 rounded-xl text-[12px] text-slate-800">
                <Tag size={13} className="text-[#0ea5e9] shrink-0" />
                <span>
                  Code privilège <strong className="text-[#0ea5e9] font-black tracking-wider uppercase">« {promoCode} »</strong> actif
                </span>
              </div>
            ) : (
              <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
                Connectez-vous pour appliquer automatiquement vos remises et avantages exclusifs.
              </p>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto px-6 sm:px-8 py-5 space-y-4 flex-1">
          {/* Segmented Mode Switcher */}
          <div className="flex p-1 bg-white rounded-2xl border border-[#ECE7DD] shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'REGISTER'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nouveau client (Créer un compte)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'LOGIN'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Déjà membre (Connexion)
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'REGISTER' && (
              <div>
                <label className="block text-[11px] font-bold text-[#111827] uppercase tracking-wider mb-1">
                  Nom complet
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Yassine Benali"
                    className="w-full bg-white border border-[#ECE7DD] rounded-xl pl-10 pr-4 py-3 text-[13px] text-[#111827] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/15 transition-all shadow-2xs"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#111827] uppercase tracking-wider mb-1">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre-email@example.com"
                  className="w-full bg-white border border-[#ECE7DD] rounded-xl pl-10 pr-4 py-3 text-[13px] text-[#111827] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/15 transition-all shadow-2xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#111827] uppercase tracking-wider mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'REGISTER' ? 'Minimum 6 caractères' : 'Votre mot de passe'}
                  className="w-full bg-white border border-[#ECE7DD] rounded-xl pl-10 pr-11 py-3 text-[13px] text-[#111827] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/15 transition-all shadow-2xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Primary Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 bg-[#111827] hover:bg-[#0ea5e9] active:scale-[0.99] text-white rounded-xl text-[13px] font-bold tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Vérification en cours...</span>
              ) : (
                <>
                  <span>
                    {mode === 'REGISTER'
                      ? 'Créer mon compte & Débloquer la remise'
                      : 'Connexion & Débloquer la remise'}
                  </span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Social Auth Separator */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#ECE7DD]"></div>
            <span className="flex-shrink-0 mx-3 text-[#9A9A9A] text-[10.5px] font-bold uppercase tracking-wider">
              Ou continuer en 1 clic
            </span>
            <div className="flex-grow border-t border-[#ECE7DD]"></div>
          </div>

          {/* Google 1-Click Auth */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white border border-[#ECE7DD] hover:border-slate-300 text-[#111827] py-3 rounded-xl text-[13px] font-bold tracking-wide hover:bg-[#FAF9F5] transition-all flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continuer avec Google</span>
          </button>

          {/* Member Privileges Footer */}
          <div className="pt-3 border-t border-[#ECE7DD] grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <span>Remise immédiate</span>
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
