import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Fournisseur introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        category: data.category,
        tier: data.tier,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        city: data.city,
        country: data.country,
        address: data.address,
        taxId: data.taxId,
        incoterms: data.incoterms,
        certifications: typeof data.certifications === 'string' ? data.certifications : (data.certifications ? JSON.stringify(data.certifications) : undefined),
        currency: data.currency,
        minOrderValueMAD: data.minOrderValueMAD !== undefined ? Number(data.minOrderValueMAD) : undefined,
        paymentTerms: data.paymentTerms,
        bankName: data.bankName,
        bankRib: data.bankRib,
        leadTimeDays: data.leadTimeDays !== undefined ? Number(data.leadTimeDays) : undefined,
        rating: data.rating !== undefined ? Number(data.rating) : undefined,
        qualityScore: data.qualityScore !== undefined ? Number(data.qualityScore) : undefined,
        onTimeDeliveryRate: data.onTimeDeliveryRate !== undefined ? Number(data.onTimeDeliveryRate) : undefined,
        status: data.status,
        notes: data.notes,
        pricingList: typeof data.pricingList === 'string' ? data.pricingList : (data.pricingList ? JSON.stringify(data.pricingList) : undefined),
        contractUrl: data.contractUrl,
        suppliedProducts: typeof data.suppliedProducts === 'string' ? data.suppliedProducts : (data.suppliedProducts ? JSON.stringify(data.suppliedProducts) : undefined)
      }
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.supplier.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Fournisseur supprimé avec succès' });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la suppression' }, { status: 500 });
  }
}
