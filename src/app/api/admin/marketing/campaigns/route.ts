import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

const ALLOWED_STATUSES = ['DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'SENT', 'CANCELLED'] as const;

export async function GET(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['marketing.view', 'marketing.manage_campaigns']);
    if (errorResponse) return errorResponse;

    const campaigns = await prisma.marketingCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur chargement campagnes';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['marketing.manage_campaigns', 'marketing.view']);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const name = String(body.name || '').trim() || 'Campagne Rétention NAY';
    const channel = body.channel === 'EMAIL' ? 'EMAIL' : 'WHATSAPP';
    const type = String(body.type || 'PROMOTION').trim();
    const audience = String(body.audience || 'ALL').trim();
    const subject = body.subject ? String(body.subject).trim() : null;
    const message = String(body.message || '').trim();
    const status = ALLOWED_STATUSES.includes(body.status) ? body.status : 'DRAFT';
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

    if (!message) {
      return NextResponse.json({ error: 'Le message de campagne est requis.' }, { status: 400 });
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        name,
        channel,
        type,
        audience,
        subject,
        message,
        status,
        scheduledAt: scheduledAt && !isNaN(scheduledAt.getTime()) ? scheduledAt : null,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur création campagne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['marketing.manage_campaigns', 'marketing.view']);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const id = String(body.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'ID campagne requis.' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.status && ALLOWED_STATUSES.includes(body.status)) {
      data.status = body.status;
    }
    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (typeof body.message === 'string' && body.message.trim()) {
      data.message = body.message.trim();
    }

    const updated = await prisma.marketingCampaign.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur mise à jour campagne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['marketing.manage_campaigns', 'marketing.view']);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID campagne manquant.' }, { status: 400 });
    }

    await prisma.marketingCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur suppression campagne';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
