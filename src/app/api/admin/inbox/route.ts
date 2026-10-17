import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { dispatchGenericEmail } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

function categorizeSubject(subject: string): { type: string; label: string; color: string } {
  const s = (subject || '').toLowerCase();
  if (s.includes('nayday') || s.includes('bienvenue') || s.includes('privilège') || s.includes('-10%')) {
    return { type: 'WELCOME_NAYDAY', label: 'Offre NAYDAY (-10%)', color: 'sky' };
  }
  if (s.includes('code de vérification') || s.includes('réinitialisation') || s.includes('sécurité') || s.includes('mot de passe')) {
    return { type: 'SECURITY', label: 'Sécurité & Accès', color: 'amber' };
  }
  if (s.includes('nouvel abonné') || s.includes('nouveau message') || s.includes('alerte direction') || s.includes('notification')) {
    return { type: 'ADMIN_ALERT', label: 'Alerte Interne', color: 'purple' };
  }
  if (s.includes('commande') || s.includes('facture') || s.includes('livraison')) {
    return { type: 'ORDER', label: 'Commande & Facture', color: 'emerald' };
  }
  if (s.includes('re:') || s.includes('réponse') || s.includes('support')) {
    return { type: 'SUPPORT', label: 'Service Client', color: 'blue' };
  }
  return { type: 'GENERAL', label: 'Communication Officielle', color: 'slate' };
}

export async function GET() {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    // 1. Fetch Contact Messages (Inbound)
    const receivedMessages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch Sent Emails (Outbound) from Resend API
    let sentEmails: any[] = [];
    let domainStatus = 'verified';

    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails?limit=100', {
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const resData = await res.json();
          if (Array.isArray(resData.data)) {
            sentEmails = resData.data.map((item: any) => {
              const cat = categorizeSubject(item.subject);
              const recipients = Array.isArray(item.to) ? item.to : [item.to];
              return {
                id: item.id,
                to: recipients,
                primaryTo: recipients[0] || 'Destinataire',
                from: item.from || 'NAY Parfums <contact@nayparfum.ma>',
                subject: item.subject || 'Sans objet',
                createdAt: item.created_at,
                lastEvent: item.last_event || 'sent',
                category: cat,
              };
            });
          }
        }
      } catch (resendErr) {
        console.warn('Could not fetch sent emails from Resend:', resendErr);
      }
    }

    // 3. Subscribers and Admins info
    const [subscribersCount, adminUsers] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.adminUser.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, email: true, role: true },
      }),
    ]);

    // Statistics
    const receivedUnreadCount = receivedMessages.filter((m) => m.status === 'unread').length;
    const sentDeliveredCount = sentEmails.filter((m) => m.lastEvent === 'delivered').length;

    return NextResponse.json({
      success: true,
      received: receivedMessages,
      sent: sentEmails,
      proMailInfo: {
        email: 'contact@nayparfum.ma',
        domain: 'nayparfum.ma',
        domainStatus,
        region: 'eu-west-1 (Europe)',
        provider: 'Resend API • Domaine nayparfum.ma Authentifié',
        subscribersCount,
        adminUsers,
      },
      stats: {
        receivedTotal: receivedMessages.length,
        receivedUnread: receivedUnreadCount,
        sentTotal: sentEmails.length,
        sentDelivered: sentDeliveredCount,
        deliveryRate: sentEmails.length > 0 ? Math.round((sentDeliveredCount / sentEmails.length) * 100) : 100,
      },
    });
  } catch (error: any) {
    console.error('Error fetching inbox data:', error);
    return NextResponse.json({ error: error?.message || 'Erreur lors du chargement de la messagerie' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, message, html, contactMessageId } = body;

    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'Destinataire email invalide' }, { status: 400 });
    }
    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Le sujet est requis' }, { status: 400 });
    }
    if (!message && !html) {
      return NextResponse.json({ error: 'Le contenu du message est requis' }, { status: 400 });
    }

    const cleanTo = to.trim().toLowerCase();
    const cleanSubject = subject.trim();

    // Generate Luxury Branded HTML if only plain message provided
    const formattedHtml =
      html ||
      `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  body { margin:0; padding:0; background:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; }
  .box { max-width:600px; margin:28px auto; background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 10px 30px rgba(15,23,42,0.05); }
  .header { background:#0e1d34; padding:32px 28px; text-align:center; color:#ffffff; }
  .content { padding:36px 32px; font-size:14px; line-height:1.75; color:#334155; }
  .msg-block { background:#f8fafc; border-left:4px solid #0ea5e9; padding:18px 20px; border-radius:8px; margin:20px 0; font-size:14px; color:#0f172a; white-space:pre-wrap; }
  .footer { padding:22px 28px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center; }
  .brand { font-family:Georgia,serif; font-size:18px; letter-spacing:2px; font-weight:700; color:#ffffff; }
</style>
</head>
<body>
<div class="box">
  <div class="header">
    <div class="brand">NAY PARFUMS</div>
    <div style="font-size:10px; letter-spacing:2.5px; color:#94a3b8; text-transform:uppercase; margin-top:6px;">HAUTE PARFUMERIE • PARIS &amp; MAROC</div>
  </div>
  <div class="content">
    <div class="msg-block">
${(message || '').replace(/\n/g, '<br>')}
    </div>
    <p style="margin-top:24px; font-size:13px; color:#475569;">
      Pour toute question complémentaire, notre service client est également disponible 7j/7 directement sur notre ligne WhatsApp officielle au <strong>+212 663-380011</strong>.
    </p>
    <div style="margin-top:24px; border-top:1px solid #e2e8f0; padding-top:18px;">
      <strong style="color:#0f172a; font-size:14px;">L'Équipe NAY Parfums</strong><br>
      <span style="font-size:12px; color:#64748b;">Maison de Haute Parfumerie &amp; Testeurs Authentiques</span><br>
      <a href="https://nayparfum.ma" style="color:#0ea5e9; text-decoration:none; font-size:12px;">nayparfum.ma</a>
    </div>
  </div>
  <div class="footer">
    NAY Parfums • Casablanca &amp; Tout le Maroc • contact@nayparfum.ma<br>
    Ce message a été envoyé depuis notre messagerie officielle sécurisée.
  </div>
</div>
</body>
</html>`;

    const result = await dispatchGenericEmail({
      to: cleanTo,
      subject: cleanSubject,
      html: formattedHtml,
      text: message || undefined,
    });

    if (result.success && contactMessageId) {
      try {
        await prisma.contactMessage.update({
          where: { id: contactMessageId },
          data: { status: 'replied' },
        });
      } catch (updErr) {
        console.warn('Could not update contactMessage status to replied:', updErr);
      }
    }

    return NextResponse.json({ success: result.success, result });
  } catch (error: any) {
    console.error('Error sending email from inbox API:', error);
    return NextResponse.json({ error: error?.message || 'Erreur lors de l\'envoi de l\'email' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'ID et statut requis' }, { status: 400 });
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    console.error('Error updating message status:', error);
    return NextResponse.json({ error: error?.message || 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await prisma.contactMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting contact message:', error);
    return NextResponse.json({ error: error?.message || 'Erreur lors de la suppression' }, { status: 500 });
  }
}
