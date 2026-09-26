import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import SettingsClient from './SettingsClient';

export const metadata = {
  title: 'Paramètres Boutique — Configuration & Identité | Admin NAY Parfums',
  description: 'Gérez l’identité commerciale, la tarification de livraison, la vitrine d’accueil, les coordonnées de contact et la sécurité de votre boutique NAY Parfums.',
};

export default async function SettingsPage() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  let config = await prisma.siteConfig.findFirst();

  if (!config) {
    config = await prisma.siteConfig.create({
      data: {
        adminUsername: 'admin',
        adminPassword: 'nouamane2024',
        shippingFee: 35,
        contactPhone: '+212 663-380011',
        contactEmail: 'contact@nayparfum.ma',
        heroTitle: "L'Essence de l'Élégance",
        heroSubtitle: "Découvrez notre collection de parfums de luxe, conçue pour laisser une empreinte inoubliable.",
        monthlyRevenueGoal: 150000,
        coffretsCoverImage: '/images/category/pack-decouverte-luxe.jpg',
        seasonalTrendTitle: 'Tendances Printemps-Été',
        seasonalTrendSubtitle: 'Nos fragrances fraîches, solaires et florales pour la belle saison.',
      },
    });
  }

  const serializedConfig = {
    ...config,
    updatedAt: config.updatedAt ? config.updatedAt.toISOString() : undefined,
  };

  return (
    <SettingsClient
      initialConfig={serializedConfig}
      adminUser={{
        name: admin.name,
        email: admin.email,
        role: admin.role,
      }}
    />
  );
}
