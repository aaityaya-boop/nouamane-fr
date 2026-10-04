import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { formatMAD, formatDateShort } from '../../constants/config';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  CreditCard,
  DollarSign,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react-native';

const PERIOD_TABS = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'yesterday', label: 'Hier' },
  { key: '7days', label: '7 jours' },
  { key: '30days', label: '30 jours' },
  { key: 'all', label: 'Tout' },
];

export function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (p: string) => {
    try {
      setError(null);
      const res = await api.getDashboard(p);
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur de chargement du tableau de bord');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDashboard(period);
  }, [period, fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard(period);
  };

  const metrics = data?.metrics;
  const counts = metrics?.counts;
  const lowStock = data?.lowStock;
  const bestSellers = data?.bestSellers || [];
  const recentActivity = data?.recentActivity || [];
  const canViewFinancials = data?.permissions?.canViewFinancials;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeGreeting}>Bonjour, {user?.name || 'Admin'} 👋</Text>
          <Text style={styles.storeBadge}>NAY Parfum • Panneau Officiel</Text>
        </View>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>{user?.role || 'ADMIN'}</Text>
        </View>
      </View>

      {/* Period Filter Tabs */}
      <View style={styles.periodBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
          {PERIOD_TABS.map((tab) => {
            const active = period === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setPeriod(tab.key)}
                style={[styles.periodPill, active && styles.periodPillActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodText, active && styles.periodTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Chargement des KPIs en temps réel...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Main Financial Card (if allowed) */}
          {canViewFinancials && (
            <View style={styles.revenueCard}>
              <View style={styles.revenueHeader}>
                <View style={styles.revenueIconWrap}>
                  <TrendingUp size={22} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.revenueLabel}>Chiffre d&apos;Affaires ({PERIOD_TABS.find(t => t.key === period)?.label})</Text>
                  <Text style={styles.revenueValue}>{formatMAD(metrics?.revenue)}</Text>
                </View>
              </View>

              <View style={styles.revenueDivider} />

              <View style={styles.revenueSubgrid}>
                <View style={styles.submetricCol}>
                  <Text style={styles.submetricLabel}>Encaissé / Livré</Text>
                  <Text style={[styles.submetricValue, { color: COLORS.success }]}>
                    {formatMAD(metrics?.deliveredRevenue)}
                  </Text>
                </View>
                <View style={styles.submetricCol}>
                  <Text style={styles.submetricLabel}>Panier Moyen (AOV)</Text>
                  <Text style={styles.submetricValue}>{formatMAD(metrics?.aov)}</Text>
                </View>
                <View style={styles.submetricCol}>
                  <Text style={styles.submetricLabel}>En cours livreurs</Text>
                  <Text style={[styles.submetricValue, { color: COLORS.warning }]}>
                    {formatMAD(metrics?.codPending?.amount)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Orders Status Grid */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>État des Commandes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
              <Text style={styles.sectionAction}>Voir toutes ({counts?.total || 0})</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusGrid}>
            <TouchableOpacity
              style={styles.statusBox}
              onPress={() => navigation.navigate('OrdersTab', { filter: 'pending' })}
            >
              <Clock size={18} color={COLORS.warning} />
              <Text style={styles.statusBoxCount}>{counts?.pending || 0}</Text>
              <Text style={styles.statusBoxLabel}>En attente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusBox}
              onPress={() => navigation.navigate('OrdersTab', { filter: 'confirmed' })}
            >
              <CheckCircle2 size={18} color={COLORS.primary} />
              <Text style={styles.statusBoxCount}>{counts?.confirmed || 0}</Text>
              <Text style={styles.statusBoxLabel}>Confirmées</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusBox}
              onPress={() => navigation.navigate('OrdersTab', { filter: 'shipped' })}
            >
              <Truck size={18} color={COLORS.purple} />
              <Text style={styles.statusBoxCount}>{counts?.shipped || 0}</Text>
              <Text style={styles.statusBoxLabel}>Expédiées</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusBox}
              onPress={() => navigation.navigate('OrdersTab', { filter: 'delivered' })}
            >
              <ShoppingBag size={18} color={COLORS.success} />
              <Text style={styles.statusBoxCount}>{counts?.delivered || 0}</Text>
              <Text style={styles.statusBoxLabel}>Livrées</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusBox}
              onPress={() => navigation.navigate('OrdersTab', { filter: 'returned' })}
            >
              <RotateCcw size={18} color={COLORS.danger} />
              <Text style={styles.statusBoxCount}>{(counts?.refused || 0) + (counts?.returned || 0)}</Text>
              <Text style={styles.statusBoxLabel}>Retours / Refus</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusBox}
              onPress={() => navigation.navigate('OrdersTab', { filter: 'cancelled' })}
            >
              <XCircle size={18} color={COLORS.textMuted} />
              <Text style={styles.statusBoxCount}>{counts?.cancelled || 0}</Text>
              <Text style={styles.statusBoxLabel}>Annulées</Text>
            </TouchableOpacity>
          </View>

          {/* Low Stock Alerts */}
          {lowStock?.count > 0 && (
            <View style={styles.alertCard}>
              <View style={styles.alertCardHeader}>
                <View style={styles.alertIconWrap}>
                  <AlertTriangle size={18} color={COLORS.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertCardTitle}>
                    {lowStock.count} Produit{lowStock.count > 1 ? 's' : ''} en Alerte Stock
                  </Text>
                  <Text style={styles.alertCardSub}>Stock critique ≤ 3 flacons restants</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('ProductsTab')}>
                  <ChevronRight size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>

              <View style={styles.alertProductsList}>
                {lowStock.items.slice(0, 3).map((item: any) => (
                  <View key={item.id} style={styles.alertProductRow}>
                    <Text style={styles.alertProdName} numberOfLines={1}>{item.name}</Text>
                    <View style={[styles.stockPill, item.stock <= 0 ? styles.stockPillOut : styles.stockPillLow]}>
                      <Text style={[styles.stockPillText, item.stock <= 0 ? styles.stockTextOut : styles.stockTextLow]}>
                        {item.stock <= 0 ? 'RUPTURE' : `${item.stock} restant${item.stock > 1 ? 's' : ''}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Best Selling Products */}
          {bestSellers.length > 0 && (
            <View style={styles.cardBox}>
              <View style={styles.cardBoxHeader}>
                <Sparkles size={18} color={COLORS.primary} />
                <Text style={styles.cardBoxTitle}>Meilleures Ventes ({PERIOD_TABS.find(t => t.key === period)?.label})</Text>
              </View>
              <View style={styles.bestSellersList}>
                {bestSellers.map((prod: any, idx: number) => (
                  <View key={idx} style={styles.bestSellerRow}>
                    <View style={styles.bestRank}>
                      <Text style={styles.bestRankText}>#{idx + 1}</Text>
                    </View>
                    <Text style={styles.bestProdName} numberOfLines={1}>{prod.name}</Text>
                    <Text style={styles.bestProdQty}>{prod.quantity} vendus</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recent Activity Timeline */}
          {recentActivity.length > 0 && (
            <View style={styles.cardBox}>
              <View style={styles.cardBoxHeader}>
                <Clock size={18} color={COLORS.textSecondary} />
                <Text style={styles.cardBoxTitle}>Activité Récente en Direct</Text>
              </View>
              <View style={styles.activityList}>
                {recentActivity.map((act: any) => (
                  <View key={act.id} style={styles.activityRow}>
                    <View style={styles.activityDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityTitle}>{act.title}</Text>
                      {act.orderNumber && (
                        <Text style={styles.activityOrder}>
                          #{act.orderNumber} • {act.customerName} ({formatMAD(act.orderTotal)})
                        </Text>
                      )}
                      <Text style={styles.activityTime}>{formatDateShort(act.createdAt)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.navy,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeGreeting: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '800',
  },
  storeBadge: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  roleTagText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  periodBar: {
    backgroundColor: COLORS.navyCard,
    paddingVertical: SPACING.sm,
  },
  periodScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  periodPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  periodPillActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  periodTextActive: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  loaderText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  scrollBody: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  errorBanner: {
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  revenueCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  revenueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  revenueSubgrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submetricCol: {
    flex: 1,
  },
  submetricLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  submetricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statusBox: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statusBoxCount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginVertical: 4,
  },
  statusBoxLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  alertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  alertCardSub: {
    fontSize: 10,
    color: '#991b1b',
  },
  alertProductsList: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
  },
  alertProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  alertProdName: {
    flex: 1,
    fontSize: 12,
    color: '#7f1d1d',
    fontWeight: '600',
    marginRight: 8,
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  stockPillLow: {
    backgroundColor: COLORS.warningLight,
  },
  stockPillOut: {
    backgroundColor: '#fee2e2',
  },
  stockPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  stockTextLow: {
    color: COLORS.warning,
  },
  stockTextOut: {
    color: COLORS.danger,
  },
  cardBox: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bestSellersList: {
    gap: SPACING.sm,
  },
  bestSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  bestRank: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestRankText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  bestProdName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bestProdQty: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  activityList: {
    gap: SPACING.md,
  },
  activityRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  activityOrder: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  activityTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
