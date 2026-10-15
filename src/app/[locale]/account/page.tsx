import React from 'react';
import AccountClient from './AccountClient';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon Compte',
  description: 'Gérez votre compte NAY Parfums',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPage() {
  return <AccountClient />;
}
