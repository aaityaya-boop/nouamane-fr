import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requirePermission(req, 'products.edit');
    if (errorResponse) return errorResponse;

    const { name, label, description, image } = await req.json();

    const updated = await prisma.brand.update({
      where: { id: (await params).id },
      data: { 
        name, 
        label, 
        description, 
        image 
      }
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requirePermission(req, 'products.delete');
    if (errorResponse) return errorResponse;

    const { id } = await params;
    
    // Check if there are products linked to this brand
    const linkedProducts = await prisma.product.count({
      where: { brand: { id } }
    });
    
    if (linkedProducts > 0) {
      return NextResponse.json({ error: "Impossible de supprimer cette marque car des produits y sont associés." }, { status: 400 });
    }

    await prisma.brand.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
