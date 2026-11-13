import { NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/gsc';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

const encrypt = (text: string) => Buffer.from(text).toString('base64');

export async function GET(request: Request) {
  try {
    const auth = await requirePermission(request, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Remove old connection if exists to avoid duplicates
    await prisma.googleSearchConsoleConnection.deleteMany();

    // Save to DB
    await prisma.googleSearchConsoleConnection.create({
      data: {
        propertyUrl: process.env.NEXT_PUBLIC_SITE_URL || 'sc-domain:nayparfum.ma',
        accessTokenEncrypted: encrypt(tokens.access_token!),
        refreshTokenEncrypted: encrypt(tokens.refresh_token || ''), 
        tokenExpiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        scopes: tokens.scope || 'https://www.googleapis.com/auth/webmasters.readonly',
        connectedBy: 'Admin',
      }
    });

    // Update settings
    let settings = await prisma.seoSettings.findFirst();
    if (!settings) {
      settings = await prisma.seoSettings.create({
        data: {
          siteName: 'NAY Parfum',
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://nayparfum.ma'
        }
      });
    }

    await prisma.seoSettings.update({
      where: { id: settings.id },
      data: {
        googleSearchConsoleConnected: true,
        googlePropertyUrl: 'sc-domain:nayparfum.ma'
      }
    });

    return NextResponse.redirect(new URL('/admin/seo', request.url));
  } catch (error) {
    console.error('Error in GSC callback:', error);
    return NextResponse.redirect(new URL('/admin/seo?error=gsc_auth_failed', request.url));
  }
}

