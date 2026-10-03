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
    const status = searchParams.get('status');
    const impact = searchParams.get('impact');
    const search = searchParams.get('search');

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (impact && impact !== 'ALL') {
      where.impact = impact;
    }
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { authorName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const suggestions = await prisma.employeeSuggestion.findMany({
      where,
      orderBy: [
        { likesCount: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            jobTitle: true,
          }
        }
      }
    });

    // Summary stats
    const [totalCount, approvedCount, implementedCount, totalLikes] = await Promise.all([
      prisma.employeeSuggestion.count(),
      prisma.employeeSuggestion.count({ where: { status: { in: ['APPROVED', 'IN_PROGRESS'] } } }),
      prisma.employeeSuggestion.count({ where: { status: 'IMPLEMENTED' } }),
      prisma.employeeSuggestion.aggregate({ _sum: { likesCount: true } })
    ]);

    return NextResponse.json({
      success: true,
      suggestions,
      stats: {
        totalCount,
        approvedCount,
        implementedCount,
        totalLikes: totalLikes._sum.likesCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
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
    const { title, description, category, impact, isAnonymous, attachments } = body;

    if (!title?.trim() || !description?.trim() || !category) {
      return NextResponse.json({ error: 'Titre, description et catégorie requis' }, { status: 400 });
    }

    const suggestion = await prisma.employeeSuggestion.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        impact: impact || 'MEDIUM',
        isAnonymous: !!isAnonymous,
        authorId: isAnonymous ? null : admin.id,
        authorName: isAnonymous ? 'Membre Équipe (Anonyme)' : admin.name,
        authorRole: isAnonymous ? 'Collaborateur' : (admin.role || 'Membre'),
        authorAvatar: isAnonymous ? null : admin.avatar,
        attachments: Array.isArray(attachments) ? JSON.stringify(attachments) : (typeof attachments === 'string' ? attachments : '[]'),
        status: 'SUBMITTED',
        likesCount: 0,
        likedBy: '[]'
      }
    });

    // Log Activity
    try {
      await prisma.adminActivityLog.create({
        data: {
          userId: admin.id,
          userName: admin.name,
          userEmail: admin.email,
          action: 'CREATE_SUGGESTION',
          entityType: 'SUGGESTION',
          entityId: suggestion.id,
          description: `A soumis une idée : "${suggestion.title}" (Catégorie: ${suggestion.category})`,
        }
      });
    } catch {}

    return NextResponse.json({ success: true, suggestion });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la suggestion' }, { status: 500 });
  }
}
