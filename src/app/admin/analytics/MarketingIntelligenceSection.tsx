'use client';

import React, { useState } from 'react';
import {
  Sparkles, Target, TrendingUp, DollarSign, Lightbulb, Zap,
  ShoppingBag, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck,
  Flame, Award, Layers, HelpCircle, BarChart3, Calculator, Smartphone
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { MarketingInsight } from './types';

interface MarketingIntelligenceSectionProps {
  insights: MarketingInsight[];
  aov: number;
  conversionRate: number;
  activeCartsValue: number;
  marketingFinancials?: {
    totalAdSpend: number;
    roas: number;
    netProfitEst: number;
    adExpensesList: any[];
  };
}

export default function MarketingIntelligenceSection({
  insights,
  aov,
  conversionRate,
  activeCartsValue,
  marketingFinancials,
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
      <div className="bg-white dark:bg-[#121215] rounded-lg p-5 border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
              Diagnostic & Recommandations Marketing
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Analyses automatisées calculées à partir de vos données réelles de navigation et ventes au Maroc
            </p>
          </div>

          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1c1c21] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
            Moteur de diagnostic V2.4
          </span>
        </div>

        {/* 4 Strategic Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white dark:bg-[#121215] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                  {insight.category}
                </span>

                {insight.metric && (
                  <div className="text-right shrink-0 font-mono">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {insight.metric}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {insight.metricLabel}
                    </div>
                  </div>
                )}
              </div>

              <h4 className="text-xs font-semibold text-neutral-900 dark:text-white leading-snug">
                {insight.title}
              </h4>

              <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
                {insight.description}
              </p>

              <div className="p-2.5 rounded border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#121215] space-y-1">
                <div className="text-[10px] font-mono font-medium text-neutral-900 dark:text-neutral-200 flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  <span>Action recommandée :</span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {insight.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. ROAS & AD SPEND PROFIT SIMULATOR ───────────────────────────────── */}
      <div className="bg-white dark:bg-[#121215] rounded-lg p-5 border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
              Simulateur de Rentabilité Ads & ROAS
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Prévision des ventes et marge selon votre budget média Meta/TikTok
            </p>
          </div>

          <span className="font-mono text-[11px] px-2 py-0.5 bg-neutral-100 dark:bg-[#1c1c21] text-neutral-600 dark:text-neutral-400 rounded border border-neutral-200 dark:border-neutral-800">
            Panier moyen : {formatMAD(aov || 460)}
          </span>
        </div>

        {/* Real Ad Performance Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 bg-[#fafafa] dark:bg-[#151518] rounded-md border border-[#eaeaea] dark:border-[#222227] divide-y sm:divide-y-0 sm:divide-x divide-[#eaeaea] dark:divide-[#222227] p-3 font-mono">
          <div className="p-2">
            <div className="text-[10px] uppercase text-neutral-400">
              Dépenses Ads Réelles
            </div>
            <div className="text-base font-semibold text-neutral-900 dark:text-white mt-0.5">
              {marketingFinancials ? formatMAD(marketingFinancials.totalAdSpend) : '0 MAD'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {marketingFinancials?.adExpensesList?.length || 0} charge(s) enregistrée(s)
            </div>
          </div>

          <div className="p-2">
            <div className="text-[10px] uppercase text-neutral-400">
              ROAS Réel Réalisé
            </div>
            <div className="text-base font-semibold text-neutral-900 dark:text-white mt-0.5">
              {marketingFinancials && marketingFinancials.roas > 0 ? `${marketingFinancials.roas}x` : '— (Hors campagne)'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              CA généré / budget média
            </div>
          </div>

          <div className="p-2">
            <div className="text-[10px] uppercase text-neutral-400">
              Marge Nette Commerciale Est.
            </div>
            <div className="text-base font-semibold text-neutral-900 dark:text-white mt-0.5">
              {marketingFinancials ? formatMAD(marketingFinancials.netProfitEst) : '0 MAD'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Après coût marchandises et ads
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Controls Column (1 col) */}
          <div className="space-y-4 p-4 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] font-mono">
            {/* Slider 1: Budget Pub */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-700 dark:text-neutral-300">
                  Budget Pub :
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
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
                className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>500 MAD</span>
                <span>20 000 MAD</span>
              </div>
            </div>

            {/* Slider 2: CPC */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-700 dark:text-neutral-300">
                  CPC Estimé :
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
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
                className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>0.50 MAD</span>
                <span>3.00 MAD</span>
              </div>
            </div>

            {/* Slider 3: Conversion Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-700 dark:text-neutral-300">
                  Taux de Conv. :
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
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
                className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>0.8%</span>
                <span>4.0%</span>
              </div>
            </div>
          </div>

          {/* Results Display (2 cols) */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Metric 1: Clics / Visites */}
            <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-1 font-mono">
              <span className="text-[10px] uppercase text-neutral-400">Trafic Estimé</span>
              <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                {estimatedClicks.toLocaleString()} clics
              </div>
              <p className="text-[10px] text-neutral-400">visites qualifiées</p>
            </div>

            {/* Metric 2: Commandes */}
            <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-1 font-mono">
              <span className="text-[10px] uppercase text-neutral-400">Commandes Estimées</span>
              <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                {estimatedOrders} achats
              </div>
              <p className="text-[10px] text-neutral-400">flacons commandés</p>
            </div>

            {/* Metric 3: CA Prévu */}
            <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-1 font-mono">
              <span className="text-[10px] uppercase text-neutral-400">CA Brut Estimé</span>
              <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                {formatMAD(estimatedRevenue)}
              </div>
              <p className="text-[10px] text-neutral-400">sur la période</p>
            </div>

            {/* Metric 4: ROAS */}
            <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-1 font-mono">
              <span className="text-[10px] uppercase text-neutral-400">Multiplicateur (ROAS)</span>
              <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                {estimatedRoas}x
              </div>
              <p className="text-[10px] text-neutral-400">
                {estimatedRoas >= 3.5 ? 'Rentabilité élevée' : 'Rentabilité standard'}
              </p>
            </div>

            {/* Metric 5: Bénéfice Net */}
            <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-1 font-mono">
              <span className="text-[10px] uppercase text-neutral-400">Bénéfice Net Estimé</span>
              <div className={`text-lg font-semibold ${estimatedNetProfit >= 0 ? 'text-neutral-900 dark:text-white' : 'text-rose-500'}`}>
                {formatMAD(estimatedNetProfit)}
              </div>
              <p className="text-[10px] text-neutral-400">après déduction ads</p>
            </div>

            {/* Metric 6: Coût par Commande */}
            <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-1 font-mono">
              <span className="text-[10px] uppercase text-neutral-400">Coût / Commande (CAC)</span>
              <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                {estimatedOrders > 0 ? formatMAD(Math.round(adBudget / estimatedOrders)) : '—'}
              </div>
              <p className="text-[10px] text-neutral-400">par vente réalisée</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. HIGH-CONVERTING CAMPAIGN ANGLES & HOOKS ───────────────────────── */}
      <div className="bg-white dark:bg-[#121215] rounded-lg p-5 border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-4">
        <div className="pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
            Angles Publicitaires Recommandés pour NAY
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Structures de publicités et d&apos;accroches vidéo pour optimiser la conversion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {campaignAngles.map((angle, idx) => (
            <div
              key={idx}
              className="p-4 rounded-md border border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-neutral-900 dark:text-white">
                  {angle.title}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] text-neutral-600 dark:text-neutral-400">
                  {angle.badge}
                </span>
              </div>

              <div className="text-[11px] text-neutral-500 space-y-1 font-sans">
                <div><span className="text-neutral-400 font-mono text-[10px] uppercase">Cible :</span> {angle.target}</div>
                <div><span className="text-neutral-400 font-mono text-[10px] uppercase">Format :</span> {angle.formats}</div>
                <div><span className="text-neutral-400 font-mono text-[10px] uppercase">Parfums :</span> {angle.perfumes}</div>
              </div>

              <div className="p-2.5 rounded border border-[#eaeaea] dark:border-[#222227] bg-white dark:bg-[#121215] text-[11px] text-neutral-700 dark:text-neutral-300 italic">
                {angle.hook}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
