import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

export const NAYDAY_EMAIL_SUBJECT = 'OFFRE NAYDAY — Votre sélection, encore plus avantageuse (−10% avec le code NAYDAY)';

export const NAYDAY_EMAIL_HTML = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>NAYDAY — NAY Parfum</title>
<style>
  body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; display:block; }
  table { border-collapse:collapse !important; }
  body { margin:0 !important; padding:0 !important; width:100% !important; background:#f4f5f7; }
  @media screen and (max-width:640px) {
    .container { width:100% !important; }
    .px { padding-left:22px !important; padding-right:22px !important; }
    .hero-title { font-size:38px !important; line-height:1.05 !important; }
    .product-col { display:block !important; width:100% !important; }
    .product-card { padding:0 0 24px 0 !important; }
    .product-img { width:78% !important; max-width:320px !important; height:auto !important; }
    .cta { width:100% !important; box-sizing:border-box; }
  }
</style>
</head>
<body>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f5f7">
  <tr>
    <td align="center" style="padding:24px 10px;">
      <table role="presentation" class="container" width="640" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:640px;max-width:640px;background:#ffffff;">

        <!-- Header -->
        <tr>
          <td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #eceff3;">
            <img src="https://nayparfum.ma/images/nay/nay-logo-tight.png" width="170" alt="NAY Parfum" style="width:170px;max-width:170px;height:auto;display:block;margin:0 auto;">
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td class="px" align="center" style="padding:54px 46px 24px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3.4px;color:#189fe3;text-transform:uppercase;font-weight:700;">
              OFFRE NAYDAY
            </div>
            <div class="hero-title" style="font-family:Georgia,'Times New Roman',serif;font-size:48px;line-height:1.08;color:#0e1d34;margin-top:14px;">
              Votre sélection,<br>encore plus avantageuse.
            </div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#5c6470;margin-top:18px;">
              Achetez <strong>plus de 2 parfums</strong> et profitez de <strong style="color:#189fe3;">−10%</strong> sur votre commande.
            </div>
          </td>
        </tr>

        <!-- Promo code -->
        <tr>
          <td class="px" style="padding:10px 46px 38px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0e1d34;">
              <tr>
                <td align="center" style="padding:28px 24px;">
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;color:#b8c6d8;text-transform:uppercase;">CODE PROMO</div>
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:32px;line-height:1.2;color:#ffffff;font-weight:800;letter-spacing:5px;margin-top:8px;">NAYDAY</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- 2 products -->
        <tr>
          <td class="px" style="padding:0 34px 10px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td class="product-col" width="50%" valign="top" style="width:50%;padding-right:9px;">
                  <table role="presentation" class="product-card" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e9edf2;background:#ffffff;">
                    <tr>
                      <td align="center" style="padding:22px 18px 8px;">
                        <img class="product-img" src="https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/1784029115159-214358233-Miss_Dior_parfum.jpg" width="245" alt="Miss Dior Parfum" style="width:245px;max-width:100%;height:auto;">
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:10px 20px 24px;">
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;color:#8a929c;text-transform:uppercase;">POUR ELLE</div>
                        <div style="font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.2;color:#0e1d34;margin-top:8px;">Miss Dior Parfum</div>
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5c6470;margin-top:7px;">Chypré fruité · 100 ml</div>
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#0e1d34;font-weight:700;margin-top:12px;">299 DH</div>
                        <div style="margin-top:18px;">
                          <a href="https://nayparfum.ma/fr/product/miss-dior-parfum-tester" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1.2px;color:#0e1d34;text-decoration:none;border-bottom:1px solid #0e1d34;padding-bottom:4px;">DÉCOUVRIR</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>

                <td class="product-col" width="50%" valign="top" style="width:50%;padding-left:9px;">
                  <table role="presentation" class="product-card" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e9edf2;background:#ffffff;">
                    <tr>
                      <td align="center" style="padding:22px 18px 8px;">
                        <img class="product-img" src="https://l3qgcdajft9wdkxz.public.blob.vercel-storage.com/raw-1783986821133-armani_stronger_with_you_intens.jpg" width="245" alt="Stronger With You Intensely" style="width:245px;max-width:100%;height:auto;">
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:10px 20px 24px;">
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;color:#8a929c;text-transform:uppercase;">POUR LUI</div>
                        <div style="font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.2;color:#0e1d34;margin-top:8px;">Stronger With You Intensely</div>
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5c6470;margin-top:7px;">Ambré fougère · 100 ml</div>
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#0e1d34;font-weight:700;margin-top:12px;">299 DH</div>
                        <div style="margin-top:18px;">
                          <a href="https://nayparfum.ma/fr/product/armani-stronger-with-you-intensely-tester" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1.2px;color:#0e1d34;text-decoration:none;border-bottom:1px solid #0e1d34;padding-bottom:4px;">DÉCOUVRIR</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td class="px" align="center" style="padding:32px 46px 18px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:1.2;color:#0e1d34;">
              Composez votre sélection.
            </div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#66707c;margin-top:12px;">
              Ajoutez <strong>plus de 2 parfums</strong> à votre panier et utilisez le code <strong>NAYDAY</strong>.
            </div>
          </td>
        </tr>

        <tr>
          <td class="px" align="center" style="padding:14px 46px 42px;">
            <a class="cta" href="https://nayparfum.ma/fr/shop" style="display:inline-block;background:#189fe3;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;padding:17px 32px;">
              PROFITER DE −10%
            </a>
          </td>
        </tr>

        <!-- Trust -->
        <tr>
          <td class="px" style="padding:0 46px 34px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f8fb;">
              <tr>
                <td align="center" style="padding:23px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.8;color:#3e4650;">
                  Livraison partout au Maroc · Paiement à la livraison<br>
                  <strong>nayparfum.ma</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:30px 24px;background:#0e1d34;color:#ffffff;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;">NAY PARFUM</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.8;color:#aab6c5;margin-top:10px;">
              Offre valable pour l'achat de plus de 2 parfums avec le code NAYDAY.<br>
              © 2026 NAY Parfum
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

export interface SendEmailResult {
  success: boolean;
  channel: 'RESEND' | 'SMTP' | 'SIMULATED';
  messageId?: string;
  error?: string;
}

/**
 * Universal email dispatcher (tries Resend -> SMTP -> Simulation)
 */
export async function dispatchGenericEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const recipients = Array.isArray(to) ? to : [to];
  const cleanRecipients = recipients
    .map((e) => (e || '').trim().toLowerCase())
    .filter((e) => e.includes('@'));

  if (cleanRecipients.length === 0) {
    return { success: false, channel: 'SIMULATED', error: 'Aucun destinataire email valide' };
  }

  let providerError: string | null = null;

  // 1. Try SMTP via Nodemailer if configured (either via env or SiteConfig in DB)
  let smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  let smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  let smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
  let smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 465);
  let smtpFrom = process.env.EMAIL_FROM;
  let resendApiKey = process.env.RESEND_API_KEY;

  try {
    const config = await prisma.siteConfig.findFirst({
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPass: true,
        smtpFrom: true,
        resendApiKey: true,
      },
    });
    if (config) {
      if (!smtpHost && config.smtpHost) smtpHost = config.smtpHost;
      if (!smtpUser && config.smtpUser) smtpUser = config.smtpUser;
      if (!smtpPass && config.smtpPass) smtpPass = config.smtpPass;
      if (config.smtpPort) smtpPort = config.smtpPort;
      if (!smtpFrom && config.smtpFrom) smtpFrom = config.smtpFrom;
      if (!resendApiKey && config.resendApiKey) resendApiKey = config.resendApiKey;
    }
  } catch (e) {
    console.warn('Could not read email settings from SiteConfig:', e);
  }

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom || `NAY Parfum <${smtpUser}>`,
        to: cleanRecipients.join(', '),
        subject,
        html,
        text: text || undefined,
      });

      return { success: true, channel: 'SMTP', messageId: info.messageId };
    } catch (smtpErr: any) {
      providerError = smtpErr?.message || 'Erreur SMTP';
      console.error('SMTP dispatch failed, falling back:', smtpErr);
    }
  }

  // 2. Try Resend if API key is provided
  if (resendApiKey) {
    try {
      const fromAddress = smtpFrom || 'NAY Parfum <contact@nayparfum.ma>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: cleanRecipients,
          subject,
          html,
          text: text || undefined,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.id) {
        return { success: true, channel: 'RESEND', messageId: resData.id };
      } else {
        providerError = resData.message || (typeof resData === 'string' ? resData : JSON.stringify(resData));
        console.warn('Resend API returned error:', resData);
      }
    } catch (resendErr: any) {
      providerError = resendErr?.message || 'Erreur réseau Resend';
      console.error('Resend dispatch failed:', resendErr);
    }
  }

  // 3. Fallback: Simulation / Local Log
  console.log(`[SIMULATED EMAIL] To: ${cleanRecipients.join(', ')} | Subject: ${subject}`);
  return {
    success: true,
    channel: 'SIMULATED',
    messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    error: providerError || undefined,
  };
}

