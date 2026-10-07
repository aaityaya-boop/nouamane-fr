import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 1. Get other admin users
    const allUsers = await prisma.adminUser.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        jobTitle: true,
        lastActivityAt: true,
        lastLoginAt: true,
      },
    });

    const otherUsers = allUsers.filter(u => u.id !== admin.id);

    // 2. Compute last message and unread count for each contact
    const contactsWithMeta = await Promise.all(
      otherUsers.map(async (u) => {
        const lastMsg = await prisma.adminChatMessage.findFirst({
          where: {
            OR: [
              { senderId: admin.id, recipientId: u.id },
              { senderId: u.id, recipientId: admin.id },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        const unreadCount = await prisma.adminChatMessage.count({
          where: {
            senderId: u.id,
            recipientId: admin.id,
            isRead: false,
          },
        });

        return {
          ...u,
          lastMessage: lastMsg,
          unreadCount,
        };
      })
    );

    // 3. Default Channels overview (GENERAL, STOCK, ORDERS, MARKETING, LOGISTICS)
    const defaultChannels = [
      {
        id: 'GENERAL',
        slug: 'GENERAL',
        name: 'Salon Général NAY',
        description: 'Discussion libre entre associés et équipe',
        type: 'CHANNEL',
        color: 'sky',
        isDefault: true,
        memberIds: JSON.stringify(allUsers.map(u => u.id)),
      },
      {
        id: 'STOCK',
        slug: 'STOCK',
        name: 'Canal Stock & Testeurs',
        description: 'Alertes de réassort, flacons et emballages',
        type: 'CHANNEL',
        color: 'emerald',
        isDefault: true,
        memberIds: JSON.stringify(allUsers.map(u => u.id)),
      },
      {
        id: 'ORDERS',
        slug: 'ORDERS',
        name: 'Canal Commandes & VIP',
        description: 'Suivi des grosses commandes et clients VIP',
        type: 'CHANNEL',
        color: 'indigo',
        isDefault: true,
        memberIds: JSON.stringify(allUsers.map(u => u.id)),
      },
      {
        id: 'MARKETING',
        slug: 'MARKETING',
        name: 'Canal Marketing & Pubs',
        description: 'Campagnes Meta Ads, TikTok, influenceurs et ROAS',
        type: 'CHANNEL',
        color: 'purple',
        isDefault: true,
        memberIds: JSON.stringify(allUsers.map(u => u.id)),
      },
      {
        id: 'LOGISTICS',
        slug: 'LOGISTICS',
        name: 'Canal Logistique & Livraisons',
        description: 'Confirmations téléphoniques COD et suivi des coursiers',
        type: 'CHANNEL',
        color: 'amber',
        isDefault: true,
        memberIds: JSON.stringify(allUsers.map(u => u.id)),
      },
    ];

    // 4. Custom Groups from database
    const customGroups = await prisma.adminChatGroup.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const customChannels = customGroups.map(g => ({
      id: g.slug,
      slug: g.slug,
      dbId: g.id,
      name: g.name,
      description: g.description || 'Groupe de discussion équipe',
      type: 'CHANNEL',
      color: g.color || 'purple',
      isDefault: false,
      memberIds: g.memberIds || '[]',
      createdById: g.createdById,
      creatorName: g.creatorName,
    }));

    const allChannelsList = [...defaultChannels, ...customChannels];

    // Compute last message and member avatars for all channels
    const channelsWithMeta = await Promise.all(
      allChannelsList.map(async (c) => {
        const lastMsg = await prisma.adminChatMessage.findFirst({
          where: { channel: c.slug, recipientId: null },
          orderBy: { createdAt: 'desc' },
        });

        let parsedMemberIds: string[] = [];
        try {
          parsedMemberIds = JSON.parse(c.memberIds);
        } catch {
          parsedMemberIds = [];
        }

        const channelMembers = allUsers.filter(u => parsedMemberIds.includes(u.id));

        return {
          ...c,
          lastMessage: lastMsg,
          members: channelMembers,
          memberCount: channelMembers.length,
        };
      })
    );

    return NextResponse.json({
      success: true,
      contacts: contactsWithMeta,
      channels: channelsWithMeta,
      allTeamMembers: allUsers,
    });
  } catch (error) {
    console.error('Error fetching chat conversations:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des conversations' }, { status: 500 });
  }
}
