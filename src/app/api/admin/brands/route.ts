import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission, requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(req: Request) {
  try {
    const { errorResponse } = await requirePermission(req, 'products.view');
    if (errorResponse) return errorResponse;

    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(brands);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['products.create', 'products.edit']);
    if (errorResponse) return errorResponse;

    const data = await req.json();
    const { slug, name, label, description, image } = data;

    if (!slug || !name || !label || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newBrand = await prisma.brand.create({
      data: {
        slug,
        name,
        label,
        description,
        image
      }
    });
    return NextResponse.json(newBrand);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
