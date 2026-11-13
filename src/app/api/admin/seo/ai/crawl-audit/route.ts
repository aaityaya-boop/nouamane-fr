import { NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission, requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(req: NextRequest) {
  const auth = await requireAnyPermission(req, ['marketing.view', 'marketing.manage_seo']);
  if (!auth.authorized) return auth.response!;
  const mockCrawlAudit = {
    url: 'https://nayparfum.ma',
    accessibleToAI: true,
    robotsTxtOptimized: true,
    metadataQuality: 'EXCELLENT',
    schemaMarkupFound: ['Product', 'Organization', 'WebSite', 'Offer', 'BreadcrumbList'],
    issues: [],
    crawlDate: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data: mockCrawlAudit });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const body = await req.json().catch(() => ({}));
    const { url = 'https://example.com' } = body;

    // Return a mock technical SEO crawl result for AI bots
    const mockCrawlAudit = {
      id: `crawlaudit_${Date.now()}`,
      url,
      accessibleToAI: true,
      robotsTxtOptimized: true,
      metadataQuality: 'EXCELLENT',
      schemaMarkupFound: ['Article', 'Organization', 'WebSite'],
      issues: [
        { severity: 'LOW', issue: 'Missing semantic HTML5 tags on older blog posts.' },
      ],
      crawlDate: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: mockCrawlAudit }, { status: 201 });
  } catch (error) {
    console.error('Error running crawl audit:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
