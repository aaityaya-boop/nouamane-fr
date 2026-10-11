import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAdminContactMessageAlert, sendCustomerContactReceipt } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Server-side validation
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: 'Le nom, l\'email et le message sont requis' },
        { status: 400 }
      );
    }

    const message = await prisma.contactMessage.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone ? body.phone.trim() : '',
        message: body.message.trim(),
      }
    });

    // 1. Send immediate alert email to managers and targeted employees
    try {
      await sendAdminContactMessageAlert({
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone ? body.phone.trim() : undefined,
        message: body.message.trim(),
      });
    } catch (alertErr) {
      console.error('Error sending contact alert to managers:', alertErr);
    }

    // 2. Send courtesy receipt to the customer
    try {
      await sendCustomerContactReceipt({
        name: body.name.trim(),
        email: body.email.trim(),
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
