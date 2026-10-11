'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Truck, 
  LayoutTemplate, 
  Phone, 
  Lock, 
  Save, 
  Check, 
  Loader2, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Copy, 
  Sparkles, 
  ShieldCheck, 
  MessageCircle, 
  Send, 
  AlertCircle, 
  Globe, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  Info,
  Package,
  ArrowRight,
  TrendingUp,
  Store,
  BadgeCheck,
  Bell,
  Mail,
  Users,
  Banknote,
  CheckCheck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminPushNotificationSettings from '@/components/admin/AdminPushNotificationSettings';


// Custom SVG Icons for Social Networks
const InstagramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TikTokIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

interface SiteConfigData {
  id?: number;
  adminUsername?: string;
  adminPassword?: string;
  shippingFee?: number;
  contactPhone?: string;
  contactEmail?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  whatsappUrl?: string | null;
  monthlyRevenueGoal?: number;
  featuredBestsellers?: string;
  featuredSeasonal?: string;
  featuredLatest?: string;
  coffretsCoverImage?: string;
  seasonalTrendTitle?: string;
  seasonalTrendSubtitle?: string;
  recommendedShop?: string;
  recommendedMen?: string;
  recommendedWomen?: string;
  recommendedUnisex?: string;
  recommendedOriental?: string;
  recommendedMaster?: string;
  recommendedCoffrets?: string;
  updatedAt?: string;
}

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  jobTitle?: string | null;
  phone?: string | null;
}

interface SettingsClientProps {
  initialConfig: SiteConfigData;
  adminUser?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
  adminUsers?: AdminUserItem[];
}

type TabKey = 'general' | 'alerts' | 'banking' | 'shipping' | 'hero' | 'contact' | 'security' | 'notifications';

