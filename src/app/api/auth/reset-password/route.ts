import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signCustomerToken } from '@/lib/security/jwt';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email, code de vérification et nouveau mot de passe requis.' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();
    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`reset_otp:${clientIp}:${cleanEmail}`, 8, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' },
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
    });

    if (!customer || !customer.resetCode || customer.resetCode !== cleanCode) {
      return NextResponse.json(
        { error: 'Code de vérification incorrect ou expiré.' },
        { status: 400 }
      );
    }

    if (!customer.resetCodeExpires || new Date() > new Date(customer.resetCodeExpires)) {
      return NextResponse.json(
        { error: 'Ce code a expiré. Veuillez refaire une demande de réinitialisation.' },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update customer password and clear reset code
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    // Generate JWT auth token to automatically log the customer in
    const token = await signCustomerToken({
      id: updatedCustomer.id,
      email: updatedCustomer.email,
      name: updatedCustomer.name,
      role: 'customer',
    });

    let wishlist = [];
    try {
      if (updatedCustomer.wishlist) {
        wishlist = JSON.parse(updatedCustomer.wishlist);
      }
    } catch {}

    const response = NextResponse.json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès !',
      customer: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        wishlist,
      },
    });

    // Set auth cookie
    response.cookies.set({
      name: 'customer_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Error in /api/auth/reset-password:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la réinitialisation du mot de passe.' },
      { status: 500 }
    );
  }
}
