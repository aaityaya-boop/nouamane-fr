import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
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
    ];
  },
};

export default nextConfig;
