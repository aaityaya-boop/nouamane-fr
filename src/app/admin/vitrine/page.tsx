'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  Search, 
  Check, 
  Loader2, 
  LayoutDashboard, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUp,
  GripVertical,
  Trash2, 
  User, 
  Users, 
  Gift, 
  ShoppingBag, 
  Copy,
  ExternalLink,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

interface Product {
  id: number;
  slug: string;
  name: string;
  brandLabel: string;
  price: number;
  gender: string;
  subcategory: string;
  images: string;
}

type TabKey = 
  | 'bestsellers' 
  | 'seasonal' 
  | 'latest' 
  | 'recommendedMen' 
  | 'recommendedWomen' 
  | 'recommendedUnisex' 
  | 'recommendedOriental' 
  | 'recommendedMaster' 
  | 'recommendedCoffrets' 
  | 'recommendedShop';

interface TabConfig {
  key: TabKey;
  label: string;
  group: 'home' | 'shop';
  icon: React.ReactNode;
  pageUrl: string;
  pageLabel: string;
  description: string;
  defaultSubcategory?: string;
  defaultGender?: string;
}

const TABS: TabConfig[] = [
  // Boutique & Catégories
  {
    key: 'recommendedMen',
    label: 'Homme',
    group: 'shop',
    icon: <User size={14} className="text-neutral-600" />,
    pageUrl: '/fr/shop/men',
    pageLabel: '/shop/men',
    description: 'Parfums recommandés affichés en premier dans la catégorie Homme.',
    defaultGender: 'men'
  },
  {
    key: 'recommendedWomen',
    label: 'Femme',
    group: 'shop',
    icon: <User size={14} className="text-neutral-600" />,
    pageUrl: '/fr/shop/women',
    pageLabel: '/shop/women',
    description: 'Parfums recommandés affichés en premier dans la catégorie Femme.',
    defaultGender: 'women'
  },
  {
    key: 'recommendedUnisex',
    label: 'Unisexe',
    group: 'shop',
    icon: <Users size={14} className="text-neutral-600" />,
    pageUrl: '/fr/shop/unisex',
    pageLabel: '/shop/unisex',
    description: 'Parfums recommandés affichés en premier dans la catégorie Unisexe.',
    defaultGender: 'unisex'
  },
  {
    key: 'recommendedOriental',
    label: 'Originaux',
    group: 'shop',
    icon: <Sparkles size={14} className="text-neutral-600" />,
    pageUrl: '/fr/parfums-originaux',
    pageLabel: '/parfums-originaux',
    description: 'Parfums recommandés affichés en premier dans Parfums Originaux.',
    defaultSubcategory: 'arabic'
  },
  {
    key: 'recommendedMaster',
    label: 'Master Copy',
    group: 'shop',
    icon: <Copy size={14} className="text-neutral-600" />,
    pageUrl: '/fr/master-copier',
    pageLabel: '/master-copier',
    description: 'Parfums recommandés affichés en premier dans Master Copy.',
    defaultSubcategory: 'master-copier'
  },
  {
    key: 'recommendedCoffrets',
    label: 'Coffrets',
    group: 'shop',
    icon: <Gift size={14} className="text-neutral-600" />,
    pageUrl: '/fr/coffrets',
    pageLabel: '/coffrets',
    description: 'Coffrets recommandés affichés en premier dans la page Coffrets Cadeaux.',
    defaultSubcategory: 'coffrets'
  },
  {
    key: 'recommendedShop',
    label: 'Toute la Boutique',
    group: 'shop',
    icon: <ShoppingBag size={14} className="text-neutral-600" />,
    pageUrl: '/fr/shop',
    pageLabel: '/shop',
    description: 'Parfums recommandés affichés en premier sur la Boutique Globale (Testeurs).'
  },
  // Accueil
  {
    key: 'bestsellers',
    label: 'Bestsellers Accueil',
    group: 'home',
    icon: <Flame size={14} className="text-neutral-600" />,
    pageUrl: '/fr',
    pageLabel: 'Accueil',
    description: 'Section "Nos Bestsellers" sur la page d\'accueil.'
  },
  {
    key: 'seasonal',
    label: 'Tendances Accueil',
    group: 'home',
    icon: <Sparkles size={14} className="text-neutral-600" />,
    pageUrl: '/fr',
    pageLabel: 'Accueil',
    description: 'Section "Tendances Saisonnières" sur la page d\'accueil.'
  },
  {
    key: 'latest',
    label: 'Nouveautés Accueil',
    group: 'home',
    icon: <Sparkles size={14} className="text-neutral-600" />,
    pageUrl: '/fr',
    pageLabel: 'Accueil',
    description: 'Section "Dernières Sorties" sur la page d\'accueil.'
  }
];

