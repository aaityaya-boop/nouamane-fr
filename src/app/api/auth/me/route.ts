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
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifyCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    // Fetch full user details from DB
    const customer = await prisma.customer.findUnique({
      where: { id: payload.id as string }
    });

    if (!customer) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let wishlist = [];
    try {
      wishlist = JSON.parse(customer.wishlist);
    } catch(e) {}

    return NextResponse.json({
      authenticated: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        wishlist: wishlist,
        role: payload.role
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
