import { NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/gsc';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(req: Request) {
  try {
    const auth = await requirePermission(req, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const oauth2Client = getOAuth2Client();
    
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
      prompt: 'consent'
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Error generating GSC auth URL:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}

