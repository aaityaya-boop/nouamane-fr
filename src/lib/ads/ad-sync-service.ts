import prisma from '@/lib/prisma';
import { fetchMetaCampaignsAndInsights, fetchMetaDailyAccountInsights } from './meta-api';
import { fetchTikTokCampaignsAndInsights } from './tiktok-api';

export interface SyncResult {
  platform: string;
  success: boolean;
  campaignsCount: number;
  totalSpendMAD: number;
  error?: string;
}

/**
 * Synchronize all connected ad platforms and update database
 */
export async function syncAllAdIntegrations(): Promise<SyncResult[]> {
  const integrations = await prisma.adAccountIntegration.findMany({
    where: { status: { in: ['CONNECTED', 'MOCK_MODE'] } },
  });

  const results: SyncResult[] = [];

  for (const integration of integrations) {
    try {
      if (integration.platform === 'META' && integration.accessToken && integration.status === 'CONNECTED') {
        const [campaigns, dailyInsights] = await Promise.all([
          fetchMetaCampaignsAndInsights(
            integration.accountId,
            integration.accessToken,
            integration.exchangeRateToMAD,
            'last_30d'
          ),
          fetchMetaDailyAccountInsights(
            integration.accountId,
            integration.accessToken,
            integration.exchangeRateToMAD,
            'last_30d'
          ).catch(() => []),
        ]);

        let totalPlatformSpend = 0;

        for (const camp of campaigns) {
          totalPlatformSpend += camp.totalSpend;

          await prisma.adCampaign.upsert({
            where: {
              id: `${integration.id}_${camp.externalCampaignId}`,
            },
            create: {
              id: `${integration.id}_${camp.externalCampaignId}`,
              integrationId: integration.id,
              platform: 'META',
              externalCampaignId: camp.externalCampaignId,
              name: camp.name,
              status: camp.status,
              objective: camp.objective,
              dailyBudget: camp.dailyBudget,
              totalSpend: camp.totalSpend,
              impressions: camp.impressions,
              clicks: camp.clicks,
              ctr: camp.ctr,
              cpc: camp.cpc,
              conversions: camp.conversions,
              conversionValue: camp.conversionValue,
              cpa: camp.cpa,
              roas: camp.roas,
              recommendation: camp.recommendation,
              startDate: camp.startDate,
              lastSyncedAt: new Date(),
            },
            update: {
              name: camp.name,
              status: camp.status,
              dailyBudget: camp.dailyBudget,
              totalSpend: camp.totalSpend,
              impressions: camp.impressions,
              clicks: camp.clicks,
              ctr: camp.ctr,
              cpc: camp.cpc,
              conversions: camp.conversions,
              conversionValue: camp.conversionValue,
              cpa: camp.cpa,
              roas: camp.roas,
              recommendation: camp.recommendation,
              lastSyncedAt: new Date(),
            },
          });
        }

        // Replace previous auto-synced Meta daily spend snapshots cleanly (prevents duplicates)
        if (dailyInsights.length > 0) {
          await prisma.adDailySpend.deleteMany({
            where: {
              integrationId: integration.id,
              platform: 'META',
              syncedFromApi: true,
            },
          });

          await prisma.adDailySpend.createMany({
            data: dailyInsights.map((d) => ({
              integrationId: integration.id,
              platform: 'META',
              date: d.date,
              spend: d.spend,
              impressions: d.impressions,
              clicks: d.clicks,
              conversions: d.conversions,
              revenue: d.revenue,
              roas: d.roas,
              cpa: d.cpa,
              cpc: d.cpc,
              notes: 'API_AUTO • Meta Business Sync',
              syncedFromApi: true,
              syncedToExpenses: true,
            })),
          });

          const dailyTotal = dailyInsights.reduce((acc, d) => acc + d.spend, 0);
          if (dailyTotal > totalPlatformSpend) totalPlatformSpend = dailyTotal;
        }

        // Auto-sync into AdminExpense for Finance P&L
        if (totalPlatformSpend > 0) {
          await syncAdSpendToAdminExpense('META', totalPlatformSpend);
        }

        await prisma.adAccountIntegration.update({
          where: { id: integration.id },
          data: {
            lastSyncAt: new Date(),
            lastSyncStatus: 'SUCCESS',
            errorMessage: null,
          },
        });

        results.push({
          platform: 'META',
          success: true,
          campaignsCount: campaigns.length,
          totalSpendMAD: totalPlatformSpend,
        });
      } else if (integration.platform === 'TIKTOK' && integration.accessToken && integration.status === 'CONNECTED') {
        const campaigns = await fetchTikTokCampaignsAndInsights(
          integration.accountId,
          integration.accessToken,
          integration.exchangeRateToMAD
        );

        let totalPlatformSpend = 0;

        for (const camp of campaigns) {
          totalPlatformSpend += camp.totalSpend;

          const savedCamp = await prisma.adCampaign.upsert({
            where: {
              id: `${integration.id}_${camp.externalCampaignId}`,
            },
            create: {
              id: `${integration.id}_${camp.externalCampaignId}`,
              integrationId: integration.id,
              platform: 'TIKTOK',
              externalCampaignId: camp.externalCampaignId,
              name: camp.name,
              status: camp.status,
              objective: camp.objective,
              dailyBudget: camp.dailyBudget,
              totalSpend: camp.totalSpend,
              impressions: camp.impressions,
              clicks: camp.clicks,
              ctr: camp.ctr,
              cpc: camp.cpc,
              conversions: camp.conversions,
              conversionValue: camp.conversionValue,
              cpa: camp.cpa,
              roas: camp.roas,
              recommendation: camp.recommendation,
              lastSyncedAt: new Date(),
            },
            update: {
              name: camp.name,
              status: camp.status,
              dailyBudget: camp.dailyBudget,
              totalSpend: camp.totalSpend,
              impressions: camp.impressions,
              clicks: camp.clicks,
              ctr: camp.ctr,
              cpc: camp.cpc,
              conversions: camp.conversions,
              conversionValue: camp.conversionValue,
              cpa: camp.cpa,
              roas: camp.roas,
              recommendation: camp.recommendation,
              lastSyncedAt: new Date(),
            },
          });
        }

        if (totalPlatformSpend > 0) {
          await syncAdSpendToAdminExpense('TIKTOK', totalPlatformSpend);
        }

        await prisma.adAccountIntegration.update({
          where: { id: integration.id },
          data: {
            lastSyncAt: new Date(),
            lastSyncStatus: 'SUCCESS',
            errorMessage: null,
          },
        });

        results.push({
          platform: 'TIKTOK',
          success: true,
          campaignsCount: campaigns.length,
          totalSpendMAD: totalPlatformSpend,
        });
      }
    } catch (err: any) {
      await prisma.adAccountIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'FAILED',
          errorMessage: err.message || 'Erreur inconnue',
        },
      });

      results.push({
        platform: integration.platform,
        success: false,
        campaignsCount: 0,
        totalSpendMAD: 0,
        error: err.message,
      });
    }
  }

  return results;
}