/**
 * Get emails of managers and targeted employees
 */
export async function getStaffNotificationRecipients(): Promise<string[]> {
  const emails = new Set<string>();

  try {
    // 1. Fetch active managers and staff
    const admins = await prisma.adminUser.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: { email: true, role: true },
    });

    admins.forEach((a) => {
      if (a.email && a.email.includes('@')) {
        emails.add(a.email.trim().toLowerCase());
      }
    });

    // 2. Fetch contactEmail from SiteConfig
    const config = await prisma.siteConfig.findFirst({
      select: { contactEmail: true },
    });

    if (config?.contactEmail) {
      config.contactEmail.split(',').forEach((em) => {
        const clean = em.trim().toLowerCase();
        if (clean.includes('@')) {
          emails.add(clean);
        }
      });
    }
  } catch (err) {
    console.error('Error querying staff notification recipients:', err);
  }

  // Guaranteed fallback to managers if DB empty
  if (emails.size === 0) {
    emails.add('ayoub@nayparfum.ma');
    emails.add('nouamane@nayparfum.ma');
    emails.add('contact@nayparfum.ma');
  }

  return Array.from(emails);
}

/**
 * Dispatch welcome email with NAYDAY promotion to subscriber
 */
export async function sendNaydayWelcomeEmail(recipientEmail: string): Promise<SendEmailResult> {
  const cleanEmail = recipientEmail.trim().toLowerCase();

  try {
    const result = await dispatchGenericEmail({
      to: cleanEmail,
      subject: NAYDAY_EMAIL_SUBJECT,
      html: NAYDAY_EMAIL_HTML,
    });

    if (result.success) {
      await updateSubscriberStatus(cleanEmail, true, result.channel === 'SIMULATED' ? 'SIMULATED' : 'SENT', null);
    } else {
      await updateSubscriberStatus(cleanEmail, false, 'FAILED', result.error || 'Échec envoi');
    }

    return result;
  } catch (error: any) {
    console.error('Error dispatching NAYDAY welcome email:', error);
    await updateSubscriberStatus(cleanEmail, false, 'FAILED', error?.message || 'Erreur inconnue');
    return {
      success: false,
      channel: 'SIMULATED',
      error: error?.message || 'Erreur interne envoi email',
    };
  }
}

