/**
 * Meta Marketing API Client (Facebook & Instagram Ads / Meta Business)
 * Version: Graph API v20.0
 */

export interface MetaCampaignInsight {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  clicks: string;
  cpc: string;
  cpm: string;
  ctr: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  purchase_roas?: Array<{ action_type: string; value: string }>;
}

export interface MetaDailyAccountInsight {
  date_start: string;
  spend: string;
  impressions: string;
  clicks: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  actions?: Array<{ action_type: string; value: string }>;
  action_values?: Array<{ action_type: string; value: string }>;
  purchase_roas?: Array<{ action_type: string; value: string }>;
}

export interface MetaCampaignDetails {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export interface DiscoveredMetaAdAccount {
  id: string;
  accountId: string;
  name: string;
  currency: string;
  accountStatus: number;
  amountSpentCents: number;
  businessName: string | null;
}

export async function discoverMetaBusinessAccounts(accessToken: string): Promise<{
  success: boolean;
  user?: { id: string; name: string };
  businesses?: Array<{ id: string; name: string }>;
  adAccounts?: DiscoveredMetaAdAccount[];
  grantedPermissions?: string[];
  missingPermissions?: string[];
  error?: string;
}> {
  try {
    const cleanToken = accessToken.trim();
    if (!cleanToken) {
      return { success: false, error: 'Veuillez fournir un token d’accès Meta.' };
    }

    const [meRes, permRes, adAccRes, bizRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${encodeURIComponent(cleanToken)}`),
      fetch(`https://graph.facebook.com/v20.0/me/permissions?access_token=${encodeURIComponent(cleanToken)}`),
      fetch(
        `https://graph.facebook.com/v20.0/me/adaccounts?fields=id,account_id,name,currency,account_status,amount_spent,business{id,name}&limit=50&access_token=${encodeURIComponent(cleanToken)}`
      ),
      fetch(`https://graph.facebook.com/v20.0/me/businesses?fields=id,name&limit=25&access_token=${encodeURIComponent(cleanToken)}`),
    ]);

    const meData = await meRes.json();
    if (!meRes.ok || meData.error) {
      return {
        success: false,
        error: meData.error?.message || `Token Meta invalide ou expiré (${meRes.status})`,
      };
    }

    const permData = await permRes.json();
    const grantedPermissions: string[] = Array.isArray(permData?.data)
      ? permData.data
          .filter((p: any) => p.status === 'granted')
          .map((p: any) => p.permission)
      : [];

    const requiredPerms = ['ads_read', 'read_insights'];
    const missingPermissions = requiredPerms.filter((p) => !grantedPermissions.includes(p));

    const adAccData = await adAccRes.json();
    if (adAccData.error && (!adAccData.data || adAccData.data.length === 0)) {
      return {
        success: false,
        user: { id: meData.id, name: meData.name },
        grantedPermissions,
        missingPermissions: missingPermissions.length > 0 ? missingPermissions : ['ads_read'],
        error: adAccData.error.message || 'Impossible de lire vos comptes publicitaires Meta.',
      };
    }

    const bizData = await bizRes.json();
    const businesses = Array.isArray(bizData?.data)
      ? bizData.data.map((b: any) => ({ id: b.id, name: b.name }))
      : [];

    const adAccounts: DiscoveredMetaAdAccount[] = Array.isArray(adAccData?.data)
      ? adAccData.data.map((acc: any) => ({
          id: acc.id,
          accountId: acc.account_id || acc.id?.replace('act_', ''),
          name: acc.name || acc.id,
          currency: acc.currency || 'USD',
          accountStatus: acc.account_status || 1,
          amountSpentCents: parseInt(acc.amount_spent || '0', 10),
          businessName: acc.business?.name || null,
        }))
      : [];

    return {
      success: true,
      user: { id: meData.id, name: meData.name },
      businesses,
      adAccounts,
      grantedPermissions,
      missingPermissions,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Impossible de joindre Meta Graph API',
    };
  }
}

