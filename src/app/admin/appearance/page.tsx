import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import AdminAppearanceStudio from '@/components/admin/AdminAppearanceStudio';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mon Studio Design & Apparence | Admin NAY Parfums',
  description: 'Personnalisez votre thème, vos couleurs, votre police et votre espace de travail selon vos préférences personnelles.',
};

export default async function AdminAppearancePage() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            PREFERENCES PERSONNELLES • COLLABORATEUR
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Mon Apparence &amp; Studio Design
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Adaptez l&apos;interface de votre console à vos préférences (thème, couleurs, taille de texte, largeur et contrastes).
          </p>
        </div>
      </div>

      <AdminAppearanceStudio />
    </div>
  );
}
