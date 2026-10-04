import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { formatMAD, formatDateShort } from '../../constants/config';
import {
  Phone,
  MessageCircle,
  Copy,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  RotateCcw,
  XCircle,
  FileText,
  Send,
} from 'lucide-react-native';

const ALL_STATUSES = [
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmée' },
  { key: 'processing', label: 'En préparation' },
  { key: 'shipped', label: 'Expédiée' },
  { key: 'delivered', label: 'Livrée & Encaissée' },
  { key: 'refused', label: 'Refusée' },
  { key: 'returned', label: 'Retournée' },
  { key: 'cancelled', label: 'Annulée' },
];

export function OrderDetailScreen({ route, navigation }: any) {
  const initialOrder = route?.params?.order;
  const [order, setOrder] = useState<any>(initialOrder || {});
  const [updating, setUpdating] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  let items: any[] = [];
  try {
    items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
  } catch {}

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copié', `${label} copié dans le presse-papiers.`);
  };

  const handleCall = () => {
    const clean = (order.customerPhone || '').replace(/[^0-9+]/g, '');
    if (clean) Linking.openURL(`tel:${clean}`);
  };

  const handleWhatsApp = () => {
    let clean = (order.customerPhone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '212' + clean.slice(1);
    const msg = encodeURIComponent(`Bonjour, service client NAY Parfum concernant votre commande #${order.orderNumber}.`);
    Linking.openURL(`https://wa.me/${clean}?text=${msg}`);
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    setShowStatusModal(false);
    try {
      const updated = await api.updateOrder(order.id, {
        status: newStatus,
        customNote: customNote || undefined,
        carrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
      });

      setOrder(updated);
      Alert.alert('Statut mis à jour', `La commande #${order.orderNumber} est passée à "${newStatus}".`);
      setCustomNote('');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Échec de mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!customNote.trim()) return;
    setUpdating(true);
    try {
      const updated = await api.updateOrder(order.id, {
        customNote: customNote.trim(),
      });
      setOrder(updated);
      setCustomNote('');
      Alert.alert('Note enregistrée', 'Note ajoutée à l\'historique de la commande.');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Échec d\'ajout de note');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollBody}>
      {/* Top Header Card */}
      <View style={styles.topCard}>
        <View style={styles.topRow}>
          <Text style={styles.orderTitle}>Commande #{order.orderNumber}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{order.status?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.orderDateText}>Créée le {formatDateShort(order.createdAt)}</Text>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionRow}>
          {order.status !== 'confirmed' && order.status !== 'delivered' && (
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => handleStatusChange('confirmed')}
              disabled={updating}
            >
              <CheckCircle2 size={16} color={COLORS.textWhite} />
              <Text style={styles.confirmBtnText}>Confirmer la commande</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.changeStatusBtn}
            onPress={() => setShowStatusModal(!showStatusModal)}
          >
            <Text style={styles.changeStatusText}>Changer de statut ▾</Text>
          </TouchableOpacity>
        </View>

        {/* Status Picker Menu */}
        {showStatusModal && (
          <View style={styles.statusMenu}>
            {ALL_STATUSES.map((st) => (
              <TouchableOpacity
                key={st.key}
                style={[styles.statusMenuItem, order.status === st.key && styles.statusMenuItemActive]}
                onPress={() => handleStatusChange(st.key)}
              >
                <Text style={[styles.statusMenuText, order.status === st.key && styles.statusMenuTextActive]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Customer Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Informations Client</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nom :</Text>
          <Text style={styles.infoValue}>{order.customerName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Téléphone :</Text>
          <View style={styles.rowRight}>
            <Text style={styles.infoValuePhone}>{order.customerPhone}</Text>
            <TouchableOpacity onPress={() => handleCopy(order.customerPhone, 'Numéro')}>
              <Copy size={14} color={COLORS.primary} style={{ marginHorizontal: 6 }} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contactButtonsRow}>
          <TouchableOpacity style={styles.phoneActionBtn} onPress={handleCall}>
            <Phone size={15} color={COLORS.primary} />
            <Text style={styles.phoneActionText}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.waActionBtn} onPress={handleWhatsApp}>
            <MessageCircle size={15} color="#16a34a" />
            <Text style={styles.waActionText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ville :</Text>
          <Text style={styles.infoValue}>{order.shippingCity || 'Maroc'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Adresse :</Text>
          <View style={styles.rowRight}>
            <Text style={styles.infoValueAddress}>{order.shippingAddress || 'Non renseignée'}</Text>
            <TouchableOpacity onPress={() => handleCopy(order.shippingAddress, 'Adresse')}>
              <Copy size={14} color={COLORS.primary} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Products Ordered Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Articles Commandés ({items.length})</Text>
        {items.map((prod: any, idx: number) => (
          <View key={idx} style={styles.productItemRow}>
            <View style={styles.prodIconWrap}>
              <Package size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.prodName}>{prod.name}</Text>
              {prod.sku && <Text style={styles.prodSku}>SKU: {prod.sku}</Text>}
              <Text style={styles.prodQtyPrice}>
                {prod.quantity || 1} x {formatMAD(prod.price)}
              </Text>
            </View>
            <Text style={styles.prodTotal}>
              {formatMAD((prod.quantity || 1) * (Number(prod.price) || 0))}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Pricing Breakdown */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Sous-total :</Text>
          <Text style={styles.priceVal}>{formatMAD(order.subtotal)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Frais de livraison :</Text>
          <Text style={styles.priceVal}>{formatMAD(order.shippingCost)}</Text>
        </View>
        {order.discount ? (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Remise :</Text>
            <Text style={[styles.priceVal, { color: COLORS.danger }]}>-{formatMAD(order.discount)}</Text>
          </View>
        ) : null}
        <View style={[styles.priceRow, { marginTop: 4 }]}>
          <Text style={styles.totalLabel}>Total à encaisser :</Text>
          <Text style={styles.totalVal}>{formatMAD(order.total)}</Text>
        </View>
      </View>

      {/* Add Note Section */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Ajouter une Note / Historique</Text>
        <View style={styles.noteInputRow}>
          <TextInput
            style={styles.noteInput}
            placeholder="Ex: Client confirmé, rappel à 15h..."
            placeholderTextColor={COLORS.textMuted}
            value={customNote}
            onChangeText={setCustomNote}
          />
          <TouchableOpacity
            style={styles.sendNoteBtn}
            onPress={handleAddNote}
            disabled={updating || !customNote.trim()}
          >
            {updating ? <ActivityIndicator size="small" color="#fff" /> : <Send size={16} color="#fff" />}
          </TouchableOpacity>
        </View>

        {/* Timeline Events */}
        {order.timeline && order.timeline.length > 0 && (
          <View style={styles.timelineList}>
            <Text style={styles.timelineHeader}>Historique des étapes</Text>
            {order.timeline.map((evt: any) => (
              <View key={evt.id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineTitle}>{evt.title}</Text>
                  {evt.description && <Text style={styles.timelineDesc}>{evt.description}</Text>}
                  <Text style={styles.timelineMeta}>
                    Par {evt.actorName || 'Système'} • {formatDateShort(evt.createdAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
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
    paddingBottom: 60,
    gap: SPACING.lg,
  },
  topCard: {
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  statusPill: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statusPillText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  orderDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  confirmBtnText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  changeStatusBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  changeStatusText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  statusMenu: {
    backgroundColor: COLORS.navyCard,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    padding: SPACING.sm,
    gap: 4,
  },
  statusMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
  },
  statusMenuItemActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
  },
  statusMenuText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  statusMenuTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoValuePhone: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoValueAddress: {
    fontSize: 12,
    color: COLORS.textPrimary,
    maxWidth: 200,
    textAlign: 'right',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.md,
  },
  phoneActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  phoneActionText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  waActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  waActionText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  productItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.xs,
  },
  prodIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  prodSku: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  prodQtyPrice: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  prodTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  priceVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  noteInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  noteInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 12,
    backgroundColor: COLORS.surfaceSubtle,
    color: COLORS.textPrimary,
  },
  sendNoteBtn: {
    width: 42,
    height: 42,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineList: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  timelineHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timelineDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  timelineMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
