import React from 'react';
import AbandonedCartsView from './AbandonedCartsView';
import { getUnifiedAbandonedCarts } from '@/lib/abandonedCartsService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AbandonedCartsPage() {
  const serializedCarts = await getUnifiedAbandonedCarts(200);
  const renderedAt = Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            File de Récupération des Paniers Abandonnés
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Convertissez les intentions d&apos;achat en ventes réelles grâce à la relance personnalisée WhatsApp et Email.
          </p>
        </div>
      </div>

      <AbandonedCartsView initialCarts={serializedCarts} renderedAt={renderedAt} />
    </div>
  );
}
