import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';
import { safeJsonParse } from '@/lib/sav/savService';

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
    const { name, url, type = 'IMAGE', size } = body;

    if (!url || !name) {
      return NextResponse.json({ error: 'Fichier ou URL manquant.' }, { status: 400 });
    }

    const claim = await prisma.claimTicket.findUnique({ where: { id } });
    if (!claim) {
      return NextResponse.json({ error: 'Dossier SAV introuvable.' }, { status: 404 });
    }

    const currentAttachments = safeJsonParse<any[]>(claim.attachments, []);
    const newAttachment = {
      id: Date.now().toString(),
      name: name.trim(),
      url,
      type,
      size: size || null,
      uploadedAt: new Date().toISOString(),
      uploadedByName: admin.name,
      uploadedById: admin.id,
    };

    currentAttachments.push(newAttachment);

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.claimTicket.update({
        where: { id },
        data: {
          attachments: JSON.stringify(currentAttachments),
          updatedAt: new Date(),
        },
      });

      await tx.claimEvent.create({
        data: {
          claimId: id,
          actorId: admin.id,
          actorName: admin.name,
          actorRole: admin.role,
          type: 'ATTACHMENT_ADDED',
          title: `Pièce jointe ajoutée : ${newAttachment.name}`,
          description: `Téléversée par ${admin.name}.`,
          metadata: JSON.stringify(newAttachment),
        },
      });

      return c;
    });

    return NextResponse.json({ success: true, attachments: currentAttachments, claim: updated });
  } catch (error: any) {
    console.error('Error adding attachment to SAV claim:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'ajout de la pièce jointe.' }, { status: 500 });
  }
}
