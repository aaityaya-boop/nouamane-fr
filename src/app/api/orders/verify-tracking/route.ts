import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Normalizes phone numbers (handles Moroccan format variations: +212, 00212, 06, spaces, dashes)
 */
function normalizeMoroccanPhone(phone: string): string {
  if (!phone) return '';
  // Strip non-digits
  let cleaned = phone.replace(/\D/g, '');
  // Strip country codes
  if (cleaned.startsWith('00212')) cleaned = cleaned.slice(5);
  else if (cleaned.startsWith('212')) cleaned = cleaned.slice(3);
  // Strip leading 0
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  return cleaned;
}

function arePhonesMatching(phoneA: string, phoneB: string): boolean {
  const normA = normalizeMoroccanPhone(phoneA);
  const normB = normalizeMoroccanPhone(phoneB);
  if (!normA || !normB) return false;
  // Match exact normalized or last 8-9 digits
  if (normA === normB) return true;
  if (normA.endsWith(normB) || normB.endsWith(normA)) return true;
  // Check last 8 digits match
  if (normA.length >= 8 && normB.length >= 8) {
    return normA.slice(-8) === normB.slice(-8);
  }
  return false;
}

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

    return NextResponse.json({
      success: true,
      verified: true,
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
    });
  } catch (error) {
    console.error('Error verifying order tracking:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la vérification de la commande.' },
      { status: 500 }
    );
  }
}
