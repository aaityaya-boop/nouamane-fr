import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, status, adminFeedback, rewardNotes } = body;

    const existing = await prisma.employeeSuggestion.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Suggestion introuvable' }, { status: 404 });
    }

    // 1. Action: Upvote / Like toggle
    if (action === 'TOGGLE_LIKE') {
      let likedBy: string[] = [];
      try {
        likedBy = JSON.parse(existing.likedBy || '[]');
      } catch {
        likedBy = [];
      }

      const hasLiked = likedBy.includes(admin.id);
      let updatedLikedBy: string[];
      let updatedCount: number;

      if (hasLiked) {
        updatedLikedBy = likedBy.filter((userId) => userId !== admin.id);
        updatedCount = Math.max(0, existing.likesCount - 1);
      } else {
        updatedLikedBy = [...likedBy, admin.id];
        updatedCount = existing.likesCount + 1;
      }

      const updated = await prisma.employeeSuggestion.update({
        where: { id },
        data: {
          likesCount: updatedCount,
          likedBy: JSON.stringify(updatedLikedBy)
        }
      });

      return NextResponse.json({ success: true, suggestion: updated, hasLiked: !hasLiked });
    }

    // 2. Action: Update Status / Management Feedback (Owner / HR)
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'IMPLEMENTED') {
        updateData.implementedAt = new Date();
      }
    }
    if (typeof adminFeedback === 'string') {
      updateData.adminFeedback = adminFeedback.trim();
    }
    if (typeof rewardNotes === 'string') {
      updateData.rewardNotes = rewardNotes.trim();
    }

    const updated = await prisma.employeeSuggestion.update({
      where: { id },
      data: updateData
    });

    // Log Activity
    try {
      await prisma.adminActivityLog.create({
        data: {
          userId: admin.id,
          userName: admin.name,
          userEmail: admin.email,
          action: 'UPDATE_SUGGESTION',
          entityType: 'SUGGESTION',
          entityId: id,
          description: `A mis à jour l'idée "${existing.title}" (Statut: ${status || existing.status})`,
        }
      });
    } catch {}

    return NextResponse.json({ success: true, suggestion: updated });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.employeeSuggestion.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Suggestion supprimée' });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
