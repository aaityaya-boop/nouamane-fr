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
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={plusJakarta.variable}>
      <body className={`${plusJakarta.className} bg-white antialiased min-h-screen font-sans`}>
        <AdminLayoutShell>
          {children}
        </AdminLayoutShell>
      </body>
    </html>
  );
}
