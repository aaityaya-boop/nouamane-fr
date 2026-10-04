import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createAdminNotification } from '@/lib/notificationService';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { stock: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        brandLabel: true,
        subcategory: true,
        subcategoryLabel: true,
        price: true,
        originalPrice: true,
        testerPrice: true,
        stock: true,
        inStock: true,
        images: true,
        sku: true,
        updatedAt: true,
      },
    });

    const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
    const outOfStockCount = products.filter((p) => (p.stock || 0) <= 0).length;
    const inStockCount = products.filter((p) => (p.stock || 0) > 5).length;
    const totalValuationMAD = products.reduce((acc, p) => acc + (p.stock || 0) * (p.price || 0), 0);

    return NextResponse.json({
      success: true,
      products,
      stats: {
        totalProducts: products.length,
        totalStockUnits,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        totalValuationMAD,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, stock } = await request.json();

    if (!id || stock === undefined) {
      return NextResponse.json({ error: 'Missing id or stock' }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: { 
        stock: Number(stock),
        inStock: Number(stock) > 0 
      },
    });

    if (Number(stock) <= 0) {
      createAdminNotification({
        type: 'STOCK',
        title: `Rupture de Stock : ${updated.name}`,
        message: `Le produit "${updated.name}" est désormais épuisé.`,
        link: '/admin/inventory',
        metadata: { productId: updated.id, stock: 0 },
      }).catch(() => {});
    } else if (Number(stock) <= 3) {
      createAdminNotification({
        type: 'STOCK',
        title: `Stock Faible : ${updated.name} ⚠️`,
        message: `Attention, il ne reste que ${updated.stock} unité(s) pour "${updated.name}".`,
        link: '/admin/inventory',
        metadata: { productId: updated.id, stock: updated.stock },
      }).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}
