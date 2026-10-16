import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductClient from './ProductClient';
import { Product } from '@/lib/products';
import { getProductFaq, createFaqJsonLd } from '@/lib/seoFaq';
import { Metadata } from 'next';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

function getCleanDisplayName(productName: string, brandLabel: string): string {
  const nameTrimmed = productName.trim();
  const nameLower = nameTrimmed.toLowerCase();
  const brandLower = brandLabel.trim().toLowerCase();

  if (nameLower.startsWith(brandLower) || nameLower.includes(brandLower)) {
    return nameTrimmed;
  }

  const brandNorm = brandLower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const nameNorm = nameLower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (nameNorm.startsWith(brandNorm) || nameNorm.includes(brandNorm)) {
    return nameTrimmed;
  }

  const stopWords = new Set(['pour', 'with', 'from', 'sans', 'dans', 'and']);
  const brandTokens = brandNorm.split(' ').filter(w => w.length >= 4 && !stopWords.has(w));
  const firstWordName = nameNorm.split(' ')[0];
  if (brandTokens.some(token => firstWordName === token)) {
    return nameTrimmed;
  }

  return `${brandLabel.trim()} ${nameTrimmed}`;
}

export async function generateMetadata({ params }: { params: Promise<{ locale?: string; slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const product = await prisma.product.findFirst({
    where: { slug: decodedSlug, published: true },
  });

  if (!product) {
    return { title: 'Produit introuvable' };
  }

  const locale = resolvedParams.locale || 'fr';
  const images = JSON.parse(product.images || '[]');
  const displayName = getCleanDisplayName(product.name, product.brandLabel);

  const isTester = product.isTester ?? true;
  const productTypeLabel = isTester ? 'Testeur Original' : 'Parfum Original Scellé';
  const productGuarantee = isTester ? 'Testeur 100% authentique' : '100% original scellé';
  const title = `${displayName} - ${productTypeLabel} au Maroc | Prix en MAD - NAY Parfum`;
  const metaDescription = `Achetez le ${productTypeLabel.toLowerCase()} ${displayName} de ${product.brandLabel} au Maroc à ${product.price} MAD. ${productGuarantee}, même jus & tenue garantie. Livraison express 24/48h & paiement à la livraison (COD) !`;

  return {
    title: { absolute: title },
    description: metaDescription,
    keywords: [
      product.name,
      product.brandLabel,
      isTester ? 'testeur parfum original maroc' : 'parfum original maroc',
      'acheter parfum maroc',
      'prix parfum maroc',
      'عطور أصلية المغرب',
      isTester ? 'تستر عطور أصلية' : 'عطور أصلية مغلفة',
      product.subcategoryLabel || 'parfum de luxe'
    ],
    alternates: {
      canonical: `https://nayparfum.ma/${locale}/product/${product.slug}`,
      languages: {
        'fr-MA': `https://nayparfum.ma/fr/product/${product.slug}`,
        'ar-MA': `https://nayparfum.ma/ar/product/${product.slug}`,
        'x-default': `https://nayparfum.ma/fr/product/${product.slug}`,
      },
    },
    openGraph: {
      title,
      description: metaDescription,
      url: `https://nayparfum.ma/${locale}/product/${product.slug}`,
      images: images.length > 0 ? [{ url: images[0] }] : [],
    }
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale?: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const currentLocale = resolvedParams.locale || 'fr';
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  
  const dbProduct = await prisma.product.findFirst({
    where: { slug: decodedSlug, published: true },
  });

  if (!dbProduct) {
    notFound();
  }

  // Get related products (prioritize in-stock from same brand, then in-stock from same subcategory/gender)
  const dbRelatedInStockSameBrand = await prisma.product.findMany({
    where: { 
      brandId: dbProduct.brandId,
      published: true,
      inStock: true,
      stock: { gt: 0 },
      id: { not: dbProduct.id }
    },
    take: 4
  });

  let dbRelated = [...dbRelatedInStockSameBrand];

  if (dbRelated.length < 4) {
    // Fill with in-stock products from the same subcategory and gender
    const fillerInStock = await prisma.product.findMany({
      where: {
        published: true,
        inStock: true,
        stock: { gt: 0 },
        gender: dbProduct.gender,
        subcategory: dbProduct.subcategory,
        id: { notIn: [dbProduct.id, ...dbRelated.map(p => p.id)] }
      },
      take: 4 - dbRelated.length
    });
    dbRelated = [...dbRelated, ...fillerInStock];
  }

  if (dbRelated.length < 4) {
    // Fill with general in-stock products of the same gender
    const generalInStock = await prisma.product.findMany({
      where: {
        published: true,
        inStock: true,
        stock: { gt: 0 },
        gender: dbProduct.gender,
        id: { notIn: [dbProduct.id, ...dbRelated.map(p => p.id)] }
      },
      take: 4 - dbRelated.length
    });
    dbRelated = [...dbRelated, ...generalInStock];
  }

  if (dbRelated.length < 4) {
    // Fallback to any published product of the same brand if in-stock exhausted
    const fallbackSameBrand = await prisma.product.findMany({
      where: {
        brandId: dbProduct.brandId,
        published: true,
        id: { notIn: [dbProduct.id, ...dbRelated.map(p => p.id)] }
      },
      take: 4 - dbRelated.length
    });
    dbRelated = [...dbRelated, ...fallbackSameBrand];
  }

  // Get reviews
  const dbReviews = await prisma.review.findMany({
    where: { productSlug: decodedSlug },
    orderBy: { createdAt: 'desc' }
  });

  const transformProduct = (p: any): Product => ({
    id: p.id,
    slug: p.slug,
    sku: p.sku ?? null,
    name: p.name,
    brand: p.brandId,
    brandLabel: p.brandLabel,
    gender: p.gender,
    subcategory: p.subcategory,
    subcategoryLabel: p.subcategoryLabel ?? '',
    tagline: p.tagline ?? '',
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    description: p.description ?? '',
    longDescription: p.longDescription ?? '',
    images: JSON.parse(p.images || '[]'),
    notes: JSON.parse(p.notes || '{"top":[],"heart":[],"base":[]}'),
    ingredients: p.ingredients ?? '',
    sizes: JSON.parse(p.sizes || '[]'),
    bottleColor: p.bottleColor,
    bottleColorLabel: p.bottleColorLabel ?? '',
    bottleMaterial: p.bottleMaterial,
    bottleMaterialLabel: p.bottleMaterialLabel ?? '',
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    releaseDate: p.releaseDate ?? '',
    tags: JSON.parse(p.tags || '[]'),
    inStock: p.inStock ?? true,
    perfectSeason: p.perfectSeason ?? 'Toutes Saisons',
    isTester: p.isTester ?? false,
  });

  // Serialize reviews — convert Date objects to ISO strings
  const serializedReviews = dbReviews.map((r: any) => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
  }));

  const transformedProduct = transformProduct(dbProduct);
  
  let includedProducts: Product[] = [];
  if (dbProduct.subcategory === 'coffrets') {
    const standardProducts = await prisma.product.findMany({
      where: { published: true, subcategory: { not: 'coffrets' } }
    });
    const tags = typeof dbProduct.tags === 'string' ? JSON.parse(dbProduct.tags) : dbProduct.tags;
    includedProducts = (tags || []).map((slug: string) => {
      const p = standardProducts.find(sp => sp.slug === slug);
      if (p) {
        return transformProduct(p);
      }
      return null;
    }).filter(Boolean);
  }

  const productTypeDescription = transformedProduct.isTester ? 'Testeur original' : 'Parfum original scellé';

  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: transformedProduct.name,
    sku: transformedProduct.sku || `NAY-${transformedProduct.id}`,
    mpn: transformedProduct.sku || `NAY-${transformedProduct.id}`,
    image: transformedProduct.images[0],
    description: `${productTypeDescription} de ${transformedProduct.name} par ${transformedProduct.brandLabel}. Authentique à 100%. Livraison rapide 24-48h partout au Maroc et paiement à la livraison.`,
    brand: {
      '@type': 'Brand',
      name: transformedProduct.brandLabel,
    },
    offers: {
      '@type': 'Offer',
      url: `https://nayparfum.ma/${currentLocale}/product/${transformedProduct.slug}`,
      priceCurrency: 'MAD',
      price: transformedProduct.price,
      priceValidUntil: priceValidUntil.toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: transformedProduct.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'NAY Parfums'
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'MA',
        returnPolicyCountry: 'MA',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
        itemDefectReturnFees: 'https://schema.org/FreeReturn'
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 35,
          currency: 'MAD'
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'MA'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY'
          }
        }
      }
    },
    aggregateRating: transformedProduct.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: transformedProduct.rating.toFixed(1),
      reviewCount: transformedProduct.reviewCount,
    } : undefined,
  };

  if (serializedReviews && serializedReviews.length > 0) {
    jsonLd.review = serializedReviews.slice(0, 5).map((r: any) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.author || 'Client NAY'
      },
      datePublished: r.createdAt ? r.createdAt.split('T')[0] : '2026-01-01',
      reviewBody: r.comment || '',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating || 5,
        bestRating: 5,
        worstRating: 1
      }
    }));
  }

  const faqItems = getProductFaq(transformedProduct);
  const faqJsonLd = createFaqJsonLd(faqItems);

  const genderLabels: Record<string, string> = {
    men: 'Homme',
    women: 'Femme',
    unisex: 'Unisexe',
  };
  const genderLabel = genderLabels[transformedProduct.gender] || 'Boutique';

  const breadcrumbElements: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }> = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: `https://nayparfum.ma/${currentLocale}`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Boutique',
      item: `https://nayparfum.ma/${currentLocale}/shop`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: `Parfums ${genderLabel}`,
      item: `https://nayparfum.ma/${currentLocale}/shop/${transformedProduct.gender}`,
    },
  ];

  if (transformedProduct.brand) {
    breadcrumbElements.push({
      '@type': 'ListItem',
      position: breadcrumbElements.length + 1,
      name: transformedProduct.brandLabel,
      item: `https://nayparfum.ma/${currentLocale}/brands/${transformedProduct.brand}`,
    });
  }

  breadcrumbElements.push({
    '@type': 'ListItem',
    position: breadcrumbElements.length + 1,
    name: transformedProduct.name,
    item: `https://nayparfum.ma/${currentLocale}/product/${transformedProduct.slug}`,
  });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbElements,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <ProductClient 
        product={transformedProduct} 
        relatedProducts={dbRelated.map(transformProduct)} 
        initialReviews={serializedReviews}
        includedProducts={includedProducts}
      />
    </>
  );
}
