import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';
import { verifyCustomerToken } from '@/lib/security/jwt';

const ALLOWED_CART_STATUS = new Set(['ACTIVE', 'ABANDONED', 'COMPLETED']);

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`cart_sync:${clientIp}`, 45, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
    }

    const body = await request.json();
    const {
      sessionId,
      items,
      totalValue,
      customerName,
      customerPhone,
      customerEmail,
      customerCity,
      status
    } = body;

    if (!sessionId || typeof sessionId !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(sessionId.trim())) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const cleanSessionId = sessionId.trim();
    const safeStatus = typeof status === 'string' && ALLOWED_CART_STATUS.has(status) ? status : 'ACTIVE';

    // Never trust unauthenticated body.customerId — resolve solely from verified customer_token cookie
    let verifiedCustomerId: string | undefined;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('customer_token')?.value;
      if (token) {
        const payload = await verifyCustomerToken(token);
        if (payload?.id) verifiedCustomerId = payload.id;
      }
    } catch {}

    const contactData = {
      ...(customerName && typeof customerName === 'string' ? { customerName: customerName.trim().slice(0, 120) } : {}),
      ...(customerPhone && typeof customerPhone === 'string' ? { customerPhone: customerPhone.trim().slice(0, 40) } : {}),
      ...(customerEmail && typeof customerEmail === 'string' ? { customerEmail: customerEmail.trim().toLowerCase().slice(0, 150) } : {}),
      ...(customerCity && typeof customerCity === 'string' ? { customerCity: customerCity.trim().slice(0, 80) } : {}),
      status: safeStatus,
      ...(verifiedCustomerId ? { customerId: verifiedCustomerId } : {}),
    };

    if (!Array.isArray(items) || items.length === 0) {
      await prisma.liveCartSession.upsert({
        where: { sessionId: cleanSessionId },
        update: {
          items: '[]',
          totalValue: 0,
          lastActivity: new Date(),
          ...contactData
        },
        create: {
          sessionId: cleanSessionId,
          items: '[]',
          totalValue: 0,
          ...contactData
        }
      });
      return NextResponse.json({ success: true });
    }

    const boundedItems = items.slice(0, 50);
    const itemsJson = JSON.stringify(boundedItems);
    const safeTotal = Number.isFinite(Number(totalValue)) && Number(totalValue) >= 0 ? Number(totalValue) : 0;

    await prisma.liveCartSession.upsert({
      where: { sessionId: cleanSessionId },
      update: {
        items: itemsJson,
        totalValue: safeTotal,
        lastActivity: new Date(),
        ...contactData
      },
      create: {
        sessionId: cleanSessionId,
        items: itemsJson,
        totalValue: safeTotal,
        ...contactData
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing cart:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
