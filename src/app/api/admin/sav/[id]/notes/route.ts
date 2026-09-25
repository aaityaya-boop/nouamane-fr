import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'orders.edit')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Le contenu de la note ne peut pas être vide.' }, { status: 400 });
    }

    const claim = await prisma.claimTicket.findUnique({ where: { id } });
    if (!claim) {
      return NextResponse.json({ error: 'Dossier SAV introuvable.' }, { status: 404 });
    }

    const newNote = await prisma.$transaction(async (tx) => {
      const note = await tx.claimInternalNote.create({
        data: {
          claimId: id,
          authorId: admin.id,
          authorName: admin.name,
          authorAvatar: admin.avatar || null,
          content: content.trim(),
        },
      });

      await tx.claimEvent.create({
        data: {
          claimId: id,
          actorId: admin.id,
          actorName: admin.name,
          actorRole: admin.role,
          type: 'NOTE_ADDED',
          title: 'Note interne ajoutée',
          description: content.trim().length > 120 ? content.trim().substring(0, 120) + '...' : content.trim(),
        },
      });

      return note;
    });

    return NextResponse.json({ success: true, note: newNote });
  } catch (error: any) {
    console.error('Error adding internal note:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'ajout de la note.' }, { status: 500 });
  }
}
