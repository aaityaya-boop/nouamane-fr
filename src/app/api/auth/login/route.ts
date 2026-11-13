import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nouamane_super_secret_key_2024'
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    
    if (!isMatch) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    // Generate JWT
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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de la connexion' }, { status: 500 });
  }
}
