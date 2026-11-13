import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createAdminToken, seedDefaultOwnersIfEmpty } from '@/lib/auth/adminAuth';
import { logAdminActivity } from '@/lib/activityLogger';
import { createAdminNotification } from '@/lib/notificationService';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 8;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const REJECTED_FALLBACK_PASSWORDS = new Set(['nouamane2024', 'NayParfum2026!']);

function getRateLimitKey(request: Request, identifier: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `${forwarded}:${identifier}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const identifier = (body.email || body.username || body.identifier || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const rememberMe = Boolean(body.rememberMe ?? true);

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Veuillez saisir votre identifiant et votre mot de passe.' },
        { status: 400 }
      );
    }

    const rateKey = getRateLimitKey(request, identifier);
    const nowMs = Date.now();
    const attemptEntry = loginAttempts.get(rateKey);
    if (attemptEntry && attemptEntry.resetAt > nowMs && attemptEntry.count >= MAX_FAILED_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.' },
        { status: 429 }
      );
    }

    // Explicitly reject retired hardcoded fallback passwords
    if (REJECTED_FALLBACK_PASSWORDS.has(password)) {
      const prev = loginAttempts.get(rateKey);
      loginAttempts.set(rateKey, {
        count: prev && prev.resetAt > nowMs ? prev.count + 1 : 1,
        resetAt: nowMs + LOGIN_WINDOW_MS,
      });
      return NextResponse.json(
        { error: 'Identifiant ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    // Ensure initial owner accounts exist only in non-production environments if empty
    if (process.env.NODE_ENV !== 'production') {
      try {
        await seedDefaultOwnersIfEmpty();
      } catch (e) {
        console.error('Seed error:', e);
      }
    }

    // 1. Find user in AdminUser table by exact case-insensitive email match
    const user = await prisma.adminUser.findFirst({
      where: {
        email: { equals: identifier, mode: 'insensitive' },
      },
    });

    if (!user) {
      const prev = loginAttempts.get(rateKey);
      loginAttempts.set(rateKey, {
        count: prev && prev.resetAt > nowMs ? prev.count + 1 : 1,
        resetAt: nowMs + LOGIN_WINDOW_MS,
      });
      return NextResponse.json(
        { error: 'Identifiant ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Ce compte administrateur est désactivé.' },
        { status: 403 }
      );
    }

    // 2. Strictly verify password against bcrypt hash (no hardcoded/legacy fallbacks)
    let isMatch = false;
    try {
      if (user.passwordHash) {
        isMatch = await verifyPassword(password, user.passwordHash);
      }
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      const prev = loginAttempts.get(rateKey);
      loginAttempts.set(rateKey, {
        count: prev && prev.resetAt > nowMs ? prev.count + 1 : 1,
        resetAt: nowMs + LOGIN_WINDOW_MS,
      });
      return NextResponse.json(
        { error: 'Mot de passe incorrect pour ce compte.' },
        { status: 401 }
      );
    }

    loginAttempts.delete(rateKey);

    // 3. Update timestamps
    const now = new Date();
    try {
      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          lastLoginAt: now,
          lastActivityAt: now,
        },
      });
    } catch (e) {
      console.warn('Could not update user timestamps:', e);
    }

    // 4. Create signed JWT
    const token = await createAdminToken(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      rememberMe
    );

    // 5. Activity log (non-blocking)
    try {
      logAdminActivity({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        description: `${user.name} s'est connecté à son compte administrateur personnel.`,
      }).catch(() => {});
    } catch {}

    // 5b. Security alert for new login
    try {
      createAdminNotification({
        userId: user.id,
        type: 'SECURITY',
        title: 'Nouvelle connexion 🛡️',
        message: `Connexion réussie à votre espace administrateur (${user.name})`,
        link: '/admin',
        metadata: { userId: user.id, email: user.email },
      }).catch(() => {});
    } catch {}

    // 6. Return response with Cookie
    const maxAgeSeconds = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 1;

    const response = NextResponse.json({
      success: true,
      message: `Bienvenue ${user.name} !`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLoginAt: now,
      },
    });

    response.cookies.set({
      name: 'admin_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    });

    response.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la connexion.' },
      { status: 500 }
    );
  }
}
