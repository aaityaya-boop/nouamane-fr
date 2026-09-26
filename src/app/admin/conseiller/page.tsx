import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import ConseillerClient from './ConseillerClient';

export const metadata = {
  title: 'Conseiller NAY (IA) — Intelligence Client | Admin NAY Parfum',
  description: 'Analyse en temps réel des questions, préférences olfactives, intentions d’achat et recommandations du Conseiller Virtuel NAY.',
};

export default async function ConseillerPage() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  return <ConseillerClient currentAdmin={admin} />;
}
