import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPasswordResetCodeEmail } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Veuillez renseigner une adresse e-mail valide.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up customer (case-insensitive)
    const customer = await prisma.customer.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive',
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Aucun compte client n'a été trouvé avec cette adresse e-mail. Veuillez vérifier ou créer un compte." },
        { status: 404 }
      );
    }

    // Generate secure 6-digit numeric verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save code and expiry to customer record
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        resetCode: verificationCode,
        resetCodeExpires: expiresAt,
      },
    });

    // Send the verification code email
    const emailResult = await sendPasswordResetCodeEmail({
      to: customer.email,
      name: customer.name,
      code: verificationCode,
    });

    return NextResponse.json({
      success: true,
      message: `Un code de vérification à 6 chiffres a été envoyé à ${customer.email}.`,
      channel: emailResult.channel,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/forgot-password:', error);
    return NextResponse.json(
      { error: error?.message || "Une erreur est survenue lors de l'envoi du code. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
