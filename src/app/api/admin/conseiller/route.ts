import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getConseillerAnalyticsData } from '@/lib/advisor/advisorAnalytics';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const intent = searchParams.get('intent')?.trim() || '';
    const gender = searchParams.get('gender')?.trim() || '';

    const analytics = await getConseillerAnalyticsData();

    // Filter conversations if search or intent filters are provided
    let filteredConversations = analytics.conversations;

    if (intent && intent !== 'ALL') {
      filteredConversations = filteredConversations.filter((c: any) => c.intent === intent);
    }

    if (gender && gender !== 'ALL') {
      filteredConversations = filteredConversations.filter((c: any) => c.preferredGender === gender);
    }

    if (search) {
      const q = search.toLowerCase();
      filteredConversations = filteredConversations.filter((c: any) => {
        const matchesSummary = c.summary.toLowerCase().includes(q);
        const matchesNotes = c.preferredNotes.some((n: string) => n.toLowerCase().includes(q));
        const matchesSlugs = c.recommendedSlugs.some((s: string) => s.toLowerCase().includes(q));
        const matchesMessages = c.messages.some((m: any) => m.content.toLowerCase().includes(q));
        const matchesCustomer = (c.customerName && c.customerName.toLowerCase().includes(q)) || 
                                (c.customerCity && c.customerCity.toLowerCase().includes(q));
        return matchesSummary || matchesNotes || matchesSlugs || matchesMessages || matchesCustomer;
      });
    }

    return NextResponse.json({
      success: true,
      analytics: {
        totalConversations: analytics.totalConversations,
        totalQuestions: analytics.totalQuestions,
        intentBreakdown: analytics.intentBreakdown,
        topNotes: analytics.topNotes,
        topRecommendedProducts: analytics.topRecommendedProducts,
        genderStats: analytics.genderStats,
        customerQuestions: analytics.customerQuestions,
      },
      conversations: filteredConversations,
    });
  } catch (error: any) {
    console.error('Erreur API Admin Conseiller:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des données du conseiller.', details: error?.message },
      { status: 500 }
    );
  }
}
