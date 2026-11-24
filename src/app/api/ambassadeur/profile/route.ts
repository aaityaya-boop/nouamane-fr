import { NextResponse } from 'next/server';
import { getCurrentAmbassador, hashPassword, verifyPassword } from '@/lib/affiliate-auth';
import prisma from '@/lib/prisma';
import { sanitizePublicUrl } from '@/lib/security/sanitize';

export async function PUT(request: Request) {
  try {
    const ambassador = await getCurrentAmbassador();
    if (!ambassador) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      code,
      phone,
      instagram,
      tiktok,
      avatar,
      bankName,
      bankAccountName,
      bankRib,
      cinNumber,
      currentPassword,
      newPassword,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name && typeof name === 'string' && name.trim().length > 0) {
      updateData.name = name.trim().slice(0, 100);
    }

    // Handle code / VIP link update
    if (code && typeof code === 'string' && code.trim().length > 0) {
      const cleanCode = code.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
      if (cleanCode.length >= 2 && cleanCode !== ambassador.code) {
        // Check if code is already taken by another affiliate
        const existing = await prisma.affiliate.findUnique({
          where: { code: cleanCode },
        });
        if (existing && existing.id !== ambassador.id) {
          return NextResponse.json(
            { error: `Le code VIP "/vip/${cleanCode}" est déjà réservé par un autre partenaire.` },
            { status: 400 }
          );
        }
        updateData.code = cleanCode;
      }
    }

    if (phone !== undefined) updateData.phone = typeof phone === 'string' && phone.trim() ? phone.trim().slice(0, 30) : null;
    if (instagram !== undefined) updateData.instagram = typeof instagram === 'string' && instagram.trim() ? instagram.trim().replace(/^@/, '').slice(0, 60) : null;
    if (tiktok !== undefined) updateData.tiktok = typeof tiktok === 'string' && tiktok.trim() ? tiktok.trim().replace(/^@/, '').slice(0, 60) : null;
    if (avatar !== undefined) {
      updateData.avatar = avatar ? sanitizePublicUrl(avatar, 500) : null;
    }

    if (bankName !== undefined) updateData.bankName = typeof bankName === 'string' && bankName.trim() ? bankName.trim().slice(0, 80) : null;
    if (bankAccountName !== undefined) updateData.bankAccountName = typeof bankAccountName === 'string' && bankAccountName.trim() ? bankAccountName.trim().slice(0, 100) : null;
    if (bankRib !== undefined) updateData.bankRib = typeof bankRib === 'string' && bankRib.trim() ? bankRib.trim().slice(0, 50) : null;
    if (cinNumber !== undefined) updateData.cinNumber = typeof cinNumber === 'string' && cinNumber.trim() ? cinNumber.trim().slice(0, 30) : null;

    if (newPassword && typeof newPassword === 'string' && newPassword.trim().length > 0) {
      const trimmedNew = newPassword.trim();
      if (trimmedNew.length < 8) {
        return NextResponse.json(
          { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' },
          { status: 400 }
        );
      }
      if (ambassador.passwordHash) {
        if (!currentPassword || typeof currentPassword !== 'string') {
          return NextResponse.json(
            { error: 'Votre mot de passe actuel est requis pour le modifier.' },
            { status: 400 }
          );
        }
        const ok = await verifyPassword(currentPassword, ambassador.passwordHash);
        if (!ok) {
          return NextResponse.json(
            { error: 'Mot de passe actuel incorrect.' },
            { status: 400 }
          );
        }
      }
      updateData.passwordHash = await hashPassword(trimmedNew);
    }

    const updated = await prisma.affiliate.update({
      where: { id: ambassador.id },
      data: updateData,
    });

    const { passwordHash, ...safeUpdated } = updated;

    return NextResponse.json({
      success: true,
      ambassador: safeUpdated,
      message: 'Vos informations et coordonnées ont été mises à jour avec succès !',
    });
  } catch (error: any) {
    console.error('Error updating ambassador profile:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
