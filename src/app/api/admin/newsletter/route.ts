import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNaydayWelcomeEmail } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [subscribers, orders] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.findMany({
        select: {
          customerEmail: true,
          customerName: true,
          customerPhone: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Aggregate orders by customer email (case-insensitive)
    const orderStatsByEmail = new Map<
      string,
      {
        ordersCount: number;
        totalSpent: number;
        customerName: string | null;
        customerPhone: string | null;
        lastOrderDate: Date | null;
        firstOrderDate: Date | null;
      }
    >();

    orders.forEach((o) => {
      if (!o.customerEmail) return;
      const emailKey = o.customerEmail.toLowerCase().trim();
      const current = orderStatsByEmail.get(emailKey) || {
        ordersCount: 0,
        totalSpent: 0,
        customerName: o.customerName || null,
        customerPhone: o.customerPhone || null,
        lastOrderDate: null,
        firstOrderDate: null,
      };

      current.ordersCount += 1;
      current.totalSpent += o.total || 0;
      if (!current.customerName && o.customerName) current.customerName = o.customerName;
      if (!current.customerPhone && o.customerPhone) current.customerPhone = o.customerPhone;

      const orderDate = new Date(o.createdAt);
      if (!current.firstOrderDate || orderDate < current.firstOrderDate) {
        current.firstOrderDate = orderDate;
      }
      if (!current.lastOrderDate || orderDate > current.lastOrderDate) {
        current.lastOrderDate = orderDate;
      }

      orderStatsByEmail.set(emailKey, current);
    });

    // Enrich subscribers
    const enriched = subscribers.map((sub) => {
      const emailKey = sub.email.toLowerCase().trim();
      const stats = orderStatsByEmail.get(emailKey);

      const domain = sub.email.includes('@') ? sub.email.split('@')[1].toLowerCase() : '';

      return {
        id: sub.id,
        email: sub.email,
        createdAt: sub.createdAt,
        domain,
        isCustomer: !!(stats && stats.ordersCount > 0),
        ordersCount: stats ? stats.ordersCount : 0,
        totalSpent: stats ? stats.totalSpent : 0,
        customerName: stats ? stats.customerName : null,
        customerPhone: stats ? stats.customerPhone : null,
        lastOrderDate: stats ? stats.lastOrderDate : null,
        welcomeEmailSent: sub.welcomeEmailSent,
        welcomeEmailSentAt: sub.welcomeEmailSentAt,
        welcomeEmailStatus: sub.welcomeEmailStatus,
        welcomeEmailError: sub.welcomeEmailError,
      };
    });

    return NextResponse.json({
      success: true,
      subscribers: enriched,
      totalCount: subscribers.length,
      customerCount: enriched.filter((s) => s.isCustomer).length,
      leadCount: enriched.filter((s) => !s.isCustomer).length,
      totalRevenueFromSubscribers: enriched.reduce((sum, s) => sum + s.totalSpent, 0),
      welcomeEmailsSentCount: enriched.filter((s) => s.welcomeEmailSent).length,
    });
  } catch (error) {
    console.error('Error fetching admin newsletter subscribers:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, emails, sendWelcomeEmail } = body;

    // Action 1: Send NAYDAY welcome email to single subscriber
    if (action === 'send_welcome' || (action === 'send' && email)) {
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
      }
      const result = await sendNaydayWelcomeEmail(email);
      return NextResponse.json({ success: result.success, result });
    }

    // Action 2: Batch send NAYDAY welcome email to multiple subscribers
    if (action === 'send_batch' && Array.isArray(emails) && emails.length > 0) {
      let sentCount = 0;
      const errors: string[] = [];

      for (const targetEmail of emails) {
        if (targetEmail && targetEmail.includes('@')) {
          try {
            const res = await sendNaydayWelcomeEmail(targetEmail);
            if (res.success) sentCount++;
          } catch (err: any) {
            errors.push(`${targetEmail}: ${err?.message || 'Erreur'}`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        sentCount,
        totalRequested: emails.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Default Action: Add new subscriber manually
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'Cette adresse email est déjà inscrite' }, { status: 400 });
    }

    const newSub = await prisma.newsletterSubscriber.create({
      data: { email: cleanEmail },
    });

    // Automatically send welcome email if requested or default true
    let emailResult = null;
    if (sendWelcomeEmail !== false) {
      try {
        emailResult = await sendNaydayWelcomeEmail(cleanEmail);
      } catch (emailErr) {
        console.error('Error sending welcome email on manual add:', emailErr);
      }
    }

    return NextResponse.json({ success: true, subscriber: newSub, emailResult });
  } catch (error) {
    console.error('Error in admin newsletter POST handler:', error);
    return NextResponse.json({ error: 'Erreur lors du traitement de la requête' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id && !email) {
      return NextResponse.json({ error: 'ID ou email requis' }, { status: 400 });
    }

    if (id) {
      await prisma.newsletterSubscriber.delete({
        where: { id: parseInt(id, 10) },
      });
    } else if (email) {
      await prisma.newsletterSubscriber.delete({
        where: { email: email.trim().toLowerCase() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
