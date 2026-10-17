'use client';

import dynamic from 'next/dynamic';

const AIChatWidget = dynamic(() => import('@/components/AIChatWidget'), { ssr: false });
const WelcomePopup = dynamic(() => import('@/components/WelcomePopup'), { ssr: false });
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
const WhatsAppButton = dynamic(() => import('@/components/WhatsAppButton'), { ssr: false });

export default function ClientWidgets() {
  return (
    <div className="print:hidden">
      <WhatsAppButton />
      <AIChatWidget />
      <WelcomePopup />
      <CookieConsent />
    </div>
  );
}
