import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { testMetaConnection } from '@/lib/ads/meta-api';
import { testTikTokConnection } from '@/lib/ads/tiktok-api';
import { testGoogleConnection } from '@/lib/ads/google-api';
import { requirePermission, requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['marketing.view', 'marketing.manage_campaigns']);
    if (errorResponse) return errorResponse;

    const integrations = await prisma.adAccountIntegration.findMany({
      orderBy: { platform: 'asc' },
    });

    // Mask sensitive tokens for security
    const sanitized = integrations.map((item) => ({
      ...item,
      accessToken: item.accessToken ? `${item.accessToken.slice(0, 6)}...${item.accessToken.slice(-4)}` : null,
      refreshToken: item.refreshToken ? `${item.refreshToken.slice(0, 4)}...` : null,
    }));

    return NextResponse.json({ success: true, integrations: sanitized });
  } catch (error: any) {
    console.error('Error fetching ad integrations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requirePermission(req, 'marketing.manage_campaigns');
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { platform, accountId, accessToken, pixelId, currency, exchangeRateToMAD, accountName, testOnly } = body;

    if (!platform || !accountId) {
      return NextResponse.json(
        { success: false, error: 'Plateforme et Identifiant de compte requis' },
        { status: 400 }
      );
    }

    let testResult: { success: boolean; accountName?: string; currency?: string; error?: string } = {
      success: true,
      accountName: accountName || `${platform} Ad Account`,
      currency: currency || 'MAD',
    };

    // Test live connection if token provided
    if (accessToken && accessToken.trim()) {
      if (platform === 'META') {
        testResult = await testMetaConnection(accountId, accessToken);
      } else if (platform === 'TIKTOK') {
        testResult = await testTikTokConnection(accountId, accessToken);
      } else if (platform === 'GOOGLE') {
        testResult = await testGoogleConnection(accountId, undefined, accessToken);
      }
    }

    if (testOnly) {
      return NextResponse.json({
        success: testResult.success,
        accountName: testResult.accountName,
        currency: testResult.currency,
        error: testResult.error,
      });
    }

    // Auto-determine exchange rate from detected currency if not specified
    const resolvedCurrency = testResult.currency || currency || 'MAD';
    const resolvedRate = exchangeRateToMAD
      ? parseFloat(exchangeRateToMAD)
      : resolvedCurrency === 'MAD'
      ? 1.0
      : resolvedCurrency === 'EUR'
      ? 10.8
      : 10.0;

    const status = testResult.success ? 'CONNECTED' : accessToken ? 'ERROR' : 'DISCONNECTED';

    const integration = await prisma.adAccountIntegration.upsert({
      where: {
        platform_accountId: {
          platform,
          accountId,
        },
      },
      create: {
        platform,
        accountId,
        accountName: testResult.accountName || accountName || `${platform} Account`,
        accessToken: accessToken?.trim() || null,
        pixelId: pixelId || null,
        currency: resolvedCurrency,
        exchangeRateToMAD: resolvedRate,
        status,
        lastSyncStatus: testResult.success ? 'SUCCESS' : 'FAILED',
        errorMessage: testResult.error || null,
      },
      update: {
        accountName: testResult.accountName || accountName || undefined,
        accessToken: accessToken && accessToken.trim() ? accessToken.trim() : undefined,
        pixelId: pixelId !== undefined ? pixelId : undefined,
        currency: resolvedCurrency,
        exchangeRateToMAD: resolvedRate,
        status,
        errorMessage: testResult.error || null,
      },
    });

    return NextResponse.json({
      success: true,
      integration: {
        ...integration,
        accessToken: integration.accessToken
          ? `${integration.accessToken.slice(0, 6)}...${integration.accessToken.slice(-4)}`
          : null,
      },
      testResult,
    });
  } catch (error: any) {
    console.error('Error saving ad integration:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { errorResponse } = await requirePermission(req, 'marketing.manage_campaigns');
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Identifiant requis' }, { status: 400 });
    }

    await prisma.adAccountIntegration.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting ad integration:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
