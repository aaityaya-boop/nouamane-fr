import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createAmbassadorToken } from '@/lib/affiliate-auth';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

const DUMMY_BCRYPT_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8lR8W3W0z8J3x1z6yB9Q1Y1nK6kQ5e';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Veuillez saisir votre adresse e-mail et votre mot de passe.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const clientIp = getClientIp(request);
    const ipLimit = checkRateLimit(`amb_login_ip:${clientIp}`, 25, 15 * 60 * 1000);
    const acctLimit = checkRateLimit(`amb_login_acct:${clientIp}:${cleanEmail}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed || !acctLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.' },
        { status: 429 }
      );
    }

    const affiliate = await prisma.affiliate.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
    });

    if (!affiliate || !affiliate.passwordHash) {
      await verifyPassword(password, DUMMY_BCRYPT_HASH).catch(() => false);
      return NextResponse.json(
        { error: 'Identifiants incorrects.' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, affiliate.passwordHash);
    if (!isValid || affiliate.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Identifiants incorrects.' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session token
    const token = await createAmbassadorToken({
      id: affiliate.id,
      email: affiliate.email || '',
      code: affiliate.code,
      name: affiliate.name,
    });

    const response = NextResponse.json({
      success: true,
      ambassador: {
        id: affiliate.id,
        name: affiliate.name,
        code: affiliate.code,
        email: affiliate.email,
      },
    });

    response.cookies.set('ambassador_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Ambassador login error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
