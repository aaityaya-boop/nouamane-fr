'use client';

import React, { useState, useEffect } from 'react';

type PageViewItem = {
  id: number;
  pathname: string;
  referrer?: string | null;
  createdAt: string | Date;
  visitor?: {
    city?: string | null;
  } | null;
};

export default function LiveActivityStream({
  initialViews,
}: {
  initialViews: any[];
}) {
  const [views, setViews] = useState<PageViewItem[]>(initialViews);

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const res = await fetch('/api/admin/stats/live');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.recentPageViews)) {
            setViews(data.recentPageViews);
          }
        }
      } catch {
        // Keep current state on network error
      }
    };

    // Auto-poll new pageviews every 12 seconds
    const interval = setInterval(fetchStream, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Flux Visites en Direct</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Temps réel</span>
      </div>

      <div className="divide-y divide-slate-100">
        {views.length === 0 ? (
          <p className="px-5 py-6 text-slate-400 text-center text-xs">En attente de nouvelles visites...</p>
        ) : (
          views.map((view) => (
            <div key={view.id} className="p-3.5 hover:bg-slate-50/70 flex items-center justify-between text-xs transition-colors">
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-slate-900 truncate">
                  {view.pathname === '/' ? 'Accueil Boutique' : view.pathname}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {view.visitor?.city || 'Maroc'} • {view.referrer ? view.referrer.replace('https://', '').replace('http://', '').slice(0, 18) : 'Accès Direct'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {new Date(view.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
