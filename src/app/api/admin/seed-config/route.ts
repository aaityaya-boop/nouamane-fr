import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await requirePermission(request, 'settings.manage_security');
    if (errorResponse || !user) return errorResponse!;

    if (user.role !== 'OWNER' && user.role !== 'CO_OWNER') {
      return NextResponse.json(
        { error: 'Seuls les fondateurs (OWNER) peuvent exécuter cette opération.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
      return NextResponse.json(
        { error: 'Les opérations de seed sont désactivées en production.', code: 'PRODUCTION_SEED_DISABLED' },
        { status: 403 }
      );
    }

    const configCount = await prisma.siteConfig.count();
    
    if (configCount === 0) {
      await prisma.siteConfig.create({
        data: {
          shippingFee: 35,
          contactPhone: "+212 663-380011",
          contactEmail: "contact@nayparfum.ma",
          heroTitle: "L'Essence de l'Élégance",
          heroSubtitle: "Découvrez notre collection de parfums de luxe, conçue pour laisser une empreinte inoubliable.",
        }
      });
      return NextResponse.json({ success: true, message: "Site config seeded" });
    }
    
    return NextResponse.json({ success: true, message: "Site config already exists" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to seed site config' }, { status: 500 });
  }
}
