import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signCustomerToken } from '@/lib/security/jwt';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

const DUMMY_BCRYPT_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8lR8W3W0z8J3x1z6yB9Q1Y1nK6kQ5e';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const clientIp = getClientIp(request);
    const ipLimit = checkRateLimit(`cust_login_ip:${clientIp}`, 30, 15 * 60 * 1000);
    const acctLimit = checkRateLimit(`cust_login_acct:${clientIp}:${cleanEmail}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed || !acctLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.' },
        { status: 429 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
      },
    });

    if (!customer) {
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH).catch(() => false);
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, customer.password);

    if (!isMatch) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    const token = await signCustomerToken({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      role: 'customer',
    });

    let wishlist = [];
    try {
      if (customer.wishlist) {
        wishlist = JSON.parse(customer.wishlist);
      }
    } catch (e) {}

    const response = NextResponse.json({ 
      success: true, 
      customer: { id: customer.id, name: customer.name, email: customer.email, wishlist }
    });
    
    // Set cookie
    response.cookies.set({
      name: 'customer_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de la connexion' }, { status: 500 });
  }
}
