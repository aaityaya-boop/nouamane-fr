import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { calculateFriendCompatibility, parseNotes } from '@/lib/scentMatch/engine';
import { QueueProduct } from '@/lib/scentMatch/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, hostSessionId, hostName, inviteCode, friendSessionId, friendName } = body;

    if (action === 'create') {
      if (!hostSessionId) {
        return NextResponse.json({ error: 'hostSessionId is required' }, { status: 400 });
      }

      const code = `NAY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const friendSession = await prisma.scentMatchFriendSession.create({
        data: {
          inviteCode: code,
          hostSessionId,
          hostName: hostName || 'Hôte',
          status: 'WAITING_FRIEND'
        }
      });

      return NextResponse.json({
        success: true,
        inviteCode: friendSession.inviteCode,
        hostName: friendSession.hostName
      });
    }

    if (action === 'join') {
      if (!inviteCode || !friendSessionId) {
        return NextResponse.json({ error: 'inviteCode and friendSessionId are required' }, { status: 400 });
      }

      const existing = await prisma.scentMatchFriendSession.findUnique({
        where: { inviteCode }
      });

      if (!existing) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      const updated = await prisma.scentMatchFriendSession.update({
        where: { inviteCode },
        data: {
          friendSessionId,
          friendName: friendName || 'Ami(e)',
          status: 'BOTH_COMPLETED'
        }
      });

      return NextResponse.json({
        success: true,
        friendSession: updated
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in /api/scent-match/friends POST:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inviteCode = searchParams.get('inviteCode');

    if (!inviteCode) {
      return NextResponse.json({ error: 'inviteCode is required' }, { status: 400 });
    }

    const friendSession = await prisma.scentMatchFriendSession.findUnique({
      where: { inviteCode }
    });

    if (!friendSession) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Load host session
    const host = await prisma.scentMatchSession.findUnique({
      where: { sessionId: friendSession.hostSessionId }
    });

    // Load friend session if joined
    let friend = null;
    if (friendSession.friendSessionId) {
      friend = await prisma.scentMatchSession.findUnique({
        where: { sessionId: friendSession.friendSessionId }
      });
    }

    const hostLikedIds: number[] = host ? JSON.parse(host.likedProductIds || '[]') : [];
    const friendLikedIds: number[] = friend ? JSON.parse(friend.likedProductIds || '[]') : [];

    // All distinct product IDs liked by either
    const allLikedIds = Array.from(new Set([...hostLikedIds, ...friendLikedIds]));

    let mutualProducts: QueueProduct[] = [];
    let compatibilityScore = friendSession.compatibilityScore || 0;
    let sharedArchetype = friendSession.matchArchetype || "En attente de l'ami(e)...";

    if (allLikedIds.length > 0) {
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: allLikedIds } }
      });

      const queueProducts: QueueProduct[] = dbProducts.map((p) => {
        let images: string[] = [];
        try {
          images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        } catch {
          images = [p.images as any];
        }
        if (!Array.isArray(images) || images.length === 0) {
          images = ['/images/placeholder-perfume.png'];
        }

        const notesParsed = parseNotes(p.notes);

        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          brandLabel: p.brandLabel || 'Maison NAY',
          brandId: p.brandId,
          gender: p.gender,
          price: p.price,
          originalPrice: p.originalPrice,
          images,
          notes: {
            top: notesParsed.top,
            heart: notesParsed.heart,
            base: notesParsed.base
          },
          subcategoryLabel: p.subcategoryLabel || 'Signature',
          perfectSeason: p.perfectSeason || 'Toutes Saisons',
          inStock: p.inStock
        };
      });

      const hostProds = queueProducts.filter((p) => hostLikedIds.includes(p.id));
      const friendProds = queueProducts.filter((p) => friendLikedIds.includes(p.id));

      if (friend && friendProds.length > 0) {
        const result = calculateFriendCompatibility({
          hostLikedProducts: hostProds,
          friendLikedProducts: friendProds
        });

        compatibilityScore = result.compatibilityScore;
        mutualProducts = result.mutualLikedProducts;
        sharedArchetype = result.sharedArchetype;

        // Save updated score to friendSession
        await prisma.scentMatchFriendSession.update({
          where: { inviteCode },
          data: {
            compatibilityScore,
            mutualLikedIds: JSON.stringify(mutualProducts.map((p) => p.id)),
            matchArchetype: sharedArchetype,
            status: 'BOTH_COMPLETED'
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        inviteCode: friendSession.inviteCode,
        hostName: friendSession.hostName,
        friendName: friendSession.friendName,
        status: friend ? 'BOTH_COMPLETED' : 'WAITING_FRIEND',
        compatibilityScore,
        sharedArchetype,
        mutualLikedProducts: mutualProducts,
        hostTotalLikes: hostLikedIds.length,
        friendTotalLikes: friendLikedIds.length
      }
    });
  } catch (error) {
    console.error('Error in /api/scent-match/friends GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
