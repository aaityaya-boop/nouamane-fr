import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const BlogGenerationSchema = z.object({
  title: z.string().describe("Titre accrocheur et optimisé SEO pour le marché marocain"),
  slug: z.string().describe("Slug d'URL en minuscules avec tirets (ex: top-5-parfums-homme-maroc)"),
  excerpt: z.string().describe("Résumé captivant de 2-3 phrases incitant au clic"),
  content: z.string().describe("Contenu complet en HTML riche avec balises <h2>, <h3>, <p>, <ul>, <li>, <strong> et encadrés"),
  metaTitle: z.string().describe("Méta titre Google (entre 50 et 60 caractères max)"),
  metaDescription: z.string().describe("Méta description Google (entre 130 et 155 caractères max)"),
  category: z.string().describe("Catégorie de l'article (ex: Guides, Conseils, Tendances, Nouveautés, Coffrets)"),
  tags: z.array(z.string()).describe("5 à 8 tags pertinents (ex: parfum homme, maroc, longue tenue, oud, testeur)"),
  ctaText: z.string().describe("Texte du bouton d'appel à l'action (ex: Explorer la sélection Homme)"),
  ctaLink: z.string().describe("Lien interne boutique pour le CTA (ex: /shop/men ou /shop)"),
  suggestedKeywords: z.array(z.string()).describe("Mots-clés SEO ciblés pour Google.ma"),
  suggestedProductKeywords: z.array(z.string()).describe("Noms de marques ou parfums mentionnés pour lier au catalogue"),
});

