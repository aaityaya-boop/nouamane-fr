import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { detectCustomerIntent, extractOlfactoryNotes } from '@/lib/advisor/advisorAnalytics';

function generateSmartFallbackResponse(userText: string, products: any[], detectedNotes: string[], detectedGender?: string): { reply: string; slugs: string[] } {
  const lower = userText.toLowerCase();

  // Score products based on relevance to userText and notes
  const scoredProducts = products.map((p: any) => {
    let score = 0;
    const pName = (p.name || '').toLowerCase();
    const pBrand = (p.brandLabel || '').toLowerCase();
    const pDesc = (p.description || '').toLowerCase();
    const pTagline = (p.tagline || '').toLowerCase();
    const pNotes = typeof p.notes === 'string' ? p.notes.toLowerCase() : JSON.stringify(p.notes || {}).toLowerCase();
    const pGender = (p.gender || '').toUpperCase();

    // Gender matching
    if (detectedGender && pGender.includes(detectedGender)) {
      score += 5;
    }

    // Olfactory notes matching
    detectedNotes.forEach((n: string) => {
      if (pNotes.includes(n.toLowerCase()) || pDesc.includes(n.toLowerCase()) || pTagline.includes(n.toLowerCase())) {
        score += 8;
      }
    });

    // Keyword matching
    const words = lower.split(/\s+/).filter(w => w.length > 3);
    words.forEach(w => {
      if (pName.includes(w)) score += 10;
      if (pBrand.includes(w)) score += 7;
      if (pNotes.includes(w)) score += 6;
      if (pDesc.includes(w)) score += 3;
    });

    return { product: p, score };
  });

  scoredProducts.sort((a, b) => b.score - a.score);
  const selected = scoredProducts.slice(0, 3).map(s => s.product);
  const slugs = selected.map(p => p.slug);

  let intro = "Bonjour et bienvenue chez **NAY Parfums**. ";
  if (lower.includes('cadeau') || lower.includes('offrir')) {
    intro += "Pour un cadeau d'exception qui marquera les esprits, voici nos plus belles sélections :";
  } else if (lower.includes('tenue') || lower.includes('sillage') || lower.includes('puissant')) {
    intro += "Si vous recherchez un sillage remarquable et une tenue irréprochable tout au long de la journée, je vous recommande vivement ces fragrances concentrées :";
  } else if (detectedNotes.length > 0) {
    intro += `Pour satisfaire votre goût pour les notes de **${detectedNotes.join(', ')}**, voici les créations idéales de notre catalogue :`;
  } else if (detectedGender === 'HOMME') {
    intro += "Voici nos fragrances masculines les plus élégantes et prisées :";
  } else if (detectedGender === 'FEMME') {
    intro += "Voici nos créations féminines les plus envoûtantes et raffinées :";
  } else {
    intro += "Voici nos suggestions personnalisées parmi nos plus grands chefs-d'œuvre de la parfumerie :";
  }

  const recommendationsText = selected.map(p => {
    return `\n\n• **[${p.name}](/fr/product/${p.slug})**\n  *${p.brandLabel}* — **${p.price} DH**\n  ${p.tagline || p.subcategoryLabel || 'Extrait de parfum haute tenue'}`;
  }).join('');

  const outro = "\n\nN'hésitez pas si vous souhaitez plus de détails sur les notes de tête ou des conseils d'application !";

  return {
    reply: `${intro}${recommendationsText}${outro}`,
    slugs
  };
}

export async function POST(req: Request) {
  try {
    const rawKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const body = await req.json();
    const { messages, conversationId, sessionId } = body;

    // Find the latest user message in the conversation
    const userMessages = (messages || []).filter((m: any) => m.role === 'user');
    const latestUserMessage = userMessages[userMessages.length - 1];
    const latestText = latestUserMessage?.content || '';

    // Detect user intent and olfactory preferences
    const detectedIntent = detectCustomerIntent(latestText);
    const detectedNotes = extractOlfactoryNotes(latestText);
    const detectedGender = latestText.toLowerCase().includes('homme') 
      ? 'HOMME' 
      : (latestText.toLowerCase().includes('femme') ? 'FEMME' : undefined);

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
          content: latestText
        }
      });
    }

    // Fetch product catalog for context
    const products = await prisma.product.findMany({
      where: { published: true },
      select: {
        name: true,
        slug: true,
        brandLabel: true,
        price: true,
        tagline: true,
        description: true,
        notes: true,
        gender: true,
        subcategoryLabel: true,
      },
    });

    const activeConvId = conv.id;

    // Try AI generation if API key is present and formatted
    const cleanedKey = rawKey ? rawKey.replace(/['"]/g, '').trim() : '';
    const hasValidAiKey = cleanedKey.startsWith('AIzaSy');

    if (hasValidAiKey) {
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
          return `[${p.name}](/fr/product/${p.slug}) par ${p.brandLabel} (${p.subcategoryLabel}, ${p.gender}). Prix: ${p.price}Dh. ${p.tagline}. ${notesStr}`;
        }).join('\n');

        const systemPrompt = `Tu es "Conseiller NAY", l'expert parfumeur virtuel et raffiné de la boutique marocaine NAY Parfums.
Ton objectif est de conseiller les clients avec élégance, politesse, et un ton luxueux (vouvoiement de rigueur).
Tu réponds de manière concise, chaleureuse et très structurée.

Voici le catalogue actuel des parfums disponibles sur la boutique :
${catalogContext}

Instructions importantes pour la mise en forme :
1. Ne recommande QUE les parfums présents dans la liste ci-dessus.
2. Lorsque tu recommandes un produit, tu DOIS TOUJOURS le présenter avec une belle mise en forme Markdown en incluant son lien, comme ceci :
   **[Nom du Parfum](/fr/product/le-slug)**
   *Par Marque* - Prix : 99 Dh
   Un petit descriptif ou explication...
3. N'invente jamais de lien. Le lien exact est fourni entre crochets et parenthèses dans le catalogue ci-dessus. Utilise exactement ce lien relatif (ex: /fr/product/le-slug).
4. Si un client cherche un type de parfum spécifique, analyse les notes olfactives et propose 2 ou 3 choix pertinents avec la présentation décrite.
5. Si on te pose une question hors du domaine de la parfumerie ou du service client NAY Parfums, recadre poliment la conversation sur les parfums.`;

        const result = await streamText({
          model: google('gemini-2.5-flash') as any,
          system: systemPrompt,
          messages,
          temperature: 0.7,
          onFinish: async (completion) => {
            try {
              const fullText = completion.text;
              const slugMatches = fullText.match(/\/fr\/product\/([a-zA-Z0-9_-]+)/g) || [];
              const slugs = Array.from(new Set(slugMatches.map(m => m.replace('/fr/product/', ''))));
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

        return result.toDataStreamResponse({
          headers: {
            'x-conversation-id': conv.id
          }
        });
      } catch (aiErr) {
        console.warn('Gemini stream failed, falling back to smart catalog advisor:', aiErr);
      }
    }

    // Intelligent Luxury Fallback Engine
    const { reply, slugs } = generateSmartFallbackResponse(latestText, products, detectedNotes, detectedGender);
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
    return new Response(streamPayload, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-conversation-id': conv.id,
      }
    });
  } catch (error) {
    console.error('Erreur API Chat Conseiller NAY:', error);
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 });
  }
}
