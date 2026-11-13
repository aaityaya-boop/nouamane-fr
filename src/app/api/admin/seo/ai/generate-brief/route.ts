import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const body = await req.json();
    const { opportunityId } = body;

    if (!opportunityId) {
      return NextResponse.json({ success: false, error: 'opportunityId is required' }, { status: 400 });
    }

    // Return a mock AI brief
    const mockBrief = {
      id: `brief_${Date.now()}`,
      opportunityId,
      title: 'The Ultimate Guide to AI-Driven SEO in 2026',
      h1: 'Mastering AI SEO: Strategies for the Modern Web',
      metaDescription: 'Discover how to leverage AI tools to boost your search engine rankings and improve overall site visibility.',
      targetKeywords: ['AI SEO', 'Visibility Engine', 'Search Generative Experience'],
      outline: [
        'Introduction to AI SEO',
        'How LLMs Understand Content',
        'Optimizing for AI Crawlers',
        'Case Studies',
        'Conclusion'
      ],
      suggestedWordCount: 1500,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: mockBrief }, { status: 201 });
  } catch (error) {
    console.error('Error generating AI brief:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
