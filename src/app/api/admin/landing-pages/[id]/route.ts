import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const page = await prisma.landingPage.findUnique({
      where: { id }
    });
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching landing page by id:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const body = await req.json();

    const productSlugsData = typeof body.productSlugs === 'string'
      ? body.productSlugs
      : JSON.stringify(body.productSlugs || []);

    const page = await prisma.landingPage.update({
      where: { id },
      data: {
        slug: body.slug,
        title: body.title,
        subtitle: body.subtitle,
        heroImage: body.heroImage,
        deadline: body.deadline ? new Date(body.deadline) : null,
        badgeText: body.badgeText,
        productSlugs: productSlugsData,
        status: body.status
      }
    });
    return NextResponse.json(page);
  } catch (error: any) {
    console.error('Error updating landing page:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    await prisma.landingPage.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting landing page:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
