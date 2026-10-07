import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const [members, products, orders] = await Promise.all([
      prisma.adminUser.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, email: true, avatar: true, role: true },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          brandLabel: true,
          stock: true,
          images: true,
        },
        orderBy: { name: 'asc' },
        take: 500,
      }),
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          shippingCity: true,
          total: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const formattedProducts = products.map(p => {
      let image = '/placeholder-perfume.jpg';
      try {
        const imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        if (Array.isArray(imgs) && imgs.length > 0) image = imgs[0];
      } catch {}

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        brand: p.brandLabel || 'NAY',
        stock: p.stock || 0,
        image,
      };
    });

    return NextResponse.json({
      success: true,
      members,
      products: formattedProducts,
      orders,
    });
  } catch (error) {
    console.error('Error fetching mentionables:', error);
    return NextResponse.json({ error: 'Erreur mentionables' }, { status: 500 });
  }
}
