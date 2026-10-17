import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const RESEND_AUDIENCE_ID = '69d22517-8e97-4d6f-a423-72f90e106bde';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé Resend manquante' }, { status: 500 });
    }

    const [subscribers, orders] = await Promise.all([
      prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.order.findMany({ select: { customerEmail: true, customerName: true } }),
    ]);

    const nameMap = new Map<string, string>();
    orders.forEach((o) => {
      if (o.customerEmail && o.customerName) {
        nameMap.set(o.customerEmail.toLowerCase().trim(), o.customerName.trim());
      }
    });

    let synced = 0;
    for (const sub of subscribers) {
      const email = sub.email.toLowerCase().trim();
      const fullName = nameMap.get(email) || '';
      const parts = fullName.split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      try {
        await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            unsubscribed: false,
          }),
        });
        synced++;
      } catch (e) {
        console.warn(`Sync warning for ${email}:`, e);
      }
      await delay(100);
    }

    return NextResponse.json({
      success: true,
      synced,
      total: subscribers.length,
      audienceId: RESEND_AUDIENCE_ID,
    });
  } catch (error: any) {
    console.error('Error in sync-resend route:', error);
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 });
  }
}
