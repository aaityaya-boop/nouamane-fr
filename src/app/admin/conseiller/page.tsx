import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import ConseillerClient from './ConseillerClient';

export const metadata = {
  title: 'Conseiller Clientèle & Ventes — Intelligence Client | Admin NAY Parfum',
  description: 'Analyse en temps réel des questions clients, préférences olfactives, intentions d’achat et recommandations du Conseiller NAY.',
};

export default async function ConseillerPage() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  return <ConseillerClient currentAdmin={admin} />;
}
