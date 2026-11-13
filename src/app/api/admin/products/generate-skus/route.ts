import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requirePermission(request, 'products.edit');
    if (errorResponse) return errorResponse;

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sku: null },
          { sku: '' }
        ]
      }
    });

    let updatedCount = 0;

    for (const product of products) {
      // Generate a simple SKU based on brand and an index/random number
      // e.g. REF-VAL-001
      const brandPrefix = product.brandId.substring(0, 3).toUpperCase();
      const sku = `REF-${brandPrefix}-${product.id.toString().padStart(3, '0')}`;
      
      await prisma.product.update({
        where: { id: product.id },
        data: { sku },
      });
      updatedCount++;
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate SKUs' }, { status: 500 });
  }
}
