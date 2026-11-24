import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rate = checkRateLimit(`sm_session:${clientIp}`, 45, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
    }

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

    if (!sessionId || typeof sessionId !== 'string' || !/^[a-zA-Z0-9_-]{6,100}$/.test(sessionId.trim())) {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }

    const safeMin = Math.max(0, Math.min(50000, Number(minPrice) || 250));
    const safeMax = Math.max(safeMin, Math.min(50000, Number(maxPrice) || 650));
    const safeName = typeof participantName === 'string' && participantName.trim()
      ? participantName.trim().slice(0, 60)
      : undefined;

    // Upsert session
    const session = await prisma.scentMatchSession.upsert({
      where: { sessionId: sessionId.trim() },
      update: {
        locale: typeof locale === 'string' ? locale.slice(0, 10) : 'fr',
        deviceType: typeof deviceType === 'string' ? deviceType.slice(0, 20) : 'desktop',
        genderFilter: typeof genderFilter === 'string' ? genderFilter.slice(0, 30) : 'all',
        minPrice: safeMin,
        maxPrice: safeMax,
        familyFilter: typeof familyFilter === 'string' ? familyFilter.slice(0, 40) : 'all',
        ...(safeName ? { participantName: safeName } : {})
      },
      create: {
        sessionId: sessionId.trim(),
        locale: typeof locale === 'string' ? locale.slice(0, 10) : 'fr',
        deviceType: typeof deviceType === 'string' ? deviceType.slice(0, 20) : 'desktop',
        genderFilter: typeof genderFilter === 'string' ? genderFilter.slice(0, 30) : 'all',
        minPrice: safeMin,
        maxPrice: safeMax,
        familyFilter: typeof familyFilter === 'string' ? familyFilter.slice(0, 40) : 'all',
        participantName: safeName || null,
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
