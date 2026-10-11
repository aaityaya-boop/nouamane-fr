import React from 'react';
import prisma from '@/lib/prisma';
import LandingPagesManagerClient from './LandingPagesManagerClient';

export const dynamic = 'force-dynamic';

export default async function LandingPagesList() {
  const pages = await prisma.landingPage.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return <LandingPagesManagerClient initialPages={pages} />;
}
