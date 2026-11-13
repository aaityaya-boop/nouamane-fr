import { NextResponse } from "next/server";
import { getSeoAiProvider } from "@/lib/seo-ai/provider";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac/serverGuard";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission(request, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seo: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const aiProvider = await getSeoAiProvider();

    // Grounded Input
    const input = {
      productName: product.name,
      brand: product.brandLabel || "NAY Parfum",
      description: product.description || "",
      category: product.subcategory || "",
      notes: "N/A", // This could be fetched from attributes if available
      gender: product.gender || "Unisex",
      existingTitle: product.seo?.seoTitle || "",
      existingMeta: product.seo?.metaDescription || "",
      price: product.price
    };

    const aiResult = await aiProvider.optimizeProduct(input);

    // Save to AI Generation History
    await prisma.seoAiGeneration.create({
      data: {
        entityType: "Product",
        entityId: String(product.id),
        inputData: JSON.stringify(input),
        generatedTitle: aiResult.seoTitle,
        generatedDescription: aiResult.metaDescription,
        generatedKeywords: aiResult.focusKeyword + "," + aiResult.secondaryKeywords.join(","),
        generatedFaq: JSON.stringify(aiResult.faq),
        model: process.env.SEO_AI_MODEL || "gemini-1.5-pro",
        createdBy: "ADMIN",
        status: "GENERATED"
      }
    });

    return NextResponse.json({
      success: true,
      aiAnalysis: aiResult,
    });
  } catch (error: any) {
    console.error("AI Product Optimize Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

