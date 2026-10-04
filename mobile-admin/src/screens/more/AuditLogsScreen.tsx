import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  ShieldAlert,
  Clock,
  User,
  Activity,
  FileText,
  Package,
  Layers,
  Settings,
} from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { formatDate } from '../../constants/config';
import { api } from '../../services/api';

export function AuditLogsScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'ALL' | 'TODAY' | 'WEEK'>('ALL');

  const fetchLogs = useCallback(async (activePeriod = period) => {
    try {
      const res = await api.getActivityLogs(activePeriod, 50);
      if (res && res.success) {
        setLogs(res.logs || []);
        setStats(res.stats || null);
      }
    } catch (err: any) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchLogs(period);
  }, [period]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs(period);
  };

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN')) {
      return { bg: '#e0f2fe', text: '#0284c7', label: 'Connexion' };
    }
    if (act.includes('ORDER') || act.includes('STATUS')) {
      return { bg: '#ede9fe', text: '#7c3aed', label: 'Commande' };
    }
    if (act.includes('STOCK') || act.includes('INVENTORY')) {
      return { bg: '#fef3c7', text: '#b45309', label: 'Stock' };
    }
    if (act.includes('DELETE') || act.includes('REMOVE')) {
      return { bg: '#fee2e2', text: '#dc2626', label: 'Suppression' };
    }
    return { bg: '#f1f5f9', text: '#475569', label: action || 'Action' };
  };

  const renderLogItem = ({ item }: { item: any }) => {
    const badge = getActionBadge(item.action);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.userName || 'A').substring(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.userName}>{item.userName || 'Système'}</Text>
              {item.user?.role && (
                <Text style={styles.userRole}>{item.user.role}</Text>
              )}
            </View>
          </View>

          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            {item.entityType && (
              <View style={styles.entityTag}>
                <Text style={styles.entityTagText}>{item.entityType}</Text>
              </View>
            )}
          </View>
          <View style={styles.timeRow}>
            <Clock size={12} color={COLORS.textMuted} />
            <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.periodBar}>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'ALL' && styles.periodBtnActive]}
          onPress={() => setPeriod('ALL')}
        >
          <Text style={[styles.periodBtnText, period === 'ALL' && styles.periodBtnTextActive]}>
            Tout ({stats?.total || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodBtn, period === 'TODAY' && styles.periodBtnActive]}
          onPress={() => setPeriod('TODAY')}
        >
          <Text style={[styles.periodBtnText, period === 'TODAY' && styles.periodBtnTextActive]}>
            Aujourd'hui ({stats?.todayTotal || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodBtn, period === 'WEEK' && styles.periodBtnActive]}
          onPress={() => setPeriod('WEEK')}
        >
          <Text style={[styles.periodBtnText, period === 'WEEK' && styles.periodBtnTextActive]}>
            7 derniers jours
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.skyBlue} />
          <Text style={styles.loadingText}>Chargement du journal d'audit...</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item: any) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.skyBlue} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Activity size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Aucune activité enregistrée</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  periodBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  periodBtnActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  periodBtnTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  userRole: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entityTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  entityTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 12,
  },
});
