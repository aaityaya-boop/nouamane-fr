'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  ExternalLink,
  Clock,
  Sparkles,
  Package,
  BarChart2,
  KeyRound
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Security cooldown protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Auto-redirect if session is already active
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.user) {
          window.location.replace('/admin');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldownSeconds > 0) {
      setErrorMessage(`Protection active : veuillez patienter ${cooldownSeconds}s.`);
      return;
    }

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setErrorMessage('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: cleanIdentifier,
          password: cleanPassword,
          rememberMe,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setLoginSuccess(true);
        setFailedAttempts(0);
        // Direct browser navigation guarantees cookies are committed and bypasses client router cache
        setTimeout(() => {
          window.location.replace('/admin');
        }, 200);
      } else {
        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);
        
        if (attempts >= 4) {
          const timeout = attempts * 5;
          setCooldownSeconds(timeout);
          setErrorMessage(`Compte protégé : réessayez dans ${timeout} secondes.`);
        } else {
          setErrorMessage(data?.error || 'Identifiant ou mot de passe incorrect.');
        }
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage('Erreur de connexion réseau. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative selection:bg-[#1D9BF0]/15 selection:text-[#1D9BF0]">
      
      {/* Background Subtle Ambient Glow in Twitter Sky Blue */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] rounded-full bg-gradient-to-b from-[#1D9BF0]/[0.08] to-transparent blur-[130px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 p-1.5 shadow-2xs flex items-center justify-center group-hover:border-[#1D9BF0] transition-colors">
            <Image 
              src="/images/nay/nay-logo-blue.png" 
              alt="NAY Parfums" 
              width={26} 
              height={26}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider text-slate-900 group-hover:text-[#1D9BF0] transition-colors">
              NAY PARFUMS
            </div>
            <div className="text-[10px] text-slate-600 font-medium">
              Maison de Haute Parfumerie
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-700 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">Système opérationnel</span>
          </div>

          <Link 
            href="/" 
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-700 hover:text-[#1D9BF0] hover:border-[#1D9BF0]/40 transition-colors shadow-2xs"
          >
            <span>Boutique publique</span>
            <ExternalLink size={11} className="text-slate-600" />
          </Link>
        </div>
      </header>

      {/* Main Centered Compact Luxury Card (Clean on Mobile & Desktop) */}
      <main className="w-full max-w-4xl my-auto py-4 sm:py-6 z-10 px-2 sm:px-0">
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.04)] overflow-hidden grid grid-cols-1 md:grid-cols-12 max-w-md md:max-w-none mx-auto w-full">
          
          {/* Left Column: Brand Context (Hidden on mobile phones, shown on tablet/desktop) */}
          <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-sky-50/60 via-slate-50 to-white p-6 sm:p-8 flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
            <div>
              {/* Brand Tag */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-100/70 border border-sky-200 text-[#0284c7] text-[11px] font-semibold mb-4">
                <Sparkles size={12} className="text-[#1D9BF0]" />
                <span>Portail Administrateur</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                Console de Gestion NAY Parfums
              </h1>

              <p className="mt-2.5 text-xs text-slate-600 leading-relaxed font-normal">
                Accès sécurisé pour la gestion des commandes, l'administration du catalogue de fragrances et le suivi des stocks.
              </p>

              {/* Feature Points */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-sky-100/60 border border-sky-200/60 text-[#1D9BF0] flex items-center justify-center shrink-0">
                    <Package size={13} />
                  </div>
                  <span className="font-medium text-slate-700">Catalogue & Inventaire en direct</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-sky-100/60 border border-sky-200/60 text-[#1D9BF0] flex items-center justify-center shrink-0">
                    <BarChart2 size={13} />
                  </div>
                  <span className="font-medium text-slate-700">Suivi des commandes & livraisons</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-sky-100/60 border border-sky-200/60 text-[#1D9BF0] flex items-center justify-center shrink-0">
                    <ShieldCheck size={13} />
                  </div>
                  <span className="font-medium text-slate-700">Sécurité & Chiffrement AES-256</span>
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="pt-6 mt-6 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-600">
              <span>Boutique en Ligne • Maroc</span>
              <span className="font-mono text-slate-600">v2.4.0</span>
            </div>
          </div>

          {/* Right Column: Clean Login Form (7 cols) */}
          <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
            
            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 p-1 flex items-center justify-center">
                  <Image 
                    src="/images/nay/nay-logo-blue.png" 
                    alt="NAY Logo" 
                    width={22} 
                    height={22}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Authentification
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-normal">
                Saisissez vos identifiants pour vous connecter à votre compte
              </p>
            </div>

            {/* Success Notification */}
            {loginSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">Connexion réussie</p>
                    <p className="text-[11px] text-emerald-700">Redirection vers le tableau de bord...</p>
                  </div>
                </div>
                <a
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.replace('/admin');
                  }}
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-2xs shrink-0 cursor-pointer"
                >
                  Accéder →
                </a>
              </div>
            )}

            {/* Error Notification */}
            {errorMessage && !loginSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-900">Erreur de connexion</p>
                  <p className="text-[11px] text-rose-700 mt-0.5 font-medium">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Cooldown Timer */}
            {cooldownSeconds > 0 && (
              <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Clock size={14} className="text-amber-600 shrink-0" />
                <span>Sécurité active : patientez <strong>{cooldownSeconds}s</strong> avant de réessayer.</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Identifier Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email ou Identifiant
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    disabled={isLoading || loginSuccess || cooldownSeconds > 0}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="admin@nayparfum.ma"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1D9BF0] focus:ring-3 focus:ring-[#1D9BF0]/15 transition-all font-medium disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mot de passe
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading || loginSuccess || cooldownSeconds > 0}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1D9BF0] focus:ring-3 focus:ring-[#1D9BF0]/15 transition-all font-mono tracking-wider disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-900 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#1D9BF0] focus:ring-[#1D9BF0]/20 focus:ring-offset-0 cursor-pointer accent-[#1D9BF0]"
                  />
                  <span>Garder ma session active (30 jours)</span>
                </label>
              </div>

              {/* Submit CTA Button in Twitter Sky Blue */}
              <button
                type={loginSuccess ? 'button' : 'submit'}
                disabled={(isLoading && !loginSuccess) || cooldownSeconds > 0}
                onClick={() => {
                  if (loginSuccess) {
                    window.location.replace('/admin');
                  }
                }}
                className="w-full mt-2 py-3 px-4 bg-[#1D9BF0] hover:bg-[#1a8cd8] active:bg-[#177cc0] text-white rounded-xl text-xs font-bold tracking-wide shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loginSuccess ? (
                  <>
                    <CheckCircle2 size={15} className="text-white" />
                    <span>Accès Autorisé — Accéder au Dashboard →</span>
                  </>
                ) : isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authentification...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
              <ShieldCheck size={13} className="text-[#1D9BF0]" />
              <span>Session sécurisée par chiffrement AES-256</span>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center py-2 text-xs text-slate-600 z-10">
        NAY Parfums Maroc © {new Date().getFullYear()} • Accès réservé aux collaborateurs
      </footer>

    </div>
  );
}
