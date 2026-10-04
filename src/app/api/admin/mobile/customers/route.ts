import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { getUnifiedCustomers } from '@/lib/unifiedCustomers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('q') || '').toLowerCase().trim();
    const filter = searchParams.get('filter') || 'all'; // all, vip, frequent, returns

    const allCustomers = await getUnifiedCustomers();

    let filtered = allCustomers;

    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.cleanPhone.includes(search) ||
          (c.email && c.email.toLowerCase().includes(search)) ||
          (c.city && c.city.toLowerCase().includes(search))
      );
    }

    if (filter === 'vip') {
      filtered = filtered.filter((c) => c.isVip || c.tier === 'DIAMOND' || c.tier === 'GOLD');
    } else if (filter === 'frequent') {
      filtered = filtered.filter((c) => c.ordersCount >= 2);
    }

    // Limit to top 50 for mobile responsiveness
    const paginated = filtered.slice(0, 60);

    return NextResponse.json({
      success: true,
      totalCount: filtered.length,
      customers: paginated,
    });
  } catch (error: any) {
    console.error('[Mobile Customers API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors du chargement des clients' },
      { status: 500 }
    );
  }
}
