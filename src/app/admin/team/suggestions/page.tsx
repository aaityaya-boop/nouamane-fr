import React from 'react';
import SuggestionsClient from './SuggestionsClient';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export default async function EmployeeSuggestionsPage() {
  const admin = await getAuthenticatedAdmin();

  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      <SuggestionsClient currentAdmin={admin} />
    </div>
  );
}
