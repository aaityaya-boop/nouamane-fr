import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';
import SavClient from './SavClient';

export const metadata = {
  title: 'SAV & Réclamations | Admin NAY Parfum',
  description: 'Gestion centralisée du service après-vente, retours, échanges et remboursements.',
};

export default async function SavPage() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  if (!hasPermission(admin, 'orders.view')) {
    redirect('/admin?error=unauthorized');
  }

  return <SavClient currentAdmin={admin} />;
}
