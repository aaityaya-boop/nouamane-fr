'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  TrendingUp,
  Heart,
  X,
  Smartphone,
  Monitor,
  CheckCircle2,
  Sliders,
  Settings,
  RefreshCw,
  ExternalLink,
  Save,
  Check
} from 'lucide-react';

export default function AdminScentMatchPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Config form state
  const [isEnabled, setIsEnabled] = useState(true);
  const [recommendedSwipes, setRecommendedSwipes] = useState(10);
  const [minSwipesForAnalysis, setMinSwipesForAnalysis] = useState(3);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scent-match/admin');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (json.data.config) {
          setIsEnabled(json.data.config.isEnabled ?? true);
          setRecommendedSwipes(json.data.config.recommendedSwipes ?? 10);
          setMinSwipesForAnalysis(json.data.config.minSwipesForAnalysis ?? 3);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/scent-match/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled,
          recommendedSwipes: Number(recommendedSwipes),
          minSwipesForAnalysis: Number(minSwipesForAnalysis)
        })
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-sky-500" size={28} />
      </div>
    );
  }

  const { metrics, topLikedProducts, recentResults } = data || {
    metrics: {},
    topLikedProducts: [],
    recentResults: []
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-sky-500">
              NAY SCENT MATCH ANALYTICS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Moteur de Découverte Olfactive
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Performance en direct, taux d'engagement des swipes et fragrances les plus plébiscitées
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/fr/scent-match"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <span>Tester Scent Match</span>
            <ExternalLink size={13} />
          </Link>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Rafraîchir les données"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TOTAL SESSIONS */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total Sessions
          </span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.totalSessions || 0}
            </h3>
            <span className="text-xs font-bold text-sky-500">
              {metrics.completionRate}% Complétées
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${metrics.completionRate || 0}%` }}
            />
          </div>
        </div>

        {/* TOTAL SWIPES */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total Swipes
          </span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.totalSwipes || 0}
            </h3>
            <span className="text-xs font-bold text-emerald-500">
              {metrics.likeRate}% Like Rate
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {metrics.totalLikes || 0} Likes · {metrics.totalPasses || 0} Passes
          </p>
        </div>

        {/* TOTAL LIKES */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Coups de Cœur
          </span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-500">
              {metrics.totalLikes || 0}
            </h3>
            <Heart size={18} className="text-emerald-500 fill-emerald-500" />
          </div>
          <p className="text-[10px] text-slate-400">
            Fragrances ajoutées aux favoris du laboratoire
          </p>
        </div>

        {/* DEVICE BREAKDOWN */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Support Utilisé
          </span>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Smartphone size={16} className="text-sky-500" />
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {metrics.mobileSessions || 0}
              </span>
              <span className="text-[10px] text-slate-400">Mobile</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Monitor size={16} className="text-slate-400" />
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {metrics.desktopSessions || 0}
              </span>
              <span className="text-[10px] text-slate-400">PC</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            Optimisation duale responsive en direct
          </p>
        </div>
      </div>

      {/* TOP 10 MOST LIKED PERFUMES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Top 10 des Parfums les Plus Likés
            </h2>
            <p className="text-xs text-slate-500">
              Classement en direct des fragrances ayant suscité le plus de coups de cœur
            </p>
          </div>
          <span className="text-xs font-bold text-sky-500">
            {topLikedProducts.length} produits enregistrés
          </span>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Rang</th>
                  <th className="py-3.5 px-4">Parfum</th>
                  <th className="py-3.5 px-4">Famille</th>
                  <th className="py-3.5 px-4">Prix</th>
                  <th className="py-3.5 px-4 text-center">Likes</th>
                  <th className="py-3.5 px-4 text-center">Passes</th>
                  <th className="py-3.5 px-4 text-center">Taux d'Affinité</th>
                  <th className="py-3.5 px-4 text-center">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topLikedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucun like enregistré pour le moment. Testez Scent Match sur le site !
                    </td>
                  </tr>
                ) : (
                  topLikedProducts.map((p: any, idx: number) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-center font-black text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 flex-shrink-0 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden p-1 border border-slate-100 dark:border-slate-800">
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              className="object-contain"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider block">
                              {p.brandLabel}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {p.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {p.subcategoryLabel}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                        {p.price} MAD
                      </td>
                      <td className="py-3 px-4 text-center font-black text-emerald-500">
                        {p.likeCount}
                      </td>
                      <td className="py-3 px-4 text-center text-rose-500 font-semibold">
                        {p.passCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
                          {p.likeRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.inStock ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold">
                            En Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] font-bold">
                            Rupture
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RECENT SCENT DNA RESULTS & CONFIG FORM */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Recent Results */}
        <div className="md:col-span-7 space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Derniers Profils ADN Révélés
          </h2>
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
            {recentResults.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Aucun résultat Scent DNA finalisé récemment.
              </p>
            ) : (
              recentResults.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {r.personalityTitle}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {r.participantName} · {r.totalLikes} likes · {r.deviceType}
                    </span>
                  </div>
                  <Link
                    href={`/fr/scent-match/results/${r.shareToken}`}
                    target="_blank"
                    className="flex items-center gap-1 text-[11px] font-bold text-sky-500 hover:underline"
                  >
                    <span>Voir</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Admin Settings Config */}
        <div className="md:col-span-5 space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Paramètres du Moteur Scent Match
          </h2>
          <form
            onSubmit={handleSaveConfig}
            className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm"
          >
            {/* Feature Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                  Activer Scent Match
                </span>
                <span className="text-[10px] text-slate-400">
                  Visible par les visiteurs sur le site public
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Recommended Swipes Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Nombre de Swipes Recommandé
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={recommendedSwipes}
                onChange={(e) => setRecommendedSwipes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">
                Seuil recommandé avant de suggérer la révélation de l'ADN (défaut : 10)
              </span>
            </div>

            {/* Min Swipes for early finish */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Swipes Minimum pour Révélation Anticipée
              </label>
              <input
                type="number"
                min={2}
                max={10}
                value={minSwipesForAnalysis}
                onChange={(e) => setMinSwipesForAnalysis(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">
                Minimum d'interactions nécessaires pour débloquer l'analyse (défaut : 3)
              </span>
            </div>

            <button
              type="submit"
              disabled={savingConfig}
              className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 ${
                saveSuccess
                  ? 'bg-emerald-500'
                  : 'bg-slate-900 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 shadow-md'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check size={16} />
                  <span>Modifications Enregistrées !</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{savingConfig ? 'Enregistrement...' : 'Enregistrer les Paramètres'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
