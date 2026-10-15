import React from 'react';
import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import prisma from '@/lib/prisma';
import { Product } from '@/lib/products';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  return {
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}`,
      languages: {
        'fr-MA': 'https://nayparfum.ma/fr',
        'ar-MA': 'https://nayparfum.ma/ar',
        'x-default': 'https://nayparfum.ma/fr',
      },
    },
    openGraph: {
      url: `https://nayparfum.ma/${currentLocale}`,
    },
  };
}

export default async function HomePage() {
  const [dbProducts, siteConfigDb, dbReviewsDb, brandsDb, blogPostsDb] = await Promise.all([
    prisma.product.findMany({ where: { published: true } }),
    prisma.siteConfig.findFirst(),
    prisma.review.findMany({
      where: { verified: true },
      take: 100,
      include: { product: true }
    }),
    prisma.brand.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 3
    })
  ]);

  let siteConfig = siteConfigDb;
  if (!siteConfig) {
    siteConfig = {
      id: 1,
      heroTitle: "L'Essence de l'Élégance",
      heroSubtitle: "Découvrez notre collection de parfums de luxe, conçue pour laisser une empreinte inoubliable.",
    } as any;
  }
  const products: Product[] = dbProducts.map((p) => ({
    ...p,
    brand: p.brandId as any,
    gender: p.gender as any,
    subcategory: p.subcategory as any,
    images: JSON.parse(p.images),
    notes: JSON.parse(p.notes),
    sizes: JSON.parse(p.sizes),
    tags: JSON.parse(p.tags) as any,
    bottleColor: p.bottleColor as any,
    bottleMaterial: p.bottleMaterial as any,
    perfectSeason: p.perfectSeason as any,
    originalPrice: p.originalPrice ?? undefined,
  }));

  let dbReviews = dbReviewsDb;
  if (!dbReviews || dbReviews.length === 0) {
    dbReviews = [
      { id: 1, comment: "Franchement j'avais des doutes, mais sda9 site sadi9. Khdit Libre Eau de Parfum, c'est l'original. Tbarkallah 3likom.", author: "Mounia T.", city: "Marrakech", product: { name: "YSL Libre Eau de Parfum", slug: "ysl-libre" }, rating: 5, verified: true } as any,
      { id: 2, comment: "Service client f lmostawa. 3awnoni n3zal parfum li bghit. La livraison l Tanger kant rapide w l'emballage n9i.", author: "Ayoub R.", city: "Tanger", product: { name: "Armani Stronger With You", slug: "armani-stronger-with-you" }, rating: 5, verified: true } as any,
      { id: 3, comment: "J'étais fatigué d'acheter des parfums chez des revendeurs douteux. La garantie d'authenticité de NAY fait la différence.", author: "Hassan L.", city: "Casablanca", product: { name: "Armani Stronger With You", slug: "armani-stronger-with-you" }, rating: 5, verified: true } as any,
      { id: 4, comment: "Expérience incroyable. Le parfum est arrivé dans un emballage soigné en moins de 48h. L'odeur est 100% authentique.", author: "Salma B.", city: "Rabat", product: { name: "Valentino Donna Born in Roma", slug: "valentino-born-in-roma-donna" }, rating: 5, verified: true } as any,
      { id: 5, comment: "Un service client exceptionnel et un choix incroyable des plus grandes maisons de luxe. C'est de loin ma meilleure expérience.", author: "Youssef E.", city: "Tanger", product: { name: "Valentino Uomo Intense", slug: "valentino-uomo-intense" }, rating: 5, verified: true } as any,
      { id: 6, comment: "J'ai acheté Black Opium, livraison en 24h sur Casa et parfum 100% original, le sillage tient toute la journée !", author: "Kawtar B.", city: "Casablanca", product: { name: "YSL Black Opium", slug: "ysl-black-opium" }, rating: 5, verified: true } as any,
      { id: 7, comment: "Super découverte. J'ai pris le Baccarat Rouge et il tient toute la journée ! Merci NAY.", author: "Rachid M.", city: "Agadir", product: { name: "Baccarat Rouge 540", slug: "baccarat-rouge-540" }, rating: 5, verified: true } as any,
      { id: 8, comment: "Je suis ravie de ma commande. Emballage soigné et le parfum est magnifique. Je recommande !", author: "Imane S.", city: "Oujda", product: { name: "Dior Sauvage", slug: "dior-sauvage" }, rating: 5, verified: true } as any,
    ];
  }
  
  // Randomize reviews
  let randomReviews = [...dbReviews].sort(() => 0.5 - Math.random()).slice(0, 6);

  return (
    <HomePageClient 
      products={products} 
      config={siteConfig} 
      latestReviews={randomReviews} 
      initialBrands={brandsDb}
      initialBlogPosts={blogPostsDb}
    />
  );
}
