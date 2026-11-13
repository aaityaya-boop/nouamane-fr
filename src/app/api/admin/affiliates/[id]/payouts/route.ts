import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { errorResponse } = await requireAnyPermission(request, ['marketing.manage_affiliates', 'finance.add_expense']);
  if (errorResponse) return errorResponse;

  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Ambassadeur introuvable' }, { status: 404 });
    }

    const data = await request.json();
    const { amount, method, reference, notes, proofUrl } = data;

    const payoutAmount = Number(amount);
    if (!payoutAmount || payoutAmount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const [payout, updatedAffiliate] = await prisma.$transaction([
      prisma.affiliatePayout.create({
        data: {
          affiliateId: affiliate.id,
          amount: payoutAmount,
          method: method || affiliate.paymentMethod || 'VIREMENT_BANCAIRE',
          reference: reference || `VIR-${Date.now().toString(36).toUpperCase()}`,
          notes: notes || null,
          proofUrl: proofUrl || null,
          paidAt: new Date(),
        },
      }),
      prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          commissionPaid: { increment: payoutAmount },
        },
      }),
      // Automatically record as an Expense in Finance
      prisma.adminExpense.create({
        data: {
          title: `Commission Ambassadeur: ${affiliate.name} (@${affiliate.code})`,
          category: 'SALARY',
          amount: payoutAmount,
          description: `Virement commission partenaire NAY. Réf: ${reference || 'Auto'} - Notes: ${notes || 'Règlement régulier'}`,
          paymentMethod: 'BANK_TRANSFER',
          recurring: 'ONE_TIME',
          creatorName: 'Administration NAY',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      payout,
      updatedAffiliate,
    });
  } catch (error: any) {
    console.error('Error recording payout:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de l\'enregistrement du virement' },
      { status: 500 }
    );
  }
}
