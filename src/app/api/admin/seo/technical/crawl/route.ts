import { NextResponse } from "next/server";
import { crawlUrl, processCrawlResult } from "@/lib/seo-ai/crawler";
import { requirePermission } from "@/lib/auth/rbac/serverGuard";
import { assertSafeCrawlUrl } from "@/lib/security/ssrf";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission(request, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: "Missing URL to crawl" }, { status: 400 });
    }

    const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nayparfum.ma";
    let targetUrl = url.trim();
    if (targetUrl.startsWith("/")) {
      targetUrl = `${baseAppUrl}${targetUrl}`;
    }

    let urlObj: URL;
    try {
      urlObj = await assertSafeCrawlUrl(targetUrl);
    } catch (ssrfErr: any) {
      return NextResponse.json(
        { error: ssrfErr?.message || "URL cible non autorisée" },
        { status: 400 }
      );
    }

    // Restrict SEO crawler exclusively to configured storefront host(s)
    const allowedHosts = new Set(['nayparfum.ma', 'www.nayparfum.ma']);
    try {
      allowedHosts.add(new URL(baseAppUrl).hostname.toLowerCase());
    } catch {}
    if (!allowedHosts.has(urlObj.hostname.toLowerCase())) {
      return NextResponse.json(
        { error: "Le crawler SEO est restreint aux domaines autorisés du site." },
        { status: 403 }
      );
    }

    const baseUrl = urlObj.origin;
    const result = await crawlUrl(urlObj.toString(), baseUrl);
    
    // Save to DB and generate issues
    await processCrawlResult(result);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error("Crawl API Error:", error);
    return NextResponse.json({ error: "Crawl failed" }, { status: 500 });
  }
}
