'use client';

/**
 * ShopCatalog — reusable catalog UI with all filters.
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
import { useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, X, Star, ChevronDown, Check, Search } from 'lucide-react';

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

const COLORS = [
  { key: 'clear', label: 'Transparent', hex: '#EDEDED' },
  { key: 'purple', label: 'Violet', hex: '#0ea5e9' },
  { key: 'black', label: 'Noir', hex: '#f8fafc' },
  { key: 'pink', label: 'Rose', hex: '#E8B4C4' },
  { key: 'red', label: 'Rouge', hex: '#C05353' },
  { key: 'silver', label: 'Argent', hex: '#B8B8B8' },
  { key: 'green', label: 'Vert', hex: '#4A6B4E' },
  { key: 'amber', label: 'Ambre', hex: '#B87333' },
];

const MATERIALS = [
  { key: 'glass', label: 'Verre' },
  { key: 'crystal', label: 'Cristal' },
  { key: 'matte', label: 'Verre mat' },
  { key: 'metallic', label: 'Métallique' },
];

const SIZE_RANGES = [
  { key: 'small', label: '30-40ml', min: 30, max: 40 },
  { key: 'medium', label: '50-75ml', min: 50, max: 75 },
  { key: 'large', label: '90-125ml', min: 90, max: 125 },
  { key: 'xlarge', label: '150ml+', min: 150, max: 500 },
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
  const pageParam = parseInt(searchParams?.get('page') || '1', 10);
  const initialPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const initialSub = searchParams?.get('sub') || 'all';
  const initialType = searchParams?.get('type') || 'all';
  const initialSort = searchParams?.get('sort') as SortKey || 'featured';
  const initialSpecial = searchParams?.get('special') || 'all';
  const initialSeasonsStr = searchParams?.get('seasons');
  const initialSeasons = initialSeasonsStr ? initialSeasonsStr.split(',') : [];

  const [brand, setBrand] = useState<string>('all');
  const [gender, setGender] = useState<string>(lockedGender || 'all');
  const [subcategory, setSubcategory] = useState<string>(lockedSubcategory || initialSub);
  const [typeFilter, setTypeFilter] = useState<string>(initialType);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialSeasons);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortKey>(initialSort);
  const [specialFilter, setSpecialFilter] = useState<string>(initialSpecial);
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state if URL changes (useful for navigation within the same page)
  useEffect(() => {
    if (searchParams) {
      const sub = searchParams.get('sub');
      const sort = searchParams.get('sort');
      const special = searchParams.get('special');
      const type = searchParams.get('type');
      const seasonsStr = searchParams.get('seasons');
      const p = parseInt(searchParams.get('page') || '1', 10);
      
      if (sub && sub !== subcategory && !lockedSubcategory) setSubcategory(sub);
      if (type && type !== typeFilter) setTypeFilter(type);
      if (sort && sort !== sortBy) setSortBy(sort as SortKey);
      if (special && special !== specialFilter) setSpecialFilter(special);
      if (seasonsStr) {
        const seasons = seasonsStr.split(',');
        if (seasons.join(',') !== selectedSeasons.join(',')) {
          setSelectedSeasons(seasons);
        }
      }
      const validP = isNaN(p) || p < 1 ? 1 : p;
      setCurrentPage(validP);
    }
  }, [searchParams]);

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

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [brand, gender, subcategory, typeFilter, priceRange, selectedSizes, selectedColors, selectedMaterials, minRating, sortBy, specialFilter, searchQuery]);

  const toggleFrom = (list: string[], value: string): string[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const filtered = useMemo(() => {
    let list: Product[] = [...products];

    // Lock isTester if passed
    if (lockedIsTester !== undefined) {
      list = list.filter((p) => (lockedIsTester ? p.isTester === true : p.isTester === false));
    } else if (typeFilter !== 'all') {
      if (typeFilter === 'testers') list = list.filter((p) => p.isTester === true);
      else if (typeFilter === 'originals') list = list.filter((p) => p.isTester === false && p.subcategory !== 'coffrets' && (p.subcategory as string) !== 'master-copier');
      else if (typeFilter === 'oriental') list = list.filter((p) => (p.subcategory as string) === 'arabic' || p.subcategory === 'oriental');
      else if (typeFilter === 'coffrets') list = list.filter((p) => p.subcategory === 'coffrets' || p.subcategory === 'gift-bundles' || p.subcategory === 'discovery-sets');
      else if (typeFilter === 'master-copier') list = list.filter((p) => (p.subcategory as string) === 'master-copier');
    }

    if (lockedBrand) list = list.filter((p) => p.brand === lockedBrand);
    else if (brand !== 'all') list = list.filter((p) => p.brand === brand);

    if (lockedGender) list = list.filter((p) => p.gender === lockedGender);
    else if (gender !== 'all') list = list.filter((p) => p.gender === gender);

    if (subcategory !== 'all') list = list.filter((p) => p.subcategory === subcategory);

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => 
        p.name.toLowerCase().includes(q) || 
        p.brand?.toLowerCase().includes(q) || 
        p.brandLabel?.toLowerCase().includes(q)
      );
    }

    list = list.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    if (selectedSeasons.length > 0)
      list = list.filter((p) => {
        if (!p.perfectSeason) return false;
        const pSeason = p.perfectSeason.toLowerCase();
        // Check if the product's season string contains ANY of the selected seasons
        return selectedSeasons.some((s) => {
          const sLower = s.toLowerCase();
          // Normalize accents for 'été' vs 'ete'
          if (sLower === 'été' || sLower === 'ete') {
            return pSeason.includes('été') || pSeason.includes('ete');
          }
          return pSeason.includes(sLower);
        });
      });

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

    if (selectedColors.length > 0)
      list = list.filter((p) => selectedColors.includes(p.bottleColor));

    if (selectedMaterials.length > 0)
      list = list.filter((p) => selectedMaterials.includes(p.bottleMaterial));

    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);

    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => {
          const aInStock = (a.inStock !== false && (a.stock === undefined || a.stock > 0)) ? 1 : 0;
          const bInStock = (b.inStock !== false && (b.stock === undefined || b.stock > 0)) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;
          return a.price - b.price;
        });
        break;
      case 'price-high':
        list.sort((a, b) => {
          const aInStock = (a.inStock !== false && (a.stock === undefined || a.stock > 0)) ? 1 : 0;
          const bInStock = (b.inStock !== false && (b.stock === undefined || b.stock > 0)) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;
          return b.price - a.price;
        });
        break;
      case 'rating':
        list.sort((a, b) => {
          const aInStock = (a.inStock !== false && (a.stock === undefined || a.stock > 0)) ? 1 : 0;
          const bInStock = (b.inStock !== false && (b.stock === undefined || b.stock > 0)) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;
          return b.rating - a.rating;
        });
        break;
      case 'newest':
        list.sort((a, b) => {
          const aInStock = (a.inStock !== false && (a.stock === undefined || a.stock > 0)) ? 1 : 0;
          const bInStock = (b.inStock !== false && (b.stock === undefined || b.stock > 0)) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        });
        break;
      case 'name':
        list.sort((a, b) => {
          const aInStock = (a.inStock !== false && (a.stock === undefined || a.stock > 0)) ? 1 : 0;
          const bInStock = (b.inStock !== false && (b.stock === undefined || b.stock > 0)) ? 1 : 0;
          if (aInStock !== bInStock) return bInStock - aInStock;
          return a.name.localeCompare(b.name);
        });
        break;
      default:
        list.sort((a, b) => {
          const aInStock = (a.inStock !== false && (a.stock === undefined || a.stock > 0)) ? 1 : 0;
          const bInStock = (b.inStock !== false && (b.stock === undefined || b.stock > 0)) ? 1 : 0;
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
  }, [brand, gender, subcategory, priceRange, selectedSizes, selectedColors, selectedMaterials, minRating, sortBy, lockedBrand, lockedGender, selectedSeasons, specialFilter, searchQuery, recommendedSlugs]);

  const clearFilters = () => {
    if (!lockedBrand) setBrand('all');
    if (!lockedGender) setGender('all');
    if (!lockedSubcategory) setSubcategory('all');
    if (lockedIsTester === undefined) setTypeFilter('all');
    setPriceRange([0, 3000]);
    setSelectedSizes([]);
    setSelectedSeasons([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setMinRating(0);
    setSpecialFilter('all');
  };

  const activeCount =
    (brand !== 'all' && !lockedBrand ? 1 : 0) +
    (gender !== 'all' && !lockedGender ? 1 : 0) +
    (subcategory !== 'all' && !lockedSubcategory ? 1 : 0) +
    (typeFilter !== 'all' && lockedIsTester === undefined ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 3000 ? 1 : 0) +
    selectedSeasons.length +
    selectedSizes.length +
    selectedColors.length +
    selectedMaterials.length +
    (minRating > 0 ? 1 : 0) +
    (specialFilter !== 'all' ? 1 : 0);

  return (
    <>
      <div className="w-full">
        {/* --- Products --- */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-[#e0ddd4] gap-4">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <button
                onClick={() => setFiltersOpenMobile(true)}
                className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#0ea5e9] transition-colors"
              >
                <SlidersHorizontal size={16} /> Filtres
                {activeCount > 0 && (
                  <span className="bg-[#0ea5e9] text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px]">
                    {activeCount}
                  </span>
                )}
              </button>
              
              <div className="hidden sm:block w-px h-6 bg-[#e0ddd4]"></div>
              
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                <input 
                  type="text"
                  placeholder="Rechercher dans la boutique..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e0ddd4] rounded-full py-2 pl-10 pr-4 text-[13px] text-[#1A1A1A] focus:outline-none focus:border-[#0ea5e9] transition-colors placeholder:text-[#9A9A9A]"
                />
              </div>

              <div className="text-[11px] font-medium tracking-widest uppercase text-[#9A9A9A] hidden lg:block">
                {filtered.length} produit{filtered.length > 1 ? 's' : ''}
              </div>
            </div>
            {/* Zara-style Sorting */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="appearance-none bg-transparent border border-[#e0ddd4] rounded-full px-5 py-2 pr-9 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1A1A1A] focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
              >
                <option value="featured">Recommandés</option>
                <option value="newest">Nouveautés</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
                <option value="rating">Meilleures notes</option>
                <option value="name">A-Z</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9A9A9A]" />
            </div>
          </div>
            {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="heading-font text-3xl text-[#1A1A1A]/60 mb-3">
                Aucun parfum ne correspond à vos filtres
              </div>
              <p className="text-[13px] text-[#9A9A9A] mb-6">
                Essayez d&apos;ajuster vos critères de recherche.
              </p>
              <button onClick={clearFilters} className="btn-outline-blue px-8 py-3 text-[11px] rounded-full">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
                {filtered.slice((currentPage - 1) * 20, currentPage * 20).map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ProductCard product={p} onQuickView={setQuickViewProduct} />
                  </motion.div>
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
                  <nav aria-label="Pagination du catalogue" className="flex flex-wrap justify-center items-center gap-2 mt-12 border-t border-[#e0ddd4] pt-8">
                    {currentPage > 1 ? (
                      <Link 
                        href={buildPageHref(currentPage - 1)}
                        onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="px-4 py-2 border border-[#e0ddd4] rounded-full text-[11px] font-semibold tracking-[0.1em] uppercase hover:border-[#0ea5e9] transition-colors"
                        rel="prev"
                      >
                        Précédent
                      </Link>
                    ) : (
                      <span 
                        className="px-4 py-2 border border-[#e0ddd4] rounded-full text-[11px] font-semibold tracking-[0.1em] uppercase opacity-30 cursor-not-allowed"
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
                            onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
                        onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="px-4 py-2 border border-[#e0ddd4] rounded-full text-[11px] font-semibold tracking-[0.1em] uppercase hover:border-[#0ea5e9] transition-colors"
                        rel="next"
                      >
                        Suivant
                      </Link>
                    ) : (
                      <span 
                        className="px-4 py-2 border border-[#e0ddd4] rounded-full text-[11px] font-semibold tracking-[0.1em] uppercase opacity-30 cursor-not-allowed"
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
      </div>

      {/* Unified Filters Drawer (Desktop & Mobile) */}
      {filtersOpenMobile && (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300" onClick={() => setFiltersOpenMobile(false)} />
          <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white border border-[#e0ddd4] overflow-auto p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="heading-font text-2xl">Filtres</h3>
              <button onClick={() => setFiltersOpenMobile(false)} className="text-[#9A9A9A]">
                <X size={22} />
              </button>
            </div>
            <FiltersPanel
              brand={brand} setBrand={setBrand}
              brands={brands}
              gender={gender} setGender={setGender}
              subcategory={subcategory} setSubcategory={setSubcategory}
              typeFilter={typeFilter} setTypeFilter={setTypeFilter}
              priceRange={priceRange} setPriceRange={setPriceRange}
              selectedSeasons={selectedSeasons} toggleSeason={(v) => setSelectedSeasons(toggleFrom(selectedSeasons, v))}
              selectedSizes={selectedSizes} toggleSize={(v) => setSelectedSizes(toggleFrom(selectedSizes, v))}
              selectedColors={selectedColors} toggleColor={(v) => setSelectedColors(toggleFrom(selectedColors, v))}
              selectedMaterials={selectedMaterials} toggleMaterial={(v) => setSelectedMaterials(toggleFrom(selectedMaterials, v))}
              minRating={minRating} setMinRating={setMinRating}
              specialFilter={specialFilter} setSpecialFilter={setSpecialFilter}
              clearFilters={clearFilters} activeCount={activeCount}
              lockedBrand={!!lockedBrand} lockedGender={!!lockedGender} lockedSubcategory={!!lockedSubcategory}
              lockedIsTester={lockedIsTester}
            />
            <button
              onClick={() => setFiltersOpenMobile(false)}
              className="btn-blue w-full py-4 mt-8 text-[11px] rounded-full"
            >
              Voir {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
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
    <Suspense fallback={<div className="py-24 text-center text-[#9A9A9A]">Chargement du catalogue...</div>}>
      <ShopCatalogInner {...props} />
    </Suspense>
  );
}

/* ============================================================
   FILTERS PANEL
   ============================================================ */

function FiltersPanel(props: {
  brand: string; setBrand: (v: string) => void;
  brands: any[];
  gender: string; setGender: (v: string) => void;
  subcategory: string; setSubcategory: (v: string) => void;
  typeFilter: string; setTypeFilter: (v: string) => void;
  priceRange: [number, number]; setPriceRange: (p: [number, number]) => void;
  selectedSeasons: string[]; toggleSeason: (v: string) => void;
  selectedSizes: string[]; toggleSize: (v: string) => void;
  selectedColors: string[]; toggleColor: (v: string) => void;
  selectedMaterials: string[]; toggleMaterial: (v: string) => void;
  minRating: number; setMinRating: (r: number) => void;
  specialFilter: string; setSpecialFilter: (v: string) => void;
  clearFilters: () => void; activeCount: number;
  lockedBrand: boolean; lockedGender: boolean; lockedSubcategory: boolean;
  lockedIsTester?: boolean;
}) {
  const allSubcategories = React.useMemo(() => {
    const map = new Map();
    MAIN_CATEGORIES.forEach(c => {
      c.subcategories.forEach(s => map.set(s.key, s));
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  // Sort brands alphabetically
  const sortedBrands = React.useMemo(() => {
    return [...props.brands].sort((a, b) => {
      const labelA = a.label || a.name || '';
      const labelB = b.label || b.name || '';
      return labelA.localeCompare(labelB);
    });
  }, [props.brands]);

  return (
    <div className="space-y-8">
      {props.activeCount > 0 && (
        <button
          onClick={props.clearFilters}
          className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0ea5e9] hover:text-[#7e22ce] flex items-center gap-2"
        >
          <X size={12} /> Effacer ({props.activeCount})
        </button>
      )}

      {/* Collection / Type */}
      {props.lockedIsTester === undefined && !props.lockedSubcategory && (
        <FilterGroup title="Collection / Type">
          <RadioOption label="Toutes les collections" checked={props.typeFilter === 'all'} onChange={() => props.setTypeFilter('all')} />
          <RadioOption label="💎 Testeurs de Luxe" checked={props.typeFilter === 'testers'} onChange={() => props.setTypeFilter('testers')} />
          <RadioOption label="📦 Parfums Originaux (Scellés)" checked={props.typeFilter === 'originals'} onChange={() => props.setTypeFilter('originals')} />
          <RadioOption label="🌙 Parfums Orientaux / Arabes" checked={props.typeFilter === 'oriental'} onChange={() => props.setTypeFilter('oriental')} />
          <RadioOption label="🎁 Coffrets Cadeaux" checked={props.typeFilter === 'coffrets'} onChange={() => props.setTypeFilter('coffrets')} />
        </FilterGroup>
      )}

      {/* Brand */}
      {!props.lockedBrand && (
        <FilterGroup title="Marque">
          <RadioOption label="Toutes les marques" checked={props.brand === 'all'} onChange={() => props.setBrand('all')} />
          {sortedBrands.map((b) => (
            <RadioOption key={b.slug} label={b.label || b.name} checked={props.brand === b.slug} onChange={() => props.setBrand(b.slug)} />
          ))}
        </FilterGroup>
      )}

      {/* Gender */}
      {!props.lockedGender && (
        <FilterGroup title="Genre">
          <RadioOption label="Tous" checked={props.gender === 'all'} onChange={() => { props.setGender('all'); props.setSubcategory('all'); }} />
          {MAIN_CATEGORIES.map((c) => (
            <RadioOption key={c.key} label={c.labelShort} checked={props.gender === c.key} onChange={() => { props.setGender(c.key); props.setSubcategory('all'); }} />
          ))}
        </FilterGroup>
      )}

      {/* Subcategory */}
      {!props.lockedSubcategory && (
        <FilterGroup title="Famille olfactive">
          <RadioOption label="Toutes" checked={props.subcategory === 'all'} onChange={() => props.setSubcategory('all')} />
          {allSubcategories.map((s) => (
            <RadioOption key={s.key} label={s.label} checked={props.subcategory === s.key} onChange={() => props.setSubcategory(s.key)} />
          ))}
        </FilterGroup>
      )}

      {/* Price */}
      <FilterGroup title="Prix (MAD)">
        <div className="flex items-center gap-2 mb-3">
          <input type="number" value={props.priceRange[0]} min={0} max={3000} step={100}
            onChange={(e) => props.setPriceRange([parseInt(e.target.value) || 0, props.priceRange[1]])}
            className="w-full border border-[#e0ddd4] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#0ea5e9]"
          />
          <span className="text-[#9A9A9A] text-sm">—</span>
          <input type="number" value={props.priceRange[1]} min={0} max={3000} step={100}
            onChange={(e) => props.setPriceRange([props.priceRange[0], parseInt(e.target.value) || 3000])}
            className="w-full border border-[#e0ddd4] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#0ea5e9]"
          />
        </div>
        <input type="range" min={0} max={3000} step={100} value={props.priceRange[1]}
          onChange={(e) => props.setPriceRange([props.priceRange[0], parseInt(e.target.value)])}
          className="w-full accent-[#0ea5e9]"
        />
        <div className="flex justify-between text-[10px] text-[#9A9A9A] mt-1">
          <span>0 MAD</span><span>3 000 MAD</span>
        </div>
      </FilterGroup>

      
      {/* Season */}
      <FilterGroup title="Saison Idéale">
        <div className="space-y-2.5">
          {['Printemps', 'Été', 'Automne', 'Hiver', 'Toutes Saisons'].map((m) => (
            <label key={m} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={props.selectedSeasons.includes(m)}
                onChange={() => props.toggleSeason(m)}
                className="w-4 h-4 accent-[#0ea5e9]"
              />
              <span className={`text-[13px] transition-colors ${
                props.selectedSeasons.includes(m) ? 'text-[#1A1A1A] font-semibold' : 'text-[#6B6B6B]'
              }`}>{m}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Size */}
      <FilterGroup title="Contenance">
        <div className="grid grid-cols-2 gap-2">
          {SIZE_RANGES.map((s) => (
            <button
              key={s.key}
              onClick={() => props.toggleSize(s.key)}
              className={`text-[11px] py-2 rounded-full border transition-all ${
                props.selectedSizes.includes(s.key)
                  ? 'bg-[#f8fafc] text-white border-[#f8fafc]'
                  : 'border-[#e0ddd4] text-[#6B6B6B] hover:border-[#0ea5e9]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Material */}
      <FilterGroup title="Matière">
        <div className="space-y-2.5">
          {MATERIALS.map((m) => (
            <label key={m.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={props.selectedMaterials.includes(m.key)}
                onChange={() => props.toggleMaterial(m.key)}
                className="w-4 h-4 accent-[#0ea5e9]"
              />
              <span className={`text-[13px] transition-colors ${
                props.selectedMaterials.includes(m.key) ? 'text-[#1A1A1A] font-semibold' : 'text-[#6B6B6B]'
              }`}>{m.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Rating */}
      <FilterGroup title="Note minimale">
        <div className="space-y-2.5">
          {[0, 4, 4.5, 4.8].map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="rating" checked={props.minRating === r} onChange={() => props.setMinRating(r)} className="w-4 h-4 accent-[#0ea5e9]" />
              <div className="flex items-center gap-2">
                {r === 0 ? (
                  <span className="text-[13px] text-[#6B6B6B]">Toutes les notes</span>
                ) : (
                  <>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={11}
                          className={i < Math.floor(r) ? 'text-[#0ea5e9] fill-[#0ea5e9]' : 'text-[#e0ddd4] fill-[#e0ddd4]'}
                        />
                      ))}
                    </div>
                    <span className="text-[13px] text-[#6B6B6B]">&amp; plus</span>
                  </>
                )}
              </div>
            </label>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#9A9A9A] mb-4">{title}</h4>
      {children}
    </div>
  );
}

function RadioOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <input type="radio" checked={checked} onChange={onChange} className="w-4 h-4 accent-[#0ea5e9]" />
      <span className={`text-[13px] transition-colors ${checked ? 'text-[#1A1A1A] font-semibold' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'}`}>
        {label}
      </span>
    </label>
  );
}
