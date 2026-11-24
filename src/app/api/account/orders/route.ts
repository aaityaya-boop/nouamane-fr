import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyCustomerToken } from '@/lib/security/jwt';

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

    const payload = await verifyCustomerToken(token);
    if (!payload) {
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
