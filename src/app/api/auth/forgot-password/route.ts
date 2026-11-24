import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetCodeEmail } from '@/lib/email/emailService';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

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
    const clientIp = getClientIp(request);
    const ipLimit = checkRateLimit(`forgot_ip:${clientIp}`, 10, 15 * 60 * 1000);
    const emailLimit = checkRateLimit(`forgot_email:${cleanEmail}`, 5, 15 * 60 * 1000);
    if (!ipLimit.allowed || !emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de demandes de réinitialisation. Veuillez réessayer dans quelques minutes.' },
        { status: 429 }
      );
    }

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
      // Prevent account enumeration: return identical generic response
      return NextResponse.json({
        success: true,
        message: 'Si un compte est associé à cette adresse e-mail, un code de vérification à 6 chiffres vient d’être envoyé.',
      });
    }

    // Generate cryptographically secure 6-digit numeric verification code
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
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
      message: 'Si un compte est associé à cette adresse e-mail, un code de vérification à 6 chiffres vient d’être envoyé.',
      channel: emailResult.channel,
    });
  } catch (error) {
    console.error('Error in /api/auth/forgot-password:', error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi du code. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
