import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Shield,
  Fingerprint,
  Globe,
  Bell,
  Info,
  CheckCircle2,
  RefreshCw,
  Server,
} from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { CONFIG } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { api } from '../../services/api';

export function SettingsScreen() {
  const { isBiometricEnabled, isBiometricSupported, toggleBiometrics, user } = useAuth();
  const [apiUrl, setApiUrl] = useState(CONFIG.API_URL);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  useEffect(() => {
    storage.getApiUrl().then((url) => setApiUrl(url));
  }, []);

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim().startsWith('http')) {
      Alert.alert('URL invalide', 'L\'URL du serveur doit commencer par http:// ou https://');
      return;
    }
    await storage.setApiUrl(apiUrl.trim());
    setIsEditingUrl(false);
    Alert.alert('Enregistré', 'L\'URL du serveur a été mise à jour.');
  };

  const handleResetApiUrl = async () => {
    await storage.setApiUrl(CONFIG.API_URL);
    setApiUrl(CONFIG.API_URL);
    setIsEditingUrl(false);
    Alert.alert('Réinitialisé', 'L\'URL par défaut nayparfum.ma a été restaurée.');
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await api.sendTestPush('ORDER');
      Alert.alert('Test Push Envoyé', 'Une notification test a été envoyée avec succès aux appareils abonnés.');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d\'envoyer le test push.');
    } finally {
      setTestingPush(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SÉCURITÉ & ACCÈS</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Fingerprint size={22} color={COLORS.skyBlue} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowTitle}>Déverrouillage biométrique</Text>
              <Text style={styles.rowSubtitle}>
                {isBiometricSupported
                  ? 'Face ID ou empreinte digitale pour ouvrir l\'application'
                  : 'Matériel biométrique non disponible sur cet appareil'}
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={toggleBiometrics}
              disabled={!isBiometricSupported}
              trackColor={{ false: '#cbd5e1', true: COLORS.skyBlue }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* Network & Server */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SERVEUR & CONNEXION</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Server size={22} color="#6366f1" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowTitle}>URL de l'API NAY</Text>
              <Text style={styles.rowSubtitle}>
                Point de terminaison synchronisé avec le site en ligne
              </Text>
            </View>
          </View>

          {isEditingUrl ? (
            <View style={styles.editUrlBox}>
              <TextInput
                style={styles.input}
                value={apiUrl}
                onChangeText={setApiUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.editBtnRow}>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: COLORS.navy }]}
                  onPress={handleSaveApiUrl}
                >
                  <Text style={styles.smallBtnText}>Sauvegarder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: '#e2e8f0' }]}
                  onPress={handleResetApiUrl}
                >
                  <Text style={[styles.smallBtnText, { color: COLORS.navy }]}>Défaut</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.urlDisplayRow}>
              <Text style={styles.urlText} numberOfLines={1}>{apiUrl}</Text>
              <TouchableOpacity onPress={() => setIsEditingUrl(true)}>
                <Text style={styles.modifyText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Notifications Push */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Bell size={22} color="#f59e0b" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowTitle}>Tester les Push Notifications</Text>
              <Text style={styles.rowSubtitle}>
                Envoyer un ping test VAPID Web Push vers votre panneau
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.pushTestBtn}
            onPress={handleTestPush}
            disabled={testingPush}
          >
            {testingPush ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.pushTestBtnText}>Envoyer Notification Test</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* About Application */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À PROPOS</Text>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom de l'application</Text>
            <Text style={styles.infoVal}>NAY Admin Mobile</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoVal}>v1.0.0 (Production)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Boutique en ligne</Text>
            <Text style={styles.infoVal}>nayparfum.ma</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Utilisateur connecté</Text>
            <Text style={styles.infoVal}>{user?.name || user?.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rôle actif</Text>
            <Text style={[styles.infoVal, { color: COLORS.skyBlue, fontWeight: '700' }]}>
              {user?.role || 'ADMIN'}
            </Text>
          </View>
        </View>
      </View>
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
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  rowSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  editUrlBox: {
    marginTop: 14,
    gap: 10,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.navy,
    backgroundColor: '#f8fafc',
  },
  editBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  smallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  urlDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  urlText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
    flex: 1,
  },
  modifyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.skyBlue,
    marginLeft: 10,
  },
  pushTestBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  pushTestBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
});
