import { Metadata } from 'next';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const metadata: Metadata = {
  title: 'Analytics & Performance | NAY Parfum Admin',
  description: 'Tableau de bord analytique complet de NAY Parfum : ventes de parfums, clients, trafic web et logistique.',
};

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return <AnalyticsDashboardClient />;
}
