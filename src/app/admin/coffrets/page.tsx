'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/products';
import { OLFACTIVE_FAMILIES } from '@/lib/olfactiveFamilies';
import { Plus, Edit2, Trash2, Search, X, Upload } from 'lucide-react';
import Image from 'next/image';
import SeasonSelector from '@/components/admin/SeasonSelector';

export default function AdminCoffretsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [standardProducts, setStandardProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
    
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);

  const [brands, setBrands] = useState<any[]>([]);

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands');
      const data = await res.json();
      setBrands(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      
      const parsedData = data.map((p: any) => ({
        ...p,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
        sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
        notes: typeof p.notes === 'string' ? JSON.parse(p.notes) : p.notes,
        tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
      }));
      
      setProducts(parsedData.filter((p: any) => p.subcategory === 'coffrets'));
      setStandardProducts(parsedData.filter((p: any) => p.subcategory !== 'coffrets'));
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
      await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la modification rapide');
    }
  };

  const handleGenerateSKUs = async () => {
    if (!confirm('Voulez-vous générer des numéros de série (SKU) pour tous les produits qui n\'en ont pas ?')) return;
    
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
    setFormData({
      id: `p-${Date.now()}`,
      slug: '',
      name: '',
      brand: 'valentino',
      brandLabel: 'Valentino',
      gender: 'women',
      subcategory: 'coffrets',
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
      isTester: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
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
        throw new Error(data.error || 'Erreur serveur lors de l\'upload');
      }
      
      if (data.url) {
        setFormData((prev: any) => ({
          ...prev,
          images: [...(prev.images || []), data.url]
        }));
      }
    } catch (error: any) {
      console.error('Failed to upload image', error);
      alert(`Erreur lors du téléchargement de l'image: ${error.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };

  const handleAddSize = () => {
    setFormData((prev: any) => ({
      ...prev,
      sizes: [...(prev.sizes || []), { label: '', price: 0 }]
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
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const filteredProducts = products
    .filter((p: any) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(searchLower) || 
                            p.brandLabel.toLowerCase().includes(searchLower) ||
                            (p.sku && p.sku.toLowerCase().includes(searchLower));
      return matchesSearch;
    })
    .sort((a: any, b: any) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));


  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto text-neutral-900 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Coffrets Cadeaux</h1>
          <p className="text-[13px] text-neutral-500 mt-1">Créez et gérez vos packs spéciaux et coffrets cadeaux ({products.length} au total).</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleGenerateSKUs}
            className="bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs"
          >
            Générer SKUs
          </button>
          <button 
            onClick={openAddModal}
            className="bg-neutral-900 hover:bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> Nouveau coffret
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-3.5 border-b border-neutral-100 flex items-center gap-3 bg-white">
          <Search size={15} className="text-neutral-400 ml-1" />
          <input 
            type="text" 
            placeholder="Rechercher un coffret par nom, marque ou SKU..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-xs sm:text-[13px] text-neutral-900 placeholder:text-neutral-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Produit & SKU</th>
                <th className="px-5 py-3">Marque</th>
                <th className="px-5 py-3">Famille / Type</th>
                <th className="px-5 py-3">Prix</th>
                <th className="px-5 py-3">Stock / Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-neutral-400 text-xs">Chargement des coffrets...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-neutral-400 text-xs">Aucun produit trouvé.</td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors group">
                    <td className="px-5 py-3.5 flex items-center gap-3.5">
                      <div className="w-11 h-11 bg-neutral-100 rounded-xl overflow-hidden relative border border-neutral-200 shrink-0">
                        {p.images[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover" />}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900 text-[13px]">{p.name}</div>
                        <input 
                          type="text" 
                          placeholder="SKU / Réf"
                          className="text-[11px] font-mono text-neutral-500 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-neutral-900 focus:outline-none transition-colors w-24 px-0.5 py-0.5 mt-0.5 block"
                          defaultValue={p.sku || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (p.sku || '')) {
                              handleQuickUpdate(p.id, 'sku', e.target.value);
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 uppercase tracking-wider">
                        {p.brandLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                        {p.subcategoryLabel || 'Coffrets'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-neutral-900">
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          className="w-16 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-neutral-900 focus:outline-none transition-colors text-right px-1 py-0.5 font-semibold text-neutral-900"
                          defaultValue={p.price}
                          onBlur={(e) => {
                            if (Number(e.target.value) !== p.price) {
                              handleQuickUpdate(p.id, 'price', Number(e.target.value));
                            }
                          }}
                        />
                        <span className="text-neutral-500 font-normal text-xs">MAD</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 items-center flex-wrap">
                        {p.published !== false ? (
                          <button onClick={() => handleQuickUpdate(p.id, 'published', false)} className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer">PUBLIÉ</button>
                        ) : (
                          <button onClick={() => handleQuickUpdate(p.id, 'published', true)} className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200 transition-colors cursor-pointer">BROUILLON</button>
                        )}
                        {p.inStock ? (
                          <button onClick={() => handleQuickUpdate(p.id, 'inStock', false)} className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer">EN STOCK</button>
                        ) : (
                          <button onClick={() => handleQuickUpdate(p.id, 'inStock', true)} className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer">RUPTURE</button>
                        )}
                        {(p as any).isTester && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">TESTEUR</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(p)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors border border-neutral-200 shadow-2xs"
                          aria-label="Modifier"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-neutral-600 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-neutral-200 shadow-2xs"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL-SCREEN SLIDE-OVER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[#f8fafc] w-full max-w-4xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">
                  {editingProduct ? 'Modifier le Coffret' : 'Nouveau Coffret'}
                </h2>
                <p className="text-neutral-500 text-xs mt-0.5">
                  Gérez la grande image de couverture et les détails de votre coffret cadeau.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button onClick={() => setIsModalOpen(false)} className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                  Annuler
                </button>
                <button onClick={handleSave} className="bg-neutral-900 hover:bg-black text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs">
                  {editingProduct ? 'Enregistrer' : 'Créer le produit'}
                </button>
              </div>
            </div>
            
            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-6">
                
                {/* SECTION 1: Informations Générales */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-2xs space-y-5">
                  <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-3 mb-4 uppercase tracking-wider">Informations Générales</h3>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Nom du coffret</label>
                      <input required type="text" className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Slug (URL)</label>
                      <input required type="text" className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                        value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">SKU / Numéro de Série</label>
                      <input type="text" className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-mono"
                        value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} 
                        placeholder="Ex: REF-VAL-001" />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Tagline (L'Accroche / Slogan)</label>
                      <input type="text" className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                        value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} 
                        placeholder="Ex: Le cadeau idéal." />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Marque</label>
                      <select className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                        value={formData.brand} onChange={e => {
                          const selectedBrand = brands.find(b => b.slug === e.target.value);
                          setFormData({
                            ...formData, 
                            brand: e.target.value,
                            brandLabel: selectedBrand ? selectedBrand.label : ''
                          });
                        }}>
                        <option value="">Sélectionnez une marque</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.slug}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Genre</label>
                      <select className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                        value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="women">Femme</option>
                        <option value="men">Homme</option>
                        <option value="unisex">Unisex</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Marketing & Pyramide Olfactive */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-2xs space-y-5">
                  <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-3 mb-4 uppercase tracking-wider">Marketing & Pyramide Olfactive</h3>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Famille olfactive / Coffret</label>
                      <select 
                        className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-medium cursor-pointer"
                        value={formData.subcategoryLabel || ''} 
                        onChange={e => {
                          setFormData({
                            ...formData, 
                            subcategory: 'coffrets',
                            subcategoryLabel: e.target.value
                          });
                        }}
                      >
                        <option value="" disabled>Sélectionnez un type ou une famille...</option>
                        <optgroup label="Types de Coffrets">
                          <option value="Coffrets Cadeaux">Coffrets Cadeaux</option>
                          <option value="Coffrets Découverte">Coffrets Découverte</option>
                          <option value="Éditions Limitées">Éditions Limitées</option>
                        </optgroup>
                        {OLFACTIVE_FAMILIES.map(group => (
                          <optgroup key={group.group} label={group.group}>
                            {group.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </optgroup>
                        ))}
                        {formData.subcategoryLabel && 
                         !['Coffrets Cadeaux', 'Coffrets Découverte', 'Éditions Limitées'].includes(formData.subcategoryLabel) && 
                         !OLFACTIVE_FAMILIES.some(g => g.options.includes(formData.subcategoryLabel)) && (
                          <optgroup label="Actuel / Personnalisé">
                            <option value={formData.subcategoryLabel}>{formData.subcategoryLabel}</option>
                          </optgroup>
                        )}
                      </select>
                      {formData.subcategoryLabel && (
                        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-sky-600 font-medium">
                          <span>Sélection active :</span>
                          <span className="font-bold text-neutral-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/50">{formData.subcategoryLabel}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-100">
                      <SeasonSelector
                        value={formData.perfectSeason || ''}
                        onChange={(val) => setFormData({ ...formData, perfectSeason: val })}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-2">Notes Olfactives</label>
                      <div className="grid grid-cols-3 gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-700 tracking-wider uppercase mb-1.5">Tête</label>
                          <textarea className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-xs min-h-[70px] focus:outline-none focus:border-neutral-900 text-neutral-900"
                            placeholder="Ex: Bergamote..."
                            value={(formData.notes?.top || []).join(', ')} 
                            onChange={e => setFormData({...formData, notes: {...formData.notes, top: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}})} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-700 tracking-wider uppercase mb-1.5">Cœur</label>
                          <textarea className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-xs min-h-[70px] focus:outline-none focus:border-neutral-900 text-neutral-900"
                            placeholder="Ex: Rose..."
                            value={(formData.notes?.heart || []).join(', ')} 
                            onChange={e => setFormData({...formData, notes: {...formData.notes, heart: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}})} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-700 tracking-wider uppercase mb-1.5">Fond</label>
                          <textarea className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-xs min-h-[70px] focus:outline-none focus:border-neutral-900 text-neutral-900"
                            placeholder="Ex: Bois de Santal..."
                            value={(formData.notes?.base || []).join(', ')} 
                            onChange={e => setFormData({...formData, notes: {...formData.notes, base: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}})} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Description Complète</label>
                      <textarea className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-3 text-xs sm:text-[13px] leading-relaxed min-h-[140px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                        value={formData.longDescription} onChange={e => setFormData({...formData, longDescription: e.target.value})} 
                        placeholder="Rédigez l'histoire et les caractéristiques de ce coffret..." />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Prix & Inventaire */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-2xs space-y-5">
                  <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-3 mb-4 uppercase tracking-wider">Prix & Stock</h3>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Prix de Vente (MAD)</label>
                      <input required type="number" className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-semibold"
                        value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Ancien Prix (Optionnel)</label>
                      <input type="number" className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] focus:outline-none focus:border-rose-500 transition-all text-rose-600 font-semibold"
                        value={formData.originalPrice || ''} onChange={e => setFormData({...formData, originalPrice: e.target.value ? Number(e.target.value) : null})} 
                        placeholder="Prix barré..." />
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                      <div>
                        <h4 className="text-[13px] font-semibold text-neutral-900">État du Stock</h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Désactivez pour afficher "Rupture de stock" sur la boutique.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.inStock} onChange={e => setFormData({...formData, inStock: e.target.checked})} />
                        <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="col-span-2 flex items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                      <div>
                        <h4 className="text-[13px] font-semibold text-neutral-900">Format Testeur</h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Cochez si ce produit est vendu sous format testeur.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.isTester} onChange={e => setFormData({...formData, isTester: e.target.checked})} />
                        <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="col-span-2 border-t border-neutral-200 pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider">Tailles et Déclinaisons</label>
                        <button type="button" onClick={handleAddSize} className="text-neutral-800 text-xs font-medium hover:underline flex items-center gap-1">
                          <Plus size={13} /> Nouvelle taille
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        {formData.sizes?.map((size: any, idx: number) => (
                          <div key={idx} className="flex gap-2.5 items-center">
                            <input type="text" placeholder="Ex: Coffret standard" className="flex-1 bg-[#f8fafc] border border-neutral-200 rounded-lg p-2 text-xs text-neutral-900"
                              value={size.label} onChange={e => handleUpdateSize(idx, 'label', e.target.value)} />
                            <input type="number" placeholder="Prix optionnel" className="flex-1 bg-[#f8fafc] border border-neutral-200 rounded-lg p-2 text-xs text-neutral-900"
                              value={size.price} onChange={e => handleUpdateSize(idx, 'price', Number(e.target.value))} />
                            <button type="button" onClick={() => handleRemoveSize(idx)} className="text-neutral-400 p-2 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Médias */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-2xs space-y-5">
                  <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-3 mb-4 uppercase tracking-wider">Médias & Images</h3>
                  
                  <div className="flex gap-3 flex-wrap">
                    {formData.images?.map((img: string, idx: number) => (
                      <div key={idx} className="relative w-20 h-20 border border-neutral-200 rounded-xl overflow-hidden group shadow-2xs">
                        <Image src={img} alt="Preview" fill className="object-cover" />
                        <button type="button" 
                          onClick={() => setFormData((prev: any) => ({ ...prev, images: prev.images.filter((_: any, i: number) => i !== idx) }))}
                          className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <label className={`w-20 h-20 border-2 border-dashed border-neutral-200 bg-[#f8fafc] rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50 cursor-pointer transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin"></div>
                      ) : (
                        <Upload size={20} />
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <div className="h-6"></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
