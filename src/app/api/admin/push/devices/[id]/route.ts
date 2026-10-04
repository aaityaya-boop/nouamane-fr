import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Ensure the device belongs to the authenticated admin
    const existing = await prisma.adminPushSubscription.findFirst({
      where: { id, userId: admin.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Appareil introuvable ou non autorisé' },
        { status: 404 }
      );
    }

    await prisma.adminPushSubscription.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Appareil supprimé avec succès',
    });
  } catch (error: any) {
    console.error('[Delete Device API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la suppression de l\'appareil' },
      { status: 500 }
    );
  }
}
