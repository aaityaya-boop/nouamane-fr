'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { useUserInteraction } from '@/hooks/useUserInteraction';

const AIChatWidget = dynamic(() => import('@/components/AIChatWidget'), { ssr: false });
const WelcomePopup = dynamic(() => import('@/components/WelcomePopup'), { ssr: false });
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
const WhatsAppButton = dynamic(() => import('@/components/WhatsAppButton'), { ssr: false });

export default function ClientWidgets() {
  const ready = useUserInteraction(15000);
  const pathname = usePathname();

  if (!ready) return null;

  // Keep checkout tunnel completely distraction-free
  const isCheckoutTunnel = pathname?.includes('/checkout') || pathname?.includes('/order-confirmation');
  if (isCheckoutTunnel) {
    return (
      <div className="print:hidden">
        <SpeedInsights />
        <Analytics />
      </div>
    );
  }

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
