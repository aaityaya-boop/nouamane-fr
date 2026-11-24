import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAdminContactMessageAlert, sendCustomerContactReceipt } from '@/lib/email/emailService';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`contact_msg:${clientIp}`, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Trop de messages envoyés récemment. Veuillez patienter quelques minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Server-side validation
    if (!body.name || !body.email || !body.message || typeof body.name !== 'string' || typeof body.email !== 'string' || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Le nom, l\'email et le message sont requis' },
        { status: 400 }
      );
    }

    const cleanName = body.name.trim().slice(0, 120);
    const cleanEmail = body.email.trim().toLowerCase().slice(0, 150);
    const cleanPhone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : '';
    const cleanMessage = body.message.trim().slice(0, 3000);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
    }

    const message = await prisma.contactMessage.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        message: cleanMessage,
      }
    });

    // 1. Send immediate alert email to managers and targeted employees
    try {
      await sendAdminContactMessageAlert({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone || undefined,
        message: cleanMessage,
      });
    } catch (alertErr) {
      console.error('Error sending contact alert to managers:', alertErr);
    }

    // 2. Send courtesy receipt to the customer
    try {
      await sendCustomerContactReceipt({
        name: cleanName,
        email: cleanEmail,
      });
    } catch (custErr) {
      console.error('Error sending contact receipt to customer:', custErr);
    }

    return NextResponse.json({ success: true, id: message.id });
  } catch (error) {
    console.error('Error saving contact message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}
