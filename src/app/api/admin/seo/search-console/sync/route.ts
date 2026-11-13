import { NextResponse } from 'next/server';
import { getGscClient } from '@/lib/gsc';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';

export async function POST(request: Request) {
  try {
    const auth = await requirePermission(request, 'marketing.manage_seo');
    if (!auth.authorized) return auth.response!;
    const settings = await prisma.seoSettings.findFirst();
    if (!settings || !settings.googleSearchConsoleConnected || !settings.googlePropertyUrl) {
      return NextResponse.json({ error: 'Google Search Console not connected' }, { status: 400 });
    }

    const gsc = await getGscClient();
    
    // We fetch data for the last 3 days to get stable numbers
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2); 
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);
    
    const dateStr = (d: Date) => d.toISOString().split('T')[0];

    // 1. Fetch Daily Performance (Filtered for Morocco as requested)
    const dailyRes = await gsc.searchanalytics.query({
      siteUrl: settings.googlePropertyUrl,
      requestBody: {
        startDate: dateStr(startDate),
        endDate: dateStr(endDate),
        dimensions: ['date', 'country', 'device'],
        dimensionFilterGroups: [{
            filters: [{ dimension: 'country', expression: 'mar' }]
        }]
      }
    });

    if (dailyRes.data.rows) {
      for (const row of dailyRes.data.rows) {
        const date = new Date(row.keys![0]);
        const country = row.keys![1].toUpperCase();
        const device = row.keys![2].toUpperCase();
        
        await prisma.seoSearchConsoleDaily.upsert({
          where: {
            date_device_country_searchType: {
              date: date,
              device: device,
              country: country,
              searchType: 'WEB'
            }
          },
          update: {
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            position: row.position || 0,
          },
          create: {
            date: date,
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            position: row.position || 0,
            country: country,
            device: device,
            searchType: 'WEB'
          }
        });
      }
    }

    // 2. Fetch Keyword Performance (Filtered for Morocco)
    const keywordRes = await gsc.searchanalytics.query({
      siteUrl: settings.googlePropertyUrl,
      requestBody: {
        startDate: dateStr(startDate),
        endDate: dateStr(endDate),
        dimensions: ['query', 'country', 'device'],
        dimensionFilterGroups: [{
            filters: [{ dimension: 'country', expression: 'mar' }]
        }],
        rowLimit: 1000
      }
    });

    if (keywordRes.data.rows) {
       for (const row of keywordRes.data.rows) {
           const query = row.keys![0];
           const country = row.keys![1].toUpperCase();
           const device = row.keys![2].toUpperCase();

           // Basic keyword storage
           await prisma.seoKeywordPerformance.create({
               data: {
                   date: new Date(endDate),
                   query: query,
                   clicks: row.clicks || 0,
                   impressions: row.impressions || 0,
                   ctr: row.ctr || 0,
                   position: row.position || 0,
                   country: country,
                   device: device,
                   searchType: 'WEB'
               }
           });

           // Update actual SeoKeyword object
           await prisma.seoKeyword.upsert({
               where: { keyword: query },
               update: {
                   impressions: { increment: row.impressions || 0 },
                   clicks: { increment: row.clicks || 0 },
                   currentPosition: row.position || 0,
               },
               create: {
                   keyword: query,
                   impressions: row.impressions || 0,
                   clicks: row.clicks || 0,
                   currentPosition: row.position || 0,
                   country: 'MA'
               }
           });
       }
    }

    await prisma.googleSearchConsoleConnection.updateMany({
        data: { lastSyncAt: new Date() }
    });

    return NextResponse.json({ success: true, message: 'Sync completed' });
  } catch (error) {
    console.error('Error syncing GSC:', error);
    return NextResponse.json({ error: 'Failed to sync with Google Search Console' }, { status: 500 });
  }
}

