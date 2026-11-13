import { NextRequest, NextResponse } from 'next/server';
import { requireAnyPermission, requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(req: NextRequest) {
  const auth = await requireAnyPermission(req, ['marketing.view', 'marketing.manage_seo']);
  if (!auth.authorized) return auth.response!;
  const mockBrandAudit = {
    brandName: 'NAY Parfum',
    consistencyScore: 92,
    sentimentScore: 88,
    hallucinationRisk: 'LOW',
    findings: [
      { aspect: 'Tone of Voice', status: 'PASS', details: 'Consistent luxury French-Moroccan perfume tone detected.' },
      { aspect: 'Key Messaging', status: 'PASS', details: 'Parfums de luxe, testeurs authentiques 100ml, livraison express Maroc.' },
      { aspect: 'Value Proposition', status: 'PASS', details: 'Longue tenue, prix accessibles, qualité irréprochable.' }
    ],
    auditedAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data: mockBrandAudit });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const body = await req.json().catch(() => ({}));
    const { brandName = 'OurBrand' } = body;

    // Return a mock brand consistency audit result
    const mockBrandAudit = {
      id: `brandaudit_${Date.now()}`,
      brandName,
      consistencyScore: 92,
      sentimentScore: 88,
      hallucinationRisk: 'LOW',
      findings: [
        { aspect: 'Tone of Voice', status: 'PASS', details: 'Consistent professional tone detected across simulated LLM queries.' },
        { aspect: 'Key Messaging', status: 'WARN', details: 'Some older product names are still being surfaced by AI.' },
        { aspect: 'Value Proposition', status: 'PASS', details: 'Core value proposition is clearly understood by AI engines.' }
      ],
      auditedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: mockBrandAudit }, { status: 201 });
  } catch (error) {
    console.error('Error running brand audit:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
