import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pages = await prisma.landingPage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching landing pages:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const productSlugsData = typeof body.productSlugs === 'string'
      ? body.productSlugs
      : JSON.stringify(body.productSlugs || []);

    const page = await prisma.landingPage.create({
      data: {
        slug: body.slug,
        title: body.title,
        subtitle: body.subtitle,
        heroImage: body.heroImage,
        deadline: body.deadline ? new Date(body.deadline) : null,
        badgeText: body.badgeText,
        productSlugs: productSlugsData,
        status: body.status || 'draft'
      }
    });
    return NextResponse.json(page);
  } catch (error: any) {
    console.error('Error creating landing page:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
