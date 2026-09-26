import React from 'react';
import { getOrGenerateAiVisibilityData } from '@/lib/seo/aiVisibilityService';
import AiVisibilityClient from './AiVisibilityClient';

export const metadata = {
  title: 'Command Center Visibilité IA (GEO & AEO) — NAY Parfums Maroc',
  description: 'Analyse et optimisation de la visibilité de NAY Parfums sur ChatGPT, Google Gemini, Perplexity et Claude.',
};

export default async function AiVisibilityOverviewPage() {
  const data = await getOrGenerateAiVisibilityData();

  return <AiVisibilityClient initialData={data} />;
}
