'use client';

import React, { useState, useEffect } from 'react';

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

    // Poll live presence every 10 seconds
    const interval = setInterval(fetchLive, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Visiteurs en Direct</span>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      </div>
      <div className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
        <span>{activeCount}</span>
        <span className="text-xs font-normal text-slate-400">actif{activeCount > 1 ? 's' : ''}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>Taux conv. boutique : <strong className="text-slate-800 font-semibold">{conversionRate}%</strong></span>
        <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          En direct
        </span>
      </div>
    </div>
  );
}
