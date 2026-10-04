import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import {
  ShieldCheck,
  UserCheck,
  Phone,
  Mail,
  Circle,
  Briefcase,
  Users,
} from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { api } from '../../services/api';

export function TeamScreen() {
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await api.getTeam();
      if (res && res.success) {
        setMembers(res.members || []);
        setStats(res.stats || null);
      }
    } catch (err: any) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeam();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Propriétaire';
      case 'CO_OWNER':
        return 'Co-Propriétaire';
      case 'ADMIN':
        return 'Administrateur';
      case 'ORDER_MANAGER':
        return 'Gestionnaire Commandes';
      case 'STOCK_MANAGER':
        return 'Gestionnaire Stock';
      case 'SUPPORT':
        return 'Service Client';
      case 'ACCOUNTANT':
        return 'Comptable';
      case 'MARKETING':
        return 'Marketing';
      case 'VIEWER':
        return 'Lecteur';
      default:
        return role;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    if (role === 'OWNER' || role === 'CO_OWNER') {
      return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    }
    if (role === 'ADMIN') {
      return { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' };
    }
    if (role === 'ORDER_MANAGER' || role === 'STOCK_MANAGER') {
      return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' };
    }
    return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
  };

  const renderMember = ({ item }: { item: any }) => {
    const roleStyle = getRoleBadgeStyle(item.role);
    const initials = (item.name || 'E')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {item.isOnline && (
              <View style={styles.onlineDot} />
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
                <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>
                  {getRoleLabel(item.role)}
                </Text>
              </View>
            </View>

            {item.jobTitle && (
              <View style={styles.jobRow}>
                <Briefcase size={12} color={COLORS.textMuted} />
                <Text style={styles.jobText}>{item.jobTitle}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact info */}
        <View style={styles.infoSection}>
          {item.email && (
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => Linking.openURL(`mailto:${item.email}`)}
            >
              <Mail size={14} color={COLORS.textMuted} />
              <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
            </TouchableOpacity>
          )}

          {item.phone && (
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <Phone size={14} color="#0284c7" />
              <Text style={[styles.infoText, { color: '#0284c7', fontWeight: '500' }]}>{item.phone}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.statusRow}>
            <Circle
              size={8}
              fill={item.status === 'ACTIVE' ? '#10b981' : '#94a3b8'}
              color={item.status === 'ACTIVE' ? '#10b981' : '#94a3b8'}
            />
            <Text style={styles.statusText}>
              {item.status === 'ACTIVE' ? 'Compte Actif' : 'Désactivé'}
            </Text>
          </View>

          {item.isOnline ? (
            <Text style={[styles.presenceText, { color: '#16a34a' }]}>En ligne</Text>
          ) : (
            <Text style={styles.presenceText}>Hors ligne</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      {stats && (
        <View style={styles.statsHeader}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statTitle}>Collaborateurs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.online}</Text>
            <Text style={styles.statTitle}>En ligne</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.skyBlue }]}>{stats.active}</Text>
            <Text style={styles.statTitle}>Actifs</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.skyBlue} />
          <Text style={styles.loadingText}>Chargement de l'équipe...</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item: any) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.skyBlue} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Aucun membre trouvé</Text>
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
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  statTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  jobText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  infoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.text,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  presenceText: {
    fontSize: 11,
    fontWeight: '600',
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
