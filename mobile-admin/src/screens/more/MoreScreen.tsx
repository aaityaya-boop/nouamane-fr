import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {
  Users,
  ShieldCheck,
  Activity,
  Settings,
  ExternalLink,
  LogOut,
  ChevronRight,
  Shield,
  Crown,
} from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export function MoreScreen({ navigation }: { navigation: any }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter de NAY Admin ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getRoleName = (role?: string) => {
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
      default:
        return role || 'Collaborateur';
    }
  };

  const menuItems = [
    {
      id: 'customers',
      title: 'Clients & CRM',
      subtitle: 'Historique, segmentation VIP, contacts',
      icon: Users,
      iconColor: COLORS.skyBlue,
      iconBg: '#e0f2fe',
      screen: 'Customers',
    },
    {
      id: 'team',
      title: 'Équipe & Accès',
      subtitle: 'Collaborateurs, rôles & statut en direct',
      icon: ShieldCheck,
      iconColor: '#8b5cf6',
      iconBg: '#ede9fe',
      screen: 'Team',
    },
    {
      id: 'audit',
      title: 'Journal d\'Audit',
      subtitle: 'Traçabilité des actions et changements',
      icon: Activity,
      iconColor: '#10b981',
      iconBg: '#dcfce7',
      screen: 'AuditLogs',
    },
    {
      id: 'settings',
      title: 'Paramètres & Sécurité',
      subtitle: 'Biométrie Face ID, URL API, notifications',
      icon: Settings,
      iconColor: '#f59e0b',
      iconBg: '#fef3c7',
      screen: 'Settings',
    },
  ];

  const initials = (user?.name || user?.email || 'A')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isOwner = user?.role === 'OWNER' || user?.role === 'CO_OWNER';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Administrateur'}</Text>
            {isOwner && <Crown size={16} color="#b45309" />}
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Shield size={11} color="#0284c7" />
              <Text style={styles.roleBadgeText}>{getRoleName(user?.role)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Menu List */}
      <View style={styles.menuCard}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === menuItems.length - 1;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, !isLast && styles.menuItemBorder]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                <Icon size={20} color={item.iconColor} />
              </View>

              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>

              <ChevronRight size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Store Link */}
      <TouchableOpacity
        style={styles.storeCard}
        onPress={() => Linking.openURL('https://nayparfum.ma')}
        activeOpacity={0.8}
      >
        <View style={styles.storeLeft}>
          <View style={styles.storeIconBox}>
            <ExternalLink size={18} color="#0284c7" />
          </View>
          <View>
            <Text style={styles.storeTitle}>Ouvrir la boutique en ligne</Text>
            <Text style={styles.storeSub}>nayparfum.ma</Text>
          </View>
        </View>
        <ChevronRight size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.footerVersion}>NAY Admin Mobile v1.0 • Tous droits réservés</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#bae6fd',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0284c7',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextBox: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  storeSub: {
    fontSize: 12,
    color: COLORS.skyBlue,
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  footerVersion: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
