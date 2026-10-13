import React from 'react';
import prisma from '@/lib/prisma';
import { Sparkles, AlertCircle, TrendingUp, CheckCircle2, ArrowRight, ArrowUpRight, Flame, Target, Compass } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  const opportunities = await prisma.seoOpportunity.findMany({
    orderBy: { priority: 'desc' },
    take: 50
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Opportunités de Croissance SEO au Maroc
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Actions prioritaires détectées pour booster les positions sur Google.ma et maximiser les commandes
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold self-start sm:self-auto">
          <span>{opportunities.length} opportunités identifiées</span>
        </span>
      </div>

      {/* ── OPPORTUNITY CARDS ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {opportunities.map((opp, idx) => (
          <div 
            key={opp.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all space-y-4 group"
          >
            {/* Top Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1D9BF0] transition-colors">
                    {opp.title}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Mot-clé : {opp.keyword}
                  </span>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                opp.impact === 'HIGH'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                  : 'bg-sky-50 text-sky-800 border-sky-200/60'
              }`}>
                {opp.impact === 'HIGH' && <TrendingUp size={11} className="text-emerald-600" />}
                <span>Impact {opp.impact === 'HIGH' ? 'Élevé' : 'Moyen'}</span>
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {opp.description}
            </p>

            {/* Action Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plan d&apos;Action Recommandé :</div>
              <p className="text-xs font-semibold text-slate-800">
                {opp.recommendation}
              </p>
            </div>

            {/* Stats Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>Potentiel : <strong className="text-emerald-600 font-mono font-bold">+{opp.clicks} clics</strong></span>
                <span>•</span>
                <span>Position visée : <strong className="text-slate-800 font-mono font-bold">#{opp.position?.toFixed(1) || '1.5'}</strong></span>
              </div>

              {opp.targetUrl && (
                <Link
                  href={opp.targetUrl.replace('https://nayparfum.ma', '') || '/'}
                  target="_blank"
                  className="inline-flex items-center gap-1 font-semibold text-xs text-[#1D9BF0] hover:text-[#0284c7]"
                >
                  <span>Appliquer</span>
                  <ArrowUpRight size={13} />
                </Link>
              )}
            </div>

          </div>
        ))}

        {opportunities.length === 0 && (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Aucune opportunité détectée pour le moment.</p>
          </div>
        )}
      </div>

    </div>
  );
}
