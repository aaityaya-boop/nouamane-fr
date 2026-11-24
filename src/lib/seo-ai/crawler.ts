import prisma from "@/lib/prisma";
import { assertSafeCrawlUrl } from "@/lib/security/ssrf";

export interface CrawlResult {
  url: string;
  statusCode: number;
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  h1Count: number;
  h2Count: number;
  wordCount: number;
  imageCount: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  hasSchema: boolean;
  schemaTypes: string | null;
  isIndexable: boolean;
}

export async function crawlUrl(url: string, baseUrl: string): Promise<CrawlResult> {
  const result: CrawlResult = {
    url,
    statusCode: 0,
    title: null,
    metaDescription: null,
    canonicalUrl: null,
    robots: null,
    h1Count: 0,
    h2Count: 0,
    wordCount: 0,
    imageCount: 0,
    imagesWithoutAlt: 0,
    internalLinks: 0,
    externalLinks: 0,
    hasSchema: false,
    schemaTypes: null,
    isIndexable: true,
  };

  try {
    const safeUrl = await assertSafeCrawlUrl(url);
    const response = await fetch(safeUrl.toString(), {
      headers: { "User-Agent": "NAY-SEO-Bot/1.0" },
      // Don't follow redirects automatically so we can catch 301s and avoid redirect SSRF
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });

    result.statusCode = response.status;

    if (response.status >= 300 && response.status < 400) {
      result.isIndexable = false;
      return result;
    }

    if (response.status !== 200) {
      result.isIndexable = false;
      return result;
    }

    const html = await response.text();

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) result.title = titleMatch[1].trim();

    // Meta Description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
    if (metaDescMatch) result.metaDescription = metaDescMatch[1].trim();

    // Canonical
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
                           html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
    if (canonicalMatch) result.canonicalUrl = canonicalMatch[1].trim();

    // Robots
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (robotsMatch) {
      result.robots = robotsMatch[1].trim().toLowerCase();
      if (result.robots.includes("noindex")) {
        result.isIndexable = false;
      }
    }

    // H1 count
    const h1Matches = html.match(/<h1[^>]*>.*?<\/h1>/gi);
    if (h1Matches) result.h1Count = h1Matches.length;

    // H2 count
    const h2Matches = html.match(/<h2[^>]*>.*?<\/h2>/gi);
    if (h2Matches) result.h2Count = h2Matches.length;

    // Word count approx (strip HTML)
    const textOnly = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    result.wordCount = textOnly.split(" ").length;

    // Images
    const imgMatches = html.match(/<img[^>]+>/gi);
    if (imgMatches) {
      result.imageCount = imgMatches.length;
      result.imagesWithoutAlt = imgMatches.filter(img => !img.toLowerCase().includes('alt="') && !img.toLowerCase().includes("alt='")).length;
    }

    // Links
    const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
    if (linkMatches) {
      linkMatches.forEach(link => {
        const hrefMatch = link.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
          const href = hrefMatch[1];
          if (href.startsWith("http") && !href.startsWith(baseUrl)) {
            result.externalLinks++;
          } else if (href.startsWith("/") || href.startsWith(baseUrl)) {
            result.internalLinks++;
          }
        }
      });
    }

    // Schema
    const schemaMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (schemaMatches) {
      result.hasSchema = true;
      const types = new Set<string>();
      schemaMatches.forEach(script => {
        try {
          const content = script.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
          const parsed = JSON.parse(content);
          if (parsed["@type"]) {
            types.add(parsed["@type"]);
          }
          if (Array.isArray(parsed)) {
            parsed.forEach(p => { if (p["@type"]) types.add(p["@type"]); });
          } else if (parsed["@graph"]) {
            parsed["@graph"].forEach((p: any) => { if (p["@type"]) types.add(p["@type"]); });
          }
        } catch(e) {}
      });
      result.schemaTypes = Array.from(types).join(", ");
    }

  } catch (error) {
    console.error(`Crawler error for ${url}:`, error);
    result.statusCode = 500;
    result.isIndexable = false;
  }

  return result;
}

