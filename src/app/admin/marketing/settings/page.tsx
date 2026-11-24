import React from 'react';
import prisma from '@/lib/prisma';
import MarketingSettingsClient from './MarketingSettingsClient';

export const dynamic = 'force-dynamic';

export default async function MarketingSettingsPage() {
  const row = await prisma.marketingSettings.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  return (
    <MarketingSettingsClient
      initialSettings={{
        whatsappConfigured: row?.whatsappConfigured ?? true,
        emailConfigured: row?.emailConfigured ?? true,
        automationEnabled: row?.automationEnabled ?? true,
      }}
    />
  );
}
