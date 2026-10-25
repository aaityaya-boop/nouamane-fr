'use client';

/**
 * ShopCatalog — reusable catalog UI with Advanced Smart Filters.
 * Used by /shop, /shop/[gender], and /brands/[brand] pages.
 */

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/ProductCard';
import {
  MAIN_CATEGORIES,
  type Product,
  type Brand,
  type Gender,
} from '@/lib/products';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { SlidersHorizontal, X, Star, ChevronDown, Check, Search, RotateCcw } from 'lucide-react';

const QuickViewModal = dynamic(() => import('@/components/QuickViewModal'), { ssr: false });

type SortKey = 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest' | 'name';

type Props = {
  /** The products to display in the catalog */
  products: Product[];
  /** Dynamic brands list */
  brands: any[];
  /** Pre-filter to a specific gender (locks the filter). */
  lockedGender?: Gender;
  /** Pre-filter to a specific brand (locks the filter). */
  lockedBrand?: Brand;
  /** Optional subcategory pre-filter. */
  lockedSubcategory?: string;
  /** Lock to testers (true) or non-testers (false). */
  lockedIsTester?: boolean;
  /** Curated list of recommended product slugs to prioritize */
  recommendedSlugs?: string[];
};

const SIZE_RANGES = [
  { key: 'small', label: '30-40ml', min: 30, max: 40 },
  { key: 'medium', label: '50-75ml', min: 50, max: 75 },
  { key: 'large', label: '90-125ml', min: 90, max: 125 },
  { key: 'xlarge', label: '150ml+', min: 150, max: 500 },
];

const PRICE_PRESETS = [
  { label: 'Tous les prix', min: 0, max: 3000 },
  { label: 'Moins de 300 MAD', min: 0, max: 300 },
  { label: '300 - 500 MAD', min: 300, max: 500 },
  { label: '500 - 1 000 MAD', min: 500, max: 1000 },
  { label: '1 000 MAD et +', min: 1000, max: 3000 },
];

