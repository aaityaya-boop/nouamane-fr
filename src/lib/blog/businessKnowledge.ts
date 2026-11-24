import prisma from '@/lib/prisma';
import { getApprovedStorePolicy } from '@/lib/agent/tools';

export interface MatchedCatalogProduct {
  id: number;
  slug: string;
  name: string;
  brandLabel: string;
  subcategoryLabel: string;
  price: number;
  originalPrice: number | null;
  tagline: string | null;
  isTester: boolean;
  notesSummary: string;
  imageUrl: string | null;
}

export interface NayBusinessDossier {
  brandName: string;
  domain: string;
  whatsapp: string;
  totalProducts: number;
  brandsCount: number;
  topBrands: string[];
  rangesSummary: {
    testersCount: number;
    originalsCount: number;
    masterCopyCount: number;
    coffretsCount: number;
  };
  policies: {
    standardShippingFeeMAD: number;
    freeShippingThresholdMAD: number;
    deliveryTimeline: string;
    tryBeforeYouPay: string;
    returnsPolicy: string;
    testersTruth: string;
  };
  activePromos: Array<{ code: string; label: string }>;
  activeDeals: Array<{ title: string; subtitle: string | null }>;
  matchedProducts: MatchedCatalogProduct[];
  systemContextPrompt: string;
}

