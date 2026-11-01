import {
  evaluateSecurityAndPrivacy,
  sanitizeInputText
} from '@/lib/agent/securityAndPrivacy';
import {
  searchCatalog,
  getProductDetails,
  compareCatalogProducts,
  checkProductAvailability,
  getApprovedStorePolicy,
  resolveCustomerIntent,
  retrieveAuthorizedFragranceKnowledge,
  getVerifiedExternalSource,
  generateHumanSupportHandoff
} from '@/lib/agent/tools';
import {
  lookupVerifiedManufacturer,
  FRAGRANTICA_ADAPTER_STATUS,
  GENERAL_PERFUMERY_KNOWLEDGE
} from '@/lib/agent/knowledgeBase';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages } from 'ai';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import path from 'path';
import { detectCustomerIntent, extractOlfactoryNotes } from '@/lib/advisor/advisorAnalytics';

type SupportedLanguage = 'darija' | 'arabic' | 'french' | 'english';

/**
 * Robust multilingual language detector
 * Accurately classifies Moroccan Darija (Arabizi Latin & Arabic script), Modern Standard Arabic, French, English.
 */
function detectLanguage(text: string, locale: string = 'fr'): SupportedLanguage {
  const lower = text.toLowerCase();

  // 1. Detect Moroccan Darija in Arabizi (Latin script with 3, 7, 9 or Moroccan phonetic markers)
  const arabiziPatterns = [
    /\b(salam|slm|khoya|khti|bghit|ri7a|fowwa7|fowah|mzyan|mzyana|wach|wax|bch7al|chhal|ch7al|daba|dyal|dyali|kayn|kyna|khelles|fabor|3afak|3afek|lah|zwin|zwina|tbarkellah|chokran|choukrane|fin|fo9ach|taman|lparfum|lcolis|livery|li7a|tswira|taswira)\b/i,
    /\b(3ers|3afak|3afek|7el|n7el|9aleb|n9leb|chouf|khedma|khedam|dar|kbir|sghir|chita|lberd|sayf|saif|sif|yla9|la9)\b/i,
    /\b(bghina|bghiti|bghaw|3tini|3tina|chno|chnou|ash|wash|dial|diali|khelles|khllos)\b/i,
  ];
  if (arabiziPatterns.some(p => p.test(lower))) {
    return 'darija';
  }

  // 2. Detect Moroccan Darija in Arabic Script
  const arabicDarijaWords = [
    'بغيت', 'خويا', 'أختي', 'ريحة', 'زوينة', 'زوين', 'فواحة', 'فواح', 'ثابتة', 'واش', 
    'بشحال', 'شحال', 'ديال', 'ديالي', 'كاين', 'كاينة', 'عافاك', 'الله يخليك', 'شكرا', 
    'دابا', 'الكولية', 'فابور', 'كازا', 'فين', 'فوقاش', 'نخلص', 'نحل', 'نقلب', 'طرد', 
    'ليفرور', 'درهم', 'كادو', 'عرس', 'حلال', 'ديور', 'مزيان', 'مزيانة', 'كيشد', 'كتشد',
    'تصويرة', 'صورة', 'تتبع', 'طلبية', 'شنو', 'عطيني', 'البرد', 'شتا', 'شتوة', 'صيف', 'يلاق', 'يلايق'
  ];
  if (arabicDarijaWords.some(w => lower.includes(w))) {
    return 'darija';
  }

  // 3. Detect Standard Arabic (Arabic script without Darija markers)
  const hasArabicChars = /[\u0600-\u06FF]/.test(text);
  if (hasArabicChars) {
    return 'arabic';
  }

  // 4. Detect English
  const englishWords = [
    'hello', 'hi ', 'looking for', 'how much', 'what is the price', 'shipping', 
    'delivery time', 'do you have', 'track my order', 'i want to buy', 'can i open', 
    'what are the notes', 'difference between', 'recommend', 'perfume for', 'fragrance'
  ];
  if (englishWords.some(w => lower.includes(w))) {
    return 'english';
  }

  // Default to user locale or French
  if (locale === 'ar') return 'arabic';
  if (locale === 'en') return 'english';
  return 'french';
}

/**
 * Safely parse notes JSON into top, heart, base arrays
 */
function parseNotes(notes: any): { top: string[]; heart: string[]; base: string[] } {
  if (!notes) return { top: [], heart: [], base: [] };
  try {
    const parsed = typeof notes === 'string' ? JSON.parse(notes) : notes;
    return {
      top: Array.isArray(parsed.top) ? parsed.top : (parsed.top ? [String(parsed.top)] : []),
      heart: Array.isArray(parsed.heart) ? parsed.heart : (parsed.heart ? [String(parsed.heart)] : []),
      base: Array.isArray(parsed.base) ? parsed.base : (parsed.base ? [String(parsed.base)] : [])
    };
  } catch {
    return { top: [], heart: [], base: [] };
  }
}

/**
 * Safely parse sizes JSON into formatted size labels
 */
function parseSizes(sizes: any): { label: string; price?: number }[] {
  if (!sizes) return [];
  try {
    const parsed = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
    if (Array.isArray(parsed)) {
      return parsed.map((s: any) => ({
        label: s.label || s.size || (typeof s === 'string' ? s : '100ml'),
        price: s.price
      }));
    }
  } catch {}
  return [];
}

/**
 * Verified Knowledge Base for Iconic Unlisted Fragrances
 * (Only contains fragrances genuinely absent from NAY's catalog)
 */
interface UnlistedPerfume {
  name: string;
  brand: string;
  family: string;
  notes: { top: string; heart: string; base: string };
  alternativeSlugs: string[];
}

const UNLISTED_PERFUMES: Record<string, UnlistedPerfume> = {
  'elysium': {
    name: 'Elysium Pour Homme',
    brand: 'Roja Parfums',
    family: 'Fougère Aromatique Hespéridé',
    notes: {
      top: 'Pamplemousse vif, Citron, Bergamote, Thym & Armoise',
      heart: 'Vétiver, Baies de Genièvre, Cassis, Pomme, Poivre rose & Jasmin',
      base: 'Ambre gris, Cuir noble, Benjoin, Vanille & Cèdre'
    },
    alternativeSlugs: ['acqua-di-gio-profumo-eau-de-parfum-tester', 'acqua-di-gio-eau-de-toilette-giorgio-armani-tester']
  },
  'santal 33': {
    name: 'Santal 33',
    brand: 'Le Labo',
    family: 'Boisé Aromatique Cuiré',
    notes: {
      top: 'Cardamome vive, Accord Papyrus & Violette',
      heart: 'Bois de cèdre de Virginie, Santal d’Australie & Iris',
      base: 'Cuir fumé noble, Ambre doux & Muscs blancs'
    },
    alternativeSlugs: ['TOM-FORD-OUD-WOOD-Edp', 'tom-ford-tobacco-vanille-tester']
  },
  'le labo': {
    name: 'Santal 33',
    brand: 'Le Labo',
    family: 'Boisé Aromatique Cuiré',
    notes: {
      top: 'Cardamome vive, Accord Papyrus & Violette',
      heart: 'Bois de cèdre de Virginie, Santal d’Australie & Iris',
      base: 'Cuir fumé noble, Ambre doux & Muscs blancs'
    },
    alternativeSlugs: ['TOM-FORD-OUD-WOOD-Edp', 'tom-ford-tobacco-vanille-tester']
  },
  'angels share': {
    name: "Angels' Share",
    brand: 'Kilian Paris',
    family: 'Ambré Gourmand Boisé',
    notes: {
      top: 'Cognac opulent & essence de chêne',
      heart: 'Cannelle épicée, Fève tonka & Absolu de chêne',
      base: 'Praliné fondant, Vanille douce & Bois de santal crémeux'
    },
    alternativeSlugs: ['armani-prive-magenta-tanzanite-tester', 'xerjoff-naxos-tester']
  },
  'kilian': {
    name: "Angels' Share",
    brand: 'Kilian Paris',
    family: 'Ambré Gourmand Boisé',
    notes: {
      top: 'Cognac opulent & essence de chêne',
      heart: 'Cannelle épicée, Fève tonka & Absolu de chêne',
      base: 'Praliné fondant, Vanille douce & Bois de santal crémeux'
    },
    alternativeSlugs: ['armani-prive-magenta-tanzanite-tester', 'xerjoff-naxos-tester']
  },
  'carlisle': {
    name: 'Carlisle',
    brand: 'Parfums de Marly',
    family: 'Floral Boisé Ambré',
    notes: {
      top: 'Bergamote fraîche & Noix de muscade piquante',
      heart: 'Violette délicate & Rose de Damas',
      base: 'Patchouli d’Indonésie, Vanille de Madagascar & Opoponax'
    },
    alternativeSlugs: ['parfums-de-marly-layton-tester', 'amouage-interlude-man-tester']
  },
  'side effect': {
    name: 'Side Effect',
    brand: 'Initio Parfums Privés',
    family: 'Ambré Tabac Gourmand',
    notes: {
      top: 'Cannelle chaleureuse & Rhum ambré',
      heart: 'Tabac blond & Safran précieux',
      base: 'Vanille crémeuse & Hédione'
    },
    alternativeSlugs: ['armani-stronger-with-you-tobacco-eau-de-parfum-tester', 'armani-prive-magenta-tanzanite-tester']
  },
  'baccarat rouge extrait': {
    name: 'Baccarat Rouge 540 Extrait de Parfum',
    brand: 'Maison Francis Kurkdjian',
    family: 'Ambré Floral Boisé',
    notes: {
      top: 'Amande amère du Maroc & Safran',
      heart: 'Jasmin Grandiflorum d’Égypte & Cèdre',
      base: 'Ambre gris & Accord boisé musqué'
    },
    alternativeSlugs: ['baccarat-rouge-540-tester', 'vert-malachite-armani-prive-eau-de-parfum-tester']
  }
};

/**
 * Check if query matches an unlisted fragrance
 */
function findUnlistedPerfume(corpus: string): UnlistedPerfume | null {
  const lower = corpus.toLowerCase();
  for (const [key, perfume] of Object.entries(UNLISTED_PERFUMES)) {
    if (
      lower.includes(key) || 
      lower.includes(perfume.name.toLowerCase()) || 
      (perfume.brand.toLowerCase().includes('roja') && lower.includes('roja')) ||
      (perfume.brand.toLowerCase().includes('kilian') && lower.includes('kilian')) ||
      (perfume.name.toLowerCase().includes('side effect') && lower.includes('side effect'))
    ) {
      return perfume;
    }
  }
  return null;
}

function extractBudget(text: string): number | null {
  // Pattern 1: Explicit currency suffix: e.g. "300 dh", "400mad", "500 درهم"
  const currencyMatch = text.match(/\b(\d{2,4})\s*(?:dh|mad|درهم)\b/i);
  if (currencyMatch && currencyMatch[1]) {
    const val = parseInt(currencyMatch[1], 10);
    if (val >= 150 && val <= 5000) return val;
  }
  // Pattern 2: Explicit budget prefix: e.g. "budget 300", "prix 400", "mizaniya 500"
  const prefixMatch = text.match(/\b(?:budget|prix|mizaniya|ميزانية)\s*(?:de|dyal|d|dyali)?\s*(\d{2,4})\b/i);
  if (prefixMatch && prefixMatch[1]) {
    const val = parseInt(prefixMatch[1], 10);
    if (val >= 150 && val <= 5000) return val;
  }
  return null;
}

/**
 * Extract multi-turn context from conversation history
 */
function extractConversationMemory(messages: any[]): {
  lastMentionedSlug?: string;
  previousSeason?: string;
  previousGender?: string;
  previousBudget?: number;
} {
  const result: {
    lastMentionedSlug?: string;
    previousSeason?: string;
    previousGender?: string;
    previousBudget?: number;
  } = {};

  if (!Array.isArray(messages) || messages.length === 0) return result;

  // Scan recent messages backwards, ignoring welcome/intro messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.id === 'welcome' || (msg?.id && String(msg.id).startsWith('welcome-'))) continue;
    const text = (msg?.content || '').toLowerCase();
    if (text.includes('atelier nay parfums · service client') || text.includes('خدمة الزبناء والكونسيرج الخاص') || text.includes('bienvenue à l\'atelier')) continue;

    // Slug match in assistant messages
    if (msg.role === 'assistant' && !result.lastMentionedSlug) {
      const match = text.match(/\/(?:[a-z]{2}\/)?product\/([a-zA-Z0-9_.-]+)/i);
      if (match && match[1]) {
        result.lastMentionedSlug = decodeURIComponent(match[1].replace(/%20/g, ' '));
      }
    }

    // Season match
    if (!result.previousSeason) {
      if (text.includes('hiver') || text.includes('chita') || text.includes('شتوة') || text.includes('شتا') || text.includes('berd')) {
        result.previousSeason = 'Hiver';
      } else if (text.includes('été') || text.includes('sayf') || text.includes('saif') || text.includes('sif') || text.includes('صيف')) {
        result.previousSeason = 'Été';
      }
    }

    // Gender match
    if (!result.previousGender) {
      if (text.includes('homme') || text.includes('رجالي') || text.includes('pour lui') || text.includes('men')) {
        result.previousGender = 'men';
      } else if (text.includes('femme') || text.includes('نسائي') || text.includes('pour elle') || text.includes('women')) {
        result.previousGender = 'women';
      }
    }

    // Budget match ONLY from user messages
    if (msg.role === 'user' && !result.previousBudget) {
      const bVal = extractBudget(text);
      if (bVal) {
        result.previousBudget = bVal;
      }
    }
  }

  return result;
}

