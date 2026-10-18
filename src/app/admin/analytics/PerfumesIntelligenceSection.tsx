'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles, Award, TrendingUp, Droplets, Package, ExternalLink,
  Layers, CheckCircle2, AlertTriangle, Eye, ShoppingBag, ArrowUpRight
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import { PerfumeAnalytics } from './types';

interface PerfumesIntelligenceSectionProps {
  perfumes?: PerfumeAnalytics;
}

const OLF_COLORS = [
  '#d97706', '#8b5cf6', '#0ea5e9', '#ec4899', '#10b981', '#f97316'
];

export default function PerfumesIntelligenceSection({
  perfumes,
}: PerfumesIntelligenceSectionProps) {
  const bestSellers = perfumes?.bestSellers || [];
  const olfactoryFamilies = perfumes?.olfactoryFamilies || [];
  const genderBreakdown = perfumes?.genderBreakdown || [];
  const bottleSizes = perfumes?.bottleSizes || [];
  const crossSellingPairs = perfumes?.crossSellingPairs || [];

  return (
    <div className="space-y-6">
      {/* ── 1. TOP BEST-SELLING PERFUMES ────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121215] rounded-lg border border-[#eaeaea] dark:border-[#222227] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#eaeaea] dark:border-[#222227] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Palmarès des parfums les plus vendus
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Classement par chiffre d&apos;affaires généré, flacons vendus et transformation
            </p>
          </div>

          <span className="font-mono text-[11px] px-2 py-0.5 bg-neutral-100 dark:bg-[#1c1c21] text-neutral-600 dark:text-neutral-400 rounded border border-neutral-200 dark:border-neutral-800">
            {bestSellers.length} références actives
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#eaeaea] dark:border-[#222227] bg-[#fafafa] dark:bg-[#151518] text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <th className="py-2.5 px-3.5">Rang & Flacon</th>
                <th className="py-2.5 px-3">Maison / Marque</th>
                <th className="py-2.5 px-3">Cible</th>
                <th className="py-2.5 px-3 text-center">Unités</th>
                <th className="py-2.5 px-3 text-right">CA Généré</th>
                <th className="py-2.5 px-3 text-center">Vues</th>
                <th className="py-2.5 px-3 text-center">Stock</th>
                <th className="py-2.5 px-3.5 text-right">Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea] dark:divide-[#222227] text-neutral-700 dark:text-neutral-300 font-mono">
              {bestSellers.slice(0, 10).map((prod, idx) => (
                <tr key={idx} className="hover:bg-[#fafafa] dark:hover:bg-[#18181d] transition-colors">
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] text-neutral-400 shrink-0">
                        #{idx + 1}
                      </span>
                      {prod.image && (
                        <div className="w-7 h-7 relative rounded overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200 dark:border-neutral-800">
                          <Image src={prod.image} alt={prod.name} fill className="object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="font-sans font-medium text-neutral-900 dark:text-white text-xs truncate max-w-[200px]">
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {prod.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400 font-sans">
                    {prod.brandLabel}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-[#1c1c21] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                      {prod.gender}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-neutral-900 dark:text-white">
                    {prod.unitsSold}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-neutral-900 dark:text-white">
                    {formatMAD(prod.revenue)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-neutral-400">
                    {prod.viewsCount || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      prod.stock <= 3
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {prod.stock} en stock
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <Link
                      href={`/fr/product/${prod.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <span>Voir</span>
                      <ExternalLink size={10} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 2. OLFACTORY FAMILIES & GENDER DISTRIBUTION ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Olfactory Families */}
        <div className="bg-white dark:bg-[#121215] rounded-lg p-4.5 border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-4">
          <div className="pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
              Répartition par Famille Olfactive
            </h3>
            <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
              Poids des familles olfactives dans le chiffre d&apos;affaires
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {olfactoryFamilies.map((olf, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-900 dark:text-white flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: OLF_COLORS[idx % OLF_COLORS.length] }}
                    />
                    <span className="font-sans text-xs">{olf.name}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400">{olf.units} flacons ({olf.share}%)</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatMAD(olf.revenue)}</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-[#1c1c21] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${olf.share}%`,
                      backgroundColor: OLF_COLORS[idx % OLF_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Breakdown & Cross-Selling */}
        <div className="space-y-4">
          {/* Gender Split */}
          <div className="bg-white dark:bg-[#121215] rounded-lg p-4.5 border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-3">
            <div className="pb-3 border-b border-[#eaeaea] dark:border-[#222227]">
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
                Ciblage Homme vs Femme vs Unisexe
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {genderBreakdown.map((g, idx) => (
                <div key={idx} className="p-3 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] text-center space-y-1 font-mono">
                  <div className="text-[10px] text-neutral-400 uppercase">{g.name}</div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {formatMAD(g.revenue)}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {g.units} flacons
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Selling Duos */}
          {crossSellingPairs.length > 0 && (
            <div className="bg-white dark:bg-[#121215] rounded-lg p-4.5 border border-[#eaeaea] dark:border-[#222227] shadow-2xs space-y-3">
              <div className="pb-2 border-b border-[#eaeaea] dark:border-[#222227]">
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
                  Top Duos Achetés Ensemble
                </h3>
              </div>

              <div className="space-y-1.5">
                {crossSellingPairs.slice(0, 3).map((pair, idx) => (
                  <div key={idx} className="p-2 rounded-md bg-[#fafafa] dark:bg-[#151518] border border-[#eaeaea] dark:border-[#222227] flex items-center justify-between text-xs">
                    <span className="font-sans text-xs text-neutral-900 dark:text-white truncate max-w-[280px]">
                      {pair.pairName}
                    </span>
                    <span className="font-mono text-xs text-neutral-500 shrink-0">
                      {pair.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
