export interface ProductSeoAuditInput {
  id: number;
  name: string;
  slug: string;
  brandLabel?: string | null;
  price: number;
  description?: string | null;
  images?: string | null;
  seo?: {
    seoTitle?: string | null;
    metaDescription?: string | null;
    focusKeyword?: string | null;
    canonicalUrl?: string | null;
    schemaEnabled?: boolean;
    lastOptimizedAt?: Date | string | null;
  } | null;
}

export interface ProductSeoAuditResult {
  score: number;
  issues: string[];
  effectiveTitle: string;
  effectiveDescription: string;
  effectiveFocusKeyword: string;
  titleLen: number;
  descLen: number;
  hasImages: boolean;
  hasLongDesc: boolean;
  hasCustomSeo: boolean;
}

export function buildOptimalSeoTitle(name: string, brand: string): string {
  const cleanBrand = brand && brand !== 'NAY' ? ` ${brand}` : '';
  const candidate = `${name}${cleanBrand} Prix Maroc | NAY Parfums`;
  if (candidate.length <= 64) return candidate;
  const shorter = `${name} Prix Maroc | NAY Parfums`;
  return shorter.slice(0, 64);
}

export function buildOptimalMetaDescription(
  name: string,
  brand: string,
  price: number
): string {
  const b = brand || 'Maison NAY';
  const desc = `Commandez ${name} (${b}) à ${price} MAD chez NAY Parfums Maroc. Authentique garanti, livraison express 24/48h Casablanca, Rabat & paiement à la livraison.`;
  return desc.slice(0, 162);
}

export function evaluateProductSeo(product: ProductSeoAuditInput): ProductSeoAuditResult {
  const brand = product.brandLabel || 'NAY';
  const seo = product.seo;
  const hasCustomSeo = Boolean(seo && (seo.seoTitle || seo.metaDescription));

  const effectiveTitle = seo?.seoTitle?.trim() || `${product.name} - ${brand}`;
  const effectiveDescription =
    seo?.metaDescription?.trim() || (product.description || '').trim();
  const effectiveFocusKeyword =
    seo?.focusKeyword?.trim() || `${product.name.toLowerCase()} prix maroc`;

  const titleLen = effectiveTitle.length;
  const descLen = effectiveDescription.length;
  const prodDescLen = (product.description || '').trim().length;

  let hasImages = false;
  if (product.images) {
    try {
      const parsed = JSON.parse(product.images);
      hasImages = Array.isArray(parsed) && parsed.length > 0 && Boolean(parsed[0]);
    } catch {
      hasImages = product.images.startsWith('http') || product.images.startsWith('/');
    }
  }

  let score = 0;
  const issues: string[] = [];

  // 1. SEO Title check (25 pts)
  if (seo?.seoTitle?.trim()) {
    if (titleLen >= 30 && titleLen <= 68) {
      score += 25;
    } else {
      score += 14;
      issues.push(titleLen < 30 ? 'Meta Title trop court (<30 car.)' : 'Meta Title trop long (>68 car.)');
    }
  } else {
    score += 8;
    issues.push('Meta Title personnalisé manquant');
  }

  // 2. Meta Description check (25 pts)
  if (seo?.metaDescription?.trim()) {
    if (descLen >= 110 && descLen <= 168) {
      score += 25;
    } else {
      score += 14;
      issues.push(descLen < 110 ? 'Meta Description courte (<110 car.)' : 'Meta Description tronquée (>168 car.)');
    }
  } else {
    issues.push('Meta Description manquante');
  }

  // 3. Focus keyword check (15 pts)
  if (seo?.focusKeyword?.trim()) {
    score += 15;
  } else {
    issues.push('Mot-clé principal non défini');
  }

  // 4. Editorial product description depth (15 pts)
  if (prodDescLen >= 100) {
    score += 15;
  } else if (prodDescLen >= 30) {
    score += 7;
    issues.push('Description fiche produit courte (<100 car.)');
  } else {
    issues.push('Description fiche produit absente');
  }

  // 5. Visual media check (10 pts)
  if (hasImages) {
    score += 10;
  } else {
    issues.push('Aucune image produit indexable');
  }

  // 6. Canonical + Schema readiness (10 pts)
  if (seo?.canonicalUrl || seo?.schemaEnabled !== false) {
    score += 10;
  }

  return {
    score: Math.min(100, score),
    issues,
    effectiveTitle,
    effectiveDescription,
    effectiveFocusKeyword,
    titleLen,
    descLen,
    hasImages,
    hasLongDesc: prodDescLen >= 100,
    hasCustomSeo,
  };
}
