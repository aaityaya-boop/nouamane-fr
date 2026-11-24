import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import {
  Inter,
  Playfair_Display,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Manrope,
  DM_Sans,
  Cormorant_Garamond,
} from "next/font/google";
import AdminLayoutShell from "@/components/AdminLayoutShell";
import "../globals.css";
import "@/styles/admin-dark.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-admin",
  display: "swap",
  preload: true,
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-admin-jakarta",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-admin-manrope",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-admin-dm",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-admin-serif",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-admin-cormorant",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-admin-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1424" },
  ],
};

export const metadata: Metadata = {
  title: "Admin | NAY Parfums",
  description: "Console d'administration officielle Maison NAY Parfums",
  robots: {
    index: false,
    follow: false,
  },
  manifest: '/admin.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NAY Admin',
  },
  icons: {
    icon: [
      { url: '/admin-favicon.ico', sizes: 'any' },
      { url: '/admin-favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/admin-favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/admin-icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/admin-icon-512x512.png', type: 'image/png', sizes: '512x512' },
      { url: '/admin-favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/admin-favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/admin-favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/admin-apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/admin-favicon.ico',
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${jakarta.variable} ${manrope.variable} ${dmSans.variable} ${playfair.variable} ${cormorant.variable} ${jetbrainsMono.variable} ${inter.className} admin-html`}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NAY Admin" />
        <meta name="application-name" content="NAY Admin" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="manifest" href="/admin.webmanifest" />
        <link rel="icon" href="/admin-favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/admin-favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/admin-favicon-16x16.png" />
        <link rel="icon" type="image/svg+xml" href="/admin-favicon.svg" />
        <link rel="apple-touch-icon" href="/admin-apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var root = document.documentElement;
                  var saved = localStorage.getItem('nay_admin_theme');
                  if (saved === 'dark') {
                    root.classList.add('dark');
                    root.setAttribute('data-theme', 'dark');
                  } else {
                    root.classList.remove('dark');
                    root.setAttribute('data-theme', 'light');
                  }
                  var rawD = localStorage.getItem('nay_admin_design_v1');
                  if (rawD) {
                    var d = JSON.parse(rawD);
                    if (d.stylePreset) root.setAttribute('data-admin-style', d.stylePreset);
                    if (d.fontFamily) root.setAttribute('data-admin-font', d.fontFamily);
                    if (d.cardStyle) root.setAttribute('data-admin-card', d.cardStyle);
                    if (d.borderRadius) root.setAttribute('data-admin-radius', d.borderRadius);
                    if (d.density) root.setAttribute('data-admin-density', d.density);
                    root.setAttribute('data-admin-specular', d.specularRim === false ? 'off' : 'on');
                    root.setAttribute('data-admin-hover-lift', d.cardHoverLift === false ? 'off' : 'on');
                    if (d.glassBlurPx) root.style.setProperty('--admin-glass-blur', d.glassBlurPx + 'px');
                    if (d.glassOpacityPct) root.style.setProperty('--admin-glass-alpha', (d.glassOpacityPct / 100).toFixed(2));
                    if (d.sidebarTone) root.setAttribute('data-admin-sidebar', d.sidebarTone);
                    if (d.sidebarShape) root.setAttribute('data-admin-sidebar-shape', d.sidebarShape);
                    if (d.sidebarPosition) root.setAttribute('data-admin-sidebar-pos', d.sidebarPosition);
                    root.setAttribute('data-admin-sidebar-hidden', d.sidebarHidden ? 'true' : 'false');
                    if (d.headbarStyle) root.setAttribute('data-admin-headbar', d.headbarStyle);
                    if (d.taskbarStyle) root.setAttribute('data-admin-taskbar', d.taskbarStyle);
                    if (d.taskbarPosition) root.setAttribute('data-admin-taskbar-pos', d.taskbarPosition);
                    root.setAttribute('data-admin-taskbar-desktop', d.taskbarShowOnDesktop ? 'on' : 'off');
                    root.setAttribute('data-admin-taskbar-labels', d.taskbarShowLabels === false ? 'off' : 'on');
                    root.setAttribute('data-admin-taskbar-compact', d.taskbarCompact ? 'on' : 'off');
                    if (d.chartPalette) root.setAttribute('data-admin-chart', d.chartPalette);
                    if (d.backgroundEffect) root.setAttribute('data-admin-bg', d.backgroundEffect);
                    if (d.pillStyle) root.setAttribute('data-admin-pill', d.pillStyle);
                    if (d.tableStyle) root.setAttribute('data-admin-table', d.tableStyle);
                    if (d.contentWidth) root.setAttribute('data-admin-width', d.contentWidth);
                    root.setAttribute('data-admin-contrast', d.highContrast ? 'high' : 'normal');
                    root.setAttribute('data-admin-motion', d.animationsEnabled === false ? 'off' : 'on');
                    root.setAttribute('data-admin-sb-badges', d.sidebarShowBadges === false ? 'off' : 'on');
                    if (d.borderStrength) root.setAttribute('data-admin-border-strength', d.borderStrength);
                    if (d.shadowLevel) root.setAttribute('data-admin-shadow', d.shadowLevel);
                    root.setAttribute('data-admin-tabular', d.tabularNumbers === false ? 'off' : 'on');
                    if (d.headingStyle) root.setAttribute('data-admin-heading-style', d.headingStyle);
                    if (d.customBgColor) { root.setAttribute('data-admin-custom-bg', 'on'); root.style.setProperty('--admin-custom-bg', d.customBgColor); }
                    if (d.customCardColor) { root.setAttribute('data-admin-custom-card', 'on'); root.style.setProperty('--admin-custom-card', d.customCardColor); }
                    if (d.customTextColor) { root.setAttribute('data-admin-custom-text', 'on'); root.style.setProperty('--admin-custom-text', d.customTextColor); }
                    if (typeof d.customRadiusPx === 'number') { root.setAttribute('data-admin-custom-radius', 'on'); root.style.setProperty('--admin-custom-radius', d.customRadiusPx + 'px'); }
                    if (d.sidebarWidthPx) root.style.setProperty('--admin-sidebar-w', d.sidebarWidthPx + 'px');
                    if (d.headbarHeightPx) root.style.setProperty('--admin-headbar-h', d.headbarHeightPx + 'px');
                    if (d.accentColor) root.style.setProperty('--admin-accent', d.accentColor);
                    if (d.rootFontSizePx) root.style.fontSize = d.rootFontSizePx + 'px';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} admin-body admin-shell-bg bg-[#e2e8f0] dark:bg-[#060913] antialiased min-h-screen font-sans`}>
        <AdminLayoutShell>
          {children}
        </AdminLayoutShell>
      </body>
    </html>
  );
}
