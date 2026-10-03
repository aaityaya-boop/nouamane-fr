import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import AdminLayoutShell from "@/components/AdminLayoutShell";
import "../globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin | NAY Parfums",
  icons: {
    icon: [
      { url: '/admin-favicon.ico', sizes: 'any' },
      { url: '/admin-favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/admin-favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/admin-favicon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/admin-favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/admin-favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/admin-favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/admin-apple-touch-icon.png',
    shortcut: '/admin-favicon.ico',
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={plusJakarta.variable}>
      <head>
        <link rel="icon" href="/admin-favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/admin-favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/admin-favicon-16x16.png" />
        <link rel="icon" type="image/svg+xml" href="/admin-favicon.svg" />
        <link rel="apple-touch-icon" href="/admin-apple-touch-icon.png" />
      </head>
      <body className={`${plusJakarta.className} bg-white antialiased min-h-screen font-sans`}>
        <AdminLayoutShell>
          {children}
        </AdminLayoutShell>
      </body>
    </html>
  );
}
