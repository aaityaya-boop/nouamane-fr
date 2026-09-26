import prisma from '@/lib/prisma';

export const OLFACTORY_NOTES_DICTIONARY = [
  'Vanille',
  'Oud',
  'Boisé',
  'Ambre',
  'Frais',
  'Floral',
  'Musc',
  'Gourmand',
  'Cuir',
  'Épicé',
  'Tabac',
  'Agrumes / Hespéridé',
  'Lavande',
  'Rose',
  'Jasmin',
  'Café',
  'Fève Tonka',
  'Bois de Santal',
  'Cèdre',
  'Patchouli'
];

export const INTENT_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  RECOMMENDATION: { label: 'Recommandation Parfum', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  GIFT_SEARCH: { label: 'Recherche Cadeau', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  TESTER_INQUIRY: { label: 'Demande Testeur', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  SILLAGE_PERFUME: { label: 'Tenue & Sillage', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  PRICE_SHIPPING: { label: 'Prix & Livraison', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  COMPLAINT: { label: 'SAV / Question Commande', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  GENERAL: { label: 'Conseil Général', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export function detectCustomerIntent(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('cadeau') || lower.includes('offrir') || lower.includes('anniversaire') || lower.includes('mariage') || lower.includes('fête')) {
    return 'GIFT_SEARCH';
  }
  if (lower.includes('testeur') || lower.includes('tester') || lower.includes('original') || lower.includes('master copy') || lower.includes('authenticité')) {
    return 'TESTER_INQUIRY';
  }
  if (lower.includes('prix') || lower.includes('livraison') || lower.includes('combien') || lower.includes('paiement') || lower.includes('délai') || lower.includes('dh') || lower.includes('mad') || lower.includes('livrer')) {
    return 'PRICE_SHIPPING';
  }
  if (lower.includes('tenue') || lower.includes('sillage') || lower.includes('dure') || lower.includes('puissant') || lower.includes('tient') || lower.includes('reste') || lower.includes('projette')) {
    return 'SILLAGE_PERFUME';
  }
  if (lower.includes('problème') || lower.includes('retard') || lower.includes('réclamation') || lower.includes('trompé') || lower.includes('retour') || lower.includes('annuler')) {
    return 'COMPLAINT';
  }
  return 'RECOMMENDATION';
}

export function extractOlfactoryNotes(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  const map: Record<string, string[]> = {
    'Vanille': ['vanille', 'vanilla', 'vanillé', 'sucré'],
    'Oud': ['oud', 'bois de oud', 'aoud', 'oriental'],
    'Bois de Santal': ['santal', 'sandalwood'],
    'Boisé': ['boisé', 'bois', 'cèdre', 'vetiver', 'vétiver'],
    'Ambre': ['ambre', 'ambré', 'amber'],
    'Cuir': ['cuir', 'leather', 'omber leather'],
    'Café': ['café', 'coffee', 'black opium'],
    'Gourmand': ['gourmand', 'caramel', 'chocolat', 'miel', 'praline', 'praliné', 'sucre'],
    'Musc': ['musc', 'musk', 'tahara', 'musqué'],
    'Floral': ['fleur', 'floral', 'rose', 'jasmin', 'fleurs blanches', 'néroli', 'neroli'],
    'Frais / Hespéridé': ['frais', 'agrumes', 'bergamote', 'citron', 'aquatique', 'marin', 'été'],
    'Épicé': ['épicé', 'épices', 'cannelle', 'poivre', 'cardamome'],
    'Tabac': ['tabac', 'tobacco', 'feuille de tabac'],
    'Fève Tonka': ['tonka', 'fève tonka']
  };

  for (const [canonical, keywords] of Object.entries(map)) {
    if (keywords.some(kw => lower.includes(kw))) {
      matched.push(canonical);
    }
  }

  return matched;
}

function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export async function getConseillerAnalyticsData() {
  const conversations = await prisma.advisorConversation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  const totalConversations = conversations.length;
  const totalQuestions = conversations.reduce((acc: number, c: any) => {
    const userMsgs = c.messages.filter((m: any) => m.role === 'user').length;
    return acc + (userMsgs > 0 ? userMsgs : Math.max(1, Math.floor(c.messagesCount / 2)));
  }, 0);

  // Intent breakdown
  const intentCounts: Record<string, number> = {};
  conversations.forEach((c: any) => {
    const it = c.intent || 'RECOMMENDATION';
    intentCounts[it] = (intentCounts[it] || 0) + 1;
  });

  const intentBreakdown = Object.entries(intentCounts).map(([key, count]) => ({
    key,
    label: INTENT_LABELS[key]?.label || key,
    count,
    percentage: totalConversations > 0 ? Math.round((count / totalConversations) * 100) : 0,
    badgeBg: INTENT_LABELS[key]?.bg || 'bg-slate-100',
    badgeText: INTENT_LABELS[key]?.text || 'text-slate-700',
    badgeBorder: INTENT_LABELS[key]?.border || 'border-slate-200'
  })).sort((a, b) => b.count - a.count);

  // Note frequency aggregation
  const noteCounts: Record<string, number> = {};
  conversations.forEach((c: any) => {
    let notes: string[] = safeJsonParse<string[]>(c.preferredNotes, []);

    if (!notes || notes.length === 0) {
      // Extract from user messages content
      const userText = c.messages.filter((m: any) => m.role === 'user').map((m: any) => m.content).join(' ');
      notes = extractOlfactoryNotes(userText);
    }

    notes.forEach((n: string) => {
      noteCounts[n] = (noteCounts[n] || 0) + 1;
    });
  });

  const topNotes = Object.entries(noteCounts)
    .map(([note, count]) => ({
      note,
      count,
      percentage: totalConversations > 0 ? Math.min(100, Math.round((count / totalConversations) * 100)) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top Recommended Products
  const slugCounts: Record<string, number> = {};
  conversations.forEach((c: any) => {
    const slugs = safeJsonParse<string[]>(c.recommendedSlugs, []);
    slugs.forEach((s: string) => {
      slugCounts[s] = (slugCounts[s] || 0) + 1;
    });
  });

  // Fetch product details for slugs
  const allSlugs = Object.keys(slugCounts);
  const products = allSlugs.length > 0 
    ? await prisma.product.findMany({
        where: { slug: { in: allSlugs } },
        select: { slug: true, name: true, brandLabel: true, price: true, images: true, subcategoryLabel: true }
      })
    : [];

  const productMap = new Map(products.map((p: any) => [p.slug, p]));

  const topRecommendedProducts = Object.entries(slugCounts)
    .map(([slug, count]) => {
      const p = productMap.get(slug);
      let img = '/images/nay/products/default.jpg';
      if (p?.images) {
        try {
          const parsed = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
          if (Array.isArray(parsed) && parsed.length > 0) img = parsed[0];
          else if (typeof parsed === 'string') img = parsed;
        } catch {
          img = String(p.images);
        }
      }
      return {
        slug,
        count,
        name: p?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        brandLabel: p?.brandLabel || 'Maison NAY',
        price: p?.price || 334,
        image: img,
        subcategoryLabel: p?.subcategoryLabel || 'Parfum'
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Gender Preference Breakdown
  let hommeCount = 0;
  let femmeCount = 0;
  let mixteCount = 0;

  conversations.forEach((c: any) => {
    const g = (c.preferredGender || '').toUpperCase();
    if (g === 'HOMME') hommeCount++;
    else if (g === 'FEMME') femmeCount++;
    else mixteCount++;
  });

  // Top Customer Questions Samples
  const customerQuestions = conversations
    .flatMap((c: any) => c.messages.filter((m: any) => m.role === 'user').map((m: any) => ({
      conversationId: c.id,
      text: m.content,
      createdAt: m.createdAt,
      intent: c.intent,
      summary: c.summary
    })))
    .filter((q: any) => q.text && q.text.trim().length > 6)
    .slice(0, 15);

  return {
    totalConversations,
    totalQuestions,
    intentBreakdown,
    topNotes,
    topRecommendedProducts,
    genderStats: {
      homme: hommeCount,
      femme: femmeCount,
      mixte: mixteCount,
      total: totalConversations
    },
    customerQuestions,
    conversations: conversations.map((c: any) => ({
      id: c.id,
      sessionId: c.sessionId,
      customerName: c.customerName,
      customerPhone: c.customerPhone,
      customerCity: c.customerCity,
      summary: c.summary || 'Demande de conseil fragrance',
      intent: c.intent || 'RECOMMENDATION',
      preferredNotes: safeJsonParse<string[]>(c.preferredNotes, []),
      preferredGender: c.preferredGender || 'UNISEXE',
      budget: c.budget,
      recommendedSlugs: safeJsonParse<string[]>(c.recommendedSlugs, []),
      messagesCount: c.messages.length || c.messagesCount,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messages: c.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        recommendedProducts: safeJsonParse<string[]>(m.recommendedProducts, []),
        createdAt: m.createdAt.toISOString()
      }))
    }))
  };
}
