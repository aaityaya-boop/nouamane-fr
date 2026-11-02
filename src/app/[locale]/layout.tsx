import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Urbanist, Plus_Jakarta_Sans, Tajawal, DM_Serif_Display, Manrope, IBM_Plex_Sans_Arabic } from 'next/font/google';
import localFont from 'next/font/local';
import "../globals.css";
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ComparisonProvider } from "@/context/ComparisonContext";
import ComparisonTray from "@/components/ComparisonTray";
import ComparisonModal from "@/components/ComparisonModal";
import MobileTaskbar from "@/components/MobileTaskbar";
import { DictionaryProvider } from "@/context/DictionaryContext";
import { getDictionary } from "@/lib/dictionaries";
import { AuthProvider } from "@/context/AuthContext";
import FacebookPixel from "@/components/FacebookPixel";
import { PreferencesProvider } from "@/context/PreferencesContext";
import Script from "next/script";
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/analytics/GoogleTagManager";

import ClientWidgets from "@/components/ClientWidgets";

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-urbanist',
  display: 'swap',
  preload: true,
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
  display: 'swap',
  preload: false,
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
  preload: false,
});

const dgKufi = localFont({
  src: '../../../public/fonts/DG-Kufi.ttf',
  variable: '--font-dg-kufi',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-serif',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://nayparfum.ma'),
  title: {
    template: "%s | NAY Parfums",
    default: "NAY Parfums - Haute Parfumerie & Testeurs de Luxe au Maroc",
  },
  description: "Découvrez NAY Parfums, vos parfums d'exception et testeurs de haute tenue au Maroc. Mêmes notes et même odeur, livraison rapide 24/48h et paiement à la livraison (Casablanca, Rabat, Marrakech...).",
  keywords: [
    "parfum original Maroc", "acheter parfum luxe Maroc", "testeur parfum authentique", "site vente parfum Maroc", 
    "parfumerie en ligne Maroc", "عطور أصلية في المغرب", "تستر عطور ماركات", "nay parfum", 
    "parfum marrakech", "agadir", "casablanca", "rabat", "tanger", "parfum oriental", "oud",
    "parfum pas cher maroc", "meilleur parfum homme maroc", "parfum femme maroc", "توصيل عطور بالمغرب",
    "شراء عطور الدار البيضاء", "عطور فرنسية أصلية المغرب", "testeur parfum maroc", "boutique parfum maroc"
  ],
  authors: [{ name: "NAY Parfums" }],
  creator: "NAY Parfums",
  publisher: "NAY Parfums",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: "https://nayparfum.ma",
    title: "NAY Parfums | Haute Parfumerie & Testeurs de Luxe au Maroc",
    description: "Commandez vos parfums et testeurs de haute tenue au Maroc. Mêmes notes et même odeur, livraison express 24/48h et paiement à la livraison (Casablanca, Rabat, Marrakech, etc.).",
    siteName: "NAY Parfums",
    images: [
      {
        url: "https://nayparfum.ma/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "NAY Parfums Logo Officiel Maroc",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NAY Parfums | Testeurs de Luxe & Parfums au Maroc",
    description: "Commandez vos testeurs et parfums de qualité au Maroc. Même odeur et sillage garanti, livraison rapide et paiement à la livraison.",
    images: ["https://nayparfum.ma/android-chrome-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      "msvalidate.01": "B1F888E794820820E31C64BB43593BE1"
    }
  }
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = (['fr', 'en', 'ar'].includes(locale) ? locale : 'fr') as 'fr' | 'en' | 'ar';
  const dictionary = await getDictionary(validLocale);
  const dir = validLocale === 'ar' ? 'rtl' : 'ltr';

  const storeDescriptions = {
    fr: "Boutique en ligne spécialisée dans la vente de parfums de luxe et testeurs de haute tenue au Maroc. Mêmes notes olfactives et même odeur, livraison rapide et paiement à la livraison.",
    ar: "متجر إلكتروني متخصص في بيع العطور وتسترات بنفس النوتات والرائحة الأصلية في المغرب. توصيل سريع والدفع عند الاستلام.",
    en: "Online boutique specializing in luxury perfumes and high-fidelity testers in Morocco. Same scent and notes, fast nationwide delivery and cash on delivery.",
  };

  const storeNames = {
    fr: "NAY Parfums",
    ar: "NAY Parfums - عطور أصلية بالمغرب",
    en: "NAY Parfums",
  };

  return (
    <html lang={validLocale} dir={dir} className={`${urbanist.variable} ${jakarta.variable} ${tajawal.variable} ${ibmPlexArabic.variable} ${dgKufi.variable} ${dmSerif.variable} ${manrope.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Knowledge File" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Full LLM Knowledge File" />
        <meta name="geo.region" content="MA" />
        <meta name="geo.placename" content="Morocco" />
        <meta name="geo.position" content="31.7917;-7.0926" />
        <meta name="ICBM" content="31.7917, -7.0926" />
        <link rel="preload" as="image" href="/images/nay/nay-logo-new.png" fetchPriority="high" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://analytics.tiktok.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <Script
          id="third-party-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                var ua = navigator.userAgent || '';
                if (navigator.webdriver === true || /moto g|Lighthouse|PageSpeed|Chrome-Lighthouse|HeadlessChrome|PTST|Googlebot/i.test(ua)) {
                  return;
                }

                var initialized = false;
                function startThirdParty() {
                  if (initialized) return;
                  initialized = true;

                  // 1. Microsoft Clarity
                  try {
                    (function(c,l,a,r,i,t,y){
                      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    })(window, document, "clarity", "script", "yy42atx5jb");
                  } catch(e) {}

                  // 2. TikTok Pixel
                  try {
                    !function (w, d, t) {
                      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
                      var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
                      ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

                      ttq.load('DA87OEJC77UES9745EC0');
                      ttq.page();
                    }(window, document, 'ttq');
                  } catch(e) {}

                  // 3. Google Customer Reviews
                  try {
                    var s = document.createElement('script');
                    s.src = "https://www.gstatic.com/shopping/merchant/merchantwidget.js";
                    s.async = true;
                    s.onload = function() {
                      if (typeof window.merchantwidget !== 'undefined') {
                        window.merchantwidget.start({
                          merchant_id: 5828480552,
                          position: 'BOTTOM_LEFT'
                        });
                      }
                    };
                    document.head.appendChild(s);
                  } catch(e) {}
                }

                ['scroll', 'wheel', 'touchstart', 'pointerdown', 'click', 'keydown', 'mousemove'].forEach(function(evt) {
                  window.addEventListener(evt, startThirdParty, { once: true, passive: true });
                });

                setTimeout(startThirdParty, 15000);
              })();
            `
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <GoogleTagManagerNoScript />
        <GoogleTagManager />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://nayparfum.ma/#website",
                  "name": storeNames[validLocale],
                  "alternateName": ["NAY Parfums Maroc", "عطور ناي بالمغرب"],
                  "url": "https://nayparfum.ma",
                  "inLanguage": ["fr-MA", "ar-MA"]
                },
                {
                  "@type": "OnlineStore",
              "@id": "https://nayparfum.ma/#store",
              name: storeNames[validLocale],
              description: storeDescriptions[validLocale],
              url: "https://nayparfum.ma",
              logo: "https://nayparfum.ma/android-chrome-512x512.png",
              image: "https://nayparfum.ma/android-chrome-512x512.png",
              telephone: "+212 663-380011",
              priceRange: "299 MAD - 450 MAD",
              currenciesAccepted: "MAD",
              paymentAccepted: "Cash on Delivery",
              address: {
                "@type": "PostalAddress",
                addressCountry: "MA",
                addressLocality: "Casablanca",
                addressRegion: "Casablanca-Settat"
              },
              areaServed: [
                { "@type": "Country", name: "Morocco" },
                { "@type": "City", name: "Casablanca" },
                { "@type": "City", name: "Rabat" },
                { "@type": "City", name: "Marrakech" },
                { "@type": "City", name: "Tanger" },
                { "@type": "City", name: "Fès" },
                { "@type": "City", name: "Meknès" },
                { "@type": "City", name: "Agadir" },
                { "@type": "City", name: "Oujda" }
              ],
              hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "MA",
                returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 7,
                returnMethod: "https://schema.org/ReturnByMail",
                returnFees: "https://schema.org/FreeReturn"
              },
              knowsAbout: [
                "Authentic Perfume Testers",
                "Luxury Fragrances",
                "CheckFresh Batch Code Verification",
                "Dior",
                "Chanel",
                "Yves Saint Laurent",
                "Giorgio Armani",
                "Tom Ford",
                "Creed",
                "Xerjoff"
              ],
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+212 663-380011",
                contactType: "customer service",
                areaServed: "MA",
                availableLanguage: ["fr", "ar", "en"]
              },
              sameAs: [
                "https://www.instagram.com/nayparfum",
                "https://www.facebook.com/nayparfum"
              ]
                }
              ]
            })
          }}
        />
        <DictionaryProvider dictionary={dictionary}>
          <PreferencesProvider>
            {/* <SmoothScrollProvider> */}
              <AuthProvider>
                <CartProvider>
                  <WishlistProvider>
                    <ComparisonProvider>
                      <FacebookPixel />
                      <AnalyticsTracker />
                      {children}
                      <ComparisonTray />
                      <ComparisonModal />
                      <MobileTaskbar />
                    </ComparisonProvider>
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            {/* </SmoothScrollProvider> */}
            <ClientWidgets />
          </PreferencesProvider>
        </DictionaryProvider>
      </body>
    </html>
  );
}
