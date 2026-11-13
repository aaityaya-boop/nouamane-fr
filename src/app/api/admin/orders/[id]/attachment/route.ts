import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';
import { recordTimelineEvent } from '@/lib/orders/timeline';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user: admin, errorResponse } = await requireAnyPermission(request, [
      'orders.manage_attachments',
      'orders.edit',
      'orders.prepare',
      'orders.confirm',
    ]);
    if (errorResponse || !admin) return errorResponse!;
    const body = await request.json();
    const { attachmentUrl, attachmentName, attachmentType, description, actorNameOverride } = body;

    if (!attachmentUrl) {
      return NextResponse.json({ error: 'URL de la pièce jointe requise' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const actorName = admin?.name || actorNameOverride || 'Nouamane Ait Yahya';
    const actorRole = admin ? (admin.jobTitle || (admin.role === 'OWNER' ? 'Propriétaire NAY' : admin.role)) : 'Propriétaire NAY';
    const actorId = admin?.id || null;
    const actorAvatar = admin?.avatar || null;

    const event = await prisma.orderTimelineEvent.create({
      data: {
        orderId: id,
        status: 'ATTACHMENT',
        title: `Pièce jointe ajoutée par ${actorName}`,
        description: description || `Document joint : ${attachmentName || 'Fichier'}`,
        actorId,
        actorName,
        actorRole,
        actorAvatar,
        attachmentUrl,
        attachmentName: attachmentName || 'Pièce jointe',
        attachmentType: attachmentType || 'IMAGE',
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error attaching file to order:', error);
    return NextResponse.json({ error: 'Échec de l\'ajout de la pièce jointe' }, { status: 500 });
  }
}
