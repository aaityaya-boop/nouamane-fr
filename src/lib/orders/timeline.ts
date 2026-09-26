import prisma from '@/lib/prisma';
import { AdminUserSafe } from '../auth/adminAuth';

export interface TimelineEventInput {
  orderId: string;
  status: string;
  title: string;
  description?: string | null;
  actorId?: string | null;
  actorName: string;
  actorRole?: string | null;
  actorAvatar?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Record a 100% REAL timeline event for an order in the database
 */
export async function recordTimelineEvent(data: TimelineEventInput) {
  try {
    return await prisma.orderTimelineEvent.create({
      data: {
        orderId: data.orderId,
        status: data.status,
        title: data.title,
        description: data.description || null,
        actorId: data.actorId || null,
        actorName: data.actorName,
        actorRole: data.actorRole || null,
        actorAvatar: data.actorAvatar || null,
        carrier: data.carrier || null,
        trackingNumber: data.trackingNumber || null,
        attachmentUrl: data.attachmentUrl || null,
        attachmentName: data.attachmentName || null,
        attachmentType: data.attachmentType || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to record order timeline event:', error);
    return null;
  }
}

/**
 * Automatically record timeline transition based on order status change and the REAL authenticated admin/owner
 */
export async function recordStatusTransition({
  orderId,
  oldStatus,
  newStatus,
  actor,
  carrier,
  trackingNumber,
  customNote,
}: {
  orderId: string;
  oldStatus?: string;
  newStatus: string;
  actor?: AdminUserSafe | null;
  carrier?: string;
  trackingNumber?: string;
  customNote?: string;
}) {
  const actorName = actor?.name || 'Administrateur NAY';
  const actorRole = actor ? (actor.jobTitle || (actor.role === 'OWNER' ? 'Propriétaire NAY' : actor.role)) : 'Administration';
  const actorId = actor ? actor.id : null;
  const actorAvatar = actor ? actor.avatar : null;

  let title = `Statut mis à jour: ${newStatus}`;
  let description = customNote || null;
  let statusKey = newStatus.toUpperCase();

  switch (newStatus.toLowerCase()) {
    case 'pending':
      title = 'Commande créée en ligne';
      description = description || 'En attente de confirmation téléphonique.';
      statusKey = 'CREATED';
      break;
    case 'confirmed':
      title = `Confirmée par ${actorName}`;
      description = description || 'Commande confirmée et validée pour préparation.';
      statusKey = 'CONFIRMED';
      break;
    case 'processing':
      title = `Préparée par ${actorName}`;
      description = description || 'Colis vérifié, flacons soigneusement emballés & étiquetés.';
      statusKey = 'PREPARED';
      break;
    case 'shipped':
      title = carrier ? `Expédiée via ${carrier}` : `Expédiée par ${actorName}`;
      description = trackingNumber
        ? `Remis au livreur. N° de suivi: ${trackingNumber}`
        : (description || 'Colis confié au transporteur pour livraison.');
      statusKey = 'SHIPPED';
      break;
    case 'delivered':
      title = `Livrée & Encaissée`;
      description = description || 'Livraison réussie au client avec encaissement du montant.';
      statusKey = 'DELIVERED';
      break;
    case 'refused':
      title = 'Colis refusé';
      description = description || 'Le client a refusé le colis lors de la livraison.';
      statusKey = 'REFUSED';
      break;
    case 'returned':
      title = 'Retour de colis';
      description = description || 'Colis retourné et réintégré.';
      statusKey = 'RETURNED';
      break;
    case 'unconfirmed':
      title = `Non confirmé / Appel par ${actorName}`;
      description = description || 'Tentative de contact téléphonique sans réponse.';
      statusKey = 'CALL_ATTEMPT';
      break;
    case 'canceled':
      title = `Commande annulée par ${actorName}`;
      description = description || 'Commande annulée.';
      statusKey = 'CANCELED';
      break;
  }

  return await recordTimelineEvent({
    orderId,
    status: statusKey,
    title,
    description,
    actorId,
    actorName,
    actorRole,
    actorAvatar,
    carrier,
    trackingNumber,
  });
}

/**
 * Return 100% REAL fallback events for legacy orders without inserting any fake staff names
 */
export function generateFallbackTimeline(order: any) {
  const createdAt = new Date(order.createdAt);
  const updatedAt = new Date(order.updatedAt || order.createdAt);
  const events = [];

  // Step 1: Real Creation Event
  events.push({
    id: `real-created-${order.id}`,
    orderId: order.id,
    status: 'CREATED',
    title: 'Commande créée',
    description: `Commande #${order.orderNumber} passée via la boutique en ligne`,
    actorId: null,
    actorName: order.customerName ? `${order.customerName} (Client)` : 'Client en ligne',
    actorRole: 'CLIENT',
    actorAvatar: null,
    carrier: null,
    trackingNumber: null,
    attachmentUrl: null,
    attachmentName: null,
    attachmentType: null,
    createdAt: createdAt.toISOString(),
  });

  const status = (order.status || 'pending').toLowerCase();

  // If status is not pending, show the real recorded status at updatedAt without fake names
  if (status !== 'pending' && status !== 'unconfirmed') {
    let title = 'Mise à jour du statut';
    let statusKey = status.toUpperCase();

    if (status === 'processing') {
      title = 'En cours de préparation';
      statusKey = 'PREPARED';
    } else if (status === 'shipped') {
      title = 'Colis expédié';
      statusKey = 'SHIPPED';
    } else if (status === 'delivered') {
      title = 'Colis livré & Encaissé';
      statusKey = 'DELIVERED';
    } else if (status === 'refused') {
      title = 'Colis refusé';
      statusKey = 'REFUSED';
    } else if (status === 'returned') {
      title = 'Retour enregistré';
      statusKey = 'RETURNED';
    }

    events.push({
      id: `real-status-${order.id}`,
      orderId: order.id,
      status: statusKey,
      title,
      description: `Statut actuel: ${status}`,
      actorId: null,
      actorName: 'NAY Workspace',
      actorRole: 'Système',
      actorAvatar: null,
      carrier: null,
      trackingNumber: null,
      attachmentUrl: null,
      attachmentName: null,
      attachmentType: null,
      createdAt: updatedAt.toISOString(),
    });
  }

  return events;
}

/**
 * Format timestamp into Moroccan HH:mm / DD MMM format
 */
export function formatTimelineTime(dateInput: string | Date) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatTimelineDate(dateInput: string | Date) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return d.toLocaleDateString('fr-MA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
