import React from 'react';

export const metadata = {
  title: 'Command Center Visibilité IA (GEO) — NAY Parfums Maroc',
  description: 'Optimisation de la présence et des recommandations de NAY Parfums sur ChatGPT, Google Gemini, Perplexity et Claude.',
};

export default function AiVisibilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full pb-12 font-sans text-slate-900">
      {children}
    </div>
  );
}
