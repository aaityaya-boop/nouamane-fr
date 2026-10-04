import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const devices = await prisma.adminPushSubscription.findMany({
      where: {
        userId: admin.id,
      },
      select: {
        id: true,
        deviceName: true,
        userAgent: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        endpoint: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Mask endpoints for security
    const maskedDevices = devices.map((d) => ({
      id: d.id,
      deviceName: d.deviceName || 'Appareil Admin',
      userAgent: d.userAgent,
      isActive: d.isActive,
      createdAt: d.createdAt,
      lastUsedAt: d.lastUsedAt,
      endpointPreview: d.endpoint.slice(0, 35) + '...',
    }));

    return NextResponse.json({
      success: true,
      devices: maskedDevices,
    });
  } catch (error: any) {
    console.error('[Push Devices API] Error fetching devices:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la récupération des appareils' },
      { status: 500 }
    );
  }
}
