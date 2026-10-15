import React from 'react';
import { getCurrentAmbassador } from '@/lib/affiliate-auth';
import AmbassadeurDashboardClient from './AmbassadeurDashboardClient';
import AmbassadeurLoginClient from './AmbassadeurLoginClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Portail Ambassadeurs & VIP',
    description: 'Espace officiel dédié aux partenaires, créateurs de contenu et influenceurs de NAY Parfums.',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AmbassadeurPage() {
  const ambassador = await getCurrentAmbassador();

  if (!ambassador) {
    return <AmbassadeurLoginClient />;
  }

  // Sanitize password hash before passing to client component
  const { passwordHash, ...safeAmbassador } = ambassador;

  return <AmbassadeurDashboardClient ambassador={safeAmbassador} />;
}
