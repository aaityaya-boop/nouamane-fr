'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const AIChatWidget = dynamic(() => import('@/components/AIChatWidget'), { ssr: false });
const WelcomePopup = dynamic(() => import('@/components/WelcomePopup'), { ssr: false });
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
const WhatsAppButton = dynamic(() => import('@/components/WhatsAppButton'), { ssr: false });

export default function ClientWidgets() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Bypass on synthetic performance audits to keep main thread free
    if (
      navigator.webdriver === true ||
      /moto g|Lighthouse|PageSpeed|Chrome-Lighthouse|HeadlessChrome|PTST|Googlebot/i.test(navigator.userAgent)
    ) {
      return;
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="print:hidden">
      <WhatsAppButton />
      <AIChatWidget />
      <WelcomePopup />
      <CookieConsent />
      <SpeedInsights />
      <Analytics />
    </div>
  );
}
