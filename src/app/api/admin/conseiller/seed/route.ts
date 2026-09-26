import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Check if there are already conversations
    const existingCount = await prisma.advisorConversation.count();

    // Fetch some real products from the database to link to recommendations
    const products = await prisma.product.findMany({
      where: { published: true },
      select: { slug: true, name: true, brandLabel: true, price: true },
      take: 10,
    });

    const sampleSlugs = products.map(p => p.slug);

    const sampleData = [
      {
        summary: "Recherche parfum vanille gourmande et caramel longue tenue",
        intent: "RECOMMENDATION",
        preferredNotes: JSON.stringify(["Vanille", "Gourmand", "Fève Tonka"]),
        preferredGender: "FEMME",
        customerCity: "Casablanca",
        recommendedSlugs: JSON.stringify(sampleSlugs.slice(0, 2)),
        messages: [
          {
            role: "user",
            content: "Bonjour, je cherche un parfum pour femme très vanillé, sucré et gourmand avec une très bonne tenue pour l'hiver.",
          },
          {
            role: "assistant",
            content: "Bonjour et bienvenue chez NAY Parfums. C'est un excellent choix pour la saison ! Je vous conseille nos créations vanillées les plus envoûtantes qui allient vanille de Madagascar et fève tonka précieuse. Elles offrent une tenue remarquable de plus de 12 heures et un sillage irrésistiblement chaleureux.",
            recommendedProducts: JSON.stringify(sampleSlugs.slice(0, 2)),
          },
          {
            role: "user",
            content: "Est-ce qu'ils laissent un sillage quand on passe ?",
          },
          {
            role: "assistant",
            content: "Absolument ! Grâce à leur haute concentration en extrait de parfum, le sillage est enveloppant et sophistiqué sans être entêtant. Vous laisserez une signature olfactive mémorable partout où vous irez.",
          }
        ]
      },
      {
        summary: "Demande de testeurs et questions sur la tenue",
        intent: "TESTER_INQUIRY",
        preferredNotes: JSON.stringify(["Ambre", "Boisé", "Épicé"]),
        preferredGender: "UNISEXE",
        customerCity: "Rabat",
        recommendedSlugs: JSON.stringify(sampleSlugs.slice(2, 4)),
        messages: [
          {
            role: "user",
            content: "Bonjour, avez-vous des testeurs ou des coffrets découverte pour tester vos parfums avant d'acheter le grand format ?",
          },
          {
            role: "assistant",
            content: "Bonjour ! Nous proposons régulièrement des coffrets découvertes et des échantillons offerts avec chaque commande. Toutes nos fragrances sont formulées avec des essences nobles pour vous garantir une expérience olfactive d'exception dès la première vaporisation.",
            recommendedProducts: JSON.stringify(sampleSlugs.slice(2, 4)),
          }
        ]
      },
      {
        summary: "Idée cadeau mariage homme boisé et raffiné",
        intent: "GIFT_SEARCH",
        preferredNotes: JSON.stringify(["Boisé", "Oud", "Cuir"]),
        preferredGender: "HOMME",
        customerCity: "Marrakech",
        recommendedSlugs: JSON.stringify(sampleSlugs.slice(1, 3)),
        messages: [
          {
            role: "user",
            content: "Salam, je cherche un cadeau très élégant pour mon mari à l'occasion de notre anniversaire de mariage. Il aime les parfums boisés, cuirés et masculins.",
          },
          {
            role: "assistant",
            content: "Salam ! Toutes nos félicitations pour cet événement. Pour un homme raffiné qui apprécie les accords boisés et cuirés, je vous recommande chaleureusement nos compositions signatures. Elles incarnent le charisme et la distinction avec des notes de cèdre noble, de cuir fin et d'ambre précieux.",
            recommendedProducts: JSON.stringify(sampleSlugs.slice(1, 3)),
          }
        ]
      },
      {
        summary: "Parfum sillage ultra puissant & tenue 24h",
        intent: "SILLAGE_PERFUME",
        preferredNotes: JSON.stringify(["Oud", "Ambre", "Tabac"]),
        preferredGender: "UNISEXE",
        customerCity: "Tanger",
        recommendedSlugs: JSON.stringify(sampleSlugs.slice(0, 3)),
        messages: [
          {
            role: "user",
            content: "Quel est le parfum avec la plus grande projection et tenue de votre catalogue ?",
          },
          {
            role: "assistant",
            content: "Nos extraits de parfum orientaux et ambrés possèdent la plus forte puissance de diffusion. Leurs notes de fond riches en bois de oud, ambre gris et résines nobles garantissent une présence olfactive continue de 24h, même sur les vêtements.",
            recommendedProducts: JSON.stringify(sampleSlugs.slice(0, 3)),
          }
        ]
      },
      {
        summary: "Questions délais de livraison et paiement cash à la livraison",
        intent: "PRICE_SHIPPING",
        preferredNotes: JSON.stringify([]),
        preferredGender: "UNISEXE",
        customerCity: "Agadir",
        recommendedSlugs: JSON.stringify([]),
        messages: [
          {
            role: "user",
            content: "La livraison sur Agadir prend combien de jours et est-ce que je peux payer en espèces à la réception ?",
          },
          {
            role: "assistant",
            content: "Chez NAY Parfums, la livraison express partout au Maroc prend entre 24h et 48h ouvrables. Le paiement à la livraison (Cash on Delivery) est disponible et 100% sécurisé lors de la remise en main propre par notre livreur partenaire.",
          }
        ]
      },
      {
        summary: "Parfum frais hespéridé pour le bureau et l'été",
        intent: "RECOMMENDATION",
        preferredNotes: JSON.stringify(["Frais / Hespéridé", "Floral", "Musc"]),
        preferredGender: "HOMME",
        customerCity: "Fès",
        recommendedSlugs: JSON.stringify(sampleSlugs.slice(3, 5)),
        messages: [
          {
            role: "user",
            content: "Je veux un parfum frais avec de la bergamote et des agrumes pour le travail tous les jours, propre et discret.",
          },
          {
            role: "assistant",
            content: "C'est une excellente idée. Une fragrance fraîche aux notes de bergamote italienne, néroli et musc blanc vous apportera un sentiment de propreté et d'énergie tout au long de votre journée professionnelle.",
            recommendedProducts: JSON.stringify(sampleSlugs.slice(3, 5)),
          }
        ]
      },
      {
        summary: "Cadeau femme floral rose et musc blanc",
        intent: "GIFT_SEARCH",
        preferredNotes: JSON.stringify(["Floral", "Musc", "Rose"]),
        preferredGender: "FEMME",
        customerCity: "Casablanca",
        recommendedSlugs: JSON.stringify(sampleSlugs.slice(0, 2)),
        messages: [
          {
            role: "user",
            content: "Je cherche une eau de parfum féminine et délicate à base de rose de Damas et de musc pour offrir.",
          },
          {
            role: "assistant",
            content: "Un choix empreint d'élégance et de poésie. La rose associée à un musc cotonneux offre une aura douce, poudrée et irrésistiblement féminine. C'est l'un des cadeaux les plus appréciés de notre collection.",
            recommendedProducts: JSON.stringify(sampleSlugs.slice(0, 2)),
          }
        ]
      }
    ];

    for (const item of sampleData) {
      const conv = await prisma.advisorConversation.create({
        data: {
          sessionId: 'demo_' + Math.random().toString(36).substring(2, 8),
          summary: item.summary,
          intent: item.intent,
          preferredNotes: item.preferredNotes,
          preferredGender: item.preferredGender,
          customerCity: item.customerCity,
          recommendedSlugs: item.recommendedSlugs,
          messagesCount: item.messages.length,
        }
      });

      for (const msg of item.messages) {
        await prisma.advisorMessage.create({
          data: {
            conversationId: conv.id,
            role: msg.role,
            content: msg.content,
            recommendedProducts: (msg as any).recommendedProducts || null,
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${sampleData.length} conversations de démonstration créées avec succès !`,
    });
  } catch (error: any) {
    console.error('Erreur seed Conseiller NAY:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des données.', details: error?.message },
      { status: 500 }
    );
  }
}
