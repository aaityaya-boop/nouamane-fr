import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email et code de vérification requis.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();
    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`verify_otp:${clientIp}:${cleanEmail}`, 8, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer plus tard ou demander un nouveau code.' },
        { status: 429 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        resetCode: true,
        resetCodeExpires: true,
      },
    });

    if (!customer || !customer.resetCode || customer.resetCode !== cleanCode) {
      return NextResponse.json(
        { error: 'Code de vérification incorrect ou expiré.' },
        { status: 400 }
      );
    }

    if (!customer.resetCodeExpires || new Date() > new Date(customer.resetCodeExpires)) {
      return NextResponse.json(
        { error: 'Ce code de vérification a expiré (validité 15 min). Veuillez en demander un nouveau.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Code validé avec succès.',
    });
  } catch (error) {
    console.error('Error in /api/auth/verify-code:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du code.' },
      { status: 500 }
    );
  }
}
