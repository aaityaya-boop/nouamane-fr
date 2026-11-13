import { NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';
import { syncAllPurchaseOrdersExpenses } from '@/lib/syncSupplierExpenses';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(request, [
      'suppliers.manage_payments',
      'finance.edit_expense',
      'finance.add_expense',
    ]);
    if (errorResponse) return errorResponse;

    const result = await syncAllPurchaseOrdersExpenses();

    return NextResponse.json({
      success: true,
      message: `Synchronisation réussie : ${result.synced} charge(s) fournisseur liée(s) à la comptabilité & CA Net.`,
      result
    });
  } catch (error: any) {
    console.error('Error during bulk charge sync:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la synchronisation' }, { status: 500 });
  }
}
