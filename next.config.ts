import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'l3qgcdajft9wdkxz.public.blob.vercel-storage.com',
      }
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  serverExternalPackages: ['firebase-admin'],
  compress: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/admin/encaissements',
        destination: '/admin/sav',
        permanent: false,
      },
      {
        source: '/parfums-orientaux',
        destination: '/fr/parfums-orientaux',
        permanent: false,
      },
      {
        source: '/suivi-commande',
        destination: '/fr/suivi-commande',
        permanent: false,
      },
      {
        source: '/suivi',
        destination: '/fr/suivi-commande',
        permanent: false,
      },
      {
        source: '/track',
        destination: '/fr/suivi-commande',
        permanent: false,
      },
      // SEO 301 Permanent Redirects for obsolete product URLs
      {
        source: "/fr/product/Yves-Saint-Laurent-La-Nuit-De-L\\'Homme-Bleu-Électrique-Eau-de-Toilette",
        destination: '/fr/product/YSL-La-Nuit-De-L-Homme-Bleu-Électrique-Eau-de-Toilette',
        statusCode: 301,
      },
      {
        source: '/product/Absolu-Aventus-Creed',
        destination: '/fr/product/Creed-Absolu-Aventus-Tester',
        statusCode: 301,
      },
      {
        source: '/fr/product/Absolu-Aventus-Creed',
        destination: '/fr/product/Creed-Absolu-Aventus-Tester',
        statusCode: 301,
      },
      {
        source: '/product/chanel-bleu-de-chanel-tester',
        destination: '/fr/product/chanel-bleu-de-chanel-eau-de-parfum-tester',
        statusCode: 301,
      },
      {
        source: '/fr/product/chanel-bleu-de-chanel-tester',
        destination: '/fr/product/chanel-bleu-de-chanel-eau-de-parfum-tester',
        statusCode: 301,
      },
      {
        source: '/product/pack-decouverte-luxe',
        destination: '/fr/decouverte',
        statusCode: 301,
      },
      {
        source: '/fr/product/pack-decouverte-luxe',
        destination: '/fr/decouverte',
        statusCode: 301,
      },
      {
        source: '/product/armani-stronger-with-you-intensely-tester',
        destination: '/fr/product/stronger-with-you-intensely-tester',
        statusCode: 301,
      },
      {
        source: '/fr/product/armani-stronger-with-you-intensely-tester',
        destination: '/fr/product/stronger-with-you-intensely-tester',
        statusCode: 301,
      },
      {
        source: '/ar/product/armani-stronger-with-you-intensely-tester',
        destination: '/ar/product/stronger-with-you-intensely-tester',
        statusCode: 301,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Empêche le site d'être mis dans un iframe (Clickjacking)
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Empêche le navigateur de deviner le type de fichier
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Protège les données de provenance
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload', // Force le HTTPS pendant 1 an
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',  // Bloque l'accès aux capteurs si inutile
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''} https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://www.gstatic.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/logos/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/admin-sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/admin',
          },
        ],
      },
      {
        source: '/admin.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
