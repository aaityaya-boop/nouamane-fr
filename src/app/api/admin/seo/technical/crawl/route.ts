import { NextResponse } from "next/server";
import { crawlUrl, processCrawlResult } from "@/lib/seo-ai/crawler";
import { requirePermission } from "@/lib/auth/rbac/serverGuard";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission(request, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL to crawl" }, { status: 400 });
    }

    // Ensure it's a valid URL and preferably same-domain (we can enforce baseUrl if needed)
    let targetUrl = url;
    if (url.startsWith("/")) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nayparfum.ma";
      targetUrl = `${baseUrl}${url}`;
    }

    // For absolute URLs, you might want to enforce it belongs to the domain
    const urlObj = new URL(targetUrl);
    const baseUrl = urlObj.origin;

    const result = await crawlUrl(targetUrl, baseUrl);
    
    // Save to DB and generate issues
    await processCrawlResult(result);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error("Crawl API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
