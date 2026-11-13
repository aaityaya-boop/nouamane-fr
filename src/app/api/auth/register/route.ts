import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nouamane_super_secret_key_2024'
);

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    // Check if user exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    });

    if (existingCustomer) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cette adresse email' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

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

    const response = NextResponse.json({ 
      success: true, 
      customer: { id: customer.id, name: customer.name, email: customer.email, wishlist: [] }
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
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de la création du compte' }, { status: 500 });
  }
}
