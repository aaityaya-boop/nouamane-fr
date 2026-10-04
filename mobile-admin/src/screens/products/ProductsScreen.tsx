import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { formatMAD } from '../../constants/config';
import {
  Search,
  Package,
  Plus,
  Minus,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from 'lucide-react-native';

export function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.getProducts();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err: any) {
      console.warn('Error fetching inventory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Immediate stock update syncing directly to PostgreSQL and website
  const handleStockAdjust = async (productId: number, newStock: number) => {
    if (newStock < 0) return;
    setUpdatingId(productId);

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock, inStock: newStock > 0 } : p))
    );

    try {
      await api.updateStock(productId, newStock);
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Échec de la mise à jour du stock.');
      fetchProducts(); // Rollback on failure
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProducts = products.filter((prod) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      prod.name?.toLowerCase().includes(q) ||
      prod.brandLabel?.toLowerCase().includes(q) ||
      prod.sku?.toLowerCase().includes(q)
    );
  });

  const renderProductItem = ({ item }: { item: any }) => {
    const isLow = item.stock <= 3 && item.stock > 0;
    const isOut = item.stock <= 0 || !item.inStock;
    const isUpdating = updatingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.prodIconWrap}>
            <Package size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.prodMetaRow}>
              <Text style={styles.brandText}>{item.brandLabel || item.brand || 'NAY Parfum'}</Text>
              {item.sku ? <Text style={styles.skuText}>• SKU: {item.sku}</Text> : null}
            </View>
          </View>
          <Text style={styles.priceText}>{formatMAD(item.price)}</Text>
        </View>

        <View style={styles.divider} />

        {/* Stock Level & Adjuster Row */}
        <View style={styles.stockRow}>
          <View style={styles.stockBadgeContainer}>
            <View
              style={[
                styles.stockPill,
                isOut ? styles.stockPillOut : isLow ? styles.stockPillLow : styles.stockPillOk,
              ]}
            >
              {isOut ? (
                <AlertTriangle size={12} color={COLORS.danger} />
              ) : isLow ? (
                <AlertTriangle size={12} color={COLORS.warning} />
              ) : (
                <CheckCircle2 size={12} color={COLORS.success} />
              )}
              <Text
                style={[
                  styles.stockPillText,
                  isOut ? styles.textOut : isLow ? styles.textLow : styles.textOk,
                ]}
              >
                {isOut ? 'RUPTURE' : isLow ? 'STOCK CRITIQUE' : 'EN STOCK'}
              </Text>
            </View>
            <Text style={styles.stockUnitsText}>
              {item.stock} unité{item.stock > 1 ? 's' : ''} en rayon
            </Text>
          </View>

          {/* +/- Stock Control */}
          <View style={styles.adjusterGroup}>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => handleStockAdjust(item.id, item.stock - 1)}
              disabled={isUpdating || item.stock <= 0}
            >
              <Minus size={15} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.stockCountBox}>
              {isUpdating ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.stockCountText}>{item.stock}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: COLORS.primaryLight }]}
              onPress={() => handleStockAdjust(item.id, item.stock + 1)}
              disabled={isUpdating}
            >
              <Plus size={15} color={COLORS.primaryDark} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
            placeholder="Rechercher parfum, marque, SKU..."
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

      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Chargement du stock magasin...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
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
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
    gap: SPACING.md,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  prodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  prodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  brandText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  skuText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockBadgeContainer: {
    gap: 2,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  stockPillOk: {
    backgroundColor: COLORS.successLight,
  },
  stockPillLow: {
    backgroundColor: COLORS.warningLight,
  },
  stockPillOut: {
    backgroundColor: COLORS.dangerLight,
  },
  stockPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  textOk: {
    color: COLORS.success,
  },
  textLow: {
    color: COLORS.warning,
  },
  textOut: {
    color: COLORS.danger,
  },
  stockUnitsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  adjusterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockCountBox: {
    minWidth: 32,
    alignItems: 'center',
  },
  stockCountText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
