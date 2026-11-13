import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(req: Request) {
  try {
    const auth = await requireAnyPermission(req, ['marketing.view', 'marketing.manage_seo']);
    if (!auth.authorized) return auth.response!;
    const records = await prisma.seoKeywordPerformance.findMany({
      orderBy: { impressions: 'desc' },
      take: 50,
    });
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