const GENERIC_PERFUME_TOKENS = new Set([
  'eau', 'de', 'parfum', 'toilette', 'tester', 'testeur', 'pour', 'homme', 'femme', 
  'edp', 'edt', 'elixir', 'le', 'la', 'les', 'un', 'une', 'du', 'des', 
  'dior', 'tom', 'ford', 'giorgio', 'armani', 'chanel', 'ysl', 'flacon', 'bouteille', 'photo',
  'men', 'man', 'women', 'woman', 'black', 'white', 'intense', 'mini', 'size', 'ml'
]);

/**
 * Score a single product against a search query
 */
function scoreProduct(p: any, query: string, ocrText: string = ''): number {
  let score = 0;
  const q = query.toLowerCase();
  const pName = (p.name || '').toLowerCase();
  const pBrand = (p.brandLabel || '').toLowerCase();
  const pSlug = (p.slug || '').toLowerCase();

  // 1. Brand match with word boundary
  if (pBrand.length > 2) {
    const brandRegex = new RegExp(`(?:^|[^a-z0-9])${pBrand}(?:$|[^a-z0-9])`, 'i');
    if (brandRegex.test(q)) {
      score += 25;
    }
  }

  // 2. Distinctive name tokens
  const distinctiveTokens = pName
    .split(/[\s-]+/)
    .map((t: string) => t.replace(/[^a-z0-9]/g, ''))
    .filter((t: string) => t.length >= 3 && !GENERIC_PERFUME_TOKENS.has(t));

  let matchedDistinctive = 0;
  distinctiveTokens.forEach((t: string) => {
    const tokenRegex = new RegExp(`(?:^|[^a-z0-9])${t}(?:$|[^a-z0-9])`, 'i');
    if (tokenRegex.test(q)) {
      score += 40;
      matchedDistinctive++;
    }
  });

  if (matchedDistinctive === 0 && !ocrText) {
    return 0;
  }

  // 3. Flanker & concentration matching
  const isElixir = q.includes('elixir');
  const isEdp = q.includes('edp') || q.includes('eau de parfum');
  const isEdt = q.includes('edt') || q.includes('eau de toilette');
  const isParfum = q.includes('parfum') && !isEdp && !isElixir && !isEdt;
  const isProfumo = q.includes('profumo');
  const isIntense = q.includes('intense');

  const pIsElixir = pName.includes('elixir') || pSlug.includes('elixir');
  const pIsEdp = pName.includes('edp') || pName.includes('eau de parfum') || pSlug.includes('eau-de-parfum');
  const pIsEdt = pName.includes('edt') || pName.includes('eau de toilette') || pSlug.includes('eau-de-toilette');
  const pIsParfum = (pName.includes('le parfum') || pName.includes('parfum') || pSlug.includes('le-parfum')) && !pIsEdp && !pIsElixir && !pIsEdt;
  const pIsProfumo = pName.includes('profumo') || pSlug.includes('profumo');
  const pIsIntense = pName.includes('intense') || pSlug.includes('intense');

  if (isElixir) {
    if (pIsElixir) score += 50;
    else score -= 40;
  }
  if (isProfumo) {
    if (pIsProfumo) score += 60;
    else score -= 40;
  }
  if (isEdp) {
    if (pIsEdp) score += 40;
    else if (pIsElixir) score -= 40;
  }
  if (isEdt) {
    if (pIsEdt) score += 40;
    else if (pIsElixir) score -= 40;
  }
  if (isIntense) {
    if (pIsIntense) score += 40;
    else score -= 20;
  }
  if (isParfum) {
    if (pIsParfum) score += 40;
  }

  // 4. OCR matching
  if (ocrText.length > 2) {
    const ocrLower = ocrText.toLowerCase();
    if (ocrLower.includes(pBrand)) score += 35;
    distinctiveTokens.forEach((t: string) => {
      if (ocrLower.includes(t)) score += 35;
    });
    if (ocrLower.includes('profumo') && pIsProfumo) score += 60;
    if (ocrLower.includes('elixir') && pIsElixir) score += 50;
  }

  return score;
}

function findBestProductMatch(query: string, products: any[]): any | null {
  let best = null;
  let maxScore = 0;
  for (const p of products) {
    const s = scoreProduct(p, query);
    if (s > maxScore) {
      maxScore = s;
      best = p;
    }
  }
  return maxScore >= 35 ? best : null;
}

/**
 * Detect and resolve a head-to-head comparison between two perfumes
 */
