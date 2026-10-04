import prisma from '@/lib/prisma';
import { broadcastNewNotification } from './realtimeEvents';
import { dispatchAdminNotification, NotificationCategory } from './push/notificationDispatcher';

export interface CreateNotificationParams {
  userId?: string | null; // null = broadcast to all owners/admins
  type: 'ORDER' | 'STOCK' | 'TASK' | 'REVIEW' | 'MESSAGE' | 'SYSTEM' | 'FINANCE' | 'SECURITY';
  title: string;
  message: string;
  link?: string | null;
  metadata?: any;
}

/**
 * Dispatch a real admin notification when an actual event occurs in the store.
 * Persists in DB, broadcasts to SSE, and sends Web Push notifications to registered PWA devices.
 */
export async function createAdminNotification(params: CreateNotificationParams) {
  try {
    const created = await prisma.adminNotification.create({
      data: {
        userId: params.userId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        metadata: params.metadata
          ? typeof params.metadata === 'string'
            ? params.metadata
            : JSON.stringify(params.metadata)
          : null,
      },
    });

    // Broadcast instantly to all connected admin SSE clients
    broadcastNewNotification(created);

    // Map notification type to push category
    let category: NotificationCategory = 'SYSTEM';
    if (params.type === 'ORDER') category = 'ORDER';
    else if (params.type === 'STOCK') category = 'STOCK';
    else if (params.type === 'FINANCE') category = 'FINANCE';
    else if (params.type === 'SECURITY') category = 'SECURITY';

    // Dispatch Web Push in the background without blocking the request
    dispatchAdminNotification({
      category,
      title: params.title,
      body: params.message,
      url: params.link || '/admin',
      targetUserId: params.userId || null,
      metadata: params.metadata,
      saveInDb: false, // Already saved right above
    }).catch((pushErr) => {
      console.warn('[Push Notification] Background dispatch warning:', pushErr);
    });

    return created;
  } catch (error) {
    console.error('Failed to create admin notification:', error);
    return null;
  }
}

