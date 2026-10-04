import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { dispatchAdminNotification, NotificationCategory } from '@/lib/push/notificationDispatcher';

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const category: NotificationCategory = body.category || 'ORDER';

    let title = 'Nouvelle commande 🛍️';
    let message = 'Commande #NF-9842 • 420 DH (Mohammedia)';
    let url = '/admin/orders';

    if (category === 'STOCK') {
      title = 'Stock faible ⚠️';
      message = 'Bois d\'Argent 100ml : seulement 2 unités restantes';
      url = '/admin/inventory';
    } else if (category === 'FINANCE') {
      title = 'Encaissement à vérifier 💳';
      message = 'Versement bancaire de 1 250 DH à valider';
      url = '/admin/finance';
    } else if (category === 'SECURITY') {
      title = 'Alerte de sécurité 🛡️';
      message = `Connexion réussie depuis un nouvel appareil (${admin.name})`;
      url = '/admin/team';
    } else if (category === 'SYSTEM') {
      title = 'Message système NAY 📢';
      message = 'Le service de notifications Web Push est opérationnel';
      url = '/admin/notifications';
    }

    // Send push exclusively to current admin
    const result = await dispatchAdminNotification({
      category,
      title,
      body: message,
      url,
      targetUserId: admin.id,
      metadata: { isTest: true, initiatedBy: admin.email },
      saveInDb: true,
    });

    return NextResponse.json({
      success: true,
      message:
        result.pushedCount > 0
          ? `Notification test envoyée avec succès à ${result.pushedCount} appareil(s)`
          : `Aucun appareil actif n'est actuellement abonné pour ${admin.name}. Cliquez sur "Activer les notifications" d'abord.`,
      result,
    });
  } catch (error: any) {
    console.error('[Push Test API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de l\'envoi de la notification test' },
      { status: 500 }
    );
  }
}
