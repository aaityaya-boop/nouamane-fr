import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import PromoClient from './PromoClient';
import { PRODUCTS, Product } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function PromoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  const landingPage = await prisma.landingPage.findUnique({
    where: { slug: decodedSlug }
  });

  const cookieStore = await cookies();
  const isAdmin = cookieStore.has('admin_token') || cookieStore.has('admin_session');

  if (!landingPage || (landingPage.status !== 'active' && !isAdmin)) {
    notFound();
  }

  // Parse rich landing page configuration
  let pageConfig: any = {
    products: [],
    customProducts: [],
    bundles: [],
    features: [],
    reviews: [],
    faqs: [],
    story: '',
    urgencyText: "⚡ Offre Spéciale Limitée au Stock Disponible · Livraison 24/48H Partout au Maroc",
    whatsappNumber: '+212663380011',
    theme: 'luxury-gold',
    viewersCount: 16
  };

  try {
    const rawParsed = JSON.parse(landingPage.productSlugs || '[]');
    if (Array.isArray(rawParsed)) {
      // Legacy format: array of { slug, promoPrice } or strings
      pageConfig.products = rawParsed.map((item: any) => 
        typeof item === 'string' ? { slug: item, promoPrice: null } : item
      );
    } else if (rawParsed && typeof rawParsed === 'object') {
      pageConfig = {
        ...pageConfig,
        ...rawParsed,
        products: rawParsed.products || [],
        customProducts: rawParsed.customProducts || [],
        bundles: rawParsed.bundles || [],
        features: rawParsed.features || [],
        reviews: rawParsed.reviews || [],
        faqs: rawParsed.faqs || []
      };
    }
  } catch (e) {
    console.error('Error parsing landing page configuration:', e);
  }

  // 1. Process catalog products
  const selectedCatalogProducts: Product[] = [];
  if (Array.isArray(pageConfig.products)) {
    for (const item of pageConfig.products) {
      const match = PRODUCTS.find(p => p.slug === item.slug);
      if (match) {
        selectedCatalogProducts.push({
          ...match,
          price: item.promoPrice ? Number(item.promoPrice) : match.price,
          originalPrice: item.promoPrice ? match.price : (match.originalPrice || Math.round(match.price * 1.3))
        });
      }
    }
  }

  // 2. Process custom products (e.g. cosmetics, skincare, luxury care)
  const customProductsList: any[] = [];
  if (Array.isArray(pageConfig.customProducts) && pageConfig.customProducts.length > 0) {
    pageConfig.customProducts.forEach((cp: any, index: number) => {
      customProductsList.push({
        id: cp.id || `custom-${index + 1}`,
        slug: cp.slug || `custom-product-${index + 1}`,
        name: cp.name || landingPage.title,
        brandLabel: cp.brand || 'Maison NAY Cosmétiques',
        category: cp.category || 'Cosmétique & Soin',
        price: Number(cp.promoPrice) || Number(cp.price) || 390,
        originalPrice: Number(cp.price) || Math.round((Number(cp.promoPrice) || 390) * 1.4),
        description: cp.description || landingPage.subtitle,
        images: cp.imageUrl ? [cp.imageUrl] : [landingPage.heroImage],
        isCustom: true,
        keyFeatures: cp.keyFeatures || '',
        mainBenefit: cp.mainBenefit || '',
        inStock: true,
        stock: 15
      });
    });
  }

  // Combine products for display
  const allProductsToDisplay = [...selectedCatalogProducts, ...customProductsList];

  // If no products at all, fallback to bestsellers from catalog
  const productsToDisplay = allProductsToDisplay.length > 0 
    ? allProductsToDisplay 
    : PRODUCTS.filter(p => p.tags.includes('bestseller')).slice(0, 3);

  return (
    <PromoClient 
      landingPage={landingPage} 
      products={productsToDisplay} 
      pageConfig={pageConfig}
    />
  );
}
