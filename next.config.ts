import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
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
        hostname: '*.public.blob.vercel-storage.com',
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
        source: '/:locale/parfums-orientaux',
        destination: '/:locale/parfums-originaux',
        permanent: true,
      },
      {
        source: '/parfums-orientaux',
        destination: '/fr/parfums-originaux',
        permanent: true,
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
            value: 'camera=(), microphone=(), geolocation=()', // Bloque l'accès aux capteurs si inutile
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
