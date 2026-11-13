import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

function getCustomerJwtSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || 'nouamane_super_secret_key_2024'
  );
}

export async function GET(request: Request) {
  try {
    let token: string | undefined;
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('customer_token')?.value;
    } catch {
      const cookieHeader = request?.headers?.get('cookie') || '';
      const match = cookieHeader.match(/(?:^|;\s*)customer_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }

    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getCustomerJwtSecret());
    if (!payload.id || payload.purpose === 'ORDER_TRACKING' || payload.tokenType === 'ADMIN_SESSION') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    // Find all orders linked to this customer's email OR their customer ID
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: payload.id as string },
          { customerEmail: payload.email as string }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
