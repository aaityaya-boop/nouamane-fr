import React from 'react';
import AccountClient from '../account/AccountClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion & Espace Membre | NAY Parfums',
  description: 'Connectez-vous à votre espace personnel NAY Parfums',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <AccountClient />;
}
