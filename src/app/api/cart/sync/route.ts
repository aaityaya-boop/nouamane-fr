import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sessionId,
      items,
      totalValue,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerCity,
      status
    } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const contactData = {
      ...(customerName ? { customerName: String(customerName).trim() } : {}),
      ...(customerPhone ? { customerPhone: String(customerPhone).trim() } : {}),
      ...(customerEmail ? { customerEmail: String(customerEmail).trim().toLowerCase() } : {}),
      ...(customerCity ? { customerCity: String(customerCity).trim() } : {}),
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {})
    };

    if (!Array.isArray(items) || items.length === 0) {
      // If cart is cleared or empty
      await prisma.liveCartSession.upsert({
        where: { sessionId },
        update: {
          items: '[]',
          totalValue: 0,
          lastActivity: new Date(),
          status: status || 'ACTIVE',
          ...contactData
        },
        create: {
          sessionId,
          items: '[]',
          totalValue: 0,
          status: status || 'ACTIVE',
          ...contactData
        }
      });
      return NextResponse.json({ success: true });
    }

    const itemsJson = JSON.stringify(items);

    await prisma.liveCartSession.upsert({
      where: { sessionId },
      update: {
        items: itemsJson,
        totalValue: Number(totalValue) || 0,
        lastActivity: new Date(),
        status: status || 'ACTIVE',
        ...contactData
      },
      create: {
        sessionId,
        items: itemsJson,
        totalValue: Number(totalValue) || 0,
        status: status || 'ACTIVE',
        ...contactData
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing cart:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