export default function SettingsClient({ initialConfig, adminUser, adminUsers }: SettingsClientProps) {
  const [config, setConfig] = useState<SiteConfigData>(initialConfig);
  const [savedBaseline, setSavedBaseline] = useState<SiteConfigData>(initialConfig);
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('À l\'instant');

  // Test email state
  const [testEmailTarget, setTestEmailTarget] = useState<string>(
    adminUser?.email || initialConfig.contactEmail || 'ayoub@nayparfum.ma'
  );
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{
    success: boolean;
    channel?: string;
    messageId?: string;
    error?: string;
  } | null>(null);

  // Fallback active admin users if none passed
  const activeAdmins: AdminUserItem[] = useMemo(() => {
    if (adminUsers && adminUsers.length > 0) return adminUsers;
    return [
      { id: 1, name: 'AYOUB AIT YAHYA', email: 'ayoub@nayparfum.ma', role: 'OWNER', status: 'ACTIVE', jobTitle: 'Gérant Fondateur' },
      { id: 2, name: 'NOUAMANE AIT YAHYA', email: 'nouamane@nayparfum.ma', role: 'OWNER', status: 'ACTIVE', jobTitle: 'Gérant Associé' },
    ];
  }, [adminUsers]);

  // Handle live test email dispatch
  const handleSendTestEmail = async () => {
    if (!testEmailTarget || !testEmailTarget.includes('@')) {
      setToast({ type: 'error', message: 'Veuillez saisir une adresse email valide pour le test.' });
      return;
    }
    setIsSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmailTarget }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestEmailResult({
          success: true,
          channel: data.channel,
          messageId: data.messageId,
        });
        setToast({ type: 'success', message: `Email de test envoyé avec succès à ${testEmailTarget} !` });
      } else {
        setTestEmailResult({
          success: false,
          error: data.error || 'Échec de transmission',
        });
        setToast({ type: 'error', message: data.error || 'Erreur lors de l\'envoi du test email.' });
      }
    } catch (err: any) {
      console.error('Error sending test email:', err);
      setTestEmailResult({
        success: false,
        error: err?.message || 'Erreur réseau',
      });
      setToast({ type: 'error', message: 'Erreur réseau lors du test.' });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Format initial last saved time
  useEffect(() => {
    if (initialConfig.updatedAt) {
      try {
        const date = new Date(initialConfig.updatedAt);
        setLastSavedTime(
          date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } catch {
        setLastSavedTime('Enregistré');
      }
    }
  }, [initialConfig.updatedAt]);

  // Dirty state detection
  const isDirty = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(savedBaseline);
  }, [config, savedBaseline]);

  // Handle standard input changes
  const updateField = (key: keyof SiteConfigData, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Quick copy to clipboard helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Save handler
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setSavedBaseline(updated);
        setToast({ type: 'success', message: 'Paramètres enregistrés avec succès !' });
        setLastSavedTime(
          new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } else {
        setToast({ type: 'error', message: 'Erreur lors de la sauvegarde. Veuillez réessayer.' });
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setToast({ type: 'error', message: 'Erreur de connexion avec le serveur.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }, [config, isSaving]);

  // Revert changes
  const handleRevert = () => {
    setConfig(savedBaseline);
    setToast({ type: 'success', message: 'Modifications réinitialisées.' });
    setTimeout(() => setToast(null), 2500);
  };

  // Keyboard shortcut Ctrl+S or Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Password strength score
  const passwordStrength = useMemo(() => {
    const pwd = config.adminPassword || '';
    if (!pwd) return { score: 0, label: 'Vide', color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Faible', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 3) return { score: 2, label: 'Moyen', color: 'bg-amber-500', text: 'text-amber-600' };
    return { score: 3, label: 'Robuste & Sécurisé', color: 'bg-emerald-500', text: 'text-emerald-600' };
  }, [config.adminPassword]);

  const tabs: Array<{ key: TabKey; label: string; icon: any; badge?: string }> = [
    { key: 'general', label: 'Identité & Boutique', icon: Building2 },
    { key: 'alerts', label: 'Destinataires & Alertes Emails', icon: Mail, badge: 'Nouveau' },
    { key: 'banking', label: 'Banque CIH & Règlements', icon: Banknote, badge: 'Recommandé' },
    { key: 'shipping', label: 'Livraison & Expédition', icon: Truck },
    { key: 'hero', label: 'Vitrine & Bannière Hero', icon: LayoutTemplate },
    { key: 'contact', label: 'Contact & Réseaux Sociaux', icon: Phone },
    { key: 'security', label: 'Sécurité & Accès', icon: Lock },
    { key: 'notifications', label: 'Notifications Push PWA', icon: Bell },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-28 text-slate-900">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700/50 shadow-emerald-950/20'
                : 'bg-rose-900/90 text-white border-rose-700/50 shadow-rose-950/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-50/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-slate-50/80 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200/80">
                <Store size={12} className="text-slate-600" />
                Maison NAY Parfums
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Boutique En Ligne Active
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
                🇲🇦 Maroc (Casablanca) • MAD
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5 pt-1">
              <span>Paramètres & Configuration</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Gérez les paramètres fondamentaux de votre boutique : identité de marque, tarifs de livraison, vitrine d&apos;accueil, coordonnées officielles et sécurité des accès.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 transition-all shadow-xs"
            >
              <ExternalLink size={14} className="text-slate-600" />
              <span>Voir la boutique</span>
            </Link>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-black transition-all shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin text-white" /> : <Save size={14} />}
              <span>Enregistrer</span>
              <span className="hidden sm:inline-block text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                ⌘S
              </span>
            </button>
          </div>
        </div>

        {/* Quick status bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" />
              Dernière mise à jour : <strong className="text-slate-700 font-medium">{lastSavedTime}</strong>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-600" />
              Admin actif : <strong className="text-slate-700 font-medium">{adminUser?.name || 'Administrateur'}</strong>
            </span>
          </div>

          {isDirty && (
            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Modifications non sauvegardées
            </span>
          )}
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl overflow-x-auto scrollbar-none shadow-xs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-amber-600' : 'text-slate-500'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: IDENTITÉ & BOUTIQUE */}
        {/* ========================================================================= */}
        {activeTab === 'general' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left 2 Cols: Form fields */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Identité Commerciale & Marque</h3>
                    <p className="text-xs text-slate-500">Informations légales et identité de la Maison NAY Parfums</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nom de la Maison / Enseigne
                    </label>
                    <input
                      type="text"
                      value="NAY Parfums"
                      disabled
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-600 cursor-not-allowed font-medium"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Nom de marque officiel affiché dans l&apos;en-tête, le pied de page et les emails transactionnels.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Devise Officielle
                      </label>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>MAD — Dirham Marocain (د.م.)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Toutes les transactions et statistiques sont calculées en Dirhams marocains.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Fuseau Horaire de la Boutique
                      </label>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                        <Globe size={14} className="text-slate-500" />
                        <span>Africa/Casablanca (Heure Maroc)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Synchronisation en temps réel pour l&apos;activité des visiteurs et commandes.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Objectif Mensuel de Chiffre d&apos;Affaires (MAD)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <TrendingUp size={16} />
                      </div>
                      <input
                        type="number"
                        value={config.monthlyRevenueGoal || 150000}
                        onChange={e => updateField('monthlyRevenueGoal', Number(e.target.value))}
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-16 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                        placeholder="150000"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                        MAD
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Utilisé dans le tableau de bord financier pour calculer les barres de progression et les KPI.
                    </p>
                  </div>
                </div>
              </div>

              {/* Model boutique 100% en ligne */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                    <Store size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Modèle Opérationnel</h3>
                    <p className="text-xs text-slate-500">Pure-Player E-Commerce sans point de vente physique</p>
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 flex items-start gap-3">
                  <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed space-y-1">
                    <p className="font-semibold text-amber-950">Boutique 100% en Ligne — Expédition Partout au Maroc</p>
                    <p className="text-amber-800">
                      Toutes les commandes sont préparées dans notre centre logistique et expédiées directement à l&apos;adresse du client sous 24h à 48h. Aucun atelier public n&apos;est ouvert aux visiteurs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Brand Identity Preview Card */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Aperçu Carte de Marque</h3>

                {/* Luxury Brand Card Mockup */}
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-amber-500/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-serif font-bold text-lg">
                      N
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Haute Parfumerie
                    </span>
                  </div>

                  <h4 className="text-base font-bold tracking-tight text-white">NAY Parfums</h4>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                    {config.heroTitle || "L'Essence de l'Élégance & Extraits Rares"}
                  </p>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                      <BadgeCheck size={13} />
                      Marque Déposée
                    </span>
                    <span className="font-mono text-slate-300">Maroc • Casablanca</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Statut du Magasin :</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Opérationnel
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Moteur IA Conseiller :</span>
                    <span className="font-semibold text-slate-800">Actif (Gemini Pro)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">Base de données :</span>
                    <span className="font-semibold text-slate-800">Neon Postgres</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DESTINATAIRES & ALERTES EMAILS */}
        {/* ========================================================================= */}
        {activeTab === 'alerts' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Top Overview Banner */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-2xl p-6 sm:p-7 border border-amber-500/20 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                    <Mail size={12} />
                    Réseau d&apos;Alertes Temps Réel
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Passerelle Resend Cloud Active
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Notifications Automatiques pour Gérants & Équipes Ciblées
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Chaque fois qu&apos;un prospect s&apos;abonne à la <strong>Newsletter</strong>, qu&apos;un client dépose un <strong>Message de Contact</strong>, ou qu&apos;une nouvelle <strong>Commande</strong> est enregistrée, les gérants et collaborateurs ciblés reçoivent immédiatement une alerte détaillée par email avec des raccourcis WhatsApp et Email en 1 clic.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Staff Recipients & Active Flow Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recipients Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                        <Users size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Gérants & Collaborateurs Destinataires</h3>
                        <p className="text-xs text-slate-500">Membres de l&apos;équipe recevant automatiquement toutes les alertes de la boutique</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {activeAdmins.length} Actif{activeAdmins.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Staff List */}
                  <div className="space-y-3">
                    {activeAdmins.map((staff, idx) => (
                      <div
                        key={staff.id || idx}
                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-300 font-bold flex items-center justify-center text-sm shadow-xs border border-amber-500/20">
                            {staff.name ? staff.name.substring(0, 2).toUpperCase() : 'NA'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">{staff.name}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200/80">
                                {staff.role === 'OWNER' ? 'Gérant Fondateur' : staff.role === 'ADMIN' ? 'Administrateur' : 'Collaborateur'}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-slate-600 mt-0.5">{staff.email}</p>
                            {staff.phone && (
                              <p className="text-[11px] text-slate-400 mt-0.5">📞 {staff.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            Newsletter
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            Contact
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            Commandes
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Secondary / Shared Notification Email field */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Boîte Email Centrale & Copies de Secours
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        type="text"
                        value={config.contactEmail || ''}
                        onChange={e => updateField('contactEmail', e.target.value)}
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                        placeholder="contact@nayparfum.ma, sav@nayparfum.ma"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Toutes ces adresses recevront également une copie directe de chaque nouvelle inscription ou message client. Séparez par des virgules pour ajouter plusieurs destinataires.
                    </p>
                  </div>
                </div>

                {/* Automation Rules Summary */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                      <CheckCheck size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Les 3 Flux Automatisés en Production</h3>
                      <p className="text-xs text-slate-500">Traitements déclenchés automatiquement par le serveur</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Workflow 1 */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                            Flux 1
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">Inscription Newsletter</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Visiteur s&apos;inscrit sur la boutique.
                        </p>
                      </div>
                      <div className="text-[11px] text-slate-700 space-y-1 pt-2 border-t border-slate-200/60 font-medium">
                        <div className="text-emerald-700">🎁 Client reçoit son code NAYDAY (−10%)</div>
                        <div className="text-slate-800">⚡ Managers reçoivent l&apos;alerte email</div>
                      </div>
                    </div>

                    {/* Workflow 2 */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                            Flux 2
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">Message de Contact</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Formulaire soumis depuis <code className="bg-white px-1 rounded">/contact</code>.
                        </p>
                      </div>
                      <div className="text-[11px] text-slate-700 space-y-1 pt-2 border-t border-slate-200/60 font-medium">
                        <div className="text-emerald-700">✉️ Accusé de réception client</div>
                        <div className="text-slate-800">💬 Boutons réponse WhatsApp & Email en 1-clic</div>
                      </div>
                    </div>

                    {/* Workflow 3 */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            Flux 3
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">Nouvelles Commandes</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Panier validé par un acheteur au Maroc.
                        </p>
                      </div>
                      <div className="text-[11px] text-slate-700 space-y-1 pt-2 border-t border-slate-200/60 font-medium">
                        <div className="text-emerald-700">📦 Notification confirmation client</div>
                        <div className="text-slate-800">📋 Bordereau et fiche préparateur prêts</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Live Email Tester & Infrastructure Card */}
              <div className="space-y-6">
                {/* Live Gateway Tester */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                      <Send size={15} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Test Direct de la Passerelle
                      </h3>
                      <p className="text-[11px] text-slate-500">Envoyer un email de test luxury en conditions réelles</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Adresse Email Destinataire du Test
                      </label>
                      <input
                        type="email"
                        value={testEmailTarget}
                        onChange={e => setTestEmailTarget(e.target.value)}
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                        placeholder="ayoub@nayparfum.ma"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={isSendingTestEmail}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {isSendingTestEmail ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-amber-400" />
                          <span>Transmission en cours...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} className="text-amber-400" />
                          <span>Tester l&apos;envoi d&apos;un email d&apos;alerte</span>
                        </>
                      )}
                    </button>

                    {/* Test result feedback banner */}
                    {testEmailResult && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 ${
                          testEmailResult.success
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          {testEmailResult.success ? (
                            <>
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                              <span>Test réussi !</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={14} className="text-rose-600 shrink-0" />
                              <span>Échec du test</span>
                            </>
                          )}
                        </div>
                        {testEmailResult.success ? (
                          <p className="text-[11px] text-emerald-700">
                            Email luxury expédié via le canal <strong>{testEmailResult.channel}</strong>. Vérifiez votre boîte de réception ou spams.
                          </p>
                        ) : (
                          <p className="text-[11px] text-rose-700">
                            {testEmailResult.error || 'Erreur lors de la communication avec le serveur mail.'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Infrastructure Info Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Configuration Passerelle
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Moteur Principal :</span>
                      <span className="font-semibold text-slate-900 flex items-center gap-1">
                        Resend API v2
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Expéditeur Déclaré :</span>
                      <span className="font-mono text-[11px] text-slate-800">contact@nayparfum.ma</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Relais Secours :</span>
                      <span className="font-semibold text-slate-800">SMTP Hostinger</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500">Modèles HTML :</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        Responsive Luxury NAY
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BANQUE CIH & RÈGLEMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'banking' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Details and WhatsApp link */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                      <Banknote size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Coordonnées Bancaires Officielles (CIH Bank)</h3>
                      <p className="text-xs text-slate-500">Compte bancaire professionnel pour la réception des acomptes et virements</p>
                    </div>
                  </div>

                  {/* Bank card presentation */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white relative overflow-hidden border border-amber-500/20 shadow-md space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                          CIH BANK MAROC
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        Compte Société
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">Titulaire du Compte</p>
                      <p className="text-base sm:text-lg font-serif font-bold text-white tracking-wide">
                        Maison NAY Parfums SARL
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider">RIB (24 Chiffres)</p>
                        <button
                          type="button"
                          onClick={() => handleCopy('230 780 44123456789012 34', 'cihRib')}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedField === 'cihRib' ? (
                            <>
                              <Check size={12} className="text-emerald-400" />
                              <span className="text-emerald-400">RIB Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copier le RIB</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 font-mono text-xs sm:text-sm tracking-wider text-amber-200 select-all">
                        230 780 44123456789012 34
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-700/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Code Banque</span>
                        <span className="font-mono font-bold text-slate-200">230 (CIH)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Agence</span>
                        <span className="font-medium text-slate-200">Casablanca Anfa</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Code Swift / BIC</span>
                        <span className="font-mono font-bold text-slate-200">CIHMMAKZ</span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click WhatsApp Quick Share to Customer */}
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <MessageCircle size={15} className="text-emerald-600" />
                        Partage Instantané du RIB sur WhatsApp
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Ouvre une conversation WhatsApp avec le message officiel pré-rempli contenant le RIB de la Maison.
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        "Salam ✨ Voici les coordonnées bancaires CIH officielles de Maison NAY Parfums pour votre règlement / acompte :\n\n🏦 Banque : CIH Bank\n📋 Titulaire : Maison NAY Parfums SARL\n🔢 RIB : 230 780 44123456789012 34\n\nMerci de nous envoyer la capture du virement dès réalisation pour valider l'expédition immédiate de votre commande. À votre service !"
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs shrink-0"
                    >
                      <ExternalLink size={13} />
                      <span>Transmettre sur WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Deposit Policy Strategy (Acomptes 50 DH / 100 DH) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Politique d&apos;Acompte Anti-Retour de Colis</h3>
                      <p className="text-xs text-slate-500">Procédure recommandée pour éliminer les retours de commandes non réclamées</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Acompte Standard (50 MAD)</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Commandes &gt; 500 MAD
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Recommandé pour les nouvelles commandes en province (hors Casablanca/Rabat). Permet de valider l&apos;adresse et d&apos;assurer que le client réceptionnera le colis.
                      </p>
                      <div className="text-[11px] text-slate-700 font-medium pt-1 border-t border-slate-200/60">
                        Déduit du montant final payé au livreur.
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Acompte Coffrets (100 MAD)</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          Coffrets & Flacons Rares
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Pour les commandes de coffrets exclusifs ou packs sur mesure. Garantit une sécurité totale avant préparation du flaconnage scellé.
                      </p>
                      <div className="text-[11px] text-slate-700 font-medium pt-1 border-t border-slate-200/60">
                        Confirmation immédiate par WhatsApp.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Reassurance and tips */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Conseils de Gestion Financière</h3>

                  <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-950 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                        💡 Rapprochement Journalier
                      </p>
                      <p className="text-[11px] text-amber-800">
                        Vérifiez l&apos;application CIH Mobile chaque soir à 18h pour rapprocher les virements reçus avec les numéros de commandes avant expédition.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        🛡️ Virement Instantané
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Grâce au service de virement instantané Bank Al-Maghrib, les fonds provenant de toutes les banques marocaines arrivent sur le compte CIH en moins de 20 secondes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LIVRAISON & EXPÉDITION */}
        {/* ========================================================================= */}
        {activeTab === 'shipping' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Tarification & Frais de Livraison</h3>
                    <p className="text-xs text-slate-500">Réglez les frais d&apos;expédition appliqués automatiquement au panier</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Frais de Livraison Standard (Toutes Villes du Maroc)
                    </label>
                    <div className="relative max-w-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Truck size={16} />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={config.shippingFee ?? 35}
                        onChange={e => updateField('shippingFee', Number(e.target.value))}
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-16 py-2.5 text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                        placeholder="35"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-500">
                        MAD
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Frais standards appliqués lors de la finalisation de commande. Indiquez <strong>0 MAD</strong> pour rendre la livraison gratuite pour tout le monde.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-3">Délais Indicatifs de Livraison au Maroc</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Casablanca & Rabat
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">24h à 48h ouvrées avec livraison express</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Autres Villes du Royaume
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">48h à 72h ouvrées (Marrakech, Fès, Tanger, Agadir...)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modes de paiement */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Modes de Paiement Acceptés</h3>
                    <p className="text-xs text-slate-500">Options proposées au client sur la page de paiement</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        💵
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Paiement à la Livraison (Cash on Delivery)</p>
                        <p className="text-[11px] text-slate-500">Espèces remises au livreur à la réception du colis</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Actif (Recommandé)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                        🏦
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Virement Bancaire Instantané</p>
                        <p className="text-[11px] text-slate-500">CIH, Attijariwafa Bank, Bank of Africa</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                      Optionnel
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Reassurance & Logistics Partners */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Garanties & Réassurance</h3>
                
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <ShieldCheck size={15} className="text-emerald-600" />
                      Colis Sécurisés & Scellés
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Chaque flacon et coffret est minutieusement protégé par calage thermique et emballage cadeau de luxe.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Package size={15} className="text-amber-600" />
                      Suivi Colis WhatsApp
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Le client reçoit une notification WhatsApp avec son numéro de suivi dès expédition.
                    </p>
                  </div>
                </div>
              </div>

              {/* Carrier Network */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Réseau de Transporteurs au Maroc
                </h3>

                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Amana Express</p>
                      <p className="text-[11px] text-slate-500">Poste Maroc • Toutes les villes</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      National
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Cathedis Logistics</p>
                      <p className="text-[11px] text-slate-500">Collecte COD & Suivi informatisé</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Express
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Coursier Privé Grand Casa</p>
                      <p className="text-[11px] text-slate-500">Casablanca & Mohammedia</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Jour-Même
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: VITRINE & BANNIÈRE HERO */}
        {/* ========================================================================= */}
        {activeTab === 'hero' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Live Interactive Hero Banner Preview */}
            <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden border border-slate-800 shadow-lg">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-4 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Aperçu Direct Vitrine
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                  {config.heroTitle || "L'Essence de l'Élégance"}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {config.heroSubtitle || "Découvrez notre collection de parfums de luxe, conçue pour laisser une empreinte inoubliable."}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-950 shadow-xs flex items-center gap-2">
                    <span>Explorer la Collection</span>
                    <ArrowRight size={13} />
                  </span>
                  <span className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700 bg-slate-900/50">
                    Découvrir les Testeurs
                  </span>
                </div>
              </div>
            </div>

            {/* Inputs for Hero Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left col: Hero texts */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                    <LayoutTemplate size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Textes de la Bannière Hero</h3>
                    <p className="text-xs text-slate-500">Titre principal et accroche de la page d&apos;accueil</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Titre Principal (Hero Title)
                    </label>
                    <input
                      type="text"
                      value={config.heroTitle || ''}
                      onChange={e => updateField('heroTitle', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="L'Essence de l'Élégance"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Titre en grand affiché au centre de la bannière d&apos;accueil.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Sous-titre & Accroche Olfactive
                    </label>
                    <textarea
                      rows={3}
                      value={config.heroSubtitle || ''}
                      onChange={e => updateField('heroSubtitle', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors resize-none"
                      placeholder="Découvrez notre collection de parfums de luxe, conçue pour laisser une empreinte inoubliable."
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Texte descriptif court positionné sous le titre principal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right col: Coffrets and Trends */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Coffrets & Tendances Saisonnières</h3>
                    <p className="text-xs text-slate-500">Image du carrousel de coffrets et titres des tendances</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Image de Couverture Coffrets Cadeaux (URL)
                    </label>
                    <input
                      type="text"
                      value={config.coffretsCoverImage || ''}
                      onChange={e => updateField('coffretsCoverImage', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="/images/category/pack-decouverte-luxe.jpg"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Chemin de l&apos;image locale (ex: <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">/images/category/...</code>) ou URL externe sécurisée.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Titre de la Section Tendances
                    </label>
                    <input
                      type="text"
                      value={config.seasonalTrendTitle || ''}
                      onChange={e => updateField('seasonalTrendTitle', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="Tendances Printemps-Été"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Sous-titre Section Tendances
                    </label>
                    <input
                      type="text"
                      value={config.seasonalTrendSubtitle || ''}
                      onChange={e => updateField('seasonalTrendSubtitle', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="Nos fragrances fraîches, solaires et florales pour la belle saison."
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CONTACT & RÉSEAUX SOCIAUX */}
        {/* ========================================================================= */}
        {activeTab === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Direct Contact Channels */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                  <Phone size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Coordonnées Officielles Clientèle</h3>
                  <p className="text-xs text-slate-500">Numéros et adresses affichés aux clients pour l&apos;assistance</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Canal WhatsApp Direct
                    </label>
                    {config.whatsappUrl && (
                      <a
                        href={config.whatsappUrl.startsWith('http') ? config.whatsappUrl : `https://wa.me/${config.whatsappUrl.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        <ExternalLink size={12} />
                        Tester le lien WhatsApp
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                      <MessageCircle size={16} />
                    </div>
                    <input
                      type="text"
                      value={config.whatsappUrl || ''}
                      onChange={e => updateField('whatsappUrl', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="https://wa.me/212663380011 ou +212 663-380011"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Utilisé pour le bouton flottant WhatsApp et la confirmation directe de commande.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Numéro de Téléphone Standard
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </div>
                    <input
                      type="text"
                      value={config.contactPhone || ''}
                      onChange={e => updateField('contactPhone', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="+212 663-380011"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Affiché dans le bandeau supérieur et le pied de page de la boutique.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Adresse Email Officielle
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Send size={16} />
                    </div>
                    <input
                      type="email"
                      value={config.contactEmail || ''}
                      onChange={e => updateField('contactEmail', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="contact@nayparfum.ma"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Email de réception des demandes de contact et questions générales.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Networks */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                  <InstagramIcon className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Réseaux Sociaux Officiels</h3>
                  <p className="text-xs text-slate-500">Comptes publics liés aux icônes du site</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Instagram (URL)
                    </label>
                    {config.instagramUrl && (
                      <a
                        href={config.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-600 hover:text-pink-700"
                      >
                        <ExternalLink size={12} />
                        Voir le profil
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-600">
                      <InstagramIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={config.instagramUrl || ''}
                      onChange={e => updateField('instagramUrl', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="https://instagram.com/nayparfums"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      TikTok (URL)
                    </label>
                    {config.tiktokUrl && (
                      <a
                        href={config.tiktokUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-800 hover:text-black"
                      >
                        <ExternalLink size={12} />
                        Voir le profil
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-800">
                      <TikTokIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={config.tiktokUrl || ''}
                      onChange={e => updateField('tiktokUrl', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="https://tiktok.com/@nayparfums_"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Facebook (URL)
                    </label>
                    {config.facebookUrl && (
                      <a
                        href={config.facebookUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink size={12} />
                        Voir la page
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600">
                      <FacebookIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={config.facebookUrl || ''}
                      onChange={e => updateField('facebookUrl', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="https://facebook.com/nayparfum"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: SÉCURITÉ & ACCÈS ADMIN */}
        {/* ========================================================================= */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Accès Administrateur Principal</h3>
                    <p className="text-xs text-slate-500">Identifiants de secours pour l&apos;accès au panneau d&apos;administration</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Identifiant Admin
                    </label>
                    <input
                      type="text"
                      value={config.adminUsername || ''}
                      onChange={e => updateField('adminUsername', e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="admin"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Identifiant par défaut utilisé lors de la connexion sur <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">/admin/login</code>.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Mot de Passe Administrateur
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(config.adminPassword || '', 'adminPassword')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          {copiedField === 'adminPassword' ? (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              <span className="text-emerald-600">Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={config.adminPassword || ''}
                        onChange={e => updateField('adminPassword', e.target.value)}
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-3.5 pr-11 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength indicator */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Force du mot de passe :</span>
                        <span className={`font-semibold ${passwordStrength.text}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'
                          } w-1/3`}
                        />
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'
                          } w-1/3`}
                        />
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'
                          } w-1/3`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right col: Security status */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Statut de Sécurité Système</h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Chiffrement SSL / HTTPS :</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck size={14} />
                      Actif (Certifié)
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Sessions JWT Sécurisées :</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      HttpOnly Cookie
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Protection CSRF & CORS :</span>
                    <span className="font-semibold text-emerald-600">Verrouillé</span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500">Boutique en ligne :</span>
                    <span className="font-semibold text-slate-800">100% Cloud</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
                  🔒 <strong>Conseil sécurité :</strong> Utilisez un mot de passe d&apos;au moins 12 caractères combinant majuscules, chiffres et caractères spéciaux.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: NOTIFICATIONS PUSH PWA */}
        {/* ========================================================================= */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <AdminPushNotificationSettings />
          </motion.div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FLOATING ACTION SAVE BAR (WHEN MODIFICATIONS EXIST) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 inset-x-0 z-40 max-w-2xl mx-auto px-4"
          >
            <div className="bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Modifications non enregistrées</p>
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    Pensez à sauvegarder avant de quitter cette page.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleRevert}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin text-slate-950" /> : <Save size={13} />}
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
