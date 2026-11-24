import { NextResponse } from 'next/server';
import { discoverMetaBusinessAccounts } from '@/lib/ads/meta-api';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['marketing.view', 'marketing.manage_campaigns']);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { accessToken } = body;

    if (!accessToken || !accessToken.trim()) {
      return NextResponse.json(
        { success: false, error: 'Token d’accès Meta requis pour découvrir vos comptes Business.' },
        { status: 400 }
      );
    }

    const result = await discoverMetaBusinessAccounts(accessToken.trim());
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Meta discovery error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la découverte Meta Business.' },
      { status: 500 }
    );
  }
}
