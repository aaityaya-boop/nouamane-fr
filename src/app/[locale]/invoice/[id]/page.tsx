import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { verifyInvoiceToken } from '@/lib/orderAuth';
import InvoiceClient from './InvoiceClient';

export const metadata: Metadata = {
  title: 'Facture | NAY Parfums',
  referrer: 'no-referrer',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

interface InvoicePageProps {
  params: Promise<{ id: string; locale?: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InvoicePage({
  params,
  searchParams,
}: InvoicePageProps) {
  const { id, locale = 'fr' } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const queryToken = typeof resolvedSearchParams.token === 'string' ? resolvedSearchParams.token : undefined;

  const cleanOrderNumber = id.trim().toUpperCase();

  const order = await prisma.order.findUnique({
    where: { orderNumber: cleanOrderNumber },
  });

  if (!order) {
    notFound();
  }

  // 🔒 Authorization Verification:
  // 1. Authenticated administrator (verified server-side admin session)
  let isAuthorized = false;
  const admin = await getAuthenticatedAdmin();
  if (admin) {
    isAuthorized = true;
  }

  // 2. Cryptographically signed, order-specific access token (?token=...)
  if (!isAuthorized && queryToken) {
    const isTokenValid = await verifyInvoiceToken(queryToken, cleanOrderNumber);
    if (isTokenValid) {
      isAuthorized = true;
    }
  }

  // 3. Secure HttpOnly cookie issued only after checkout or phone verification
  if (!isAuthorized) {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(`order_access_${cleanOrderNumber}`)?.value;
    if (cookieToken) {
      const isCookieTokenValid = await verifyInvoiceToken(cookieToken, cleanOrderNumber);
      if (isCookieTokenValid) {
        isAuthorized = true;
      }
    }
  }

  // 🛡️ Unauthorized: phone-only bypass is strictly prohibited.
  // Redirect to tracking verification page without leaking ANY personal order information.
  if (!isAuthorized) {
    redirect(`/${locale}/suivi-commande?order=${cleanOrderNumber}&auth=required`);
  }

  return <InvoiceClient order={order} />;
}
