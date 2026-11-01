import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PERSONALITY_ARCHETYPES } from '@/lib/scentMatch/taxonomy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 400 });
    }

    const result = await prisma.scentMatchResult.findUnique({
      where: { shareToken: token },
      include: {
        session: {
          select: {
            participantName: true,
            locale: true,
            totalLikes: true,
            createdAt: true
          }
        }
      }
    });

    if (!result) {
      return NextResponse.json({ error: 'Scent Match result not found' }, { status: 404 });
    }

    // Increment share views in background
    try {
      await prisma.scentMatchShare.upsert({
        where: { shareToken: token },
        update: {
          viewsCount: { increment: 1 },
          lastViewedAt: new Date()
        },
        create: {
          shareToken: token,
          sessionId: result.sessionId,
          viewsCount: 1,
          lastViewedAt: new Date()
        }
      });
    } catch (e) {
      console.error('Error tracking share view:', e);
    }

    const archetype =
      PERSONALITY_ARCHETYPES[result.personalityKey] ||
      PERSONALITY_ARCHETYPES.LE_MAGNAT_BOISE;

    return NextResponse.json({
      success: true,
      data: {
        shareToken: result.shareToken,
        participantName: result.session?.participantName || 'Un passionné de parfums',
        locale: result.session?.locale || 'fr',
        totalLikes: result.session?.totalLikes || 0,
        createdAt: result.createdAt,
        personality: archetype,
        dnaScores: JSON.parse(result.dnaScores || '{}'),
        favoriteNotes: JSON.parse(result.favoriteNotes || '[]'),
        topMatches: JSON.parse(result.topMatches || '[]')
      }
    });
  } catch (error) {
    console.error('Error in /api/scent-match/share/[token]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
