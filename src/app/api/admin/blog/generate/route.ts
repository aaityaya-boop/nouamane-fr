import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';
import { buildNayBusinessDossier, NayBusinessDossier } from '@/lib/blog/businessKnowledge';

const BlogGenerationSchema = z.object({
  title: z.string().describe('Titre éditorial accrocheur et optimisé SEO Maroc'),
  slug: z.string().describe('Slug URL kebab-case en minuscules sans accents'),
  excerpt: z.string().describe('Résumé captivant de 2-3 phrases incitant à la lecture'),
  content: z
    .string()
    .describe(
      'Article HTML complet et riche (min 650 mots) avec <h2>, <h3>, <p>, <ul>/<li>, <strong>, encadrés conseil NAY Parfums, liens internes <a href="/fr/products/..."> vers les produits réels et section FAQ'
    ),
  metaTitle: z.string().describe('Méta titre Google (entre 45 et 62 caractères max)'),
  metaDescription: z.string().describe('Méta description Google (entre 125 et 158 caractères max)'),
  category: z.string().describe('Catégorie éditoriale (Guides, Conseils, Tendances, Coffrets, Comparatifs)'),
  tags: z.array(z.string()).describe('5 à 8 mots-clés pertinents SEO'),
  ctaText: z.string().describe('Texte du bouton CTA boutique'),
  ctaLink: z.string().describe('URL interne boutique (ex: /fr/shop, /fr/testeurs, /fr/products/...)'),
  suggestedKeywords: z.array(z.string()).describe('Requêtes cibles Google.ma'),
  suggestedProductKeywords: z.array(z.string()).describe('Slugs ou noms produits mentionnés'),
});

