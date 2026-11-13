import { NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';
import { logAdminActivity } from '@/lib/activityLogger';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(request, [
      'marketing.view',
      'marketing.manage_creatives',
      'marketing.manage_campaigns',
    ]);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'ALL';
    const category = searchParams.get('category') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const mediaType = searchParams.get('mediaType') || 'ALL';
    const search = searchParams.get('search') || '';

    const where: any = {};

    if (platform !== 'ALL') where.platform = platform;
    if (category !== 'ALL') where.category = category;
    if (status !== 'ALL') where.status = status;
    if (mediaType !== 'ALL') where.mediaType = mediaType;

    if (search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { adCopy: { contains: search.trim(), mode: 'insensitive' } },
        { productName: { contains: search.trim(), mode: 'insensitive' } },
        { tags: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [creatives, allCreatives] = await Promise.all([
      prisma.adminCreative.findMany({
        where,
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          creator: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      }),
      prisma.adminCreative.findMany({
        select: {
          id: true,
          status: true,
          mediaType: true,
          platform: true,
        },
      }),
    ]);

    const stats = {
      total: allCreatives.length,
      winners: allCreatives.filter((c) => c.status === 'WINNER').length,
      testing: allCreatives.filter((c) => c.status === 'TESTING').length,
      active: allCreatives.filter((c) => c.status === 'ACTIVE' || c.status === 'WINNER').length,
      videos: allCreatives.filter((c) => c.mediaType === 'VIDEO').length,
      images: allCreatives.filter((c) => c.mediaType === 'IMAGE').length,
    };

    return NextResponse.json({
      success: true,
      creatives,
      stats,
    });
  } catch (error) {
    console.error('Error fetching admin creatives:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des créatifs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user: admin, errorResponse } = await requireAnyPermission(request, [
      'marketing.manage_creatives',
      'marketing.manage_campaigns',
    ]);
    if (errorResponse || !admin) return errorResponse!;

    const body = await request.json();
    const {
      title,
      description,
      mediaUrl,
      mediaType = 'IMAGE',
      thumbnailUrl,
      platform = 'META',
      aspectRatio = '9:16',
      category = 'UGC',
      status = 'TESTING',
      adCopy,
      productSlug,
      productName,
      tags,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Le titre du créatif est obligatoire' }, { status: 400 });
    }

    if (!mediaUrl || !mediaUrl.trim()) {
      return NextResponse.json({ error: 'Le fichier média (image ou vidéo) est obligatoire' }, { status: 400 });
    }

    const newCreative = await prisma.adminCreative.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        mediaUrl: mediaUrl.trim(),
        mediaType: mediaType.toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        thumbnailUrl: thumbnailUrl?.trim() || null,
        platform: platform.toUpperCase(),
        aspectRatio: aspectRatio || '9:16',
        category: category.toUpperCase(),
        status: status.toUpperCase(),
        adCopy: adCopy?.trim() || null,
        productSlug: productSlug?.trim() || null,
        productName: productName?.trim() || null,
        createdById: admin.id,
        creatorName: admin.name,
        tags: tags?.trim() || null,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Log Activity
    await logAdminActivity({
      userId: admin.id,
      userName: admin.name,
      userEmail: admin.email,
      action: 'CREATE_CREATIVE',
      entityType: 'MARKETING',
      entityId: newCreative.id,
      description: `A ajouté un nouveau créatif publicitaire : "${newCreative.title}" (${newCreative.platform} - ${newCreative.category})`,
      req: request,
    });

    return NextResponse.json({
      success: true,
      creative: newCreative,
    });
  } catch (error) {
    console.error('Error creating admin creative:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du créatif' }, { status: 500 });
  }
}
