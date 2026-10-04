import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { formatMAD, formatDateShort } from '../../constants/config';
import {
  Search,
  Filter,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  XCircle,
  ChevronRight,
  Package,
} from 'lucide-react-native';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'shipped', label: 'Expédiées' },
  { key: 'delivered', label: 'Livrées' },
  { key: 'returned', label: 'Retours / Refus' },
  { key: 'cancelled', label: 'Annulées' },
];

export function OrdersListScreen({ route, navigation }: any) {
  const initialFilter = route?.params?.filter || 'ALL';
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err: any) {
      console.warn('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Filter & Search
  const filteredOrders = orders.filter((order) => {
    // 1. Status Filter
    if (selectedFilter !== 'ALL') {
      if (selectedFilter === 'pending' && !(order.status === 'pending' || order.status === 'en-attente' || order.status === 'unconfirmed')) return false;
      if (selectedFilter === 'confirmed' && !(order.status === 'confirmed' || order.status === 'processing')) return false;
      if (selectedFilter === 'shipped' && order.status !== 'shipped') return false;
      if (selectedFilter === 'delivered' && order.status !== 'delivered') return false;
      if (selectedFilter === 'returned' && !(order.status === 'returned' || order.status === 'refused')) return false;
      if (selectedFilter === 'cancelled' && !(order.status === 'cancelled' || order.status === 'annule')) return false;
    }

    // 2. Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNumber = order.orderNumber?.toLowerCase().includes(q);
      const matchName = order.customerName?.toLowerCase().includes(q);
      const matchPhone = order.customerPhone?.includes(q);
      const matchCity = order.shippingCity?.toLowerCase().includes(q);
      return matchNumber || matchName || matchPhone || matchCity;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return { label: 'Livrée', bg: COLORS.successLight, text: COLORS.success, border: COLORS.successBorder };
      case 'shipped':
        return { label: 'Expédiée', bg: COLORS.purpleLight, text: COLORS.purple, border: '#ddd6fe' };
      case 'confirmed':
      case 'processing':
        return { label: 'Confirmée', bg: COLORS.primaryLight, text: COLORS.primaryDark, border: '#bae6fd' };
      case 'refused':
      case 'returned':
        return { label: 'Retour / Refus', bg: COLORS.dangerLight, text: COLORS.danger, border: COLORS.dangerBorder };
      case 'cancelled':
      case 'annule':
        return { label: 'Annulée', bg: '#f1f5f9', text: COLORS.textMuted, border: '#e2e8f0' };
      default:
        return { label: 'En attente', bg: COLORS.warningLight, text: COLORS.warning, border: COLORS.warningBorder };
    }
  };

  const handleCall = (phone: string) => {
    const clean = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  const handleWhatsApp = (phone: string, orderNumber: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '212' + clean.slice(1);
    const msg = encodeURIComponent(`Bonjour, service client NAY Parfum concernant votre commande #${orderNumber}.`);
    Linking.openURL(`https://wa.me/${clean}?text=${msg}`);
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const badge = getStatusBadge(item.status);
    let itemsParsed: any[] = [];
    try {
      itemsParsed = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
    } catch {}

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('OrderDetail', { order: item })}
      >
        {/* Top Header */}
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDateShort(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Customer & Destination */}
        <View style={styles.customerRow}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={styles.cityPill}>
            <MapPin size={11} color={COLORS.textSecondary} />
            <Text style={styles.cityText}>{item.shippingCity || 'Maroc'}</Text>
          </View>
        </View>

        {/* Items Summary */}
        <View style={styles.itemsSummary}>
          <Package size={13} color={COLORS.textMuted} />
          <Text style={styles.itemsSummaryText} numberOfLines={1}>
            {itemsParsed.length > 0
              ? itemsParsed.map((p) => `${p.quantity || 1}x ${p.name}`).join(' • ')
              : 'Articles parfum'}
          </Text>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.totalValue}>{formatMAD(item.total)}</Text>

          {/* Quick Actions */}
          <View style={styles.actionsGroup}>
            {item.customerPhone && (
              <>
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => handleCall(item.customerPhone)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Phone size={15} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionIconBtn, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}
                  onPress={() => handleWhatsApp(item.customerPhone, item.orderNumber)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MessageCircle size={15} color="#16a34a" />
                </TouchableOpacity>
              </>
            )}

            <ChevronRight size={18} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchWrapper}>
          <Search size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par client, tél, ville, #..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <XCircle size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs Horizontal */}
      <View style={styles.filterScrollWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item: any) => item.key}
          contentContainerStyle={styles.filterListContent}
          renderItem={({ item }: { item: any }) => {
            const active = selectedFilter === item.key;
            return (
              <TouchableOpacity
                onPress={() => setSelectedFilter(item.key)}
                style={[styles.filterPill, active && styles.filterPillActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item: any) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Aucune commande trouvée</Text>
              <Text style={styles.emptySub}>Essayez de modifier votre recherche ou filtre.</Text>
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
  searchBarContainer: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  filterScrollWrapper: {
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterListContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSubtle,
  },
  filterPillActive: {
    backgroundColor: COLORS.navy,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: COLORS.textWhite,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: 40,
    gap: SPACING.md,
  },
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  orderDate: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  cityText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  itemsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: SPACING.xs,
  },
  itemsSummaryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
