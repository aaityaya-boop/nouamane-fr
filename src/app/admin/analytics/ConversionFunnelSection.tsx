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
      <div className="bg-white dark:bg-[#121215] rounded-lg p-5 border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
                Entonnoir de Conversion E-Commerce
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Analyse de la déperdition des internautes à chaque étape du parcours d&apos;achat
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1c1c21] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
              Abandon panier : {cartAbandonment}%
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              Conversion : {checkoutConversion}%
            </span>
          </div>
        </div>

        {/* Visual Funnel Step Bars */}
        <div className="space-y-4 pt-1">
          {steps.map((step, idx) => {
            const nextStep = steps[idx + 1];
            const hasDropOff = nextStep !== undefined;
            const dropOffCount = hasDropOff ? Math.max(0, step.count - nextStep.count) : 0;
            const dropOffPct = hasDropOff && step.count > 0 ? Number(((dropOffCount / step.count) * 100).toFixed(1)) : 0;

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: step.color }}
                    />
                    <span className="font-semibold text-neutral-900 dark:text-white font-sans text-xs">
                      {step.name}
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      ({step.label})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {step.count.toLocaleString()}
                    </span>
                    <span className="text-neutral-400">
                      {step.rate}% du trafic
                    </span>
                  </div>
                </div>

                {/* Progress bar representing funnel width */}
                <div className="w-full bg-neutral-100 dark:bg-[#1c1c21] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, step.rate)}%`,
                      backgroundColor: step.color,
                    }}
                  />
                </div>

                {/* Drop-off indicator between steps */}
                {hasDropOff && (
                  <div className="flex items-center justify-between pl-3 pr-1 text-[11px] font-mono text-neutral-400">
                    <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                      <TrendingDown size={11} className="text-rose-500" />
                      <span>
                        Déperdition : -{dropOffCount.toLocaleString()} ({dropOffPct}%)
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
      <div className="bg-white dark:bg-[#121215] rounded-lg p-5 border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-4">
        <div className="pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
            Recommandations d&apos;Optimisation du Tunnel
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Actions recommandées pour maximiser chaque transition et réduire l&apos;abandon
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Card 1: Etape Visite -> Produits */}
          <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Étape 1 : Visite ➔ Produits
            </div>
            <h4 className="font-semibold text-xs text-neutral-900 dark:text-white">
              Découverte Immédiate
            </h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Mettez les filtres Homme / Femme / Testeurs en haut de page d&apos;accueil pour réduire le temps de recherche à moins de 3 secondes.
            </p>
          </div>

          {/* Card 2: Etape Fiche -> Panier */}
          <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Étape 2 : Fiche ➔ Panier
            </div>
            <h4 className="font-semibold text-xs text-neutral-900 dark:text-white">
              Déclencheur d&apos;Achat
            </h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Affichez clairement les notes olfactives (tête, cœur, fond) et le badge de garantie de tenue au-dessus du bouton &quot;Ajouter au Panier&quot;.
            </p>
          </div>

          {/* Card 3: Etape Panier -> Caisse */}
          <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Étape 3 : Panier ➔ Caisse
            </div>
            <h4 className="font-semibold text-xs text-neutral-900 dark:text-white">
              Incitation au 3ème Flacon
            </h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Affichez la jauge : &quot;Ajoutez encore 1 parfum pour bénéficier de -10% immédiats avec le code PARFUM10&quot;.
            </p>
          </div>

          {/* Card 4: Etape Caisse -> Commande */}
          <div className="p-3.5 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Étape 4 : Caisse ➔ Confirmation
            </div>
            <h4 className="font-semibold text-xs text-neutral-900 dark:text-white">
              Réassurance COD
            </h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Rappelez que le paiement se fait à la livraison et que le client peut vérifier son colis avant de régler le coursier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
