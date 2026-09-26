'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Edit2, 
  Check, 
  X, 
  Archive, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Package, 
  Sparkles, 
  Plus, 
  Minus, 
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
  Filter,
  DollarSign
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      // Ensure JSON strings are parsed
      const parsedData = (data || []).map((p: any) => ({
        ...p,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images
      }));
      setProducts(parsedData);
      
      const uniqueSubcategories = Array.from(new Set(data.map((p: any) => p.subcategoryLabel || 'Parfums'))) as string[];
      setCategories(['Toutes', ...uniqueSubcategories.filter(Boolean)]);
    } catch (error) {
      console.error('Failed to fetch inventory products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setEditStockValue(product.stock || 0);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleQuickAdjust = async (product: any, delta: number) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    // Optimistic UI update
    setProducts(products.map(p => 
      p.id === product.id 
        ? { ...p, stock: newStock, inStock: newStock > 0 } 
        : p
    ));

    try {
      await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, stock: newStock })
      });
    } catch (error) {
      console.error(error);
      fetchProducts();
    }
  };

  const handleSaveStock = async (id: number) => {
    setIsUpdating(true);
    // Optimistic UI update
    setProducts(products.map(p => 
      p.id === id 
        ? { ...p, stock: editStockValue, inStock: editStockValue > 0 } 
        : p
    ));
    setEditingId(null);

    try {
      await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stock: editStockValue })
      });
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la mise à jour du stock');
      fetchProducts();
    } finally {
      setIsUpdating(false);
    }
  };

  // Metrics
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const inStockCount = products.filter(p => (p.stock || 0) > 5).length;
  const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
  const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(search.toLowerCase()) || 
      p.brandLabel?.toLowerCase().includes(search.toLowerCase()) ||
      p.slug?.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'Toutes' || p.subcategoryLabel === selectedCategory;

    if (!matchesSearch || !matchesCategory) return false;

    if (stockFilter === 'IN_STOCK') return (p.stock || 0) > 5;
    if (stockFilter === 'LOW_STOCK') return (p.stock || 0) > 0 && (p.stock || 0) <= 5;
    if (stockFilter === 'OUT_OF_STOCK') return (p.stock || 0) === 0;

    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-[1700px] mx-auto text-slate-900 space-y-8 animate-fadeIn">
      {/* 🌟 HERO INVENTORY HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-sky-200 text-xs font-semibold">
              <Archive size={13} className="text-sky-300" />
              <span>NAY Parfum • Inventaire & Gestion des Stocks</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Stock Flacons & Parfums en Direct
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
              Gérez les stocks en temps réel pour éviter les ruptures, mettez à jour les quantités en 1 clic et suivez les approvisionnements de la boutique en ligne.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchProducts}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-sky-300' : ''} />
              <span>Actualiser</span>
            </button>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D9BF0] hover:bg-[#0284c7] text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all"
            >
              <Package size={14} />
              <span>Gérer les Fiches Produits</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 📊 BENTO INVENTORY STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Flacons</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#1D9BF0] border border-sky-100 flex items-center justify-center">
              <Archive size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{totalStockUnits}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">{products.length} références au catalogue</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Stock Sain (&gt;5)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">{inStockCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Prêts pour expédition immédiate</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Stock Faible (&le;5)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">{lowStockCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Approvisionnement recommandé</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Rupture de Stock</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">{outOfStockCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Produits épuisés sur la vitrine</div>
        </div>
      </div>

      {/* 🔍 FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par parfum, marque, référence SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]/30 focus:border-[#1D9BF0] transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Stock Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Tous ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'LOW_STOCK'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              Alertes Faibles ({lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'OUT_OF_STOCK'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              Ruptures ({outOfStockCount})
            </button>
            <button
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              En Stock ({inStockCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
              <Filter size={12} /> Rayon :
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-50 text-[#0284c7] font-bold border border-sky-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 📦 INVENTORY TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Parfum & Référence</th>
                <th className="px-5 py-3.5">Marque & Rayon</th>
                <th className="px-5 py-3.5">Prix Vitrine</th>
                <th className="px-5 py-3.5">Niveau de Stock</th>
                <th className="px-5 py-3.5 text-center">Ajustement Rapide</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const stock = product.stock || 0;
                const isEditing = editingId === product.id;
                const imageSrc = Array.isArray(product.images) && product.images[0] ? product.images[0] : '/placeholder-perfume.jpg';

                return (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Product & Thumbnail */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden relative shrink-0 flex items-center justify-center">
                          {imageSrc.startsWith('http') || imageSrc.startsWith('/') ? (
                            <Image 
                              src={imageSrc} 
                              alt={product.name} 
                              fill 
                              className="object-contain p-1" 
                              sizes="40px"
                            />
                          ) : (
                            <Sparkles size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate max-w-[200px]">
                            {product.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            SKU: {product.sku || product.slug || `#${product.id}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Brand & Subcategory */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{product.brandLabel || 'NAY'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{product.subcategoryLabel || 'Parfumerie'}</div>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {product.price ? `${product.price} MAD` : 'N/A'}
                    </td>

                    {/* Stock Status & Stepper */}
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={editStockValue}
                            onChange={(e) => setEditStockValue(parseInt(e.target.value) || 0)}
                            className="w-20 px-2.5 py-1 bg-white border border-[#1D9BF0] rounded-lg text-xs font-bold text-slate-900 focus:outline-none ring-2 ring-[#1D9BF0]/20"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveStock(product.id)}
                            className="p-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                            title="Enregistrer"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                            title="Annuler"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            stock === 0
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : stock <= 5
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              stock === 0 ? 'bg-rose-500' : stock <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            {stock} {stock <= 1 ? 'flacon' : 'flacons'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Quick Stepper Buttons (-1 / +1 / +5) */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                        <button
                          onClick={() => handleQuickAdjust(product, -1)}
                          disabled={stock === 0}
                          title="-1 flacon"
                          className="w-6 h-6 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-slate-800">
                          {stock}
                        </span>
                        <button
                          onClick={() => handleQuickAdjust(product, 1)}
                          title="+1 flacon"
                          className="w-6 h-6 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-600 text-slate-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(product, 5)}
                          title="+5 flacons"
                          className="px-1.5 h-6 rounded-lg bg-white hover:bg-sky-50 hover:text-[#0284c7] text-slate-600 font-bold text-[10px] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        >
                          +5
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} />
                          <span>Éditer</span>
                        </button>
                        <Link
                          href={`/admin/products`}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Fiche produit"
                        >
                          <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Archive size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Aucun produit ne correspond à votre filtre.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
