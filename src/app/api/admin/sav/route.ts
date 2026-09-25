import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';
import { generateNextSavTicketNumber, safeJsonParse, SAV_CATEGORIES } from '@/lib/sav/savService';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'orders.view')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'ALL';
    const category = searchParams.get('category') || 'ALL';
    const priority = searchParams.get('priority') || 'ALL';
    const assignedTo = searchParams.get('assignedTo') || 'ALL';
    const period = searchParams.get('period') || '30d'; // '7d' | '30d' | 'month' | 'all'
    const myClaimsOnly = searchParams.get('myClaims') === 'true';

    // Build Date Filter for KPI and list
    let startDate: Date | undefined;
    const now = new Date();
    if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Build Query Filters
    const where: any = {};

    if (status !== 'ALL') {
      where.status = status;
    }

    if (category !== 'ALL') {
      where.category = category;
    }

    if (priority !== 'ALL') {
      where.priority = priority;
    }

    if (myClaimsOnly) {
      where.assignedToId = admin.id;
    } else if (assignedTo !== 'ALL') {
      if (assignedTo === 'UNASSIGNED') {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedTo;
      }
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch Claims
    const claims = await prisma.claimTicket.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            shippingCity: true,
            paymentMethod: true,
          },
        },
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
          },
        },
        refunds: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
        returnItems: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            status: true,
            isRestocked: true,
          },
        },
        _count: {
          select: {
            events: true,
            internalNotes: true,
          },
        },
      },
    });

    // Real-Time KPIs calculated strictly on DB
    const allClaims = await prisma.claimTicket.findMany({
      select: {
        id: true,
        status: true,
        assignedToId: true,
        nextActionDueDate: true,
        resolvedAt: true,
        closedAt: true,
        createdAt: true,
      },
    });

    const openStatuses = ['NEW', 'IN_PROGRESS', 'PENDING'];
    const openClaims = allClaims.filter((c) => openStatuses.includes(c.status)).length;
    const unassignedClaims = allClaims.filter((c) => openStatuses.includes(c.status) && !c.assignedToId).length;
    const overdueActions = allClaims.filter(
      (c) => openStatuses.includes(c.status) && c.nextActionDueDate && new Date(c.nextActionDueDate) < now
    ).length;

    const resolvedInPeriod = allClaims.filter((c) => {
      const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';
      if (!isResolved) return false;
      const resDate = c.resolvedAt || c.closedAt;
      if (!resDate) return false;
      if (!startDate) return true;
      return new Date(resDate) >= startDate;
    }).length;

    // Fetch active admins for assignment
    const admins = await prisma.adminUser.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      claims,
      kpis: {
        openClaims,
        unassignedClaims,
        overdueActions,
        resolvedInPeriod,
      },
      admins,
      currentAdmin: {
        id: admin.id,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('Error fetching SAV claims:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des réclamations.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'orders.edit')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      orderId,
      category,
      channel = 'WHATSAPP',
      priority = 'MEDIUM',
      description,
      affectedItems = [],
      attachments = [],
      assignedToId = null,
      nextAction = null,
      nextActionDueDate = null,
      proposedSolution = null,
      proposedSolutionNotes = null,
    } = body;

    if (!orderId || !category || !description) {
      return NextResponse.json(
        { error: 'Veuillez renseigner la commande, la catégorie et la description.' },
        { status: 400 }
      );
    }

    // Check order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        claims: {
          where: { status: { in: ['NEW', 'IN_PROGRESS', 'PENDING'] } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
    }

    // Category label
    const catObj = SAV_CATEGORIES.find((c) => c.value === category);
    const categoryLabel = catObj?.label || category;

    // Generate unique sequential ticket number
    const ticketNumber = await generateNextSavTicketNumber();

    // Assignee name
    let assignedToName: string | null = null;
    if (assignedToId) {
      const assignedUser = await prisma.adminUser.findUnique({ where: { id: assignedToId } });
      if (assignedUser) assignedToName = assignedUser.name;
    }

    const formattedAffectedItems = Array.isArray(affectedItems) ? JSON.stringify(affectedItems) : affectedItems || '[]';
    const formattedAttachments = Array.isArray(attachments) ? JSON.stringify(attachments) : attachments || '[]';

    // Run creation inside transaction
    const newClaim = await prisma.$transaction(async (tx) => {
      const claim = await tx.claimTicket.create({
        data: {
          ticketNumber,
          orderId: order.id,
          customerId: order.customerId || null,
          customerName: order.customerName,
          customerPhone: order.customerPhone || null,
          customerEmail: order.customerEmail || null,
          category,
          categoryLabel,
          channel,
          priority,
          status: 'NEW',
          description: description.trim(),
          affectedItems: formattedAffectedItems,
          attachments: formattedAttachments,
          assignedToId: assignedToId || null,
          assignedToName: assignedToName || null,
          createdById: admin.id,
          createdByName: admin.name,
          nextAction: nextAction ? nextAction.trim() : null,
          nextActionDueDate: nextActionDueDate ? new Date(nextActionDueDate) : null,
          proposedSolution: proposedSolution || null,
          proposedSolutionNotes: proposedSolutionNotes ? proposedSolutionNotes.trim() : null,
          solutionStatus: proposedSolution ? 'PROPOSED' : 'NONE',
        },
      });

      // Initial Timeline Event
      await tx.claimEvent.create({
        data: {
          claimId: claim.id,
          actorId: admin.id,
          actorName: admin.name,
          actorRole: admin.role,
          type: 'CREATED',
          title: 'Dossier SAV ouvert',
          description: `Réclamation créée pour la commande #${order.orderNumber} (Motif: ${categoryLabel}, Canal: ${channel}, Priorité: ${priority}).`,
          metadata: JSON.stringify({
            ticketNumber,
            category,
            priority,
            assignedTo: assignedToName,
          }),
        },
      });

      // If solution is RETURN or EXCHANGE, create return item drafts
      if (['RETURN', 'EXCHANGE', 'REPLACEMENT'].includes(proposedSolution || '')) {
        const parsedItems = safeJsonParse<any[]>(formattedAffectedItems, []);
        for (const item of parsedItems) {
          if (item.productName) {
            await tx.claimReturnItem.create({
              data: {
                claimId: claim.id,
                productId: item.productId ? Number(item.productId) : null,
                productName: item.productName,
                sku: item.sku || null,
                quantity: Number(item.quantity) || 1,
                status: 'RETURN_REQUESTED',
              },
            });
          }
        }
      }

      // Log in Global Admin Activity
      await tx.adminActivityLog.create({
        data: {
          userId: admin.id,
          userName: admin.name,
          userEmail: admin.email,
          action: 'CREATE_CLAIM',
          entityType: 'ORDER',
          entityId: order.id,
          description: `Ouverture du dossier SAV ${ticketNumber} sur la commande #${order.orderNumber} (${categoryLabel})`,
          newValue: JSON.stringify({ ticketNumber, category, priority, customer: order.customerName }),
        },
      });

      // Notify Assignee if assigned to someone else
      if (assignedToId && assignedToId !== admin.id) {
        await tx.adminNotification.create({
          data: {
            userId: assignedToId,
            type: 'TASK',
            title: `Nouveau dossier SAV attribué : ${ticketNumber}`,
            message: `${admin.name} vous a attribué la réclamation #${order.orderNumber} (${categoryLabel}).`,
            link: `/admin/sav?claimId=${claim.id}`,
            metadata: JSON.stringify({ claimId: claim.id, orderId: order.id }),
          },
        });
      }

      return claim;
    });

    return NextResponse.json({
      success: true,
      claim: newClaim,
      message: `Dossier SAV ${ticketNumber} créé avec succès.`,
    });
  } catch (error: any) {
    console.error('Error creating SAV claim:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la création du dossier SAV.' }, { status: 500 });
  }
}
