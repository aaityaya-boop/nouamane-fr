'use client';

import React, { useState, useEffect } from 'react';
import { CalculatorNumber } from './CalculatorNumber';

export default function LiveOnlineVisitorsCard({
  initialActiveCount,
  conversionRate,
}: {
  initialActiveCount: number;
  conversionRate: string;
}) {
  const [activeCount, setActiveCount] = useState(initialActiveCount);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/admin/stats/live');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.activeVisitorsCount === 'number') {
            setActiveCount(data.activeVisitorsCount);
          }
        }
      } catch {
        // Keep current state on error
      }
    };

    // Fetch immediately on mount
    fetchLive();

    // Poll live presence every 5 seconds for rapid reactivity
    const interval = setInterval(fetchLive, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-[#222227] rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-[#2e2e36] shadow-xs hover:border-slate-300 dark:hover:border-[#3d3d47] transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Visiteurs en Direct</span>
          <span className="nay-live-eq text-emerald-500" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
        <div className="text-2xl sm:text-[30px] font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2 mt-2 mb-4 tabular-nums">
          <CalculatorNumber value={activeCount} duration={650} />
          <span className="text-xs font-semibold text-slate-400 font-sans">actif{activeCount > 1 ? 's' : ''} sur le site</span>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-[#2e2e36]">
        <span>Taux conv. boutique : <strong className="text-slate-800 dark:text-white font-bold">{conversionRate}%</strong></span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
          <span className="nay-beacon w-1.5 h-1.5 rounded-full bg-emerald-500 text-emerald-500"></span>
          En direct
        </span>
      </div>
    </div>
  );
}
