import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac/serverGuard";

const PREDEFINED_TOPICS = [
  { name: "Parfum Homme", keywords: ["homme", "rajel", "men", "رجالي", "للرجال"] },
  { name: "Parfum Femme", keywords: ["femme", "mra", "women", "نسائية", "للنساء"] },
  { name: "Parfum Unisexe", keywords: ["unisexe", "unisex", "mixte"] },
  { name: "Parfum Longue Tenue", keywords: ["longue tenue", "durable", "reste"] },
  { name: "Parfum Été", keywords: ["été", "summer", "fraicheur", "frais"] },
  { name: "Parfum Hiver", keywords: ["hiver", "winter", "chaud"] },
  { name: "Parfum Original", keywords: ["original", "vrai", "authentique", "أصلي"] },
  { name: "Testeur Parfum", keywords: ["testeur", "tester"] },
  { name: "Parfum Pas Cher", keywords: ["pas cher", "promotion", "solde", "رخيص", "prix"] },
  { name: "Parfum de Luxe", keywords: ["luxe", "niche", "prestige", "فاخر"] },
];

export async function POST(request: Request) {
  try {
    const auth = await requirePermission(request, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const keywords = await prisma.seoKeyword.findMany();
    let newTopicsCount = 0;
    let mappedKeywordsCount = 0;

    // 1. Create or ensure predefined topics exist
    const topicMap: Record<string, string> = {}; // name -> id
    for (const pt of PREDEFINED_TOPICS) {
      const slug = pt.name.toLowerCase().replace(/\s+/g, "-");
      let topic = await prisma.seoTopic.findUnique({ where: { slug } });
      if (!topic) {
        topic = await prisma.seoTopic.create({
          data: { name: pt.name, slug, description: `Keywords related to ${pt.name}` }
        });
        newTopicsCount++;
      }
      topicMap[pt.name] = topic.id;
    }

    // 2. Map keywords to topics
    for (const kw of keywords) {
      const lowerKw = kw.keyword.toLowerCase();
      
      for (const pt of PREDEFINED_TOPICS) {
        const matches = pt.keywords.some(k => lowerKw.includes(k));
        if (matches) {
          const topicId = topicMap[pt.name];
          // Ensure mapping doesn't already exist
          const existing = await prisma.seoTopicKeyword.findFirst({
            where: { topicId, keyword: kw.keyword }
          });
          if (!existing) {
            await prisma.seoTopicKeyword.create({
              data: { topicId, keyword: kw.keyword }
            });
            mappedKeywordsCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Discovered ${newTopicsCount} new topics and mapped ${mappedKeywordsCount} keywords.`
    });
  } catch (error: any) {
    console.error("Topic Discovery Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