// Fallback high-quality Moroccan perfume content generator in case API key is unavailable
function generateSmartMoroccanContent(topic: string, category: string, tone: string, focusKeyword: string, products: any[]) {
  const brandList = ["Valentino", "Yves Saint Laurent", "Giorgio Armani", "Dior", "Chanel", "Tom Ford", "Jean Paul Gaultier"];
  const targetKw = focusKeyword || "parfum maroc";
  
  // Pick 3-4 suitable products from real DB if available
  const matchedProducts = products.slice(0, 4);
  const prodNames = matchedProducts.map(p => p.name).join(', ') || 'Born In Roma, Libre Intense, Acqua Di Gio, Sauvage';

  const cleanSlug = (topic || 'guide-parfum-luxe-maroc')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const title = topic.length > 5 
    ? (topic.includes('Maroc') ? topic : `${topic} au Maroc : Guide & Sélection NAY Parfums`)
    : `Les Meilleurs Parfums Longue Tenue au Maroc : Sélection & Conseils d'Experts`;

  const metaTitle = `${title.slice(0, 50)} | NAY Parfum Maroc`;
  const metaDescription = `Découvrez notre guide exclusif sur ${topic || 'les parfums de luxe au Maroc'}. Conseils de sillage, authenticité et livraison rapide 24h/48h.`;
  const excerpt = `À la recherche de votre signature olfactive idéale sous le climat marocain ? Découvrez notre analyse experte des fragrances les plus envoûtantes, leur tenue et nos conseils d'application.`;

  const contentHtml = `
<h2>Pourquoi le choix d'un parfum est essentiel au Maroc</h2>
<p>Au Maroc, le parfum ne se contente pas d'être un accessoire de beauté ; il fait partie intégrante de notre art de vivre et de notre hospitalité légendaire. Avec les variations climatiques entre l'air marin de <strong>Casablanca</strong>, la chaleur ensoleillée de <strong>Marrakech</strong> ou la fraîcheur des soirées de <strong>Rabat</strong>, choisir une fragrance dotée d'une excellente tenue et d'un sillage raffiné est primordial.</p>

<div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 8px; margin: 24px 0;">
  <p style="margin: 0; color: #0369a1; font-weight: 600;">💡 Le Conseil NAY Parfums :</p>
  <p style="margin: 8px 0 0 0; color: #0c4a6e; font-size: 14px;">Pour maximiser la tenue de votre parfum toute la journée, appliquez-le immédiatement après la douche sur une peau bien hydratée, en insistant sur les points de pulsation : l'intérieur des poignets, le cou, et le creux des coudes.</p>
</div>

<h2>Notre Sélection Exclusive de Fragrances Incontournables</h2>
<p>Nos experts olfactifs ont sélectionné les jus les plus plébiscités pour leur équilibre parfait entre fraîcheur, puissance et sensualité :</p>

<ul>
  <li><strong>Les Sillages Boisés & Ambrés :</strong> Parfaits pour les soirées marocaines et les grandes occasions, combinant des notes nobles de cèdre de l'Atlas, d'oud raffiné et de vanille précieuse.</li>
  <li><strong>Les Accords Frais & Aquatiques :</strong> Idéals pour le quotidien sous le soleil marocain, apportant une sensation de propreté et d'énergie vivifiante du matin au soir.</li>
  <li><strong>Les Bouquets Floraux & Gourmands :</strong> Une féminité éclatante mêlant fleur d'oranger, jasmin sambac et touches délicates de fève tonka.</li>
</ul>

<h2>L'Avantage des Testeurs Authentiques 100ml chez NAY Parfums</h2>
<p>Pourquoi payer plus cher pour un packaging cartonné jetable ? Chez <strong>NAY Parfums</strong>, nous mettons à votre disposition des <em>testeurs originaux 100ml certifiés authentiques</em>. Il s'agit exactement du même jus précieux, de la même concentration et du même flacon que les éditions commerciales scellées, mais à un tarif avantageux et accessible.</p>

<h3>Comment reconnaître une fragrance de qualité supérieure ?</h3>
<p>Une véritable création de haute parfumerie évolue harmonieusement au fil des heures selon trois étapes clés :</p>
<ol>
  <li><strong>Les notes de tête :</strong> La première impression vive et scintillante (agrumes, bergamote, baies roses) qui s'exprime durant les 15 premières minutes.</li>
  <li><strong>Les notes de cœur :</strong> La véritable identité du parfum (épices, fleurs nobles) qui se déploie pendant 4 à 6 heures.</li>
  <li><strong>Les notes de fond :</strong> Le sillage persistant et mémorable (ambre, muscs blancs, bois précieux) qui reste sur la peau et les vêtements plus de 24 heures.</li>
</ol>

<h2>Commandez en Toute Sérénité avec la Livraison Partout au Maroc</h2>
<p>Tous nos flacons sont préparés avec un soin méticuleux et expédiés directement chez vous avec <strong>livraison express 24h à 48h</strong> sur Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir et toutes les villes du Royaume. Le paiement est disponible à la livraison pour une tranquillité totale.</p>
  `.trim();

  return {
    title,
    slug: cleanSlug,
    excerpt,
    content: contentHtml,
    metaTitle,
    metaDescription,
    category: category || "Guides",
    tags: ["parfum maroc", "parfum homme", "parfum femme", "longue tenue", "testeur original", "nay parfums"],
    ctaText: "Découvrir la Collection Complète",
    ctaLink: "/shop",
    suggestedKeywords: [targetKw, "parfum original maroc", "prix parfum maroc", "meilleur parfum longue tenue"],
    suggestedProductKeywords: matchedProducts.map(p => p.slug)
  };
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    // Allow either admin_token or admin_session for safety
    if (!cookieStore.has('admin_token') && !cookieStore.has('admin_session')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      topic = '', 
      category = 'Guides', 
      tone = 'Luxe & Raffiné', 
      focusKeyword = '', 
      targetAudience = 'Moroccan perfume lovers',
      language = 'fr' 
    } = body;

    // Fetch sample products from catalog to ground generation
    const products = await prisma.product.findMany({
      take: 12,
      select: { id: true, name: true, slug: true, brandId: true, brandLabel: true, price: true }
    });

    let generatedData: any = null;

    // Attempt Gemini Generation via @ai-sdk/google if API key exists
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
Tu es le rédacteur en chef et expert SEO N°1 pour NAY Parfums (https://nayparfum.ma), la boutique de référence de parfums de luxe et testeurs 100ml authentiques au Maroc.

Rédige un article de blog complet, riche, séduisant et parfaitement optimisé pour Google.ma et le public marocain.

PARAMÈTRES DE L'ARTICLE :
- Sujet / Titre demandé : "${topic}"
- Catégorie : ${category}
- Ton rédactionnel : ${tone} (Exclusif, élégant, chaleureux, expert)
- Mot-clé principal visé (SEO Maroc) : "${focusKeyword || topic}"
- Public cible : Passionnés de parfums au Maroc (Casablanca, Rabat, Marrakech, Tanger, etc.)
- Produits disponibles dans notre catalogue : ${products.map(p => `${p.name} (${p.brandLabel})`).join(', ')}

CONSIGNES DE RÉDACTION :
1. Titre : Accrocheur, avec fort taux de clic (CTR) sur Google, mentionnant le contexte luxe ou Maroc.
2. Contenu (HTML) : Structuré avec des <h2> accrocheurs, des <h3> détaillés, des listes à puces <ul><li>, du texte en gras <strong> pour les mots-clés, des conseils d'experts sur le sillage, la tenue, et les occasions au Maroc.
3. Insère un encadré d'astuce "Conseil NAY Parfums" bien mis en valeur.
4. Explique clairement l'avantage des testeurs originaux 100ml (qualité identique au flacon retail, prix avantageux, authenticité 100%).
5. Mentionne la livraison rapide 24/48h partout au Maroc et le paiement à la livraison.
6. Le méta titre doit faire entre 45 et 60 caractères.
7. La méta description doit faire entre 130 et 155 caractères avec appel à l'action.
8. Sélectionne 5 à 8 tags pertinents.
9. Propose un bouton d'action (CTA) avec texte et lien interne (/shop, /shop/men, /shop/women, etc.).
        `;

        const result = await generateObject({
          model: google('gemini-1.5-pro'),
          schema: BlogGenerationSchema,
          prompt,
        });

        if (result && result.object) {
          generatedData = result.object;
        }
      } catch (aiErr) {
        console.warn('Google AI generation fallback triggered:', aiErr);
      }
    }

    // Fallback if AI call failed or keys not set
    if (!generatedData) {
      generatedData = generateSmartMoroccanContent(topic, category, tone, focusKeyword, products);
    }

    // Match suggested products with catalog
    const matchedSlugs = products
      .filter(p => {
        const text = `${generatedData.title} ${generatedData.content}`.toLowerCase();
        return text.includes(p.name.toLowerCase()) || text.includes(p.brandLabel?.toLowerCase() || '');
      })
      .map(p => p.slug)
      .slice(0, 4);

    if (matchedSlugs.length === 0 && products.length > 0) {
      matchedSlugs.push(...products.slice(0, 3).map(p => p.slug));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...generatedData,
        matchedProductSlugs: matchedSlugs
      }
    });

  } catch (error: any) {
    console.error('Blog AI generator error:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la génération IA' }, { status: 500 });
  }
}
