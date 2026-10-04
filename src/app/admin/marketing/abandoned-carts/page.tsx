import React from 'react';
import AbandonedCartsView from './AbandonedCartsView';
import { getUnifiedAbandonedCarts } from '@/lib/abandonedCartsService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AbandonedCartsPage() {
  const serializedCarts = await getUnifiedAbandonedCarts(200);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            File de Récupération des Paniers Abandonnés
          </h2>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">
            Convertissez les intentions d'achat en ventes réelles grâce à la relance personnalisée WhatsApp et Email.
          </p>
        </div>
      </div>

      <AbandonedCartsView initialCarts={serializedCarts} />
    </div>
  );
}
