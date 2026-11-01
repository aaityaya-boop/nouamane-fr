import { Product } from '@/lib/products';

export type ProductEditionType = 'tester' | 'original' | 'master_copy' | 'coffret' | 'oriental';

export interface ProductEditionInfo {
  type: ProductEditionType;
  label: string;
  shortLabel: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
}

/**
 * Resolves the clean, minimalist perfume edition / type for any catalog product.
 * Clean, typography-first, no clutter, no icons.
 */
export function getProductEditionInfo(
  product: Pick<Product, 'slug' | 'subcategory' | 'tags' | 'isTester' | 'name'>,
  locale: string = 'fr'
): ProductEditionInfo {
  const isAr = locale === 'ar';
  const isEn = locale === 'en';

  const slugLower = (product.slug || '').toLowerCase();
  const subcatLower = (product.subcategory || '').toLowerCase();
  const nameLower = (product.name || '').toLowerCase();

  let tags: string[] = [];
  try {
    if (typeof product.tags === 'string') {
      tags = JSON.parse(product.tags);
    } else if (Array.isArray(product.tags)) {
      tags = product.tags;
    }
  } catch {
    tags = [];
  }

  // 1. Master Copy
  const isMasterCopy =
    subcatLower === 'master-copier' ||
    tags.includes('master-copy') ||
    tags.includes('master-copier') ||
    slugLower.includes('master-cop') ||
    nameLower.includes('master copy');

  if (isMasterCopy) {
    return {
      type: 'master_copy',
      label: isAr ? 'ماستر كوبي' : 'MASTER COPY',
      shortLabel: isAr ? 'ماستر كوبي' : 'MASTER COPY',
      badgeBg: 'bg-white/95',
      textColor: 'text-[#1E40AF]',
      borderColor: 'border-blue-200/70',
    };
  }

  // 2. Coffrets / Gift Sets
  const isCoffret =
    subcatLower === 'coffrets' ||
    tags.includes('coffret') ||
    slugLower.includes('coffret') ||
    nameLower.includes('coffret');

  if (isCoffret) {
    return {
      type: 'coffret',
      label: isAr ? 'علبة هدايا' : isEn ? 'GIFT SET' : 'COFFRET',
      shortLabel: isAr ? 'علبة هدايا' : 'COFFRET',
      badgeBg: 'bg-white/95',
      textColor: 'text-[#9F1239]',
      borderColor: 'border-rose-200/70',
    };
  }

  // 3. Authentic Tester (Demonstration flacon)
  const isTester =
    product.isTester === true ||
    slugLower.includes('tester') ||
    slugLower.includes('testeur') ||
    subcatLower === 'testeurs' ||
    tags.includes('tester');

  if (isTester) {
    return {
      type: 'tester',
      label: isAr ? 'تيستور' : isEn ? 'TESTER' : 'TESTEUR',
      shortLabel: isAr ? 'تيستور' : isEn ? 'TESTER' : 'TESTEUR',
      badgeBg: 'bg-white/95',
      textColor: 'text-[#4B5563]',
      borderColor: 'border-[#E5E0D4]',
    };
  }

  // 4. Default: Sealed Retail Original
  return {
    type: 'original',
    label: isAr ? 'أصلي' : 'ORIGINAL',
    shortLabel: isAr ? 'أصلي' : 'ORIGINAL',
    badgeBg: 'bg-white/95',
    textColor: 'text-[#065F46]',
    borderColor: 'border-emerald-200/70',
  };
}
