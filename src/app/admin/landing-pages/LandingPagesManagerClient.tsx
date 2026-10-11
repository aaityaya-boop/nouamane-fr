'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Sparkles, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Search, 
  Filter, 
  Flame, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Wand2,
  Package
} from 'lucide-react';
import { PRODUCTS } from '@/lib/products';

export default function LandingPagesManagerClient({ initialPages }: { initialPages: any[] }) {
  const router = useRouter();
  const [pages, setPages] = useState<any[]>(initialPages);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [productMode, setProductMode] = useState<'catalog' | 'custom'>('catalog');
  const [aiSelectedCatalogSlug, setAiSelectedCatalogSlug] = useState(PRODUCTS[0]?.slug || '');
  const [aiCustomName, setAiCustomName] = useState('Sérum Anti-Âge Or 24K & Acide Hyaluronique');
  const [aiCustomCategory, setAiCustomCategory] = useState('Cosmétique & Soin du Visage');
  const [aiCustomBrand, setAiCustomBrand] = useState('Maison NAY Cosmétiques');
  const [aiCustomPrice, setAiCustomPrice] = useState(590);
  const [aiCustomPromoPrice, setAiCustomPromoPrice] = useState(380);
  const [aiMarketingAngle, setAiMarketingAngle] = useState<'LUXURY_GLAMOUR' | 'FLASH_PROMO' | 'GIFT_EXPERIENCE' | 'SKINCARE_TRANSFORMATION' | 'MOROCCAN_COD_DIRECT'>('LUXURY_GLAMOUR');

  const filteredPages = pages.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.badgeText && p.badgeText.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activePagesCount = pages.filter(p => p.status === 'active').length;
  const draftPagesCount = pages.filter(p => p.status === 'draft').length;

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/promo/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleToggleStatus = async (page: any) => {
    const newStatus = page.status === 'active' ? 'draft' : 'active';
    setLoadingAction(`status-${page.id}`);
    try {
      const res = await fetch(`/api/admin/landing-pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...page,
          status: newStatus
        })
      });
      if (res.ok) {
        setPages(prev => prev.map(p => p.id === page.id ? { ...p, status: newStatus } : p));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette landing page ?')) return;
    setLoadingAction(`del-${id}`);
    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPages(prev => prev.filter(p => p.id !== id));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  // Duplicate a page
  const handleDuplicate = async (page: any) => {
    setLoadingAction(`dup-${page.id}`);
    try {
      const newSlug = `${page.slug}-copie-${Date.now().toString(36).slice(-4)}`;
      const payload = {
        slug: newSlug,
        title: `${page.title} (Copie)`,
        subtitle: page.subtitle,
        heroImage: page.heroImage,
        deadline: page.deadline,
        badgeText: page.badgeText,
        status: 'draft',
        productSlugs: page.productSlugs ? JSON.parse(page.productSlugs) : []
      };

      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        setPages(prev => [created, ...prev]);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  // AI 1-Click Generation from Modal
  const handleGenerateAiLandingPage = async () => {
    setAiGenerating(true);
    try {
      const payload = {
        mode: productMode === 'catalog' ? 'catalog_product' : 'custom_product',
        selectedProductSlug: productMode === 'catalog' ? aiSelectedCatalogSlug : undefined,
        customProduct: productMode === 'custom' ? {
          name: aiCustomName,
          category: aiCustomCategory,
          brand: aiCustomBrand,
          price: aiCustomPrice,
          promoPrice: aiCustomPromoPrice
        } : undefined,
        angle: aiMarketingAngle
      };

      const aiRes = await fetch('/api/admin/landing-pages/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const aiData = await aiRes.json();

      if (aiData.success && aiData.data) {
        const gen = aiData.data;

        // Rich configuration
        const richConfig = {
          version: 2,
          products: productMode === 'catalog' 
            ? [{ slug: aiSelectedCatalogSlug, promoPrice: gen.bundles?.[0]?.price || null }] 
            : [],
          customProducts: productMode === 'custom' 
            ? [{
                name: aiCustomName,
                category: aiCustomCategory,
                brand: aiCustomBrand,
                price: aiCustomPrice,
                promoPrice: aiCustomPromoPrice,
                imageUrl: gen.heroImage,
                description: gen.subtitle
              }]
            : [],
          bundles: gen.bundles || [],
          features: gen.features || [],
          reviews: gen.reviews || [],
          faqs: gen.faqs || [],
          story: gen.story || '',
          whatsappNumber: gen.whatsappNumber || '+212663380011',
          urgencyText: gen.urgencyText || '⚡ OFFRE SPÉCIALE MAROC · STOCK LIMITÉ'
        };

        // Create page directly in database
        const createRes = await fetch('/api/admin/landing-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: `${gen.slug || 'offre'}-${Date.now().toString(36).slice(-3)}`,
            title: gen.title,
            subtitle: gen.subtitle,
            heroImage: gen.heroImage,
            badgeText: gen.badgeText,
            status: 'active',
            productSlugs: richConfig
          })
        });

        if (createRes.ok) {
          const newPage = await createRes.json();
          setPages(prev => [newPage, ...prev]);
          setIsAiModalOpen(false);
          router.refresh();
        } else {
          alert("Erreur lors de la création de la page générée");
        }
      } else {
        alert(aiData.error || "Erreur de génération IA");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER WITH AI ACTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Landing Pages (Ads & Meta/TikTok)
            </h1>
            <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
              IA Expert
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Générez et gérez des pages d'atterrissage ultra-performantes optimisées pour le marché marocain (COD, livraison 24h, WhatsApp).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Générer avec l'IA</span>
          </button>

          <Link
            href="/admin/landing-pages/new"
            className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Créer Manuellement</span>
          </Link>
        </div>
      </div>

      {/* METRICS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pages</div>
          <div className="text-2xl font-black text-gray-900">{pages.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">Campagnes configurées</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">En Ligne (Actives)</div>
          <div className="text-2xl font-black text-emerald-700">{activePagesCount}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Prêtes pour Meta & TikTok</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Brouillons</div>
          <div className="text-2xl font-black text-amber-700">{draftPagesCount}</div>
          <div className="text-[11px] text-amber-600 mt-1">En cours de préparation</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Taux Conv. Estimé</div>
          <div className="text-2xl font-black text-indigo-700">6.8%</div>
          <div className="text-[11px] text-indigo-600 mt-1">Optimisé Formulaire Express COD</div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par titre, slug ou badge..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
              statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Toutes ({pages.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
              statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            En Ligne ({activePagesCount})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
              statusFilter === 'draft' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Brouillons ({draftPagesCount})
          </button>
        </div>
      </div>

      {/* LIST OR EMPTY STATE */}
      {filteredPages.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune Landing Page</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            Vous n'avez pas encore de page d'atterrissage pour vos publicités. Laissez notre IA créer une page à fort impact pour l'un de vos parfums ou un nouveau soin cosmétique en quelques secondes !
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Wand2 size={16} />
              <span>Générer Ma 1ère Page avec l'IA</span>
            </button>
            <Link
              href="/admin/landing-pages/new"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
            >
              Créer Manuellement
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map(page => {
            const isCopied = copiedSlug === page.slug;

            return (
              <div
                key={page.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Hero Thumbnail Preview */}
                  <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                    {page.heroImage ? (
                      <img src={page.heroImage} alt="" className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <Layers size={40} />
                      </div>
                    )}

                    {/* Status Pill */}
                    <button
                      onClick={() => handleToggleStatus(page)}
                      disabled={loadingAction === `status-${page.id}`}
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md transition-transform active:scale-95 cursor-pointer ${
                        page.status === 'active'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {page.status === 'active' ? '● En Ligne' : '○ Brouillon'}
                    </button>

                    {/* Deadline Pill */}
                    {page.deadline && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                        <Clock size={11} />
                        <span>Vente Flash</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    {page.badgeText && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-2">
                        {page.badgeText}
                      </span>
                    )}

                    <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 mb-2">
                      {page.title}
                    </h3>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                      {page.subtitle}
                    </p>

                    {/* Public URL Box */}
                    <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono text-gray-600 mb-4">
                      <span className="truncate max-w-[200px]">/promo/{page.slug}</span>
                      <button
                        onClick={() => handleCopyLink(page.slug)}
                        className="text-gray-400 hover:text-sky-600 p-1 transition-colors"
                        title="Copier le lien public"
                      >
                        {isCopied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="px-5 py-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/promo/${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-sky-600 hover:border-sky-300 transition-colors"
                      title="Prévisualiser la page"
                    >
                      <Eye size={16} />
                    </a>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Découvrez cette offre exclusive Maison NAY Parfums : ${typeof window !== 'undefined' ? window.location.origin : 'https://nayparfum.ma'}/promo/${page.slug}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
                      title="Partager sur WhatsApp"
                    >
                      <Share2 size={16} />
                    </a>

                    <button
                      onClick={() => handleDuplicate(page)}
                      disabled={loadingAction === `dup-${page.id}`}
                      className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-amber-600 hover:border-amber-300 transition-colors"
                      title="Dupliquer la page"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(page.id)}
                      disabled={loadingAction === `del-${page.id}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>

                    <Link
                      href={`/admin/landing-pages/${page.id}`}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <Edit size={14} />
                      <span>Modifier</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI GENERATOR MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-amber-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <Wand2 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Générateur IA Expert Maison NAY</h3>
                  <p className="text-xs text-gray-500">Créez une page d'atterrissage complète en 30 secondes.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  1. Quel produit souhaitez-vous promouvoir ?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProductMode('catalog')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                      productMode === 'catalog' ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🛍️ Parfum du Catalogue
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductMode('custom')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                      productMode === 'custom' ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🧪 Cosmétique / Soin Sur-Mesure
                  </button>
                </div>
              </div>

              {productMode === 'catalog' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Sélectionnez le Parfum
                  </label>
                  <select
                    value={aiSelectedCatalogSlug}
                    onChange={e => setAiSelectedCatalogSlug(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                  >
                    {PRODUCTS.map(p => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} ({p.brandLabel}) - {p.price} DH
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nom du Produit Cosmétique / Soin
                    </label>
                    <input
                      type="text"
                      value={aiCustomName}
                      onChange={e => setAiCustomName(e.target.value)}
                      placeholder="ex: Sérum Anti-Âge Or 24K & Acide Hyaluronique"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm bg-white font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Catégorie</label>
                      <input
                        type="text"
                        value={aiCustomCategory}
                        onChange={e => setAiCustomCategory(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Marque</label>
                      <input
                        type="text"
                        value={aiCustomBrand}
                        onChange={e => setAiCustomBrand(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Prix Normal (DH)</label>
                      <input
                        type="number"
                        value={aiCustomPrice}
                        onChange={e => setAiCustomPrice(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Prix Promo Cible (DH)</label>
                      <input
                        type="number"
                        value={aiCustomPromoPrice}
                        onChange={e => setAiCustomPromoPrice(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white font-bold text-red-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  2. Angle Marketing & Psychologique (Meta/TikTok Ads)
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'LUXURY_GLAMOUR', title: '🌟 Haute Parfumerie & Prestige', desc: 'Sillage d’exception, compliments, élégance intemporelle' },
                    { id: 'FLASH_PROMO', title: '⚡ Vente Flash & Urgence Choc', desc: 'Réduction agressive, compte à rebours, stock très limité' },
                    { id: 'SKINCARE_TRANSFORMATION', title: '💆‍♀️ Transformation Cosmétique & Soin', desc: 'Rajeunissement 7 jours, éclat immédiat, actifs purs' },
                    { id: 'GIFT_EXPERIENCE', title: '🎁 Cadeau d’Exception pour Proche', desc: 'Coffret soigné, surprise garantie pour conjoint ou fête' },
                    { id: 'MOROCCAN_COD_DIRECT', title: '🚚 Confiance & Zéro Risque Maroc', desc: 'Paiement à la livraison, colis vérifiable avant de payer' }
                  ].map(angle => (
                    <label
                      key={angle.id}
                      onClick={() => setAiMarketingAngle(angle.id as any)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        aiMarketingAngle === angle.id
                          ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600/30'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mAngleList"
                        checked={aiMarketingAngle === angle.id}
                        onChange={() => setAiMarketingAngle(angle.id as any)}
                        className="mt-1 text-amber-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900">{angle.title}</div>
                        <div className="text-[11px] text-gray-500">{angle.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={aiGenerating}
                onClick={handleGenerateAiLandingPage}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all disabled:opacity-60 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>{aiGenerating ? 'Création en cours...' : 'Générer & Mettre en Ligne'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
