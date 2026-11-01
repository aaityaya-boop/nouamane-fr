'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type WishlistContextType = {
  wishlist: string[];
  isInWishlist: (slug: string) => boolean;
  toggleWishlist: (slug: string) => void;
  addToWishlist: (slug: string) => void;
  removeFromWishlist: (slug: string) => void;
  clearWishlist: () => void;
  count: number;
  isLoaded: boolean;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = 'nay_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Safe client-side hydration from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse wishlist from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever wishlist changes (after loaded)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
      } catch (e) {
        console.error('Failed to save wishlist to localStorage', e);
      }
    }
  }, [wishlist, isLoaded]);

  const isInWishlist = useCallback(
    (slug: string) => {
      return wishlist.includes(slug);
    },
    [wishlist]
  );

  const toggleWishlist = useCallback((slug: string) => {
    if (!slug) return;
    setWishlist((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      } else {
        return [...prev, slug];
      }
    });
  }, []);

  const addToWishlist = useCallback((slug: string) => {
    if (!slug) return;
    setWishlist((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
  }, []);

  const removeFromWishlist = useCallback((slug: string) => {
    if (!slug) return;
    setWishlist((prev) => prev.filter((s) => s !== slug));
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        count: wishlist.length,
        isLoaded,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
