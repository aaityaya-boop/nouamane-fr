/**
 * NAY Parfum Admin — Progressive Web App Service Worker
 * Version: 1.0.0
 * Security Rules:
 * - NEVER cache admin API responses (/api/*)
 * - NEVER cache private customer/order/payment/stock data
 * - Network-First for all admin pages to ensure 100% fresh real-time data
 * - Cache-First ONLY for immutable static assets (JS, CSS, fonts, icons)
 * - Clean offline fallback for network loss
 * - Future-ready for Web Push notifications
 */

const CACHE_NAME = 'nay-admin-v1';

// Static safe assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/admin-offline.html',
  '/admin.webmanifest',
  '/images/nay/nay-logo-blue.png',
  '/admin-icon-192x192.png',
  '/admin-icon-512x512.png',
  '/admin-icon-maskable-512x512.png',
  '/admin-apple-touch-icon.png',
  '/admin-favicon-32x32.png',
];

// Install: Cache essential static offline assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[NAY Admin SW] Precache warning:', err);
      });
    })
  );
});

// Activate: Clean up any outdated caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[NAY Admin SW] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Secure routing & caching logic
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // 2. NEVER cache non-GET methods (POST, PUT, DELETE, PATCH)
  if (request.method !== 'GET') {
    return;
  }

  // 3. NEVER cache API requests (Orders, Metrics, Auth, Customers, Finance)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 4. Handle navigation requests (Page loads & route transitions)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // If offline and request is an admin page, serve branded offline fallback
        if (url.pathname.startsWith('/admin')) {
          return caches.match('/admin-offline.html');
        }
        return caches.match('/admin-offline.html');
      })
    );
    return;
  }

  // 5. Cache-First for safe immutable static assets (_next/static, fonts, icons, images)
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.webmanifest');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache).catch(() => {});
            });
          }
          return networkResponse;
        }).catch(() => {
          // If static fetch fails and nothing in cache
          return cachedResponse;
        });
      })
    );
    return;
  }

  // 6. Default: network-first with no caching for anything else
});

// Update & Cache Management Messages
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Skip waiting when user confirms update
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Clear caches on logout to prevent any residual traces
  if (event.data.type === 'CLEAR_ADMIN_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[NAY Admin SW] Admin caches cleared on logout');
    });
  }
});

// ==========================================
// PREPARE FOR WEB PUSH NOTIFICATIONS
// ==========================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'NAY Parfum Admin';
    const options = {
      body: data.body || '',
      icon: data.icon || '/admin-icon-192x192.png',
      badge: '/admin-favicon-96x96.png',
      data: {
        url: data.url || '/admin',
      },
      vibrate: [100, 50, 100],
      tag: data.tag || 'nay-admin-notification',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // Plain text fallback
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('NAY Parfum Admin', {
        body: text,
        icon: '/admin-icon-192x192.png',
        badge: '/admin-favicon-96x96.png',
        data: { url: '/admin' },
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If admin window already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          if ('navigate' in client && targetUrl !== '/admin') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
