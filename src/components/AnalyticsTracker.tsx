'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string>('');

  useEffect(() => {
    // Avoid tracking inside the admin panel to prevent skewing customer metrics
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    // Retrieve or create persistent anonymous visitor identifier
    if (!visitorIdRef.current) {
      try {
        let storedId = localStorage.getItem('nay_vid');
        if (!storedId) {
          storedId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'vid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
          localStorage.setItem('nay_vid', storedId);
        }
        visitorIdRef.current = storedId;
      } catch {
        visitorIdRef.current = 'vid_' + Date.now().toString(36);
      }
    }

    const sendTrack = async (type: 'PAGEVIEW' | 'HEARTBEAT' = 'PAGEVIEW') => {
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pathname,
            referrer: document.referrer,
            userAgent: window.navigator.userAgent,
            visitorId: visitorIdRef.current,
            type
          }),
          keepalive: true
        });
      } catch {
        // Silently fail without impacting storefront performance
      }
    };

    // 1. Send immediate pageview
    sendTrack('PAGEVIEW');

    // 2. Active online presence heartbeat every 45s while tab is visible
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendTrack('HEARTBEAT');
      }
    }, 45000);

    // 3. Re-ping presence when visitor switches back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendTrack('HEARTBEAT');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}