export async function processCrawlResult(result: CrawlResult) {
  // 1. Upsert SeoAudit
  await prisma.seoAudit.upsert({
    where: { url: result.url },
    create: {
      url: result.url,
      statusCode: result.statusCode,
      title: result.title,
      metaDescription: result.metaDescription,
      canonicalUrl: result.canonicalUrl,
      robots: result.robots,
      h1Count: result.h1Count,
      h2Count: result.h2Count,
      wordCount: result.wordCount,
      imageCount: result.imageCount,
      imagesWithoutAlt: result.imagesWithoutAlt,
      internalLinks: result.internalLinks,
      externalLinks: result.externalLinks,
      hasSchema: result.hasSchema,
      schemaTypes: result.schemaTypes,
      isIndexable: result.isIndexable,
      lastCheckedAt: new Date()
    },
    update: {
      statusCode: result.statusCode,
      title: result.title,
      metaDescription: result.metaDescription,
      canonicalUrl: result.canonicalUrl,
      robots: result.robots,
      h1Count: result.h1Count,
      h2Count: result.h2Count,
      wordCount: result.wordCount,
      imageCount: result.imageCount,
      imagesWithoutAlt: result.imagesWithoutAlt,
      internalLinks: result.internalLinks,
      externalLinks: result.externalLinks,
      hasSchema: result.hasSchema,
      schemaTypes: result.schemaTypes,
      isIndexable: result.isIndexable,
      updatedAt: new Date()
    }
  });

  // 2. Generate Issues
  const issues = [];
  
  if (result.statusCode >= 400) {
    issues.push({ type: "BROKEN_LINK", severity: "CRITICAL", title: `URL returns ${result.statusCode}`, recommendation: "Fix the broken link or set up a 301 redirect." });
  } else if (result.statusCode >= 300) {
    issues.push({ type: "REDIRECT", severity: "MEDIUM", title: `URL redirects (${result.statusCode})`, recommendation: "Update internal links to point to the final destination." });
  }

  if (result.statusCode === 200) {
    if (!result.title) issues.push({ type: "MISSING_TITLE", severity: "HIGH", title: "Missing Title Tag", recommendation: "Add a descriptive title tag." });
    else if (result.title.length < 30 || result.title.length > 70) issues.push({ type: "TITLE_LENGTH", severity: "LOW", title: "Title length non-optimal", recommendation: "Keep title between 30-70 characters." });

    if (!result.metaDescription) issues.push({ type: "MISSING_META", severity: "HIGH", title: "Missing Meta Description", recommendation: "Add a compelling meta description." });
    
    if (result.h1Count === 0) issues.push({ type: "MISSING_H1", severity: "HIGH", title: "Missing H1", recommendation: "Add exactly one H1 tag to the page." });
    else if (result.h1Count > 1) issues.push({ type: "MULTIPLE_H1", severity: "MEDIUM", title: "Multiple H1s", recommendation: "Ensure only one H1 tag is used." });

    if (result.canonicalUrl && result.canonicalUrl !== result.url && !result.canonicalUrl.startsWith("/")) {
      issues.push({ type: "CANONICAL_MISMATCH", severity: "MEDIUM", title: "Canonical points elsewhere", recommendation: "Ensure this is intentional, otherwise self-canonicalize." });
    }

    if (!result.isIndexable) {
      issues.push({ type: "NOINDEX", severity: "HIGH", title: "Page is NOINDEX", recommendation: "If this page should be indexed, remove the noindex tag." });
    }
  }

  // Clear old issues for this URL
  await prisma.seoIssue.deleteMany({ where: { url: result.url } });

  // Insert new issues
  for (const issue of issues) {
    await prisma.seoIssue.create({
      data: {
        url: result.url,
        type: issue.type,
        severity: issue.severity,
        title: issue.title,
        recommendation: issue.recommendation
      }
    });

    // Mirror Critical/High issues to SeoOpportunity for the roadmap
    if (issue.severity === "CRITICAL" || issue.severity === "HIGH") {
      await prisma.seoOpportunity.create({
        data: {
          type: "TECHNICAL",
          targetUrl: result.url,
          title: issue.title,
          description: `Detected on ${result.url}`,
          impact: issue.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
          effort: "LOW",
          priority: issue.severity === "CRITICAL" ? 100 : 80,
          recommendation: issue.recommendation,
          status: "NEW"
        }
      });
    }
  }
}
