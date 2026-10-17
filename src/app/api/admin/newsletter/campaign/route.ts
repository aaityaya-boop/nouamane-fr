import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { dispatchGenericEmail } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      subject,
      headline,
      message,
      promoCode,
      ctaText,
      ctaLink,
      target,
      testEmail,
    } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'L\'objet de la campagne est requis' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Le contenu de la campagne est requis' }, { status: 400 });
    }

    const cleanSubject = subject.trim();
    const cleanHeadline = headline ? headline.trim() : 'Votre privilège exclusif';
    const cleanCtaText = ctaText ? ctaText.trim() : 'Découvrir la Boutique';
    const cleanCtaLink = ctaLink ? ctaLink.trim() : 'https://nayparfum.ma/fr/shop';
    const cleanPromo = promoCode ? promoCode.trim() : '';

    // Generate Luxury Branded HTML
    const formattedHtml = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${cleanSubject}</title>
<style>
  body { margin:0; padding:0; background-color:#f4f5f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#0f172a; }
  .box { max-width:620px; margin:28px auto; background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 12px 36px rgba(15,23,42,0.06); }
  .header { background:#0e1d34; padding:32px 24px; text-align:center; color:#ffffff; }
  .badge { display:inline-block; background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:4px 14px; border-radius:999px; font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; }
  .content { padding:38px 32px; font-size:14px; line-height:1.75; color:#334155; }
  .headline { font-family:Georgia,serif; font-size:24px; line-height:1.25; color:#0e1d34; text-align:center; margin-bottom:20px; }
  .msg-body { font-size:14px; line-height:1.8; color:#475569; text-align:center; max-width:520px; margin:0 auto 24px auto; white-space:pre-wrap; }
  .promo-card { background:linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%); border:2px dashed #38bdf8; border-radius:14px; padding:20px; text-align:center; margin:24px 0; }
  .cta-btn { display:inline-block; background:#189fe3; color:#ffffff !important; text-decoration:none; font-size:13px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; padding:16px 36px; border-radius:999px; margin-top:8px; }
  .footer { padding:24px 28px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center; line-height:1.8; }
</style>
</head>
<body>
<div class="box">
  <div class="header">
    <div class="badge">Maison NAY Parfums • Privilège Abonnés</div>
    <div style="font-family:Georgia,serif; font-size:20px; letter-spacing:2px; font-weight:700; color:#ffffff;">NAY PARFUMS</div>
    <div style="font-size:10px; letter-spacing:2.5px; color:#94a3b8; text-transform:uppercase; margin-top:6px;">HAUTE PARFUMERIE • PARIS &amp; MAROC</div>
  </div>

  <div class="content">
    <div class="headline">${cleanHeadline}</div>
    <div class="msg-body">${message.replace(/\n/g, '<br>')}</div>

    ${cleanPromo ? `
    <div class="promo-card">
      <div style="font-size:10px; font-weight:800; letter-spacing:1.5px; color:#64748b; text-transform:uppercase;">Votre Code Privilège :</div>
      <div style="font-family:monospace; font-size:26px; font-weight:900; letter-spacing:4px; color:#0284c7; margin-top:4px;">${cleanPromo}</div>
      <div style="font-size:11px; color:#64748b; margin-top:4px;">À renseigner lors de la commande pour activer votre réduction</div>
    </div>` : ''}

    <div style="text-align:center; margin-top:24px;">
      <a href="${cleanCtaLink}" class="cta-btn">${cleanCtaText}</a>
    </div>

    <div style="margin-top:32px; padding:16px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; text-align:center; font-size:12px; color:#475569;">
      Livraison rapide partout au Maroc · Paiement sécurisé à la livraison · Flacons 100% Authentiques
    </div>
  </div>

  <div class="footer">
    NAY Parfums • Casablanca &amp; Tout le Maroc • <a href="mailto:contact@nayparfum.ma" style="color:#0ea5e9; text-decoration:none;">contact@nayparfum.ma</a><br>
    Besoin d'aide ou commande par téléphone ? WhatsApp officiel : <strong>+212 663-380011</strong><br>
    <span style="font-size:10px; color:#94a3b8;">Vous recevez cet email suite à votre inscription sur nayparfum.ma.</span>
  </div>
</div>
</body>
</html>`;

    // Mode 1: Test Email
    if (target === 'test') {
      if (!testEmail || !testEmail.includes('@')) {
        return NextResponse.json({ error: 'Adresse email de test invalide' }, { status: 400 });
      }
      const res = await dispatchGenericEmail({
        to: testEmail.trim().toLowerCase(),
        subject: cleanSubject,
        html: formattedHtml,
      });
      return NextResponse.json({ success: res.success, result: res });
    }

    // Mode 2: Broadcast to Audience
    const subscribers = await prisma.newsletterSubscriber.findMany({
      select: { email: true },
      orderBy: { createdAt: 'desc' },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ error: 'Aucun abonné dans la liste' }, { status: 400 });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < subscribers.length; i++) {
      const targetEmail = subscribers[i].email.trim().toLowerCase();
      try {
        const res = await dispatchGenericEmail({
          to: targetEmail,
          subject: cleanSubject,
          html: formattedHtml,
        });
        if (res.success) {
          sentCount++;
        }
      } catch (err: any) {
        errors.push(`${targetEmail}: ${err?.message || 'Erreur'}`);
      }
      // Rate limiting: 200ms
      await delay(200);
    }

    return NextResponse.json({
      success: true,
      sentCount,
      totalRequested: subscribers.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error: any) {
    console.error('Error sending campaign:', error);
    return NextResponse.json({ error: error?.message || 'Erreur lors de l\'envoi de la campagne' }, { status: 500 });
  }
}
