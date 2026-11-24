import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

async function getOrCreateSettings() {
  const existing = await prisma.marketingSettings.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;

  return prisma.marketingSettings.create({
    data: {
      whatsappConfigured: true,
      emailConfigured: true,
      automationEnabled: true,
    },
  });
}

export async function GET(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['marketing.view', 'marketing.manage_campaigns']);
    if (errorResponse) return errorResponse;

    const settings = await getOrCreateSettings();
    return NextResponse.json({ settings });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur lecture paramètres';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, ['marketing.manage_campaigns', 'marketing.view']);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const current = await getOrCreateSettings();

    const updated = await prisma.marketingSettings.update({
      where: { id: current.id },
      data: {
        emailConfigured:
          typeof body.emailConfigured === 'boolean' ? body.emailConfigured : current.emailConfigured,
        whatsappConfigured:
          typeof body.whatsappConfigured === 'boolean' ? body.whatsappConfigured : current.whatsappConfigured,
        automationEnabled:
          typeof body.automationEnabled === 'boolean' ? body.automationEnabled : current.automationEnabled,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur sauvegarde paramètres';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