function findProductsForComparison(query: string, products: any[]): { p1: any; p2: any; requestedP1Variant?: string; requestedP2Variant?: string } | null {
  const lower = query.toLowerCase();
  const comparisonSplitters = [' vs ', ' versus ', ' contre ', ' et ', ' and ', ' o ', ' w ', ' wa ', ' bin ', ' بين '];
  
  for (const sep of comparisonSplitters) {
    if (lower.includes(sep)) {
      const parts = lower.split(sep);
      if (parts.length >= 2) {
        const part1 = parts[0].replace(/.*?(?:différence entre|difference entre|comparer|compare|مقارنة بين|الفرق بين|far9 bin|farq bin)/i, '').trim();
        const part2 = parts[1].split(/[?,.!]/)[0].trim();
        
        if (part1.length > 2 && part2.length > 2) {
          const match1 = findBestProductMatch(part1, products);
          const match2 = findBestProductMatch(part2, products);
          if (match1 && match2 && match1.slug !== match2.slug) {
            const req1Variant = part1.includes('edt') ? 'EDT' : (part1.includes('edp') ? 'EDP' : (part1.includes('elixir') ? 'Elixir' : undefined));
            const req2Variant = part2.includes('edt') ? 'EDT' : (part2.includes('edp') ? 'EDP' : (part2.includes('elixir') ? 'Elixir' : undefined));
            return { p1: match1, p2: match2, requestedP1Variant: req1Variant, requestedP2Variant: req2Variant };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Sprint 41.1 NAY AI Fragrance Concierge 3.0 Core Engine
 * Incorporates strict commercial truth, objective performance, indicative concentrations,
 * zero fabricated warehouse locations, and zero unverified discount claims.
 */
function generateConciergeResponse(
  userText: string,
  products: any[],
  messages: any[] = [],
  userLocale: string = 'fr',
  hasImageAttachment: boolean = false,
  attachmentName: string = '',
  ocrText: string = '',
  geminiQuotaExhausted: boolean = false
): { reply: string; slugs: string[] } {
  const cleanAttachment = (attachmentName || '')
    .toLowerCase()
    .replace(/\b(jpg|jpeg|png|webp|gif|image|img|photo|camera|screenshot|capture|bottle|flacon|blurry|dark|light|pic|picture)\b/gi, ' ')
    .replace(/[-_.]+/g, ' ')
    .trim();

  const combinedSearchCorpus = `${userText} ${cleanAttachment} ${ocrText}`.toLowerCase().trim();
  const lang = detectLanguage(combinedSearchCorpus || userText, userLocale);
  const memory = extractConversationMemory(messages);
  const lowerText = userText.toLowerCase();

  // Active context product from previous turns
  const contextProduct = memory.lastMentionedSlug 
    ? products.find((p: any) => p.slug === memory.lastMentionedSlug || p.slug.toLowerCase() === memory.lastMentionedSlug?.toLowerCase())
    : null;

  // Active filters
  const activeBudget = extractBudget(userText) ?? memory.previousBudget;
  const activeGender = (lowerText.includes('homme') || lowerText.includes('رجالي') || lowerText.includes('pour lui') || lowerText.includes('men'))
    ? 'men'
    : ((lowerText.includes('femme') || lowerText.includes('نسائي') || lowerText.includes('pour elle') || lowerText.includes('women'))
      ? 'women'
      : memory.previousGender);

  const isWinterQuery = lowerText.includes('hiver') || lowerText.includes('chita') || lowerText.includes('شتوة') || lowerText.includes('شتا') || lowerText.includes('berd') || lowerText.includes('البرد');
  const isSummerQuery = lowerText.includes('été') || lowerText.includes('sayf') || lowerText.includes('saif') || lowerText.includes('sif') || lowerText.includes('صيف');
  const activeSeason = isWinterQuery ? 'Hiver' : (isSummerQuery ? 'Été' : memory.previousSeason);

  // Check if a direct brand is mentioned in the current query
  const hasDirectBrandMention = products.some((p: any) => {
    const brand = (p.brandLabel || '').toLowerCase();
    return brand.length > 2 && lowerText.includes(brand);
  });

  // =========================================================================
  // 1. MULTI-TURN FOLLOW-UP CONTINUITY (PREVIOUS PRODUCT CONTEXT)
  // =========================================================================
  if (contextProduct && !hasImageAttachment && !hasDirectBrandMention) {
    const isSeasonFollowUp = isWinterQuery || isSummerQuery || lowerText.includes('yla9') || lowerText.includes('مناسب ل') || lowerText.includes('convient pour') || lowerText.includes('saison');
    const isNotesFollowUp = lowerText.includes('notes') || lowerText.includes('pyramide') || lowerText.includes('مكونات') || lowerText.includes('نوتات') || lowerText.includes('هرم');
    const isPriceFollowUp = lowerText.includes('taman') || lowerText.includes('prix') || lowerText.includes('bch7al') || lowerText.includes('combien') || lowerText.includes('price') || lowerText.includes('شحال') || lowerText.includes('بشحال') || lowerText.includes('ثمن');
    const isStockFollowUp = lowerText.includes('disponible') || lowerText.includes('stock') || lowerText.includes('kayn') || lowerText.includes('dispo') || lowerText.includes('متوفر') || lowerText.includes('كاين');

    // Season suitability follow-up
    if (isSeasonFollowUp) {
      const pSeason = (contextProduct.perfectSeason || '').toLowerCase();
      const pNotes = parseNotes(contextProduct.notes);
      const isWarmScent = pSeason.includes('hiver') || pSeason.includes('automne') || 
        [...pNotes.heart, ...pNotes.base].some(n => /ambre|vanille|cuir|bois|cannelle|oud|épice|tonka/i.test(n));

      if (isWinterQuery) {
        if (lang === 'darija') {
          const verdict = isWarmScent
            ? `نعم وبكل تأكيد! عطر **${contextProduct.name}** خيار ممتاز لأجواء الشتاء والبرد ❄️. تركيبته الغنية بالدفء تتناغم بشكل رائع مع الأجواء المنعشة.\n*(ملاحظة موضوعية : الثبات والفوحان تقديريان ويختلفان حسب طبيعة البشرة والطقس).*`
            : `عطر **${contextProduct.name}** يميل أساساً إلى الانتعاش والحيوية. يمكن استخدامه في الأماكن المغلقة ومحيط العمل شتاءً، علماً أن انتشاره يبلغ ذروته في الأجواء المعتدلة.\n*(ملاحظة موضوعية : الثبات والفوحان تقديريان ويختلفان حسب نوع البشرة).*`;
          return {
            reply: `${verdict}\n\n💎 **السعر فـ Atelier NAY :** **${contextProduct.price} درهم** مع ضمان المعاينة قبل السداد (Try Before You Pay).\n👉 **[معاينة ${contextProduct.name} فالموقع](/${userLocale}/product/${contextProduct.slug})**`,
            slugs: [contextProduct.slug]
          };
        }
        const verdictFr = isWarmScent
          ? `Absolument ! **${contextProduct.name}** est un choix particulièrement harmonieux pour la saison fraîche ❄️. Son profil olfactif riche en facettes chaleureuses s'épanouit idéalement par temps frais.\n*(Rappel de transparence : la tenue et le sillage demeurent subjectifs et varient selon votre type de peau, son hydratation et les conditions d'application).*`
          : `**${contextProduct.name}** est une composition à dominante fraîche et lumineuse. Vous pouvez la porter en intérieur ou au bureau en hiver, bien que son sillage s'exprime avec encore plus d'éclat lors des journées douces.\n*(Rappel de transparence : la tenue et le sillage demeurent des appréciations subjectives propres à chaque individu).*`;
        return {
          reply: `${verdictFr}\n\n💎 **Tarif NAY Parfums :** **${contextProduct.price} MAD** (Livraison sous 24h à 48h ouvrées après expédition avec droit formel de tester le flacon devant le coursier avant tout règlement).\n👉 **[Voir la fiche de ${contextProduct.name}](/${userLocale}/product/${contextProduct.slug})**`,
          slugs: [contextProduct.slug]
        };
      }

      if (isSummerQuery) {
        if (lang === 'darija') {
          const verdict = !isWarmScent
            ? `نعم، عطر **${contextProduct.name}** منعش ومثالي لفصل الصيف والأيام الدافئة ☀️.`
            : `عطر **${contextProduct.name}** تركيبة دافئة وغنية، لذا يُفضل استخدامه صيفاً بلمسات خفيفة في الأمسيات والمناسبات.`;
          return {
            reply: `${verdict}\n\n👉 **[صفحة ${contextProduct.name} فالمتجر](/${userLocale}/product/${contextProduct.slug})**`,
            slugs: [contextProduct.slug]
          };
        }
        const verdictFr = !isWarmScent
          ? `Tout à fait ! **${contextProduct.name}** est une fragrance vive et lumineuse, idéale pour les chaleurs estivales ☀️.`
          : `**${contextProduct.name}** étant une création dense et chaleureuse, nous vous suggérons une application mesurée, de préférence lors des soirées tempérées.`;
        return {
          reply: `${verdictFr}\n\n👉 **[Consulter ${contextProduct.name}](/${userLocale}/product/${contextProduct.slug})**`,
          slugs: [contextProduct.slug]
        };
      }
    }

    // Notes follow-up
    if (isNotesFollowUp) {
      const notes = parseNotes(contextProduct.notes);
      const topStr = notes.top.length > 0 ? notes.top.join(', ') : 'Agrumes & notes de tête vives';
      const heartStr = notes.heart.length > 0 ? notes.heart.join(', ') : 'Accords floraux & épices nobles';
      const baseStr = notes.base.length > 0 ? notes.base.join(', ') : 'Bois précieux, ambre & muscs';

      if (lang === 'darija') {
        return {
          reply: `🌿 **الهرم العطري المعتمد لـ ${contextProduct.name} :**\n\n• **الافتتاحية (Notes de tête) :** ${topStr}\n• **قلب العطر (Notes de cœur) :** ${heartStr}\n• **قاعدة العطر (Notes de fond) :** ${baseStr}\n\n💎 **العائلة :** ${contextProduct.subcategoryLabel || 'عطر راقٍ'} · السعر المعتمد : **${contextProduct.price} درهم**\n👉 **[معاينة المنتج بالمتجر](/${userLocale}/product/${contextProduct.slug})**`,
          slugs: [contextProduct.slug]
        };
      }

      return {
        reply: `🌿 **Pyramide olfactive officielle de ${contextProduct.name} :**\n\n• **Notes de tête :** ${topStr}\n• **Notes de cœur :** ${heartStr}\n• **Notes de fond :** ${baseStr}\n\n💎 **Famille :** ${contextProduct.subcategoryLabel || 'Haute Parfumerie'} · Tarif catalogue : **${contextProduct.price} MAD**\n👉 **[Voir la fiche produit de ${contextProduct.name}](/${userLocale}/product/${contextProduct.slug})**`,
        slugs: [contextProduct.slug]
      };
    }

    // Price follow-up
    if (isPriceFollowUp) {
      const sizes = parseSizes(contextProduct.sizes);
      const sizeStr = sizes.length > 0 ? sizes[0].label : '100ml';
      const price = contextProduct.price || 299;
      const refPriceNote = (contextProduct.originalPrice && contextProduct.originalPrice > price)
        ? ` *(au lieu de ${contextProduct.originalPrice} MAD)*`
        : '';
      const refPriceNoteAr = (contextProduct.originalPrice && contextProduct.originalPrice > price)
        ? ` *(مقارنة بالسعر المرجعي : ${contextProduct.originalPrice} درهم)*`
        : '';

      if (lang === 'darija') {
        return {
          reply: `💰 الثمن المعتمد لـ **${contextProduct.name}** هو **${price} درهم**${refPriceNoteAr} لقنينة ${sizeStr}.\n\n📦 التوصيل يتم عموماً خلال **24 إلى 48 ساعة بعد الشحن (Expédition)** مع **حق فتح الطرد وفحص القنينة وتجربتها أمام الموزع قبل الأداء (0 درهم مسبقاً)**.\n👉 **[طلب القنينة فالمتجر](/${userLocale}/product/${contextProduct.slug})**`,
          slugs: [contextProduct.slug]
        };
      }

      return {
        reply: `💰 Le tarif officiel de **${contextProduct.name}** est de **${price} MAD**${refPriceNote} pour le flacon de ${sizeStr}.\n\n📦 Expédition suivie avec livraison généralement sous **24h à 48h ouvrées après expédition** partout au Maroc. Vous bénéficiez du **droit formel d'ouvrir le colis et de tester le flacon devant le coursier avant tout règlement en espèces**.\n👉 **[Commander ${contextProduct.name} sur le site](/${userLocale}/product/${contextProduct.slug})**`,
        slugs: [contextProduct.slug]
      };
    }

    // Stock follow-up
    if (isStockFollowUp) {
      const isAvail = contextProduct.inStock && (contextProduct.stock === null || contextProduct.stock > 0);
      const sizes = parseSizes(contextProduct.sizes);
      const sizeStr = sizes.length > 0 ? sizes[0].label : '100ml';

      if (lang === 'darija') {
        const stockMsg = isAvail 
          ? `نعم، **${contextProduct.name}** متوفر حالياً فـ مخزون Atelier NAY (قنينة ${sizeStr}) بسعر **${contextProduct.price} درهم**.`
          : `عطر **${contextProduct.name}** في طور التجديد حالياً ضمن المخزون.`;
        return {
          reply: `${stockMsg}\n\n👉 **[صفحة المنتج فالمتجر](/${userLocale}/product/${contextProduct.slug})**`,
          slugs: [contextProduct.slug]
        };
      }

      const stockMsgFr = isAvail
        ? `Oui, **${contextProduct.name}** est actuellement disponible en stock dans notre catalogue (format ${sizeStr}) au tarif de **${contextProduct.price} MAD**.`
        : `Le parfum **${contextProduct.name}** est actuellement en cours de réapprovisionnement dans notre réserve.`;
      return {
        reply: `${stockMsgFr}\n\n👉 **[Consulter la fiche produit de ${contextProduct.name}](/${userLocale}/product/${contextProduct.slug})**`,
        slugs: [contextProduct.slug]
      };
    }
  }

  // =========================================================================
  // 2. HEAD-TO-HEAD FRAGRANCE COMPARISONS
  // =========================================================================
  const isComparisonQuery = /\b(vs|versus|contre|compare|comparer|différence entre|difference entre|الفرق بين|مقارنة بين|far9 bin|farq bin)\b/i.test(lowerText);
  if (isComparisonQuery) {
    const pair = findProductsForComparison(lowerText, products);
    if (pair) {
      const { p1, p2, requestedP1Variant, requestedP2Variant } = pair;
      const notes1 = parseNotes(p1.notes);
      const notes2 = parseNotes(p2.notes);

      let flankerNoticeFr = '';
      let flankerNoticeAr = '';
      if (requestedP1Variant && !p1.name.toLowerCase().includes(requestedP1Variant.toLowerCase()) && !p1.slug.toLowerCase().includes(requestedP1Variant.toLowerCase())) {
        flankerNoticeFr = `*(Précision catalogue : La version ${requestedP1Variant} demandée n'est pas commercialisée chez NAY Parfums ; la comparaison est établie avec la référence disponible **${p1.name}**)*\n\n`;
        flankerNoticeAr = `*(توضيح بخصوص التوفر : نسخة ${requestedP1Variant} المطلوبة غير متوفرة بكتالوج NAY ؛ تم إجراء المقارنة مع النسخة المتوفرة **${p1.name}**)*\n\n`;
      }

      if (lang === 'darija') {
        return {
          reply: `✨ **مقارنة تفصيلية بين ${p1.name} و ${p2.name} :**\n\n${flankerNoticeAr}1️⃣ **${p1.name} (${p1.brandLabel}) :**
• **العائلة والتركيبة :** ${p1.subcategoryLabel || 'عطر راقٍ'}
• **الافتتاحية :** ${notes1.top.join(', ') || 'نوتات افتتاحية منعشة'}
• **القلب والقاعدة :** ${notes1.heart.join(', ')} / ${notes1.base.join(', ')}
• **السياج والثبات :** طابع متوازن وملائم للاستخدام اليومي والعمل (الأداء الفعلي يبقى تقديرياً ويختلف حسب طبيعة البشرة).
• **السعر :** **${p1.price} درهم** — **[معاينة المنتج](/${userLocale}/product/${p1.slug})**

2️⃣ **${p2.name} (${p2.brandLabel}) :**
• **العائلة والتركيبة :** ${p2.subcategoryLabel || 'عطر راقٍ'}
• **الافتتاحية :** ${notes2.top.join(', ') || 'نوتات افتتاحية مركزة'}
• **القلب والقاعدة :** ${notes2.heart.join(', ')} / ${notes2.base.join(', ')}
• **السياج والثبات :** تركيبة ذات كثافة عطرية أعلى مناسبة للأمسيات والمواسم المعتدلة والباردة (الأداء تقديري).
• **السعر :** **${p2.price} درهم** — **[معاينة المنتج](/${userLocale}/product/${p2.slug})**

💡 **الخلاصة :** كلاهما قنينات تيستور أصلية 100% متوفرة في مخزون Atelier NAY مع **حق فتح الطرد وتجربة العطر أمام الموزع قبل الأداء**!`,
          slugs: [p1.slug, p2.slug]
        };
      }

      return {
        reply: `✨ **Comparatif Haute Parfumerie : ${p1.name} vs ${p2.name}**\n\n${flankerNoticeFr}1️⃣ **${p1.name} (${p1.brandLabel}) :**
• **Univers & Famille :** ${p1.subcategoryLabel || 'Haute Parfumerie'}
• **Pyramide vérifiée :** Tête (${notes1.top.join(', ') || 'Agrumes'}), Cœur (${notes1.heart.join(', ')}), Fond (${notes1.base.join(', ')})
• **Sillage & Tenue (estimations subjectives) :** Équilibre entre fraîcheur et présence, très apprécié au quotidien et en milieu professionnel.
• **Tarif & Fiche :** **${p1.price} MAD** — **[Découvrir ${p1.name}](/${userLocale}/product/${p1.slug})**

2️⃣ **${p2.name} (${p2.brandLabel}) :**
• **Univers & Famille :** ${p2.subcategoryLabel || 'Haute Parfumerie'}
• **Pyramide vérifiée :** Tête (${notes2.top.join(', ') || 'Épices & accords denses'}), Cœur (${notes2.heart.join(', ')}), Fond (${notes2.base.join(', ')})
• **Sillage & Tenue (estimations subjectives) :** Densité supérieure et sillage enveloppant, particulièrement recommandé pour les soirées et le climat frais.
• **Tarif & Fiche :** **${p2.price} MAD** — **[Découvrir ${p2.name}](/${userLocale}/product/${p2.slug})**

💡 **Verdict du Parfumeur :** Deux créations authentiques disponibles dans notre catalogue NAY Parfums, accompagnées de notre politique exclusive **"Testez avant de payer"** (inspection et essai du flacon devant le livreur avant tout règlement).`,
        slugs: [p1.slug, p2.slug]
      };
    }
  }

  // =========================================================================
  // 3. UNLISTED PERFUME HANDLER
  // =========================================================================
  const unlistedMatch = findUnlistedPerfume(combinedSearchCorpus);
  if (unlistedMatch) {
    const alternativeProducts = products.filter((p: any) => 
      p.inStock && unlistedMatch.alternativeSlugs.includes(p.slug)
    ).slice(0, 2);

    const altListFr = alternativeProducts.map((p: any) => 
      `• **[${p.name}](/${userLocale}/product/${p.slug})** (${p.brandLabel}) — **${p.price} MAD**`
    ).join('\n');

    const altListAr = alternativeProducts.map((p: any) => 
      `• **[${p.name}](/${userLocale}/product/${p.slug})** (${p.brandLabel}) — **${p.price} درهم**`
    ).join('\n');

    if (lang === 'darija') {
      return {
        reply: `✨ **عطر ${unlistedMatch.name} من دار ${unlistedMatch.brand} :**

هذا العطر ينتمي لفئة **${unlistedMatch.family}** ويمتاز بتركيبة متوازنة :
• **الافتتاحية :** ${unlistedMatch.notes.top}
• **القلب :** ${unlistedMatch.notes.heart}
• **القاعدة :** ${unlistedMatch.notes.base}

⚠️ **التوفر في متجر NAY Parfums :**
تأكيداً للشفافية والمصداقية، هذا الموديل بالذات **غير متوفر حالياً ضمن كتالوج NAY Parfums**. ولكن نقترح عليكم بدائل راقية من نفس العائلة العطرية متوفرة فوراً :

${altListAr}

📦 التوصيل يتم عموماً خلال **24 إلى 48 ساعة بعد الشحن والإرسال (Expédition)** مع **حق فتح الطرد وتجربته قبل الأداء**!`,
        slugs: alternativeProducts.map((p: any) => p.slug)
      };
    }

    return {
      reply: `✨ **Fiche Olfactive : ${unlistedMatch.name} (${unlistedMatch.brand})**

Cette création appartient à la famille **${unlistedMatch.family}** :
• **Notes de tête :** ${unlistedMatch.notes.top}
• **Notes de cœur :** ${unlistedMatch.notes.heart}
• **Notes de fond :** ${unlistedMatch.notes.base}

⚠️ **Disponibilité chez NAY Parfums :**
En toute transparence commerciale, cette référence n'est **pas commercialisée actuellement dans le catalogue NAY Parfums**. 

Toutefois, nous proposons des créations d'exception partageant un univers olfactif similaire, immédiatement disponibles en stock :

${altListFr}

📦 Expédition express avec livraison généralement sous **24h à 48h ouvrées après expédition** partout au Maroc et **droit absolu d'ouvrir le colis et de tester avant de régler** !`,
      slugs: alternativeProducts.map((p: any) => p.slug)
    };
  }

  // =========================================================================
  // 4. OUT-OF-STOCK PRODUCT HANDLING (Grounding & In-Stock Alternatives)
  // =========================================================================
  const matchedTarget = findBestProductMatch(userText, products);
  if (matchedTarget && (!matchedTarget.inStock || (matchedTarget.stock !== null && matchedTarget.stock <= 0))) {
    // Find 2 in-stock alternatives with similar brand or category
    const targetCategory = (matchedTarget.subcategoryLabel || '').toLowerCase();
    const targetBrand = (matchedTarget.brandLabel || '').toLowerCase();

    const alternatives = products.filter((p: any) => 
      p.inStock && p.slug !== matchedTarget.slug && (
        (p.brandLabel || '').toLowerCase() === targetBrand ||
        (targetCategory.length > 3 && (p.subcategoryLabel || '').toLowerCase().includes(targetCategory))
      )
    ).slice(0, 2);

    const altListFr = alternatives.map((p: any) => 
      `• **[${p.name}](/${userLocale}/product/${p.slug})** (${p.brandLabel}) — **${p.price} MAD**\n  *Profil :* ${p.subcategoryLabel || 'Parfum de caractère'}`
    ).join('\n');

    const altListAr = alternatives.map((p: any) => 
      `• **[${p.name}](/${userLocale}/product/${p.slug})** (${p.brandLabel}) — **${p.price} درهم**\n  *العائلة :* ${p.subcategoryLabel || 'عطر مميز'}`
    ).join('\n');

    if (lang === 'darija') {
      return {
        reply: `⚠️ عطر **${matchedTarget.name}** من دار **${matchedTarget.brandLabel}** هو حالياً **في طور التجديد ضمن المخزون** بمتجر NAY.

لخدمتك وتوفير خيارات مناسبة، ها هي أفضل البدائل المتوفرة حالياً في المخزون من نفس الدار والعائلة العطرية :

${altListAr}

📦 التوصيل يتم عموماً خلال **24 إلى 48 ساعة بعد الشحن (Expédition)** مع **حق فتح الطرد والتجربة أمام الموزع قبل الأداء (0 درهم مسبقاً)**!`,
        slugs: alternatives.map((p: any) => p.slug)
      };
    }

    return {
      reply: `⚠️ Le parfum **${matchedTarget.name}** (${matchedTarget.brandLabel}) est actuellement **en cours de réapprovisionnement** dans notre réserve.

En toute transparence commerciale, voici nos meilleures alternatives immédiatement disponibles en stock partageant le même univers olfactif :

${altListFr}

📦 Expédition express avec livraison généralement sous **24h à 48h ouvrées après expédition** partout au Maroc avec notre engagement exclusif **"Testez avant de payer"** !`,
      slugs: alternatives.map((p: any) => p.slug)
    };
  }

  // =========================================================================
  // 5. IMAGE RECOGNITION CONFIDENCE MATRIX & TRANSPARENCY
  // =========================================================================
  if (hasImageAttachment) {
    const scoredProducts = products.map((p: any) => ({
      product: p,
      score: scoreProduct(p, combinedSearchCorpus, ocrText)
    })).sort((a, b) => b.score - a.score);

    const topMatch = scoredProducts[0];
    const topScore = topMatch?.score || 0;

    const isInsufficientEvidence = (topScore < 30);
    const isAmbiguousMatch = !isInsufficientEvidence && (topScore >= 30 && topScore < 60);
    const isHighConfidenceMatch = !isInsufficientEvidence && (topScore >= 60);

    const quotaNoticeFr = geminiQuotaExhausted
      ? `\n\nℹ️ *Note technique : Le quota du service d'analyse visuelle multimodale par IA étant temporairement atteint, cette identification repose sur l'analyse documentaire OCR (lecture du texte visible sur l'étiquette) et la comparaison catalogue. Ce mode alternatif identifie le texte imprimé et la marque, mais ne peut pas analyser la teinte exacte du verre ou les nuances 3D du flacon pour distinguer avec certitude des flankers visuellement très proches. En cas de doute, veuillez nous préciser la concentration souhaitée.*`
      : '';
    const quotaNoticeAr = geminiQuotaExhausted
      ? `\n\nℹ️ *ملاحظة تقنية : نظراً لبلوغ الحد المؤقت لنموذج الرؤية البصرية المجاني، اعتمدت هذه الإجابة على القراءة النصية (OCR) للحروف المطبوعة على القنينة ومطابقتها مع الكتالوج. يحدد هذا النمط الكلمات المكتوبة واسم الدار، لكنه لا يحلل التدرجات اللونية وتفاصيل التصميم ثلاثي الأبعاد للتفريق القاطع بين الإصدارات المتشابهة جداً. يُرجى تأكيد التركيز المطلوب (EDT أو EDP أو Elixir).* `
      : '';

    // A. INSUFFICIENT EVIDENCE / BLURRY IMAGE
    if (isInsufficientEvidence) {
      if (lang === 'darija') {
        return {
          reply: `📸 **الصورة غير واضحة كفاية لتحديد العطر بدقة تامة.**\n\nهل يمكنك إرسال صورة أقرب للاسم والتركيز المدون على القنينة؟ أو تفضل بكتابة اسم العطر هنا وسأتحقق من توفره فوراً على الراس والعين! 💬${quotaNoticeAr}`,
          slugs: []
        };
      }
      return {
        reply: `📸 **La photo n'est pas suffisamment nette ou lisible pour identifier le flacon avec certitude.**\n\nPourriez-vous nous envoyer une photo plus rapprochée de l'étiquette ou m'indiquer directement le nom du parfum recherché ? Je vérifierai immédiatement sa disponibilité et ses notes pour vous. 💬${quotaNoticeFr}`,
        slugs: []
      };
    }

    // B. AMBIGUOUS MATCH (Flankers)
    if (isAmbiguousMatch) {
      const candidates = scoredProducts.slice(0, 3).map(s => s.product);
      const candSlugs = candidates.map(p => p.slug);

      if (lang === 'darija') {
        const listText = candidates.map(p => `• **[${p.name}](/${userLocale}/product/${p.slug})** — ${p.price} درهم (${p.brandLabel})`).join('\n');
        return {
          reply: `🔍 **بناءً على المعالم البصرية الظاهرة، هناك هذه الخيارات المحتملة في كتالوج NAY :**\n\n${listText}\n\nهل القنينة لديكم مطابقة لأحد هذه الإصدارات المحددة (EDT أو EDP أو Elixir)؟${quotaNoticeAr}`,
          slugs: candSlugs
        };
      }

      const listTextFr = candidates.map(p => `• **[${p.name}](/${userLocale}/product/${p.slug})** — ${p.price} MAD (${p.brandLabel})`).join('\n');
      return {
        reply: `🔍 **D'après les caractéristiques visibles du flacon, voici les déclinaisons correspondantes disponibles dans notre catalogue :**\n\n${listTextFr}\n\nS'agit-il de l'une de ces versions spécifiques ? Pourriez-vous nous confirmer la concentration exacte (EDT, EDP ou Elixir) pour confirmation définitive ?${quotaNoticeFr}`,
        slugs: candSlugs
      };
    }

    // C. HIGH CONFIDENCE MATCH
    if (isHighConfidenceMatch && topMatch) {
      const targetProduct = topMatch.product;
      const notesObj = parseNotes(targetProduct.notes);
      const topNotes = notesObj.top.length > 0 ? notesObj.top.join(', ') : 'Agrumes & notes vives';
      const heartNotes = notesObj.heart.length > 0 ? notesObj.heart.join(', ') : 'Cœur floral raffiné & accords épicés';
      const baseNotes = notesObj.base.length > 0 ? notesObj.base.join(', ') : 'Bois précieux, ambre & muscs';
      const sizes = parseSizes(targetProduct.sizes);
      const sizeLabel = sizes.length > 0 ? sizes[0].label : '100ml';
      const price = targetProduct.price || 299;
      const prodUrl = `/${userLocale}/product/${targetProduct.slug}`;

      if (lang === 'darija') {
        return {
          reply: `📸 **تم التعرف على القنينة بنجاح :**

العطر هو **${targetProduct.name}** من دار **${targetProduct.brandLabel}**.

🌿 **الهرم العطري المعتمد في الكتالوج :**
• **الافتتاحية (Top Notes) :** ${topNotes}
• **قلب العطر (Heart Notes) :** ${heartNotes}
• **القاعدة (Base Notes) :** ${baseNotes}

💎 **العائلة والطابع :** مصنف ضمن **${targetProduct.subcategoryLabel || 'العطور الفاخرة'}**. (تظل مدة الثبات والفوحان تقديرية وتتأثر بطبيعة البشرة والطقس).
⚠️ *ملاحظة توثيقية : التعرف البصري يحدد تصميم القنينة والموديل، ولا يُعد وحده فحصاً مادياً لأصالة القطعة.*

👑 **التوفر بمتجر Atelier NAY Parfums :**
• **الحجم والسعر :** قنينة ${sizeLabel} — متوفرة بـ **${price} درهم**.
• **ضمان المعاينة قبل السداد (Try Before You Pay) :** التوصيل عموماً خلال **24 إلى 48 ساعة بعد الشحن (Expédition)**، وعندك **الحق الكامل تحل الطرد وتجرب القنينة قدام الليفرور قبل ما تخلص أي درهم**!

👉 **[اضغط هنا لمعاينة وتأكيد الطلب فالموقع (${price} درهم)](${prodUrl})**

💬 *لأي استفسار إضافي حول توفر الغطاء أو تفاصيل القنينة : واتساب [+212 663-380011](https://wa.me/212663380011).*${quotaNoticeAr}`,
          slugs: [targetProduct.slug]
        };
      }

      return {
        reply: `📸 **Flacon Identifié & Monographie Olfactive Vérifiée :**

Il s'agit de **${targetProduct.name}** par la Maison **${targetProduct.brandLabel}**.

🌿 **Pyramide Olfactive Officielle du Catalogue :**
• **Notes de tête :** ${topNotes}
• **Notes de cœur :** ${heartNotes}
• **Notes de fond :** ${baseNotes}

💎 **Univers & Sillage :** Famille **${targetProduct.subcategoryLabel || 'Haute Parfumerie'}**. (La tenue et la projection demeurent des caractéristiques subjectives dépendant du type de peau et des conditions d'application).
⚠️ *Note de transparence : La reconnaissance visuelle identifie le flacon et le modèle, mais ne saurait constituer à elle seule une preuve d'authenticité physique.*

👑 **Disponibilité Immédiate à l'Atelier NAY :**
• **Format & Tarif :** Flacon de ${sizeLabel} proposé à **${price} MAD**.
• **Engagement "Testez avant de payer" :** Livraison généralement sous **24h à 48h ouvrées après expédition** partout au Maroc, avec **le droit formel d'ouvrir le colis et de tester le flacon devant le coursier avant de régler en espèces** !

👉 **[Découvrir & Commander ${targetProduct.name} (${price} MAD)](${prodUrl})**

💬 *Pour toute question sur un lot spécifique (présence de capuchon, conditionnement) : WhatsApp [+212 663-380011](https://wa.me/212663380011).*${quotaNoticeFr}`,
        slugs: [targetProduct.slug]
      };
    }
  }

  // =========================================================================
  // 6. STORE SUPPORT POLICIES ENGINE (Code-Enforced, Exact & Free-First)
  // =========================================================================
  const isOrderTracking = lowerText.includes('suivi') || lowerText.includes('suivre') || lowerText.includes('commande') || lowerText.includes('فين وصل') || lowerText.includes('تتبع') || lowerText.includes('طلبية') || lowerText.includes('nay-') || lowerText.includes('track');
  const isShippingOrDeliveryPolicy = lowerText.includes('livraison') || lowerText.includes('frais de port') || lowerText.includes('délai') || lowerText.includes('delai') || lowerText.includes('توصيل') || lowerText.includes('شحن') || lowerText.includes('ميعاد') || lowerText.includes('فوقاش كتوصل') || lowerText.includes('fo9ach') || lowerText.includes('gratuit') || lowerText.includes('فابور') || (lowerText.includes('35') && lowerText.includes('dh'));
  const isTryBeforeYouPay = lowerText.includes('testez avant') || lowerText.includes('essayer avant') || lowerText.includes('ouvrir') || lowerText.includes('inspecter') || lowerText.includes('n7el') || lowerText.includes('nhel') || lowerText.includes('n9leb') || lowerText.includes('nchouf') || lowerText.includes('نحل') || lowerText.includes('نقلب') || lowerText.includes('معاينة') || lowerText.includes('فحص') || lowerText.includes('قدام الليفرور') || lowerText.includes('devant le livreur') || lowerText.includes('avant de payer');
  const isReturnOrWarranty = lowerText.includes('retour') || lowerText.includes('remboursement') || lowerText.includes('remplacement') || lowerText.includes('cassé') || lowerText.includes('casse') || lowerText.includes('endommagé') || lowerText.includes('endommage') || lowerText.includes('défaut') || lowerText.includes('ضمان') || lowerText.includes('استرجاع') || lowerText.includes('مهرس') || lowerText.includes('تالف');
  const isTesterExplanation = lowerText.includes('testeur') || lowerText.includes('tester') || lowerText.includes('تيستور') || lowerText.includes('تيستر') || (lowerText.includes('original') && (lowerText.includes('vrai') || lowerText.includes('fake') || lowerText.includes('copie') || lowerText.includes('أصلي')));

  // Order Tracking
  if (isOrderTracking) {
    if (lang === 'darija') {
      return {
        reply: `على الراس والعين! لتتبع طلبيتك بكل أمان ومباشرة 📦🚚 :

1️⃣ **صفحة التتبع المباشر :** تفضل بزيارة **[صفحة تتبع الطلبية الرسمية](/ar/suivi-commande)**، وأدخل رقم الطلب الخاص بك (مثال: NAY-2026-XXXX) ورقم الهاتف المسجل للتأكد الفوري من المسار.
2️⃣ **حماية الخصوصية :** حفاظاً على سرية بياناتك، يتطلب النظام إدخال رقم الهاتف المرتبط بالطلب للتحقق.
3️⃣ **مواعيد التوصيل :** التوصيل يتم عموماً خلال **24 إلى 48 ساعة بعد الشحن والإرسال (Expédition)**، والموزع يتصل بك مسبقاً قبل القدوم.
4️⃣ **دعم مباشر عبر واتساب :** يمكنك أيضاً مراسلتنا فوراً على [+212 663-380011](https://wa.me/212663380011) لمساعدتك في لحظات!`,
        slugs: []
      };
    }

    return {
      reply: `Je vous accompagne avec grand plaisir pour le suivi de votre colis 📦🚚 :

1️⃣ **Suivi en direct sur notre plateforme :** Rendez-vous sur notre page dédiée **[Suivre ma Commande en Direct](/fr/suivi-commande)**. Renseignez votre référence de commande (ex: NAY-2026-XXXX) ainsi que votre numéro de téléphone marocain pour afficher l'état d'acheminement en temps réel.
2️⃣ **Confidentialité & Sécurité :** Afin de protéger vos données personnelles, le statut d'une commande ne peut être divulgué sans vérification de votre identité et numéro de contact.
3️⃣ **Délais d'acheminement :** Les colis sont livrés sous **24h à 48h ouvrées après expédition** (et non après la simple passation de commande). Le coursier vous appelle systématiquement avant son passage.
4️⃣ **Support direct WhatsApp :** Notre équipe est disponible au [+212 663-380011](https://wa.me/212663380011) pour toute assistance personnalisée.`,
      slugs: []
    };
  }

  // Shipping Fees
  if (isShippingOrDeliveryPolicy) {
    if (lang === 'darija') {
      return {
        reply: `📦 **شروط ومصاريف التوصيل المعتمدة بمتجر NAY Parfums :**

• **مصاريف التوصيل القياسية :** **35 درهم** فقط لجميع المدن المغربية.
• **التوصيل المجاني :** تستفيد من **توصيل مجاني 100% ابتداءً من 800 درهم** في إجمالي السلة!
• **مواعيد التوصيل :** التوصيل يتم عموماً خلال **24 إلى 48 ساعة بعد شحن وإرسال الطلبية (Expédition)** وليس بعد وضع الطلب مباشرة. في حال تطلب الأمر تجهيزاً خاصاً قد يصل الأجل لنحو 72 ساعة.
• **خدمة "جرب قبل ما تخلص" (Try Before You Pay) :** كالتزام تجاري خاص بدار NAY، لديك الفرصة الكاملة لفتح كرتونة الشحن وتجربة القنينة أمام الموزع قبل سداد المبلغ نقداً (0 درهم في حال الرفض)! 🛡️`,
        slugs: []
      };
    }

    return {
      reply: `📦 **Tarifs & Modalités de Livraison Officiels NAY Parfums :**

• **Frais de livraison standard :** **35 MAD** pour toute expédition partout au Maroc.
• **Livraison Gratuite :** La livraison est **100% offerte dès 800 MAD d'achats** sur l'ensemble de votre panier !
• **Délais d'expédition :** Livraison généralement sous 24 à 48 heures ouvrées **après expédition** (et non après la simple passation de commande). En cas de réapprovisionnement ponctuel, le délai total peut atteindre environ 72 heures.
• **Service exclusif "Testez avant de payer" :** Dans le cadre de la politique commerciale privilégiée propre à la Maison NAY (et non d'un droit statutaire universel), vous bénéficiez de l'opportunité d'ouvrir le colis et d'examiner/tester votre flacon devant le coursier avant tout règlement en espèces (0 MAD en cas de refus) ! 🛡️`,
      slugs: []
    };
  }

  // Try Before You Pay
  if (isTryBeforeYouPay) {
    if (lang === 'darija') {
      return {
        reply: `على الراس والعين! نعم، تقدر تحل الكولية وتجرب العطر أمام الموزع قبل ما تخلص أي درهم.

🛡️ **السياسة التجارية الحصرية لـ دار NAY — "جرب قبل ما تخلص" (Try Before You Pay) :**

• **التزام تجاري خاص بـ NAY :** كالتزام تجاري اختياري ومميز تقدمه دار NAY لزبنائها لضمان الشفافية التامة : عند وصول الموزع، لديك الحق الكامل في فتح كرتونة الشحن وتجربة القنينة أمامه قبل سداد المبلغ.
• **في حال عدم الرغبة :** إذا لم يطابق العطر تطلعاتك أو بدلت رأيك، ترفض استلام الطرد بكل بساطة ولا تدفع شيئاً — **0 درهم**، وبدون أي مصاريف شحن أو توصيل!
• **ملاحظة إجرائية :** هذه المعاينة تتم حصرياً في يد الموزع قبل إتمام التسليم والأداء.`,
        slugs: []
      };
    }

    return {
      reply: `🛡️ **Politique Commerciale Privilégiée NAY Parfums — "Testez avant de payer" (Try Before You Pay) :**

• **Engagement commercial propre à la Maison NAY :** Afin de garantir votre sérénité totale, l'Atelier NAY a instauré cette politique commerciale exclusive (et non un droit statutaire universel) : à l'arrivée du livreur, vous bénéficiez de l'opportunité d'ouvrir le colis d'expédition, d'examiner le flacon et de tester la fragrance en main propre AVANT de régler en espèces.
• **Zéro risque en cas de non-conformité :** Si le flacon ou la senteur ne correspond pas à vos attentes, vous pouvez refuser la livraison sur-le-champ : **vous ne payez absolument rien (0 MAD)**, ni le produit ni les frais de livraison.
• **Modalités pratiques :** Cette inspection s'exerce exclusivement au moment de la remise en main propre en présence du coursier avant tout règlement.`,
      slugs: []
    };
  }

  // Return & Warranty
  if (isReturnOrWarranty) {
    if (lang === 'darija') {
      return {
        reply: `🛡️ **سياسة الإرجاع والضمان بمتجر NAY Parfums (/legal/returns) :**

• **عند التسليم (Try Before You Pay) :** لديك الحق الكامل في فتح الطرد وتجربة القنينة أمام الموزع قبل الأداء، وفي حال الرفض لا تدفع شيئاً (0 درهم).
• **بعد الاستلام (مهلة 7 أيام) :** تماشياً مع شروط الموقع (/legal/returns)، لديك مهلة 7 أيام للتواصل مع خدمة الزبناء عبر واتساب [+212 663-380011](https://wa.me/212663380011). تُقبل الطلبات للقنينات المغلقة والمحكمة في غلافها الأصلي، أو في حال وجود تلف مثبت ناتج عن الشحن تم الإبلاغ عنه فور الاستلام.`,
        slugs: []
      };
    }

    return {
      reply: `🛡️ **Politique Officielle de Retours et Réclamations NAY Parfums :**

• **À la livraison ("Testez avant de payer") :** Vous examinez et testez votre flacon devant le coursier. En cas de refus avant règlement, vous ne payez strictement rien (0 MAD).
• **Après réception (Délai de 7 jours) :** Conformément à nos conditions (/legal/returns), vous disposez de 7 jours pour contacter notre service client via WhatsApp au [+212 663-380011](https://wa.me/212663380011). Les retours s'appliquent aux flacons intacts scellés dans leur emballage d'origine, ou en cas d'avarie liée au transport constatée à la réception.`,
      slugs: []
    };
  }

  // Tester Explanation (Factual, no fabricated discounts, objective cap/box explanation)
  if (isTesterExplanation) {
    if (lang === 'darija') {
      return {
        reply: `✨ **حقيقة قنينات التيستور (Testers) بمتجر NAY Parfums :**

1️⃣ **أصلية 100% :** قنينات التيستور لدينا هي عطور أصلية تصنعها نفس الدور العالمية (Dior, Tom Ford, Chanel...) مخصصة للتجربة والعرض في محلات العطور الرسمية.
2️⃣ **نفس التركيبة والزيوت :** تحتوي على نفس الزيت العطري ونفس تركيز العطور المعتمد من الدار المصنعة تماماً.
3️⃣ **نوع العلبة والغطاء :** تأتي في علبة كرتونية مخصصة للتوزيع التجاري (بيضاء أو كرافت). أما بخصوص وجود الغطاء فهو يختلف حسب كل ماركة ودفعة تصنيع (يمكن الاستفسار مسبقاً عبر الواتساب).
4️⃣ **أسعار تفضيلية :** تستفيد من سعر مناسب ومباشر (أسعار التيستور تتراوح عموماً بين 299 و 499 درهم)، مع إبراز السعر المرجعي الرسمي للمقارنة عند توفره بالكتالوج.
5️⃣ **ضمان الثقة :** تستفيد من خدمة **"جرب قبل ما تخلص"** : تفتح الطرد وتجرب القنينة أمام الموزع قبل سداد أي مبلغ!`,
        slugs: []
      };
    }

    return {
      reply: `✨ **Comprendre les Testeurs chez NAY Parfums (299-499 MAD) :**

1️⃣ **Authenticité Garantie :** Nos testeurs sont des flacons officiels authentiques issus de circuits contrôlés et manufacturés par les maisons de haute parfumerie (Dior, Tom Ford, Armani, Creed...) initialement destinés aux démonstrations en comptoir.
2️⃣ **Formule Identique :** Le jus, la concentration en essences et la signature olfactive sont rigoureusement identiques aux éditions sous coffret commercial.
3️⃣ **Conditionnement Usine :** Ils sont présentés sous étui cartonnée neutre d'usine (boîte testeur blanche ou kraft). La présence ou non d'un capuchon décoratif dépend de chaque marque et lot de fabrication (vous pouvez demander confirmation pour un produit précis sur WhatsApp au +212 663-380011).
4️⃣ **Tarif Atelier Préférentiel :** Proposés à des tarifs atelier avantageux (généralement 299 à 499 MAD). Lorsqu'un tarif de référence catalogue est disponible, l'économie réelle y est directement affichée sans surévaluation.
5️⃣ **Sérénité Absolue :** Grâce à notre politique **"Testez avant de payer"**, vous avez le droit d'ouvrir le colis et de tester le flacon devant le coursier avant tout règlement !`,
      slugs: []
    };
  }

  // =========================================================================
  // 7. GENERIC GREETINGS
  // =========================================================================
  const isGenericGreeting = ['salam', 'salut', 'bonjour', 'hello', 'coucou', 'bonsoir', 'sbah lkhir', 'slm'].some(w => lowerText.trim() === w) ||
    (lowerText.trim().length <= 6);

  if (isGenericGreeting && !hasImageAttachment) {
    if (lang === 'darija') {
      return {
        reply: `أهلاً ومرحباً بك في **Atelier NAY Parfums** 👋 على الراس والعين!

أنا مستشارك العطري المعتمد، وموجود لمساعدتك في اختيار العطر الأنسب لذوقك ومناسباتك. لتحديد أفضل اقتراح، تفضل بإخباري :

1️⃣ **هل العطر لك شخصياً (رجالي / نسائي) أم هدية مميزة ؟**
2️⃣ **ما هو الطابع العطري المفضل لديك ؟** (منعش، خشبي، عنبري، شرقي، أم فانيلا دافئة ؟)
3️⃣ **هل لديك ميزانية محددة ترغب في الالتزام بها ؟**

💡 *تذكير : يمكنك أيضاً إرسال صورة أي قنينة تبحث عنها عبر **زر الكاميرا 📷** بالأسفل وسنتحقق منها فوراً!*`,
        slugs: []
      };
    }

    return {
      reply: `Bonjour et bienvenue à l'**Atelier NAY Parfums** ! 👋 C'est un réel plaisir de vous accueillir.

En tant que conseiller parfumeur dédié, je suis à votre écoute pour trouver la création idéale. Afin d'orienter au mieux mes suggestions :

1️⃣ **À qui se destine ce parfum ?** (Pour vous-même — Homme ou Femme, ou un cadeau de prestige ?)
2️⃣ **Quel univers olfactif vous inspire ?** (Frais & hespéridé, Boisé & Ambré, Oriental, Gourmand ou Floral ?)
3️⃣ **Avez-vous une préférence de budget ou d'occasion ?**

💡 *Astuce : Vous pouvez également m'envoyer la photo du flacon recherché via le **bouton caméra 📷** ci-dessous pour vérification instantanée de disponibilité !*`,
      slugs: []
    };
  }

  // =========================================================================
  // 8. QUALIFIED IN-STOCK PRODUCT RECOMMENDATIONS (No fabricated best-seller claims)
  // =========================================================================
  let eligibleProducts = products.filter((p: any) => p.inStock && (p.stock === null || p.stock > 0));

  // Budget filter
  if (activeBudget) {
    eligibleProducts = eligibleProducts.filter((p: any) => p.price && p.price <= (activeBudget + 10));
  }

  // Season filter
  if (activeSeason === 'Hiver') {
    const winterEligible = eligibleProducts.filter((p: any) => {
      const pSeason = (p.perfectSeason || '').toLowerCase();
      const pCategory = (p.subcategoryLabel || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      return pSeason.includes('hiver') || pSeason.includes('automne') ||
        pCategory.includes('boisé') || pCategory.includes('ambré') || pCategory.includes('oriental') || pCategory.includes('cuir') || pCategory.includes('épicé') ||
        pName.includes('intense') || pName.includes('noir') || pName.includes('oud') || pName.includes('vanille');
    });
    if (winterEligible.length >= 2) {
      eligibleProducts = winterEligible;
    }
  } else if (activeSeason === 'Été') {
    const summerEligible = eligibleProducts.filter((p: any) => {
      const pSeason = (p.perfectSeason || '').toLowerCase();
      const pCategory = (p.subcategoryLabel || '').toLowerCase();
      return pSeason.includes('été') || pSeason.includes('printemps') || pCategory.includes('hespéridé') || pCategory.includes('aquatique') || pCategory.includes('frais');
    });
    if (summerEligible.length >= 2) {
      eligibleProducts = summerEligible;
    }
  }

  // Gender filter
  if (activeGender) {
    const genderEligible = eligibleProducts.filter((p: any) => {
      const g = (p.gender || '').toLowerCase();
      return g === activeGender || g === 'unisex' || g === 'mixte';
    });
    if (genderEligible.length >= 2) {
      eligibleProducts = genderEligible;
    }
  }

  const selectedProducts = eligibleProducts.slice(0, 3);
  if (selectedProducts.length === 0) {
    selectedProducts.push(...products.filter((p: any) => p.inStock).slice(0, 3));
  }

  const candidateSlugs = selectedProducts.map((p: any) => p.slug);

  if (lang === 'darija') {
    let intro = "أهلاً ومرحباً بك! إليك ترشيحات مختارة بعناية من كتالوج دار NAY المتوفرة حالياً بالمخزون والمناسبة لطلبك :\n\n";

    if (activeSeason === 'Hiver') {
      intro = "❄️ **عطور شتوية دافئة ومميزة متوفرة حالياً :**\nإليك تشكيلة ذات طابع عنبري وخشبي وتوابل دافئة ملائمة للأجواء الباردة وفي حدود ميزانيتك :\n\n";
    } else if (activeBudget) {
      intro = `💰 **ترشيحات عطرية متوفرة في حدود ميزانية ${activeBudget} درهم :**\nإليك قنينات تيستور أصلية ذات طابع راقٍ تناسب ميزانيتك تماماً :\n\n`;
    }

    const itemsText = selectedProducts.map((p: any) => {
      const cleanSlug = encodeURIComponent(p.slug.trim());
      return `• **[${p.name}](/${userLocale}/product/${cleanSlug})**\n  *الماركة :* ${p.brandLabel} — **${p.price} درهم**\n  *الطابع :* ${p.subcategoryLabel || p.tagline || 'عطر راقٍ بطابع مميز'}\n`;
    }).join('\n');

    const clarifyingQuestion = `\n🤔 **سؤال محدد لمساعدتك بدقة :** هل تفضل لمسات الفانيلا والعنبر الحلوة، أم روائح الخشب والعود الجافة ؟\n`;
    const outro = `📦 **التوصيل :** عموماً خلال **24 إلى 48 ساعة بعد الشحن والإرسال (Expédition)** مع **حق فتح الطرد وتجربته أمام الموزع قبل الأداء**!\n💬 *لأي استفسار إضافي أو صور واقعية للقنينات : واتساب [+212 663-380011](https://wa.me/212663380011).*`;

    return {
      reply: `${intro}${itemsText}${clarifyingQuestion}${outro}`,
      slugs: candidateSlugs
    };
  }

  // Default French qualified recommendations
  let intro = "Voici nos suggestions issues de notre catalogue disponible :\n\n";

  if (activeSeason === 'Hiver') {
    intro = "❄️ **Sélections pour saison fraîche (Notes Boisées, Épicées & Ambrées) :**\nVoici des fragrances au profil chaleureux, adaptées à votre budget et disponibles en stock :\n\n";
  } else if (activeBudget) {
    intro = `💰 **Sélections disponibles respectant votre budget de ${activeBudget} MAD :**\nVoici des créations authentiques correspondant scrupuleusement à votre critère tarifaire :\n\n`;
  }

  const itemsText = selectedProducts.map((p: any) => {
    const cleanSlug = encodeURIComponent(p.slug.trim());
    return `• **[${p.name}](/${userLocale}/product/${cleanSlug})**\n  *${p.brandLabel}* — **${p.price} MAD**\n  *Famille :* ${p.subcategoryLabel || p.tagline || 'Haute Parfumerie'}\n`;
  }).join('\n');

  const clarifyingQuestion = `\n🤔 **Une précision pour affiner votre sillage :** Préférez-vous une dominante vanillée et gourmande, ou plutôt des accords de bois précieux et d'épices nobles ?\n\n`;
  const outro = `📦 **Expédition suivie avec livraison généralement sous 24h à 48h ouvrées après expédition** (Livraison offerte dès 800 MAD). **Testez votre flacon en main propre devant le coursier avant de régler** !\n💬 *Pour des photos des flacons disponibles ou des précisions sur un lot : WhatsApp au [+212 663-380011](https://wa.me/212663380011).*`;

  return {
    reply: `${intro}${itemsText}${clarifyingQuestion}${outro}`,
    slugs: candidateSlugs
  };
}

export async function POST(req: Request) {
  try {
    const rawKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const body = await req.json();
    const { messages, conversationId, sessionId, locale, imageAttachment, imageName, imageContentType } = body;

    // Find latest user message
    const userMessages = (messages || []).filter((m: any) => m.role === 'user');
    const latestUserMessage = userMessages[userMessages.length - 1];
    const latestText = latestUserMessage?.content || '';
    const userLocale = locale || 'fr';

    // If client sent imageAttachment directly in body, attach it to latestUserMessage and messages array
    if (imageAttachment && latestUserMessage) {
      if (!Array.isArray(latestUserMessage.experimental_attachments) || latestUserMessage.experimental_attachments.length === 0) {
        latestUserMessage.experimental_attachments = [
          {
            name: imageName || 'flacon.jpg',
            contentType: imageContentType || 'image/jpeg',
            url: imageAttachment
          }
        ];
      }
    }

    if (imageAttachment && Array.isArray(messages)) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]?.role === 'user') {
          if (!Array.isArray(messages[i].experimental_attachments) || messages[i].experimental_attachments.length === 0) {
            messages[i].experimental_attachments = [
              {
                name: imageName || 'flacon.jpg',
                contentType: imageContentType || 'image/jpeg',
                url: imageAttachment
              }
            ];
          }
          break;
        }
      }
    }
    
    // Check if the user message contains image attachments
    const userAttachments = latestUserMessage?.experimental_attachments || [];
    const hasImageAttachment = userAttachments.some((att: any) =>
      Boolean(att?.contentType?.startsWith('image/') || (att?.url && String(att.url).startsWith('data:image/')))
    );
    const attachmentName = userAttachments[0]?.name || imageName || '';

    // Fast OCR Extraction on uploaded perfume bottle photo
    let ocrText = '';
    if (hasImageAttachment) {
      try {
        const firstImg = userAttachments.find((att: any) => 
          att?.url && String(att.url).startsWith('data:image/')
        );
        if (firstImg?.url) {
          const base64Data = String(firstImg.url).replace(/^data:image\/\w+;base64,/, '');
          const imageBuf = Buffer.from(base64Data, 'base64');
          
          const ocrPromise = (async () => {
            const workerPath = path.join(process.cwd(), 'node_modules/tesseract.js/src/worker-script/node/index.js');
            const { createWorker } = await import('tesseract.js');
            const worker = await createWorker('eng', 1, { workerPath });
            const ret = await worker.recognize(imageBuf);
            const recognized = ret?.data?.text?.trim() || '';
            await worker.terminate();
            return recognized;
          })();

          const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('OCR Timeout after 6s')), 6000)
          );

          ocrText = await Promise.race([ocrPromise, timeoutPromise]);
          console.log('>>> OCR EXTRACTED FROM BOTTLE:', ocrText.replace(/\s+/g, ' '));
        }
      } catch (ocrErr) {
        console.warn('OCR extraction error or timeout:', ocrErr);
      }
    }

    // Detect user intent, language, and olfactory preferences
    const detectedIntent = detectCustomerIntent(latestText);
    const detectedNotes = extractOlfactoryNotes(latestText);
    const lowerLatest = latestText.toLowerCase();
    const detectedGender = (lowerLatest.includes('homme') || lowerLatest.includes('رجالي') || lowerLatest.includes('pour lui') || lowerLatest.includes('men')) 
      ? 'HOMME' 
      : ((lowerLatest.includes('femme') || lowerLatest.includes('نسائي') || lowerLatest.includes('pour elle') || lowerLatest.includes('women')) ? 'FEMME' : undefined);

    // Retrieve or create the AdvisorConversation entity
    let conv = conversationId 
      ? await prisma.advisorConversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!conv) {
      conv = await prisma.advisorConversation.create({
        data: {
          sessionId: sessionId || 'anon_' + Date.now().toString(36),
          summary: latestText ? latestText.slice(0, 110) : 'Conseil parfum NAY',
          intent: detectedIntent,
          preferredNotes: detectedNotes.length > 0 ? JSON.stringify(detectedNotes) : null,
          preferredGender: detectedGender || 'UNISEXE',
          messagesCount: 1,
        }
      });
    }

    // Persist the user message
    if (latestUserMessage && conv) {
      await prisma.advisorMessage.create({
        data: {
          conversationId: conv.id,
          role: 'user',
          content: hasImageAttachment 
            ? `[Photo Flacon Jointe] ${latestText}`.trim() 
            : latestText
        }
      });
    }

    // Fetch product catalog for context (strictly read-only from Neon PostgreSQL)
    const products = await prisma.product.findMany({
      where: { published: true },
      select: {
        name: true,
        slug: true,
        brandLabel: true,
        price: true,
        originalPrice: true,
        tagline: true,
        description: true,
        notes: true,
        sizes: true,
        gender: true,
        subcategoryLabel: true,
        perfectSeason: true,
        stock: true,
        inStock: true
      },
    });

    const activeConvId = conv.id;
    const lang = detectLanguage(latestText, userLocale);

    // =========================================================================
    // SPRINT 42: SECURITY, PRIVACY & ACTION BOUNDARIES INTERCEPTION
    // Mandatory Test 4: Another customer's order status / PII protection
    // Mandatory Test 5: Autonomous refund / financial action refusal
    // =========================================================================
    const securityCheck = evaluateSecurityAndPrivacy(latestText, userLocale);
    if (!securityCheck.isSafe && securityCheck.safeMessage) {
      console.log(`>>> [Security & Privacy Guard] Intercepted violation: ${securityCheck.violationType}`);
      const reply = securityCheck.safeMessage;
      
      await prisma.advisorMessage.create({
        data: {
          conversationId: activeConvId,
          role: 'assistant',
          content: reply
        }
      });
      await prisma.advisorConversation.update({
        where: { id: activeConvId },
        data: { messagesCount: { increment: 1 }, updatedAt: new Date(), intent: 'security_intercept' }
      });
      const streamPayload = `0:${JSON.stringify(reply)}\n`;
      return new Response(streamPayload, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-conversation-id': conv.id,
          'x-active-model': 'nay-security-and-privacy-guard'
        }
      });
    }

    // =========================================================================
    // SPRINT 42: SOURCE 3 LICENSED ADAPTER GATE (Fragrantica.fr)
    // Mandatory Test 3: Request for Fragrantica info when no commercial license exists
    // =========================================================================
    if (lowerLatest.includes('fragrantica')) {
      console.log('>>> [Licensed Adapter Gate] Intercepted Fragrantica request: ToS compliance statement.');
      const isDarija = userLocale === 'ar' || lang === 'darija';
      const reply = isDarija
        ? `📚 **بخصوص بيانات موقع Fragrantica والتحقق من التراخيص الخارجية :**\n\nتلتزم دار NAY Parfums بأعلى معايير النزاهة القانونية واحترام شروط الاستخدام (Terms of Service) للمنصات الدولية. تنص شروط Fragrantica.fr (المحدثة في يناير 2026) صراحة على منع الاستخراج الآلي للبيانات (Automated Scraping) أو استخدام محتواها لتشغيل أنظمة الذكاء الاصطناعي وRAG بدون ترخيص تجاري كتابي مسبق.\n\nلذلك، **فإن محول الربط مع Fragrantica معطل افتراضياً في نظامنا** إلى حين حصول إدارة NAY على ترخيص تجاري رسمي. في المقابل، نعتمد على **الأرشيف الرسمي الموثق لـ دور العطور العالمية المصنعة (Dior, Chanel, Tom Ford...)** لتقديم أهرامات العطور ونوتات الرائحة الأصلية بدقة تامة وبكل شفافية!`
        : `📚 **Information relative à la plateforme Fragrantica & Conformité des Données :**\n\nLa Maison NAY applique une politique stricte de respect des droits de propriété intellectuelle et des conditions générales d'utilisation. Les conditions d'utilisation de Fragrantica.fr (mise à jour de janvier 2026) interdisent expressément l'extraction automatisée (scraping), l'interrogation non autorisée et l'exploitation de sa base de données pour alimenter des agents IA ou des architectures RAG sans accord de licence commerciale préalable.\n\nEn conséquence, **notre adaptateur d'accès direct à Fragrantica est désactivé par défaut** dans l'attente d'une convention formelle. Nous nous appuyons en revanche avec rigueur sur la **documentation technique officielle des maisons de haute parfumerie créatrices (Dior, Chanel, Tom Ford, Xerjoff...)** pour vous fournir des pyramides olfactives certifiées, transparentes et vérifiables.`;

      await prisma.advisorMessage.create({
        data: { conversationId: activeConvId, role: 'assistant', content: reply }
      });
      await prisma.advisorConversation.update({
        where: { id: activeConvId },
        data: { messagesCount: { increment: 1 }, updatedAt: new Date(), intent: 'adapter_gate' }
      });
      const streamPayload = `0:${JSON.stringify(reply)}\n`;
      return new Response(streamPayload, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-conversation-id': conv.id,
          'x-active-model': 'nay-licensed-adapter-gate'
        }
      });
    }

    // =========================================================================
    // SPRINT 42: SOURCE UNAVAILABLE / EXTERNAL WEB RESEARCH GATE
    // Mandatory Test 10: An unavailable external research service
    // =========================================================================
    const isExplicitWebSearchDemand = /(?:recherche en direct sur le web|cherche sur internet|google search en direct|scraping web|recherche live web|ابحث في الانترنت مباشرة|بحث مباشر في غوغل)/i.test(lowerLatest);
    if (isExplicitWebSearchDemand) {
      console.log('>>> [External Research Gate] Intercepted live unvetted web search demand.');
      const reply = `🌐 **Transparence sur les Capacités de Recherche Externe :**\n\nL'assistant Atelier NAY fonctionne exclusivement sur la base de données factuelles certifiées : notre catalogue de stock réel, les fiches techniques officielles des maisons de haute parfumerie et les règles de conformité légale.\n\nLe module de recherche web externe en temps réel non restreint est **actuellement désactivé** afin d'éviter tout risque de données hallucinées, d'injections de contenu tiers non vérifié et de coûts additionnels non autorisés par la direction. Je me ferai un plaisir de vous renseigner avec exactitude sur l'ensemble de nos références en stock et leurs équivalences olfactives certifiées !`;

      await prisma.advisorMessage.create({
        data: { conversationId: activeConvId, role: 'assistant', content: reply }
      });
      await prisma.advisorConversation.update({
        where: { id: activeConvId },
        data: { messagesCount: { increment: 1 }, updatedAt: new Date(), intent: 'web_search_gate' }
      });
      const streamPayload = `0:${JSON.stringify(reply)}\n`;
      return new Response(streamPayload, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-conversation-id': conv.id,
          'x-active-model': 'nay-external-research-gate'
        }
      });
    }

    // =========================================================================
    // SPRINT 42: SOURCE 2 VERIFIED MANUFACTURER ENGINE (Non-NAY Fragrance Research)
    // Mandatory Test 1: A perfume not sold by NAY with manufacturer notes available
    // =========================================================================
    const externalManufacturerMatch = lookupVerifiedManufacturer(latestText);
    if (externalManufacturerMatch && !externalManufacturerMatch.inNayCatalog) {
      console.log(`>>> [Manufacturer Knowledge Engine] Found verified non-NAY fragrance: ${externalManufacturerMatch.name}`);
      const prof = externalManufacturerMatch;
      const isDarija = userLocale === 'ar' || lang === 'darija';
      
      let reply = '';
      if (isDarija) {
        reply = `🏛️ **معلومات عطرية رسمية موثقة (المصدر: ${prof.sourceMetadata.sourceName}) :**\n\nعطر **${prof.brand} ${prof.name}** (${prof.concentration}) :\n\n• **العائلة العطرية :** ${prof.family}\n• **افتتاحية العطر (Tête) :** ${prof.pyramid.top.join('، ')}\n• **قلب العطر (Cœur) :** ${prof.pyramid.heart.join('، ')}\n• **قاعدة العطر (Fond) :** ${prof.pyramid.base.join('، ')}\n\n⚠️ **توضيح تجاري صريح :** هذا العطر **غير متوفر للبيع حالياً ضمن كتالوج Atelier NAY الرسمي**.\n\n💡 إذا كنت تبحث عن عطور بنفس الطابع الراقي والمتوفرة لدينا في المخزون مع خدمة **"جرب قبل ما تخلص"**، نقترح عليك مثلاً :\n• **[Chanel Bleu De Chanel EDP](/fr/product/chanel-bleu-de-chanel-eau-de-parfum-tester)** (299 MAD)\n• **[Dior Sauvage Elixir](/fr/product/dior-sauvage-elixir-tester)** (299 MAD)`;
      } else {
        reply = `🏛️ **Recherche Olfactive Vérifiée — Source Fabricant Certifiée :**\n\nConcernant **${prof.brand} ${prof.name}** (${prof.concentration}, création de ${prof.perfumer || 'la Maison'} - ${prof.releaseYear}) :\n\n• **Famille Olfactive :** ${prof.family}\n• **Notes de Tête :** ${prof.pyramid.top.join(', ')}\n• **Notes de Cœur :** ${prof.pyramid.heart.join(', ')}\n• **Notes de Fond :** ${prof.pyramid.base.join(', ')}\n\n*${prof.officialDescription}*\n\n⚠️ **Disponibilité Commerciale NAY :** Cette référence exacte **n'est pas commercialisée au sein de notre catalogue actuel Atelier NAY** (Source vérifiée : *${prof.sourceMetadata.sourceName}*).\n\n✨ **Alternatives d'Exception Disponibles en Stock :**\nSi vous appréciez cette signature olfactive, nous vous invitons à découvrir dans notre collection :\n• **[Chanel Bleu De Chanel EDP](/${userLocale}/product/chanel-bleu-de-chanel-eau-de-parfum-tester)** — 299 MAD (Fraîcheur aromatique et sillage boisé noble)\n• **[Dior Sauvage Elixir](/${userLocale}/product/dior-sauvage-elixir-tester)** — 299 MAD (Épices précieuses et lavande liquoreuse)\n\n*Profitez de notre garantie "Testez avant de payer" avec livraison express sous 24/48h ouvrées après expédition partout au Maroc.* `;
      }

      await prisma.advisorMessage.create({
        data: { conversationId: activeConvId, role: 'assistant', content: reply }
      });
      await prisma.advisorConversation.update({
        where: { id: activeConvId },
        data: { messagesCount: { increment: 1 }, updatedAt: new Date(), intent: 'manufacturer_research' }
      });
      const streamPayload = `0:${JSON.stringify(reply)}\n`;
      return new Response(streamPayload, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-conversation-id': conv.id,
          'x-active-model': 'nay-verified-manufacturer-engine'
        }
      });
    }

    // =========================================================================
    // FREE-FIRST PRE-ROUTING (Saves Google Gemini Free Tier Quota)
    // Pure store policy queries (shipping, tracking, cod, returns, pure tester)
    // are answered deterministically in < 30ms with ZERO external API calls.
    // =========================================================================
    if (!hasImageAttachment) {
      const isPureOrderTracking = (lowerLatest.includes('suivi') || lowerLatest.includes('suivre') || lowerLatest.includes('فين وصل') || lowerLatest.includes('تتبع') || lowerLatest.includes('طلبية') || lowerLatest.includes('track') || lowerLatest.includes('nay-')) && !lowerLatest.includes('parfum') && !lowerLatest.includes('sauvage') && !lowerLatest.includes('dior');
      const isPureShipping = (lowerLatest.includes('livraison') || lowerLatest.includes('توصيل') || lowerLatest.includes('ch7al livraison') || lowerLatest.includes('frais de port') || lowerLatest.includes('شحن')) && !lowerLatest.includes('recommand') && !lowerLatest.includes('conseil');
      const isPureTryBeforeYouPay = (lowerLatest.includes('testez avant') || lowerLatest.includes('essayer avant') || lowerLatest.includes('n7el') || lowerLatest.includes('nhel') || lowerLatest.includes('نحل') || lowerLatest.includes('نقلب') || lowerLatest.includes('avant de payer') || lowerLatest.includes('قدام الليفرور') || lowerLatest.includes('devant le livreur'));
      const isPureReturns = (lowerLatest.includes('retour') || lowerLatest.includes('remboursement') || lowerLatest.includes('garantie') || lowerLatest.includes('ضمان') || lowerLatest.includes('استرجاع') || lowerLatest.includes('مهرس'));
      const isPureTester = (lowerLatest.includes('testeur') || lowerLatest.includes('tester') || lowerLatest.includes('تيستور') || lowerLatest.includes('تيستر')) && (lowerLatest.includes('original') || lowerLatest.includes('vrai') || lowerLatest.includes('fake') || lowerLatest.includes('copie') || lowerLatest.includes('c\'est quoi') || lowerLatest.includes('شنو هو') || lowerLatest.includes('chno hwa') || lowerLatest.includes('difference'));

      if (isPureOrderTracking || isPureShipping || isPureTryBeforeYouPay || isPureReturns || isPureTester) {
        console.log('>>> [Free-First Pre-Routing] Instant deterministic resolution for pure policy/support query.');
        const { reply, slugs } = generateConciergeResponse(
          latestText,
          products,
          messages,
          userLocale,
          false,
          '',
          '',
          false
        );

        // Save assistant message to DB
        await prisma.advisorMessage.create({
          data: {
            conversationId: activeConvId,
            role: 'assistant',
            content: reply,
            recommendedProducts: slugs.length > 0 ? JSON.stringify(slugs) : null
          }
        });

        // Update conversation record
        await prisma.advisorConversation.update({
          where: { id: activeConvId },
          data: {
            messagesCount: { increment: 1 },
            updatedAt: new Date(),
            ...(slugs.length > 0 ? { recommendedSlugs: JSON.stringify(slugs) } : {}),
            intent: detectedIntent
          }
        });

        // Return in AI streaming format: `0:"..."\n`
        const streamPayload = `0:${JSON.stringify(reply)}\n`;
        return new Response(streamPayload, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'x-conversation-id': conv.id,
            'x-active-model': 'nay-deterministic-pre-routing'
          }
        });
      }
    }

    // =========================================================================
    // GEMINI MULTIMODAL VISION & FRAGRANCE CONCIERGE 3.0
    // =========================================================================
    const cleanedKey = rawKey ? rawKey.replace(/['"]/g, '').trim() : '';
    const hasValidAiKey = Boolean(cleanedKey && (cleanedKey.startsWith('AIzaSy') || cleanedKey.startsWith('AQ.')));
    let geminiQuotaExhausted = false;

    if (hasValidAiKey) {
      console.log('>>> [Sprint 41.1 AI Fragrance Concierge 3.0] Active and processing request.');
      try {
        const google = createGoogleGenerativeAI({ apiKey: cleanedKey });

        const catalogContext = products.map((p) => {
          let notesStr = '';
          try {
            const notesObj = typeof p.notes === 'string' ? JSON.parse(p.notes) : p.notes;
            notesStr = `Notes: Tête (${notesObj?.top?.join(', ') || ''}), Coeur (${notesObj?.heart?.join(', ') || ''}), Fond (${notesObj?.base?.join(', ') || ''})`;
          } catch {
            notesStr = String(p.notes || '');
          }
          const cleanSlug = encodeURIComponent(p.slug.trim());
          const stockStr = (p.inStock && (p.stock === null || p.stock > 0)) ? 'En stock' : 'Rupture temporaire';
          const refPrice = (p.originalPrice && p.originalPrice > p.price) ? ` (Réf: ${p.originalPrice} MAD)` : '';
          return `[${p.name}](/${userLocale}/product/${cleanSlug}) par ${p.brandLabel} (${p.subcategoryLabel || 'Parfum'}, ${p.gender || 'Mixte'}, Saison: ${p.perfectSeason || 'Toutes'}). Prix: ${p.price} MAD${refPrice}. Statut: ${stockStr}. ${p.tagline || ''}. ${notesStr}`;
        }).join('\n');

        const systemPrompt = `Tu es le Conseiller Parfumeur Dédié & Concierge Officiel de l'Atelier NAY Parfums au Maroc (https://nayparfum.ma).
Tu représentes l'excellence de la haute parfumerie marocaine avec une politesse raffinée, une rigueur olfactive absolue et une intégrité commerciale totale.

VÉRACITÉ COMMERCIALE STRICTE (NON-NÉGOCIABLE) :
1. N'invente JAMAIS d'emplacement d'entrepôt ni de ville de stockage (ne dis JAMAIS "dans notre réserve de Casablanca", "notre entrepôt de Casablanca" ou similaire). Indique simplement "dans notre stock Atelier NAY" ou "dans notre catalogue officiel".
2. N'invente JAMAIS de pourcentage de réduction pour les testeurs (ne dis JAMAIS "30% à 40% d'économie"). Si une fiche produit possède un prix d'origine (originalPrice), tu peux mentionner le prix d'origine réel. En l'absence de prix de référence officiel, cite uniquement le tarif catalogue réel (ex: 299 MAD).
3. Ne généralise pas le conditionnement ou la présence de capuchon : indique que les testeurs sont conditionnés sous boîte cartonnée neutre de testeur d'usine, et que la présence ou non d'un capuchon décoratif dépend de chaque marque et lot de fabrication. Le client peut demander confirmation au préalable sur WhatsApp (+212 663-380011) ou examiner le flacon lors de la livraison.
4. N'invente JAMAIS de classements de popularité, de notes ou de statut de "best-seller".
5. Délais d'acheminement : Les livraisons s'effectuent généralement sous 24h à 48h ouvrées APRÈS EXPÉDITION (et non après la simple passation de commande).

EXPERTISE TECHNIQUE & ART DE LA PARFUMERIE :
1. FAMILLES OLFACTIVES (8 Familles Fondatrices) :
   - Hespéridée (Agrumes vifs : bergamote de Calabre, citron, pamplemousse, mandarine)
   - Boisée (Cèdre de l'Atlas, santal, vétiver, oud, patchouli)
   - Ambrée / Orientale (Ambre, vanille de Madagascar, fève tonka, benjoin, résines)
   - Florale (Rose de mai, jasmin, tubéreuse, fleur d'oranger du Maroc, iris)
   - Gourmande (Accords praliné, caramel, cacao, miel, café)
   - Fougère / Aromatique (Lavande, sauge, romarin, géranium, mousse de chêne)
   - Chyprée (Contraste bergamote, mousse de chêne, patchouli et ciste-labdanum)
   - Cuirée (Cuir tanné, tabac blond, notes fumées, suède)

2. PYRAMIDES OLFACTIVES VÉRIFIÉES VS IMPRESSIONS SUBJECTIVES :
   - Distingue rigoureusement les notes vérifiées du catalogue (Tête, Cœur, Fond) des impressions descriptives subjectives.
   - Ne fabrique pas de notes olfactives absentes de la fiche produit officielle.

3. CONCENTRATIONS & DISTINCTIONS :
   - Les dénominations (EDC, EDT, EDP, Extrait, Elixir) représentent des ordres de grandeur de concentration d'essences et des styles de formulation propres à chaque maison, et non des pourcentages universels ou mathématiquement fixes pour chaque flacon.
   - Eau de Cologne (généralement 2% à 5%), Eau de Toilette (généralement 8% à 15%), Eau de Parfum (généralement 15% à 20%), Extrait/Elixir (formules denses souvent supérieures à 20-30%).

4. TENUE & SILLAGE (Performance Subjective & Non Garantie) :
   - Ne garantis JAMAIS une tenue en nombre d'heures absolu ni une projection universelle.
   - Présente toujours les estimations de performance comme subjectives : elles varient selon l'hydratation cutanée, le pH individuel, le climat (température, humidité) et la nature moléculaire des notes (les hespéridés sont plus volatils que les résines et bois).

5. COMPARAISONS CÔTE À CÔTE & FLANKERS :
   - Avant de comparer deux créations, vérifie impérativement les déclinaisons exactes présentes au catalogue (ex: chez NAY, Sauvage est disponible en Eau de Parfum, Parfum et Elixir ; Acqua di Giò est disponible en EDT, Profumo et Parfum).
   - Ne confonds jamais un flanker avec un autre. Si un flanker demandé n'est pas dans le catalogue (ex: Sauvage EDT), explique la nuance olfactive tout en précisant en toute franchise quelles déclinaisons exactes sont disponibles en stock chez NAY.

TRANSPARENCE SUR LES TESTEURS NAY (299-499 MAD) :
- Les testeurs proposés par NAY sont des flacons authentiques issus de circuits contrôlés pour les démonstrations.
- Ne formule JAMAIS d'assurances excessives ou non vérifiables telles que "vos informations restent 100% fiables" ou "garanti à 100%". Présente toujours les informations techniques avec mesure et honnêteté.
- Même formulation du jus, même concentration d'essences que les coffrets commerciaux scellés.
- Conditionnés dans des boîtes d'usine neutres (carton blanc ou kraft).
- La présence de capuchon varie selon chaque marque et lot de fabrication.
- Zéro risque grâce à la politique commerciale "Testez avant de payer".

RÈGLES DE RECOMMANDATION COMMERCIALE :
1. Respect strict du budget en MAD mentionné par le client. Ne propose jamais de parfum dépassant le budget annoncé.
2. Respect rigoureux de la saison (Hiver vs Été), de l'occasion et du genre demandé.
3. Toujours recommander 2 à 3 parfums réels issus du catalogue NAY avec leurs prix officiels et leurs liens Markdown exacts [Nom du Parfum](/${userLocale}/product/slug).
4. Règle de clarification : Si la demande du client est trop large ou imprécise, propose directement 2 à 3 créations de notre catalogue correspondant à son orientation générale ET pose au maximum UNE SEULE question de qualification (ex: univers de notes préféré ou occasion). Ne jamais submerger le client de questions.
5. Gestion des ruptures de stock : Si un parfum demandé est en "Rupture temporaire", annonce-le avec franchise et propose 2 alternatives de même univers disponibles en stock.
6. Parfums non répertoriés : Si le client interroge sur une référence absente du catalogue, décris sa pyramide olfactive avec érudition, indique en toute franchise qu'elle n'est pas commercialisée chez NAY, et propose des créations équivalentes du catalogue.

POLITIQUES OFFICIELLES DU MAGASIN (CODE-ENFORCED) :
1. Frais de livraison standard : 35 MAD partout au Maroc.
2. Livraison GRATUITE dès 800 MAD d'achats dans le panier.
3. Délais d'expédition : Livraison généralement sous 24h à 48h ouvrées APRÈS EXPÉDITION.
4. Politique commerciale exclusive "Testez avant de payer" (Try Before You Pay) : Engagement propre à NAY Parfums (et non un droit statutaire universel). Le client ouvre son colis et teste son flacon en main propre devant le coursier avant de régler en espèces. En cas de refus, il ne paie absolument rien (0 MAD), sans frais de livraison.
5. Retours & Réclamations : Démarche sous 7 jours via WhatsApp (+212 663-380011) selon les conditions officielles (/legal/returns) pour flacons scellés ou avaries de transport constatées à la livraison.
6. Suivi de commande : Diriger vers la page [Suivre ma commande en direct](/${userLocale}/suivi-commande) avec référence de commande et numéro de téléphone.

TON & MAÎTRISE LINGUISTIQUE :
- Réponds toujours dans la langue du client : Darija marocaine (en graphie arabe ou Arabizi), Français, Arabe standard ou Anglais.
- Adopte un ton chaleureux, poli, luxueux et accueillant ("على الراس والعين", "مرحبا بك في Atelier NAY").

CATALOGUE DISPONIBLE (LECTURE SEULE) :
${catalogContext}`;

        const candidateModels = [
          'gemini-3.5-flash-lite',
          'gemini-flash-lite-latest',
          'gemini-3-flash-preview',
          'gemini-3.1-flash-lite',
          'gemini-3.5-flash'
        ];

        let result = null;
        let activeModelUsed = '';
        const coreMessages = convertToCoreMessages(messages);

        for (const modelCandidate of candidateModels) {
          try {
            console.log(`>>> [Fragrance Concierge] Attempting stream with model: ${modelCandidate}`);
            result = await streamText({
              model: google(modelCandidate) as any,
              system: systemPrompt,
              messages: coreMessages,
              temperature: 0.7,
              maxRetries: 0,
              onFinish: async (completion) => {
                try {
                  const fullText = completion.text;
                  const slugMatches = fullText.match(/\/(?:[a-z]{2}\/)?product\/([a-zA-Z0-9_.-]+)/g) || [];
                  const slugs = Array.from(new Set(slugMatches.map(m => m.replace(/^\/(?:[a-z]{2}\/)?product\//, ''))));
                  const allText = latestText + ' ' + fullText;
                  const combinedNotes = extractOlfactoryNotes(allText);

                  await prisma.advisorMessage.create({
                    data: {
                      conversationId: activeConvId,
                      role: 'assistant',
                      content: fullText,
                      recommendedProducts: slugs.length > 0 ? JSON.stringify(slugs) : null
                    }
                  });

                  await prisma.advisorConversation.update({
                    where: { id: activeConvId },
                    data: {
                      messagesCount: { increment: 1 },
                      updatedAt: new Date(),
                      ...(slugs.length > 0 ? { recommendedSlugs: JSON.stringify(slugs) } : {}),
                      ...(combinedNotes.length > 0 ? { preferredNotes: JSON.stringify(combinedNotes) } : {}),
                      ...(detectedGender ? { preferredGender: detectedGender } : {}),
                      intent: detectedIntent
                    }
                  });
                } catch (saveErr) {
                  console.error('Error saving Conseiller NAY interaction:', saveErr);
                }
              }
            });
            activeModelUsed = modelCandidate;
            console.log(`>>> [Fragrance Concierge] Successfully initiated stream with model: ${modelCandidate}`);
            break;
          } catch (modelErr: any) {
            console.warn(`Model ${modelCandidate} failed (${modelErr?.statusCode || modelErr?.message?.slice(0, 60)}), trying next candidate...`);
          }
        }

        if (result) {
          return result.toDataStreamResponse({
            headers: {
              'x-conversation-id': conv.id,
              'x-active-model': activeModelUsed
            }
          });
        }
        geminiQuotaExhausted = true;
      } catch (aiErr) {
        console.warn('Gemini stream failed, falling back to deterministic catalog advisor:', aiErr);
        geminiQuotaExhausted = true;
      }
    } else {
      geminiQuotaExhausted = true;
    }

    // High-Precision Grounded RAG & Fallback Concierge Engine
    const { reply, slugs } = generateConciergeResponse(
      latestText, 
      products, 
      messages,
      userLocale,
      hasImageAttachment,
      attachmentName,
      ocrText,
      geminiQuotaExhausted
    );
    const combinedNotes = extractOlfactoryNotes(latestText + ' ' + reply);

    // Save assistant message to DB
    await prisma.advisorMessage.create({
      data: {
        conversationId: activeConvId,
        role: 'assistant',
        content: reply,
        recommendedProducts: slugs.length > 0 ? JSON.stringify(slugs) : null
      }
    });

    // Update conversation record
    await prisma.advisorConversation.update({
      where: { id: activeConvId },
      data: {
        messagesCount: { increment: 1 },
        updatedAt: new Date(),
        ...(slugs.length > 0 ? { recommendedSlugs: JSON.stringify(slugs) } : {}),
        ...(combinedNotes.length > 0 ? { preferredNotes: JSON.stringify(combinedNotes) } : {}),
        ...(detectedGender ? { preferredGender: detectedGender } : {}),
        intent: detectedIntent
      }
    });

    // Return in AI streaming text format: `0:"..."\n`
    const streamPayload = `0:${JSON.stringify(reply)}\n`;
    const activeFallbackModel = hasImageAttachment ? 'ocr-grounded-fallback' : 'nay-grounded-rag-engine';
    return new Response(streamPayload, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-conversation-id': conv.id,
        'x-active-model': activeFallbackModel
      }
    });
  } catch (error) {
    console.error('Erreur API Chat Conseiller NAY:', error);
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 });
  }
}
