import prisma from '@/lib/prisma';

export const SAV_CATEGORIES = [
  { value: 'WRONG_PRODUCT', label: 'Produit incorrect', description: 'Le client a reçu un autre parfum ou format' },
  { value: 'MISSING_PRODUCT', label: 'Produit manquant', description: 'Un ou plusieurs articles manquent dans le colis' },
  { value: 'BROKEN_LEAK', label: 'Flacon cassé ou fuite', description: 'Flacon endommagé durant le transport ou spray défectueux' },
  { value: 'DELIVERY_ISSUE', label: 'Problème de livraison', description: 'Retard anormal, colis non livré, refus ou erreur adresse' },
  { value: 'EXCHANGE_REQUEST', label: 'Demande d’échange', description: 'Le client souhaite échanger contre une autre fragrance' },
  { value: 'RETURN_REQUEST', label: 'Demande de retour', description: 'Demande de rétractation ou retour de commande' },
  { value: 'OTHER', label: 'Autre motif', description: 'Autre réclamation spécifique' },
] as const;

export const SAV_CHANNELS = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'PHONE', label: 'Téléphone / Appel direct' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'OTHER', label: 'Autre canal' },
] as const;

export const SAV_PRIORITIES = [
  { value: 'LOW', label: 'Basse', badgeBg: 'bg-slate-100', badgeText: 'text-slate-700', badgeBorder: 'border-slate-200' },
  { value: 'MEDIUM', label: 'Moyenne', badgeBg: 'bg-sky-50', badgeText: 'text-sky-700', badgeBorder: 'border-sky-200' },
  { value: 'HIGH', label: 'Haute', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', badgeBorder: 'border-amber-200' },
  { value: 'URGENT', label: 'Urgente', badgeBg: 'bg-rose-50', badgeText: 'text-rose-700', badgeBorder: 'border-rose-200' },
] as const;

export const SAV_STATUSES = [
  { value: 'NEW', label: 'Nouveau', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  { value: 'IN_PROGRESS', label: 'En cours', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { value: 'PENDING', label: 'En attente', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  { value: 'RESOLVED', label: 'Résolu', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'CLOSED', label: 'Clôturé', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
] as const;

export const PENDING_REASONS = [
  { value: 'WAITING_CUSTOMER', label: 'En attente de réponse client' },
  { value: 'WAITING_CARRIER', label: 'En attente du transporteur / livreur' },
  { value: 'WAITING_RETURN', label: 'En attente de réception du colis retour' },
  { value: 'INTERNAL_ACTION', label: 'En attente d’action interne / atelier' },
  { value: 'OTHER', label: 'Autre motif d’attente' },
] as const;

export const SAV_SOLUTIONS = [
  { value: 'ASSISTANCE', label: 'Explication ou assistance', description: 'Conseils d\'utilisation ou éclaircissement apporté au client' },
  { value: 'SEND_MISSING', label: 'Envoi du produit manquant', description: 'Expédition complémentaire sans refacturation' },
  { value: 'REPLACEMENT', label: 'Remplacement standard', description: 'Renvoi d\'un nouveau flacon à l\'identique' },
  { value: 'EXCHANGE', label: 'Échange de fragrance', description: 'Échange contre une référence différente' },
  { value: 'RETURN', label: 'Retour marchandise', description: 'Récupération du produit avec bon de retour' },
  { value: 'REFUND_PARTIAL', label: 'Remboursement partiel', description: 'Remboursement d\'un montant convenu avec le client' },
  { value: 'REFUND_TOTAL', label: 'Remboursement total', description: 'Remboursement intégral de la commande' },
  { value: 'REJECTED', label: 'Demande non acceptée', description: 'Réclamation rejetée avec justification écrite' },
] as const;

/**
 * Generate a unique sequential SAV ticket reference (e.g. SAV-2026-0001)
 */
export async function generateNextSavTicketNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const count = await prisma.claimTicket.count({
    where: {
      ticketNumber: {
        startsWith: `SAV-${currentYear}-`,
      },
    },
  });

  const nextSeq = (count + 1).toString().padStart(4, '0');
  const candidate = `SAV-${currentYear}-${nextSeq}`;

  // Double check collision
  const exists = await prisma.claimTicket.findUnique({ where: { ticketNumber: candidate } });
  if (exists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SAV-${currentYear}-${randomSuffix}`;
  }

  return candidate;
}

/**
 * Helper to safely parse JSON items
 */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
