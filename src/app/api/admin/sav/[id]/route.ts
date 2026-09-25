import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';
import { SAV_CATEGORIES } from '@/lib/sav/savService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'orders.view')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const claim = await prisma.claimTicket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }],
      },
      include: {
        order: {
          include: {
            customer: true,
            timeline: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        customer: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
        internalNotes: {
          orderBy: { createdAt: 'desc' },
        },
        returnItems: {
          orderBy: { createdAt: 'desc' },
        },
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Dossier SAV introuvable.' }, { status: 404 });
    }

    // Other claims on this order
    const otherClaims = await prisma.claimTicket.findMany({
      where: {
        orderId: claim.orderId,
        id: { not: claim.id },
      },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        categoryLabel: true,
        createdAt: true,
      },
    });

    // Compute refunds summary for the order
    const allOrderRefunds = await prisma.claimRefund.findMany({
      where: {
        orderId: claim.orderId,
        status: { in: ['COMPLETED', 'PENDING'] },
      },
    });

    const totalRefundedCompleted = allOrderRefunds
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalRefundedPending = allOrderRefunds
      .filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => sum + r.amount, 0);

    const refundableRemaining = Math.max(0, claim.order.total - totalRefundedCompleted);

    return NextResponse.json({
      claim,
      otherClaims,
      financialSummary: {
        orderTotal: claim.order.total,
        totalRefundedCompleted,
        totalRefundedPending,
        refundableRemaining,
      },
    });
  } catch (error: any) {
    console.error('Error fetching SAV claim:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération du dossier.' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'orders.edit')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      status,
      pendingReason,
      priority,
      category,
      channel,
      description,
      nextAction,
      nextActionDueDate,
      assignedToId,
      proposedSolution,
      proposedSolutionNotes,
      solutionStatus,
      resolutionNotes,
      reopenReason,
      affectedItems,
      attachments,
    } = body;

    const existing = await prisma.claimTicket.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dossier SAV introuvable.' }, { status: 404 });
    }

    // Determine category label if changed
    let categoryLabel = existing.categoryLabel;
    if (category && category !== existing.category) {
      const catObj = SAV_CATEGORIES.find((c) => c.value === category);
      if (catObj) categoryLabel = catObj.label;
    }

    // Determine Assignee Name if changed
    let assignedToName = existing.assignedToName;
    let isAssigneeChanged = false;
    if (assignedToId !== undefined && assignedToId !== existing.assignedToId) {
      isAssigneeChanged = true;
      if (assignedToId) {
        const assignedUser = await prisma.adminUser.findUnique({ where: { id: assignedToId } });
        assignedToName = assignedUser?.name || null;
      } else {
        assignedToName = null;
      }
    }

    // Check status changes & reopening logic
    const isClosing = status === 'CLOSED' && existing.status !== 'CLOSED';
    const isResolving = status === 'RESOLVED' && existing.status !== 'RESOLVED';
    const isReopening =
      (existing.status === 'CLOSED' || existing.status === 'RESOLVED') &&
      status &&
      status !== 'CLOSED' &&
      status !== 'RESOLVED';

    if (isReopening && !reopenReason?.trim()) {
      return NextResponse.json(
        { error: 'Un motif de réouverture est obligatoire pour réouvrir ce dossier.' },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (status !== undefined) updateData.status = status;
      if (pendingReason !== undefined) updateData.pendingReason = pendingReason || null;
      if (priority !== undefined) updateData.priority = priority;
      if (category !== undefined) {
        updateData.category = category;
        updateData.categoryLabel = categoryLabel;
      }
      if (channel !== undefined) updateData.channel = channel;
      if (description !== undefined) updateData.description = description.trim();
      if (nextAction !== undefined) updateData.nextAction = nextAction ? nextAction.trim() : null;
      if (nextActionDueDate !== undefined) updateData.nextActionDueDate = nextActionDueDate ? new Date(nextActionDueDate) : null;
      if (affectedItems !== undefined) updateData.affectedItems = typeof affectedItems === 'string' ? affectedItems : JSON.stringify(affectedItems);
      if (attachments !== undefined) updateData.attachments = typeof attachments === 'string' ? attachments : JSON.stringify(attachments);

      if (assignedToId !== undefined) {
        updateData.assignedToId = assignedToId || null;
        updateData.assignedToName = assignedToName;
      }

      if (proposedSolution !== undefined) updateData.proposedSolution = proposedSolution || null;
      if (proposedSolutionNotes !== undefined) updateData.proposedSolutionNotes = proposedSolutionNotes ? proposedSolutionNotes.trim() : null;
      if (solutionStatus !== undefined) updateData.solutionStatus = solutionStatus;

      if (solutionStatus === 'EXECUTED' && existing.solutionStatus !== 'EXECUTED') {
        updateData.solutionExecutedAt = new Date();
        updateData.solutionExecutedById = admin.id;
        updateData.solutionExecutedByName = admin.name;
      }

      if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes ? resolutionNotes.trim() : null;

      if (isResolving) {
        updateData.resolvedAt = new Date();
      }
      if (isClosing) {
        updateData.closedAt = new Date();
      }
      if (isReopening) {
        updateData.reopenedAt = new Date();
        updateData.reopenReason = reopenReason?.trim() || null;
      }

      const claim = await tx.claimTicket.update({
        where: { id },
        data: updateData,
      });

      // Events Logging
      if (status && status !== existing.status) {
        if (isReopening) {
          await tx.claimEvent.create({
            data: {
              claimId: id,
              actorId: admin.id,
              actorName: admin.name,
              actorRole: admin.role,
              type: 'REOPENED',
              title: 'Dossier SAV réouvert',
              description: `Motif de réouverture: "${reopenReason.trim()}" (Nouveau statut: ${status}).`,
              metadata: JSON.stringify({ previousStatus: existing.status, newStatus: status, reopenReason }),
            },
          });
        } else if (isResolving) {
          await tx.claimEvent.create({
            data: {
              claimId: id,
              actorId: admin.id,
              actorName: admin.name,
              actorRole: admin.role,
              type: 'STATUS_CHANGE',
              title: 'Dossier marqué comme résolu',
              description: resolutionNotes ? `Notes: ${resolutionNotes}` : 'La solution a été validée et clôturée.',
              metadata: JSON.stringify({ previousStatus: existing.status, newStatus: 'RESOLVED' }),
            },
          });
        } else if (isClosing) {
          await tx.claimEvent.create({
            data: {
              claimId: id,
              actorId: admin.id,
              actorName: admin.name,
              actorRole: admin.role,
              type: 'CLOSED',
              title: 'Dossier clôturé définitivement',
              description: resolutionNotes ? `Notes de clôture: ${resolutionNotes}` : 'Dossier SAV archivé.',
              metadata: JSON.stringify({ previousStatus: existing.status, newStatus: 'CLOSED' }),
            },
          });
        } else {
          await tx.claimEvent.create({
            data: {
              claimId: id,
              actorId: admin.id,
              actorName: admin.name,
              actorRole: admin.role,
              type: 'STATUS_CHANGE',
              title: `Statut modifié : ${status}`,
              description: pendingReason ? `Motif d'attente : ${pendingReason}` : `Statut passé de ${existing.status} à ${status}.`,
              metadata: JSON.stringify({ previousStatus: existing.status, newStatus: status, pendingReason }),
            },
          });
        }
      }

      if (isAssigneeChanged) {
        await tx.claimEvent.create({
          data: {
            claimId: id,
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            type: 'ASSIGNED',
            title: assignedToName ? `Dossier attribué à ${assignedToName}` : 'Dossier désattribué',
            description: `Responsable assigné : ${assignedToName || 'Non assigné'}.`,
            metadata: JSON.stringify({ assignedToId, assignedToName }),
          },
        });

        if (assignedToId && assignedToId !== admin.id) {
          await tx.adminNotification.create({
            data: {
              userId: assignedToId,
              type: 'TASK',
              title: `Dossier SAV réassigné : ${claim.ticketNumber}`,
              message: `${admin.name} vous a assigné le dossier SAV #${claim.ticketNumber}.`,
              link: `/admin/sav?claimId=${claim.id}`,
            },
          });
        }
      }

      if (proposedSolution && (proposedSolution !== existing.proposedSolution || solutionStatus !== existing.solutionStatus)) {
        await tx.claimEvent.create({
          data: {
            claimId: id,
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            type: solutionStatus === 'EXECUTED' ? 'SOLUTION_VALIDATED' : 'SOLUTION_PROPOSED',
            title: `Solution : ${proposedSolution} (${solutionStatus || 'PROPOSED'})`,
            description: proposedSolutionNotes || 'Mise à jour de la solution proposée.',
            metadata: JSON.stringify({ proposedSolution, solutionStatus, proposedSolutionNotes }),
          },
        });
      }

      // Log in Global Admin Activity
      await tx.adminActivityLog.create({
        data: {
          userId: admin.id,
          userName: admin.name,
          userEmail: admin.email,
          action: 'UPDATE_CLAIM',
          entityType: 'ORDER',
          entityId: claim.orderId,
          description: `Mise à jour du dossier SAV ${claim.ticketNumber} (Statut: ${claim.status}, Responsable: ${claim.assignedToName || 'Non assigné'})`,
        },
      });

      return claim;
    });

    return NextResponse.json({
      success: true,
      claim: updated,
      message: 'Dossier SAV mis à jour avec succès.',
    });
  } catch (error: any) {
    console.error('Error updating SAV claim:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'orders.edit')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const existing = await prisma.claimTicket.findUnique({
      where: { id },
      include: {
        refunds: { where: { status: 'COMPLETED' } },
        returnItems: { where: { isRestocked: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dossier SAV introuvable.' }, { status: 404 });
    }

    // Protection check
    if (existing.refunds.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un dossier ayant des remboursements complétés. Veuillez clôturer le dossier à la place.' },
        { status: 400 }
      );
    }

    if (existing.returnItems.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un dossier ayant des articles déjà remis en stock. Veuillez clôturer le dossier.' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.claimTicket.delete({ where: { id } });

      await tx.adminActivityLog.create({
        data: {
          userId: admin.id,
          userName: admin.name,
          userEmail: admin.email,
          action: 'DELETE_CLAIM',
          entityType: 'ORDER',
          entityId: existing.orderId,
          description: `Suppression du dossier SAV ${existing.ticketNumber}`,
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Dossier SAV supprimé avec succès.' });
  } catch (error: any) {
    console.error('Error deleting SAV claim:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du dossier.' }, { status: 500 });
  }
}
