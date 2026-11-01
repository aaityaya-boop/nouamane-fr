'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '@/lib/products';

type ToggleResult = {
  success: boolean;
  reason: 'added' | 'removed' | 'max_reached';
};

type ComparisonContextType = {
  comparedProducts: Product[];
  isCompared: (slug: string) => boolean;
  toggleCompare: (product: Product) => ToggleResult;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toastMessage: string | null;
  clearToast: () => void;
};

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const STORAGE_KEY = 'nay_compared_perfumes';
const MAX_COMPARE = 3;

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage safely on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setComparedProducts(parsed.slice(0, MAX_COMPARE));
        }
      }
    } catch (e) {
      console.error('[ComparisonContext] Error loading from storage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparedProducts));
    } catch (e) {
      console.error('[ComparisonContext] Error saving to storage:', e);
    }
  }, [comparedProducts, isInitialized]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const isCompared = useCallback(
    (slug: string) => comparedProducts.some((p) => p.slug === slug),
    [comparedProducts]
  );

  const toggleCompare = useCallback(
    (product: Product): ToggleResult => {
      const exists = comparedProducts.some((p) => p.slug === product.slug);
      if (exists) {
        setComparedProducts((prev) => prev.filter((p) => p.slug !== product.slug));
        return { success: true, reason: 'removed' };
      }

      if (comparedProducts.length >= MAX_COMPARE) {
        setToastMessage(`Vous pouvez comparer jusqu'à ${MAX_COMPARE} parfums simultanément.`);
        return { success: false, reason: 'max_reached' };
      }

      setComparedProducts((prev) => [...prev, product]);
      return { success: true, reason: 'added' };
    },
    [comparedProducts]
  );

  const removeFromCompare = useCallback((slug: string) => {
    setComparedProducts((prev) => prev.filter((p) => p.slug !== slug));
  }, []);

  const clearCompare = useCallback(() => {
    setComparedProducts([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const clearToast = useCallback(() => setToastMessage(null), []);

  return (
    <ComparisonContext.Provider
      value={{
        comparedProducts,
        isCompared,
        toggleCompare,
        removeFromCompare,
        clearCompare,
        isModalOpen,
        openModal,
        closeModal,
        toastMessage,
        clearToast,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    return {
      comparedProducts: [],
      isCompared: () => false,
      toggleCompare: () => ({ success: false, reason: 'max_reached' as const }),
      removeFromCompare: () => {},
      clearCompare: () => {},
      isModalOpen: false,
      openModal: () => {},
      closeModal: () => {},
      toastMessage: null,
      clearToast: () => {},
    };
  }
  return context;
}
