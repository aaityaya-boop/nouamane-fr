import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SwipeAction } from '@/lib/scentMatch/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, action, productId, productName, metadata } = body as {
      sessionId: string;
      action: SwipeAction | 'DETAILS_VIEW' | 'CART_ADD';
      productId?: number;
      productName?: string;
      metadata?: any;
    };

    if (!sessionId || !action) {
      return NextResponse.json({ error: 'sessionId and action are required' }, { status: 400 });
    }

    // Retrieve current session
    const session = await prisma.scentMatchSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let likedIds: number[] = JSON.parse(session.likedProductIds || '[]');
    let passedIds: number[] = JSON.parse(session.passedProductIds || '[]');
    let savedIds: number[] = JSON.parse(session.savedProductIds || '[]');

    let totalSwipes = session.totalSwipes;
    let totalLikes = session.totalLikes;
    let totalPasses = session.totalPasses;
    let totalSaves = session.totalSaves;

    if (action === 'LIKE' && productId) {
      if (!likedIds.includes(productId)) {
        likedIds.push(productId);
        totalLikes += 1;
        totalSwipes += 1;
      }
    } else if (action === 'PASS' && productId) {
      if (!passedIds.includes(productId)) {
        passedIds.push(productId);
        totalPasses += 1;
        totalSwipes += 1;
      }
    } else if (action === 'SAVE' && productId) {
      if (!savedIds.includes(productId)) {
        savedIds.push(productId);
        totalSaves += 1;
      }
    } else if (action === 'UNDO' && productId) {
      // Check if was in liked or passed
      if (likedIds.includes(productId)) {
        likedIds = likedIds.filter((id) => id !== productId);
        totalLikes = Math.max(0, totalLikes - 1);
        totalSwipes = Math.max(0, totalSwipes - 1);
      } else if (passedIds.includes(productId)) {
        passedIds = passedIds.filter((id) => id !== productId);
        totalPasses = Math.max(0, totalPasses - 1);
        totalSwipes = Math.max(0, totalSwipes - 1);
      }
    }

    // Update session record
    const updated = await prisma.scentMatchSession.update({
      where: { sessionId },
      data: {
        likedProductIds: JSON.stringify(likedIds),
        passedProductIds: JSON.stringify(passedIds),
        savedProductIds: JSON.stringify(savedIds),
        totalSwipes,
        totalLikes,
        totalPasses,
        totalSaves
      }
    });

    // Record audit event
    await prisma.scentMatchEvent.create({
      data: {
        sessionId,
        eventType: action,
        productId: productId || null,
        productName: productName || null,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalSwipes: updated.totalSwipes,
        totalLikes: updated.totalLikes,
        totalPasses: updated.totalPasses,
        totalSaves: updated.totalSaves,
        likedProductIds: likedIds,
        passedProductIds: passedIds,
        savedProductIds: savedIds
      }
    });
  } catch (error) {
    console.error('Error in /api/scent-match/swipe:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
