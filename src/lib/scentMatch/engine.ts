import {
  ScentMatchFilters,
  QueueProduct,
  ScentDNAScores,
  PersonalityArchetype,
  MatchedPerfume,
  ScentDNAAnalysisResult
} from './types';
import {
  DIMENSION_KEYWORDS,
  SUBCATEGORY_MAP,
  PERSONALITY_ARCHETYPES
} from './taxonomy';

// Mulberry32 fast deterministic seeded pseudo-random number generator
export function createPRNG(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function parseNotes(raw: any): { top: string[]; heart: string[]; base: string[]; all: string[] } {
  let top: string[] = [];
  let heart: string[] = [];
  let base: string[] = [];

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        top = Array.isArray(parsed.top) ? parsed.top : [];
        heart = Array.isArray(parsed.heart) ? parsed.heart : [];
        base = Array.isArray(parsed.base) ? parsed.base : [];
      }
    } catch {
      top = [raw];
    }
  } else if (raw && typeof raw === 'object') {
    top = Array.isArray(raw.top) ? raw.top : [];
    heart = Array.isArray(raw.heart) ? raw.heart : [];
    base = Array.isArray(raw.base) ? raw.base : [];
  }

  // Filter out placeholder strings like "Notes de tête"
  const clean = (arr: string[]) =>
    arr.filter(
      (n) =>
        n &&
        typeof n === 'string' &&
        !n.toLowerCase().includes('notes de tête') &&
        !n.toLowerCase().includes('notes de cœur') &&
        !n.toLowerCase().includes('notes de fond')
    );

  const cleanTop = clean(top);
  const cleanHeart = clean(heart);
  const cleanBase = clean(base);
  const all = Array.from(new Set([...cleanTop, ...cleanHeart, ...cleanBase]));

  return {
    top: cleanTop,
    heart: cleanHeart,
    base: cleanBase,
    all
  };
}

// Compute the 6-dimension vector for a single perfume
export function getProductDimensionVector(product: {
  subcategoryLabel?: string;
  notes?: any;
  name?: string;
  description?: string;
}): ScentDNAScores {
  const scores: ScentDNAScores = {
    woody: 10,
    oriental: 10,
    floral: 10,
    fresh: 10,
    spicy: 10,
    sweet: 10
  };

  // Subcategory influence
  const sub = product.subcategoryLabel || '';
  if (SUBCATEGORY_MAP[sub]) {
    const boost = SUBCATEGORY_MAP[sub];
    for (const [dim, val] of Object.entries(boost)) {
      if (val) scores[dim as keyof ScentDNAScores] += val * 1.5;
    }
  }

  // Notes and text scan
  const parsed = parseNotes(product.notes);
  const haystack = `${sub} ${parsed.all.join(' ')} ${product.name || ''} ${product.description || ''}`.toLowerCase();

  for (const [dim, keywords] of Object.entries(DIMENSION_KEYWORDS)) {
    for (const kw of keywords) {
      if (haystack.includes(kw)) {
        scores[dim as keyof ScentDNAScores] += 15;
      }
    }
  }

  return scores;
}

// Hard filter execution on catalog
export function filterCatalog(
  products: QueueProduct[],
  filters: ScentMatchFilters
): QueueProduct[] {
  return products.filter((p) => {
    // Availability
    if (!p.inStock) return false;

    // Gender hard filter
    if (filters.gender !== 'all') {
      const pGender = (p.gender || '').toLowerCase();
      if (filters.gender === 'men' && pGender !== 'men' && pGender !== 'unisex') return false;
      if (filters.gender === 'women' && pGender !== 'women' && pGender !== 'unisex') return false;
      if (filters.gender === 'unisex' && pGender !== 'unisex') return false;
    }

    // Price range hard filter
    if (typeof filters.minPrice === 'number' && p.price < filters.minPrice) return false;
    if (typeof filters.maxPrice === 'number' && p.price > filters.maxPrice) return false;

    // Fragrance family hard filter
    if (filters.family && filters.family !== 'all') {
      const sub = (p.subcategoryLabel || '').toLowerCase();
      const keywords = DIMENSION_KEYWORDS[filters.family as keyof ScentDNAScores] || [];
      const matchSub = keywords.some((kw) => sub.includes(kw));
      const notes = parseNotes(p.notes).all.join(' ').toLowerCase();
      const matchNotes = keywords.some((kw) => notes.includes(kw));
      if (!matchSub && !matchNotes) return false;
    }

    // Season preference (soft-to-hard if specified)
    if (filters.season && filters.season !== 'all') {
      const pSeason = (p.perfectSeason || '').toLowerCase();
      const fSeason = filters.season.toLowerCase();
      if (pSeason && !pSeason.includes(fSeason) && !pSeason.includes('toutes') && !pSeason.includes('all')) {
        // If pool is large enough we filter; otherwise we keep as ranking preference
      }
    }

    return true;
  });
}

