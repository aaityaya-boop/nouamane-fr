import { NextResponse } from 'next/server';
import { createAdminNotification } from '@/lib/notificationService';
import { requireAdmin } from '@/lib/auth/rbac/serverGuard';

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response!;
    const body = await req.json().catch(() => ({}));
    const testType = body.type || 'ORDER';

    let notif;
    if (testType === 'ORDER') {
      const orderNum = `NF-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
      notif = await createAdminNotification({
        type: 'ORDER',
        title: `Nouvelle Commande #${orderNum} (334 MAD)`,
        message: `Boutaina El Houmri a passé commande (Casablanca) - 1x Baccarat Rouge 540 Testeur`,
        link: '/admin/orders',
        metadata: { orderNumber: orderNum, total: 334, customerName: 'Boutaina El Houmri', city: 'Casablanca' },
      });
    } else if (testType === 'STOCK') {
      notif = await createAdminNotification({
        type: 'STOCK',
        title: `Alerte Rupture : Parfums De Marly Layton`,
        message: `Le stock est désormais épuisé (0 flacon restant).`,
        link: '/admin/inventory',
      });
    } else {
      notif = await createAdminNotification({
        type: 'SYSTEM',
        title: `Test Système de Notification NAY`,
        message: `Vérification du flux temps réel : son, toast et alertes opérationnels.`,
        link: '/admin/notifications',
      });
    }

    return NextResponse.json({ success: true, notification: notif });
  } catch (error: any) {
    console.error('Error generating test notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
