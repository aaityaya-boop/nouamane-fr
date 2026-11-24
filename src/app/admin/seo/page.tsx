import React from 'react';
import prisma from '@/lib/prisma';
import { evaluateProductSeo } from '@/lib/seo/realAudit';
import SeoOverviewClient, {
  AuditedProductRow,
  DailyTrafficPoint,
} from './SeoOverviewClient';

export const dynamic = 'force-dynamic';

function classifyReferrer(ref: string | null): string {
  if (!ref || !ref.trim()) return 'Accès Direct / Favoris';
  const r = ref.toLowerCase();
  if (r.includes('google.')) return 'Google Search (Organique)';
  if (r.includes('instagram.') || r.includes('l.instagram') || r.includes('facebook.') || r.includes('fb.')) {
    return 'Instagram & Meta';
  }
  if (r.includes('tiktok.')) return 'TikTok';
  if (r.includes('bing.') || r.includes('yahoo.') || r.includes('duckduckgo')) {
    return 'Autres Moteurs';
  }
  if (r.includes('nayparfum') || r.includes('localhost')) return 'Navigation Interne';
  return 'Sites Référents / Liens';
}

export default async function SeoOverviewPage() {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [
    gscConnection,
    gscDailyRows,
    totalPageViews,
    totalVisitors,
    recentPageViews,
    visitorCities,
    allProducts,
    brandsCount,
    publishedBlogsCount,
    activeLandingsCount,
    keywords,
    opportunities,
  ] = await Promise.all([
    prisma.googleSearchConsoleConnection.findFirst(),
    prisma.seoSearchConsoleDaily.findMany({
      orderBy: { date: 'desc' },
      take: 28,
    }),
    prisma.pageView.count(),
    prisma.visitor.count(),
    prisma.pageView.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { pathname: true, createdAt: true, device: true, referrer: true },
      orderBy: { createdAt: 'desc' },
      take: 3000,
    }),
    prisma.visitor.findMany({
      where: { city: { not: null } },
      select: { city: true },
      take: 1500,
    }),
    prisma.product.findMany({
      include: { seo: true },
      orderBy: { id: 'asc' },
    }),
    prisma.brand.count(),
    prisma.blogPost.count({ where: { status: 'published' } }),
    prisma.landingPage.count({ where: { status: 'active' } }),
    prisma.seoKeyword.findMany({
      orderBy: { searchVolume: 'desc' },
      take: 6,
    }),
    prisma.seoOpportunity.findMany({
      orderBy: { priority: 'desc' },
      take: 4,
    }),
  ]);

  // 1. Real Catalog Technical Audit
  const auditedProducts: AuditedProductRow[] = allProducts.map((p) => {
    const audit = evaluateProductSeo(p);

    return {
      id: p.id,
      name: p.name,
      brand: p.brandLabel || 'Maison NAY',
      slug: p.slug,
      price: p.price,
      score: audit.score,
      issues: audit.issues,
      seoTitle: audit.effectiveTitle,
      metaDescription: audit.effectiveDescription,
      focusKeyword: audit.effectiveFocusKeyword,
      hasImages: audit.hasImages,
      hasLongDesc: audit.hasLongDesc,
    };
  });

  const scoreSum = auditedProducts.reduce((acc, row) => acc + row.score, 0);
  const optimizedCount = auditedProducts.filter((row) => row.score >= 85).length;
  const needsWorkCount = auditedProducts.length - optimizedCount;
  const missingMetaDescCount = allProducts.filter((p) => !p.seo?.metaDescription?.trim()).length;
  const shortProductDescCount = auditedProducts.filter((row) => !row.hasLongDesc).length;

  const avgScore =
    allProducts.length > 0 ? Math.round(scoreSum / allProducts.length) : 0;

  // 2. Real 14-day daily traffic curve + referrers + top pages + devices
  const dayBuckets: DailyTrafficPoint[] = [];
  const dayIndex = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    dayIndex.set(key, dayBuckets.length);
    dayBuckets.push({ date: key, label, views: 0 });
  }

  const refCounts = new Map<string, number>();
  const pathCounts = new Map<string, number>();
  let mobileViews = 0;
  let desktopViews = 0;

  for (const pv of recentPageViews) {
    const dayKey = new Date(pv.createdAt).toISOString().split('T')[0];
    const idx = dayIndex.get(dayKey);
    if (idx !== undefined) dayBuckets[idx].views += 1;

    const src = classifyReferrer(pv.referrer);
    if (src !== 'Navigation Interne') {
      refCounts.set(src, (refCounts.get(src) || 0) + 1);
    }

    if (pv.pathname && !pv.pathname.startsWith('/admin') && !pv.pathname.startsWith('/api')) {
      pathCounts.set(pv.pathname, (pathCounts.get(pv.pathname) || 0) + 1);
    }

    const dev = (pv.device || '').toLowerCase();
    if (dev.includes('mobile') || dev.includes('ios') || dev.includes('android')) {
      mobileViews++;
    } else {
      desktopViews++;
    }
  }

  const totalClassifiedRefs = Math.max(
    1,
    Array.from(refCounts.values()).reduce((a, b) => a + b, 0)
  );
  const referrers = Array.from(refCounts.entries())
    .map(([source, count]) => ({
      source,
      count,
      share: Math.round((count / totalClassifiedRefs) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topPages = Array.from(pathCounts.entries())
    .map(([pathname, views]) => ({ pathname, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const totalDev = Math.max(1, mobileViews + desktopViews);
  const mobilePct = Math.round((mobileViews / totalDev) * 100);
  const desktopPct = 100 - mobilePct;

  const cityMap = new Map<string, number>();
  for (const v of visitorCities) {
    if (!v.city || v.city === 'Unknown') continue;
    cityMap.set(v.city, (cityMap.get(v.city) || 0) + 1);
  }
  const topCities = Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 3. Honest GSC metrics
  const isGscConnected = Boolean(gscConnection && gscConnection.accessTokenEncrypted);
  const gscClicks = gscDailyRows.reduce((s, r) => s + r.clicks, 0);
  const gscImpressions = gscDailyRows.reduce((s, r) => s + r.impressions, 0);

  const totalIndexableUrls =
    allProducts.length + brandsCount + publishedBlogsCount + activeLandingsCount + 8;

  return (
    <SeoOverviewClient
      catalogMetrics={{
        avgScore,
        totalProducts: allProducts.length,
        optimizedCount,
        needsWorkCount,
        missingMetaDescCount,
        shortProductDescCount,
        brandsCount,
        publishedBlogsCount,
        activeLandingsCount,
        totalIndexableUrls,
      }}
      trafficMetrics={{
        totalPageViews,
        totalVisitors,
        mobilePct,
        desktopPct,
        dailyTraffic: dayBuckets,
        referrers,
        topPages,
        topCities,
      }}
      gsc={{
        connected: isGscConnected,
        propertyUrl: gscConnection?.propertyUrl || null,
        clicks: gscClicks,
        impressions: gscImpressions,
      }}
      initialAuditedProducts={auditedProducts}
      keywords={keywords.map((k) => ({
        id: k.id,
        keyword: k.keyword,
        searchIntent: k.searchIntent,
        searchVolume: k.searchVolume,
        opportunityScore: k.opportunityScore,
      }))}
      opportunities={opportunities.map((o) => ({
        id: o.id,
        title: o.title || '',
        impact: o.impact || 'HIGH',
        description: o.description || '',
        recommendation: o.recommendation || '',
      }))}
    />
  );
}