function buildSmartFallbackArticle(
  idea: string,
  category: string,
  focusKeyword: string,
  language: string,
  dossier: NayBusinessDossier
) {
  const cleanIdea = idea.trim() || 'Comment choisir le meilleur parfum longue tenue au Maroc';
  const targetKw = focusKeyword.trim() || cleanIdea.toLowerCase().slice(0, 48);
  const topProds = dossier.matchedProducts.slice(0, 4);

  const cleanSlugBase = cleanIdea
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 56);
  const slug = cleanSlugBase || `guide-nay-parfums-${Date.now().toString(36).slice(-4)}`;

  if (language === 'ar') {
    const title = `${cleanIdea} — دليل خبراء NAY Parfums المغرب`;
    const metaTitle = `${title.slice(0, 54)} | NAY`;
    const metaDescription = `اكتشف نصائح NAY Parfums المغرب: ${cleanIdea}. عطور وتيستورات أصلية 100%، توصيل 24-48 ساعة ومعاينة الطرد قبل الدفع.`;
    const prodListHtml = topProds
      .map(
        (mp) =>
          `<li><strong><a href="/fr/products/${mp.slug}">${mp.name} (${mp.brandLabel})</a> — ${mp.price} درهم :</strong> ${
            mp.notesSummary || mp.tagline || 'عطر فاخر بثبات عالٍ وفوحان مميز.'
          }</li>`
      )
      .join('\n');

    const content = `
<h2>مقدمة: خبرة Maison NAY Parfums في السوق المغربي</h2>
<p>في <strong>NAY Parfums</strong> (${dossier.totalProducts} عطرًا من أكثر من ${dossier.brandsCount} دار عالمية)، نضع خبرتنا رهن إشارتكم لمساعدتكم على اختيار العطر المثالي بذكاء: <strong>${cleanIdea}</strong>. سواء كنتم في الدار البيضاء أو الرباط أو مراكش أو طنجة، نضمن لكم الجودة والأصالة بأفضل الأسعار.</p>

<div style="background-color: #f0f9ff; border-right: 4px solid #0ea5e9; padding: 16px; border-radius: 10px; margin: 24px 0;">
  <p style="margin: 0; color: #0369a1; font-weight: 700;">💡 ضمانة الثقة من NAY Parfums :</p>
  <p style="margin: 8px 0 0 0; color: #0c4a6e; font-size: 14px;">يمكنكم فتح الطرد ومعاينة قنينة العطر أمام الموزع قبل دفع أي درهم. التوصيل خلال ${dossier.policies.deliveryTimeline} (مجاني ابتداءً من ${dossier.policies.freeShippingThresholdMAD} درهم).</p>
</div>

<h2>أبرز اختياراتنا المتوفرة حالياً في المتجر</h2>
<ul>
${prodListHtml}
</ul>

<h2>لماذا يثق العملاء في عطور وتيستورات NAY؟</h2>
<ul>
  <li><strong>تيستورات أصلية 100ml (${dossier.rangesSummary.testersCount} منتج):</strong> نفس تركيز وجودة العطر التجاري في علبة مصنع بسيطة بسعر اقتصادي بين 299 و499 درهم.</li>
  <li><strong>دفع عند الاستلام بأمان تام:</strong> معاينة كاملة قبل الأداء، وخدمة إرجاع خلال 7 أيام عبر واتساب ${dossier.whatsapp}.</li>
</ul>
`.trim();

    return {
      title,
      slug,
      excerpt: metaDescription,
      content,
      metaTitle,
      metaDescription,
      category: category || 'Guides',
      tags: ['عطور المغرب', 'تيستور أصلي', 'NAY Parfums', 'الدفع عند الاستلام'],
      ctaText: 'اكتشف المجموعة الكاملة',
      ctaLink: '/ar/shop',
      suggestedKeywords: [targetKw, 'عطور أصلية المغرب', 'تيستور عطر المغرب'],
      suggestedProductKeywords: topProds.map((p) => p.slug),
    };
  }

  const title =
    cleanIdea.length > 18
      ? cleanIdea.charAt(0).toUpperCase() + cleanIdea.slice(1)
      : `${cleanIdea} : Le Guide Expert Maison NAY Parfums Maroc`;
  const metaTitle = `${title.slice(0, 48)} | NAY Maroc`;
  const metaDescription = `${cleanIdea} — Conseils d'experts NAY Parfums (${dossier.totalProducts} références). Livraison 24/48h au Maroc & vérification colis avant paiement.`;
  const excerpt = `Analyse complète et recommandations concrètes sur "${cleanIdea}" adaptées au marché marocain, avec sélection de flacons authentiques Maison NAY et conseils de tenue.`;

  const promoBlock =
    dossier.activePromos.length > 0
      ? `<p>🎁 <strong>Astuce Budget :</strong> Profitez actuellement du code <code>${dossier.activePromos[0].code}</code> (${dossier.activePromos[0].label}) ou de nos packs multi-flacons avec <strong>livraison gratuite dès ${dossier.policies.freeShippingThresholdMAD} MAD</strong>.</p>`
      : `<p>🚚 <strong>Avantage NAY :</strong> La livraison est offerte partout au Maroc dès <strong>${dossier.policies.freeShippingThresholdMAD} MAD</strong> d'achat (tarif standard ${dossier.policies.standardShippingFeeMAD} MAD).</p>`;

  const productCardsHtml = topProds
    .map(
      (mp) =>
        `<li><strong><a href="/fr/products/${mp.slug}">${mp.name} (${mp.brandLabel})</a> — ${mp.price} MAD :</strong> ${
          mp.notesSummary || mp.tagline || 'Fragrance authentique à haute tenue et sillage remarquable.'
        }</li>`
    )
    .join('\n');

  const content = `
<h2>${cleanIdea} : l'approche experte Maison NAY Parfums</h2>
<p>Chez <strong>Maison NAY Parfums</strong>, nous accompagnons chaque jour des milliers de passionnés à Casablanca, Rabat, Marrakech, Tanger et partout au Maroc à travers un catalogue vérifié de <strong>${dossier.totalProducts} parfums</strong> issus de ${dossier.brandsCount} maisons prestigieuses (${dossier.topBrands.slice(0, 6).join(', ')}). Sur la thématique « <em>${cleanIdea}</em> », voici tout ce qu'il faut maîtriser pour faire le meilleur choix selon votre style, votre budget et le climat marocain.</p>

<div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 10px; margin: 24px 0;">
  <p style="margin: 0; color: #0369a1; font-weight: 700;">💡 Engagement Confiance Maison NAY (Vérifier Avant de Payer) :</p>
  <p style="margin: 8px 0 0 0; color: #0c4a6e; font-size: 14px;">${dossier.policies.tryBeforeYouPay}. Expédition rapide en ${dossier.policies.deliveryTimeline} partout au Maroc, avec support direct sur WhatsApp au <strong>${dossier.whatsapp}</strong>.</p>
</div>

<h2>Notre sélection de parfums recommandés en stock chez NAY</h2>
<p>Pour répondre précisément à ce besoin, nos conseillers olfactifs ont sélectionné les références les plus appréciées de notre catalogue actuel :</p>
<ul>
${productCardsHtml}
</ul>

<h2>Comprendre nos 4 gammes : Testeurs 100ml, Originaux, Master Copy &amp; Coffrets</h2>
<p>Afin de s'adapter à chaque occasion — usage quotidien, mariage ou cadeau prestigieux — Maison NAY structure son catalogue en quatre univers complémentaires :</p>
<ul>
  <li><strong>Testeurs Originaux 100ml (${dossier.rangesSummary.testersCount} références, 299 à 499 MAD) :</strong> des flacons officiels destinés à la démonstration, livrés en boîte neutre cartonnée avec exactement la même essence et la même concentration que les coffrets scellés.</li>
  <li><strong>Parfums Originaux Scellés (${dossier.rangesSummary.originalsCount} références) :</strong> flacons commerciaux neufs sous blister d'origine, parfaits pour offrir.</li>
  <li><strong>Master Copy (${dossier.rangesSummary.masterCopyCount} références) :</strong> alternatives économiques haute fidélité olfactive.</li>
  <li><strong>Coffrets Cadeaux &amp; Packs Découverte (${dossier.rangesSummary.coffretsCount} références) :</strong> coffrets prêts à offrir avec présentation soignée.</li>
</ul>

${promoBlock}

<h3>Questions fréquentes sur la livraison et l'authenticité au Maroc</h3>
<ul>
  <li><strong>Puis-je vérifier le flacon avant de payer ?</strong> Oui, le livreur vous permet d'ouvrir et de contrôler votre colis avant tout paiement en espèces (0 MAD en cas de refus).</li>
  <li><strong>Quels sont les frais et délais de livraison ?</strong> ${dossier.policies.standardShippingFeeMAD} MAD en tarif standard (offert dès ${dossier.policies.freeShippingThresholdMAD} MAD), sous ${dossier.policies.deliveryTimeline}.</li>
  <li><strong>Comment contacter un conseiller ?</strong> Directement sur WhatsApp au ${dossier.whatsapp} pour un accompagnement olfactif personnalisé.</li>
</ul>
`.trim();

  return {
    title,
    slug,
    excerpt,
    content,
    metaTitle: metaTitle.slice(0, 62),
    metaDescription: metaDescription.slice(0, 158),
    category: category || 'Guides',
    tags: [
      'NAY Parfums',
      'parfum maroc',
      'testeur original 100ml',
      'paiement à la livraison',
      targetKw,
    ],
    ctaText: 'Découvrir les Parfums en Stock',
    ctaLink: '/fr/shop',
    suggestedKeywords: [targetKw, 'testeur parfum original maroc', 'parfum longue tenue casablanca'],
    suggestedProductKeywords: topProds.map((p) => p.slug),
  };
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(request, [
      'marketing.manage_seo',
      'marketing.view',
    ]);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const topic: string = body.topic || body.idea || '';
    const category: string = body.category || 'Guides';
    const tone: string = body.tone || 'Luxe & Expert';
    const focusKeyword: string = body.focusKeyword || '';
    const language: 'fr' | 'ar' | 'en' = body.language === 'ar' ? 'ar' : body.language === 'en' ? 'en' : 'fr';

    if (!topic.trim()) {
      return NextResponse.json(
        { success: false, error: "Veuillez saisir une idée ou un sujet d'article." },
        { status: 400 }
      );
    }

    // Build complete Maison NAY business + real catalog dossier
    const dossier = await buildNayBusinessDossier(topic, focusKeyword);

    let generatedData: z.infer<typeof BlogGenerationSchema> | null = null;
    let generationSource = 'NAY_BUSINESS_ENGINE';

    const rawKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    const cleanedKey = rawKey ? rawKey.replace(/['"]/g, '').trim() : '';

    if (cleanedKey && cleanedKey.length > 10) {
      try {
        const googleProvider = createGoogleGenerativeAI({ apiKey: cleanedKey });
        const langLabel =
          language === 'ar'
            ? 'Arabe moderne fluide et raffiné (adapté au public marocain)'
            : language === 'en'
            ? 'English (luxury fragrance editorial tone)'
            : 'Français éditorial premium adapté au marché marocain';

        const prompt = `
Tu es le Rédacteur en Chef Editorial & Stratège SEO Google.ma officiel de **Maison NAY Parfums** (https://nayparfum.ma).
Tu connais PARFAITEMENT notre entreprise, notre catalogue réel et nos garanties commerciales grâce au dossier ci-dessous :

${dossier.systemContextPrompt}

DEMANDE DE L'ADMINISTRATEUR (À TRANSFORMER EN ARTICLE COMPLET) :
- Idée / Sujet brut : "${topic}"
- Catégorie : ${category}
- Ton : ${tone}
- Langue de rédaction : ${langLabel}
- Mot-clé SEO principal : "${focusKeyword || topic}"

DIRECTIVES OBLIGATOIRES DE QUALITÉ PROFESSIONNELLE :
1. Utilise UNIQUEMENT nos vrais faits d'entreprise (livraison ${dossier.policies.standardShippingFeeMAD} MAD gratuite dès ${dossier.policies.freeShippingThresholdMAD} MAD en ${dossier.policies.deliveryTimeline}, essai/vérification devant le livreur avant de payer, WhatsApp ${dossier.whatsapp}, nos vraies gammes Testeurs 100ml / Originaux / Master Copy / Coffrets).
2. Cite naturellement 2 à 4 VRAIS parfums du catalogue listés ci-dessus avec leur prix réel en MAD et des liens internes HTML exacts (<a href="/fr/products/SLUG">Nom Parfum</a>).
3. Structure HTML riche et lisible : <h2> accrocheurs, <h3>, listes <ul><li>, <strong> sur les points clés, un encadré "Conseil d'Expert NAY Parfums" (<div style="background-color:#f0f9ff;border-left:4px solid #0ea5e9;padding:16px;border-radius:10px;margin:24px 0;">...</div>), et une mini-FAQ à la fin.
4. Longueur : minimum 650 mots d'expertise authentique (aucun blabla générique).
5. Meta Title entre 45 et 62 caractères ; Meta Description entre 125 et 158 caractères.
`;

        const result = await generateObject({
          model: googleProvider('gemini-2.5-flash') as any,
          schema: BlogGenerationSchema,
          prompt,
          temperature: 0.7,
        });

        const parsedObj = (result as { object?: z.infer<typeof BlogGenerationSchema> })?.object;
        if (parsedObj) {
          generatedData = parsedObj;
          generationSource = 'AI_GEMINI_NAY_TRAINED';
        }
      } catch (aiErr) {
        console.warn('Gemini blog generation fallback triggered:', aiErr);
      }
    }

    if (!generatedData) {
      generatedData = buildSmartFallbackArticle(topic, category, focusKeyword, language, dossier);
    }

    // Match real catalog slugs referenced in generated article or dossier
    const contentLower = `${generatedData.title} ${generatedData.content}`.toLowerCase();
    const matchedProducts = dossier.matchedProducts.filter(
      (mp) =>
        contentLower.includes(mp.name.toLowerCase()) ||
        contentLower.includes(mp.slug.toLowerCase())
    );
    const relatedSlugs =
      matchedProducts.length > 0
        ? matchedProducts.map((m) => m.slug).slice(0, 4)
        : dossier.matchedProducts.slice(0, 3).map((m) => m.slug);

    // Pick best matching cover image (real product image if available, else luxury preset)
    const suggestedCover =
      dossier.matchedProducts.find((m) => m.imageUrl && m.imageUrl.startsWith('http'))?.imageUrl ||
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80';

    return NextResponse.json({
      success: true,
      source: generationSource,
      businessContext: {
        totalProducts: dossier.totalProducts,
        brandsCount: dossier.brandsCount,
        matchedProducts: dossier.matchedProducts.slice(0, 4).map((m) => ({
          slug: m.slug,
          name: m.name,
          brandLabel: m.brandLabel,
          price: m.price,
        })),
        activePromos: dossier.activePromos,
      },
      data: {
        ...generatedData,
        coverImage: suggestedCover,
        relatedProductSlugs: relatedSlugs,
      },
    });
  } catch (error: unknown) {
    console.error('Blog AI generation API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur génération IA' },
      { status: 500 }
    );
  }
}
