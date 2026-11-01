'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScentMatchFilters,
  QueueProduct,
  SwipeAction,
  ScentDNAAnalysisResult
} from './types';

const STORAGE_KEY = 'nay_scent_match_session_v1';

export function useScentMatchSession(locale: string = 'fr') {
  const [sessionId, setSessionId] = useState<string>('');
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');
  const [filters, setFilters] = useState<ScentMatchFilters>({
    gender: 'all',
    minPrice: 250,
    maxPrice: 650,
    family: 'all',
    season: 'all',
    occasion: 'all',
    personality: 'all'
  });

  const [queue, setQueue] = useState<QueueProduct[]>([]);
  const [totalEligible, setTotalEligible] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [likedProducts, setLikedProducts] = useState<QueueProduct[]>([]);
  const [passedProducts, setPassedProducts] = useState<QueueProduct[]>([]);
  const [savedProducts, setSavedProducts] = useState<QueueProduct[]>([]);
  const [undoStack, setUndoStack] = useState<Array<{ product: QueueProduct; action: SwipeAction }>>([]);

  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ScentDNAAnalysisResult | null>(null);

  const recommendedSwipes = 10;
  const minSwipes = 3;

  // Detect device type and init session ID
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    setDeviceType(isMobile ? 'mobile' : 'desktop');

    let storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      storedId = `sm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_KEY, storedId);
    }
    setSessionId(storedId);

    // Register session on backend
    fetch('/api/scent-match/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: storedId,
        locale,
        deviceType: isMobile ? 'mobile' : 'desktop'
      })
    }).catch(console.error);
  }, [locale]);

  // Fetch product queue
  const fetchQueue = useCallback(
    async (currentFilters: ScentMatchFilters, activeSessionId: string) => {
      if (!activeSessionId) return;
      setIsLoadingQueue(true);
      try {
        const query = new URLSearchParams({
          sessionId: activeSessionId,
          gender: currentFilters.gender,
          minPrice: currentFilters.minPrice.toString(),
          maxPrice: currentFilters.maxPrice.toString(),
          family: currentFilters.family,
          season: currentFilters.season,
          occasion: currentFilters.occasion,
          personality: currentFilters.personality,
          seed: '42'
        });

        const res = await fetch(`/api/scent-match/queue?${query.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.queue)) {
          setQueue(data.queue);
          setTotalEligible(typeof data.totalEligible === 'number' ? data.totalEligible : data.queue.length);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error('Failed to fetch queue:', err);
      } finally {
        setIsLoadingQueue(false);
      }
    },
    []
  );

  // Load queue whenever session is ready
  useEffect(() => {
    if (sessionId) {
      fetchQueue(filters, sessionId);
    }
  }, [sessionId, fetchQueue, filters]);

  // Current active product
  const currentProduct = queue[currentIndex] || null;
  const totalSwipesCount = likedProducts.length + passedProducts.length;

  // Swipe Action
  const swipe = useCallback(
    async (action: SwipeAction) => {
      if (!currentProduct || !sessionId) return;

      const product = currentProduct;

      // Update local state immediately for instant feedback
      if (action === 'LIKE') {
        setLikedProducts((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
        setUndoStack((prev) => [...prev, { product, action: 'LIKE' }]);
      } else if (action === 'PASS') {
        setPassedProducts((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
        setUndoStack((prev) => [...prev, { product, action: 'PASS' }]);
      } else if (action === 'SAVE') {
        setSavedProducts((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
        // Save does not advance index
      }

      if (action !== 'SAVE') {
        setCurrentIndex((prev) => prev + 1);
      }

      // Sync to API
      try {
        await fetch('/api/scent-match/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            action,
            productId: product.id,
            productName: product.name
          })
        });
      } catch (e) {
        console.error('Failed to record swipe:', e);
      }
    },
    [currentProduct, sessionId]
  );

  // Undo Action
  const undo = useCallback(async () => {
    if (undoStack.length === 0 || !sessionId) return;

    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    if (last.action === 'LIKE') {
      setLikedProducts((prev) => prev.filter((p) => p.id !== last.product.id));
    } else if (last.action === 'PASS') {
      setPassedProducts((prev) => prev.filter((p) => p.id !== last.product.id));
    }

    setCurrentIndex((prev) => Math.max(0, prev - 1));

    try {
      await fetch('/api/scent-match/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'UNDO',
          productId: last.product.id
        })
      });
    } catch (e) {
      console.error('Failed to record undo:', e);
    }
  }, [undoStack, sessionId]);

  // Update filters and reload queue
  const updateFilters = useCallback(
    (newFilters: Partial<ScentMatchFilters>) => {
      setFilters((prev) => {
        const merged = { ...prev, ...newFilters };
        if (sessionId) {
          fetchQueue(merged, sessionId);
        }
        return merged;
      });
    },
    [sessionId, fetchQueue]
  );

  // Finish Analysis
  const finishAnalysis = useCallback(async () => {
    if (!sessionId) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/scent-match/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (err) {
      console.error('Failed to finish analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionId]);

  // Restart
  const restart = useCallback(() => {
    setLikedProducts([]);
    setPassedProducts([]);
    setSavedProducts([]);
    setUndoStack([]);
    setAnalysisResult(null);
    setCurrentIndex(0);
    const newSessionId = `sm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, newSessionId);
    setSessionId(newSessionId);
    fetchQueue(filters, newSessionId);
  }, [fetchQueue, filters]);

  return {
    sessionId,
    deviceType,
    filters,
    updateFilters,
    queue,
    totalEligible,
    currentIndex,
    currentProduct,
    likedProducts,
    passedProducts,
    savedProducts,
    undoStack,
    totalSwipesCount,
    recommendedSwipes,
    minSwipes,
    isLoadingQueue,
    isAnalyzing,
    analysisResult,
    swipe,
    undo,
    finishAnalysis,
    restart
  };
}
