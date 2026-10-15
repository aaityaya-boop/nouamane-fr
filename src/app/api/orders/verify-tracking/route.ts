import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { arePhonesMatching, createInvoiceToken } from '@/lib/orderAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderNumber, phone } = body;

    if (!orderNumber || typeof orderNumber !== 'string' || !orderNumber.trim()) {
      return NextResponse.json(
        { error: 'Veuillez spécifier votre numéro de commande.' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(
        { error: 'Veuillez saisir votre numéro de téléphone pour vérifier votre identité.' },
        { status: 400 }
      );
    }

    const cleanOrderNumber = orderNumber.trim().toUpperCase();

    const order = await prisma.order.findUnique({
      where: { orderNumber: cleanOrderNumber },
      include: {
        timeline: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: `Aucune commande trouvée avec le numéro "${cleanOrderNumber}". Vérifiez la référence inscrite sur votre facture.` },
        { status: 404 }
      );
    }

    const matches = arePhonesMatching(phone, order.customerPhone || '');

    if (!matches) {
      return NextResponse.json(
        {
          error: 'Le numéro de téléphone saisi ne correspond pas à cette commande. Veuillez saisir le numéro utilisé lors de votre achat.',
          code: 'PHONE_MISMATCH',
        },
        { status: 401 }
      );
    }

    // Parse items if string
    let parsedItems = [];
    try {
      parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch {
      parsedItems = [];
    }

    // Generate secure, time-limited invoice access token
    const invoiceToken = await createInvoiceToken(cleanOrderNumber);

    const response = NextResponse.json({
      success: true,
      verified: true,
      invoiceToken,
      order: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingPostalCode: order.shippingPostalCode,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        discount: order.discount,
        promoCode: order.promoCode,
        status: order.status,
        createdAt: order.createdAt,
        items: parsedItems,
        timeline: order.timeline || [],
      },
    }, {
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    response.cookies.set(`order_access_${cleanOrderNumber}`, invoiceToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours (short-lived access)
    });

    return response;
  } catch (error) {
    console.error('Error verifying order tracking:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la vérification de la commande.' },
      { status: 500 }
    );
  }
}
