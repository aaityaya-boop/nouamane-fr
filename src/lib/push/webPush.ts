import webpush from 'web-push';
import prisma from '@/lib/prisma';

// Fallback VAPID configuration if environment variables are not yet loaded
const FALLBACK_PUBLIC_KEY = 'BDS7OJDbz0_1a1w4bIKog8AKpvgVO8ubnxFHoJ-e9EWMJW9jdTdyTNM5wGdd1UzSB4SY6T02TpGclZhG9kC0ay4';
const FALLBACK_PRIVATE_KEY = 'xfg1OYEb8tcb6IdjoD0LMm3L9HkbgirdJSEq-aktAFM';
const FALLBACK_SUBJECT = 'mailto:contact@nayparfum.ma';

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || FALLBACK_PUBLIC_KEY;
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || FALLBACK_PRIVATE_KEY;
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || FALLBACK_SUBJECT;

// Configure web-push with VAPID details
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.error('[WebPush] Error configuring VAPID details:', err);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  category?: 'ORDER' | 'STOCK' | 'FINANCE' | 'SECURITY' | 'SYSTEM';
  data?: Record<string, any>;
}

export interface PushSendResult {
  endpoint: string;
  success: boolean;
  statusCode?: number;
  expired?: boolean;
  error?: string;
}

/**
 * Send a web push notification to a specific subscription.
 * Handles 404 / 410 Gone by deactivating or removing the dead subscription.
 */
export async function sendWebPush(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
    id?: string;
  },
  payload: PushNotificationPayload
): Promise<PushSendResult> {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const notificationString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/admin-icon-192x192.png',
    badge: payload.badge || '/admin-favicon-96x96.png',
    url: payload.url || '/admin',
    tag: payload.tag || `nay-${Date.now()}`,
    category: payload.category || 'SYSTEM',
    data: {
      url: payload.url || '/admin',
      category: payload.category || 'SYSTEM',
      ...payload.data,
    },
  });

  try {
    const response = await webpush.sendNotification(pushSubscription, notificationString, {
      TTL: 60 * 60 * 24, // 24 hours TTL
      urgency: 'high',
    });

    // Update lastUsedAt timestamp on successful delivery
    if (subscription.id) {
      prisma.adminPushSubscription
        .update({
          where: { id: subscription.id },
          data: { lastUsedAt: new Date(), isActive: true },
        })
        .catch(() => {});
    }

    return {
      endpoint: subscription.endpoint,
      success: true,
      statusCode: response.statusCode,
    };
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.status;
    const isExpired = statusCode === 404 || statusCode === 410;

    if (isExpired) {
      console.warn(`[WebPush] Subscription expired (${statusCode}), deactivating endpoint: ${subscription.endpoint}`);
      try {
        await prisma.adminPushSubscription.updateMany({
          where: { endpoint: subscription.endpoint },
          data: { isActive: false },
        });
      } catch (dbErr) {
        console.error('[WebPush] Failed to deactivate expired subscription:', dbErr);
      }
    } else {
      console.error(`[WebPush] Push delivery failed (Status: ${statusCode}):`, error?.message || error);
    }

    return {
      endpoint: subscription.endpoint,
      success: false,
      statusCode,
      expired: isExpired,
      error: error?.message || 'Unknown WebPush error',
    };
  }
}