export default function VitrinePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  // Home states
  const [bestsellersSlug, setBestsellersSlug] = useState<string[]>([]);
  const [seasonalSlug, setSeasonalSlug] = useState<string[]>([]);
  const [latestSlug, setLatestSlug] = useState<string[]>([]);
  const [seasonalTrendTitle, setSeasonalTrendTitle] = useState('Tendances Printemps-Été');
  const [seasonalTrendSubtitle, setSeasonalTrendSubtitle] = useState('Nos fragrances fraîches, solaires et florales pour la belle saison.');

  // Category & Shop recommended states
  const [recommendedMen, setRecommendedMen] = useState<string[]>([]);
  const [recommendedWomen, setRecommendedWomen] = useState<string[]>([]);
  const [recommendedUnisex, setRecommendedUnisex] = useState<string[]>([]);
  const [recommendedOriental, setRecommendedOriental] = useState<string[]>([]);
  const [recommendedMaster, setRecommendedMaster] = useState<string[]>([]);
  const [recommendedCoffrets, setRecommendedCoffrets] = useState<string[]>([]);
  const [recommendedShop, setRecommendedShop] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>('recommendedMen');
  const [search, setSearch] = useState('');
  const [filterByCategoryOnly, setFilterByCategoryOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
    ]).then(([products, config]) => {
      const productList = Array.isArray(products) ? products : [];
      setAllProducts(productList);
      const validSlugs = new Set(productList.map(p => p.slug));
      const parseValid = (raw: string | undefined): string[] => {
        try {
          const arr = JSON.parse(raw || '[]');
          return Array.isArray(arr) ? arr.filter((s: string) => validSlugs.has(s)) : [];
        } catch {
          return [];
        }
      };

      try {
        setBestsellersSlug(parseValid(config.featuredBestsellers));
        setSeasonalSlug(parseValid(config.featuredSeasonal));
        setLatestSlug(parseValid(config.featuredLatest));
        if (config.seasonalTrendTitle) setSeasonalTrendTitle(config.seasonalTrendTitle);
        if (config.seasonalTrendSubtitle) setSeasonalTrendSubtitle(config.seasonalTrendSubtitle);

        setRecommendedMen(parseValid(config.recommendedMen));
        setRecommendedWomen(parseValid(config.recommendedWomen));
        setRecommendedUnisex(parseValid(config.recommendedUnisex));
        setRecommendedOriental(parseValid(config.recommendedOriental));
        setRecommendedMaster(parseValid(config.recommendedMaster));
        setRecommendedCoffrets(parseValid(config.recommendedCoffrets));
        setRecommendedShop(parseValid(config.recommendedShop));
      } catch {
        // Safe fallbacks
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const getActiveSlugs = (): string[] => {
    switch (activeTab) {
      case 'bestsellers': return bestsellersSlug;
      case 'seasonal': return seasonalSlug;
      case 'latest': return latestSlug;
      case 'recommendedMen': return recommendedMen;
      case 'recommendedWomen': return recommendedWomen;
      case 'recommendedUnisex': return recommendedUnisex;
      case 'recommendedOriental': return recommendedOriental;
      case 'recommendedMaster': return recommendedMaster;
      case 'recommendedCoffrets': return recommendedCoffrets;
      case 'recommendedShop': return recommendedShop;
    }
  };

  const setActiveSlugs = (updater: (prev: string[]) => string[]) => {
    switch (activeTab) {
      case 'bestsellers': setBestsellersSlug(updater); break;
      case 'seasonal': setSeasonalSlug(updater); break;
      case 'latest': setLatestSlug(updater); break;
      case 'recommendedMen': setRecommendedMen(updater); break;
      case 'recommendedWomen': setRecommendedWomen(updater); break;
      case 'recommendedUnisex': setRecommendedUnisex(updater); break;
      case 'recommendedOriental': setRecommendedOriental(updater); break;
      case 'recommendedMaster': setRecommendedMaster(updater); break;
      case 'recommendedCoffrets': setRecommendedCoffrets(updater); break;
      case 'recommendedShop': setRecommendedShop(updater); break;
    }
  };

  const currentSlugs = getActiveSlugs();
  const currentTabConfig = TABS.find(t => t.key === activeTab)!;

  const toggleProduct = (slug: string) => {
    setActiveSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleReorder = (newSlugs: string[]) => {
    setActiveSlugs(() => newSlugs);
  };

  const moveToTop = (index: number) => {
    if (index === 0) return;
    setActiveSlugs(prev => {
      const item = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [item, ...rest];
    });
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    setActiveSlugs(prev => {
      const newSlugs = [...prev];
      if (direction === 'up' && index > 0) {
        [newSlugs[index - 1], newSlugs[index]] = [newSlugs[index], newSlugs[index - 1]];
      } else if (direction === 'down' && index < newSlugs.length - 1) {
        [newSlugs[index + 1], newSlugs[index]] = [newSlugs[index], newSlugs[index + 1]];
      }
      return newSlugs;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featuredBestsellers: JSON.stringify(bestsellersSlug),
          featuredSeasonal: JSON.stringify(seasonalSlug),
          featuredLatest: JSON.stringify(latestSlug),
          seasonalTrendTitle,
          seasonalTrendSubtitle,
          recommendedMen: JSON.stringify(recommendedMen),
          recommendedWomen: JSON.stringify(recommendedWomen),
          recommendedUnisex: JSON.stringify(recommendedUnisex),
          recommendedOriental: JSON.stringify(recommendedOriental),
          recommendedMaster: JSON.stringify(recommendedMaster),
          recommendedCoffrets: JSON.stringify(recommendedCoffrets),
          recommendedShop: JSON.stringify(recommendedShop),
        }),
      });
      if (res.ok) {
        setSaveMsg('Recommandations enregistrées avec succès !');
        setTimeout(() => setSaveMsg(''), 4000);
      } else {
        setSaveMsg('Erreur lors de la sauvegarde.');
      }
    } catch {
      setSaveMsg('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter products for library
  const filtered = allProducts.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brandLabel.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (!filterByCategoryOnly) return true;

    // Smart contextual filtering based on active tab
    if (currentTabConfig.defaultGender) {
      return p.gender === currentTabConfig.defaultGender || p.gender === 'unisex';
    }
    if (currentTabConfig.defaultSubcategory) {
      return p.subcategory === currentTabConfig.defaultSubcategory;
    }

    return true;
  });

  const getImage = (p: Product) => {
    try { return JSON.parse(p.images)[0] || '/images/hero.png'; } catch { return '/images/hero.png'; }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-neutral-800 mb-3" size={32} />
        <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase">Chargement des recommandations...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#f8fafc]">
      {/* Sticky Top Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-6 lg:px-8 py-3.5 flex items-center justify-between z-20 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Vitrine & Recommandations</h1>
          <p className="text-xs text-neutral-500 font-normal">Choisissez et ordonnez les parfums mis en avant pour chaque catégorie</p>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {saveMsg && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg shadow-2xs ${
                  saveMsg.includes('succès') 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <Check size={13} />
                {saveMsg}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-neutral-900 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition-all hover:bg-black shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>Enregistrer la vitrine</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: Library */}
        <div className="w-full lg:w-[58%] flex flex-col bg-white border-r border-neutral-200 z-10">
          
          {/* Navigation Tabs */}
          <div className="px-6 pt-4 pb-3 border-b border-neutral-200 space-y-3">
            {/* Category Groups Header */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 block">
                Catégories Boutique
              </span>
              <div className="flex flex-wrap gap-1 p-1 bg-neutral-100/80 rounded-xl border border-neutral-200/80">
                {TABS.filter(t => t.group === 'shop').map((tab) => {
                  const count = tab.key === 'recommendedMen' ? recommendedMen.length
                    : tab.key === 'recommendedWomen' ? recommendedWomen.length
                    : tab.key === 'recommendedUnisex' ? recommendedUnisex.length
                    : tab.key === 'recommendedOriental' ? recommendedOriental.length
                    : tab.key === 'recommendedMaster' ? recommendedMaster.length
                    : tab.key === 'recommendedCoffrets' ? recommendedCoffrets.length
                    : recommendedShop.length;
                  
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {isActive && (
                        <motion.div layoutId="activeShopTabBadge" className="absolute inset-0 bg-white shadow-2xs rounded-lg border border-neutral-200/80" />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        {tab.icon}
                        {tab.label}
                        {count > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-700'}`}>
                            {count}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Homepage Tabs */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 block">
                Sections Page d'Accueil
              </span>
              <div className="flex flex-wrap gap-1 p-1 bg-neutral-100/80 rounded-xl border border-neutral-200/80 w-max">
                {TABS.filter(t => t.group === 'home').map((tab) => {
                  const count = tab.key === 'bestsellers' ? bestsellersSlug.length
                    : tab.key === 'seasonal' ? seasonalSlug.length
                    : latestSlug.length;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {isActive && (
                        <motion.div layoutId="activeHomeTabBadge" className="absolute inset-0 bg-white shadow-2xs rounded-lg border border-neutral-200/80" />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        {tab.icon}
                        {tab.label}
                        {count > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-700'}`}>
                            {count}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Bar & Filter Toggle */}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder={`Rechercher un parfum dans ${currentTabConfig.label}...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="block w-full pl-9 pr-3.5 py-2 bg-[#f8fafc] border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all outline-none"
                />
              </div>

              {(currentTabConfig.defaultGender || currentTabConfig.defaultSubcategory) && (
                <button
                  onClick={() => setFilterByCategoryOnly(!filterByCategoryOnly)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    filterByCategoryOnly 
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-2xs' 
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-2xs'
                  }`}
                  title={filterByCategoryOnly ? 'Afficher uniquement les parfums de cette catégorie' : 'Tous les parfums affichés'}
                >
                  <Filter size={13} />
                  <span>{filterByCategoryOnly ? `Catégorie ${currentTabConfig.label}` : 'Tout le catalogue'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((p) => {
                const isSelected = currentSlugs.includes(p.slug);
                return (
                  <div
                    key={p.slug}
                    onClick={() => toggleProduct(p.slug)}
                    className={`group relative flex flex-col p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-neutral-50/80 border-2 border-neutral-900 shadow-2xs ring-1 ring-neutral-900/10'
                        : 'bg-white border border-neutral-200 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* Checkmark Overlay */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center z-10 shadow-sm"
                        >
                          <Check size={12} strokeWidth={2.5} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-50 mb-2.5 border border-neutral-100">
                      <img src={getImage(p)} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">
                        <span className="truncate">{p.brandLabel}</span>
                        <span className="text-neutral-400 capitalize shrink-0 ml-1">{p.gender}</span>
                      </div>
                      <div className="text-xs font-semibold text-neutral-900 leading-snug line-clamp-2">{p.name}</div>
                      <div className="text-xs font-medium text-neutral-600 mt-1">{p.price} MAD</div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full py-14 flex flex-col items-center justify-center text-neutral-400">
                  <Search size={28} className="mb-2.5 opacity-40" />
                  <p className="text-xs font-medium text-neutral-600">Aucun parfum ne correspond à vos filtres.</p>
                  {(currentTabConfig.defaultGender || currentTabConfig.defaultSubcategory) && filterByCategoryOnly && (
                    <button
                      onClick={() => setFilterByCategoryOnly(false)}
                      className="mt-2 text-xs text-neutral-900 font-semibold underline underline-offset-2 hover:text-black cursor-pointer"
                    >
                      Afficher tous les parfums du catalogue
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Curated Selection */}
        <div className="w-full lg:w-[42%] bg-[#f8fafc] flex flex-col relative border-l border-neutral-200">
          
          <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
            
            {/* Header info for active tab */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs mb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {currentTabConfig.icon}
                    <h3 className="text-sm font-bold text-neutral-900">
                      {currentTabConfig.label} — Parfums Recommandés
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {currentTabConfig.description}
                  </p>
                </div>
                <a
                  href={currentTabConfig.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                >
                  <span>Voir page</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100 text-[11px] text-neutral-500 font-medium">
                <span>{currentSlugs.length} parfum{currentSlugs.length > 1 ? 's' : ''} sélectionné{currentSlugs.length > 1 ? 's' : ''}</span>
                <span className="text-neutral-400">Ordre d'apparition dans la boutique</span>
              </div>
            </div>

            {/* Special Trend Titles for Seasonal tab */}
            {activeTab === 'seasonal' && (
              <div className="mb-5 space-y-3.5 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
                <h4 className="text-xs font-bold text-neutral-900">Textes de la section (Page d'accueil)</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1 uppercase tracking-wider">Saison(s) affichée(s)</label>
                  <select 
                    value={seasonalTrendTitle}
                    onChange={(e) => setSeasonalTrendTitle(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#f8fafc] border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900"
                  >
                    <option value="Tendances Automne-Hiver">Automne-Hiver</option>
                    <option value="Tendances Printemps-Été">Printemps-Été</option>
                    <option value="Tendances Été-Automne">Été-Automne</option>
                    <option value="Tendances Printemps">Printemps</option>
                    <option value="Tendances Été">Été</option>
                    <option value="Tendances Automne">Automne</option>
                    <option value="Tendances Hiver">Hiver</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1 uppercase tracking-wider">Sous-titre</label>
                  <textarea 
                    value={seasonalTrendSubtitle}
                    onChange={(e) => setSeasonalTrendSubtitle(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#f8fafc] border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-neutral-900 resize-none h-20"
                    placeholder="Ex: Nos fragrances fraîches..."
                  />
                </div>
              </div>
            )}

            {/* Curated list items with Smooth Drag & Drop (Glissement) */}
            {currentSlugs.length === 0 ? (
              <div className="border border-dashed border-neutral-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white shadow-2xs">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center mb-2.5 text-neutral-400">
                  <LayoutDashboard size={20} />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 mb-1">Aucun parfum recommandé configuré</h4>
                <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                  Cliquez sur des parfums dans la liste de gauche pour les ajouter en tête de liste pour cette section.
                </p>
              </div>
            ) : (
              <div>
                {/* Visual Guidance Banner */}
                <div className="flex items-center justify-between px-3 py-2 mb-3 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-xl shadow-2xs">
                  <span className="flex items-center gap-1.5 text-neutral-800">
                    <GripVertical size={14} className="text-neutral-400" />
                    Glissez & déposez les cartes pour réordonner
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {currentSlugs.length} sélectionné{currentSlugs.length > 1 ? 's' : ''}
                  </span>
                </div>

                <Reorder.Group 
                  axis="y" 
                  values={currentSlugs} 
                  onReorder={handleReorder} 
                  className="space-y-2"
                >
                  {currentSlugs.map((slug, index) => {
                    const p = allProducts.find(x => x.slug === slug);
                    if (!p) return null;
                    return (
                      <Reorder.Item
                        key={slug}
                        value={slug}
                        className="group relative flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-neutral-200 shadow-2xs hover:shadow-xs hover:border-neutral-300 transition-all select-none cursor-grab active:cursor-grabbing"
                        whileDrag={{
                          scale: 1.015,
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                          borderColor: "#171717",
                          backgroundColor: "#ffffff",
                          zIndex: 50
                        }}
                      >
                        {/* Drag Handle Icon */}
                        <div 
                          className="text-neutral-300 group-hover:text-neutral-600 transition-colors p-1 cursor-grab active:cursor-grabbing flex-shrink-0"
                          title="Glisser pour déplacer"
                        >
                          <GripVertical size={16} />
                        </div>

                        {/* Order Position Badge */}
                        <div 
                          className="flex items-center justify-center w-6 h-6 rounded-lg bg-neutral-100 text-neutral-700 font-bold text-[11px] flex-shrink-0"
                          title={`Position #${index + 1}`}
                        >
                          #{index + 1}
                        </div>

                        {/* Image */}
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-50 flex-shrink-0 border border-neutral-100">
                          <img src={getImage(p)} alt={p.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="text-xs font-semibold text-neutral-900 truncate">{p.name}</div>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">{p.brandLabel}</div>
                        </div>

                        {/* Quick Actions: Move to Top + Move buttons + Remove */}
                        <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-600 transition-colors flex-shrink-0">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveToTop(index);
                              }}
                              className="p-1 hover:bg-neutral-100 hover:text-neutral-900 rounded-lg transition-colors cursor-pointer"
                              title="Placer tout en haut (Position #1)"
                            >
                              <ChevronsUp size={14} />
                            </button>
                          )}
                          
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveProduct(index, 'up');
                              }}
                              disabled={index === 0}
                              className="p-0.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                              title="Monter d'une position"
                            >
                              <ArrowUp size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveProduct(index, 'down');
                              }}
                              disabled={index === currentSlugs.length - 1}
                              className="p-0.5 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                              title="Descendre d'une position"
                            >
                              <ArrowDown size={11} />
                            </button>
                          </div>

                          <div className="border-l border-neutral-200 pl-1 ml-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProduct(slug);
                              }}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Retirer des recommandés"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
