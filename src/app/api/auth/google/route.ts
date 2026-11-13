import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nouamane_super_secret_key_2024'
);

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
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
    const email = decodedToken.email;
    const name = decodedToken.displayName;
    const uid = decodedToken.localId;
    
    if (!email) {
      return NextResponse.json({ error: 'Email non fourni par Google' }, { status: 400 });
    }


    // 2. Find or Create the user in our Prisma database
    let customer = await prisma.customer.findUnique({
      where: { email }
    });

    if (!customer) {
      // Create user if they don't exist
      // Generate a random secure password since they use Google
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
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
    const token = await new SignJWT({ 
      tokenType: 'CUSTOMER_SESSION',
      id: customer.id, 
      email: customer.email, 
      name: customer.name,
      role: 'customer' 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

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
