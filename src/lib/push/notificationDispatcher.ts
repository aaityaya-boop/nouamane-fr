import prisma from '@/lib/prisma';
import { sendWebPush, PushNotificationPayload, PushSendResult } from './webPush';
import { broadcastNewNotification } from '@/lib/realtimeEvents';
import { getUserEffectivePermissions } from '@/lib/auth/rbac/accessControl';

export type NotificationCategory = 'ORDER' | 'STOCK' | 'FINANCE' | 'SECURITY' | 'SYSTEM';

export interface DispatchNotificationOptions {
  category: NotificationCategory;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  targetUserId?: string | null; // null = all authorized admins
  metadata?: Record<string, any>;
  saveInDb?: boolean; // default true
}

const CATEGORY_REQUIRED_PERMISSION: Record<NotificationCategory, string> = {
  ORDER: 'orders.view',
  STOCK: 'inventory.view',
  FINANCE: 'finance.view_revenue',
  SECURITY: 'team.view',
  SYSTEM: 'dashboard.view',
};

const CATEGORY_PREFERENCE_KEY: Record<NotificationCategory, 'orders' | 'stock' | 'finance' | 'security' | 'system'> = {
  ORDER: 'orders',
  STOCK: 'stock',
  FINANCE: 'finance',
  SECURITY: 'security',
  SYSTEM: 'system',
};

/**
 * Check if an admin is authorized and opted-in for a given category
 */
export function isUserEligibleForCategory(
  user: {
    id: string;
    role: string;
    status: string;
    customPermissions?: string | null;
  },
  category: NotificationCategory,
  preferences?: {
    orders: boolean;
    stock: boolean;
    finance: boolean;
    security: boolean;
    system: boolean;
  } | null
): boolean {
  if (user.status !== 'ACTIVE') return false;

  const roleUpper = (user.role || '').toUpperCase();
  const isSuperUser = roleUpper === 'OWNER' || roleUpper === 'CO_OWNER' || roleUpper === 'SUPER_ADMIN';

  // 1. Permission check
  if (!isSuperUser) {
    const requiredPermission = CATEGORY_REQUIRED_PERMISSION[category];
    const effectivePermissions = getUserEffectivePermissions(user);
    if (!effectivePermissions.includes(requiredPermission)) {
      return false;
    }
  }

  // 2. Preference check (default to true if user hasn't customized preferences yet)
  if (preferences) {
    const prefKey = CATEGORY_PREFERENCE_KEY[category];
    if (preferences[prefKey] === false) {
      return false;
    }
  }

  return true;
}

/**
 * Central dispatcher for push notifications across the NAY Parfum Admin Panel.
 * Handles RBAC checks, category preference filtering, dead subscription auto-cleaning,
 * and optional in-app database persistence.
 */
export async function dispatchAdminNotification(options: DispatchNotificationOptions): Promise<{
  pushedCount: number;
  totalSubscriptions: number;
  results: PushSendResult[];
}> {
  const {
    category,
    title,
    body,
    url = '/admin',
    tag,
    targetUserId = null,
    metadata = {},
    saveInDb = true,
  } = options;

  try {
    // 1. Optionally save notification in PostgreSQL database and broadcast to SSE
    if (saveInDb) {
      try {
        const createdNotification = await prisma.adminNotification.create({
          data: {
            userId: targetUserId,
            type: category,
            title,
            message: body,
            link: url,
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });

        // Instant SSE broadcast to open admin tabs
        broadcastNewNotification(createdNotification);
      } catch (dbErr) {
        console.error('[NotificationDispatcher] Failed to save notification in DB:', dbErr);
      }
    }

    // 2. Fetch admins to determine who should receive the push
    const adminQuery: any = {
      status: 'ACTIVE',
    };
    if (targetUserId) {
      adminQuery.id = targetUserId;
    }

    const admins = await prisma.adminUser.findMany({
      where: adminQuery,
      include: {
        notificationPreferences: true,
        pushSubscriptions: {
          where: { isActive: true },
        },
      },
    });

    if (!admins || admins.length === 0) {
      return { pushedCount: 0, totalSubscriptions: 0, results: [] };
    }

    // 3. Filter subscriptions based on permissions & preferences
    const validSubscriptions: {
      id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
    }[] = [];

    for (const admin of admins) {
      const eligible = isUserEligibleForCategory(admin, category, admin.notificationPreferences);
      if (eligible && admin.pushSubscriptions.length > 0) {
        for (const sub of admin.pushSubscriptions) {
          validSubscriptions.push({
            id: sub.id,
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
          });
        }
      }
    }

    if (validSubscriptions.length === 0) {
      return { pushedCount: 0, totalSubscriptions: 0, results: [] };
    }

    // 4. Send Web Push to all eligible devices in parallel
    const pushPayload: PushNotificationPayload = {
      title,
      body,
      url,
      tag: tag || `nay-${category.toLowerCase()}-${Date.now()}`,
      category,
      data: {
        url,
        category,
        ...metadata,
      },
    };

    const pushPromises = validSubscriptions.map((sub) => sendWebPush(sub, pushPayload));
    const rawResults = await Promise.allSettled(pushPromises);

    const results: PushSendResult[] = rawResults.map((res, index) => {
      if (res.status === 'fulfilled') {
        return res.value;
      }
      return {
        endpoint: validSubscriptions[index].endpoint,
        success: false,
        error: String(res.reason || 'Promise rejected'),
      };
    });

    const pushedCount = results.filter((r) => r.success).length;

    return {
      pushedCount,
      totalSubscriptions: validSubscriptions.length,
      results,
    };
  } catch (err: any) {
    console.error('[NotificationDispatcher] Unexpected error in dispatch:', err);
    return { pushedCount: 0, totalSubscriptions: 0, results: [] };
  }
}
