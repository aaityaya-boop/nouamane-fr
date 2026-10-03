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
    const { status, resolutionNotes, actionPlan, assignedToId } = body;

    const existing = await prisma.employeeReclamation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
        updateData.resolvedByName = admin.name;
      }
    }
    if (typeof resolutionNotes === 'string') {
      updateData.resolutionNotes = resolutionNotes.trim();
    }
    if (typeof actionPlan === 'string') {
      updateData.actionPlan = actionPlan.trim();
    }
    if (assignedToId) {
      const assignedUser = await prisma.adminUser.findUnique({ where: { id: assignedToId } });
      if (assignedUser) {
        updateData.assignedToId = assignedUser.id;
        updateData.assignedToName = assignedUser.name;
      }
    }

    const updated = await prisma.employeeReclamation.update({
      where: { id },
      data: updateData,
      include: {
        author: true,
        assignedTo: true
      }
    });

    // Notify author if not anonymous and resolved/updated
    if (existing.authorId && (status || resolutionNotes)) {
      try {
        await prisma.adminNotification.create({
          data: {
            type: 'RECLAMATION',
            title: `Mise à jour Réclamation ${existing.ticketNumber}`,
            message: `Le statut de votre ticket est passé à : ${status || existing.status}`,
            link: '/admin/team/reclamations'
          }
        });
      } catch {}
    }

    // Log Activity
    try {
      await prisma.adminActivityLog.create({
        data: {
          userId: admin.id,
          userName: admin.name,
          userEmail: admin.email,
          action: 'UPDATE_RECLAMATION',
          entityType: 'RECLAMATION',
          entityId: id,
          description: `A mis à jour le ticket RH ${existing.ticketNumber} (Statut: ${status || existing.status})`,
        }
      });
    } catch {}

    return NextResponse.json({ success: true, reclamation: updated });
  } catch (error) {
    console.error('Error updating reclamation:', error);
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
    await prisma.employeeReclamation.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Ticket supprimé' });
  } catch (error) {
    console.error('Error deleting reclamation:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
