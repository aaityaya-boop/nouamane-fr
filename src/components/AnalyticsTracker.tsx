'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string>('');

  useEffect(() => {
    // Avoid tracking inside the admin panel to prevent skewing customer metrics
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

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
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            visitorId: visitorIdRef.current,
            type
          })
        });
      } catch {
        // Silently fail without impacting storefront performance
      }
    };

    // 1. Send immediate pageview
    sendTrack('PAGEVIEW');

    // 2. Active online presence heartbeat every 25 seconds
    const heartbeatInterval = setInterval(() => {
      sendTrack('HEARTBEAT');
    }, 25000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [pathname]);

  return null;
}
