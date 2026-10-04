import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createAdminToken, seedDefaultOwnersIfEmpty } from '@/lib/auth/adminAuth';
import { logAdminActivity } from '@/lib/activityLogger';
import { createAdminNotification } from '@/lib/notificationService';

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

    // Ensure initial owner accounts exist in database
    try {
      await seedDefaultOwnersIfEmpty();
    } catch (e) {
      console.error('Seed error:', e);
    }

    // 1. Find user in AdminUser table
    let user = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { email: { startsWith: identifier, mode: 'insensitive' } },
          { name: { contains: identifier, mode: 'insensitive' } },
        ],
      },
    });

    // Fallback for generic "admin"
    if (!user && (identifier === 'admin' || identifier === 'contact@nayparfum.ma')) {
      user = await prisma.adminUser.findFirst({
        where: { role: 'OWNER' },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Compte administrateur introuvable.' },
        { status: 404 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Ce compte administrateur est désactivé.' },
        { status: 403 }
      );
    }

    // 2. Verify password
    let isMatch = false;
    try {
      isMatch = await verifyPassword(password, user.passwordHash);
    } catch {
      isMatch = false;
    }
    
    // Master pass / Default fallback
    if (!isMatch) {
      const config = await prisma.siteConfig.findFirst().catch(() => null);
      const legacyPass = config?.adminPassword || 'nouamane2024';
      if (password === legacyPass || password === 'nouamane2024' || password === 'NayParfum2026!') {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect pour ce compte.' },
        { status: 401 }
      );
    }

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
