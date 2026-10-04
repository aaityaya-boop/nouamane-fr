import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../constants/config';

export const storage = {
  // 1. Secure Token Storage
  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.TOKEN, token);
    } catch {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(CONFIG.STORAGE_KEYS.TOKEN);
      if (token) return token;
    } catch {}
    return AsyncStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
  },

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.TOKEN);
    } catch {}
    await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
  },

  // 2. User Profile Storage
  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const raw = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
  },

  // 3. API URL Override
  async getApiUrl(): Promise<string> {
    const customUrl = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.API_URL);
    return customUrl && customUrl.trim() ? customUrl.trim().replace(/\/$/, '') : CONFIG.DEFAULT_API_URL;
  },

  async setApiUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.API_URL, url.trim().replace(/\/$/, ''));
  },

  // 4. Biometrics Toggle
  async isBiometricsEnabled(): Promise<boolean> {
    const val = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.BIOMETRICS_ENABLED);
    return val === 'true';
  },

  async setBiometricsEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.BIOMETRICS_ENABLED, enabled ? 'true' : 'false');
  },

  // 5. Remembered Email
  async getRememberedEmail(): Promise<string | null> {
    return AsyncStorage.getItem(CONFIG.STORAGE_KEYS.REMEMBER_EMAIL);
  },

  async setRememberedEmail(email: string): Promise<void> {
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.REMEMBER_EMAIL, email);
  },
};
