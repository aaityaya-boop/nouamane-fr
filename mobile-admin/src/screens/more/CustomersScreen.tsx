import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  Crown,
  MapPin,
  ShoppingBag,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { CONFIG, formatMAD, formatDate } from '../../constants/config';
import { api } from '../../services/api';

export function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'frequent'>('all');

  const fetchCustomers = useCallback(async (query = search, activeFilter = filter) => {
    try {
      const res = await api.getCustomers(query, activeFilter);
      if (res && res.success) {
        setCustomers(res.customers || []);
        setTotalCount(res.totalCount || (res.customers ? res.customers.length : 0));
      }
    } catch (err: any) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filter]);

  useEffect(() => {
    setLoading(true);
    fetchCustomers(search, filter);
  }, [filter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search, filter);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers(search, filter);
  };

  const handleCall = (phone: string) => {
    if (!phone) {
      Alert.alert('Numéro manquant', 'Ce client n\'a pas de numéro de téléphone enregistré.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (cleanPhone: string, name: string) => {
    if (!cleanPhone) {
      Alert.alert('Numéro manquant', 'Ce client n\'a pas de numéro valide.');
      return;
    }
    const clean = cleanPhone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Bonjour ${name || 'Cher client'}, NAY Parfum vous contacte concernant vos commandes.`);
    Linking.openURL(`https://wa.me/${clean}?text=${text}`);
  };

  const renderCustomerItem = ({ item }: { item: any }) => {
    const isVip = item.isVip || item.tier === 'DIAMOND' || item.tier === 'GOLD';
    const initials = (item.name || 'C')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, isVip && styles.avatarVip]}>
              <Text style={[styles.avatarText, isVip && styles.avatarTextVip]}>{initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
                {isVip && (
                  <View style={styles.vipBadge}>
                    <Crown size={12} color="#b45309" />
                    <Text style={styles.vipBadgeText}>{item.tier || 'VIP'}</Text>
                  </View>
                )}
              </View>
              {item.city && (
                <View style={styles.cityRow}>
                  <MapPin size={12} color={COLORS.textMuted} />
                  <Text style={styles.cityText}>{item.city}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ShoppingBag size={13} color={COLORS.skyBlue} />
              <Text style={styles.statLabel}>Commandes</Text>
            </View>
            <Text style={styles.statValue}>{item.ordersCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={13} color="#10b981" />
              <Text style={styles.statLabel}>Total Dépensé</Text>
            </View>
            <Text style={[styles.statValue, { color: '#059669' }]}>{formatMAD(item.totalSpent)}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={() => handleCall(item.phone || item.cleanPhone)}
            activeOpacity={0.8}
          >
            <Phone size={15} color="#0284c7" />
            <Text style={styles.callBtnText}>Appeler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.waBtn]}
            onPress={() => handleWhatsApp(item.cleanPhone || item.phone, item.name)}
            activeOpacity={0.8}
          >
            <MessageSquare size={15} color="#16a34a" />
            <Text style={styles.waBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {item.lastOrderDate && (
          <Text style={styles.lastOrderDate}>
            Dernière commande : {formatDate(item.lastOrderDate)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher nom, téléphone, ville..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.tabBtn, filter === 'all' && styles.tabBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.tabBtnText, filter === 'all' && styles.tabBtnTextActive]}>
              Tous ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, filter === 'vip' && styles.tabBtnActive]}
            onPress={() => setFilter('vip')}
          >
            <Crown size={13} color={filter === 'vip' ? '#fff' : '#b45309'} />
            <Text style={[styles.tabBtnText, filter === 'vip' && styles.tabBtnTextActive]}>
              VIP & Gold
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, filter === 'frequent' && styles.tabBtnActive]}
            onPress={() => setFilter('frequent')}
          >
            <Text style={[styles.tabBtnText, filter === 'frequent' && styles.tabBtnTextActive]}>
              Fidèles (2+)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.skyBlue} />
          <Text style={styles.loadingText}>Chargement des clients...</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item: any) => item.id || item.cleanPhone}
          renderItem={renderCustomerItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.skyBlue} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Aucun client trouvé</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'Modifiez votre recherche' : 'Les clients ayant commandé apparaîtront ici.'}
              </Text>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabBtnTextActive: {
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
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarVip: {
    backgroundColor: '#fef3c7',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0284c7',
  },
  avatarTextVip: {
    color: '#b45309',
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
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cityText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: COLORS.border,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  callBtn: {
    backgroundColor: '#e0f2fe',
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  waBtn: {
    backgroundColor: '#dcfce7',
  },
  waBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  lastOrderDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
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
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