export async function testMetaConnection(
  accountId: string,
  accessToken: string
): Promise<{ success: boolean; accountName?: string; currency?: string; error?: string }> {
  try {
    const cleanAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const url = `https://graph.facebook.com/v20.0/${cleanAccountId}?fields=name,account_status,currency,amount_spent&access_token=${encodeURIComponent(accessToken.trim())}`;

    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || `Erreur Meta API (${res.status})`,
      };
    }

    return {
      success: true,
      accountName: data.name || 'Meta Ad Account',
      currency: data.currency || 'USD',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Impossible de contacter les serveurs Meta Graph API',
    };
  }
}

export async function fetchMetaCampaignsAndInsights(
  accountId: string,
  accessToken: string,
  exchangeRateToMAD = 10.0,
  datePreset: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d' | 'maximum' = 'last_30d'
) {
  try {
    const cleanAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const cleanToken = encodeURIComponent(accessToken.trim());

    // 1. Fetch campaigns
    const campaignsUrl = `https://graph.facebook.com/v20.0/${cleanAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&limit=100&access_token=${cleanToken}`;
    const campRes = await fetch(campaignsUrl);
    const campData = await campRes.json();

    if (!campRes.ok || campData.error) {
      throw new Error(campData.error?.message || 'Erreur lors de la récupération des campagnes Meta');
    }

    const rawCampaigns: MetaCampaignDetails[] = campData.data || [];

    // 2. Fetch insights
    const insightsUrl = `https://graph.facebook.com/v20.0/${cleanAccountId}/insights?level=campaign&date_preset=${datePreset}&fields=campaign_id,campaign_name,spend,impressions,clicks,cpc,cpm,ctr,actions,action_values,purchase_roas&limit=100&access_token=${cleanToken}`;
    const insRes = await fetch(insightsUrl);
    const insData = await insRes.json();
    const insightsList: MetaCampaignInsight[] = insData.data || [];

    const insightsMap = new Map<string, MetaCampaignInsight>();
    insightsList.forEach((ins) => {
      insightsMap.set(ins.campaign_id, ins);
    });

    // 3. Map into unified model
    return rawCampaigns.map((camp) => {
      const insight = insightsMap.get(camp.id);
      const rawSpend = insight ? parseFloat(insight.spend || '0') : 0;
      const spendInMAD = parseFloat((rawSpend * exchangeRateToMAD).toFixed(2));

      const impressions = insight ? parseInt(insight.impressions || '0', 10) : 0;
      const clicks = insight ? parseInt(insight.clicks || '0', 10) : 0;
      const ctr = insight ? parseFloat(insight.ctr || '0') : 0;
      const rawCpc = insight ? parseFloat(insight.cpc || '0') : 0;
      const cpcInMAD = parseFloat((rawCpc * exchangeRateToMAD).toFixed(2));

      let purchases = 0;
      let revenue = 0;
      let roas = 0;

      if (insight?.actions) {
        const purchaseAction = insight.actions.find(
          (a) =>
            a.action_type === 'purchase' ||
            a.action_type === 'omni_purchase' ||
            a.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        if (purchaseAction) purchases = parseInt(purchaseAction.value || '0', 10);
      }

      if (insight?.action_values) {
        const purchaseValue = insight.action_values.find(
          (a) =>
            a.action_type === 'purchase' ||
            a.action_type === 'omni_purchase' ||
            a.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        if (purchaseValue) {
          revenue = parseFloat((parseFloat(purchaseValue.value || '0') * exchangeRateToMAD).toFixed(2));
        }
      }

      if (insight?.purchase_roas && insight.purchase_roas.length > 0) {
        roas = parseFloat(parseFloat(insight.purchase_roas[0].value || '0').toFixed(2));
      } else if (spendInMAD > 0 && revenue > 0) {
        roas = parseFloat((revenue / spendInMAD).toFixed(2));
      }

      const cpaInMAD = purchases > 0 ? parseFloat((spendInMAD / purchases).toFixed(2)) : 0;

      let recommendation = 'LEARNING';
      if (roas >= 4.0 && purchases >= 3) {
        recommendation = 'SCALE';
      } else if (roas >= 2.2) {
        recommendation = 'OPTIMIZE';
      } else if (spendInMAD > 250 && roas < 1.8) {
        recommendation = 'PAUSE';
      }

      const rawDailyBudget = camp.daily_budget ? parseFloat(camp.daily_budget) / 100 : 0;
      const dailyBudgetMAD = parseFloat((rawDailyBudget * exchangeRateToMAD).toFixed(2));

      return {
        externalCampaignId: camp.id,
        name: camp.name,
        status: camp.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
        objective: camp.objective || 'CONVERSIONS',
        dailyBudget: dailyBudgetMAD,
        totalSpend: spendInMAD,
        impressions,
        clicks,
        ctr,
        cpc: cpcInMAD,
        conversions: purchases,
        conversionValue: revenue,
        cpa: cpaInMAD,
        roas,
        recommendation,
        startDate: camp.start_time ? new Date(camp.start_time) : null,
      };
    });
  } catch (err: any) {
    console.error('Meta API fetch error:', err);
    throw err;
  }
}

export async function fetchMetaDailyAccountInsights(
  accountId: string,
  accessToken: string,
  exchangeRateToMAD = 10.0,
  datePreset: 'last_7d' | 'last_30d' | 'last_90d' | 'maximum' = 'last_30d'
) {
  const cleanAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  const cleanToken = encodeURIComponent(accessToken.trim());

  const url = `https://graph.facebook.com/v20.0/${cleanAccountId}/insights?time_increment=1&date_preset=${datePreset}&fields=date_start,spend,impressions,clicks,cpc,cpm,ctr,actions,action_values,purchase_roas&limit=90&access_token=${cleanToken}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Erreur lors de la récupération des dépenses quotidiennes Meta');
  }

  const rows: MetaDailyAccountInsight[] = data.data || [];

  return rows.map((row) => {
    const rawSpend = parseFloat(row.spend || '0');
    const spendMAD = parseFloat((rawSpend * exchangeRateToMAD).toFixed(2));
    const impressions = parseInt(row.impressions || '0', 10);
    const clicks = parseInt(row.clicks || '0', 10);
    const cpcMAD = clicks > 0 ? parseFloat((spendMAD / clicks).toFixed(2)) : 0;

    let conversions = 0;
    let revenueMAD = 0;

    if (row.actions) {
      const p = row.actions.find(
        (a) =>
          a.action_type === 'purchase' ||
          a.action_type === 'omni_purchase' ||
          a.action_type === 'offsite_conversion.fb_pixel_purchase'
      );
      if (p) conversions = parseInt(p.value || '0', 10);
    }

    if (row.action_values) {
      const pv = row.action_values.find(
        (a) =>
          a.action_type === 'purchase' ||
          a.action_type === 'omni_purchase' ||
          a.action_type === 'offsite_conversion.fb_pixel_purchase'
      );
      if (pv) revenueMAD = parseFloat((parseFloat(pv.value || '0') * exchangeRateToMAD).toFixed(2));
    }

    const roas = spendMAD > 0 && revenueMAD > 0 ? parseFloat((revenueMAD / spendMAD).toFixed(2)) : 0;
    const cpa = conversions > 0 ? parseFloat((spendMAD / conversions).toFixed(2)) : 0;

    return {
      date: new Date(`${row.date_start}T00:00:00.000Z`),
      spend: spendMAD,
      impressions,
      clicks,
      conversions,
      revenue: revenueMAD,
      roas,
      cpa,
      cpc: cpcMAD,
    };
  });
}
