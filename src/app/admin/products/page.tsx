'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/products';
import { OLFACTIVE_FAMILIES, getBaseSubcategoryFromFamily } from '@/lib/olfactiveFamilies';
import { Plus, Trash2, Upload, FlaskConical } from 'lucide-react';
import Image from 'next/image';
import SeasonSelector from '@/components/admin/SeasonSelector';
import CatalogSectionsCard from '@/components/admin/CatalogSectionsCard';
import {
  CatalogPageHeader,
  CatalogKpiDeck,
  CatalogFilterToolbar,
  CatalogProductsTable,
  CatalogSlideOverDrawer,
  CatalogStockFilter,
  CatalogSortOption,
  CATALOG_INPUT_CLASS,
  CATALOG_SECTION_CARD_CLASS,
  computeCatalogMetrics,
  filterAndSortCatalog,
} from '@/components/admin/CatalogWorkspaceShell';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<CatalogStockFilter>('ALL');
  const [familyFilter, setFamilyFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<CatalogSortOption>('NAME_ASC');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Multi-section duplication draft state
  const [pendingSections, setPendingSections] = useState({
    tester: { enabled: false, price: 0, stock: 0 },
    original: { enabled: false, price: 0, stock: 0 },
    masterCopy: { enabled: false, price: 0, stock: 0 },
    coffret: { enabled: false, price: 0, stock: 0 },
  });

  // Form state
  const [formData, setFormData] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands');
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (!Array.isArray(data)) {
        setProducts([]);
        return;
      }

      const parsedData = data.map((p: any) => ({
        ...p,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
        sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
        notes: typeof p.notes === 'string' ? JSON.parse(p.notes) : p.notes,
        tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
      }));
      setProducts(
        parsedData.filter(
          (p: any) => p.isTester === true && p.subcategory !== 'coffrets' && p.subcategory !== 'master-copier'
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleQuickUpdate = async (id: number, field: string, value: any) => {
    try {
      const body: any = { [field]: value };

      // Sync single-size pricing cleanly
      let updatedSizes: any = null;
      if (field === 'price') {
        const p = products.find((x) => x.id === id);
        if (p && p.sizes && p.sizes.length === 1) {
          updatedSizes = [...p.sizes];
          updatedSizes[0].price = value;
          body.sizes = updatedSizes;
        }
      }

      await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const updatedProduct = { ...p, [field]: value };
            if (updatedSizes) updatedProduct.sizes = updatedSizes;
            return updatedProduct;
          }
          return p;
        })
      );
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la modification rapide');
    }
  };

  const handleGenerateSKUs = async () => {
    if (!confirm("Voulez-vous générer des numéros de série (SKU) pour tous les produits qui n'en ont pas ?")) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products/generate-skus', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`${data.updatedCount} SKU(s) générés avec succès.`);
        fetchProducts();
      }
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la génération des SKUs');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setPendingSections({
      tester: { enabled: true, price: 0, stock: 10 },
      original: { enabled: false, price: 0, stock: 0 },
      masterCopy: { enabled: false, price: 0, stock: 0 },
      coffret: { enabled: false, price: 0, stock: 0 },
    });
    setFormData({
      id: `p-${Date.now()}`,
      slug: '',
      name: '',
      brand: 'valentino',
      brandLabel: 'Valentino',
      gender: 'women',
      subcategory: '',
      subcategoryLabel: '',
      price: 0,
      originalPrice: 0,
      images: [],
      rating: 5.0,
      reviewCount: 0,
      description: '',
      longDescription: '',
      notes: { top: [], heart: [], base: [] },
      ingredients: '',
      sizes: [{ label: '50ml', price: 0 }],
      tags: [],
      bottleColor: 'transparent',
      bottleMaterial: 'glass',
      perfectSeason: 'all',
      tagline: '',
      releaseDate: new Date().toISOString(),
      inStock: true,
      stock: 10,
      isTester: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setPendingSections({
      tester: { enabled: true, price: product.price || 0, stock: product.stock || 10 },
      original: { enabled: false, price: 0, stock: 0 },
      masterCopy: { enabled: false, price: 0, stock: 0 },
      coffret: { enabled: false, price: 0, stock: 0 },
    });
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append('file', file);

    setIsUploading(true);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur serveur lors de l'upload");
      }

      if (data.url) {
        setFormData((prev: any) => ({
          ...prev,
          images: [...(prev.images || []), data.url],
        }));
      }
    } catch (error: any) {
      console.error('Failed to upload image', error);
      alert(`Erreur lors du téléchargement de l'image: ${error.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddSize = () => {
    setFormData((prev: any) => ({
      ...prev,
      sizes: [...(prev.sizes || []), { label: '', price: 0 }],
    }));
  };

  const handleUpdateSize = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const newSizes = [...(prev.sizes || [])];
      newSizes[index] = { ...newSizes[index], [field]: value };
      return { ...prev, sizes: newSizes };
    });
  };

  const handleRemoveSize = (index: number) => {
    setFormData((prev: any) => {
      const newSizes = [...(prev.sizes || [])];
      newSizes.splice(index, 1);
      return { ...prev, sizes: newSizes };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isTester: true,
          pendingSections,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de la sauvegarde');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const {
    totalCount,
    inStockCount,
    outOfStockCount,
    totalStockUnits,
    averagePrice,
    olfactiveFamilies,
    brandOptions,
  } = computeCatalogMetrics(products, 10);

  const filteredProducts = filterAndSortCatalog(products, {
    search,
    stockFilter,
    familyFilter,
    brandFilter,
    sortBy,
    defaultStockFallback: 10,
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-16 font-sans text-slate-900 dark:text-slate-100">
      <CatalogPageHeader
        liveLabel={`${totalCount} testeurs en direct`}
        title="Catalogue Testeurs Haute Parfumerie"
        subtitle={`Pilotage haute joaillerie des ${totalCount} références testeurs, stocks d'atelier, tarifs et fiches olfactives.`}
        addLabel="Ajouter un testeur"
        isLoading={isLoading}
        onRefresh={fetchProducts}
        onGenerateSKUs={handleGenerateSKUs}
        onAdd={openAddModal}
      />

      <CatalogKpiDeck
        heroIcon={<FlaskConical size={20} strokeWidth={2.2} />}
        heroTitle="TOTAL TESTEURS"
        heroSubtitle="Catalogue NAY Actif"
        heroFooterLeft="Catalogue NAY"
        heroFooterRight="Prêts à la vente"
        reserveTitle="FLACONS EN RÉSERVE"
        reserveSubtitle="Disponibles en atelier"
        totalCount={totalCount}
        inStockCount={inStockCount}
        outOfStockCount={outOfStockCount}
        totalStockUnits={totalStockUnits}
        averagePrice={averagePrice}
        stockFilter={stockFilter}
        onSelectStockFilter={setStockFilter}
      />

      <CatalogFilterToolbar
        sectionId="testeurs"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par parfum, marque (Amouage, Armani...), ou SKU..."
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        totalCount={totalCount}
        inStockCount={inStockCount}
        outOfStockCount={outOfStockCount}
        filteredCount={filteredProducts.length}
        familyFilter={familyFilter}
        onFamilyFilterChange={setFamilyFilter}
        families={olfactiveFamilies}
        brandFilter={brandFilter}
        onBrandFilterChange={setBrandFilter}
        brandOptions={brandOptions}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      <CatalogProductsTable
        products={filteredProducts}
        isLoading={isLoading}
        firstColTitle="Testeur & SKU"
        thirdColTitle="Univers Olfactif"
        emptyTitle="Aucun testeur correspondant"
        sectionIcon={<FlaskConical size={18} />}
        sectionBadge={
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
            <FlaskConical size={10} className="text-slate-500 dark:text-slate-400" />
            <span>Testeur</span>
          </span>
        }
        defaultStockFallback={10}
        editButtonTitle="Modifier ce testeur"
        onQuickUpdate={handleQuickUpdate}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <CatalogSlideOverDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Modifier le testeur' : 'Nouveau testeur'}
        subtitle={
          editingProduct
            ? 'Mettez à jour les fiches testeurs et les pyramides olfactives.'
            : 'Ajoutez un nouveau testeur au catalogue.'
        }
        saveLabel={editingProduct ? 'Enregistrer' : 'Créer le testeur'}
        onSave={handleSave}
        icon={<FlaskConical size={18} />}
      >
        <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-6">
          {/* SECTION 1: Informations Générales */}
          <div className={CATALOG_SECTION_CARD_CLASS}>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-3 uppercase tracking-wider">
              Informations Générales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Nom du parfum</label>
                <input
                  required
                  type="text"
                  className={CATALOG_INPUT_CLASS}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Slug (URL)</label>
                <input
                  required
                  type="text"
                  className={CATALOG_INPUT_CLASS}
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">SKU / Numéro de Série</label>
                <input
                  type="text"
                  className={`${CATALOG_INPUT_CLASS} font-mono`}
                  value={formData.sku || ''}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ex: REF-VAL-001"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Tagline (L&apos;Accroche / Slogan)</label>
                <input
                  type="text"
                  className={CATALOG_INPUT_CLASS}
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Ex: Le sillage des légendes."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Marque</label>
                <select
                  className={CATALOG_INPUT_CLASS}
                  value={formData.brand || ''}
                  onChange={(e) => {
                    const selectedBrand = brands.find((b) => b.slug === e.target.value);
                    setFormData({
                      ...formData,
                      brand: e.target.value,
                      brandLabel: selectedBrand ? selectedBrand.label : '',
                    });
                  }}
                >
                  <option value="">Sélectionnez une marque</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Genre</label>
                <select
                  className={CATALOG_INPUT_CLASS}
                  value={formData.gender || 'women'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="women">Femme</option>
                  <option value="men">Homme</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Marketing & Pyramide Olfactive */}
          <div className={CATALOG_SECTION_CARD_CLASS}>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-3 uppercase tracking-wider">
              Marketing &amp; Pyramide Olfactive
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Famille olfactive</label>
                <select
                  required
                  className={`${CATALOG_INPUT_CLASS} font-medium cursor-pointer`}
                  value={formData.subcategoryLabel || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const subcat = getBaseSubcategoryFromFamily(val, 'floral');
                    setFormData({
                      ...formData,
                      subcategoryLabel: val,
                      subcategory: subcat,
                    });
                  }}
                >
                  <option value="" disabled>
                    Sélectionnez une famille olfactive...
                  </option>
                  {OLFACTIVE_FAMILIES.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  {formData.subcategoryLabel && !OLFACTIVE_FAMILIES.some((g) => g.options.includes(formData.subcategoryLabel)) && (
                    <optgroup label="Actuel / Personnalisé">
                      <option value={formData.subcategoryLabel}>{formData.subcategoryLabel}</option>
                    </optgroup>
                  )}
                </select>
                {formData.subcategoryLabel && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span>Famille sélectionnée :</span>
                    <span className="font-bold text-[#0284c7] dark:text-[#38bdf8] bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {formData.subcategoryLabel}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                <SeasonSelector
                  value={formData.perfectSeason || ''}
                  onChange={(val) => setFormData({ ...formData, perfectSeason: val })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-slate-50 dark:bg-[#0c101b] rounded-xl border border-slate-200/80 dark:border-white/10">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase mb-1.5">Notes de Tête</label>
                  <textarea
                    className="w-full bg-white dark:bg-[#131826] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs min-h-[75px] focus:outline-none focus:border-[#0ea5e9] text-slate-900 dark:text-white"
                    placeholder="Séparées par des virgules..."
                    value={(formData.notes?.top || []).join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notes: { ...formData.notes, top: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase mb-1.5">Notes de Cœur</label>
                  <textarea
                    className="w-full bg-white dark:bg-[#131826] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs min-h-[75px] focus:outline-none focus:border-[#0ea5e9] text-slate-900 dark:text-white"
                    placeholder="Séparées par des virgules..."
                    value={(formData.notes?.heart || []).join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notes: { ...formData.notes, heart: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase mb-1.5">Notes de Fond</label>
                  <textarea
                    className="w-full bg-white dark:bg-[#131826] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs min-h-[75px] focus:outline-none focus:border-[#0ea5e9] text-slate-900 dark:text-white"
                    placeholder="Séparées par des virgules..."
                    value={(formData.notes?.base || []).join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notes: { ...formData.notes, base: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">L&apos;Histoire du Parfum (Longue Description)</label>
                <textarea
                  className={`${CATALOG_INPUT_CLASS} leading-relaxed min-h-[140px] p-3`}
                  value={formData.longDescription || ''}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  placeholder="Rédigez l'histoire et les émotions de ce parfum..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Prix & Inventaire */}
          <div className={CATALOG_SECTION_CARD_CLASS}>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-3 uppercase tracking-wider">
              Prix &amp; Stock
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Prix de Vente (MAD)</label>
                <input
                  required
                  type="number"
                  className={`${CATALOG_INPUT_CLASS} font-semibold`}
                  value={formData.price || 0}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    const newSizes = formData.sizes ? [...formData.sizes] : [];
                    if (newSizes.length > 0) {
                      newSizes[0].price = newPrice;
                    }
                    setFormData({ ...formData, price: newPrice, sizes: newSizes });
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Ancien Prix (Optionnel)</label>
                <input
                  type="number"
                  className={`${CATALOG_INPUT_CLASS} text-rose-600 dark:text-rose-400 font-semibold`}
                  value={formData.originalPrice || ''}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Prix barré..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Stock Disponible (Unités)</label>
                <input
                  type="number"
                  min="0"
                  className={`${CATALOG_INPUT_CLASS} font-semibold`}
                  value={formData.stock !== undefined ? formData.stock : 10}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData({ ...formData, stock: val, inStock: val > 0 });
                  }}
                  placeholder="Ex: 10"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between bg-slate-50 dark:bg-[#0c101b] p-4 rounded-xl border border-slate-200/80 dark:border-white/10">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">État du Stock</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Désactivez pour afficher &quot;Rupture de stock&quot; sur la boutique.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Boolean(formData.inStock)}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-white/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0ea5e9]" />
                </label>
              </div>

              <div className="sm:col-span-2 pt-1">
                <CatalogSectionsCard
                  currentProductId={editingProduct ? Number(editingProduct.id) : undefined}
                  currentProductName={formData.name || ''}
                  currentBrand={formData.brand || ''}
                  currentSection="tester"
                  currentPrice={formData.price || 0}
                  currentStock={formData.stock !== undefined ? formData.stock : 10}
                  pendingSections={pendingSections}
                  setPendingSections={setPendingSections}
                  onSiblingCreated={fetchProducts}
                />
              </div>

              <div className="sm:col-span-2 border-t border-slate-100 dark:border-white/10 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tailles et Déclinaisons
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="text-[#0284c7] dark:text-[#38bdf8] text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Nouvelle taille
                  </button>
                </div>
                <div className="space-y-2.5">
                  {formData.sizes?.map((size: any, idx: number) => (
                    <div key={idx} className="flex gap-2.5 items-center">
                      <input
                        type="text"
                        placeholder="Ex: 50ml, 100ml"
                        className="flex-1 bg-slate-50 dark:bg-[#0c101b] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                        value={size.label}
                        onChange={(e) => handleUpdateSize(idx, 'label', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Prix optionnel"
                        className="flex-1 bg-slate-50 dark:bg-[#0c101b] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                        value={size.price}
                        onChange={(e) => handleUpdateSize(idx, 'price', Number(e.target.value))}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(idx)}
                        className="text-rose-600 p-2 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Médias */}
          <div className={CATALOG_SECTION_CARD_CLASS}>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-3 uppercase tracking-wider">
              Médias &amp; Images
            </h3>

            <div className="flex gap-3.5 flex-wrap">
              {formData.images?.map((img: string, idx: number) => (
                <div key={idx} className="relative w-20 h-20 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden group shadow-2xs">
                  <Image src={img} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev: any) => ({
                        ...prev,
                        images: prev.images.filter((_: any, i: number) => i !== idx),
                      }))
                    }
                    className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <label
                className={`w-20 h-20 border-2 border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#0c101b] rounded-xl flex items-center justify-center text-slate-400 hover:text-[#0ea5e9] hover:border-[#0ea5e9] cursor-pointer transition-all ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-[#0ea5e9] rounded-full animate-spin" />
                ) : (
                  <Upload size={20} />
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
              </label>
            </div>
          </div>

          <div className="h-6" />
        </form>
      </CatalogSlideOverDrawer>
    </div>
  );
}
