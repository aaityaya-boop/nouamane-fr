import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '../services/storage';
import { api } from '../services/api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string | null;
  avatar?: string | null;
  effectivePermissions?: string[];
  isOwner?: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  login: (identifier: string, pass: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  toggleBiometrics: (enable: boolean) => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  // Check initial session & biometrics hardware
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check biometric hardware
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supported = hasHardware && isEnrolled;
        setIsBiometricSupported(supported);

        const bioEnabled = await storage.isBiometricsEnabled();
        setIsBiometricEnabled(bioEnabled);

        // 2. Check token and stored user
        const token = await storage.getToken();
        const storedUser = await storage.getUser();

        if (token && storedUser) {
          setUser(storedUser);
          // Try background refresh of profile
          api.getMe()
            .then((res) => {
              if (res.success && res.user) {
                setUser(res.user);
                storage.setUser(res.user);
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.warn('[AuthContext] Init error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (identifier: string, pass: string, remember = true) => {
    setIsLoading(true);
    try {
      const data = await api.login(identifier, pass, remember);
      if (data.user) {
        setUser(data.user);
      }
      if (remember) {
        await storage.setRememberedEmail(identifier);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    if (!isBiometricSupported) return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Déverrouiller NAY Admin',
        fallbackLabel: 'Utiliser le mot de passe',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  };

  const toggleBiometrics = async (enable: boolean): Promise<boolean> => {
    if (enable) {
      const success = await authenticateWithBiometrics();
      if (success) {
        await storage.setBiometricsEnabled(true);
        setIsBiometricEnabled(true);
        return true;
      }
      return false;
    } else {
      await storage.setBiometricsEnabled(false);
      setIsBiometricEnabled(false);
      return true;
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        await storage.setUser(res.user);
      }
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isBiometricSupported,
        isBiometricEnabled,
        login,
        logout,
        toggleBiometrics,
        authenticateWithBiometrics,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
