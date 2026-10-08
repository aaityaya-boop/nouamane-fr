'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import Cookies from 'js-cookie';
import { isProductInStock } from '@/lib/products';

export type CartItem = {
  id: number;
  sku?: string | null;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
};

export type AppliedPromo = {
  code: string;
  type: string;
  value: number;
  applicableScope?: string; // 'ALL' | 'CATEGORIES' | 'SPECIFIC_PRODUCTS'
  categories?: string[];
  productIds?: number[];
  minOrderAmount?: number | null;
  minQuantity?: number | null;
  description?: string | null;
};

export function calculatePromoDiscount(cart: CartItem[], appliedPromo: AppliedPromo | null): number {
  if (!appliedPromo || !cart || cart.length === 0) return 0;

  // Check minimum required item count (e.g. more than 2 perfumes = min 3)
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (appliedPromo.minQuantity && appliedPromo.minQuantity > 0 && totalQuantity < appliedPromo.minQuantity) {
    return 0;
  }

  let eligibleSubtotal = 0;
  if (
    (appliedPromo.applicableScope === 'SPECIFIC_PRODUCTS' || appliedPromo.applicableScope === 'CATEGORIES') &&
    Array.isArray(appliedPromo.productIds) &&
    appliedPromo.productIds.length > 0
  ) {
    const targetIds = new Set(appliedPromo.productIds.map(Number));
    eligibleSubtotal = cart
      .filter((item) => targetIds.has(Number(item.id)))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  } else {
    eligibleSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  if (eligibleSubtotal <= 0) return 0;

  let discount = 0;
  if (appliedPromo.type === 'percentage') {
    discount = eligibleSubtotal * (appliedPromo.value / 100);
  } else if (appliedPromo.type === 'fixed') {
    discount = Math.min(appliedPromo.value, eligibleSubtotal);
  }

  return Math.min(Math.round(discount * 100) / 100, eligibleSubtotal);
}

export type FreeGiftSelection = {
  id: number;
  name: string;
  brandLabel?: string;
  image?: string;
  slug?: string;
};

export type ActiveDeal = {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  dealType: string;
  buyQuantity: number;
  getQuantity: number;
  discountPercent: number;
  bundlePrice?: number | null;
  applicableScope: string;
  categories?: string[];
  productIds?: number[];
  isAutomatic: boolean;
  promoCode?: string | null;
  freeShipping: boolean;
  freeGiftName?: string | null;
  freeGiftType?: string | null;
  freeGiftProductIds?: number[];
  availableGifts?: Array<{
    id: number;
    name: string;
    slug: string;
    brandLabel?: string;
    images?: any;
    price: number;
    stock: number;
  }>;
};

export function evaluateActiveDeals(
  cart: CartItem[],
  deals: ActiveDeal[]
): { bestDeal: ActiveDeal | null; dealDiscount: number; freeShippingUnlocked: boolean; freeGift?: string | null } {
  if (!cart || cart.length === 0 || !deals || deals.length === 0) {
    return { bestDeal: null, dealDiscount: 0, freeShippingUnlocked: false, freeGift: null };
  }

  let highestDiscount = 0;
  let chosenDeal: ActiveDeal | null = null;
  let freeShipping = false;
  let gift: string | null = null;

  for (const deal of deals) {
    if (!deal.isAutomatic && !deal.promoCode) continue;

    // Flatten qualifying units
    const units: { id: number; price: number }[] = [];
    cart.forEach((item) => {
      const isEligible =
        deal.applicableScope === 'ALL' ||
        (deal.applicableScope === 'SPECIFIC_PRODUCTS' &&
          Array.isArray(deal.productIds) &&
          deal.productIds.includes(Number(item.id))) ||
        (deal.applicableScope === 'CATEGORIES' &&
          Array.isArray(deal.productIds) &&
          deal.productIds.includes(Number(item.id)));

      if (isEligible) {
        for (let i = 0; i < item.quantity; i++) {
          units.push({ id: item.id, price: item.price });
        }
      }
    });

    if (units.length === 0) continue;

    // Sort cheapest first
    units.sort((a, b) => a.price - b.price);

    let currentDiscount = 0;

    if (deal.dealType === 'BUY_X_GET_Y_FREE') {
      const groupSize = deal.buyQuantity + deal.getQuantity;
      if (groupSize > 0 && deal.getQuantity > 0) {
        const freeUnitsCount = Math.floor(units.length / groupSize) * deal.getQuantity;
        if (freeUnitsCount > 0) {
          const freeUnits = units.slice(0, freeUnitsCount);
          currentDiscount = freeUnits.reduce((sum, u) => sum + u.price * (deal.discountPercent / 100), 0);
        }
      } else if (deal.getQuantity === 0 && units.length >= deal.buyQuantity) {
        // Gift-only deal (e.g. buy 2 get free gift)
        if (deal.freeGiftName) gift = deal.freeGiftName;
      }
    } else if (deal.dealType === 'SECOND_AT_DISCOUNT') {
      const pairsCount = Math.floor(units.length / 2);
      if (pairsCount > 0) {
        const discountedUnits = units.slice(0, pairsCount);
        currentDiscount = discountedUnits.reduce((sum, u) => sum + u.price * (deal.discountPercent / 100), 0);
      }
    } else if (deal.dealType === 'BUNDLE_FIXED_PRICE' && deal.bundlePrice) {
      const bundlesCount = Math.floor(units.length / deal.buyQuantity);
      if (bundlesCount > 0) {
        const bundleUnitsCount = bundlesCount * deal.buyQuantity;
        const bundleUnits = units.slice(units.length - bundleUnitsCount);
        const originalBundleSum = bundleUnits.reduce((sum, u) => sum + u.price, 0);
        const targetBundleSum = deal.bundlePrice * bundlesCount;
        if (originalBundleSum > targetBundleSum) {
          currentDiscount = originalBundleSum - targetBundleSum;
        }
      }
    } else if (deal.dealType === 'PERCENTAGE_DISCOUNT' || deal.dealType === 'TIERED_QUANTITY') {
      if (units.length >= deal.buyQuantity) {
        const totalEligibleSum = units.reduce((sum, u) => sum + u.price, 0);
        currentDiscount = totalEligibleSum * (deal.discountPercent / 100);
      }
    }

    if (currentDiscount > highestDiscount || (!chosenDeal && (deal.freeGiftName || deal.freeShipping))) {
      highestDiscount = currentDiscount;
      chosenDeal = deal;
      if (deal.freeShipping) freeShipping = true;
      if (deal.freeGiftName) gift = deal.freeGiftName;
    }
  }

  return {
    bestDeal: chosenDeal,
    dealDiscount: Math.round(highestDiscount * 100) / 100,
    freeShippingUnlocked: freeShipping,
    freeGift: gift,
  };
}

type AddInput = {
  id: number;
  sku?: string | null;
  slug: string;
  name: string;
  price: number | string;
  image?: string;
  images?: string[];
  size?: string;
  inStock?: boolean;
  stock?: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: AddInput, quantity?: number, size?: string) => void;
  removeFromCart: (id: number, size?: string) => void;
  updateQuantity: (id: number, size: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
  shippingFee: number;
  appliedPromo: AppliedPromo | null;
  applyPromo: (promo: AppliedPromo) => void;
  removePromo: () => void;
  activeDeals: ActiveDeal[];
  appliedDeal: ActiveDeal | null;
  dealDiscount: number;
  selectedFreeGift: FreeGiftSelection | null;
  setSelectedFreeGift: (gift: FreeGiftSelection | null) => void;
  availableTesterGifts: Array<{
    id: number;
    name: string;
    slug: string;
    brandLabel?: string;
    images?: any;
    price: number;
    stock: number;
  }>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shippingFee, setShippingFee] = useState(35);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [activeDeals, setActiveDeals] = useState<ActiveDeal[]>([]);
  const [selectedFreeGift, setSelectedFreeGift] = useState<FreeGiftSelection | null>(null);

  useEffect(() => {
    // Migration: Read from localStorage first, then fallback to Cookies.
    let saved = localStorage.getItem('nouamaneCart');
    if (!saved) {
      saved = Cookies.get('nouamaneCart') || null;
    }
    
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        setCart([]);
      }
    }
    
    let savedPromo = localStorage.getItem('nouamanePromo');
    if (!savedPromo) {
      savedPromo = Cookies.get('nouamanePromo') || null;
    }
    
    if (savedPromo) {
      try {
        setAppliedPromo(JSON.parse(savedPromo));
      } catch {
        setAppliedPromo(null);
      }
    }

    const savedGift = Cookies.get('nouamaneFreeGift');
    if (savedGift) {
      try {
        setSelectedFreeGift(JSON.parse(savedGift));
      } catch {}
    }
    
    setIsLoaded(true);

    // Fetch shipping fee
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.shippingFee !== undefined) {
          setShippingFee(data.shippingFee);
        }
      })
      .catch(console.error);

    // Fetch active deals
    fetch('/api/deals/active')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setActiveDeals(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const cartStr = JSON.stringify(cart);
      Cookies.set('nouamaneCart', cartStr, { expires: 30, path: '/' });
      localStorage.removeItem('nouamaneCart');
      
      if (appliedPromo) {
        const promoStr = JSON.stringify(appliedPromo);
        Cookies.set('nouamanePromo', promoStr, { expires: 30, path: '/' });
        localStorage.removeItem('nouamanePromo');
      } else {
        Cookies.remove('nouamanePromo', { path: '/' });
      }

      if (selectedFreeGift && !appliedPromo) {
        Cookies.set('nouamaneFreeGift', JSON.stringify(selectedFreeGift), { expires: 30, path: '/' });
      } else {
        Cookies.remove('nouamaneFreeGift', { path: '/' });
      }
      
      if (appliedPromo) {
        const promoStr = JSON.stringify(appliedPromo);
        Cookies.set('nouamanePromo', promoStr, { expires: 30, path: '/' });
        localStorage.removeItem('nouamanePromo');
      } else {
        Cookies.remove('nouamanePromo', { path: '/' });
      }

      // Live Carts Analytics - Sync cart to DB
      let sessionId = Cookies.get('nouamaneSession');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        Cookies.set('nouamaneSession', sessionId, { expires: 365, path: '/' });
      }

      fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          items: cart,
          totalValue: cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
        })
      }).catch(() => {}); // silent fail if network error
    }
  }, [cart, appliedPromo, isLoaded]);

  const addToCart = (product: AddInput, quantity = 1, size = '50ml') => {
    // Rupture de stock protection
    if (!isProductInStock(product)) {
      console.warn(`[Cart] Ajout bloqué : le produit "${product.name}" est en rupture de stock.`);
      return;
    }

    const priceNum =
      typeof product.price === 'string'
        ? parseFloat(product.price)
        : product.price;
    const image = product.image || product.images?.[0] || '';
    const finalSize = size || product.size || '50ml';

    setCart((prev) => {
      const existing = prev.find(
        (i) => i.id === product.id && i.size === finalSize
      );
      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.size === finalSize
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          sku: product.sku || undefined,
          slug: product.slug,
          name: product.name,
          price: priceNum,
          image,
          quantity,
          size: finalSize,
        },
      ];
    });
  };

  const removeFromCart = (id: number, size?: string) => {
    setCart((prev) =>
      prev.filter((i) => (size ? !(i.id === id && i.size === size) : i.id !== id))
    );
  };

  const updateQuantity = (id: number, size: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id, size);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.id === id && i.size === size ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setCart([]);

  const getSubtotal = () =>
    cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const getItemCount = () =>
    cart.reduce((total, item) => total + item.quantity, 0);

  const applyPromo = (promo: AppliedPromo) => {
    setAppliedPromo(promo);
    setSelectedFreeGift(null);
    Cookies.remove('nouamaneFreeGift', { path: '/' });
  };
  const removePromo = () => setAppliedPromo(null);

  // Evaluate automatic deals for the current cart
  // 🔒 When a promo code is active, DO NOT cumulate deals or free offers: give ONLY the promo code bonus!
  const hasPromo = Boolean(appliedPromo);
  const { bestDeal, dealDiscount, freeShippingUnlocked, freeGift } = hasPromo
    ? { bestDeal: null, dealDiscount: 0, freeShippingUnlocked: false, freeGift: null }
    : evaluateActiveDeals(cart, activeDeals);

  // Available tester gifts from active deal
  const availableTesterGifts = hasPromo ? [] : (bestDeal?.availableGifts || []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getSubtotal,
        getItemCount,
        shippingFee: (freeShippingUnlocked || getSubtotal() >= 800) ? 0 : shippingFee,
        appliedPromo,
        applyPromo,
        removePromo,
        activeDeals,
        appliedDeal: bestDeal,
        dealDiscount,
        selectedFreeGift: (hasPromo || !freeGift) ? null : selectedFreeGift,
        setSelectedFreeGift,
        availableTesterGifts,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
