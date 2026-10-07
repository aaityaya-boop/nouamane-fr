'use client';

import React, { useState } from 'react';
import {
  Sparkles, Target, TrendingUp, DollarSign, Lightbulb, Zap,
  ShoppingBag, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck,
  Flame, Award, Layers, HelpCircle, BarChart3, Calculator
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { MarketingInsight } from './types';

interface MarketingIntelligenceSectionProps {
  insights: MarketingInsight[];
  aov: number;
  conversionRate: number;
  activeCartsValue: number;
}

export default function MarketingIntelligenceSection({
  insights,
  aov,
  conversionRate,
  activeCartsValue,
}: MarketingIntelligenceSectionProps) {
  // ROAS & Budget Simulator State
  const [adBudget, setAdBudget] = useState<number>(3000);
  const [cpcEstimate, setCpcEstimate] = useState<number>(1.2); // ~1.2 MAD par clic moyen au Maroc
  const [targetConversionRate, setTargetConversionRate] = useState<number>(Math.max(1.5, conversionRate || 1.8));

  // Calculations for simulator
  const estimatedClicks = Math.round(adBudget / (cpcEstimate || 1));
  const estimatedOrders = Math.max(1, Math.round((estimatedClicks * targetConversionRate) / 100));
  const estimatedRevenue = Math.round(estimatedOrders * (aov || 460));
  const estimatedRoas = adBudget > 0 ? Number((estimatedRevenue / adBudget).toFixed(2)) : 0;
  const estimatedNetProfit = Math.round(estimatedRevenue * 0.42 - adBudget); // ~42% marge brute

  // Marketing Campaign Angles
  const campaignAngles = [
    {
      title: "Angle 1 : Sillage & Longue Tenue (12h+)",
      target: "Hommes & Femmes 22-45 ans (Casablanca, Rabat, Marrakech)",
      hook: "« Vous en avez marre des parfums qui disparaissent après 2 heures ? Découvrez notre sélection haute concentration. »",
      formats: "Reels / TikTok vidéo UGC avec test de tenue sur vêtement",
      perfumes: "Jean Paul Gaultier Le Male Elixir, Baccarat Rouge 540, Louis Vuitton Imagination",
      badge: "Sillage Extrême",
    },
    {
      title: "Angle 2 : Le Bon Plan Testeurs Authentiques (-50%)",
      target: "Amateurs de parfums de luxe cherchant le meilleur prix",
      hook: "« Pourquoi payer 1 500 DH en boutique quand vous pouvez avoir le flacon original testeur à 299 DH ? Même jus, même tenue. »",
      formats: "Vidéo déballage flacon + comparaison tarifaire directe",
      perfumes: "Burberry Her, Dior Sauvage Elixir, Boss Bottled Elixir",
      badge: "Best-Seller",
    },
    {
      title: "Angle 3 : L'Offre Triplette (-10% dès 3 Parfums)",
      target: "Acheteurs de cadeaux & collectionneurs de parfums",
      hook: "« Composez votre dressing olfactif : 1 pour le bureau, 1 pour le soir, 1 pour le week-end avec -10% immédiats + Livraison Express Gratuite. »",
      formats: "Carrousel 3 parfums complémentaires + code PARFUM10",
      perfumes: "Packs personnalisés 3 x 100ml",
      badge: "Panier Élevé",
    },
    {
      title: "Angle 4 : Confiance Absolue & Paiement à la Livraison",
      target: "Nouveaux clients hésitants sur les achats en ligne",
      hook: "« Commandez l'esprit tranquille : ouvrez votre colis et vérifiez vos flacons avant de payer au livreur. Livraison partout au Maroc sous 24-48h. »",
      formats: "Story avec avis client WhatsApp + livreur souriant",
      perfumes: "Tous les parfums en stock",
      badge: "Réassurance",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── 1. STRATEGIC AI MARKETING ADVISOR ───────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Sparkles size={16} />
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Conseils Stratégiques & Diagnostic Marketing IA
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Analyses automatisées calculées à partir de vos données réelles de vente, de navigation et de géographie au Maroc.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
            Moteur de Recommandation V2.4
          </span>
        </div>

        {/* 4 Strategic Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-800/30 hover:border-sky-500/40 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 text-sky-600 dark:text-sky-400 border border-neutral-200/60 dark:border-neutral-700">
                  {insight.category}
                </span>

                {insight.metric && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-neutral-900 dark:text-white">
                      {insight.metric}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {insight.metricLabel}
                    </div>
                  </div>
                )}
              </div>

              <h4 className="text-xs font-bold text-neutral-900 dark:text-white leading-snug">
                {insight.title}
              </h4>

              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {insight.description}
              </p>

              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900/90 border border-neutral-200/60 dark:border-neutral-800/80 space-y-1">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Action Marketing Recommandée :</span>
                </div>
                <p className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  {insight.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. ROAS & AD SPEND PROFIT SIMULATOR ───────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Calculator size={16} />
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Simulateur de Rentabilité Publicitaire & Budget Meta/TikTok (ROAS)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Anticipez vos ventes et votre chiffre d&apos;affaires en ajustant votre budget média selon les métriques de NAY Parfums.
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg">
            Panier Moyen : {formatMAD(aov || 460)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column (1 col) */}
          <div className="space-y-4 p-5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            {/* Slider 1: Budget Pub */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  Budget Publicitaire (MAD) :
                </span>
                <span className="font-black text-sky-600 dark:text-sky-400">
                  {adBudget.toLocaleString()} MAD
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="20000"
                step="500"
                value={adBudget}
                onChange={(e) => setAdBudget(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>500 MAD</span>
                <span>10 000 MAD</span>
                <span>20 000 MAD</span>
              </div>
            </div>

            {/* Slider 2: CPC */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  Coût par Clic Estimé (CPC) :
                </span>
                <span className="font-black text-neutral-900 dark:text-white">
                  {cpcEstimate.toFixed(2)} MAD
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={cpcEstimate}
                onChange={(e) => setCpcEstimate(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>0.50 MAD (Éco)</span>
                <span>1.20 MAD (Moyen)</span>
                <span>3.00 MAD</span>
              </div>
            </div>

            {/* Slider 3: Conversion Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  Taux de Conversion Ciblé :
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {targetConversionRate.toFixed(2)}%
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="4.0"
                step="0.1"
                value={targetConversionRate}
                onChange={(e) => setTargetConversionRate(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>0.8%</span>
                <span>Actuel : {conversionRate}%</span>
                <span>4.0%</span>
              </div>
            </div>
          </div>

          {/* Results Display (2 cols) */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {/* Metric 1: Clics / Visites */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Trafic Estimé</span>
              <div className="text-xl font-black text-neutral-900 dark:text-white">
                {estimatedClicks.toLocaleString()} clics
              </div>
              <p className="text-[10px] text-neutral-500">visiteurs qualifiés générés</p>
            </div>

            {/* Metric 2: Commandes */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Commandes Estimées</span>
              <div className="text-xl font-black text-sky-600 dark:text-sky-400">
                {estimatedOrders} achats
              </div>
              <p className="text-[10px] text-neutral-500">flacons commandés</p>
            </div>

            {/* Metric 3: CA Prévu */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">CA Brut Estimé</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatMAD(estimatedRevenue)}
              </div>
              <p className="text-[10px] text-neutral-500">sur la période</p>
            </div>

            {/* Metric 4: ROAS */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Multiplicateur (ROAS)</span>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                {estimatedRoas}x
              </div>
              <p className="text-[10px] text-neutral-500">
                {estimatedRoas >= 3.5 ? '🔥 Excellent retour' : 'Bonne rentabilité'}
              </p>
            </div>

            {/* Metric 5: Bénéfice Net */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Bénéfice Net Estimé</span>
              <div className={`text-xl font-black ${estimatedNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatMAD(estimatedNetProfit)}
              </div>
              <p className="text-[10px] text-neutral-500">après coûts pub déduits</p>
            </div>

            {/* Metric 6: Coût par Commande */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Coût d&apos;Acquisition (CAC)</span>
              <div className="text-xl font-black text-neutral-900 dark:text-white">
                {estimatedOrders > 0 ? formatMAD(Math.round(adBudget / estimatedOrders)) : '—'}
              </div>
              <p className="text-[10px] text-neutral-500">par commande générée</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. HIGH-CONVERTING CAMPAIGN ANGLES & HOOKS (MARKETING LEARNING) ──── */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Flame size={16} />
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Playbook Marketing : Les 4 Angles Publicitaires Gagnants pour NAY
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Structures de publicités et d&apos;accroches vidéo (UGC) prêtes à l&apos;emploi pour maximiser le taux de conversion sur Instagram et TikTok.
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-lg">
            Framework E-Commerce Luxe
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaignAngles.map((angle, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-900 dark:text-white">
                  {angle.title}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {angle.badge}
                </span>
              </div>

              <div className="text-[11px] text-neutral-500 space-y-1">
                <div>🎯 <strong>Cible :</strong> {angle.target}</div>
                <div>📱 <strong>Format recommandé :</strong> {angle.formats}</div>
                <div>💎 <strong>Parfums stars :</strong> {angle.perfumes}</div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-[11px] text-neutral-800 dark:text-neutral-200 italic">
                {angle.hook}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