/**
 * Send alert email to managers & targeted employees when a new subscriber signs up
 */
export async function sendAdminNewsletterAlert(subscriberEmail: string): Promise<SendEmailResult> {
  const cleanEmail = subscriberEmail.trim().toLowerCase();
  const staffRecipients = await getStaffNotificationRecipients();
  const nowStr = new Date().toLocaleString('fr-FR', {
    timeZone: 'Africa/Casablanca',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const subject = `Nouvel Abonné Newsletter — ${cleanEmail}`;

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  body { margin:0; padding:0; background:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; }
  .box { max-width:580px; margin:24px auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; }
  .header { background:#0f172a; padding:24px 28px; color:#ffffff; }
  .badge { display:inline-block; background:rgba(245,158,11,0.2); color:#fbbf24; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  .content { padding:28px; font-size:13px; line-height:1.6; }
  .data-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px 20px; margin:18px 0; }
  .data-row { display:flex; justify-content:space-between; margin-bottom:10px; }
  .btn { display:inline-block; background:#0f172a; color:#ffffff !important; padding:12px 22px; border-radius:10px; text-decoration:none; font-weight:700; font-size:12px; margin-top:14px; }
  .footer { padding:18px 28px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center; }
</style>
</head>
<body>
<div class="box">
  <div class="header">
    <div class="badge">Alerte Direction • Maison NAY</div>
    <h2 style="margin:10px 0 4px; font-size:20px; font-weight:800; color:#ffffff;">Nouvel Abonné Newsletter Capté</h2>
    <p style="margin:0; font-size:12px; color:#94a3b8;">Un nouveau prospect vient de s'inscrire pour recevoir les offres exclusives.</p>
  </div>
  <div class="content">
    <p>Bonjour à la Direction & à l'Équipe NAY,</p>
    <p>Un nouveau visiteur vient de valider son inscription sur la boutique en ligne <strong>nayparfum.ma</strong> :</p>

    <div class="data-card">
      <div style="margin-bottom:8px;">
        <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-weight:700;">Email du client :</span><br>
        <strong style="font-size:16px; color:#0f172a; font-family:monospace;">${cleanEmail}</strong>
      </div>
      <div style="margin-bottom:8px;">
        <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-weight:700;">Date & Heure (Maroc) :</span><br>
        <span style="color:#334155; font-size:13px;">${nowStr}</span>
      </div>
      <div style="margin-bottom:8px;">
        <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-weight:700;">Offre de bienvenue transmise :</span><br>
        <span style="color:#059669; font-weight:700;">Code Promo −10% NAYDAY expédié automatiquement</span>
      </div>
      <div>
        <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-weight:700;">Canal :</span><br>
        <span style="color:#334155;">Formulaire pied de page & Vitrine</span>
      </div>
    </div>

    <p style="margin-top:14px;">Vous pouvez consulter la liste complète des abonnés et exporter le fichier clients depuis votre espace d'administration :</p>
    <div style="text-align:center;">
      <a href="https://nayparfum.ma/admin/newsletter" class="btn">Accéder au Registre Newsletter Admin</a>
    </div>
  </div>
  <div class="footer">
    Notification automatique réservée aux gérants et collaborateurs ciblés de Maison NAY Parfums.<br>
    Casablanca, Maroc • © 2026 Maison NAY
  </div>
</div>
</body>
</html>`;

  return dispatchGenericEmail({
    to: staffRecipients,
    subject,
    html,
  });
}

/**
 * Send alert email to managers & targeted employees when a customer submits a contact message
 */
export async function sendAdminContactMessageAlert({
  name,
  email,
  phone,
  message,
}: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<SendEmailResult> {
  const staffRecipients = await getStaffNotificationRecipients();
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '212' + cleanPhone.substring(1) : cleanPhone;
  const nowStr = new Date().toLocaleString('fr-FR', {
    timeZone: 'Africa/Casablanca',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const subject = `Nouveau Message Client Maison NAY — De : ${name}`;

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  body { margin:0; padding:0; background:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; }
  .box { max-width:600px; margin:24px auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; }
  .header { background:#0f172a; padding:24px 28px; color:#ffffff; }
  .badge { display:inline-block; background:rgba(14,165,233,0.2); color:#38bdf8; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
  .content { padding:28px; font-size:13px; line-height:1.6; }
  .client-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px 20px; margin:16px 0; }
  .message-box { background:#fffbeb; border-left:4px solid #f59e0b; padding:16px 18px; border-radius:8px; margin:16px 0; font-size:13.5px; color:#1e293b; line-height:1.7; font-style:italic; }
  .actions { display:flex; gap:10px; margin-top:20px; flex-wrap:wrap; }
  .btn-mail { background:#0f172a; color:#ffffff !important; padding:11px 20px; border-radius:10px; text-decoration:none; font-weight:700; font-size:12px; display:inline-block; }
  .btn-wa { background:#16a34a; color:#ffffff !important; padding:11px 20px; border-radius:10px; text-decoration:none; font-weight:700; font-size:12px; display:inline-block; }
  .footer { padding:18px 28px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center; }
</style>
</head>
<body>
<div class="box">
  <div class="header">
    <div class="badge">Service Client & Direction • NAY</div>
    <h2 style="margin:10px 0 4px; font-size:20px; font-weight:800; color:#ffffff;">Nouveau Message Formulaire de Contact</h2>
    <p style="margin:0; font-size:12px; color:#94a3b8;">Un client vient d'envoyer une demande depuis la page de contact.</p>
  </div>
  <div class="content">
    <p>Bonjour à la Direction & aux Collaborateurs,</p>
    <p>Une nouvelle demande de contact a été enregistrée le <strong>${nowStr}</strong> :</p>

    <div class="client-card">
      <div style="margin-bottom:8px;">
        <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-weight:700;">Nom du Client :</span><br>
        <strong style="font-size:15px; color:#0f172a;">${name}</strong>
      </div>
      <div style="margin-bottom:8px;">
        <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-weight:700;">Email de réponse :</span><br>
        <a href="mailto:${email}" style="color:#0284c7; font-weight:600; text-decoration:none;">${email}</a>
      </div>
      ${phone ? `
      <div>
        <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-weight:700;">Téléphone portable :</span><br>
        <strong style="color:#0f172a; font-family:monospace;">${phone}</strong>
      </div>` : ''}
    </div>

    <div style="font-weight:700; color:#334155; margin-bottom:6px;">Message transmis par le client :</div>
    <div class="message-box">
      "${message.replace(/\n/g, '<br>')}"
    </div>

    <div class="actions">
      <a href="mailto:${email}?subject=${encodeURIComponent(`Re: Votre message à Maison NAY Parfums`)}" class="btn-mail">
        Répondre par Email
      </a>
      ${cleanPhone ? `
      <a href="https://wa.me/${waPhone}?text=${encodeURIComponent(`Salam ${name}. C'est Maison NAY Parfums concernant votre message. Comment pouvons-nous vous aider ?`)}" class="btn-wa">
        Contacter sur WhatsApp
      </a>` : ''}
    </div>
  </div>
  <div class="footer">
    Alerte transmise en temps réel aux gérants et équipes ciblées de Maison NAY.<br>
    Casablanca, Maroc • © 2026 Maison NAY
  </div>
</div>
</body>
</html>`;

  return dispatchGenericEmail({
    to: staffRecipients,
    subject,
    html,
  });
}

/**
 * Send customer courtesy confirmation email when they submit the contact form
 */
export async function sendCustomerContactReceipt({
  name,
  email,
}: {
  name: string;
  email: string;
}): Promise<SendEmailResult> {
  const cleanEmail = email.trim().toLowerCase();
  const subject = `Nous avons bien reçu votre message — Maison NAY Parfums`;

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  body { margin:0; padding:0; background:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; }
  .box { max-width:580px; margin:24px auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; }
  .header { background:#0f172a; padding:28px; text-align:center; color:#ffffff; }
  .content { padding:30px; font-size:14px; line-height:1.7; color:#334155; }
  .footer { padding:20px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center; }
</style>
</head>
<body>
<div class="box">
  <div class="header">
    <div style="font-size:11px; letter-spacing:2px; color:#d97706; text-transform:uppercase; font-weight:700;">MAISON NAY • HAUTE PARFUMERIE</div>
    <h2 style="margin:10px 0 0; font-size:22px; color:#ffffff; font-serif:Georgia,serif;">Bienvenue chez NAY</h2>
  </div>
  <div class="content">
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Nous vous remercions sincèrement pour votre prise de contact avec notre Maison.</p>
    <p>Votre message a été transmis à notre service clientèle et nos conseillers olfactifs. Nous mettons tout en œuvre pour vous apporter une réponse personnalisée dans les plus brefs délais (généralement sous 24h ouvrées).</p>
    <p>Pour toute question urgente concernant une commande en cours ou une expédition express, vous pouvez également nous joindre directement sur notre ligne WhatsApp :</p>
    <div style="text-align:center; margin:24px 0;">
      <a href="https://wa.me/212663380011" style="background:#16a34a; color:#ffffff; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:700; font-size:13px; display:inline-block;">
        Joindre notre Conseiller WhatsApp
      </a>
    </div>
    <p>Avec toute notre bienveillance,</p>
    <p><strong>L'Équipe de la Maison NAY Parfums</strong><br><span style="font-size:12px; color:#64748b;">Casablanca, Maroc</span></p>
  </div>
  <div class="footer">
    NAY Parfums • Haute Parfumerie & Parfums Rares<br>
    Casablanca & Tout le Maroc • contact@nayparfum.ma
  </div>
</div>
</body>
</html>`;

  return dispatchGenericEmail({
    to: cleanEmail,
    subject,
    html,
  });
}

/**
 * Send a test email from the admin settings page to verify configuration
 */
export async function sendTestNotificationEmail(targetEmail: string): Promise<SendEmailResult> {
  const cleanEmail = targetEmail.trim().toLowerCase();
  const nowStr = new Date().toLocaleString('fr-FR', {
    timeZone: 'Africa/Casablanca',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const subject = `Test Réussi — Notifications Maison NAY Parfums`;

  const html = `<!doctype html>
<html lang="fr">
<body style="font-family:sans-serif; background:#f4f5f7; padding:24px;">
  <div style="max-width:540px; margin:0 auto; background:#ffffff; border-radius:14px; padding:28px; border:1px solid #e2e8f0;">
    <h2 style="color:#0f172a; margin-top:0;">Test d'Alerte Email Validé</h2>
    <p style="font-size:14px; color:#334155; line-height:1.6;">
      Ce message confirme que la passerelle d'envoi d'emails (Resend / SMTP) de <strong>Maison NAY Parfums</strong> est parfaitement opérationnelle.
    </p>
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; font-size:12px; margin:16px 0;">
      <strong>Destinataire test :</strong> ${cleanEmail}<br>
      <strong>Horodatage :</strong> ${nowStr}<br>
      <strong>Fournisseur actif :</strong> ${process.env.RESEND_API_KEY ? 'Resend API (Clé active)' : 'SMTP / Simulation'}
    </div>
    <p style="font-size:12px; color:#64748b;">
      Désormais, les nouvelles inscriptions à la newsletter et les messages reçus sur la page de contact seront immédiatement transmis à cette adresse.
    </p>
  </div>
</body>
</html>`;

  return dispatchGenericEmail({
    to: cleanEmail,
    subject,
    html,
  });
}

/**
 * Dispatch password reset verification code email
 */
export async function sendPasswordResetCodeEmail({
  to,
  name,
  code,
}: {
  to: string;
  name?: string;
  code: string;
}): Promise<SendEmailResult> {
  const cleanEmail = to.trim().toLowerCase();
  const displayName = name && name.trim() ? name.trim() : 'Cher Client';
  const cleanCode = code.trim();
  const digits = cleanCode.split('').slice(0, 6);

  const subject = `NAY Parfums — Code de vérification : ${cleanCode}`;

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Code de vérification — NAY Parfums</title>
<style>
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; display:block; }
  table { border-collapse:collapse !important; }
  body { margin:0 !important; padding:0 !important; width:100% !important; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  @media screen and (max-width:600px) {
    .container { width:100% !important; }
    .px-mobile { padding-left:20px !important; padding-right:20px !important; }
    .digit-cell { width:38px !important; height:48px !important; line-height:48px !important; font-size:22px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8fafc">
  <tr>
    <td align="center" style="padding:40px 14px;">
      <table role="presentation" class="container" width="540" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:540px;max-width:540px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 35px rgba(15,23,42,0.06);border:1px solid #e2e8f0;">
        
        <!-- Header Brand -->
        <tr>
          <td align="center" style="padding:36px 24px 22px;border-bottom:1px solid #f1f5f9;">
            <a href="https://nayparfum.ma" target="_blank" style="text-decoration:none;">
              <img src="https://nayparfum.ma/images/nay/nay-logo-tight.png" width="135" alt="NAY Parfums" style="width:135px;max-width:135px;height:auto;display:block;margin:0 auto;">
            </a>
            <div style="font-size:10px;letter-spacing:3px;color:#94a3b8;text-transform:uppercase;font-weight:600;margin-top:10px;text-align:center;">
              HAUTE PARFUMERIE • PARIS &amp; MAROC
            </div>
          </td>
        </tr>

        <!-- Content Body -->
        <tr>
          <td class="px-mobile" style="padding:36px 40px 24px;">
            <div style="font-size:10px;letter-spacing:2px;color:#0ea5e9;text-transform:uppercase;font-weight:700;margin-bottom:12px;">
              AUTHENTIFICATION SÉCURISÉE
            </div>
            <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#0f172a;margin:0 0 16px 0;font-weight:normal;">
              Code de réinitialisation
            </h1>
            <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 24px 0;">
              Bonjour <strong>${displayName}</strong>,<br>
              Vous avez demandé la réinitialisation de votre mot de passe pour votre compte sur <strong>NAY Parfums</strong>.<br>
              Veuillez saisir le code de sécurité personnel ci-dessous pour confirmer votre identité :
            </p>

            <!-- Segmented 6-Digit Code Presentation -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:28px auto 10px auto;">
              <tr>
                ${digits.map(d => `
                  <td style="padding:0 4px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td class="digit-cell" align="center" style="width:44px;height:54px;line-height:54px;background:#0f172a;border-radius:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,monospace;font-size:26px;font-weight:800;color:#ffffff;box-shadow:0 3px 8px rgba(15,23,42,0.12);text-align:center;">
                          ${d}
                        </td>
                      </tr>
                    </table>
                  </td>
                `).join('')}
              </tr>
            </table>
            <div style="text-align:center;font-size:11px;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;margin-bottom:28px;">
              Code personnel à usage unique
            </div>

            <!-- Professional Security / Validity Panel with Vector Icons -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 18px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td width="24" valign="top" style="padding-top:2px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </td>
                      <td valign="top" style="font-size:13px;line-height:1.6;color:#475569;padding-left:10px;padding-bottom:10px;">
                        <strong style="color:#0f172a;">Validité :</strong> Ce code expire dans <strong>15 minutes</strong>. Passé ce délai, une nouvelle demande sera requise.
                      </td>
                    </tr>
                    <tr>
                      <td width="24" valign="top" style="padding-top:10px;border-top:1px solid #edf2f7;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </td>
                      <td valign="top" style="font-size:13px;line-height:1.6;color:#475569;padding-left:10px;padding-top:10px;border-top:1px solid #edf2f7;">
                        <strong style="color:#0f172a;">Sécurité :</strong> Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail. Votre mot de passe actuel demeure protégé.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="font-size:13px;line-height:1.6;color:#475569;margin:0 0 8px 0;">
              À votre service,<br>
              <strong style="color:#0f172a;">L'équipe NAY Parfums</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:22px 28px;background:#f8fafc;border-top:1px solid #f1f5f9;">
            <p style="font-size:11px;line-height:1.6;color:#94a3b8;margin:0 0 4px 0;">
              NAY Parfums — Parfumerie de Luxe &amp; Testeurs 100% Authentiques au Maroc
            </p>
            <p style="font-size:11px;line-height:1.6;color:#94a3b8;margin:0;">
              Besoin d'aide ? Écrivez-nous à <a href="mailto:contact@nayparfum.ma" style="color:#0ea5e9;text-decoration:none;">contact@nayparfum.ma</a> ou sur <a href="https://wa.me/212628469399" style="color:#0ea5e9;text-decoration:none;">WhatsApp (+212 628-469399)</a>.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = `Bonjour ${displayName},\n\nVotre code de vérification NAY Parfums est : ${cleanCode}\n\nCe code expire dans 15 minutes.\nSi vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.\n\nL'équipe NAY Parfums`;

  return dispatchGenericEmail({
    to: cleanEmail,
    subject,
    html,
    text,
  });
}

async function updateSubscriberStatus(
  email: string,
  sent: boolean,
  status: string,
  errorMsg: string | null
) {
  try {
    await prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: {
        welcomeEmailSent: sent,
        welcomeEmailSentAt: sent ? new Date() : null,
        welcomeEmailStatus: status,
        welcomeEmailError: errorMsg,
      },
    });
  } catch (err) {
    console.error('Error updating subscriber email status in DB:', err);
  }
}

