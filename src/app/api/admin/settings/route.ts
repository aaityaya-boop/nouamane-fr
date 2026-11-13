import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';
import { hasPermission } from '@/lib/auth/rbac/accessControl';

function sanitizeAdminSiteConfig(config: any) {
  if (!config) return {};
  const { adminPassword, smtpPass, resendApiKey, ...safeConfig } = config;
  return {
    ...safeConfig,
    hasSmtpPass: Boolean(smtpPass),
    hasResendApiKey: Boolean(resendApiKey),
  };
}

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requirePermission(request, 'settings.view');
    if (errorResponse) return errorResponse;

    let config = await prisma.siteConfig.findFirst();
    if (!config) {
      config = await prisma.siteConfig.create({
        data: {}
      });
    }
    return NextResponse.json(sanitizeAdminSiteConfig(config));
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user, errorResponse } = await requirePermission(request, 'settings.edit');
    if (errorResponse || !user) return errorResponse!;

    const body = await request.json();

    let config = await prisma.siteConfig.findFirst();
    
    if (!config) {
      config = await prisma.siteConfig.create({ data: {} });
    }

    const isModifyingSecurityFields =
      (body.smtpHost !== undefined && body.smtpHost !== config.smtpHost) ||
      (body.smtpPort !== undefined && Number(body.smtpPort) !== config.smtpPort) ||
      (body.smtpUser !== undefined && body.smtpUser !== config.smtpUser) ||
      (typeof body.smtpPass === 'string' && body.smtpPass.length > 0) ||
      (body.smtpFrom !== undefined && body.smtpFrom !== config.smtpFrom) ||
      (typeof body.resendApiKey === 'string' && body.resendApiKey.length > 0);

    if (isModifyingSecurityFields && !hasPermission(user, 'settings.manage_security')) {
      return NextResponse.json(
        { error: 'Privilèges insuffisants pour modifier la configuration SMTP/sécurité.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const updatedConfig = await prisma.siteConfig.update({
      where: { id: config.id },
      data: {
        adminUsername: body.adminUsername !== undefined ? body.adminUsername : undefined,
        shippingFee: body.shippingFee !== undefined ? Number(body.shippingFee) : undefined,
        contactPhone: body.contactPhone !== undefined ? body.contactPhone : undefined,
        contactEmail: body.contactEmail !== undefined ? body.contactEmail : undefined,
        heroTitle: body.heroTitle !== undefined ? body.heroTitle : undefined,
        heroSubtitle: body.heroSubtitle !== undefined ? body.heroSubtitle : undefined,
        instagramUrl: body.instagramUrl !== undefined ? body.instagramUrl : undefined,
        facebookUrl: body.facebookUrl !== undefined ? body.facebookUrl : undefined,
        tiktokUrl: body.tiktokUrl !== undefined ? body.tiktokUrl : undefined,
        whatsappUrl: body.whatsappUrl !== undefined ? body.whatsappUrl : undefined,
        monthlyRevenueGoal: body.monthlyRevenueGoal !== undefined ? Number(body.monthlyRevenueGoal) : undefined,
        featuredBestsellers: body.featuredBestsellers !== undefined ? body.featuredBestsellers : undefined,
        featuredSeasonal: body.featuredSeasonal !== undefined ? body.featuredSeasonal : undefined,
        featuredLatest: body.featuredLatest !== undefined ? body.featuredLatest : undefined,
        coffretsCoverImage: body.coffretsCoverImage !== undefined ? body.coffretsCoverImage : undefined,
        seasonalTrendTitle: body.seasonalTrendTitle !== undefined ? body.seasonalTrendTitle : undefined,
        seasonalTrendSubtitle: body.seasonalTrendSubtitle !== undefined ? body.seasonalTrendSubtitle : undefined,
        recommendedShop: body.recommendedShop !== undefined ? body.recommendedShop : undefined,
        recommendedMen: body.recommendedMen !== undefined ? body.recommendedMen : undefined,
        recommendedWomen: body.recommendedWomen !== undefined ? body.recommendedWomen : undefined,
        recommendedUnisex: body.recommendedUnisex !== undefined ? body.recommendedUnisex : undefined,
        recommendedOriental: body.recommendedOriental !== undefined ? body.recommendedOriental : undefined,
        recommendedMaster: body.recommendedMaster !== undefined ? body.recommendedMaster : undefined,
        recommendedCoffrets: body.recommendedCoffrets !== undefined ? body.recommendedCoffrets : undefined,
        ...(body.recommendedTesters !== undefined ? { recommendedTesters: body.recommendedTesters } : {}),
        ...(body.smtpHost !== undefined ? { smtpHost: body.smtpHost } : {}),
        ...(body.smtpPort !== undefined ? { smtpPort: Number(body.smtpPort) } : {}),
        ...(body.smtpUser !== undefined ? { smtpUser: body.smtpUser } : {}),
        ...(body.smtpPass !== undefined && body.smtpPass !== '' ? { smtpPass: body.smtpPass } : {}),
        ...(body.smtpFrom !== undefined ? { smtpFrom: body.smtpFrom } : {}),
        ...(typeof body.resendApiKey === 'string' && body.resendApiKey !== '' ? { resendApiKey: body.resendApiKey } : {}),
      } as any
    });

    return NextResponse.json(sanitizeAdminSiteConfig(updatedConfig));
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
