import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { error: 'Payload de souscription invalide (endpoint et clés VAPID requis)' },
        { status: 400 }
      );
    }

    const { endpoint, keys, userAgent, deviceName } = body;

    // Generate readable device name if not provided
    let inferredDeviceName = deviceName;
    if (!inferredDeviceName && userAgent) {
      if (/iPhone|iPad|iPod/i.test(userAgent)) inferredDeviceName = 'iPhone / iPad (Apple PWA)';
      else if (/Android/i.test(userAgent)) inferredDeviceName = 'Android (Mobile PWA)';
      else if (/Macintosh|Mac OS/i.test(userAgent)) inferredDeviceName = 'Mac (Desktop)';
      else if (/Windows/i.test(userAgent)) inferredDeviceName = 'Windows PC (Desktop)';
      else if (/Linux/i.test(userAgent)) inferredDeviceName = 'Linux (Desktop)';
      else inferredDeviceName = 'Appareil Web';
    }

    // Upsert subscription: if endpoint exists, associate with current user and re-activate
    const subscription = await prisma.adminPushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: admin.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
        deviceName: inferredDeviceName || 'Appareil Admin',
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        userId: admin.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
        deviceName: inferredDeviceName || 'Appareil Admin',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appareil abonné aux notifications push avec succès',
      device: {
        id: subscription.id,
        deviceName: subscription.deviceName,
        isActive: subscription.isActive,
      },
    });
  } catch (error: any) {
    console.error('[Push Subscribe API] Error saving subscription:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur interne lors de la souscription' },
      { status: 500 }
    );
  }
}
