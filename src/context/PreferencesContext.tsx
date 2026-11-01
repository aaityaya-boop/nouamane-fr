'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

type Preferences = {
  theme: 'light' | 'dark' | 'system';
  currency: 'MAD' | 'EUR' | 'USD';
  language: 'fr' | 'en' | 'ar';
};

type PreferencesContextType = {
  preferences: Preferences;
  updatePreferences: (newPrefs: Partial<Preferences>) => void;
  recentlyViewed: number[];
  addRecentlyViewed: (productId: number) => void;
  clearRecentlyViewed: () => void;
  isLoaded: boolean;
};

const defaultPreferences: Preferences = {
  theme: 'system',
  currency: 'MAD',
  language: 'fr',
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load preferences
    const savedPrefs = Cookies.get('nouamane_preferences');
    if (savedPrefs) {
      try {
        setPreferences({ ...defaultPreferences, ...JSON.parse(savedPrefs) });
      } catch (e) {
        console.error('Failed to parse preferences cookie', e);
      }
    }

    // Load recently viewed tracking from localStorage (with cookie fallback)
    try {
      if (typeof window !== 'undefined') {
        const localViews = localStorage.getItem('nay_recently_viewed');
        if (localViews) {
          const parsed = JSON.parse(localViews);
          if (Array.isArray(parsed)) {
            setRecentlyViewed(parsed);
          }
        } else {
          const savedViews = Cookies.get('nouamane_recently_viewed');
          if (savedViews) {
            setRecentlyViewed(JSON.parse(savedViews));
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse recently viewed storage', e);
    }
    
    setIsLoaded(true);
  }, []);

  const updatePreferences = useCallback((newPrefs: Partial<Preferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      Cookies.set('nouamane_preferences', JSON.stringify(updated), { expires: 365, path: '/' });
      return updated;
    });
  }, []);

  const addRecentlyViewed = useCallback((productId: number) => {
    if (!productId || typeof productId !== 'number') return;
    setRecentlyViewed(prev => {
      let currentList = prev;
      // Guard against React mount race condition: read existing storage if state hasn't populated yet
      if (currentList.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('nay_recently_viewed');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              currentList = parsed;
            }
          }
        } catch {}
      }

      // Remove if already exists to move it to the front (deduplication)
      const filtered = currentList.filter(id => id !== productId);
      const updated = [productId, ...filtered].slice(0, 12); // Keep last 12 products
      
      // Save browsing activity to localStorage and cookie
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('nay_recently_viewed', JSON.stringify(updated));
        }
      } catch {}
      Cookies.set('nouamane_recently_viewed', JSON.stringify(updated), { expires: 30, path: '/' });
      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nay_recently_viewed');
      }
    } catch {}
    Cookies.remove('nouamane_recently_viewed', { path: '/' });
  }, []);

  return (
    <PreferencesContext.Provider value={{ 
      preferences, 
      updatePreferences, 
      recentlyViewed, 
      addRecentlyViewed, 
      clearRecentlyViewed,
      isLoaded 
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
