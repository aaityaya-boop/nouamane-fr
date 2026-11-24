import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  const rate = checkRateLimit(`public_search:${clientIp}`, 60, 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de recherches. Veuillez patienter.' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get('q');

  if (!rawQ || !rawQ.trim()) {
    return NextResponse.json({ products: [] });
  }

  const q = rawQ.trim().slice(0, 100);

  try {
    const allProducts = await prisma.product.findMany({
      where: {
        subcategory: { notIn: ['master-copier', 'coffrets'] },
        published: true
      },
      select: {
        id: true,
        slug: true,
        name: true,
        brand: true,
        brandLabel: true,
        gender: true,
        subcategory: true,
        subcategoryLabel: true,
        price: true,
        originalPrice: true,
        images: true,
        sizes: true,
        tags: true,
        inStock: true,
        stock: true,
        rating: true,
        reviewCount: true,
      },
    });
    const lowerQ = q.toLowerCase();

    const products = allProducts
      .filter(p =>
        p.name.toLowerCase().includes(lowerQ) ||
        p.brandLabel.toLowerCase().includes(lowerQ) ||
        p.tags.toLowerCase().includes(lowerQ)
      )
      .slice(0, 40);

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
