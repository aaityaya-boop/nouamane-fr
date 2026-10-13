'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Save, 
  Trash2, 
  ArrowLeft, 
  Sparkles, 
  Eye, 
  Copy, 
  Check, 
  Plus, 
  Minus, 
  HelpCircle, 
  Star, 
  Truck, 
  ShieldCheck, 
  Clock, 
  MessageCircle,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Tag,
  MessageSquare,
  Package,
  Wand2,
  ShoppingBag,
  Crown,
  Zap,
  Gift
} from 'lucide-react';
import { PRODUCTS } from '@/lib/products';

export default function LandingPageForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'products' | 'bundles' | 'proof' | 'faq'>('hero');
  const [productMode, setProductMode] = useState<'catalog' | 'custom'>('catalog');
  const [catalogSearch, setCatalogSearch] = useState('');

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSelectedCatalogSlug, setAiSelectedCatalogSlug] = useState(PRODUCTS[0]?.slug || '');
  const [aiCustomName, setAiCustomName] = useState('Sérum Anti-Âge Or 24K & Acide Hyaluronique');
  const [aiCustomCategory, setAiCustomCategory] = useState('Cosmétique & Soin du Visage');
  const [aiCustomBrand, setAiCustomBrand] = useState('Maison NAY Cosmétiques');
  const [aiCustomPrice, setAiCustomPrice] = useState(590);
  const [aiCustomPromoPrice, setAiCustomPromoPrice] = useState(380);
  const [aiMarketingAngle, setAiMarketingAngle] = useState<'LUXURY_GLAMOUR' | 'FLASH_PROMO' | 'GIFT_EXPERIENCE' | 'SKINCARE_TRANSFORMATION' | 'MOROCCAN_COD_DIRECT'>('LUXURY_GLAMOUR');

  // Parse Initial Configuration from initialData
  const initialConfig = (() => {
    if (!initialData?.productSlugs) {
      return {
        products: [],
        customProducts: [],
        bundles: [],
        features: [],
        reviews: [],
        faqs: [],
        story: '',
        whatsappNumber: '+212663380011',
        urgencyText: '⚡ OFFRE SPÉCIALE MAROC · STOCK LIMITÉ',
        theme: 'luxury-gold'
      };
    }
    try {
      const parsed = JSON.parse(initialData.productSlugs);
      if (Array.isArray(parsed)) {
        return {
          products: parsed.map((item: any) => typeof item === 'string' ? { slug: item, promoPrice: null } : item),
          customProducts: [],
          bundles: [],
          features: [],
          reviews: [],
          faqs: [],
          story: '',
          whatsappNumber: '+212663380011',
          urgencyText: '⚡ OFFRE SPÉCIALE MAROC · STOCK LIMITÉ',
          theme: 'luxury-gold'
        };
      }
      return {
        products: parsed.products || [],
        customProducts: parsed.customProducts || [],
        bundles: parsed.bundles || [],
        features: parsed.features || [],
        reviews: parsed.reviews || [],
        faqs: parsed.faqs || [],
        story: parsed.story || '',
        whatsappNumber: parsed.whatsappNumber || '+212663380011',
        urgencyText: parsed.urgencyText || '⚡ OFFRE SPÉCIALE MAROC · STOCK LIMITÉ',
        theme: parsed.theme || 'luxury-gold'
      };
    } catch {
      return {
        products: [],
        customProducts: [],
        bundles: [],
        features: [],
        reviews: [],
        faqs: [],
        story: '',
        whatsappNumber: '+212663380011',
        urgencyText: '⚡ OFFRE SPÉCIALE MAROC · STOCK LIMITÉ',
        theme: 'luxury-gold'
      };
    }
  })();

  // Main Form Data State
  const [formData, setFormData] = useState({
    slug: initialData?.slug || '',
    title: initialData?.title || 'Le Luxe Authentique, Sans Compromis.',
    subtitle: initialData?.subtitle || 'Offrez-vous les parfums les plus prisés au monde avec livraison express partout au Maroc.',
    heroImage: initialData?.heroImage || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1600&h=900',
    deadline: initialData?.deadline ? new Date(initialData.deadline).toISOString().slice(0, 16) : '',
    badgeText: initialData?.badgeText || '⚡ OFFRE SPÉCIALE MAROC · LIVRAISON 24H',
    status: initialData?.status || 'active',
    story: initialConfig.story || '',
    whatsappNumber: initialConfig.whatsappNumber || '+212663380011',
    urgencyText: initialConfig.urgencyText || '🔥 Offre spéciale limitée aux 25 premières commandes d’aujourd’hui !',
    products: initialConfig.products || [],
    customProducts: initialConfig.customProducts || [],
    bundles: initialConfig.bundles?.length ? initialConfig.bundles : [
      { id: '1', title: '1x Flacon Découverte', subtitle: 'Format individuel', qty: 1, price: 450, originalPrice: 650, badge: 'Offre standard', isPopular: false },
      { id: '2', title: 'Pack Duo (2 Flacons)', subtitle: 'Le Plus Vendu', qty: 2, price: 790, originalPrice: 1300, badge: '🔥 RECOMMANDÉ · Livraison Gratuite', isPopular: true },
      { id: '3', title: 'Pack VIP (3 Flacons)', subtitle: 'Meilleure Offre', qty: 3, price: 1050, originalPrice: 1950, badge: '👑 1 FLACON OFFERT', isPopular: false }
    ],
    features: initialConfig.features?.length ? initialConfig.features : [
      { icon: 'ShieldCheck', title: '100% Authentique & Scellé', description: 'Flacon original sous blister avec traçabilité européenne vérifiable.' },
      { icon: 'Truck', title: 'Livraison Express 24h/48h', description: 'Livraison sécurisée partout au Maroc avec paiement en espèces.' },
      { icon: 'Clock', title: 'Tenue Longue Durée 24H', description: 'Sillage raffiné et projection remarquable toute la journée.' },
      { icon: 'Sparkles', title: 'Vérification du Colis', description: 'Inspectez votre commande en présence du livreur avant de payer.' }
    ],
    reviews: initialConfig.reviews?.length ? initialConfig.reviews : [
      { name: 'Salma El Amrani', city: 'Casablanca', rating: 5, date: 'Il y a 2 jours', comment: 'Reçu en moins de 24h à Maârif. Parfum 100% authentique, tenue exceptionnelle. Je recommande vivement Maison NAY !' },
      { name: 'Youssef Bennani', city: 'Rabat', rating: 5, date: 'Il y a 4 jours', comment: 'J’ai pris le Pack Duo. Emballage très luxueux et colis vérifiable avant paiement. Service 5 étoiles.' },
      { name: 'Kenza Tazi', city: 'Marrakech', rating: 5, date: 'Il y a 1 semaine', comment: 'Parfait ! Livraison rapide et odeur incroyable qui dure toute la journée. Très heureuse de mon achat.' }
    ],
    faqs: initialConfig.faqs?.length ? initialConfig.faqs : [
      { q: 'Comment s’effectue le paiement ?', a: 'Le paiement est 100% en espèces (Cash on Delivery) à la réception de votre colis. Vous ne payez rien en ligne.' },
      { q: 'Puis-je ouvrir le colis avant de payer ?', a: 'Oui, tout à fait ! Vous avez le droit d’ouvrir le carton et d’inspecter votre produit en présence du livreur avant de régler.' },
      { q: 'Quels sont les délais de livraison au Maroc ?', a: '24h pour Casablanca et Rabat, et 24h à 48h pour les autres villes du Royaume.' },
      { q: 'Les produits sont-ils authentiques ?', a: 'Tous nos parfums et soins sont garantis 100% originaux, scellés et munis de leurs codes de traçabilité.' }
    ]
  });

  // Handle AI Generation
  const handleGenerateWithAi = async () => {
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

      const res = await fetch('/api/admin/landing-pages/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success && data.data) {
        const generated = data.data;

        // Auto-populate form
        setFormData(prev => ({
          ...prev,
          slug: generated.slug || prev.slug,
          title: generated.title || prev.title,
          subtitle: generated.subtitle || prev.subtitle,
          badgeText: generated.badgeText || prev.badgeText,
          heroImage: generated.heroImage || prev.heroImage,
          story: generated.story || prev.story,
          urgencyText: generated.urgencyText || prev.urgencyText,
          bundles: generated.bundles || prev.bundles,
          features: generated.features || prev.features,
          reviews: generated.reviews || prev.reviews,
          faqs: generated.faqs || prev.faqs,
          products: productMode === 'catalog' 
            ? [{ slug: aiSelectedCatalogSlug, promoPrice: generated.bundles?.[0]?.price || null }] 
            : prev.products,
          customProducts: productMode === 'custom' 
            ? [{
                name: aiCustomName,
                category: aiCustomCategory,
                brand: aiCustomBrand,
                price: aiCustomPrice,
                promoPrice: aiCustomPromoPrice,
                imageUrl: generated.heroImage,
                description: generated.subtitle
              }]
            : prev.customProducts
        }));

        setIsAiModalOpen(false);
      } else {
        alert(data.error || 'Erreur lors de la génération avec l’IA');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la communication avec l’IA');
    } finally {
      setAiGenerating(false);
    }
  };

  // Save Landing Page
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const richConfig = {
      version: 2,
      products: formData.products,
      customProducts: formData.customProducts,
      bundles: formData.bundles,
      features: formData.features,
      reviews: formData.reviews,
      faqs: formData.faqs,
      story: formData.story,
      whatsappNumber: formData.whatsappNumber,
      urgencyText: formData.urgencyText
    };

    const payload = {
      slug: formData.slug.trim(),
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      heroImage: formData.heroImage.trim(),
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      badgeText: formData.badgeText.trim(),
      status: formData.status,
      productSlugs: richConfig // Will be stringified by API route
    };

    const url = initialData 
      ? `/api/admin/landing-pages/${initialData.id}` 
      : '/api/admin/landing-pages';
    const method = initialData ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push('/admin/landing-pages');
        router.refresh();
      } else {
        alert('Erreur lors de l’enregistrement');
        setLoading(false);
      }
    } catch {
      alert('Erreur réseau');
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette landing page ?')) return;
    setLoading(true);
    const res = await fetch(`/api/admin/landing-pages/${initialData.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin/landing-pages');
      router.refresh();
    } else {
      alert('Erreur lors de la suppression');
      setLoading(false);
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/promo/${formData.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Catalog item toggle
  const toggleCatalogProduct = (slug: string) => {
    setFormData(prev => {
      const current = prev.products;
      const exists = current.find((item: any) => item.slug === slug);
      if (exists) {
        return { ...prev, products: current.filter((item: any) => item.slug !== slug) };
      } else {
        const item = PRODUCTS.find(p => p.slug === slug);
        return { ...prev, products: [...current, { slug, promoPrice: item?.price || null }] };
      }
    });
  };

  const updateProductPromoPrice = (slug: string, priceStr: string) => {
    const promoPrice = priceStr === '' ? null : Number(priceStr);
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((item: any) => item.slug === slug ? { ...item, promoPrice } : item)
    }));
  };

  const filteredCatalogProducts = PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
    p.brandLabel.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto pb-24">
      
      {/* TOP EXECUTIVE BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-4 z-30">
        <div className="flex items-center gap-3">
          <Link href="/admin/landing-pages" className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                {initialData ? 'Modifier Landing Page' : 'Créer Landing Page Ads'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                formData.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {formData.status === 'active' ? 'En Ligne' : 'Brouillon'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {formData.slug ? `/promo/${formData.slug}` : 'URL en attente de configuration'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* AI Generator Button */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Générer avec l'IA</span>
          </button>

          {formData.slug && (
            <>
              <button
                type="button"
                onClick={copyPublicLink}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Copier le lien public"
              >
                {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                <span>{copiedLink ? 'Copié !' : 'Copier'}</span>
              </button>

              <a
                href={`/promo/${formData.slug}`}
                target="_blank"
                rel="noreferrer"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Eye size={15} />
                <span>Voir</span>
              </a>
            </>
          )}

          {initialData && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-colors"
              title="Supprimer"
            >
              <Trash2 size={18} />
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save size={16} />
            <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto space-x-2">
        {[
          { id: 'hero', label: '1. Hero & Accroche', icon: Layers },
          { id: 'products', label: '2. Produits & Cosmétiques', icon: Package },
          { id: 'bundles', label: '3. Offres & Packs (COD)', icon: Tag },
          { id: 'proof', label: '4. Avis Clients & Avantages', icon: Star },
          { id: 'faq', label: '5. FAQ Maroc & WhatsApp', icon: MessageSquare }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HERO & HOOK */}
      {activeTab === 'hero' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                URL de la page (Slug) *
              </label>
              <div className="flex items-center">
                <span className="bg-gray-50 border border-gray-200 border-r-0 rounded-l-xl px-3.5 py-2.5 text-gray-500 text-xs font-mono">
                  /promo/
                </span>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="ex: offre-born-in-roma"
                  className="flex-1 border border-gray-200 rounded-r-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Statut de la page
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-sky-500 bg-white"
              >
                <option value="active">En Ligne (Accessible publiquement)</option>
                <option value="draft">Brouillon (Désactivé)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Badge d'Urgence Supérieur
            </label>
            <input
              type="text"
              required
              value={formData.badgeText}
              onChange={e => setFormData({ ...formData, badgeText: e.target.value })}
              placeholder="ex: ⚡ OFFRE SPÉCIALE MAROC · LIVRAISON 24H"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Titre Principal (H1 - Hero Hook) *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base font-bold focus:outline-none focus:border-sky-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Sous-titre Persuasif (H2 - Bénéfice & Proposition de Valeur) *
            </label>
            <textarea
              required
              rows={3}
              value={formData.subtitle}
              onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-sky-500 text-gray-700"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Image Hero Principale (URL) *
              </label>
              <input
                type="text"
                required
                value={formData.heroImage}
                onChange={e => setFormData({ ...formData, heroImage: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-sky-500 font-mono mb-3"
              />
              {formData.heroImage && (
                <div className="w-full h-48 relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <img src={formData.heroImage} alt="Hero Preview" className="object-cover w-full h-full" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Date de fin (Vente Flash / Compte à Rebours) - Optionnel
              </label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-sky-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Si activé, affiche la barre d'urgence en haut de la page avec un compte à rebours précis.
              </p>

              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Texte de rareté & d'urgence
                </label>
                <input
                  type="text"
                  value={formData.urgencyText}
                  onChange={e => setFormData({ ...formData, urgencyText: e.target.value })}
                  placeholder="ex: Stock limité aux 30 premières commandes d'aujourd'hui"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Storytelling & Argumentaire de Vente (Expérience Sensorielle ou Rajeunissement)
            </label>
            <textarea
              rows={4}
              value={formData.story}
              onChange={e => setFormData({ ...formData, story: e.target.value })}
              placeholder="Racontez l'histoire unique de ce produit, les notes de tête, la tenue 24h ou les actifs dermatologiques..."
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & COSMETICS */}
      {activeTab === 'products' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex border-b border-gray-200 pb-4 justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">Type de Produit Cible</h3>
              <p className="text-xs text-gray-500">Sélectionnez un parfum existant ou créez un produit cosmétique / sur-mesure.</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setProductMode('catalog')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
                  productMode === 'catalog' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Catalogue Parfums
              </button>
              <button
                type="button"
                onClick={() => setProductMode('custom')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
                  productMode === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Nouveau Produit / Cosmétique
              </button>
            </div>
          </div>

          {productMode === 'catalog' && (
            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Rechercher un parfum dans le catalogue (ex: Valentino, Libre, Sauvage...)"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500"
                />
                <span className="text-xs text-gray-500 font-semibold">
                  {formData.products.length} sélectionné(s)
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[450px] overflow-y-auto p-3 border border-gray-100 rounded-xl bg-gray-50">
                {filteredCatalogProducts.map(p => {
                  const selectedItem = formData.products.find((item: any) => item.slug === p.slug);
                  const isSelected = !!selectedItem;
                  return (
                    <div
                      key={p.id}
                      className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${
                        isSelected ? 'bg-sky-50 border-sky-300 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCatalogProduct(p.slug)}
                          className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={p.images[0]} alt="" className="object-cover w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">{p.name}</div>
                          <div className="text-[11px] text-gray-500">{p.brandLabel} · {p.price} DH</div>
                        </div>
                      </label>

                      {isSelected && (
                        <div className="pl-7 pt-1 border-t border-sky-100">
                          <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                            Prix Promotionnel Spécifique (DH)
                          </label>
                          <input
                            type="number"
                            placeholder={`Normal : ${p.price} DH`}
                            value={selectedItem.promoPrice || ''}
                            onChange={e => updateProductPromoPrice(p.slug, e.target.value)}
                            className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:border-sky-500 focus:outline-none bg-white font-bold"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {productMode === 'custom' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
                💡 <strong>Mode Produit Sur-Mesure :</strong> Vous pouvez créer des landing pages pour n’importe quelle catégorie (Sérums anti-âge, Crèmes de soin, Huiles précieuses d’argan, Soins capillaires, etc.) même si le produit n'est pas encore dans votre base de données permanente de parfums !
              </div>

              {formData.customProducts.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <Package size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-bold text-gray-700 mb-2">Aucun produit sur-mesure défini</p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      customProducts: [{
                        id: 'custom-1',
                        name: 'Sérum Anti-Âge Or 24K & Acide Hyaluronique',
                        category: 'Cosmétique & Soin du Visage',
                        brand: 'Maison NAY Cosmétiques',
                        price: 590,
                        promoPrice: 380,
                        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=1200&h=800',
                        description: 'Formule concentrée régénérante aux actifs anti-âge d’exception.'
                      }]
                    }))}
                    className="bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-sky-700 transition-colors"
                  >
                    + Ajouter un Produit Cosmétique / Soin
                  </button>
                </div>
              ) : (
                formData.customProducts.map((cp: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-2xl p-6 bg-gray-50/50 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-900 uppercase">Produit Personnalisé #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          customProducts: prev.customProducts.filter((_: any, i: number) => i !== idx)
                        }))}
                        className="text-red-600 hover:text-red-800 text-xs font-bold"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nom du Produit *</label>
                        <input
                          type="text"
                          value={cp.name || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              customProducts: prev.customProducts.map((p: any, i: number) => i === idx ? { ...p, name: val } : p)
                            }));
                          }}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Catégorie</label>
                        <input
                          type="text"
                          value={cp.category || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              customProducts: prev.customProducts.map((p: any, i: number) => i === idx ? { ...p, category: val } : p)
                            }));
                          }}
                          placeholder="Cosmétique, Sérum, Soin..."
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Marque</label>
                        <input
                          type="text"
                          value={cp.brand || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              customProducts: prev.customProducts.map((p: any, i: number) => i === idx ? { ...p, brand: val } : p)
                            }));
                          }}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Prix Normal (DH)</label>
                        <input
                          type="number"
                          value={cp.price || ''}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              customProducts: prev.customProducts.map((p: any, i: number) => i === idx ? { ...p, price: val } : p)
                            }));
                          }}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Prix Promo Publicité (DH)</label>
                        <input
                          type="number"
                          value={cp.promoPrice || ''}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              customProducts: prev.customProducts.map((p: any, i: number) => i === idx ? { ...p, promoPrice: val } : p)
                            }));
                          }}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white font-bold text-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Image URL</label>
                        <input
                          type="text"
                          value={cp.imageUrl || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              customProducts: prev.customProducts.map((p: any, i: number) => i === idx ? { ...p, imageUrl: val } : p)
                            }));
                          }}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BUNDLES (COD) */}
      {activeTab === 'bundles' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-gray-900">Formules & Packs Promotionnels</h3>
            <p className="text-xs text-gray-500">
              Configurez les 3 formules d'achat présentées aux clients sur la landing page.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {formData.bundles.map((bundle: any, idx: number) => (
              <div key={bundle.id} className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold uppercase text-gray-900">Pack #{idx + 1}</span>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!bundle.isPopular}
                      onChange={e => {
                        const checked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          bundles: prev.bundles.map((b: any, i: number) => ({
                            ...b,
                            isPopular: i === idx ? checked : false
                          }))
                        }));
                      }}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    <span>Recommandé</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Titre de l'Offre</label>
                  <input
                    type="text"
                    value={bundle.title}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        bundles: prev.bundles.map((b: any, i: number) => i === idx ? { ...b, title: val } : b)
                      }));
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Sous-titre</label>
                  <input
                    type="text"
                    value={bundle.subtitle || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        bundles: prev.bundles.map((b: any, i: number) => i === idx ? { ...b, subtitle: val } : b)
                      }));
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Prix Promo (DH) *</label>
                    <input
                      type="number"
                      value={bundle.price}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          bundles: prev.bundles.map((b: any, i: number) => i === idx ? { ...b, price: val } : b)
                        }));
                      }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white font-black text-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Prix Barré (DH)</label>
                    <input
                      type="number"
                      value={bundle.originalPrice || ''}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          bundles: prev.bundles.map((b: any, i: number) => i === idx ? { ...b, originalPrice: val } : b)
                        }));
                      }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-400 line-through"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Badge Promotionnel</label>
                  <input
                    type="text"
                    value={bundle.badge || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        bundles: prev.bundles.map((b: any, i: number) => i === idx ? { ...b, badge: val } : b)
                      }));
                    }}
                    placeholder="ex: LE PLUS VENDU · Livraison Gratuite"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REVIEWS & FEATURES */}
      {activeTab === 'proof' && (
        <div className="space-y-8">
          {/* Features */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-gray-900">4 Points Forts & Piliers de Réassurance</h3>
              <p className="text-xs text-gray-500">Mettez en avant l'authenticité, la livraison express et la vérification du colis.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {formData.features.map((feat: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Avantage #{idx + 1}</span>
                  </div>
                  <input
                    type="text"
                    value={feat.title}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        features: prev.features.map((f: any, i: number) => i === idx ? { ...f, title: val } : f)
                      }));
                    }}
                    placeholder="Titre"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                  />
                  <textarea
                    rows={2}
                    value={feat.description}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        features: prev.features.map((f: any, i: number) => i === idx ? { ...f, description: val } : f)
                      }));
                    }}
                    placeholder="Description détaillée"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white text-gray-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Moroccan Reviews */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Témoignages Clients Marocains (Preuve Sociale)</h3>
                <p className="text-xs text-gray-500">Avis réalistes renforçant la confiance avec villes marocaines.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  reviews: [
                    ...prev.reviews,
                    { name: 'Nouveau Client', city: 'Casablanca', rating: 5, date: 'Récemment', comment: 'Excellent produit !' }
                  ]
                }))}
                className="text-sky-600 hover:text-sky-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Plus size={16} />
                <span>Ajouter un avis</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.reviews.map((rev: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">Avis #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        reviews: prev.reviews.filter((_: any, i: number) => i !== idx)
                      }))}
                      className="text-red-600 text-xs font-semibold"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={rev.name}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          reviews: prev.reviews.map((r: any, i: number) => i === idx ? { ...r, name: val } : r)
                        }));
                      }}
                      placeholder="Nom du client"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white font-bold"
                    />
                    <input
                      type="text"
                      value={rev.city}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          reviews: prev.reviews.map((r: any, i: number) => i === idx ? { ...r, city: val } : r)
                        }));
                      }}
                      placeholder="Ville (Casablanca, Rabat...)"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                    />
                    <input
                      type="text"
                      value={rev.date || 'Il y a 2 jours'}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          reviews: prev.reviews.map((r: any, i: number) => i === idx ? { ...r, date: val } : r)
                        }));
                      }}
                      placeholder="Date (ex: Il y a 2 jours)"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                    />
                  </div>

                  <textarea
                    rows={2}
                    value={rev.comment}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        reviews: prev.reviews.map((r: any, i: number) => i === idx ? { ...r, comment: val } : r)
                      }));
                    }}
                    placeholder="Commentaire"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white text-gray-700"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FAQ & WHATSAPP */}
      {activeTab === 'faq' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-gray-900">Paramètres WhatsApp & Questions Fréquentes</h3>
            <p className="text-xs text-gray-500">Configurez le contact direct et levez les freins à l'achat.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Numéro WhatsApp pour Commandes 1-Clic
            </label>
            <input
              type="text"
              value={formData.whatsappNumber}
              onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
              placeholder="+212663380011"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-sky-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Les clients pourront commander en 1-clic sur ce numéro avec un message pré-rempli.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Questions Fréquentes (Accordéon)</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  faqs: [...prev.faqs, { q: 'Nouvelle question ?', a: 'Réponse explicative...' }]
                }))}
                className="text-sky-600 hover:text-sky-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Plus size={16} />
                <span>Ajouter une question</span>
              </button>
            </div>

            {formData.faqs.map((faq: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">Question #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      faqs: prev.faqs.filter((_: any, i: number) => i !== idx)
                    }))}
                    className="text-red-600 text-xs font-semibold"
                  >
                    Supprimer
                  </button>
                </div>
                <input
                  type="text"
                  value={faq.q}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      faqs: prev.faqs.map((f: any, i: number) => i === idx ? { ...f, q: val } : f)
                    }));
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                />
                <textarea
                  rows={2}
                  value={faq.a}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      faqs: prev.faqs.map((f: any, i: number) => i === idx ? { ...f, a: val } : f)
                    }));
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white text-gray-600"
                />
              </div>
            ))}
          </div>
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
                  <p className="text-xs text-gray-500">Copywriting persuasif haute conversion pour Meta & TikTok Ads.</p>
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
                  1. Source du Produit
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProductMode('catalog')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                      productMode === 'catalog' ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ShoppingBag size={14} className="text-amber-600 shrink-0" />
                    <span>Parfum du Catalogue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductMode('custom')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                      productMode === 'custom' ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Sparkles size={14} className="text-purple-600 shrink-0" />
                    <span>Cosmétique / Sur-Mesure</span>
                  </button>
                </div>
              </div>

              {productMode === 'catalog' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Sélectionnez le Parfum à Promouvoir
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
                  2. Angle Publicitaire & Psychologique
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'LUXURY_GLAMOUR', icon: <Crown size={14} className="text-amber-600" />, title: 'Haute Parfumerie & Prestige', desc: 'Sillage d’exception, compliments, élégance intemporelle' },
                    { id: 'FLASH_PROMO', icon: <Zap size={14} className="text-rose-500" />, title: 'Vente Flash & Urgence Choc', desc: 'Réduction agressive, compte à rebours, stock très limité' },
                    { id: 'SKINCARE_TRANSFORMATION', icon: <Sparkles size={14} className="text-purple-500" />, title: 'Transformation Cosmétique & Soin', desc: 'Rajeunissement 7 jours, éclat immédiat, actifs purs' },
                    { id: 'GIFT_EXPERIENCE', icon: <Gift size={14} className="text-indigo-500" />, title: 'Cadeau d’Exception pour Proche', desc: 'Coffret soigné, surprise garantie pour conjoint ou fête' },
                    { id: 'MOROCCAN_COD_DIRECT', icon: <Truck size={14} className="text-emerald-600" />, title: 'Confiance & Zéro Risque Maroc', desc: 'Paiement à la livraison, colis vérifiable avant de payer' }
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
                        name="marketingAngle"
                        checked={aiMarketingAngle === angle.id}
                        onChange={() => setAiMarketingAngle(angle.id as any)}
                        className="mt-1 text-amber-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          {angle.icon}
                          <span>{angle.title}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{angle.desc}</div>
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
                onClick={handleGenerateWithAi}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all disabled:opacity-60 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>{aiGenerating ? 'Génération en cours...' : 'Générer Toute la Page'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
