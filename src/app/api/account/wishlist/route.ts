import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyCustomerToken } from '@/lib/security/jwt';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = await verifyCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    const { productSlug, action } = await request.json();
    if (!productSlug || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: payload.id as string }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    let wishlist = [];
    try {
      wishlist = JSON.parse(customer.wishlist);
    } catch (e) {
      wishlist = [];
    }

    if (action === 'add') {
      if (!wishlist.includes(productSlug)) {
        wishlist.push(productSlug);
      }
    } else {
      wishlist = wishlist.filter((slug: string) => slug !== productSlug);
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: payload.id as string },
      data: { wishlist: JSON.stringify(wishlist) },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        wishlist: true
      }
    });

    const responseCustomer = {
      ...updatedCustomer,
      wishlist: wishlist
    };

    return NextResponse.json({ success: true, customer: responseCustomer });
  } catch (error) {
    console.error('Wishlist update error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
