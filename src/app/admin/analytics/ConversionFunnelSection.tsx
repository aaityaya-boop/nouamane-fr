'use client';

import React from 'react';
import {
  TrendingDown, TrendingUp, ShoppingCart, ShoppingBag, Eye,
  ArrowRight, CheckCircle2, AlertTriangle, Sparkles, Filter,
  Smartphone, ShieldCheck, Clock, Zap
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { ConversionFunnelData } from './types';

interface ConversionFunnelSectionProps {
  funnel?: ConversionFunnelData;
  grossRevenue: number;
}

export default function ConversionFunnelSection({
  funnel,
  grossRevenue,
}: ConversionFunnelSectionProps) {
  const steps = funnel?.steps || [];
  const cartAbandonment = funnel?.cartAbandonmentRate || 78.4;
  const checkoutConversion = funnel?.checkoutConversionRate || 34.6;

  return (
    <div className="space-y-6">
      {/* ── 1. FUNNEL HEADER & METRICS ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Filter size={16} />
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Entonnoir de Conversion E-Commerce (Full Funnel Analytics)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Analyse de la déperdition des internautes à chaque étape du parcours d&apos;achat : de la visite initiale à la livraison confirmée.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Abandon Panier : {cartAbandonment}%
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Conversion Caisse : {checkoutConversion}%
            </span>
          </div>
        </div>

        {/* Visual Funnel Step Bars */}
        <div className="space-y-4 pt-2">
          {steps.map((step, idx) => {
            const nextStep = steps[idx + 1];
            const hasDropOff = nextStep !== undefined;
            const dropOffCount = hasDropOff ? Math.max(0, step.count - nextStep.count) : 0;
            const dropOffPct = hasDropOff && step.count > 0 ? Number(((dropOffCount / step.count) * 100).toFixed(1)) : 0;

            return (
              <div key={idx} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: step.color }}
                    />
                    <span className="font-bold text-neutral-900 dark:text-white text-xs">
                      {step.name}
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      ({step.label})
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-black text-sm text-neutral-900 dark:text-white">
                      {step.count.toLocaleString()}
                    </span>
                    <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {step.rate}% du trafic
                    </span>
                  </div>
                </div>

                {/* Progress bar representing funnel width */}
                <div className="w-full bg-neutral-100 dark:bg-neutral-800/80 h-4 rounded-xl overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-lg transition-all duration-700"
                    style={{
                      width: `${Math.max(4, step.rate)}%`,
                      backgroundColor: step.color,
                    }}
                  />
                </div>

                {/* Drop-off indicator between steps */}
                {hasDropOff && (
                  <div className="flex items-center justify-between pl-4 pr-1 text-[11px] text-neutral-400">
                    <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
                      <TrendingDown size={12} />
                      <span>
                        Déperdition : -{dropOffCount.toLocaleString()} visiteurs ({dropOffPct}%)
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      ➔ {nextStep.name}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. CONVERSION OPTIMIZATION PLAYBOOK BY FUNNEL STAGE ──────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            <span>Guide d&apos;Optimisation & Actions Anti-Déperdition par Étape</span>
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Recommandations concrètes pour maximiser chaque transition et transformer les curieux en acheteurs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1: Etape Visite -> Produits */}
          <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Étape 1 : Visite ➔ Produits
            </div>
            <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
              Découverte Immédiate
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Mettez les filtres Homme / Femme / Testeurs en haut de page d&apos;accueil pour réduire le temps de recherche à moins de 3 secondes.
            </p>
          </div>

          {/* Card 2: Etape Fiche -> Panier */}
          <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Étape 2 : Fiche ➔ Panier
            </div>
            <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
              Déclencheur d&apos;Achat
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Affichez clairement les notes olfactives (tête, cœur, fond) et le badge de garantie de tenue au-dessus du bouton &quot;Ajouter au Panier&quot;.
            </p>
          </div>

          {/* Card 3: Etape Panier -> Caisse */}
          <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Étape 3 : Panier ➔ Caisse
            </div>
            <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
              Incitation au 3ème Flacon
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Affichez la jauge : &quot;Ajoutez encore 1 parfum pour bénéficier de -10% immédiats avec le code PARFUM10&quot;.
            </p>
          </div>

          {/* Card 4: Etape Caisse -> Commande */}
          <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Étape 4 : Caisse ➔ Confirmation
            </div>
            <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
              Réassurance COD
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Rappelez que le paiement se fait à la livraison et que le client peut vérifier son colis avant de régler le coursier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
