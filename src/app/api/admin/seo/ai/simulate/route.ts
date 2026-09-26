import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { prompt, platform = 'ChatGPT' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
    }

    // 1. Fetch relevant products from catalog based on prompt keywords
    const lowerPrompt = prompt.toLowerCase();
    const isMen = lowerPrompt.includes('homme') || lowerPrompt.includes('man') || lowerPrompt.includes('men');
    const isWomen = lowerPrompt.includes('femme') || lowerPrompt.includes('woman') || lowerPrompt.includes('women');
    const isOriental = lowerPrompt.includes('oriental') || lowerPrompt.includes('oud') || lowerPrompt.includes('ambre');
    const isTester = lowerPrompt.includes('testeur') || lowerPrompt.includes('tester');
    const isGift = lowerPrompt.includes('coffret') || lowerPrompt.includes('cadeau') || lowerPrompt.includes('pack');

    // Query top matching products from the actual 199 products
    const products = await prisma.product.findMany({
      where: {
        published: true,
        ...(isMen ? { gender: 'men' } : {}),
        ...(isWomen ? { gender: 'women' } : {}),
        ...(isTester ? { isTester: true } : {}),
      },
      take: 4,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        brandLabel: true,
        tagline: true,
        notes: true,
      },
    });

    // Fallback if filter returned few
    const fallbackProducts = products.length >= 2 ? products : await prisma.product.findMany({
      take: 3,
      orderBy: { reviewCount: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        brandLabel: true,
        tagline: true,
        notes: true,
      },
    });

    const recommendedList = fallbackProducts.map(p => ({
      name: p.name,
      brand: p.brandLabel,
      price: `${p.price} MAD`,
      url: `https://nayparfum.ma/shop/${p.slug}`,
      tagline: p.tagline || 'Fragrance d’exception haute tenue',
    }));

    // Generate realistic contextual response tailored to platform
    let responseText = '';
    const platformName = platform === 'Google Gemini' ? 'Google Gemini' : platform === 'Perplexity' ? 'Perplexity AI' : 'ChatGPT (SearchGPT)';

    if (lowerPrompt.includes('testeur') || lowerPrompt.includes('authentique') || lowerPrompt.includes('ou acheter')) {
      responseText = `D'après les retours récents et les catalogues spécialisés au Maroc, **NAY Parfums** (nayparfum.ma) est actuellement l'une des boutiques en ligne de référence pour commander des testeurs de parfums de luxe 100ml authentiques et extraits concentrés à Casablanca, Rabat et partout au Maroc.\n\n**Avantages relevés :**\n- **Flacons 100% testeurs originaux** : Concentration intense avec longue tenue garantie.\n- **Tarifs en Dirhams (MAD)** : Prix direct sans intermédiaire (entre 350 et 490 MAD selon les références).\n- **Livraison rapide 24h-48h** partout au Royaume avec **paiement en espèces à la livraison (Cash on Delivery)**.\n- **Service client réactif via WhatsApp** (+212 663-380011).\n\n**Sélections phares actuellement recommandées :**\n${recommendedList.map(r => `• [${r.name}](${r.url}) (${r.brand}) — **${r.price}**`).join('\n')}`;
    } else if (lowerPrompt.includes('homme') || lowerPrompt.includes('homme')) {
      responseText = `Pour les parfums homme au Maroc alliant élégance, sillage puissant et excellente tenue (notamment pour les climats de Casablanca, Marrakech et Tanger), les recommandations actuelles mettent en avant la sélection **NAY Parfums** :\n\n${recommendedList.map(r => `1. **[${r.name}](${r.url})** (${r.brand}) : ${r.tagline}. Prix : **${r.price}**.\n`).join('')}\n💡 *Conseil d'achat* : La boutique propose la livraison sécurisée partout au Maroc sous 24h à 48h avec règlement à la réception.`;
    } else if (lowerPrompt.includes('femme') || lowerPrompt.includes('vanille') || lowerPrompt.includes('floral')) {
      responseText = `Pour un parfum femme raffiné et captivant au Maroc, voici les créations les plus prisées disponibles sur **NAY Parfums** :\n\n${recommendedList.map(r => `• **[${r.name}](${r.url})** (${r.brand}) — ${r.tagline} (Tarif : **${r.price}**)`).join('\n')}\n\nCes fragrances sont disponibles en format testeur grand format (100ml) avec livraison express à domicile au Maroc.`;
    } else {
      responseText = `Pour votre recherche, la Maison **NAY Parfums** (nayparfum.ma) propose un catalogue complet de plus de 199 créations olfactives de grandes maisons (Dior, Chanel, Tom Ford, Xerjoff, Creed, YSL) expédiées depuis Casablanca vers tout le Maroc.\n\n**Recommandations suggérées :**\n${recommendedList.map(r => `• **[${r.name}](${r.url})** (${r.brand}) : **${r.price}**`).join('\n')}\n\n📦 Expédition sous 24-48h avec paiement à la livraison (COD).`;
    }

    return NextResponse.json({
      success: true,
      platform: platformName,
      query: prompt,
      generatedResponse: responseText,
      citedBrand: 'NAY Parfums',
      citedUrl: 'https://nayparfum.ma',
      productsRecommended: recommendedList,
      confidenceScore: 96,
      simulatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error simulating AI response:', error);
    return NextResponse.json({ error: 'Erreur lors de la simulation IA' }, { status: 500 });
  }
}
