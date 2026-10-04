import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { endpoint, subscriptionId } = body;

    if (!endpoint && !subscriptionId) {
      return NextResponse.json(
        { error: 'Endpoint ou subscriptionId requis pour la désactivation' },
        { status: 400 }
      );
    }

    if (endpoint) {
      await prisma.adminPushSubscription.updateMany({
        where: {
          endpoint,
          userId: admin.id,
        },
        data: { isActive: false },
      });
    } else if (subscriptionId) {
      await prisma.adminPushSubscription.updateMany({
        where: {
          id: subscriptionId,
          userId: admin.id,
        },
        data: { isActive: false },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Appareil désabonné des notifications avec succès',
    });
  } catch (error: any) {
    console.error('[Push Unsubscribe API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la désactivation' },
      { status: 500 }
    );
  }
}
