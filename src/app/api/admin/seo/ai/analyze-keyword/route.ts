import { NextResponse } from "next/server";
import { getSeoAiProvider } from "@/lib/seo-ai/provider";
import { 
  INTENT_BUSINESS_VALUE_MAP, 
  calculateDeterministicOpportunityScore, 
  determineImpact 
} from "@/lib/seo-ai/business-value";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac/serverGuard";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission(request, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const body = await request.json();
    const { keywordId } = body;

    if (!keywordId) {
      return NextResponse.json({ error: "Missing keywordId" }, { status: 400 });
    }

    const keywordRecord = await prisma.seoKeyword.findUnique({
      where: { id: keywordId }
    });

    if (!keywordRecord) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    // Call Provider
    const aiProvider = await getSeoAiProvider();
    
    // Construct Grounded Input (Real Data Only)
    const input = {
      keyword: keywordRecord.keyword,
      country: keywordRecord.country,
      language: keywordRecord.language,
      clicks: keywordRecord.clicks,
      impressions: keywordRecord.impressions,
      ctr: keywordRecord.ctr,
      averagePosition: keywordRecord.currentPosition || 0,
      targetUrl: keywordRecord.url,
      businessRelevance: keywordRecord.businessValue,
    };

    // AI Analysis
    const aiResult = await aiProvider.analyzeKeyword(input);
    const intentValue = aiResult.intent.intent as keyof typeof INTENT_BUSINESS_VALUE_MAP;
    const businessValueScore = INTENT_BUSINESS_VALUE_MAP[intentValue] || 50;

    // Deterministic Logic
    const opportunityScore = calculateDeterministicOpportunityScore(
      keywordRecord.impressions,
      keywordRecord.currentPosition || 0,
      keywordRecord.ctr,
      businessValueScore
    );
    const impact = determineImpact(opportunityScore);

    // Save to AI Generation History
    await prisma.seoAiGeneration.create({
      data: {
        entityType: "SeoKeyword",
        entityId: keywordRecord.id,
        inputData: JSON.stringify(input),
        generatedContent: JSON.stringify(aiResult),
        model: process.env.SEO_AI_MODEL || "gemini-1.5-pro",
        createdBy: "ADMIN",
        status: "GENERATED"
      }
    });

    // Create or Update Opportunity (NEVER applying changes to production fields automatically)
    const opportunity = await prisma.seoOpportunity.create({
      data: {
        type: "KEYWORD",
        keyword: keywordRecord.keyword,
        targetUrl: keywordRecord.url,
        country: keywordRecord.country,
        position: keywordRecord.currentPosition,
        impressions: keywordRecord.impressions,
        ctr: keywordRecord.ctr,
        impact: impact,
        effort: "MEDIUM",
        priority: opportunityScore,
        businessValue: businessValueScore,
        recommendation: aiResult.reason + " " + aiResult.recommendedActions.join(", "),
        status: "NEW"
      }
    });

    return NextResponse.json({
      success: true,
      aiAnalysis: aiResult,
      opportunityScore,
      impact,
      opportunityId: opportunity.id
    });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

