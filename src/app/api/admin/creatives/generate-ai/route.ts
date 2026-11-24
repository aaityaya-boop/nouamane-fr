import { NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';
import { PRODUCTS } from '@/lib/products';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type CreativeAngle = 'HOOK_CHOC' | 'LUXURY_STORY' | 'TESTER_VS_BOUTIQUE' | 'OFFRE_DUO' | 'COD_MAROC';

interface GenerateCreativeBody {
  productSlug?: string;
  customProductName?: string;
  platform: 'META' | 'TIKTOK' | 'SNAPCHAT' | 'GOOGLE' | 'INFLUENCE';
  aspectRatio: '9:16' | '4:5' | '1:1';
  angle: CreativeAngle;
  category: string;
}

function buildFallbackCreative(params: {
  productName: string;
  brand: string;
  price: number;
  originalPrice: number;
  platform: string;
  angle: CreativeAngle;
  category: string;
}) {
  const { productName, brand, price, originalPrice, platform, angle } = params;
  const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 25;

  const angleMap: Record<
    CreativeAngle,
    {
      hooks: string[];
      badge: string;
      posterHeadline: string;
      posterSubline: string;
      adCopy: string;
    }
  > = {
    HOOK_CHOC: {
      hooks: [
        `Arrêtez de payer ${originalPrice} DH en boutique pour ${productName}...`,
        `3 secondes pour comprendre pourquoi tout Casablanca parle de ${productName}`,
        `Le secret des parfums qui tiennent vraiment 24h au Maroc`,
      ],
      badge: `🔥 HOOK VIRAL • -${discount}%`,
      posterHeadline: `${productName}`,
      posterSubline: `Tenue 24h • Authentique & Scellé (${brand})`,
      adCopy: `🛑 Ne payez plus le double pour sentir bon toute la journée.\n\nDécouvrez ${productName} (${brand}) chez Maison NAY : sillage magnétique, flacon scellé et vérification du colis devant le livreur avant de payer.\n\n⚡ Offre limitée à ${price} DH (au lieu de ${originalPrice} DH)\n🚚 Livraison 24h Casablanca/Rabat • 48h partout au Maroc`,
    },
    LUXURY_STORY: {
      hooks: [
        `Ce parfum laisse une trace inoubliable dès que vous entrez dans une pièce.`,
        `Pourquoi ${productName} est le flacon le plus complimenté de notre collection.`,
        `Un parfum signature qui change votre aura en un seul pschitt.`,
      ],
      badge: `✨ HAUTE PARFUMERIE`,
      posterHeadline: `${productName}`,
      posterSubline: `Sillage d’Exception • Maison NAY Parfums`,
      adCopy: `✨ L'élégance pure en flacon.\n\n${productName} signé ${brand} dévoile des notes profondes qui tiennent du matin jusqu'au soir.\n\n✔ 100% Authentique & Traçable\n✔ Paiement Cash à la Livraison après vérification\n👉 Commandez maintenant à ${price} DH`,
    },
    TESTER_VS_BOUTIQUE: {
      hooks: [
        `Testeur authentique vs Flacon boutique : voici la vraie différence.`,
        `Comment s’offrir ${productName} au meilleur prix au Maroc sans sacrifier l’authenticité ?`,
        `Même jus, même tenue 24h, prix direct importateur Maison NAY.`,
      ],
      badge: `💎 TESTEUR CERTIFIÉ • -${discount}%`,
      posterHeadline: `${productName}`,
      posterSubline: `Qualité Boutique • Tarif Importateur`,
      adCopy: `💡 Pourquoi payer le packaging quand vous voulez le parfum ?\n\nNotre ${productName} vous garantit exactement la même concentration, la même tenue 24h et le droit d’ouvrir le colis à la réception.\n\n🏷️ Tarif exclusif : ${price} DH\n📦 Stock limité sur Casablanca, Rabat & Marrakech`,
    },
    OFFRE_DUO: {
      hooks: [
        `Prenez 2 parfums aujourd’hui, économisez jusqu’à 35% + livraison offerte.`,
        `Le Pack Duo préféré des couples au Maroc cette semaine.`,
        `Offrez-vous ${productName} + 1 deuxième flacon à prix cassé.`,
      ],
      badge: `🎁 PACK DUO VIP`,
      posterHeadline: `Pack Duo ${productName}`,
      posterSubline: `Livraison Express Offerte • Quantités Limitées`,
      adCopy: `🎁 Doublez le plaisir avec notre Offre Duo sur ${productName} !\n\nCommandez 2 flacons (ou mixez avec un autre parfum NAY) et profitez d’une remise immédiate + livraison express offerte partout au Maroc.\n\n💵 Paiement à la livraison après vérification.`,
    },
    COD_MAROC: {
      hooks: [
        `Ouvrez votre colis, vérifiez le flacon, puis payez seulement si vous êtes 100% satisfait.`,
        `Livraison en 24h chez vous au Maroc sans carte bancaire.`,
        `Pourquoi 3 500+ clients au Maroc commandent leurs parfums chez NAY.`,
      ],
      badge: `🚚 PAIEMENT À LA LIVRAISON`,
      posterHeadline: `${productName}`,
      posterSubline: `Vérification Colis Avant Paiement • Maroc`,
      adCopy: `🇲🇦 Commandez en toute confiance sans carte bancaire !\n\nAvec Maison NAY :\n1️⃣ Commandez ${productName} en 30 secondes\n2️⃣ Recevez votre colis sous 24h/48h\n3️⃣ Vérifiez votre flacon avant de régler le livreur (${price} DH).\n\nCliquez sur "Commander" pour réserver le vôtre.`,
    },
  };

  const chosen = angleMap[angle] || angleMap.HOOK_CHOC;

  return {
    title: `${platform} • ${productName} (${angle.replace(/_/g, ' ')})`,
    hooks: chosen.hooks,
    storyboard: [
      { time: '0–3s', scene: 'Hook Visuel & Texte Choc', action: `Gros plan net sur le flacon ${productName} avec spray au ralenti. Texte écran : "${chosen.hooks[0]}"` },
      { time: '3–10s', scene: 'Démonstration & Détails Luxe', action: 'Montrer le bouchon, l’étiquette, le batch code et l’emballage Maison NAY scellé.' },
      { time: '10–18s', scene: 'Preuve Sociale & Tenue 24h', action: 'Expliquer le sillage longue tenue + captures d’avis clients à Casablanca / Rabat.' },
      { time: '18–25s', scene: 'CTA Express COD Maroc', action: `Annoncer le prix promo ${price} DH + vérification du colis à la livraison + lien boutique.` },
    ],
    poster: {
      topBadge: chosen.badge,
      headline: chosen.posterHeadline,
      subline: chosen.posterSubline,
      priceText: `${price} MAD`,
      comparePriceText: `${originalPrice} MAD`,
      ctaText: 'COMMANDER • LIVRAISON 24H',
    },
    adCopy: chosen.adCopy,
    tags: `${brand}, ${platform}, COD Maroc, ${angle}`,
  };
}

export async function POST(req: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(req, [
      'marketing.view',
      'marketing.manage_creatives',
      'marketing.manage_campaigns',
    ]);
    if (errorResponse) return errorResponse;

    const body: GenerateCreativeBody = await req.json();
    const platform = body.platform || 'META';
    const aspectRatio = body.aspectRatio || '9:16';
    const angle: CreativeAngle = body.angle || 'HOOK_CHOC';
    const category = body.category || 'UGC';

    let productName = (body.customProductName || '').trim() || 'Parfum Signature NAY';
    let brand = 'Maison NAY';
    let price = 399;
    let originalPrice = 599;
    let imageUrl =
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=85&w=1080';

    if (body.productSlug) {
      const staticProd = PRODUCTS.find((p) => p.slug === body.productSlug);
      if (staticProd) {
        productName = staticProd.name;
        brand = staticProd.brandLabel || 'Maison NAY';
        price = staticProd.price;
        originalPrice = staticProd.originalPrice || Math.round(staticProd.price * 1.35);
        if (staticProd.images?.[0]) imageUrl = staticProd.images[0];
      } else {
        const dbProd = await prisma.product.findUnique({ where: { slug: body.productSlug } });
        if (dbProd) {
          productName = dbProd.name;
          brand = dbProd.brandLabel;
          price = dbProd.price;
          originalPrice = dbProd.originalPrice || Math.round(dbProd.price * 1.35);
          try {
            const imgs = JSON.parse(dbProd.images);
            if (Array.isArray(imgs) && imgs[0]) imageUrl = imgs[0];
          } catch {
            // keep fallback image
          }
        }
      }
    }

    const rawKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    const cleanedKey = rawKey ? rawKey.replace(/['"]/g, '').trim() : '';

    if (cleanedKey && cleanedKey.length > 10) {
      try {
        const google = createGoogleGenerativeAI({ apiKey: cleanedKey });
        const prompt = `Génère un pack créatif publicitaire ultra-performant pour ${platform} (format ${aspectRatio}, catégorie ${category}, angle ${angle}) au Maroc (paiement à la livraison COD, prix ${price} MAD, prix barré ${originalPrice} MAD) pour le produit "${productName}" de "${brand}".
Réponds STRICTEMENT en JSON valide sans markdown :
{
  "title": "Titre court du créatif pour la bibliothèque",
  "hooks": ["Hook 3s #1", "Hook 3s #2", "Hook 3s #3"],
  "storyboard": [
    { "time": "0-3s", "scene": "Titre scène", "action": "Action précise filmée" },
    { "time": "3-10s", "scene": "Titre scène", "action": "Action précise" },
    { "time": "10-18s", "scene": "Titre scène", "action": "Action précise" },
    { "time": "18-25s", "scene": "Titre scène", "action": "CTA COD Maroc" }
  ],
  "poster": {
    "topBadge": "Badge court 3-4 mots max",
    "headline": "Titre choc court pour l'affiche (max 4 mots)",
    "subline": "Sous-titre bénéfice court (max 7 mots)",
    "priceText": "${price} MAD",
    "comparePriceText": "${originalPrice} MAD",
    "ctaText": "Bouton court (ex: COMMANDER • LIVRAISON 24H)"
  },
  "adCopy": "Texte principal complet avec sauts de ligne et emojis pour Meta/TikTok Ads",
  "tags": "tag1, tag2, tag3"
}`;

        const { text } = await generateText({
          model: google('gemini-2.5-flash') as never,
          system:
            'Tu es le Directeur Créatif Performance #1 pour les marques de parfums de luxe e-commerce COD au Maroc (Casablanca, Rabat, Marrakech). Réponds uniquement en JSON pur.',
          prompt,
          temperature: 0.75,
        });

        const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
        return NextResponse.json({
          success: true,
          source: 'AI_GEMINI',
          product: { productName, brand, price, originalPrice, imageUrl },
          creative: parsed,
        });
      } catch (err) {
        console.warn('Gemini creative generation fallback:', err);
      }
    }

    const fallback = buildFallbackCreative({
      productName,
      brand,
      price,
      originalPrice,
      platform,
      angle,
      category,
    });

    return NextResponse.json({
      success: true,
      source: 'SMART_STUDIO',
      product: { productName, brand, price, originalPrice, imageUrl },
      creative: fallback,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur génération créatif';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
