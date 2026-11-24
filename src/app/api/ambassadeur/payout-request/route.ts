import { NextResponse } from 'next/server';
import { getCurrentAmbassador } from '@/lib/affiliate-auth';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const ambassador = await getCurrentAmbassador();
    if (!ambassador) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const rate = checkRateLimit(`amb_payout:${ambassador.id}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Trop de demandes de paiement récentes. Veuillez patienter avant d’en soumettre une nouvelle.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { amount: rawAmount, note, bankRib } = body;
    const amount = Number(rawAmount);

    const availableBalance = Math.max(0, ambassador.commissionEarned - ambassador.commissionPaid);

    if (!Number.isFinite(amount) || amount <= 0 || amount > availableBalance) {
      return NextResponse.json(
        { error: 'Montant invalide ou supérieur au solde disponible.' },
        { status: 400 }
      );
    }

    const safeRib = typeof bankRib === 'string' && bankRib.trim() ? bankRib.trim().slice(0, 60) : (ambassador.bankRib || 'Non renseigné');
    const safeNote = typeof note === 'string' ? note.trim().slice(0, 300) : '';

    // Create an admin notification for payout request
    try {
      await prisma.adminNotification.create({
        data: {
          type: 'SYSTEM',
          title: `Demande de Virement Ambassadeur: ${ambassador.name}`,
          message: `${ambassador.name} (@${ambassador.code}) demande un virement de ${amount.toFixed(2)} MAD. RIB: ${safeRib}`,
          link: `/admin/affiliates/${ambassador.id}`,
          metadata: JSON.stringify({ affiliateId: ambassador.id, amount, note: safeNote }),
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify admin of payout request:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Votre demande de paiement a été envoyée avec succès à la direction financière NAY.',
    });
  } catch (error) {
    console.error('Error creating payout request:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
