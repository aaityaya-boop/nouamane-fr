'use client';

import React, { useState } from 'react';
import { X, Sparkles, Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-slate-900">
        {/* Top Header Glow */}
        <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 p-6 text-white text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-[11px] font-bold tracking-wide mb-2.5">
            <Sparkles size={13} className="text-amber-300" />
            <span>Privilège Membre Maison NAY</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Compte Obligatoire pour le Code Promo
          </h3>

          <p className="text-xs text-sky-100 max-w-xs mx-auto mt-1 font-light leading-relaxed">
            {promoCode ? (
              <>Pour appliquer le code <span className="font-bold underline text-white">« {promoCode} »</span> et bénéficier de votre réduction, vous devez posséder un compte client.</>
            ) : (
              <>La création d'un compte client est obligatoire pour activer et utiliser vos codes promo.</>
            )}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="p-6 pt-5 space-y-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold border border-slate-200/70">
            <button
              type="button"
              onClick={() => { setMode('REGISTER'); setError(''); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'REGISTER'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Créer mon compte (15s)
            </button>
            <button
              type="button"
              onClick={() => { setMode('LOGIN'); setError(''); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'LOGIN'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Déjà client ? Connexion
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom complet
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Yassine Benali"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Adresse Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre-email@example.com"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'REGISTER' ? 'Minimum 6 caractères' : 'Votre mot de passe'}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Vérification...</span>
              ) : (
                <>
                  <span>
                    {mode === 'REGISTER'
                      ? 'Créer mon compte & Débloquer le code promo'
                      : 'Me connecter & Activer le code promo'}
                  </span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Member perks */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span>Réduction immédiate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-sky-500 shrink-0" />
              <span>Suivi commande en direct</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
