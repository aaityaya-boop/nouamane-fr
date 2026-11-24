import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signCustomerToken } from '@/lib/security/jwt';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`google_auth:${clientIp}`, 20, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives. Veuillez réessayer plus tard.' }, { status: 429 });
    }

    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    // 1. Verify the Firebase ID token using Google Identity Toolkit REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Configuration Firebase manquante (API KEY)' }, { status: 500 });
    }

    const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.users || verifyData.users.length === 0) {
      console.error('Firebase token verification failed:', verifyData);
      return NextResponse.json({ error: 'Token Google invalide ou expiré' }, { status: 401 });
    }

    const decodedToken = verifyData.users[0];
    const email = typeof decodedToken.email === 'string' ? decodedToken.email.trim().toLowerCase() : '';
    const name = typeof decodedToken.displayName === 'string' ? decodedToken.displayName.trim() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email non fourni par Google' }, { status: 400 });
    }

    // 2. Find or Create the user in our Prisma database (case-insensitive)
    let customer = await prisma.customer.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });

    if (!customer) {
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      customer = await prisma.customer.create({
        data: {
          email,
          password: hashedPassword,
          name: name || 'Utilisateur Google',
        }
      });
    }

    // 3. Issue our standard internal JWT so the rest of the app works flawlessly
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
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    return NextResponse.json({ error: `Erreur interne: ${error.message}` }, { status: 500 });
  }
}
