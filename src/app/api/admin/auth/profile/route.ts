import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin, verifyPassword, hashPassword, createAdminToken } from '@/lib/auth/adminAuth';
import prisma from '@/lib/prisma';
import { logAdminActivity } from '@/lib/activityLogger';
import { sanitizePublicUrl } from '@/lib/security/sanitize';

// Update Profile Details (Name, Email, Avatar)
export async function PATCH(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const name = body.name ? String(body.name).trim().slice(0, 120) : admin.name;
    const avatar =
      body.avatar !== undefined
        ? body.avatar
          ? sanitizePublicUrl(body.avatar, 500)
          : null
        : admin.avatar;
    const email = body.email ? String(body.email).trim().toLowerCase() : admin.email;

    if (!name) {
      return NextResponse.json({ error: 'Le nom est obligatoire.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Format email invalide.' }, { status: 400 });
    }

    // If email is changing, check uniqueness (case-insensitive)
    if (email !== admin.email.toLowerCase()) {
      const existing = await prisma.adminUser.findFirst({
        where: { email: { equals: email, mode: 'insensitive' }, id: { not: admin.id } },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé par un autre compte.' }, { status: 400 });
      }
    }

    const updated = await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        name,
        email,
        avatar,
        lastActivityAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        lastLoginAt: true,
        lastActivityAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAdminActivity({
      userId: admin.id,
      userName: updated.name,
      userEmail: updated.email,
      action: 'UPDATE_PROFILE',
      entityType: 'USER',
      entityId: admin.id,
      description: `${admin.name} a mis à jour ses informations de profil.`,
      oldValue: { name: admin.name, email: admin.email, avatar: admin.avatar },
      newValue: { name: updated.name, email: updated.email, avatar: updated.avatar },
      req: request,
    });

    // Refresh token with new name/avatar
    const newToken = await createAdminToken({
      userId: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      avatar: updated.avatar,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès.',
      user: updated,
    });

    response.cookies.set({
      name: 'admin_token',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du profil.' }, { status: 500 });
  }
}

// Change Password
export async function PUT(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Tous les champs de mot de passe sont obligatoires.' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' }, { status: 400 });
    }

    // Get current hash
    const fullUser = await prisma.adminUser.findUnique({
      where: { id: admin.id },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    const isCurrentValid = await verifyPassword(currentPassword, fullUser.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Le mot de passe actuel est incorrect.' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash: newHash,
        lastActivityAt: new Date(),
      },
    });

    await logAdminActivity({
      userId: admin.id,
      userName: admin.name,
      userEmail: admin.email,
      action: 'CHANGE_PASSWORD',
      entityType: 'AUTH',
      entityId: admin.id,
      description: `${admin.name} a changé son mot de passe avec succès.`,
      req: request,
    });

    return NextResponse.json({
      success: true,
      message: 'Votre mot de passe a été modifié avec succès.',
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    return NextResponse.json({ error: 'Erreur lors du changement de mot de passe.' }, { status: 500 });
  }
}
