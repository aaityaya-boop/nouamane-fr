import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { formatMAD, formatDateShort } from '../../constants/config';
import {
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

export function CashScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCourier, setExpandedCourier] = useState<string | null>(null);

  const fetchCash = useCallback(async () => {
    try {
      const res = await api.getCashSummary();
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      console.warn('Error fetching cash:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCash();
  }, [fetchCash]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCash();
  };

  const summary = data?.summary;
  const couriers = data?.couriers || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollBody}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Top Banner Overview */}
      <View style={styles.topCard}>
        <View style={styles.topCardHeader}>
          <View style={styles.iconCircle}>
            <CreditCard size={22} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.topLabel}>Caisse & Encaissements</Text>
            <Text style={styles.topSub}>Suivi du recouvrement Cash on Delivery (COD)</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Encaissé / Livré</Text>
            <Text style={[styles.metricVal, { color: COLORS.success }]}>
              {formatMAD(summary?.deliveredCollected)}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>En cours livreurs</Text>
            <Text style={[styles.metricVal, { color: COLORS.warning }]}>
              {formatMAD(summary?.pendingWithCouriers)}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total en circulation</Text>
            <Text style={[styles.metricVal, { color: COLORS.primary }]}>
              {formatMAD(summary?.totalInCirculation)}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Valeur retours colis</Text>
            <Text style={[styles.metricVal, { color: COLORS.danger }]}>
              {formatMAD(summary?.returnedValue)}
            </Text>
          </View>
        </View>
      </View>

      {/* Couriers List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recouvrement par Transporteur ({couriers.length})</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.couriersList}>
          {couriers.map((item: any) => {
            const isExpanded = expandedCourier === item.courier;
            return (
              <View key={item.courier} style={styles.courierCard}>
                <TouchableOpacity
                  style={styles.courierCardHeader}
                  onPress={() => setExpandedCourier(isExpanded ? null : item.courier)}
                  activeOpacity={0.8}
                >
                  <View style={styles.courierIconWrap}>
                    <Truck size={18} color={COLORS.textPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courierName}>{item.courier}</Text>
                    <Text style={styles.courierOrdersCount}>
                      {item.ordersCount} colis traités au total
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={18} color={COLORS.textSecondary} />
                  ) : (
                    <ChevronDown size={18} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>

                <View style={styles.courierStatsRow}>
                  <View style={styles.cStat}>
                    <Text style={styles.cStatLabel}>Livrées :</Text>
                    <Text style={[styles.cStatVal, { color: COLORS.success }]}>
                      {formatMAD(item.deliveredAmount)} ({item.deliveredCount})
                    </Text>
                  </View>
                  <View style={styles.cStat}>
                    <Text style={styles.cStatLabel}>En route :</Text>
                    <Text style={[styles.cStatVal, { color: COLORS.warning }]}>
                      {formatMAD(item.shippedPendingAmount)} ({item.shippedPendingCount})
                    </Text>
                  </View>
                </View>

                {/* Expanded Orders preview */}
                {isExpanded && item.orders?.length > 0 && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.expandedTitle}>Derniers colis confiés :</Text>
                    {item.orders.map((ord: any) => (
                      <View key={ord.id} style={styles.orderMiniRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orderMiniNum}>
                            #{ord.orderNumber} • {ord.customerName} ({ord.city})
                          </Text>
                          {ord.trackingNumber && (
                            <Text style={styles.orderMiniTrack}>Suivi : {ord.trackingNumber}</Text>
                          )}
                        </View>
                        <Text style={styles.orderMiniTotal}>{formatMAD(ord.total)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollBody: {
    padding: SPACING.lg,
    paddingBottom: 40,
    gap: SPACING.lg,
  },
  topCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  topCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  topSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  metricBox: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  couriersList: {
    gap: SPACING.md,
  },
  courierCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  courierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  courierIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  courierOrdersCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  courierStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cStat: {
    flex: 1,
  },
  cStatLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  cStatVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  expandedContent: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  expandedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  orderMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  orderMiniNum: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  orderMiniTrack: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  orderMiniTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
