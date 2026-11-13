import { NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';
import { logAdminActivity } from '@/lib/activityLogger';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse } = await requireAnyPermission(request, [
      'marketing.view',
      'marketing.manage_creatives',
      'marketing.manage_campaigns',
    ]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const creative = await prisma.adminCreative.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!creative) {
      return NextResponse.json({ error: 'Créatif introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, creative });
  } catch (error) {
    console.error('Error fetching single creative:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: admin, errorResponse } = await requireAnyPermission(request, [
      'marketing.manage_creatives',
      'marketing.manage_campaigns',
    ]);
    if (errorResponse || !admin) return errorResponse!;

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      mediaUrl,
      mediaType,
      thumbnailUrl,
      platform,
      aspectRatio,
      category,
      status,
      adCopy,
      productSlug,
      productName,
      tags,
    } = body;

    const existing = await prisma.adminCreative.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Créatif introuvable' }, { status: 404 });
    }

    const updated = await prisma.adminCreative.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(mediaUrl !== undefined && { mediaUrl: mediaUrl.trim() }),
        ...(mediaType !== undefined && { mediaType }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl?.trim() || null }),
        ...(platform !== undefined && { platform }),
        ...(aspectRatio !== undefined && { aspectRatio }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        ...(adCopy !== undefined && { adCopy: adCopy?.trim() || null }),
        ...(productSlug !== undefined && { productSlug: productSlug?.trim() || null }),
        ...(productName !== undefined && { productName: productName?.trim() || null }),
        ...(tags !== undefined && { tags: tags?.trim() || null }),
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    await logAdminActivity({
      userId: admin.id,
      userName: admin.name,
      userEmail: admin.email,
      action: 'UPDATE_CREATIVE',
      entityType: 'MARKETING',
      entityId: id,
      description: `A mis à jour le créatif pub : "${updated.title}" (${updated.status})`,
      req: request,
    });

    return NextResponse.json({ success: true, creative: updated });
  } catch (error) {
    console.error('Error updating creative:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: admin, errorResponse } = await requireAnyPermission(request, [
      'marketing.manage_creatives',
      'marketing.manage_campaigns',
    ]);
    if (errorResponse || !admin) return errorResponse!;

    const { id } = await params;
    const creative = await prisma.adminCreative.findUnique({ where: { id } });
    if (!creative) {
      return NextResponse.json({ error: 'Créatif introuvable' }, { status: 404 });
    }

    await prisma.adminCreative.delete({ where: { id } });

    await logAdminActivity({
      userId: admin.id,
      userName: admin.name,
      userEmail: admin.email,
      action: 'DELETE_CREATIVE',
      entityType: 'MARKETING',
      entityId: id,
      description: `A supprimé le créatif pub : "${creative.title}"`,
      req: request,
    });

    return NextResponse.json({ success: true, message: 'Créatif supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting creative:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