function parseNotesSummary(raw: string | null): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    const top = Array.isArray(parsed.top) ? parsed.top.slice(0, 3).join(', ') : '';
    const heart = Array.isArray(parsed.heart) ? parsed.heart.slice(0, 3).join(', ') : '';
    const base = Array.isArray(parsed.base) ? parsed.base.slice(0, 3).join(', ') : '';
    return [
      top ? `Tête: ${top}` : '',
      heart ? `Cœur: ${heart}` : '',
      base ? `Fond: ${base}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
  } catch {
    return '';
  }
}

function parseFirstImage(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr[0] ? String(arr[0]) : null;
  } catch {
    return null;
  }
}

export async function buildNayBusinessDossier(
  ideaText: string,
  focusKeyword = ''
): Promise<NayBusinessDossier> {
  const [products, brandsCount, promos, deals] = await Promise.all([
    prisma.product.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        name: true,
        brandLabel: true,
        subcategory: true,
        subcategoryLabel: true,
        gender: true,
        price: true,
        originalPrice: true,
        tagline: true,
        notes: true,
        images: true,
        isTester: true,
      },
      orderBy: [{ reviewCount: 'desc' }, { rating: 'desc' }],
      take: 250,
    }),
    prisma.brand.count(),
    prisma.promoCode.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.specialDeal.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
      take: 5,
    }),
  ]);

  const policyResult = getApprovedStorePolicy('all');
  const p = policyResult.data;

  // Score products by relevance to the user's blog idea + keyword
  const tokens = `${ideaText} ${focusKeyword}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);

  const scored = products.map((prod) => {
    const haystack = `${prod.name} ${prod.brandLabel} ${prod.subcategoryLabel} ${prod.gender} ${prod.tagline || ''}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    let relevance = 0;
    for (const tok of tokens) {
      if (haystack.includes(tok)) relevance += 4;
    }
    if (prod.isTester && haystack.includes('testeur')) relevance += 1;
    if (tokens.includes('homme') && prod.gender === 'men') relevance += 3;
    if (tokens.includes('femme') && prod.gender === 'women') relevance += 3;
    if ((tokens.includes('coffret') || tokens.includes('cadeau')) && prod.subcategory.includes('coffret')) {
      relevance += 5;
    }
    if (tokens.includes('oud') && haystack.includes('oud')) relevance += 5;

    return { prod, relevance };
  });

  scored.sort((a, b) => b.relevance - a.relevance);
  const topMatched = scored.slice(0, 6).map(({ prod }) => ({
    id: prod.id,
    slug: prod.slug,
    name: prod.name,
    brandLabel: prod.brandLabel || 'Maison NAY',
    subcategoryLabel: prod.subcategoryLabel || 'Parfum',
    price: prod.price,
    originalPrice: prod.originalPrice || null,
    tagline: prod.tagline || null,
    isTester: Boolean(prod.isTester),
    notesSummary: parseNotesSummary(prod.notes),
    imageUrl: parseFirstImage(prod.images),
  }));

  const testersCount = products.filter((x) => x.isTester).length;
  const coffretsCount = products.filter((x) => x.subcategory?.includes('coffret')).length;
  const masterCopyCount = products.filter((x) => x.subcategory?.includes('master')).length;
  const originalsCount = Math.max(0, products.length - testersCount - coffretsCount - masterCopyCount);

  const topBrands = Array.from(
    new Set(products.map((x) => x.brandLabel).filter(Boolean))
  ).slice(0, 14);

  const activePromos = promos.map((pr) => ({
    code: pr.code,
    label:
      pr.type === 'percentage' || pr.type === 'PERCENTAGE'
        ? `-${pr.value}%`
        : `-${pr.value} MAD`,
  }));

  const activeDeals = deals.map((d) => ({
    title: d.title,
    subtitle: d.subtitle || null,
  }));

  const policies = {
    standardShippingFeeMAD: p.shipping.standardFee,
    freeShippingThresholdMAD: p.shipping.freeShippingThreshold,
    deliveryTimeline: p.shipping.deliveryTimeline,
    tryBeforeYouPay: p.try_before_you_pay.inspectionDetails,
    returnsPolicy: `Retours possibles sous ${p.returns.noticePeriodDays} jours via WhatsApp ${p.returns.officialChannel}`,
    testersTruth: `${p.testers.origin} Prix habituel : ${p.testers.priceRange}. ${p.testers.authenticityGuarantee}`,
  };

  const systemContextPrompt = `
=== DOSSIER OFFICIEL DE L'ENTREPRISE : MAISON NAY PARFUMS (https://nayparfum.ma) ===
1. IDENTITÉ & POSITIONNEMENT :
- Maison NAY Parfums est la parfumerie e-commerce de référence au Maroc basée à Casablanca, servant toutes les villes (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, Oujda, Meknès...).
- Catalogue réel actuel : ${products.length} parfums publiés répartis sur ${brandsCount} grandes maisons (${topBrands.join(', ')}).
- Nos 4 univers phares :
  • Testeurs Originaux 100ml (${testersCount} références, 299 à 499 MAD) : flacons authentiques destinés à la démonstration (boîte neutre blanche/kraft, exactement le même jus et la même tenue que le flacon commercial scellé).
  • Parfums Originaux Scellés (${originalsCount} références) : éditions retail complètes sous blister.
  • Gamme Master Copy (${masterCopyCount} références) : alternatives accessibles de haute qualité.
  • Coffrets Cadeaux & Discovery Sets (${coffretsCount} références) : idéaux pour cadeaux, mariages et fêtes au Maroc.

2. POLITIQUES COMMERCIALES & PREUVES DE CONFIANCE EXACTES (NE JAMAIS INVENTER D'AUTRES CHIFFRES) :
- Livraison Express Maroc : ${policies.deliveryTimeline}. Frais standards : ${policies.standardShippingFeeMAD} MAD, LIVRAISON GRATUITE dès ${policies.freeShippingThresholdMAD} MAD d'achat.
- Garantie "Vérifier avant de payer" (Essai / Inspection COD) : ${policies.tryBeforeYouPay}. En cas de refus sur place, le client ne paie 0 MAD.
- Paiement : Cash à la livraison (COD) partout au Maroc.
- Support & Retours : ${policies.returnsPolicy}. Conseiller client WhatsApp : +212 663-380011.
${activePromos.length > 0 ? `- Codes promo actifs en boutique : ${activePromos.map((x) => `${x.code} (${x.label})`).join(', ')}.` : ''}
${activeDeals.length > 0 ? `- Offres spéciales actives au panier : ${activeDeals.map((d) => d.title).join(' ; ')}.` : ''}

3. PRODUITS RÉELS DU CATALOGUE LES PLUS PERTINENTS POUR CETTE IDÉE :
${topMatched
  .map(
    (mp) =>
      `- ${mp.name} (${mp.brandLabel}) | Prix : ${mp.price} MAD | Lien interne : /fr/products/${mp.slug}${
        mp.notesSummary ? ` | Notes : ${mp.notesSummary}` : ''
      }`
  )
  .join('\n')}
`.trim();

  return {
    brandName: 'Maison NAY Parfums',
    domain: 'https://nayparfum.ma',
    whatsapp: '+212 663-380011',
    totalProducts: products.length,
    brandsCount,
    topBrands,
    rangesSummary: {
      testersCount,
      originalsCount,
      masterCopyCount,
      coffretsCount,
    },
    policies,
    activePromos,
    activeDeals,
    matchedProducts: topMatched,
    systemContextPrompt,
  };
}
