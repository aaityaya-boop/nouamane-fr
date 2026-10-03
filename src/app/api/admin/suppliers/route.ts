import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tier = searchParams.get('tier');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (tier && tier !== 'ALL') {
      where.tier = tier;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ success: true, suppliers });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors du chargement des fournisseurs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();

    // Auto-generate code if empty (e.g. FRN-001)
    let code = data.code ? data.code.trim().toUpperCase() : '';
    if (!code) {
      const count = await prisma.supplier.count();
      code = `FRN-${String(count + 1).padStart(3, '0')}`;
    }

    // Check unique code collision
    const existing = await prisma.supplier.findUnique({ where: { code } });
    if (existing) {
      code = `${code}-${Date.now().toString().slice(-3)}`;
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name || 'Nouveau Partenaire Stratégique',
        code,
        category: data.category || 'PARFUMS',
        tier: data.tier || 'TIER_1',
        contactName: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        city: data.city || 'Casablanca',
        country: data.country || 'MA',
        address: data.address || null,
        taxId: data.taxId || null,
        incoterms: data.incoterms || 'DDP',
        certifications: typeof data.certifications === 'string' ? data.certifications : JSON.stringify(data.certifications || ['IFRA Standard', 'ISO 22716 BPF']),
        currency: data.currency || 'MAD',
        minOrderValueMAD: Number(data.minOrderValueMAD) || 0,
        paymentTerms: data.paymentTerms || 'A_LA_LIVRAISON',
        bankName: data.bankName || null,
        bankRib: data.bankRib || null,
        leadTimeDays: Number(data.leadTimeDays) || 3,
        rating: Number(data.rating) || 5.0,
        qualityScore: Number(data.qualityScore) || 99.0,
        onTimeDeliveryRate: Number(data.onTimeDeliveryRate) || 98.0,
        status: data.status || 'ACTIVE',
        notes: data.notes || null,
        suppliedProducts: typeof data.suppliedProducts === 'string' ? data.suppliedProducts : JSON.stringify(data.suppliedProducts || []),
        pricingList: typeof data.pricingList === 'string' ? data.pricingList : JSON.stringify(data.pricingList || []),
        contractUrl: data.contractUrl || null
      }
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la création du fournisseur' }, { status: 500 });
  }
}
