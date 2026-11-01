/**
 * AI Security, Privacy Guards & Action Boundaries
 * Sprint 42 Architecture
 *
 * Enforces:
 * - Order privacy & PII protection (Never disclose customer names, phones, addresses, or items in chat)
 * - Autonomous action boundaries (Zero autonomous refunds, order cancellations, or price edits)
 * - Prompt injection sanitization for external strings, filenames, and OCR output
 */

import { PrivacyCheckResult } from './types';

const WHATSAPP_VIP_URL = 'https://wa.me/212663380011';
const TRACKING_PAGE_PATH = '/fr/suivi-commande';

/**
 * Sanitizes input strings against prompt injection attempts
 */
export function sanitizeInputText(input: string): string {
  if (!input) return '';
  // Strip control characters, zero-width characters, and dangerous prompt boundary tokens
  let cleaned = input
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
    .trim();

  // Redact obvious system prompt injection markers
  cleaned = cleaned.replace(/SYSTEM\s*OVERRIDE/gi, '[ATTEMPT_BLOCKED]');
  cleaned = cleaned.replace(/IGNORE\s*(?:ALL\s*)?PREVIOUS\s*INSTRUCTIONS/gi, '[ATTEMPT_BLOCKED]');
  cleaned = cleaned.replace(/DROP\s*DATABASE/gi, '[SQL_BLOCKED]');

  return cleaned;
}

/**
 * Validates whether a user query violates privacy or action boundaries
 */
