import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { sendNaydayWelcomeEmail } from '@/lib/email/emailService';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà inscrit' }, { status: 400 });
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: { email: cleanEmail },
    });

    // Send NAYDAY promotional welcome email automatically
    try {
      await sendNaydayWelcomeEmail(cleanEmail);
    } catch (emailErr) {
      console.error('Error sending welcome email to subscriber:', emailErr);
    }

    // Track Affiliate Lead if referral cookie is present
    try {
      const cookieStore = await cookies();
      const affiliateRef = cookieStore.get('affiliate_ref')?.value;

      if (affiliateRef) {
        const affiliate = await prisma.affiliate.findUnique({
          where: { code: affiliateRef.toLowerCase().trim() },
        });

        if (affiliate && affiliate.status === 'ACTIVE') {
          const leadCommission = affiliate.payPerLead > 0 ? affiliate.payPerLead : 0;

          await prisma.$transaction([
            prisma.affiliateLead.create({
              data: {
                affiliateId: affiliate.id,
                type: 'NEWSLETTER',
                email: cleanEmail,
                commissionEarned: leadCommission,
              },
            }),
            prisma.affiliate.update({
              where: { id: affiliate.id },
              data: {
                leads: { increment: 1 },
                ...(leadCommission > 0 ? { commissionEarned: { increment: leadCommission } } : {}),
              },
            }),
          ]);
        }
      }
    } catch (leadErr) {
      console.error('Error tracking affiliate lead for newsletter:', leadErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
