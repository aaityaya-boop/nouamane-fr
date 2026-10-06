import { Metadata } from 'next';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const metadata: Metadata = {
  title: 'Audience & Trafic | NAY Parfum Admin',
  description: 'Plateforme d\'intelligence d\'audience, acquisition multicanale et suivi en direct de NAY Parfum.',
};

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return <AnalyticsDashboardClient />;
}
