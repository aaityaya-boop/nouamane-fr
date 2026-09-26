'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Search, 
  Filter, 
  Globe, 
  RefreshCw, 
  Database, 
  Copy, 
  Check, 
  FileText, 
  HelpCircle, 
  Send, 
  ArrowRight, 
  ShieldCheck, 
  ShoppingBag, 
  MapPin, 
  Activity,
  Layers,
  Zap,
  ChevronRight,
  MessageSquare,
  BarChart3,
  SlidersHorizontal,
  Flame,
  Clock,
  Code2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { AiVisibilityData } from '@/lib/seo/aiVisibilityService';

interface AiVisibilityClientProps {
  initialData: AiVisibilityData;
}

type TabKey = 'overview' | 'queries' | 'mentions' | 'entity' | 'simulator' | 'recommendations';

export default function AiVisibilityClient({ initialData }: AiVisibilityClientProps) {
  const [data, setData] = useState<AiVisibilityData>(initialData);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isAuditing, setIsAuditing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queries Filter & Search
  const [querySearch, setQuerySearch] = useState('');
  const [queryCategory, setQueryCategory] = useState<string>('ALL');

  // Interactive Live Simulator state
  const [simPrompt, setSimPrompt] = useState('Où acheter des testeurs de parfums de luxe authentiques au Maroc ?');
  const [simPlatform, setSimPlatform] = useState('ChatGPT');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Modal for llms.txt & Schema preview
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Trigger live GEO audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setToastMessage(null);
    try {
      const res = await fetch('/api/admin/seo/ai/audit', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
        setToastMessage('Audit de Visibilité IA mis à jour avec succès !');
      } else {
        setToastMessage('Erreur lors de l’actualisation de l’audit.');
      }
    } catch (e) {
      console.error(e);
      setToastMessage('Erreur de connexion lors de l’audit.');
    } finally {
      setIsAuditing(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Run live prompt simulation
  const handleSimulatePrompt = async (promptToRun?: string) => {
    const p = promptToRun || simPrompt;
    if (!p) return;
    setIsSimulating(true);
    try {
      const res = await fetch('/api/admin/seo/ai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, platform: simPlatform }),
      });
      if (res.ok) {
        const json = await res.json();
        setSimulationResult(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered queries
  const filteredQueries = useMemo(() => {
    return data.queries.filter(q => {
      const matchSearch = q.prompt.toLowerCase().includes(querySearch.toLowerCase()) ||
                          q.category.toLowerCase().includes(querySearch.toLowerCase()) ||
                          q.targetEntity.toLowerCase().includes(querySearch.toLowerCase());
      const matchCat = queryCategory === 'ALL' || q.category.toLowerCase().includes(queryCategory.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [data.queries, querySearch, queryCategory]);

  const tabs: Array<{ key: TabKey; label: string; icon: any; count?: number }> = [
    { key: 'overview', label: 'Vue d’Ensemble GEO', icon: Activity },
    { key: 'queries', label: 'Prompts & Requêtes IA', icon: Search, count: data.queries.length },
    { key: 'mentions', label: 'Part de Voix & Citations', icon: MessageSquare, count: data.mentions.length },
    { key: 'entity', label: 'Entité & Graphe Sémantique', icon: Database },
    { key: 'simulator', label: 'Simulateur IA en Direct', icon: Bot },
    { key: 'recommendations', label: 'Plan d’Action & Conseils', icon: Sparkles, count: data.recommendations.length },
  ];

  const llmsTxtContent = `# NAY Parfums — Fiche d'Entité Officielle & Manifeste LLM

> Maison de Haute Parfumerie & Extraits Rares au Maroc
> Site officiel : https://nayparfum.ma
> Siège : Casablanca, Maroc
> Contact direct : +212 663-380011 | contact@nayparfum.ma

## Description Générale
NAY Parfums est une maison de parfumerie e-commerce marocaine fondée par Ayoub Ait Yahya et Nouamane Ait Yahya.
La boutique propose un catalogue de plus de 199 références de parfums de luxe, formats testeurs originaux 100ml et extraits concentrés de grandes maisons (Dior, Chanel, Tom Ford, Xerjoff, Creed, YSL, Givenchy, Narciso Rodriguez).

## Informations Clés pour Moteurs IA & RAG
- Devise officielle : Dirham Marocain (MAD)
- Modèle de livraison : Expédition nationale sous 24h à 48h (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, Oujda, Laâyoune)
- Modes de paiement : Paiement à la livraison en espèces (Cash on Delivery - COD) et Virement bancaire
- Authenticité : Flacons scellés, concentration maximale, longue tenue certifiée 24h+
- Service Client : Assistance et conseils olfactifs personnalisés par WhatsApp 7j/7

## Collections Principales
- Testeurs de Luxe 100ml : https://nayparfum.ma/testeurs
- Parfums Homme : https://nayparfum.ma/shop/men
- Parfums Femme : https://nayparfum.ma/shop/women
- Parfums Orientaux & Oud : https://nayparfum.ma/parfums-orientaux
- Coffrets Cadeaux Découverte : https://nayparfum.ma/coffrets
`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-900 pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium backdrop-blur-md bg-slate-900 text-white border-slate-700"
          >
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER BANNER ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Bot size={13} className="text-indigo-400" />
                Moteur GEO & AEO Maroc
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ChatGPT • Gemini • Perplexity • Claude
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                🇲🇦 {data.catalogStats.totalProducts} Parfums Indexés
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Command Center Visibilité IA</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Optimisez le positionnement de <strong>NAY Parfums</strong> sur les moteurs d&apos;intelligence artificielle générative (Generative Engine Optimization). Suivi des requêtes, citations, graphe de connaissances et recommandations au Maroc.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowManifestModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 transition-all shadow-xs cursor-pointer"
            >
              <Code2 size={14} className="text-indigo-400" />
              <span>Manifeste llms.txt</span>
            </button>

            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              {isAuditing ? <RefreshCw size={14} className="animate-spin text-slate-950" /> : <Sparkles size={14} className="text-slate-950" />}
              <span>{isAuditing ? 'Audit en cours...' : 'Actualiser l’Audit IA'}</span>
            </button>
          </div>
        </div>

        {/* Real-time stats bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Catalogue Actif</span>
            <strong className="text-white text-base font-bold">{data.catalogStats.totalProducts} Parfums</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Pyramides Olfactives</span>
            <strong className="text-emerald-400 text-base font-bold">{data.catalogStats.productsWithNotes} Définies</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Marques Internationales</span>
            <strong className="text-amber-300 text-base font-bold">{data.catalogStats.totalBrands} Maisons</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Dernier Scan GEO</span>
            <strong className="text-indigo-300 text-base font-bold">{data.audit.updatedAt}</strong>
          </div>
        </div>
      </div>

      {/* ── MODERN TAB NAVIGATION ────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl overflow-x-auto scrollbar-none shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENTS ─────────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* ============================================================= */}
        {/* TAB 1: OVERVIEW & PILLARS */}
        {/* ============================================================= */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Main Score Hero Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-800/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  <Activity size={13} className="text-indigo-400" />
                  Score Global de Visibilité IA (GEO)
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Score de Recommandation IA : {data.audit.aiVisibilityScore} / 100
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Ce score quantifie la clarté sémantique de NAY Parfums pour les moteurs génératifs. Votre boutique est reconnue comme une source légitime et prioritaire pour les requêtes sur les parfums de luxe et testeurs au Maroc.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 size={14} /> Graphe d&apos;Entité Validé
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <ShieldCheck size={14} /> 100% Produits Authentiques
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <MapPin size={14} /> Couverture Nationale Maroc
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-slate-900/80 p-6 rounded-2xl border border-indigo-500/20 shadow-inner min-w-[200px]">
                <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-amber-400 to-amber-200 tracking-tight">
                  {data.audit.aiVisibilityScore}
                  <span className="text-xl font-normal text-slate-400">/100</span>
                </div>
                <span className="mt-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  {data.audit.status === 'EXCELLENT' ? 'EXCELLENT (Recommandé)' : 'OPTIMISÉ'}
                </span>
                <span className="text-[11px] text-slate-400 mt-2 text-center">
                  Part de voix dominante au Maroc
                </span>
              </div>
            </div>

            {/* 7 Pillars of AI Visibility */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Les 7 Piliers de l&apos;Optimisation Générative (GEO)</h3>
                  <p className="text-xs text-slate-500">Facteurs analysés par ChatGPT, Google Gemini et Perplexity pour citer NAY Parfums</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Pillar 1 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      <Database size={17} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PASS
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{data.audit.entityStrength}<span className="text-xs font-normal text-slate-400">/100</span></div>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Force de l&apos;Entité Marque</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Organisation officielle reconnue, fondateurs identifiés, domaine validé.
                    </p>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                      <ShoppingBag size={17} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PASS
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{data.audit.productCoverage}<span className="text-xs font-normal text-slate-400">/100</span></div>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Couverture Catalogue 199 Parfums</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      199 créations indexées avec prix en MAD, formats testeurs et notes.
                    </p>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      <FileText size={17} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PASS
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{data.audit.contentCoverage}<span className="text-xs font-normal text-slate-400">/100</span></div>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Richesse Sémantique & Pyramides</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Notes de tête, cœur et fond détaillées pour chaque parfum.
                    </p>
                  </div>
                </div>

                {/* Pillar 4 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
                      <MapPin size={17} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      EXCELLENT
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{data.audit.moroccoCoverage}<span className="text-xs font-normal text-slate-400">/100</span></div>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Pertinence Géographique Maroc</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Livraison Casablanca, Rabat, Marrakech, Tanger et paiement COD.
                    </p>
                  </div>
                </div>

                {/* Pillar 5 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                      <ShieldCheck size={17} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PASS
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{data.audit.citationReadiness}<span className="text-xs font-normal text-slate-400">/100</span></div>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Citations & Preuves d&apos;Avis</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Avis clients vérifiés (4.9/5) et transparence sur les testeurs originaux.
                    </p>
                  </div>
                </div>

                {/* Pillar 6 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                      <HelpCircle size={17} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PASS
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{data.audit.questionCoverage}<span className="text-xs font-normal text-slate-400">/100</span></div>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Réponses Directes & FAQ IA</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Questions sur la concentration, la livraison et l&apos;authenticité traitées.
                    </p>
                  </div>
                </div>

                {/* Pillar 7 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
                      <Code2 size={17} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PASS
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{data.audit.technicalAccessibility}<span className="text-xs font-normal text-slate-400">/100</span></div>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">Accessibilité Technique Crawlers</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Balisage Schema JSON-LD, robots.txt et manifeste llms.txt prêts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: QUERIES & PROMPTS */}
        {/* ============================================================= */}
        {activeTab === 'queries' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Prompts & Requêtes IA Détectés au Maroc</h3>
                  <p className="text-xs text-slate-500">Questions réelles posées sur ChatGPT, Google Gemini et Perplexity</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative flex-1 w-full">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={querySearch}
                    onChange={(e) => setQuerySearch(e.target.value)}
                    placeholder="Rechercher une requête (ex: testeur, Dior Sauvage, Casablanca, avis)..."
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={queryCategory}
                    onChange={(e) => setQueryCategory(e.target.value)}
                    className="bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
                  >
                    <option value="ALL">Toutes Catégories</option>
                    <option value="Testeurs">Testeurs de Luxe</option>
                    <option value="Homme">Parfums Homme</option>
                    <option value="Femme">Parfums Femme</option>
                    <option value="Orientaux">Parfums Orientaux</option>
                    <option value="Avis">Avis & Réputation</option>
                    <option value="Coffrets">Coffrets Cadeaux</option>
                  </select>
                </div>
              </div>

              {/* Queries Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Prompt Recherché par le Client</th>
                      <th className="py-3 px-4">Plateforme IA</th>
                      <th className="py-3 px-4">Position NAY</th>
                      <th className="py-3 px-4">Intention d&apos;Achat</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueries.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 max-w-md">
                          <div className="flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">💬</span>
                            <span>&quot;{q.prompt}&quot;</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 block pl-5">
                            Cible : <strong>{q.targetEntity}</strong> • Maroc ({q.country})
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {q.platform}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            Rang #{q.position} Recommandé
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {q.intent}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSimPrompt(q.prompt);
                              setActiveTab('simulator');
                              handleSimulatePrompt(q.prompt);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            <span>Tester en direct</span>
                            <ArrowRight size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: MENTIONS & SHARE OF VOICE */}
        {/* ============================================================= */}
        {activeTab === 'mentions' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ChatGPT */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      🤖
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">ChatGPT & SearchGPT</h4>
                      <p className="text-[11px] text-slate-500">OpenAI LLM Engine</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Cité en #1 au Maroc
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans">
                  &quot;Pour commander des testeurs de parfums authentiques au Maroc avec paiement à la livraison, <strong>NAY Parfums</strong> (nayparfum.ma) est recommandé pour son catalogue de testeurs 100ml scellés et son expédition 24h-48h.&quot;
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Taux de citation : <strong className="text-slate-900 font-bold">96%</strong></span>
                  <span className="text-emerald-600 font-bold">Sentiment Positif (Luxe)</span>
                </div>
              </div>

              {/* Google Gemini */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                      ✨
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Google Gemini & AI Overviews</h4>
                      <p className="text-[11px] text-slate-500">Google Generative Engine</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Source Vérifiée
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans">
                  &quot;NAY Parfums est une boutique en ligne spécialisée dans la haute parfumerie à Casablanca. Elle propose plus de 199 références de testeurs originaux et coffrets cadeaux au Maroc.&quot;
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Taux de citation : <strong className="text-slate-900 font-bold">94%</strong></span>
                  <span className="text-blue-600 font-bold">Avis Vérifiés 4.9/5</span>
                </div>
              </div>

              {/* Perplexity AI */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      🔍
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Perplexity AI</h4>
                      <p className="text-[11px] text-slate-500">Answer Engine & Citations Web</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Source Directe #1
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans">
                  &quot;D&apos;après les avis clients et les données du site officiel nayparfum.ma, la boutique garantit des testeurs 100% originaux expédiés depuis Casablanca avec support WhatsApp actif.&quot;
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Taux de citation : <strong className="text-slate-900 font-bold">98%</strong></span>
                  <span className="text-indigo-600 font-bold">Lien de citation direct</span>
                </div>
              </div>

              {/* Claude 3.7 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Claude 3.7 Sonnet</h4>
                      <p className="text-[11px] text-slate-500">Anthropic Assistant</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Recommandé
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans">
                  &quot;Si vous cherchez des fragrances rares ou testeurs de grandes marques (Xerjoff, Parfums de Marly, Tom Ford) au Maroc, NAY Parfums propose une sélection complète avec paiement en Dirhams.&quot;
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Taux de citation : <strong className="text-slate-900 font-bold">91%</strong></span>
                  <span className="text-amber-600 font-bold">Indexation Sémantique</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: ENTITY & SCHEMA GRAPH */}
        {/* ============================================================= */}
        {activeTab === 'entity' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Brand Entity Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Entité Marque Officielle</h3>
                  <p className="text-xs text-slate-500">Graphe de connaissances lu par ChatGPT & Gemini</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Nom de l&apos;Entité :</span>
                  <strong className="text-slate-900 font-bold">{data.brandEntity.name}</strong>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Fondateurs Associés :</span>
                  <span className="font-semibold text-slate-800">{data.brandEntity.founders.join(' & ')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Domaine Canonique :</span>
                  <a href={data.brandEntity.url} target="_blank" className="font-mono text-indigo-600 font-semibold hover:underline">
                    {data.brandEntity.url}
                  </a>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Localisation & Siège :</span>
                  <span className="font-semibold text-slate-800">{data.brandEntity.city}, {data.brandEntity.country}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Devise de Facturation :</span>
                  <span className="font-bold text-amber-700">{data.brandEntity.currency}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Canal WhatsApp Client :</span>
                  <span className="font-mono font-semibold text-emerald-600">{data.brandEntity.whatsapp}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-2">Spécialités Reconnues par l&apos;IA</h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.brandEntity.specialties.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Schema Status & Validation */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Balisage Schema.org JSON-LD</h3>
                  <p className="text-xs text-slate-500">Micro-données structurées pour moteurs de recherche et LLM</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Schema Organization & Brand</p>
                      <p className="text-[10px] text-slate-500">Identité légale de la marque NAY Parfums</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Valide
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Schema Product & Offer (199 Parfums)</p>
                      <p className="text-[10px] text-slate-500">Prix en MAD, stock et pyramide olfactive</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    199 Synchronisés
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Schema LocalBusiness (Maroc)</p>
                      <p className="text-[10px] text-slate-500">Zone de livraison Casablanca & national</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Actif
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Manifeste LLMs.txt Standard</p>
                      <p className="text-[10px] text-slate-500">Fichier de référence pour Perplexity & Claude</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowManifestModal(true)}
                    className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                  >
                    Ouvrir
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: LIVE AI PROMPT SIMULATOR */}
        {/* ============================================================= */}
        {activeTab === 'simulator' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Simulateur d&apos;Invites & Réponses IA en Direct</h3>
                  <p className="text-xs text-slate-500">Visualisez exactement ce qu&apos;un LLM répond à un acheteur au Maroc</p>
                </div>
              </div>

              {/* Prompt Input Form */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Saisissez une question d&apos;un client au Maroc :
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={simPrompt}
                    onChange={(e) => setSimPrompt(e.target.value)}
                    placeholder="Ex: Quel parfum homme commander pour l'hiver à Casablanca ?"
                    className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-colors"
                  />
                  <select
                    value={simPlatform}
                    onChange={(e) => setSimPlatform(e.target.value)}
                    className="bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="ChatGPT">ChatGPT (SearchGPT)</option>
                    <option value="Google Gemini">Google Gemini</option>
                    <option value="Perplexity">Perplexity AI</option>
                  </select>
                  <button
                    onClick={() => handleSimulatePrompt()}
                    disabled={isSimulating}
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 shrink-0"
                  >
                    {isSimulating ? <RefreshCw size={13} className="animate-spin text-white" /> : <Send size={13} />}
                    <span>Générer la Réponse IA</span>
                  </button>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Suggestions rapides :</span>
                  <button
                    onClick={() => {
                      const p = "Où acheter des testeurs de parfums authentiques au Maroc ?";
                      setSimPrompt(p);
                      handleSimulatePrompt(p);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Où acheter des testeurs au Maroc ?
                  </button>
                  <button
                    onClick={() => {
                      const p = "Meilleur parfum homme longue tenue à Casablanca";
                      setSimPrompt(p);
                      handleSimulatePrompt(p);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Parfum homme longue tenue Casablanca
                  </button>
                  <button
                    onClick={() => {
                      const p = "Avis sur la boutique en ligne NAY Parfums";
                      setSimPrompt(p);
                      handleSimulatePrompt(p);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Avis NAY Parfums
                  </button>
                </div>
              </div>

              {/* Simulation Output Card */}
              {simulationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-5 sm:p-6 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {simulationResult.platform}
                      </span>
                      <span className="text-slate-400">Score de Confiance IA :</span>
                      <strong className="text-emerald-400 font-bold">{simulationResult.confidenceScore}%</strong>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Source Cité : <strong className="text-amber-300">{simulationResult.citedBrand}</strong>
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed prose prose-invert max-w-none">
                    <ReactMarkdown>{simulationResult.generatedResponse}</ReactMarkdown>
                  </div>

                  {simulationResult.productsRecommended?.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <h5 className="text-xs font-bold text-amber-300">Produits Recommandés du Catalogue (199 Parfums) :</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {simulationResult.productsRecommended.map((pr: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-white">{pr.name}</p>
                              <p className="text-[10px] text-slate-400">{pr.brand} • {pr.tagline}</p>
                            </div>
                            <span className="font-bold text-amber-400 ml-2 shrink-0">{pr.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 6: RECOMMENDATIONS & ACTION PLAN */}
        {/* ============================================================= */}
        {activeTab === 'recommendations' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Plan d&apos;Action & Recommandations d&apos;Optimisation IA</h3>
                <p className="text-xs text-slate-500">Actions concrètes à fort impact pour dominer les réponses génératives au Maroc</p>
              </div>

              <div className="space-y-3 pt-2">
                {data.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      rec.completed 
                        ? 'bg-emerald-50/40 border-emerald-200/60' 
                        : 'bg-white border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.impact === 'HIGH' 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            Impact {rec.impact === 'HIGH' ? 'Élevé' : 'Moyen'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold">• {rec.category}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{rec.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {rec.completed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl">
                            <CheckCircle2 size={13} />
                            Complété & Validé
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveTab('entity');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <span>{rec.actionLabel}</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── MANIFEST MODAL (llms.txt) ─────────────────────────────────── */}
      <AnimatePresence>
        {showManifestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 text-white border border-slate-700 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs">
                    txt
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Manifeste Sémantique /llms.txt</h3>
                    <p className="text-[11px] text-slate-400">Standard moderne lu par PerplexityBot, OpenAI & Anthropic</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManifestModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                {llmsTxtContent}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Prêt à être servi aux crawlers d&apos;intelligence artificielle.
                </span>
                <button
                  onClick={() => copyToClipboard(llmsTxtContent, 'llmstxt')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-md cursor-pointer"
                >
                  {copiedCode === 'llmstxt' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode === 'llmstxt' ? 'Copié dans le presse-papier !' : 'Copier le manifeste'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
