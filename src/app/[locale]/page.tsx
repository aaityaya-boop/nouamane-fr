import React from 'react';
import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import prisma from '@/lib/prisma';
import { Product } from '@/lib/products';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  const title = "NAY Parfum Maroc - Testeurs de Parfums 100% Originaux & Parfumerie de Luxe";
  const description = "Parfumerie en ligne de référence au Maroc. Achetez vos testeurs de parfums 100% originaux et fragrances de luxe au meilleur prix en MAD. Livraison express 24/48h partout au Maroc et paiement à la livraison (COD).";

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}`,
      languages: {
        'fr-MA': 'https://nayparfum.ma/fr',
        'ar-MA': 'https://nayparfum.ma/ar',
        'x-default': 'https://nayparfum.ma/fr',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://nayparfum.ma/${currentLocale}`,
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const currentLocale = locale || 'fr';

  const [dbProducts, siteConfigDb, dbReviewsDb, brandsDb] = await Promise.all([
    prisma.product.findMany({
      where: { published: true },
      select: {
        id: true,
        sku: true,
        name: true,
        slug: true,
        brandId: true,
        brandLabel: true,
        gender: true,
        subcategory: true,
        subcategoryLabel: true,
        price: true,
        originalPrice: true,
        images: true,
        sizes: true,
        tags: true,
        rating: true,
        reviewCount: true,
        inStock: true,
        stock: true,
        perfectSeason: true,
        releaseDate: true,
      }
    }),
    prisma.siteConfig.findFirst({
      select: {
        id: true,
        heroTitle: true,
        heroSubtitle: true,
        featuredBestsellers: true,
        featuredSeasonal: true,
        featuredLatest: true,
        seasonalTrendTitle: true,
        seasonalTrendSubtitle: true,
        coffretsCoverImage: true,
      }
    }),
    prisma.review.findMany({
      where: { verified: true },
      take: 12,
      select: {
        id: true,
        comment: true,
        author: true,
        city: true,
        rating: true,
        product: {
          select: {
            name: true,
            slug: true,
          }
        }
      }
    }),
    prisma.brand.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      }
    }),
  ]);

  let siteConfig = siteConfigDb;
  if (!siteConfig) {
    siteConfig = {
      id: 1,
      heroTitle: "L'Essence de l'Élégance",
      heroSubtitle: "Découvrez notre collection de parfums de luxe, conçue pour laisser une empreinte inoubliable.",
    } as any;
  }

  // 1. Identify all needed slugs from siteConfig
  let bestsellersSlugs: string[] = [];
  let seasonalSlugs: string[] = [];
  let latestSlugs: string[] = [];
  try { bestsellersSlugs = JSON.parse(siteConfig?.featuredBestsellers || '[]'); } catch {}
  try { seasonalSlugs = JSON.parse(siteConfig?.featuredSeasonal || '[]'); } catch {}
  try { latestSlugs = JSON.parse(siteConfig?.featuredLatest || '[]'); } catch {}

  const neededSlugs = new Set([...bestsellersSlugs, ...seasonalSlugs, ...latestSlugs]);

  // Fallback candidates: top 8 newest and top 8 bestsellers/seasonal
  const tagBestsellers = dbProducts.filter(p => {
    try { return JSON.parse(p.tags).includes('bestseller'); } catch { return false; }
  }).slice(0, 8);
  tagBestsellers.forEach(p => neededSlugs.add(p.slug));

  const sortedNewest = [...dbProducts].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()).slice(0, 8);
  sortedNewest.forEach(p => neededSlugs.add(p.slug));

  // Filter and map ONLY products needed on the homepage with streamlined fields
  const products: Product[] = dbProducts
    .filter(p => neededSlugs.has(p.slug) || p.subcategory === 'coffrets')
    .map((p) => {
      let parsedImages: string[] = [];
      let parsedSizes = [];
      let parsedTags: string[] = [];
      try { parsedImages = JSON.parse(p.images); } catch {}
      try { parsedSizes = JSON.parse(p.sizes); } catch {}
      try { parsedTags = JSON.parse(p.tags); } catch {}

      return {
        id: p.id,
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        brand: p.brandId as any,
        brandLabel: p.brandLabel,
        gender: p.gender as any,
        subcategory: p.subcategory as any,
        subcategoryLabel: p.subcategoryLabel,
        price: p.price,
        originalPrice: p.originalPrice ?? undefined,
        images: parsedImages.slice(0, 2),
        sizes: parsedSizes,
        tags: parsedTags as any,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.inStock,
        stock: p.stock,
        perfectSeason: p.perfectSeason as any,
        releaseDate: p.releaseDate,
        // Lightweight stubs for unused fields to prevent payload bloating
        description: '',
        notes: { top: [], heart: [], base: [] },
      } as unknown as Product;
    });

  let dbReviews = dbReviewsDb;
  if (!dbReviews || dbReviews.length === 0) {
    dbReviews = [
      { id: 1, comment: "Franchement j'avais des doutes, mais sda9 site sadi9. Khdit Libre Eau de Parfum, c'est l'original. Tbarkallah 3likom.", author: "Mounia T.", city: "Marrakech", product: { name: "YSL Libre Eau de Parfum", slug: "ysl-libre" }, rating: 5, verified: true } as any,
      { id: 2, comment: "Service client f lmostawa. 3awnoni n3zal parfum li bghit. La livraison l Tanger kant rapide w l'emballage n9i.", author: "Ayoub R.", city: "Tanger", product: { name: "Armani Stronger With You", slug: "armani-stronger-with-you" }, rating: 5, verified: true } as any,
      { id: 3, comment: "J'étais fatigué d'acheter des parfums chez des revendeurs douteux. La garantie d'authenticité de NAY fait la différence.", author: "Hassan L.", city: "Casablanca", product: { name: "Armani Stronger With You", slug: "armani-stronger-with-you" }, rating: 5, verified: true } as any,
      { id: 4, comment: "Expérience incroyable. Le parfum est arrivé dans un emballage soigné en moins de 48h. L'odeur est 100% authentique.", author: "Salma B.", city: "Rabat", product: { name: "Valentino Donna Born in Roma", slug: "valentino-born-in-roma-donna" }, rating: 5, verified: true } as any,
      { id: 5, comment: "Un service client exceptionnel et un choix incroyable des plus grandes maisons de luxe. C'est de loin ma meilleure expérience.", author: "Youssef E.", city: "Tanger", product: { name: "Valentino Uomo Intense", slug: "valentino-uomo-intense" }, rating: 5, verified: true } as any,
      { id: 6, comment: "J'ai acheté Black Opium, livraison en 24h sur Casa et parfum 100% original, le sillage tient toute la journée !", author: "Kawtar B.", city: "Casablanca", product: { name: "YSL Black Opium", slug: "ysl-black-opium" }, rating: 5, verified: true } as any,
    ];
  }
  
  // Randomize reviews
  const randomReviews = [...dbReviews].sort(() => 0.5 - Math.random()).slice(0, 6);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://nayparfum.ma/#website",
    url: `https://nayparfum.ma/${currentLocale}`,
    name: "NAY Parfums",
    potentialAction: {
      "@type": "SearchAction",
      target: `https://nayparfum.ma/${currentLocale}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HomePageClient 
        products={products} 
        config={siteConfig} 
        latestReviews={randomReviews} 
        initialBrands={brandsDb}
      />
    </>
  );
}
