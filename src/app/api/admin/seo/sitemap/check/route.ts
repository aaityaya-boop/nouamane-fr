import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    const sitemapUrl = `${origin}/sitemap.xml`;

    let httpStatus = 0;
    let isValid = false;
    let urlCount = 0;
    let errorMessage: string | null = null;
    let urls: string[] = [];

    try {
      const response = await fetch(sitemapUrl, {
        headers: { "User-Agent": "NAY-SEO-Bot/1.0" },
        cache: 'no-store'
      });
      httpStatus = response.status;
      
      if (response.ok) {
        const xml = await response.text();
        if (xml.includes("<?xml") && (xml.includes("<urlset") || xml.includes("<sitemapindex"))) {
          isValid = true;
          // Extract URLs
          const locMatches = xml.match(/<loc>([^<]+)<\/loc>/g);
          if (locMatches) {
            urls = locMatches.map(m => m.replace(/<\/?loc>/g, "").trim());
            urlCount = urls.length;
          }
        } else {
          errorMessage = "Format XML invalide ou balise <urlset> manquante";
        }
      } else {
        errorMessage = `Erreur HTTP ${httpStatus}`;
      }
    } catch (e: any) {
      errorMessage = e.message || "Impossible de contacter l'URL du sitemap";
    }

    // Upsert status in DB
    const statusRecord = await prisma.seoSitemapStatus.upsert({
      where: { sitemapUrl: "https://nayparfum.ma/sitemap.xml" },
      create: {
        sitemapUrl: "https://nayparfum.ma/sitemap.xml",
        httpStatus: httpStatus || 200,
        isValid,
        urlCount,
        errorMessage,
        lastCheckedAt: new Date(),
        lastModifiedAt: new Date()
      },
      update: {
        httpStatus: httpStatus || 200,
        isValid,
        urlCount,
        errorMessage,
        lastCheckedAt: new Date(),
        lastModifiedAt: new Date()
      }
    });

    // Clear old sitemap issues
    await prisma.seoIssue.deleteMany({
      where: { type: { in: ['SITEMAP_MISSING', 'SITEMAP_ERROR', 'SITEMAP_URL_404', 'SITEMAP_URL_NOINDEX'] } }
    });

    if (!isValid) {
      await prisma.seoIssue.create({
        data: {
          url: sitemapUrl,
          type: "SITEMAP_ERROR",
          severity: "CRITICAL",
          title: "Sitemap XML invalide ou inaccessible",
          recommendation: "Vérifiez la génération automatique de /sitemap.xml dans Next.js.",
          status: "OPEN"
        }
      });
    }

    const isJson = request.headers.get('accept')?.includes('application/json') ||
                   request.headers.get('content-type')?.includes('application/json');

    if (isJson) {
      return NextResponse.json({
        success: true,
        status: statusRecord,
        urlCount,
        isValid,
        httpStatus
      });
    }

    return NextResponse.redirect(new URL('/admin/seo/sitemap', request.url));
  } catch (error: any) {
    console.error("Sitemap Check Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
