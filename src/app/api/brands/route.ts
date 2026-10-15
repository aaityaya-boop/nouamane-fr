import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        products: { some: { published: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(brands);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
