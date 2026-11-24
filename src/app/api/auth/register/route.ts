import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signCustomerToken } from '@/lib/security/jwt';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`cust_register:${clientIp}`, 10, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Trop de créations de compte depuis cette connexion. Veuillez réessayer plus tard.' },
        { status: 429 }
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Nom ou adresse email invalide' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères.' },
        { status: 400 }
      );
    }

    // Check if user exists (case-insensitive)
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      select: { id: true },
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
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
      }
    });

    // Generate JWT
    const token = await signCustomerToken({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      role: 'customer',
    });

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
