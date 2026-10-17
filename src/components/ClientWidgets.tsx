'use client';

import dynamic from 'next/dynamic';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { useUserInteraction } from '@/hooks/useUserInteraction';

const AIChatWidget = dynamic(() => import('@/components/AIChatWidget'), { ssr: false });
const WelcomePopup = dynamic(() => import('@/components/WelcomePopup'), { ssr: false });
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
const WhatsAppButton = dynamic(() => import('@/components/WhatsAppButton'), { ssr: false });

export default function ClientWidgets() {
  const ready = useUserInteraction(15000);

  if (!ready) return null;

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
