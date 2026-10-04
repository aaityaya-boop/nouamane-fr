import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import SuiviClient from './SuiviClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Suivi de Commande en Direct | NAY Parfums',
  description: 'Suivez l’acheminement de votre colis NAY Parfums en temps réel partout au Maroc.',
};

export default async function SuiviCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; orderNumber?: string; id?: string }>;
}) {
  const resolved = await searchParams;
  const initialOrder = resolved?.order || resolved?.orderNumber || resolved?.id || '';

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-400 text-xs font-medium">Chargement du suivi...</div>
        </div>
      }
    >
      <SuiviClient initialOrderNumber={initialOrder} />
    </Suspense>
  );
}
