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
 * Dispatch welcome email with NAYDAY promotion
 */
export async function sendNaydayWelcomeEmail(recipientEmail: string): Promise<SendEmailResult> {
  const cleanEmail = recipientEmail.trim().toLowerCase();

  try {
    // 1. Try Resend if API key is provided
    if (process.env.RESEND_API_KEY) {
      try {
        const fromAddress = process.env.EMAIL_FROM || 'NAY Parfum <contact@nayparfum.ma>';
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [cleanEmail],
            subject: NAYDAY_EMAIL_SUBJECT,
            html: NAYDAY_EMAIL_HTML,
          }),
        });

        const resData = await res.json();
        if (res.ok && resData.id) {
          await updateSubscriberStatus(cleanEmail, true, 'SENT', null);
          return { success: true, channel: 'RESEND', messageId: resData.id };
        } else {
          console.warn('Resend API returned error, falling back:', resData);
        }
      } catch (resendErr: any) {
        console.error('Resend dispatch failed:', resendErr);
      }
    }

    // 2. Try SMTP via Nodemailer
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
    const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 465);

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
          from: process.env.EMAIL_FROM || `NAY Parfum <${smtpUser}>`,
          to: cleanEmail,
          subject: NAYDAY_EMAIL_SUBJECT,
          html: NAYDAY_EMAIL_HTML,
        });

        await updateSubscriberStatus(cleanEmail, true, 'SENT', null);
        return { success: true, channel: 'SMTP', messageId: info.messageId };
      } catch (smtpErr: any) {
        console.error('SMTP dispatch failed:', smtpErr);
      }
    }

    // 3. Fallback: Simulation/Prepared (no external provider yet configured)
    console.log(`[NAYDAY WELCOME EMAIL] Prepared & ready for ${cleanEmail} (Subject: ${NAYDAY_EMAIL_SUBJECT})`);
    await updateSubscriberStatus(cleanEmail, true, 'SIMULATED', null);
    return {
      success: true,
      channel: 'SIMULATED',
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
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
