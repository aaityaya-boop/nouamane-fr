import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { detectCustomerIntent, extractOlfactoryNotes } from '@/lib/advisor/advisorAnalytics';

export async function POST(req: Request) {
  try {
    const rawKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const google = createGoogleGenerativeAI({
      apiKey: rawKey ? rawKey.replace(/['"]/g, '').trim() : undefined,
    });
    
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

    // Fetch product catalog for AI context
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

    const catalogContext = products.map((p) => {
      let notesStr = '';
      try {
        const notesObj = typeof p.notes === 'string' ? JSON.parse(p.notes) : p.notes;
        notesStr = `Notes: Tête (${notesObj?.top?.join(', ') || ''}), Coeur (${notesObj?.heart?.join(', ') || ''}), Fond (${notesObj?.base?.join(', ') || ''})`;
      } catch (e) {
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

    const activeConvId = conv.id;

    const result = await streamText({
      model: google('gemini-2.5-flash') as any,
      system: systemPrompt,
      messages,
      temperature: 0.7,
      onFinish: async (completion) => {
        try {
          const fullText = completion.text;
          
          // Extract recommended perfume slugs from markdown links
          const slugMatches = fullText.match(/\/fr\/product\/([a-zA-Z0-9_-]+)/g) || [];
          const slugs = Array.from(new Set(slugMatches.map(m => m.replace('/fr/product/', ''))));

          // Extract additional notes from AI output
          const allText = latestText + ' ' + fullText;
          const combinedNotes = extractOlfactoryNotes(allText);

          // Save assistant message to DB
          await prisma.advisorMessage.create({
            data: {
              conversationId: activeConvId,
              role: 'assistant',
              content: fullText,
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
  } catch (error) {
    console.error('Erreur API Chat Conseiller NAY:', error);
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 });
  }
}
