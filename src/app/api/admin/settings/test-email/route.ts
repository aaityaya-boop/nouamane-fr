import { NextResponse } from 'next/server';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';
import { sendTestNotificationEmail } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { user: admin, errorResponse } = await requireAnyPermission(req, [
      'settings.view',
      'settings.edit',
      'settings.manage_security',
    ]);
    if (errorResponse || !admin) return errorResponse!;

    const { targetEmail } = await req.json();
    const emailToSend = (targetEmail || admin.email || 'contact@nayparfum.ma').trim().toLowerCase();

    if (!emailToSend.includes('@')) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
    }

    const result = await sendTestNotificationEmail(emailToSend);

    return NextResponse.json({
      success: result.success,
      channel: result.channel,
      messageId: result.messageId,
      error: result.error,
    });
  } catch (error: any) {
    console.error('Error sending test notification email:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors du test email' },
      { status: 500 }
    );
  }
}