function ShopCatalogInner({
  products,
  brands,
  lockedGender,
  lockedBrand,
  lockedSubcategory,
  lockedIsTester,
  recommendedSlugs,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial query params
  const initialBrand = searchParams?.get('brand') || 'all';
  const initialGender = searchParams?.get('gender') || lockedGender || 'all';
  const initialSub = searchParams?.get('sub') || lockedSubcategory || 'all';
  const initialInStock = searchParams?.get('inStock') === '1';
  const initialMinPrice = parseInt(searchParams?.get('minPrice') || '0', 10);
  const initialMaxPrice = parseInt(searchParams?.get('maxPrice') || '3000', 10);
  const initialType = searchParams?.get('type') || 'all';
  const initialSort = (searchParams?.get('sort') as SortKey) || 'featured';
  const initialQuery = searchParams?.get('q') || '';
  const pageParam = parseInt(searchParams?.get('page') || '1', 10);
  const initialPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [brand, setBrand] = useState<string>(lockedBrand || initialBrand);
  const [gender, setGender] = useState<string>(initialGender);
  const [subcategory, setSubcategory] = useState<string>(initialSub);
  const [inStockOnly, setInStockOnly] = useState<boolean>(initialInStock);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    isNaN(initialMinPrice) ? 0 : initialMinPrice,
    isNaN(initialMaxPrice) ? 3000 : initialMaxPrice,
  ]);
  const [typeFilter, setTypeFilter] = useState<string>(initialType);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortKey>(initialSort);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Sync state if URL searchParams change externally
  useEffect(() => {
    if (!searchParams) return;
    const qBrand = searchParams.get('brand');
    const qGender = searchParams.get('gender');
    const qSub = searchParams.get('sub');
    const qStock = searchParams.get('inStock');
    const qMin = searchParams.get('minPrice');
    const qMax = searchParams.get('maxPrice');
    const qSort = searchParams.get('sort');
    const qQuery = searchParams.get('q');
    const qPage = parseInt(searchParams.get('page') || '1', 10);

    if (qBrand && qBrand !== brand && !lockedBrand) setBrand(qBrand);
    if (qGender && qGender !== gender && !lockedGender) setGender(qGender);
    if (qSub && qSub !== subcategory && !lockedSubcategory) setSubcategory(qSub);
    if (qStock !== null && (qStock === '1') !== inStockOnly) setInStockOnly(qStock === '1');
    if (qMin && qMax) {
      const minP = parseInt(qMin, 10);
      const maxP = parseInt(qMax, 10);
      if (!isNaN(minP) && !isNaN(maxP) && (minP !== priceRange[0] || maxP !== priceRange[1])) {
        setPriceRange([minP, maxP]);
      }
    }
    if (qSort && qSort !== sortBy) setSortBy(qSort as SortKey);
    if (qQuery !== null && qQuery !== searchQuery) setSearchQuery(qQuery);
    const validPage = isNaN(qPage) || qPage < 1 ? 1 : qPage;
    setCurrentPage(validPage);
  }, [searchParams]);

  // Synchronize state with browser URL search parameters without full page reloads
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    if (brand !== 'all' && !lockedBrand) params.set('brand', brand);
    else params.delete('brand');

    if (gender !== 'all' && !lockedGender) params.set('gender', gender);
    else params.delete('gender');

    if (subcategory !== 'all' && !lockedSubcategory) params.set('sub', subcategory);
    else params.delete('sub');

    if (inStockOnly) params.set('inStock', '1');
    else params.delete('inStock');

    if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
    else params.delete('minPrice');

    if (priceRange[1] < 3000) params.set('maxPrice', String(priceRange[1]));
    else params.delete('maxPrice');

    if (sortBy !== 'featured') params.set('sort', sortBy);
    else params.delete('sort');

    if (searchQuery.trim().length > 0) params.set('q', searchQuery.trim());
    else params.delete('q');

    if (currentPage > 1) params.set('page', String(currentPage));
    else params.delete('page');

    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(null, '', newUrl);
  }, [
    brand,
    gender,
    subcategory,
    inStockOnly,
    priceRange,
    sortBy,
    searchQuery,
    currentPage,
    pathname,
    lockedBrand,
    lockedGender,
    lockedSubcategory,
  ]);

  // Reset page when any filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [brand, gender, subcategory, inStockOnly, priceRange, selectedSizes, minRating, sortBy, searchQuery]);

  const toggleSize = (key: string) => {
    setSelectedSizes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    if (!lockedBrand) setBrand('all');
    if (!lockedGender) setGender('all');
    if (!lockedSubcategory) setSubcategory('all');
    if (lockedIsTester === undefined) setTypeFilter('all');
    setInStockOnly(false);
    setPriceRange([0, 3000]);
    setSelectedSizes([]);
    setMinRating(0);
    setSearchQuery('');
    setSortBy('featured');
  };

  // Filter computation
  const filtered = useMemo(() => {
    let list: Product[] = [...products];

    // Locked or selected isTester
    if (lockedIsTester !== undefined) {
      list = list.filter((p) => (lockedIsTester ? p.isTester === true : p.isTester === false));
    } else if (typeFilter !== 'all') {
      if (typeFilter === 'testers') list = list.filter((p) => p.isTester === true);
      else if (typeFilter === 'originals')
        list = list.filter(
          (p) =>
            p.isTester === false &&
            p.subcategory !== 'coffrets' &&
            (p.subcategory as string) !== 'master-copier'
        );
      else if (typeFilter === 'oriental')
        list = list.filter(
          (p) => (p.subcategory as string) === 'arabic' || p.subcategory === 'oriental'
        );
      else if (typeFilter === 'coffrets')
        list = list.filter(
          (p) =>
            p.subcategory === 'coffrets' ||
            p.subcategory === 'gift-bundles' ||
            p.subcategory === 'discovery-sets'
        );
      else if (typeFilter === 'master-copier')
        list = list.filter((p) => (p.subcategory as string) === 'master-copier');
    }

    if (lockedBrand) list = list.filter((p) => p.brand === lockedBrand);
    else if (brand !== 'all') list = list.filter((p) => p.brand === brand);

    if (lockedGender) list = list.filter((p) => p.gender === lockedGender);
    else if (gender !== 'all') list = list.filter((p) => p.gender === gender);

    if (subcategory !== 'all') list = list.filter((p) => p.subcategory === subcategory);

    if (inStockOnly) {
      list = list.filter((p) => p.inStock !== false && (p.stock === undefined || p.stock > 0));
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.brandLabel?.toLowerCase().includes(q)
      );
    }

    list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedSizes.length > 0) {
      list = list.filter((p) =>
        p.sizes.some((s) => {
          return selectedSizes.some((rangeKey) => {
            const r = SIZE_RANGES.find((sr) => sr.key === rangeKey);
            return r ? s.ml >= r.min && s.ml <= r.max : false;
          });
        })
      );
    }

    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);

    // Sorting
    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => {
          const aInStock = a.inStock !== false && (a.stock === undefined || a.stock > 0) ? 1 : 0;
          const bInStock = b.inStock !== false && (b.stock === undefined || b.stock > 0) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;
          return a.price - b.price;
        });
        break;
      case 'price-high':
        list.sort((a, b) => {
          const aInStock = a.inStock !== false && (a.stock === undefined || a.stock > 0) ? 1 : 0;
          const bInStock = b.inStock !== false && (b.stock === undefined || b.stock > 0) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;
          return b.price - a.price;
        });
        break;
      case 'rating':
        list.sort((a, b) => {
          const aInStock = a.inStock !== false && (a.stock === undefined || a.stock > 0) ? 1 : 0;
          const bInStock = b.inStock !== false && (b.stock === undefined || b.stock > 0) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;
          return b.rating - a.rating;
        });
        break;
      case 'newest':
        list.sort((a, b) => {
          const aInStock = a.inStock !== false && (a.stock === undefined || a.stock > 0) ? 1 : 0;
          const bInStock = b.inStock !== false && (b.stock === undefined || b.stock > 0) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        });
        break;
      case 'name':
        list.sort((a, b) => {
          const aInStock = a.inStock !== false && (a.stock === undefined || a.stock > 0) ? 1 : 0;
          const bInStock = b.inStock !== false && (b.stock === undefined || b.stock > 0) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;
          return a.name.localeCompare(b.name);
        });
        break;
      default:
        list.sort((a, b) => {
          const aInStock = a.inStock !== false && (a.stock === undefined || a.stock > 0) ? 1 : 0;
          const bInStock = b.inStock !== false && (b.stock === undefined || b.stock > 0) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;

          if (recommendedSlugs && recommendedSlugs.length > 0) {
            const indexA = recommendedSlugs.indexOf(a.slug);
            const indexB = recommendedSlugs.indexOf(b.slug);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
          }
          const aBest = a.tags.includes('bestseller') ? 1 : 0;
          const bBest = b.tags.includes('bestseller') ? 1 : 0;
          return bBest - aBest;
        });
    }
    return list;
  }, [
    brand,
    gender,
    subcategory,
    inStockOnly,
    priceRange,
    selectedSizes,
    minRating,
    sortBy,
    lockedBrand,
    lockedGender,
    searchQuery,
    recommendedSlugs,
    products,
    lockedIsTester,
    typeFilter,
  ]);

  // Active filters count
  const activeCount =
    (brand !== 'all' && !lockedBrand ? 1 : 0) +
    (gender !== 'all' && !lockedGender ? 1 : 0) +
    (subcategory !== 'all' && !lockedSubcategory ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (typeFilter !== 'all' && lockedIsTester === undefined ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 3000 ? 1 : 0) +
    selectedSizes.length +
    (minRating > 0 ? 1 : 0) +
    (searchQuery.trim().length > 0 ? 1 : 0);

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (targetPage > 1) {
      params.set('page', targetPage.toString());
    } else {
      params.delete('page');
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const selectedBrandLabel = useMemo(() => {
    if (brand === 'all') return null;
    const found = brands.find((b) => b.slug === brand);
    return found?.label || found?.name || brand;
  }, [brand, brands]);

  return (
    <>
      <div className="w-full">
        {/* Top Control Bar */}
        <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-[#e0ddd4]">
          {/* Row 1: Search Bar & Item Count */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]"
              />
              <input
                type="text"
                placeholder="Rechercher un parfum, marque…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#e0ddd4] rounded-full py-2 sm:py-2.5 pl-9 pr-8 text-[12px] sm:text-[13px] text-[#1A1A1A] focus:outline-none focus:border-[#0ea5e9] transition placeholder:text-[#9A9A9A] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#1A1A1A] p-1"
                  aria-label="Effacer la recherche"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="text-[11px] font-semibold tracking-wider uppercase text-[#9A9A9A] shrink-0">
              {filtered.length} parfum{filtered.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Row 2: Action Controls (Filters trigger + In-Stock pill + Sort dropdown) */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-2 shrink-0">
              {/* Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setFiltersOpenMobile(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border text-[11px] font-bold tracking-wider uppercase transition shadow-2xs shrink-0 cursor-pointer ${
                  activeCount > 0
                    ? 'border-[#0ea5e9] bg-sky-50 text-[#0ea5e9]'
                    : 'border-[#e0ddd4] bg-white text-[#1A1A1A] hover:border-[#0ea5e9]'
                }`}
              >
                <SlidersHorizontal size={13} className="text-[#0ea5e9]" />
                <span>Filtres</span>
                {activeCount > 0 && (
                  <span className="bg-[#0ea5e9] text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">
                    {activeCount}
                  </span>
                )}
              </button>

              {/* In-Stock Fast Toggle Pill */}
              <button
                type="button"
                onClick={() => setInStockOnly((prev) => !prev)}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full text-[10.5px] sm:text-[11px] font-semibold transition flex items-center gap-1 border shadow-2xs shrink-0 cursor-pointer ${
                  inStockOnly
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-300'
                    : 'bg-white text-[#6B6B6B] border-[#e0ddd4] hover:border-slate-400'
                }`}
              >
                <Check size={11} className={inStockOnly ? 'text-emerald-600' : 'text-slate-300'} />
                <span>En stock</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="appearance-none bg-white border border-[#e0ddd4] rounded-full pl-3 pr-7 py-1.5 sm:py-2 text-[10.5px] sm:text-[11px] font-semibold tracking-wider uppercase text-[#1A1A1A] focus:outline-none focus:border-[#0ea5e9] cursor-pointer shadow-2xs"
              >
                <option value="featured">Recommandés</option>
                <option value="newest">Nouveautés</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
                <option value="rating">Meilleures notes</option>
                <option value="name">A-Z</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6 py-2 px-3 bg-[#f8fafc] border border-[#e0ddd4] rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A] mr-1">
              Filtres actifs :
            </span>

            {/* Brand Chip */}
            {brand !== 'all' && !lockedBrand && selectedBrandLabel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e0ddd4] text-[11px] font-medium text-[#1A1A1A]">
                <span>Marque : {selectedBrandLabel}</span>
                <button
                  type="button"
                  onClick={() => setBrand('all')}
                  className="hover:text-red-600 transition"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Gender Chip */}
            {gender !== 'all' && !lockedGender && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e0ddd4] text-[11px] font-medium text-[#1A1A1A] capitalize">
                <span>Genre : {gender === 'women' ? 'Femme' : gender === 'men' ? 'Homme' : 'Mixte'}</span>
                <button
                  type="button"
                  onClick={() => setGender('all')}
                  className="hover:text-red-600 transition"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Subcategory Chip */}
            {subcategory !== 'all' && !lockedSubcategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e0ddd4] text-[11px] font-medium text-[#1A1A1A] capitalize">
                <span>Famille : {subcategory}</span>
                <button
                  type="button"
                  onClick={() => setSubcategory('all')}
                  className="hover:text-red-600 transition"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* In Stock Chip */}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e0ddd4] text-[11px] font-medium text-[#1A1A1A]">
                <span>En stock</span>
                <button
                  type="button"
                  onClick={() => setInStockOnly(false)}
                  className="hover:text-red-600 transition"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Price Chip */}
            {(priceRange[0] > 0 || priceRange[1] < 3000) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e0ddd4] text-[11px] font-medium text-[#1A1A1A]">
                <span>Prix : {priceRange[0]} - {priceRange[1]} MAD</span>
                <button
                  type="button"
                  onClick={() => setPriceRange([0, 3000])}
                  className="hover:text-red-600 transition"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Search Query Chip */}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e0ddd4] text-[11px] font-medium text-[#1A1A1A]">
                <span>Recherche : &ldquo;{searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-red-600 transition"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {/* Clear All Button */}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-[11px] font-bold text-[#0ea5e9] hover:text-red-600 transition flex items-center gap-1 py-1 px-2.5 rounded-full hover:bg-white"
            >
              <RotateCcw size={12} />
              <span>Tout réinitialiser</span>
            </button>
          </div>
        )}

        {/* Product Grid or Empty State */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#e0ddd4] rounded-3xl p-8 my-6 shadow-xs max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-[#9A9A9A] mx-auto flex items-center justify-center mb-4">
              <Search size={28} />
            </div>
            <h3 className="heading-font text-2xl font-bold text-[#1A1A1A] mb-2">
              Aucun parfum ne correspond à vos critères
            </h3>
            <p className="text-[13px] text-[#6B6B6B] mb-6 max-w-md mx-auto">
              Essayez d&apos;élargir votre recherche, de retirer certains filtres ou de réinitialiser vos sélections.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-blue px-6 py-2.5 rounded-full text-[12px] font-bold inline-flex items-center gap-2 shadow-md"
            >
              <RotateCcw size={14} />
              <span>Réinitialiser les filtres</span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-6">
              {filtered.slice((currentPage - 1) * 20, currentPage * 20).map((p) => (
                <div key={p.id} className="h-full">
                  <ProductCard product={p} onQuickView={setQuickViewProduct} />
                </div>
              ))}
            </div>

            {/* Pagination UI */}
            {Math.ceil(filtered.length / 20) > 1 && (() => {
              const totalPages = Math.ceil(filtered.length / 20);
              const getPaginationItems = () => {
                if (totalPages <= 7) {
                  return Array.from({ length: totalPages }, (_, i) => i + 1);
                }
                if (currentPage <= 4) {
                  return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
                }
                if (currentPage >= totalPages - 3) {
                  return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                }
                return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
              };

              return (
                <nav
                  aria-label="Pagination du catalogue"
                  className="flex flex-wrap justify-center items-center gap-2 mt-12 border-t border-[#e0ddd4] pt-8"
                >
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageHref(currentPage - 1)}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 border border-[#e0ddd4] rounded-full text-[11px] font-semibold tracking-wider uppercase hover:border-[#0ea5e9] transition-colors"
                      rel="prev"
                    >
                      Précédent
                    </Link>
                  ) : (
                    <span
                      className="px-4 py-2 border border-[#e0ddd4] rounded-full text-[11px] font-semibold tracking-wider uppercase opacity-30 cursor-not-allowed"
                      aria-disabled="true"
                    >
                      Précédent
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 mx-2">
                    {getPaginationItems().map((item, idx) => {
                      if (item === 'ellipsis') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 text-[#9A9A9A] text-[13px]">
                            …
                          </span>
                        );
                      }
                      const pageNum = item as number;
                      const isCurrent = pageNum === currentPage;
                      return (
                        <Link
                          key={pageNum}
                          href={buildPageHref(pageNum)}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors ${
                            isCurrent
                              ? 'bg-[#1A1A1A] text-white border border-[#1A1A1A]'
                              : 'border border-[#e0ddd4] text-[#1A1A1A] hover:border-[#0ea5e9]'
                          }`}
                          aria-current={isCurrent ? 'page' : undefined}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}
                  </div>

                  {currentPage < totalPages ? (
                    <Link
                      href={buildPageHref(currentPage + 1)}
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 border border-[#e0ddd4] rounded-full text-[11px] font-semibold tracking-wider uppercase hover:border-[#0ea5e9] transition-colors"
                      rel="next"
                    >
                      Suivant
                    </Link>
                  ) : (
                    <span
                      className="px-4 py-2 border border-[#e0ddd4] rounded-full text-[11px] font-semibold tracking-wider uppercase opacity-30 cursor-not-allowed"
                      aria-disabled="true"
                    >
                      Suivant
                    </span>
                  )}
                </nav>
              );
            })()}
          </>
        )}
      </div>

      {/* Advanced Responsive Filter Drawer */}
      <AnimatePresence>
        {filtersOpenMobile && (
          <div className="fixed inset-0 z-50 flex justify-start">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpenMobile(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-sm sm:max-w-md bg-white border-r border-[#e0ddd4] flex flex-col h-full shadow-2xl z-10"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#e0ddd4] flex items-center justify-between bg-[#fafaf7] shrink-0">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal size={18} className="text-[#0ea5e9]" />
                  <h3 className="heading-font text-xl font-bold text-[#1A1A1A]">Filtres</h3>
                  {activeCount > 0 && (
                    <span className="bg-[#0ea5e9] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {activeCount} actif{activeCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpenMobile(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center justify-center transition"
                  aria-label="Fermer les filtres"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Filters Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 lux-scrollbar space-y-6">
                <FiltersPanel
                  products={products}
                  brand={brand}
                  setBrand={setBrand}
                  brands={brands}
                  gender={gender}
                  setGender={setGender}
                  subcategory={subcategory}
                  setSubcategory={setSubcategory}
                  inStockOnly={inStockOnly}
                  setInStockOnly={setInStockOnly}
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  selectedSizes={selectedSizes}
                  toggleSize={toggleSize}
                  minRating={minRating}
                  setMinRating={setMinRating}
                  clearFilters={clearFilters}
                  activeCount={activeCount}
                  lockedBrand={!!lockedBrand}
                  lockedGender={!!lockedGender}
                  lockedSubcategory={!!lockedSubcategory}
                  lockedIsTester={lockedIsTester}
                />
              </div>

              {/* Drawer Sticky Footer with Result Count & Reset */}
              <div className="p-4 border-t border-[#e0ddd4] bg-[#fafaf7] flex items-center gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-1 py-3 px-4 rounded-full border border-[#e0ddd4] text-[12px] font-bold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-white transition text-center cursor-pointer"
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpenMobile(false)}
                  className="flex-2 btn-blue py-3 px-4 rounded-full text-[12px] font-bold shadow-md shadow-sky-500/20 active:scale-95 text-center cursor-pointer"
                >
                  Voir {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}

export default function ShopCatalog(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-[#9A9A9A]">Chargement du catalogue...</div>
      }
    >
      <ShopCatalogInner {...props} />
    </Suspense>
  );
}

/* ============================================================
   FILTERS PANEL COMPONENT
   ============================================================ */

function FiltersPanel(props: {
  products: Product[];
  brand: string;
  setBrand: (v: string) => void;
  brands: any[];
  gender: string;
  setGender: (v: string) => void;
  subcategory: string;
  setSubcategory: (v: string) => void;
  inStockOnly: boolean;
  setInStockOnly: React.Dispatch<React.SetStateAction<boolean>>;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  priceRange: [number, number];
  setPriceRange: (p: [number, number]) => void;
  selectedSizes: string[];
  toggleSize: (v: string) => void;
  minRating: number;
  setMinRating: (r: number) => void;
  clearFilters: () => void;
  activeCount: number;
  lockedBrand: boolean;
  lockedGender: boolean;
  lockedSubcategory: boolean;
  lockedIsTester?: boolean;
}) {
  const [brandSearch, setBrandSearch] = useState('');

  // Calculate live product counts per brand
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    props.products.forEach((p) => {
      const b = p.brand;
      if (b) counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [props.products]);

  // Sort and filter brands
  const filteredBrands = useMemo(() => {
    let list = [...props.brands].sort((a, b) => {
      const labelA = a.label || a.name || '';
      const labelB = b.label || b.name || '';
      return labelA.localeCompare(labelB);
    });

    if (brandSearch.trim()) {
      const q = brandSearch.toLowerCase();
      list = list.filter((b) => (b.label || b.name || '').toLowerCase().includes(q));
    }
    return list;
  }, [props.brands, brandSearch]);

  const allSubcategories = useMemo(() => {
    const map = new Map();
    MAIN_CATEGORIES.forEach((c) => {
      c.subcategories.forEach((s) => map.set(s.key, s));
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Disponibilité (In Stock Only) */}
      <FilterGroup title="Disponibilité">
        <label className="flex items-center justify-between p-3 rounded-xl border border-[#e0ddd4] bg-[#f8fafc] cursor-pointer hover:border-slate-400 transition">
          <span className="text-[12px] font-semibold text-[#1A1A1A]">En stock uniquement</span>
          <input
            type="checkbox"
            checked={props.inStockOnly}
            onChange={(e) => props.setInStockOnly(e.target.checked)}
            className="w-4 h-4 accent-[#0ea5e9] rounded cursor-pointer"
          />
        </label>
      </FilterGroup>

      {/* 2. Genre (Gender) */}
      {!props.lockedGender && (
        <FilterGroup title="Genre">
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'women', label: 'Femme' },
              { key: 'men', label: 'Homme' },
              { key: 'unisex', label: 'Mixte' },
            ].map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => props.setGender(g.key)}
                className={`py-2 px-3 rounded-xl text-[12px] font-semibold border transition ${
                  props.gender === g.key
                    ? 'border-[#0ea5e9] bg-sky-50 text-[#0ea5e9] ring-1 ring-[#0ea5e9]'
                    : 'border-[#e0ddd4] bg-white text-[#6B6B6B] hover:border-slate-400'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* 3. Prix (Price Presets & Slider) */}
      <FilterGroup title="Budget (MAD)">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRICE_PRESETS.map((preset) => {
            const isSelected =
              props.priceRange[0] === preset.min && props.priceRange[1] === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => props.setPriceRange([preset.min, preset.max])}
                className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition ${
                  isSelected
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#6B6B6B] border-[#e0ddd4] hover:border-slate-400'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            value={props.priceRange[0]}
            min={0}
            max={3000}
            step={50}
            onChange={(e) =>
              props.setPriceRange([parseInt(e.target.value) || 0, props.priceRange[1]])
            }
            className="w-full border border-[#e0ddd4] rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-[#0ea5e9]"
            placeholder="Min"
          />
          <span className="text-[#9A9A9A] text-xs">—</span>
          <input
            type="number"
            value={props.priceRange[1]}
            min={0}
            max={3000}
            step={50}
            onChange={(e) =>
              props.setPriceRange([props.priceRange[0], parseInt(e.target.value) || 3000])
            }
            className="w-full border border-[#e0ddd4] rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-[#0ea5e9]"
            placeholder="Max"
          />
        </div>
      </FilterGroup>

      {/* 4. Marque (Brand) */}
      {!props.lockedBrand && (
        <FilterGroup title="Marque">
          {props.brands.length > 5 && (
            <div className="relative mb-2">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]"
              />
              <input
                type="text"
                placeholder="Filtrer les marques…"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e0ddd4] rounded-lg py-1.5 pl-8 pr-2.5 text-[11px] focus:outline-none focus:border-[#0ea5e9]"
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto lux-scrollbar space-y-1 pr-1">
            <RadioOption
              label="Toutes les marques"
              checked={props.brand === 'all'}
              count={props.products.length}
              onChange={() => props.setBrand('all')}
            />
            {filteredBrands.map((b) => (
              <RadioOption
                key={b.slug}
                label={b.label || b.name}
                checked={props.brand === b.slug}
                count={brandCounts[b.slug] || 0}
                onChange={() => props.setBrand(b.slug)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      {/* 5. Famille Olfactive (Subcategory) */}
      {!props.lockedSubcategory && (
        <FilterGroup title="Famille Olfactive">
          <div className="max-h-48 overflow-y-auto lux-scrollbar space-y-1 pr-1">
            <RadioOption
              label="Toutes les familles"
              checked={props.subcategory === 'all'}
              onChange={() => props.setSubcategory('all')}
            />
            {allSubcategories.map((s) => (
              <RadioOption
                key={s.key}
                label={s.label}
                checked={props.subcategory === s.key}
                onChange={() => props.setSubcategory(s.key)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      {/* 6. Contenance (Sizes) */}
      <FilterGroup title="Contenance">
        <div className="grid grid-cols-2 gap-2">
          {SIZE_RANGES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => props.toggleSize(s.key)}
              className={`text-[11px] font-medium py-2 rounded-xl border transition ${
                props.selectedSizes.includes(s.key)
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'border-[#e0ddd4] bg-white text-[#6B6B6B] hover:border-slate-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#9A9A9A] mb-3">
        {title}
      </h4>
      {children}
    </div>
  );
}

function RadioOption({
  label,
  checked,
  count,
  onChange,
}: {
  label: string;
  checked: boolean;
  count?: number;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1.5 px-2 rounded-lg hover:bg-[#f8fafc] transition">
      <div className="flex items-center gap-2.5">
        <input
          type="radio"
          checked={checked}
          onChange={onChange}
          className="w-3.5 h-3.5 accent-[#0ea5e9] cursor-pointer"
        />
        <span
          className={`text-[12px] sm:text-[13px] transition-colors ${
            checked ? 'text-[#0ea5e9] font-bold' : 'text-[#4A4A4A]'
          }`}
        >
          {label}
        </span>
      </div>
      {typeof count === 'number' && (
        <span className="text-[11px] text-[#9A9A9A] font-medium">{count}</span>
      )}
    </label>
  );
}