/**
 * Ensures Ad Spend is automatically recorded in Finance / AdminExpense
 */
export async function syncAdSpendToAdminExpense(platform: string, amountMAD: number, date = new Date()) {
  const platformLabel =
    platform === 'META'
      ? 'Meta Ads (Facebook / Instagram)'
      : platform === 'TIKTOK'
      ? 'TikTok Ads'
      : platform === 'GOOGLE'
      ? 'Google Ads'
      : platform === 'SNAPCHAT'
      ? 'Snapchat Ads'
      : 'Campagnes Influence & UGC';

  const dateStr = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const title = `Publicités ${platformLabel} - ${dateStr}`;

  // Find if an expense for this platform and month already exists
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

  const existingExpense = await prisma.adminExpense.findFirst({
    where: {
      category: 'ADS',
      title: { startsWith: `Publicités ${platformLabel}` },
      date: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  if (existingExpense) {
    return prisma.adminExpense.update({
      where: { id: existingExpense.id },
      data: {
        amount: Math.round(amountMAD),
        description: `Synchronisation automatique avec le gestionnaire de publicités NAY (${platformLabel}).`,
        updatedAt: new Date(),
      },
    });
  } else {
    return prisma.adminExpense.create({
      data: {
        title,
        category: 'ADS',
        amount: Math.round(amountMAD),
        date: new Date(),
        paymentMethod: 'CREDIT_CARD',
        recurring: 'MONTHLY',
        description: `Créé automatiquement par le Gestionnaire de Publicités NAY (${platformLabel}).`,
      },
    });
  }
}
