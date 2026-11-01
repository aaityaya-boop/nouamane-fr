import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      locale = 'fr',
      deviceType = 'desktop',
      genderFilter = 'all',
      minPrice = 250,
      maxPrice = 650,
      familyFilter = 'all',
      participantName
    } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Upsert session
    const session = await prisma.scentMatchSession.upsert({
      where: { sessionId },
      update: {
        locale,
        deviceType,
        genderFilter,
        minPrice: Number(minPrice),
        maxPrice: Number(maxPrice),
        familyFilter,
        ...(participantName ? { participantName } : {})
      },
      create: {
        sessionId,
        locale,
        deviceType,
        genderFilter,
        minPrice: Number(minPrice),
        maxPrice: Number(maxPrice),
        familyFilter,
        participantName: participantName || null,
        status: 'ACTIVE'
      },
      include: {
        result: true
      }
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sessionId: session.sessionId,
        genderFilter: session.genderFilter,
        minPrice: session.minPrice,
        maxPrice: session.maxPrice,
        familyFilter: session.familyFilter,
        status: session.status,
        totalSwipes: session.totalSwipes,
        totalLikes: session.totalLikes,
        totalPasses: session.totalPasses,
        totalSaves: session.totalSaves,
        likedProductIds: JSON.parse(session.likedProductIds || '[]'),
        passedProductIds: JSON.parse(session.passedProductIds || '[]'),
        savedProductIds: JSON.parse(session.savedProductIds || '[]'),
        result: session.result
      }
    });
  } catch (error) {
    console.error('Error in /api/scent-match/session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const session = await prisma.scentMatchSession.findUnique({
      where: { sessionId },
      include: {
        result: true
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        likedProductIds: JSON.parse(session.likedProductIds || '[]'),
        passedProductIds: JSON.parse(session.passedProductIds || '[]'),
        savedProductIds: JSON.parse(session.savedProductIds || '[]')
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
