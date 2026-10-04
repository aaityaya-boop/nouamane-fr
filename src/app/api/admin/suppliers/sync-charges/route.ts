import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { syncAllPurchaseOrdersExpenses } from '@/lib/syncSupplierExpenses';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

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