// Adaptive Randomization & Queue Ordering
export function buildAdaptiveQueue(params: {
  eligibleProducts: QueueProduct[];
  likedIds: number[];
  passedIds: number[];
  savedIds?: number[];
  seed?: number;
  batchSize?: number;
}): QueueProduct[] {
  const { eligibleProducts, likedIds, passedIds, seed = 42, batchSize } = params;
  const prng = createPRNG(seed);

  // Exclude products already swiped
  const swipedSet = new Set([...likedIds, ...passedIds]);
  const available = eligibleProducts.filter((p) => !swipedSet.has(p.id));

  if (available.length === 0) return [];

  // Effective limit: if batchSize is passed use it; otherwise use the entire eligible catalog
  const targetLimit = batchSize ? Math.min(batchSize, available.length) : available.length;

  // If no likes yet, shuffle with PRNG and return all available (or batchSize if requested)
  if (likedIds.length === 0) {
    const shuffled = [...available].sort(() => prng() - 0.5);
    return batchSize ? shuffled.slice(0, targetLimit) : shuffled;
  }

  // Compute profile vector from liked products
  const likedProducts = eligibleProducts.filter((p) => likedIds.includes(p.id));
  const aggregateVector: ScentDNAScores = {
    woody: 0,
    oriental: 0,
    floral: 0,
    fresh: 0,
    spicy: 0,
    sweet: 0
  };

  const likedNotesSet = new Set<string>();

  for (const lp of likedProducts) {
    const vec = getProductDimensionVector(lp);
    for (const [key, val] of Object.entries(vec)) {
      aggregateVector[key as keyof ScentDNAScores] += val;
    }
    const notes = parseNotes(lp.notes);
    notes.all.forEach((n) => likedNotesSet.add(n.toLowerCase()));
  }

  // Passed products vector to apply slight penalty
  const passedProducts = eligibleProducts.filter((p) => passedIds.includes(p.id));
  const passedVector: ScentDNAScores = {
    woody: 0,
    oriental: 0,
    floral: 0,
    fresh: 0,
    spicy: 0,
    sweet: 0
  };
  for (const pp of passedProducts) {
    const vec = getProductDimensionVector(pp);
    for (const [key, val] of Object.entries(vec)) {
      passedVector[key as keyof ScentDNAScores] += val;
    }
  }

  // Score available products
  const scored = available.map((prod) => {
    const vec = getProductDimensionVector(prod);
    const prodNotes = parseNotes(prod.notes).all.map((n) => n.toLowerCase());

    // Dot product with liked aggregate
    let similarityScore = 0;
    for (const [key, val] of Object.entries(vec)) {
      similarityScore += (val / 100) * (aggregateVector[key as keyof ScentDNAScores] / Math.max(1, likedProducts.length));
    }

    // Note overlap bonus
    let noteBonus = 0;
    for (const n of prodNotes) {
      if (likedNotesSet.has(n)) noteBonus += 25;
    }

    // Passed penalty
    let passedPenalty = 0;
    if (passedProducts.length > 0) {
      for (const [key, val] of Object.entries(vec)) {
        passedPenalty += (val / 100) * (passedVector[key as keyof ScentDNAScores] / passedProducts.length) * 0.4;
      }
    }

    // Seeded Jitter for controlled unpredictability (20-30% weight)
    const jitter = (prng() - 0.5) * 40;

    const totalScore = similarityScore + noteBonus - passedPenalty + jitter;
    return { product: prod, score: totalScore };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Inject 25% diversity (take top 75% adaptive + 25% random explore)
  const adaptiveCount = Math.floor(targetLimit * 0.75);
  const exploreCount = targetLimit - adaptiveCount;

  const topScored = scored.slice(0, adaptiveCount).map((s) => s.product);
  const remaining = scored.slice(adaptiveCount).map((s) => s.product);

  // Shuffle remaining exploration items
  const exploreShuffled = remaining.sort(() => prng() - 0.5);
  const exploreItems = batchSize ? exploreShuffled.slice(0, exploreCount) : exploreShuffled;

  // Interleave adaptive and exploration items
  const finalQueue: QueueProduct[] = [];
  let aIdx = 0;
  let eIdx = 0;

  while (aIdx < topScored.length || eIdx < exploreItems.length) {
    if (aIdx < topScored.length) {
      finalQueue.push(topScored[aIdx++]);
    }
    if (aIdx < topScored.length) {
      finalQueue.push(topScored[aIdx++]);
    }
    if (eIdx < exploreItems.length) {
      finalQueue.push(exploreItems[eIdx++]);
    }
  }

  return finalQueue;
}

// Generate Scent DNA, Archetype & Matches
export function calculateScentDNA(params: {
  sessionId: string;
  shareToken: string;
  allProducts: QueueProduct[];
  likedIds: number[];
  passedIds: number[];
  savedIds?: number[];
}): ScentDNAAnalysisResult {
  const { sessionId, shareToken, allProducts, likedIds, passedIds, savedIds = [] } = params;

  const likedProducts = allProducts.filter((p) => likedIds.includes(p.id));

  // Initialize raw dimension totals
  const rawScores: ScentDNAScores = {
    woody: 0,
    oriental: 0,
    floral: 0,
    fresh: 0,
    spicy: 0,
    sweet: 0
  };

  const noteOccurrences: Record<string, number> = {};

  if (likedProducts.length === 0) {
    // Default balanced scores if no likes
    rawScores.fresh = 25;
    rawScores.woody = 25;
    rawScores.oriental = 20;
    rawScores.floral = 15;
    rawScores.spicy = 10;
    rawScores.sweet = 5;
  } else {
    for (const prod of likedProducts) {
      const vec = getProductDimensionVector(prod);
      for (const [dim, val] of Object.entries(vec)) {
        rawScores[dim as keyof ScentDNAScores] += val;
      }

      const notes = parseNotes(prod.notes).all;
      for (const n of notes) {
        const key = n.trim();
        if (key.length >= 3) {
          noteOccurrences[key] = (noteOccurrences[key] || 0) + 1;
        }
      }
    }
  }

  // Normalize scores to percentages summing to 100
  const totalScore = Object.values(rawScores).reduce((a, b) => a + b, 0) || 1;
  const dnaScores: ScentDNAScores = {
    woody: Math.round((rawScores.woody / totalScore) * 100),
    oriental: Math.round((rawScores.oriental / totalScore) * 100),
    floral: Math.round((rawScores.floral / totalScore) * 100),
    fresh: Math.round((rawScores.fresh / totalScore) * 100),
    spicy: Math.round((rawScores.spicy / totalScore) * 100),
    sweet: Math.round((rawScores.sweet / totalScore) * 100)
  };

  // Ensure sum equals 100
  const currentSum = Object.values(dnaScores).reduce((a, b) => a + b, 0);
  if (currentSum !== 100) {
    dnaScores.woody += 100 - currentSum;
  }

  // Find dominant dimension
  let dominantDim: keyof ScentDNAScores = 'woody';
  let maxVal = -1;
  for (const [dim, val] of Object.entries(dnaScores)) {
    if (val > maxVal) {
      maxVal = val;
      dominantDim = dim as keyof ScentDNAScores;
    }
  }

  // Match best personality archetype
  const matchedArchetype =
    Object.values(PERSONALITY_ARCHETYPES).find((a) => a.dominantDimension === dominantDim) ||
    PERSONALITY_ARCHETYPES.LE_MAGNAT_BOISE;

  // Extract top 5 favorite notes
  const sortedNotes = Object.entries(noteOccurrences)
    .sort((a, b) => b[1] - a[1])
    .map(([note]) => note)
    .slice(0, 5);

  const favoriteNotes = sortedNotes.length >= 3 ? sortedNotes : matchedArchetype.signatureNotes.slice(0, 5);

  // Compute Top Perfume Matches across catalog
  const topMatches: MatchedPerfume[] = allProducts
    .filter((p) => p.inStock)
    .map((product) => {
      const vec = getProductDimensionVector(product);
      const prodNotes = parseNotes(product.notes).all;

      // Cosine / dimension match
      let similarity = 0;
      for (const [dim, val] of Object.entries(dnaScores)) {
        similarity += (val / 100) * (vec[dim as keyof ScentDNAScores] / 100);
      }

      // Shared notes
      const common = prodNotes.filter((pn) =>
        favoriteNotes.some((fn) => fn.toLowerCase().includes(pn.toLowerCase()) || pn.toLowerCase().includes(fn.toLowerCase()))
      );

      let matchScore = Math.min(99, Math.max(70, Math.round(similarity * 55 + common.length * 12 + 45)));

      // If user directly liked this product, boost confidence
      if (likedIds.includes(product.id)) {
        matchScore = Math.min(99, matchScore + 8);
      }

      const commonDisplay = common.length > 0 ? common.slice(0, 3) : prodNotes.slice(0, 2);

      const explanationFr = common.length > 0
        ? `Harmonie exceptionnelle de ${matchScore}%. Vos notes signatures partagées : ${commonDisplay.join(', ')} avec un accord ${product.subcategoryLabel}.`
        : `Affinité de ${matchScore}% avec votre profil ${matchedArchetype.titleFr} grâce à sa structure ${product.subcategoryLabel}.`;

      const explanationAr = common.length > 0
        ? `تناغم رائع بنسبة ${matchScore}%. نوتاتكم المشتركة: ${commonDisplay.join('، ')} مع تركيبة ${product.subcategoryLabel}.`
        : `توافق بنسبة ${matchScore}% مع نمطك العطري بفضل تركيبة ${product.subcategoryLabel}.`;

      return {
        product,
        matchScore,
        commonNotes: commonDisplay,
        dominantFamily: product.subcategoryLabel,
        explanationFr,
        explanationAr
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 4);

  return {
    sessionId,
    shareToken,
    personality: matchedArchetype,
    dnaScores,
    favoriteNotes,
    topMatches,
    totalLikes: likedIds.length,
    totalPasses: passedIds.length,
    totalSaves: savedIds.length,
    completedAt: new Date().toISOString()
  };
}

// Calculate Social Friend Compatibility
export function calculateFriendCompatibility(params: {
  hostLikedProducts: QueueProduct[];
  friendLikedProducts: QueueProduct[];
}): {
  compatibilityScore: number;
  mutualLikedProducts: QueueProduct[];
  sharedArchetype: string;
} {
  const { hostLikedProducts, friendLikedProducts } = params;

  const friendIds = new Set(friendLikedProducts.map((p) => p.id));
  const mutual = hostLikedProducts.filter((p) => friendIds.has(p.id));

  // Compute DNA for both
  const hostScores = hostLikedProducts.map((p) => getProductDimensionVector(p));
  const friendScores = friendLikedProducts.map((p) => getProductDimensionVector(p));

  const averageVector = (vecs: ScentDNAScores[]) => {
    const res: ScentDNAScores = { woody: 0, oriental: 0, floral: 0, fresh: 0, spicy: 0, sweet: 0 };
    if (vecs.length === 0) return res;
    for (const v of vecs) {
      for (const [k, val] of Object.entries(v)) {
        res[k as keyof ScentDNAScores] += val / vecs.length;
      }
    }
    return res;
  };

  const hostVec = averageVector(hostScores);
  const friendVec = averageVector(friendScores);

  // Cosine similarity
  let dot = 0;
  let magH = 0;
  let magF = 0;

  for (const k of ['woody', 'oriental', 'floral', 'fresh', 'spicy', 'sweet'] as Array<keyof ScentDNAScores>) {
    dot += hostVec[k] * friendVec[k];
    magH += hostVec[k] * hostVec[k];
    magF += friendVec[k] * friendVec[k];
  }

  const denominator = Math.sqrt(magH) * Math.sqrt(magF) || 1;
  const rawSim = Math.min(1, Math.max(0, dot / denominator));

  // Boost if they have mutual likes
  const mutualBonus = Math.min(25, mutual.length * 8);
  const compatibilityScore = Math.min(99, Math.max(58, Math.round(rawSim * 70 + 25 + mutualBonus)));

  let sharedArchetype = "Duo d'Élégance Harmonieux";
  if (hostVec.woody > 40 && friendVec.woody > 40) sharedArchetype = 'Alliance Royale Boisée';
  else if (hostVec.oriental > 40 && friendVec.oriental > 40) sharedArchetype = 'Duo Mystique Oriental';
  else if (hostVec.fresh > 40 && friendVec.fresh > 40) sharedArchetype = 'Complicité Solaire Vivifiante';
  else if (hostVec.sweet > 35 || friendVec.sweet > 35) sharedArchetype = 'Fusion Gourmande Séductrice';

  return {
    compatibilityScore,
    mutualLikedProducts: mutual,
    sharedArchetype
  };
}
