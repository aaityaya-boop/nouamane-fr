import { NextResponse } from 'next/server';
import { syncMoroccoSeoEngine } from '@/lib/seo/seedMoroccoSeo';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function POST(req: Request) {
  try {
    const auth = await requirePermission(req, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const result = await syncMoroccoSeoEngine();
    return NextResponse.json({
      success: true,
      message: 'Moteur SEO Maroc synchronisé avec succès.',
      result
    });
  } catch (error) {
    console.error('SEO Sync API Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