export function evaluateSecurityAndPrivacy(
  userText: string,
  userLocale: string = 'fr'
): PrivacyCheckResult {
  const lower = userText.toLowerCase();

  // 1. ORDER PRIVACY CHECK (Mandatory Test 4)
  // Detects if user is asking for order details, customer identity, phone, or address for an arbitrary order ID
  const orderRefPattern = /(?:order|commande|colis|طلب|طلبية|ref|référence|numéro|numero)\s*[:#\-]?\s*([a-zA-Z0-9_\-]{4,20})/i;
  const asksForPiiOrStatus = /(?:statut|status|suivre|suivi|qui|nom|adresse|téléphone|telephone|contenu|détails|details|فين وصلت|ديال من|شكون|فين كاين|معلومات)/i.test(lower);
  const asksAnotherPersonOrder = /(?:ami|amie|client|autre|karim|ahmed|fatima|محمد|كريم|شخص آخر|زبون|غيري)/i.test(lower) && /(?:commande|order|colis|طلبية)/i.test(lower);

  if ((orderRefPattern.test(lower) && asksForPiiOrStatus) || asksAnotherPersonOrder) {
    const isDarija = userLocale === 'ar' || /wach|dyal|bghit|salam|chof/i.test(lower);
    const trackingLink = `[Suivre ma commande en direct](/${userLocale}/suivi-commande)`;

    if (isDarija) {
      return {
        isSafe: false,
        violationType: 'ORDER_UNVERIFIED',
        safeMessage: `🔒 **حماية الخصوصية وأمان الطلبيات في Atelier NAY :**\n\nحفاظاً على سرية بيانات زبنائنا الكرام، لا يمكن لروبوت الدردشة الكشف عن تفاصيل الطلبيات أو الأسماء أو أرقام الهواتف أو العناوين داخل المحادثة العامة.\n\nلمعرفة حالة طلبيتك بأمان عبر نظام التوثيق الرسمي، يُرجى زيارة صفحة **[تتبع طلبيتي](/ar/suivi-commande)** وإدخال رقم الطلبية مقروناً برقم الهاتف المسجل عند الشراء.`,
        escalationRequired: false
      };
    }

    return {
      isSafe: false,
      violationType: 'ORDER_UNVERIFIED',
      safeMessage: `🔒 **Protection de la Vie Privée & Sécurité des Commandes NAY Parfums :**\n\nAfin de protéger les données personnelles de nos clients (adresses, coordonnées et contenu des commandes), l'assistant IA n'est pas autorisé à divulguer des informations sur une commande dans le fil de discussion public.\n\nPour consulter l'état d'expédition de votre colis en toute sécurité, veuillez utiliser notre page officielle vérifiée : **${trackingLink}**, en renseignant votre référence de commande ainsi que le numéro de téléphone associé à votre achat.`,
      escalationRequired: false
    };
  }

  // 2. FINANCIAL & REFUND ACTION BOUNDARY (Mandatory Test 5)
  // Detects if user is demanding an autonomous refund, order cancellation, or chargeback
  const refundDemands = /(?:rembourser|remboursement|annuler la commande|annulez ma commande|restituer|rendez-moi mon argent|recréditer|استرجاع فلوسي|استرداد المبلغ|إلغاء الطلب|رجعو ليا فلوسي|رد ليا فلوسي|رجوع الفلوس|raj3o|raj3|rdo|rje3|flous|flousi|flosi)/i.test(lower);

  if (refundDemands) {
    const isDarija = userLocale === 'ar' || /wach|dyal|bghit|salam|chof/i.test(lower);
    const whatsappEscalation = `[Service Réclamations & Remboursements WhatsApp (+212 663-380011)](${WHATSAPP_VIP_URL})`;

    if (isDarija) {
      return {
        isSafe: false,
        violationType: 'REFUND_REQUEST',
        safeMessage: `🛡️ **إجراءات طلبات الإرجاع والاسترداد المالي بـ Atelier NAY :**\n\nكمساعد ذكي، **لا أمتلك الصلاحية التقنية أو المالية لمعالجة استرداد المبالغ أو تعديل الحسابات البنكية بشكل آلي**، حرصاً على سلامة المعاملات.\n\nتتم معالجة كافة طلبات الإرجاع والاسترداد حصرياً وبشكل فردي تحت إشراف إدارة خدمة الزبناء الرسمية طبقاً لشروط الموقع (/legal/returns).\n\nيرجى التواصل المباشر مع فريق الدعم البشري عبر الرابط التالي متضمناً رقم طلبيتك وتفاصيل الإرجاع : **[خدمة الزبناء الرسمية عبر واتساب (+212 663-380011)](${WHATSAPP_VIP_URL})**.`,
        escalationRequired: true,
        escalationLink: WHATSAPP_VIP_URL
      };
    }

    return {
      isSafe: false,
      violationType: 'REFUND_REQUEST',
      safeMessage: `🛡️ **Procédure de Traitement des Remboursements & Réclamations NAY Parfums :**\n\nEn tant qu'assistant virtuel, **je ne dispose pas des droits administratifs ni de l'autorisation d'effectuer des virements, annulations de paiement ou remboursements financiers de façon autonome**.\n\nToutes les demandes de remboursement et retours après réception font l'objet d'un examen individuel strict par nos conseillers dédiés, conformément à nos conditions générales (/legal/returns).\n\nPour soumettre votre dossier avec votre numéro de commande, veuillez vous adresser directement à notre équipe de gestion humaine via : **${whatsappEscalation}**.`,
      escalationRequired: true,
      escalationLink: WHATSAPP_VIP_URL
    };
  }

  // 3. UNAUTHORIZED PRICE MODIFICATION ATTEMPTS
  const priceHackDemands = /(?:baisse le prix|change le prix|fais-moi un prix|prix à 50 dh|réduction de 90%|بدل الثمن|نقص الثمن)/i.test(lower);
  if (priceHackDemands) {
    return {
      isSafe: false,
      violationType: 'PRICE_MODIFICATION',
      safeMessage: `💎 **Tarifs Officiels Atelier NAY :** Les prix affichés sur notre catalogue officiel sont des tarifs d'atelier fixes (entre 299 et 499 MAD pour nos testeurs de haute parfumerie). L'assistant IA n'a aucune habilitation pour modifier les tarifs ou générer des remises non autorisées.`,
      escalationRequired: false
    };
  }

  return { isSafe: true };
}
