import { NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { PRODUCTS } from '@/lib/products';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface GenerateLandingPageRequest {
  mode: 'catalog_product' | 'custom_product';
  selectedProductSlug?: string;
  customProduct?: {
    name: string;
    category: string;
    brand?: string;
    price: number;
    promoPrice?: number;
    imageUrl?: string;
    keyFeatures?: string;
    mainBenefit?: string;
    targetAudience?: string;
  };
  angle: 'LUXURY_GLAMOUR' | 'FLASH_PROMO' | 'GIFT_EXPERIENCE' | 'SKINCARE_TRANSFORMATION' | 'MOROCCAN_COD_DIRECT';
  tone?: string;
}

// Curated luxury backup images for cosmetic & perfume products
const LUXURY_PRESET_IMAGES: Record<string, string[]> = {
  cosmetics_serum: [
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=1200&h=800",
    "https://images.unsplash.com/photo-1608248597359-0095ef393f63?auto=format&fit=crop&q=80&w=1200&h=800",
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=1200&h=800"
  ],
  cosmetics_cream: [
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1200&h=800",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=1200&h=800"
  ],
  perfumes_luxury: [
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900",
    "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1600&h=900",
    "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=1600&h=900"
  ]
};

function generateSmartFallbackLandingPage(
  mode: 'catalog_product' | 'custom_product',
  productName: string,
  brandName: string,
  category: string,
  regularPrice: number,
  promoPrice: number,
  heroImage: string,
  angle: string,
  customDetails?: any
) {
  const isCosmetic = category.toLowerCase().includes("cosmétique") || 
                     category.toLowerCase().includes("soin") || 
                     category.toLowerCase().includes("crème") || 
                     category.toLowerCase().includes("sérum") || 
                     category.toLowerCase().includes("visage");

  const discountPercent = Math.round((1 - promoPrice / regularPrice) * 100);
  const slugBase = productName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const slug = `offre-${slugBase}`;

  // Tailored Copywriting by Category & Angle
  let headline = "";
  let subheadline = "";
  let badgeText = "⚡ OFFRE EXCLUSIVE MAROC · STOCK LIMITÉ";
  let story = "";

  if (isCosmetic) {
    if (angle === "SKINCARE_TRANSFORMATION") {
      headline = `Révélez une Peau Parfaite et Rajeunie dès 7 Jours avec ${productName}`;
      subheadline = `La formule d'exception adoptée par les femmes exigeantes au Maroc. Haute concentration d'actifs anti-âge, éclat immédiat et hydratation profonde. Paiement à la livraison après vérification de votre colis.`;
      badgeText = `✨ RÉSULTATS VISIBLES EN 7 JOURS · -${discountPercent}% AUJOURD'HUI`;
      story = `Formulé pour transformer visiblement le grain de peau, ${productName} combine la quintessence de la dermatologie moderne et des huiles précieuses. Sa texture soyeuse pénètre instantanément sans fini gras pour lisser les ridules, estomper les taches et redonner un éclat éclatant à votre visage. Conçu pour résister au climat marocain, il protège votre barrière cutanée tout au long de la journée.`;
    } else {
      headline = `L'Élixir de Beauté Ultime : ${productName} par ${brandName}`;
      subheadline = `Offrez à votre peau le luxe d'un soin professionnel haut de gamme. Teint radieux, fermeté retrouvée et douceur absolue. Profitez de notre tarif exclusif avec livraison express gratuite partout au Maroc.`;
      badgeText = `💎 FORMULE PRESTIGE · LIVRAISON 24H CASABLANCA & RABAT`;
      story = `Maison NAY a sélectionné les ingrédients les plus nobles pour créer ce soin d'exception. Dès la première application, ressentez une hydratation intense et un effet tenseur immédiat. Testé et approuvé par plus de 3 500 clientes à travers tout le Royaume.`;
    }
  } else {
    // Perfume copy
    if (angle === "FLASH_PROMO") {
      headline = `Vente Privée Exceptionnelle : ${productName} à Seulement ${promoPrice} DH`;
      subheadline = `Une opportunité rare d'acquérir ce chef-d'œuvre de la haute parfumerie avec une réduction de -${discountPercent}%. Flacon authentique scellé, sillage puissant et tenue garantie 24h.`;
      badgeText = `🔥 VENTE FLASH MAROC · PLUS QUE 9 FLACONS EN STOCK`;
      story = `Véritable signature olfactive de ${brandName}, ${productName} captive dès les premières notes. Un parfum intense, magnétique et raffiné qui ne laisse personne indifférent. Chez Maison NAY Parfums, nous garantissons l'authenticité absolue de chaque création avec vérification possible à la livraison avant tout paiement.`;
    } else if (angle === "GIFT_EXPERIENCE") {
      headline = `Le Cadeau Idéal Qui Marquera les Esprits : ${productName}`;
      subheadline = `Faites sensation avec ce parfum iconique de ${brandName}. Coffret de luxe soigné, gravure de prestige et ruban offert. Commandez en 1 clic et recevez-le chez vous à temps.`;
      badgeText = `🎁 PACK CADEAU PRESTIGE OFFERT · LIVRAISON EXPRESS MAROC`;
      story = `Que ce soit pour un anniversaire, une fête spéciale ou pour surprendre la personne qui compte le plus pour vous, ${productName} incarne le raffinement absolu. Présenté dans un emballage cadeau luxueux scellé, prêt à éblouir dès son ouverture.`;
    } else {
      headline = `L'Élégance Pure, Le Sillage Inoubliable : ${productName}`;
      subheadline = `Affirmez votre présence avec ce parfum prestigieux signé ${brandName}. Haute tenue 24 heures, projection remarquable et sillage envoûtant. Paiement cash à la livraison.`;
      badgeText = `⭐ COUP DE CŒUR NAY PARFUMS · AUTHENTIQUE 100% GARANTI`;
      story = `Créé pour celles et ceux qui exigent l'excellence, ${productName} déploie une pyramide olfactive magistrale qui évolue tout au long de la journée en laissant une empreinte magnétique inoubliable sur votre passage.`;
    }
  }

  // Features
  const features = isCosmetic ? [
    {
      icon: "Sparkles",
      title: "Actifs Hautement Concentrés",
      description: "Formule enrichie en agents dermatologiques de pointe pour une régénération cellulaire rapide."
    },
    {
      icon: "ShieldCheck",
      title: "Tolérance Cutanée Certifiée",
      description: "Convient à tous types de peaux, même les plus sensibles. Sans parabène, hypoallergénique."
    },
    {
      icon: "Clock",
      title: "Effet Rajeunissant Visible",
      description: "Résultats cliniquement observés dès 7 jours d'utilisation quotidienne matin et soir."
    },
    {
      icon: "Truck",
      title: "Paiement à la Livraison",
      description: "Commandez en toute sérénité, vérifiez le colis en main propre avant de régler le livreur."
    }
  ] : [
    {
      icon: "ShieldCheck",
      title: "100% Authentique & Scellé",
      description: "Flacon original scellé sous blister avec code batch et traçabilité européenne vérifiable."
    },
    {
      icon: "Clock",
      title: "Tenue Extrême 24H",
      description: "Concentration élevée en huiles parfumées précieuses assurant un sillage durable toute la journée."
    },
    {
      icon: "Truck",
      title: "Livraison Rapide 24/48H",
      description: "Livraison express le jour même ou 24h à Casablanca/Rabat, 48h partout ailleurs au Maroc."
    },
    {
      icon: "CheckCircle2",
      title: "Paiement Cash Sécurisé",
      description: "Ne payez rien à l'avance. Vous ne réglez qu'à la réception de votre colis chez vous."
    }
  ];

  // Bundles (Solo, Duo, Trio)
  const duoPrice = Math.round(promoPrice * 1.75); // ~15-20% extra discount on 2nd
  const trioPrice = Math.round(promoPrice * 2.3); // "Buy 2 get 1 free" equivalent
  const bundles = [
    {
      id: "1",
      title: `1x ${productName}`,
      subtitle: "Offre Découverte Individuelle",
      qty: 1,
      price: promoPrice,
      originalPrice: regularPrice,
      badge: `-${discountPercent}% de réduction`,
      isPopular: false
    },
    {
      id: "2",
      title: `Pack Duo (2x ${productName})`,
      subtitle: "Le Choix Préféré de nos Clients",
      qty: 2,
      price: duoPrice,
      originalPrice: regularPrice * 2,
      badge: "🔥 MEILLEUR CHOIX · Livraison Gratuite",
      isPopular: true
    },
    {
      id: "3",
      title: `Pack VIP (3x ${productName})`,
      subtitle: "Offre Famille & Cadeaux",
      qty: 3,
      price: trioPrice,
      originalPrice: regularPrice * 3,
      badge: "👑 SUPER ÉCONOMIE · 1 Flacon Offert",
      isPopular: false
    }
  ];

  // Moroccan Reviews
  const reviews = isCosmetic ? [
    {
      name: "Salma El Amrani",
      city: "Casablanca",
      rating: 5,
      date: "Il y a 3 jours",
      comment: "J'avais des doutes au départ, mais ce produit est juste incroyable ! Après 1 semaine seulement, ma peau est beaucoup plus lumineuse et les petites ridules autour des yeux se sont estompées. Livré en 24h à Maarif. Merci NAY !"
    },
    {
      name: "Dr. Meriem Bennani",
      city: "Rabat - Agdal",
      rating: 5,
      date: "Il y a 5 jours",
      comment: "Texture très soyeuse, pénétration ultra rapide sans brillance. Ma peau reste hydratée toute la journée. Très heureuse de voir ce niveau de qualité au Maroc avec le paiement à la livraison."
    },
    {
      name: "Kenza Tazi",
      city: "Marrakech",
      rating: 5,
      date: "Il y a 1 semaine",
      comment: "J'ai commandé le Pack Duo avec ma sœur. Colis super soigné, livreur ponctuel et très poli. Le produit a une odeur délicate très luxueuse et laisse la peau de bébé. 10/10 !"
    }
  ] : [
    {
      name: "Youssef El Mansouri",
      city: "Casablanca",
      rating: 5,
      date: "Il y a 2 jours",
      comment: "Reçu en moins de 24h à Sidi Maarouf. Le flacon est 100% original, le code batch correspond parfaitement. Le sillage est incroyable, j'ai reçu des compliments toute la journée au bureau !"
    },
    {
      name: "Fatima-Zahra Alaoui",
      city: "Rabat",
      rating: 5,
      date: "Il y a 4 jours",
      comment: "Commandé pour l'anniversaire de mon mari. Emballage très luxueux et soigné. Le fait de pouvoir vérifier le produit avant de payer m'a totalement rassurée. Une boutique sérieuse que je recommande vivement."
    },
    {
      name: "Amine Benjelloun",
      city: "Tanger",
      rating: 5,
      date: "Il y a 1 semaine",
      comment: "Le parfum tient facilement 24h sur les vêtements. Prix nettement plus intéressant que dans les galeries commerciales pour la même qualité authentique. Bravo à l'équipe NAY !"
    }
  ];

  // Moroccan FAQs
  const faqs = [
    {
      q: "Comment s'effectue le paiement de ma commande ?",
      a: "Le paiement s'effectue en espèces (Cash on Delivery) directement au livreur lorsque vous recevez votre colis à votre domicile ou bureau. Vous ne payez rien en ligne."
    },
    {
      q: "Puis-je ouvrir et vérifier le colis avant de payer ?",
      a: "Oui, tout à fait ! Chez Maison NAY, la transparence est notre priorité. Vous avez le droit d'ouvrir le carton et d'inspecter l'état de votre produit en présence du livreur avant de régler votre achat."
    },
    {
      q: "Quels sont les délais de livraison au Maroc ?",
      a: "Nous livrons sous 24h pour Casablanca, Rabat et les villes voisines. Pour le reste du Maroc (Marrakech, Tanger, Fès, Agadir, Oujda, Meknès...), la livraison prend entre 24h et 48h maximum."
    },
    {
      q: "Les produits sont-ils 100% authentiques ?",
      a: `Absolument. Tous nos ${isCosmetic ? 'soins cosmétiques' : 'parfums'} proviennent des circuits de distribution officiels européens. Chaque pièce possède son code de traçabilité et arrive scellée dans son emballage d'origine.`
    },
    {
      q: "Comment vous contacter en cas de question ?",
      a: "Notre service client marocain est disponible 7j/7 directement sur WhatsApp au +212 663-380011 ou par email à contact@nayparfum.ma."
    }
  ];

  return {
    slug,
    title: headline,
    subtitle: subheadline,
    badgeText,
    heroImage,
    story,
    features,
    bundles,
    reviews,
    faqs,
    urgencyText: "🔥 Offre spéciale limitée aux 25 premières commandes d'aujourd'hui !",
    whatsappNumber: "+212663380011",
    theme: isCosmetic ? "beauty-rose" : "luxury-gold",
    viewersCount: Math.floor(Math.random() * 15) + 12
  };
}

export async function POST(req: Request) {
  try {
    const body: GenerateLandingPageRequest = await req.json();
    const { mode, selectedProductSlug, customProduct, angle } = body;

    let productName = "";
    let brandName = "Maison NAY";
    let category = "Parfum de Luxe";
    let regularPrice = 850;
    let promoPrice = 490;
    let heroImage = LUXURY_PRESET_IMAGES.perfumes_luxury[0];
    let customDetails = null;

    if (mode === 'catalog_product' && selectedProductSlug) {
      // Find in PRODUCTS static or in DB
      const catalogItem = PRODUCTS.find(p => p.slug === selectedProductSlug);
      if (catalogItem) {
        productName = catalogItem.name;
        brandName = catalogItem.brandLabel || "Maison NAY";
        category = catalogItem.subcategoryLabel || "Parfum";
        regularPrice = catalogItem.originalPrice || Math.round(catalogItem.price * 1.35);
        promoPrice = catalogItem.price;
        heroImage = catalogItem.images[0] || LUXURY_PRESET_IMAGES.perfumes_luxury[0];
      } else {
        // Look up in database
        const dbProduct = await prisma.product.findUnique({ where: { slug: selectedProductSlug } });
        if (dbProduct) {
          productName = dbProduct.name;
          brandName = dbProduct.brandLabel;
          category = dbProduct.subcategoryLabel;
          regularPrice = dbProduct.originalPrice || Math.round(dbProduct.price * 1.35);
          promoPrice = dbProduct.price;
          try {
            const parsedImgs = JSON.parse(dbProduct.images);
            heroImage = Array.isArray(parsedImgs) && parsedImgs.length > 0 ? parsedImgs[0] : LUXURY_PRESET_IMAGES.perfumes_luxury[0];
          } catch {
            heroImage = LUXURY_PRESET_IMAGES.perfumes_luxury[0];
          }
        }
      }
    } else if (mode === 'custom_product' && customProduct) {
      productName = customProduct.name || "Sérum Éclat Suprême";
      brandName = customProduct.brand || "Maison NAY Cosmétiques";
      category = customProduct.category || "Cosmétique & Soin du Visage";
      regularPrice = Number(customProduct.price) || 650;
      promoPrice = Number(customProduct.promoPrice) || Math.round(regularPrice * 0.7);
      
      const isCosmetic = category.toLowerCase().includes("cosmétique") || 
                         category.toLowerCase().includes("soin") || 
                         category.toLowerCase().includes("crème") || 
                         category.toLowerCase().includes("sérum");

      heroImage = customProduct.imageUrl && customProduct.imageUrl.startsWith("http")
        ? customProduct.imageUrl
        : (isCosmetic ? LUXURY_PRESET_IMAGES.cosmetics_serum[0] : LUXURY_PRESET_IMAGES.perfumes_luxury[1]);

      customDetails = customProduct;
    }

    if (!productName) {
      productName = "Édition Spéciale Haute Parfumerie";
    }

    // Try AI generation with Gemini
    const rawKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    const cleanedKey = rawKey ? rawKey.replace(/['"]/g, "").trim() : "";
    const hasValidKey = cleanedKey && cleanedKey.length > 10;

    if (hasValidKey) {
      try {
        const google = createGoogleGenerativeAI({ apiKey: cleanedKey });
        const isCosmetic = category.toLowerCase().includes("cosmétique") || 
                           category.toLowerCase().includes("soin") || 
                           category.toLowerCase().includes("crème") || 
                           category.toLowerCase().includes("sérum");

        const systemPrompt = `Tu es le Directeur Marketing Digital & Copywriter Expert n°1 en E-Commerce au Maroc pour "Maison NAY" (boutique marocaine de haute parfumerie et cosmétiques de luxe).
Tu maîtrises parfaitement la psychologie du consommateur marocain (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir...) :
1. Le paiement à la livraison (Cash on Delivery - COD) et la possibilité de vérifier le colis en main propre sont indispensables pour lever les doutes sur l'authenticité.
2. La livraison rapide en 24h-48h est un argument d'achat décisif.
3. Les offres groupées (Pack Solo, Pack Duo le plus vendu avec réduction, Pack Trio avec 1 offert) maximisent le panier moyen.
4. Les avis clients doivent comporter de vrais prénoms marocains et des villes marocaines précises.
5. Tu dois rédiger un texte percutant, élégant, hypnotisant et orienté conversion publicitaire (Meta Ads & TikTok Ads).
6. Tu dois TOUJOURS répondre en format JSON STRICT valide sans markdown entourant, avec la structure demandée.`;

        const userPrompt = `Génère une Landing Page à très haute conversion pour :
Produit : "${productName}"
Marque : "${brandName}"
Catégorie : "${category}"
Prix normal : ${regularPrice} DH
Prix promo : ${promoPrice} DH
Angle publicitaire : ${angle}
Détails supplémentaires : ${JSON.stringify(customDetails || {})}

Réponds STRICTEMENT avec cet objet JSON :
{
  "slug": "url-slug-en-kebab-case",
  "title": "Titre principal accrocheur (H1) orienté bénéfice et désir",
  "subtitle": "Sous-titre explicatif et rassurant (H2) avec mention livraison express Maroc",
  "badgeText": "Texte du badge supérieur (ex: ⚡ OFFRE SPÉCIALE MAROC · -40% AUJOURD'HUI)",
  "story": "Paragraphe de storytelling sensoriel ou de transformation (80 à 120 mots)",
  "features": [
    { "icon": "Sparkles", "title": "Bénéfice 1", "description": "Explication détaillée" },
    { "icon": "ShieldCheck", "title": "Bénéfice 2", "description": "Explication détaillée" },
    { "icon": "Clock", "title": "Bénéfice 3", "description": "Explication détaillée" },
    { "icon": "Truck", "title": "Bénéfice 4", "description": "Explication détaillée" }
  ],
  "bundles": [
    { "id": "1", "title": "1 Flacon (Découverte)", "subtitle": "Format solo", "qty": 1, "price": ${promoPrice}, "originalPrice": ${regularPrice}, "badge": "Offre standard", "isPopular": false },
    { "id": "2", "title": "Pack Duo (2 Flacons)", "subtitle": "Le plus commandé", "qty": 2, "price": ${Math.round(promoPrice * 1.75)}, "originalPrice": ${regularPrice * 2}, "badge": "🔥 RECOMMANDÉ · Livraison Gratuite", "isPopular": true },
    { "id": "3", "title": "Pack VIP (3 Flacons)", "subtitle": "Meilleur tarif", "qty": 3, "price": ${Math.round(promoPrice * 2.3)}, "originalPrice": ${regularPrice * 3}, "badge": "👑 1 FLACON OFFERT", "isPopular": false }
  ],
  "reviews": [
    { "name": "Prénom et Nom marocain", "city": "Casablanca", "rating": 5, "date": "Il y a 2 jours", "comment": "Témoignage authentique avec détails sur l'odeur/texture et la livraison rapide..." },
    { "name": "Prénom et Nom marocain", "city": "Rabat", "rating": 5, "date": "Il y a 4 jours", "comment": "Témoignage..." },
    { "name": "Prénom et Nom marocain", "city": "Marrakech", "rating": 5, "date": "Il y a 1 semaine", "comment": "Témoignage..." }
  ],
  "faqs": [
    { "q": "Comment se passe le paiement ?", "a": "Paiement en espèces à la livraison..." },
    { "q": "Puis-je vérifier le colis avant de payer ?", "a": "Oui, tout à fait..." },
    { "q": "Quels sont les délais de livraison au Maroc ?", "a": "24h à 48h maximum..." },
    { "q": "Est-ce authentique ?", "a": "100% garanti avec traçabilité..." }
  ],
  "urgencyText": "Texte d'urgence avec compte à rebours et rareté",
  "whatsappNumber": "+212663380011"
}`;

        const { text } = await generateText({
          model: google('gemini-2.5-flash') as any,
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.7,
        });

        // Clean JSON response
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanText);

        return NextResponse.json({
          success: true,
          source: 'AI_GEMINI',
          data: {
            ...parsed,
            heroImage,
            theme: isCosmetic ? 'beauty-rose' : 'luxury-gold',
            viewersCount: Math.floor(Math.random() * 15) + 12,
            productInfo: {
              name: productName,
              brand: brandName,
              category,
              regularPrice,
              promoPrice,
              mode,
              slug: selectedProductSlug || parsed.slug
            }
          }
        });
      } catch (aiError) {
        console.warn('Gemini Generation failed, switching to expert Moroccan fallback:', aiError);
      }
    }

    // High quality instant fallback if AI key is unavailable or returned invalid JSON
    const fallbackData = generateSmartFallbackLandingPage(
      mode,
      productName,
      brandName,
      category,
      regularPrice,
      promoPrice,
      heroImage,
      angle,
      customDetails
    );

    return NextResponse.json({
      success: true,
      source: 'EXPERT_FALLBACK',
      data: {
        ...fallbackData,
        productInfo: {
          name: productName,
          brand: brandName,
          category,
          regularPrice,
          promoPrice,
          mode,
          slug: selectedProductSlug || fallbackData.slug
        }
      }
    });

  } catch (error: any) {
    console.error('Error generating landing page with AI:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la génération de la landing page' },
      { status: 500 }
    );
  }
}
