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
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Award size={16} />
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Palmarès des Parfums les Plus Vendus & Désirabilité
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Classement par chiffre d&apos;affaires généré, flacons vendus et taux de transformation par fiche produit.
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg">
            {bestSellers.length} références actives
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <th className="py-3 px-3.5">Rang & Flacon</th>
                <th className="py-3 px-3">Maison / Marque</th>
                <th className="py-3 px-3">Cible</th>
                <th className="py-3 px-3 text-center">Unités Vendues</th>
                <th className="py-3 px-3 text-right">CA Généré</th>
                <th className="py-3 px-3 text-center">Vues Fiche</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-right">Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
              {bestSellers.slice(0, 10).map((prod, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                        #{idx + 1}
                      </span>
                      {prod.image && (
                        <div className="w-8 h-8 relative rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                          <Image src={prod.image} alt={prod.name} fill className="object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white text-xs truncate max-w-[200px]">
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {prod.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-neutral-600 dark:text-neutral-400 font-semibold">
                    {prod.brandLabel}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {prod.gender}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-black text-neutral-900 dark:text-white">
                    {prod.unitsSold} flacons
                  </td>
                  <td className="py-3 px-3 text-right font-black text-sky-600 dark:text-sky-400">
                    {formatMAD(prod.revenue)}
                  </td>
                  <td className="py-3 px-3 text-center text-neutral-500">
                    {prod.viewsCount || '—'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      prod.stock <= 3
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                        : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                    }`}>
                      {prod.stock} en stock
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/fr/product/${prod.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-500 hover:text-sky-600"
                    >
                      <span>Voir</span>
                      <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 2. OLFACTORY FAMILIES & GENDER DISTRIBUTION ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Olfactory Families */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
                <Droplets size={16} />
              </span>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Répartition par Famille Olfactive
              </h3>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {olfactoryFamilies.map((olf, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-neutral-900 dark:text-white flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: OLF_COLORS[idx % OLF_COLORS.length] }}
                    />
                    {olf.name}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-neutral-400">{olf.units} flacons ({olf.share}%)</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{formatMAD(olf.revenue)}</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
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
        <div className="space-y-6">
          {/* Gender Split */}
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-indigo-500" />
                <span>Ciblage Homme vs Femme vs Unisexe</span>
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {genderBreakdown.map((g, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-center space-y-1">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">{g.name}</div>
                  <div className="text-base font-black text-neutral-900 dark:text-white">
                    {formatMAD(g.revenue)}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    {g.units} flacons • Panier {formatMAD(g.aov)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Selling Duos */}
          {crossSellingPairs.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-500" />
                  <span>Top Duos Achetés Ensemble (Packs Gagnants)</span>
                </h3>
              </div>

              <div className="space-y-2">
                {crossSellingPairs.slice(0, 3).map((pair, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-900 dark:text-white truncate max-w-[280px]">
                      {pair.pairName}
                    </span>
                    <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0">
                      {pair.count}x ensemble
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
