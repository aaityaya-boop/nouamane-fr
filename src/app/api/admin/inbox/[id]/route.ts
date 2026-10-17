import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getEffectiveResendKey(): Promise<string | null> {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  try {
    const config = await prisma.siteConfig.findFirst({
      select: { resendApiKey: true },
    });
    if (config?.resendApiKey) return config.resendApiKey;
  } catch (e) {
    console.warn('Could not read SiteConfig resendApiKey:', e);
  }
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resendApiKey = await getEffectiveResendKey();

    if (!resendApiKey) {
      return NextResponse.json({ error: 'Clé Resend non configurée' }, { status: 500 });
    }

    const res = await fetch(`https://api.resend.com/emails/${id}`, {
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.message || 'Impossible de récupérer les détails de l\'email' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, email: data });
  } catch (error: any) {
    console.error('Error fetching email details:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur interne' },
      { status: 500 }
    );
  }
}
