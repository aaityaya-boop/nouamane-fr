import React from 'react';
import ReclamationsClient from './ReclamationsClient';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export default async function EmployeeReclamationsPage() {
  const admin = await getAuthenticatedAdmin();

  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      <ReclamationsClient currentAdmin={admin} />
    </div>
  );
}
