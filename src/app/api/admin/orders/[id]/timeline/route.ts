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
      'orders.edit',
      'orders.change_status',
      'orders.confirm',
      'orders.prepare',
    ]);
    if (errorResponse || !admin) return errorResponse!;
    const body = await request.json();
    const { status, title, description, carrier, trackingNumber, metadata, actorNameOverride } = body;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const actorName = admin?.name || actorNameOverride || 'Équipe NAY';
    const actorRole = admin?.jobTitle || admin?.role || 'STAFF';
    const actorId = admin?.id || null;
    const actorAvatar = admin?.avatar || null;

    const event = await recordTimelineEvent({
      orderId: id,
      status: status || 'NOTE',
      title: title || 'Note ajoutée',
      description: description || null,
      actorId,
      actorName,
      actorRole,
      actorAvatar,
      carrier,
      trackingNumber,
      metadata,
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error adding timeline event:', error);
    return NextResponse.json({ error: 'Failed to add timeline event' }, { status: 500 });
  }
}
