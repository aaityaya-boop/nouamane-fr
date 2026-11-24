import React from 'react';
import prisma from '@/lib/prisma';
import CampaignsClient from './CampaignsClient';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const [campaigns, totalCustomers] = await Promise.all([
    prisma.marketingCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count(),
  ]);

  return (
    <CampaignsClient
      initialCampaigns={campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        channel: c.channel,
        type: c.type,
        audience: c.audience,
        subject: c.subject,
        message: c.message,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      }))}
      totalCustomers={totalCustomers}
    />
  );
}
