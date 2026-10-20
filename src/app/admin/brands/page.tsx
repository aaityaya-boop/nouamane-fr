'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Hash, Upload } from 'lucide-react';
import Image from 'next/image';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<any>({});

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/brands');
      const data = await res.json();
      setBrands(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette marque ? Cela ne fonctionnera que si aucun produit n'y est associé.")) return;
    
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        fetchBrands();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

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
          image: data.url
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

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({
      slug: '',
      name: '',
      label: '',
      description: '',
      image: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: any) => {
    setEditingBrand(brand);
    setFormData({ ...brand });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingBrand ? 'PUT' : 'POST';
      const url = editingBrand ? `/api/admin/brands/${editingBrand.id}` : '/api/admin/brands';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      setIsModalOpen(false);
      fetchBrands();
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-[#222227]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Marques</h1>
          <p className="text-[13px] text-neutral-500 mt-1">Gérez vos marques partenaires et fournisseurs ({brands.length} au total).</p>
        </div>
        
        <button 
          onClick={openAddModal}
          className="bg-neutral-900 hover:bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus size={14} /> Nouvelle marque
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-3.5 border-b border-neutral-100 flex items-center gap-3 bg-white">
          <Search size={15} className="text-neutral-400 ml-1" />
          <input 
            type="text" 
            placeholder="Rechercher une marque par nom ou slug..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-xs sm:text-[13px] text-neutral-900 placeholder:text-neutral-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Marque</th>
                <th className="px-5 py-3">Slug (URL)</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center text-neutral-400 text-xs">Chargement des marques...</td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center text-neutral-400 text-xs">Aucune marque trouvée.</td>
                </tr>
              ) : (
                filteredBrands.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-[13px] font-bold text-neutral-800 border border-neutral-200 shrink-0 overflow-hidden relative">
                          {b.image ? (
                            <Image src={b.image} alt={b.name} fill className="object-contain p-1.5" />
                          ) : (
                            b.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-[13px] text-neutral-900">{b.name}</span>
                          {b.label && b.label !== b.name && (
                            <div className="text-[11px] text-neutral-500">{b.label}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-600 bg-neutral-100 inline-flex px-2 py-0.5 rounded border border-neutral-200">
                        <Hash size={11} className="text-neutral-400" />
                        {b.slug}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(b)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors border border-neutral-200 shadow-2xs"
                          aria-label="Modifier"
                          title="Modifier"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDelete(b.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-neutral-600 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-neutral-200 shadow-2xs"
                          aria-label="Supprimer"
                          title="Supprimer"
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

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-neutral-200">
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">{editingBrand ? 'Modifier la marque' : 'Nouvelle marque'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-900 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Nom de la marque</label>
                  <input required type="text" className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-medium"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Dior, Chanel..." />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5 flex items-center justify-between gap-2">
                    <span>Slug (Identifiant URL)</span>
                    <span className="font-mono text-[10px] text-neutral-500 normal-case bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">nouamane.ma/fr/brands/<span className="text-neutral-900 font-bold">{formData.slug || 'slug'}</span></span>
                  </label>
                  <input required type="text" className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] font-mono text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                    value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Ex: dior" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Label affiché</label>
                  <input required type="text" className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-medium"
                    value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="Ex: Dior" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Description / Histoire</label>
                  <textarea className="w-full bg-[#f8fafc] border border-neutral-200 rounded-xl p-2.5 text-xs sm:text-[13px] text-neutral-900 min-h-[90px] focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all resize-y leading-relaxed"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Histoire de la marque..." />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1.5">Logo de la marque</label>
                  <div className="flex gap-3 items-start">
                    {formData.image ? (
                      <div className="relative w-20 h-20 border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs group">
                        <Image src={formData.image} alt="Logo" fill className="object-contain p-2" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, image: ''})}
                            className="bg-white text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors shadow-xs"
                            title="Supprimer l'image"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className={`w-20 h-20 border-2 border-dashed border-neutral-200 bg-[#f8fafc] rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50 cursor-pointer transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isUploading ? (
                          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                        ) : (
                          <Upload size={18} />
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-2xs">Annuler</button>
                <button type="submit" className="bg-neutral-900 hover:bg-black text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs">
                  {editingBrand ? 'Enregistrer les modifications' : 'Créer la marque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
