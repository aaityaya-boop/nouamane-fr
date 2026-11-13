import { NextResponse } from 'next/server';
import { syncAllAdIntegrations } from '@/lib/ads/ad-sync-service';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requirePermission(req, 'marketing.manage_campaigns');
    if (errorResponse) return errorResponse;

    const results = await syncAllAdIntegrations();
    return NextResponse.json({
      success: true,
      results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error during ads sync:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
