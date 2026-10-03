import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    // Confidentiality filter:
    // If user is not OWNER or HR, they can only see standard tickets or their own confidential tickets
    const isOwner = admin.role === 'OWNER' || admin.role === 'CO_OWNER' || admin.role === 'HR_ADMIN' || admin.role === 'SUPER_ADMIN';
    if (!isOwner) {
      where.OR = [
        { confidentiality: 'STANDARD' },
        { authorId: admin.id }
      ];
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search && search.trim()) {
      const s = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { ticketNumber: { contains: s, mode: 'insensitive' } },
            { subject: { contains: s, mode: 'insensitive' } },
            { description: { contains: s, mode: 'insensitive' } },
            { authorName: { contains: s, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const reclamations = await prisma.employeeReclamation.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            phone: true,
            jobTitle: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    // Summary stats
    const [totalCount, openCount, actionCount, resolvedCount] = await Promise.all([
      prisma.employeeReclamation.count(),
      prisma.employeeReclamation.count({ where: { status: 'OPEN' } }),
      prisma.employeeReclamation.count({ where: { status: { in: ['IN_REVIEW', 'ACTION_TAKEN'] } } }),
      prisma.employeeReclamation.count({ where: { status: 'RESOLVED' } })
    ]);

    return NextResponse.json({
      success: true,
      reclamations,
      stats: {
        totalCount,
        openCount,
        actionCount,
        resolvedCount,
        resolutionRate: totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100
      }
    });
  } catch (error) {
    console.error('Error fetching reclamations:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const {
      subject,
      description,
      category,
      priority,
      confidentiality,
      isAnonymous,
      attachments
    } = body;

    if (!subject?.trim() || !description?.trim() || !category) {
      return NextResponse.json({ error: 'Sujet, description et catégorie requis' }, { status: 400 });
    }

    // Generate unique Ticket Reference (e.g. REC-2026-001)
    const count = await prisma.employeeReclamation.count();
    const year = new Date().getFullYear();
    const ticketNumber = `REC-${year}-${String(count + 1).padStart(3, '0')}`;

    const reclamation = await prisma.employeeReclamation.create({
      data: {
        ticketNumber,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority: priority || 'MEDIUM',
        confidentiality: confidentiality || (isAnonymous ? 'ANONYMOUS' : 'STANDARD'),
        isAnonymous: !!isAnonymous,
        authorId: isAnonymous ? null : admin.id,
        authorName: isAnonymous ? 'Collaborateur Anonyme' : admin.name,
        authorRole: isAnonymous ? 'Membre Équipe' : (admin.role || 'Membre'),
        authorPhone: isAnonymous ? null : (admin.phone || null),
        authorAvatar: isAnonymous ? null : admin.avatar,
        attachments: Array.isArray(attachments) ? JSON.stringify(attachments) : '[]',
        status: 'OPEN'
      }
    });

    // Create Notification for OWNER / HR
    try {
      await prisma.adminNotification.create({
        data: {
          type: 'RECLAMATION',
          title: `Nouveau Signalement RH: ${ticketNumber}`,
          message: `${isAnonymous ? 'Un collaborateur' : admin.name} a ouvert une réclamation: "${subject}" (${category})`,
          link: '/admin/team/reclamations'
        }
      });
    } catch {}

    // Log Activity
    try {
      await prisma.adminActivityLog.create({
        data: {
          userId: isAnonymous ? null : admin.id,
          userName: isAnonymous ? 'Anonyme' : admin.name,
          userEmail: isAnonymous ? null : admin.email,
          action: 'CREATE_RECLAMATION',
          entityType: 'RECLAMATION',
          entityId: reclamation.id,
          description: `A créé le ticket réclamation ${ticketNumber}: "${reclamation.subject}"`,
        }
      });
    } catch {}

    return NextResponse.json({ success: true, reclamation });
  } catch (error) {
    console.error('Error creating reclamation:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du ticket' }, { status: 500 });
  }
}
