'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Sparkles,
  Eye,
  Edit,
  Trash2,
  Copy,
  Check,
  Share2,
  Search,
  TrendingUp,
  Layers,
  Clock,
  Wand2,
  Smartphone,
  ShieldCheck,
  Truck,
  Flame,
  Film,
  X,
  Loader2,
  Zap,
  Crown,
  Gift,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { formatMAD } from '@/lib/products';
import type { CatalogPickerItem } from './page';

type MarketingAngle =
  | 'LUXURY_GLAMOUR'
  | 'FLASH_PROMO'
  | 'GIFT_EXPERIENCE'
  | 'SKINCARE_TRANSFORMATION'
  | 'MOROCCAN_COD_DIRECT';

type FunnelTheme = 'electric-blue' | 'luxury-gold' | 'beauty-rose';

interface Blueprint {
  id: string;
  title: string;
  tag: string;
  desc: string;
  angle: MarketingAngle;
  theme: FunnelTheme;
  mode: 'catalog' | 'custom';
  accent: string;
}

const BLUEPRINTS: Blueprint[] = [
  {
    id: 'signature',
    title: 'Parfum Signature Luxe',
    tag: 'Meilleure Rétention',
    desc: 'Hero éditorial, pyramide olfactive, avis vérifiés Maroc et pack Duo recommandé.',
    angle: 'LUXURY_GLAMOUR',
    theme: 'electric-blue',
    mode: 'catalog',
    accent: 'from-[#0ea5e9] to-[#0284c7]',
  },
  {
    id: 'flash',
    title: 'Vente Flash Testeurs -40%',
    tag: 'Ultra Haute Conv.',
    desc: 'Compte à rebours temps réel, badge stock critique et tunnel COD en 1 écran.',
    angle: 'FLASH_PROMO',
    theme: 'electric-blue',
    mode: 'catalog',
    accent: 'from-sky-500 to-blue-700',
  },
  {
    id: 'gift',
    title: 'Pack Cadeau & Coffret VIP',
    tag: 'Panier Moyen +45%',
    desc: 'Focus Pack Duo & Trio VIP, emballage ruban offert et livraison 24h prioritaire.',
    angle: 'GIFT_EXPERIENCE',
    theme: 'luxury-gold',
    mode: 'catalog',
    accent: 'from-slate-800 to-slate-950',
  },
  {
    id: 'skincare',
    title: 'Soin & Cosmétique 7 Jours',
    tag: 'Produit Sur-Mesure',
    desc: 'Structure transformation avant/après, actifs certifiés et garantie satisfaction.',
    angle: 'SKINCARE_TRANSFORMATION',
    theme: 'beauty-rose',
    mode: 'custom',
    accent: 'from-rose-500 to-pink-600',
  },
];

const ANGLES: Array<{
  id: MarketingAngle;
  title: string;
  desc: string;
}> = [
  {
    id: 'LUXURY_GLAMOUR',
    title: 'Haute Parfumerie & Prestige',
    desc: 'Sillage 24h, compliments et élégance signature.',
  },
  {
    id: 'FLASH_PROMO',
    title: 'Vente Flash & Urgence Choc',
    desc: 'Compte à rebours, remise agressive et rareté.',
  },
  {
    id: 'SKINCARE_TRANSFORMATION',
    title: 'Transformation Cosmétique (7J)',
    desc: 'Résultats visibles, éclat et actifs dermatologiques.',
  },
  {
    id: 'GIFT_EXPERIENCE',
    title: 'Pack Cadeau & Duo VIP',
    desc: 'Idéal couples, coffrets et paniers élevés.',
  },
  {
    id: 'MOROCCAN_COD_DIRECT',
    title: 'Confiance & Vérification COD Maroc',
    desc: 'Zéro risque : vérifiez le colis avant de payer.',
  },
];

export default function LandingPagesManagerClient({
  initialPages,
  catalogProducts,
}: {
  initialPages: any[];
  catalogProducts: CatalogPickerItem[];
}) {
  const router = useRouter();
  const [pages, setPages] = useState<any[]>(initialPages);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  // AI Funnel Studio Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [productMode, setProductMode] = useState<'catalog' | 'custom'>('catalog');
  const [aiSelectedCatalogSlug, setAiSelectedCatalogSlug] = useState(
    catalogProducts[0]?.slug || ''
  );
  const [catalogSearch, setCatalogSearch] = useState('');
  const [aiCustomName, setAiCustomName] = useState(
    'Sérum Anti-Âge Or 24K & Acide Hyaluronique'
  );
  const [aiCustomCategory, setAiCustomCategory] = useState('Cosmétique & Soin du Visage');
  const [aiCustomBrand, setAiCustomBrand] = useState('Maison NAY Cosmétiques');
  const [aiCustomPrice, setAiCustomPrice] = useState(590);
  const [aiCustomPromoPrice, setAiCustomPromoPrice] = useState(380);
  const [aiMarketingAngle, setAiMarketingAngle] =
    useState<MarketingAngle>('LUXURY_GLAMOUR');
  const [aiTheme, setAiTheme] = useState<FunnelTheme>('electric-blue');
  const [aiWhatsapp, setAiWhatsapp] = useState('+212663380011');

  const notify = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const openAiStudioWithBlueprint = (bp?: Blueprint) => {
    if (bp) {
      setAiMarketingAngle(bp.angle);
      setAiTheme(bp.theme);
      setProductMode(bp.mode);
    }
    setIsAiModalOpen(true);
  };

  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return catalogProducts;
    const q = catalogSearch.toLowerCase();
    return catalogProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brandLabel.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [catalogProducts, catalogSearch]);

  const selectedCatalogProduct = useMemo(
    () => catalogProducts.find((p) => p.slug === aiSelectedCatalogSlug) || catalogProducts[0],
    [catalogProducts, aiSelectedCatalogSlug]
  );

  // Live preview computed values inside Studio Modal
  const livePreview = useMemo(() => {
    const prodName =
      productMode === 'catalog'
        ? selectedCatalogProduct?.name || 'Parfum Signature NAY'
        : aiCustomName || 'Produit Sur-Mesure';
    const brand =
      productMode === 'catalog'
        ? selectedCatalogProduct?.brandLabel || 'Maison NAY'
        : aiCustomBrand || 'Maison NAY';
    const regularPrice =
      productMode === 'catalog'
        ? selectedCatalogProduct?.originalPrice || 590
        : aiCustomPrice || 590;
    const promoPrice =
      productMode === 'catalog'
        ? selectedCatalogProduct?.price || 399
        : aiCustomPromoPrice || 380;
    const image =
      productMode === 'catalog'
        ? selectedCatalogProduct?.imageUrl || ''
        : 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=900';

    const discountPct =
      regularPrice > promoPrice ? Math.round((1 - promoPrice / regularPrice) * 100) : 25;

    const angleCopy: Record<MarketingAngle, { badge: string; h1: string; sub: string }> = {
      LUXURY_GLAMOUR: {
        badge: `COUP DE CŒUR NAY • -${discountPct}%`,
        h1: `Le Sillage Inoubliable : ${prodName}`,
        sub: `${brand} • Tenue extrême 24h & livraison express au Maroc.`,
      },
      FLASH_PROMO: {
        badge: `VENTE FLASH • -${discountPct}% AUJOURD'HUI`,
        h1: `${prodName} à Seulement ${promoPrice} DH`,
        sub: `Offre limitée • Plus que 9 pièces disponibles en stock.`,
      },
      SKINCARE_TRANSFORMATION: {
        badge: `RÉSULTATS 7 JOURS • -${discountPct}%`,
        h1: `Transformez Votre Éclat avec ${prodName}`,
        sub: `Formule haute concentration • Vérification colis avant paiement.`,
      },
      GIFT_EXPERIENCE: {
        badge: `PACK CADEAU PRESTIGE • LIVRAISON 24H`,
        h1: `Le Cadeau Parfait : Coffret ${prodName}`,
        sub: `Emballage luxe offert + Pack Duo économique recommandé.`,
      },
      MOROCCAN_COD_DIRECT: {
        badge: `PAIEMENT CASH À LA LIVRAISON`,
        h1: `${prodName} Authentique Garanti`,
        sub: `Ouvrez et vérifiez votre colis devant le livreur avant de payer.`,
      },
    };

    return {
      prodName,
      brand,
      regularPrice,
      promoPrice,
      duoPrice: Math.round(promoPrice * 1.75),
      trioPrice: Math.round(promoPrice * 2.3),
      image,
      copy: angleCopy[aiMarketingAngle],
    };
  }, [
    productMode,
    selectedCatalogProduct,
    aiCustomName,
    aiCustomBrand,
    aiCustomPrice,
    aiCustomPromoPrice,
    aiMarketingAngle,
  ]);

  const filteredPages = pages.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.badgeText && p.badgeText.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activePagesCount = pages.filter((p) => p.status === 'active').length;
  const draftPagesCount = pages.filter((p) => p.status === 'draft').length;
  const activeRatio =
    pages.length > 0 ? Math.round((activePagesCount / pages.length) * 100) : 0;

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/promo/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    notify(`Lien /promo/${slug} copié !`);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleToggleStatus = async (page: any) => {
    const newStatus = page.status === 'active' ? 'draft' : 'active';
    setLoadingAction(`status-${page.id}`);
    try {
      const res = await fetch(`/api/admin/landing-pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...page, status: newStatus }),
      });
      if (res.ok) {
        setPages((prev) =>
          prev.map((p) => (p.id === page.id ? { ...p, status: newStatus } : p))
        );
        notify(`Page passée en ${newStatus === 'active' ? 'En Ligne' : 'Brouillon'}`);
        router.refresh();
      }
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
        setPages((prev) => prev.filter((p) => p.id !== id));
        notify('Landing page supprimée.');
        router.refresh();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDuplicate = async (page: any) => {
    setLoadingAction(`dup-${page.id}`);
    try {
      const newSlug = `${page.slug}-copie-${Date.now().toString(36).slice(-4)}`;
      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newSlug,
          title: `${page.title} (Copie)`,
          subtitle: page.subtitle,
          heroImage: page.heroImage,
          deadline: page.deadline,
          badgeText: page.badgeText,
          status: 'draft',
          productSlugs: page.productSlugs ? JSON.parse(page.productSlugs) : [],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setPages((prev) => [created, ...prev]);
        notify('Page dupliquée en brouillon !');
        router.refresh();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateAiLandingPage = async () => {
    setAiGenerating(true);
    try {
      const payload = {
        mode: productMode === 'catalog' ? 'catalog_product' : 'custom_product',
        selectedProductSlug:
          productMode === 'catalog' ? aiSelectedCatalogSlug : undefined,
        customProduct:
          productMode === 'custom'
            ? {
                name: aiCustomName,
                category: aiCustomCategory,
                brand: aiCustomBrand,
                price: aiCustomPrice,
                promoPrice: aiCustomPromoPrice,
              }
            : undefined,
        angle: aiMarketingAngle,
      };

      const aiRes = await fetch('/api/admin/landing-pages/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const aiData = await aiRes.json();

      if (aiData.success && aiData.data) {
        const gen = aiData.data;
        const richConfig = {
          version: 2,
          theme: aiTheme,
          products:
            productMode === 'catalog'
              ? [{ slug: aiSelectedCatalogSlug, promoPrice: gen.bundles?.[0]?.price || null }]
              : [],
          customProducts:
            productMode === 'custom'
              ? [
                  {
                    name: aiCustomName,
                    category: aiCustomCategory,
                    brand: aiCustomBrand,
                    price: aiCustomPrice,
                    promoPrice: aiCustomPromoPrice,
                    imageUrl: gen.heroImage,
                    description: gen.subtitle,
                  },
                ]
              : [],
          bundles: gen.bundles || [],
          features: gen.features || [],
          reviews: gen.reviews || [],
          faqs: gen.faqs || [],
          story: gen.story || '',
          whatsappNumber: aiWhatsapp || gen.whatsappNumber || '+212663380011',
          urgencyText: gen.urgencyText || 'OFFRE SPÉCIALE MAROC · STOCK LIMITÉ',
        };

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
            productSlugs: richConfig,
          }),
        });

        if (createRes.ok) {
          const newPage = await createRes.json();
          setPages((prev) => [newPage, ...prev]);
          setIsAiModalOpen(false);
          notify('Landing Page générée par IA et publiée en ligne !');
          router.refresh();
        } else {
          notify('Erreur lors de la sauvegarde de la page générée.', false);
        }
      } else {
        notify(aiData.error || 'Erreur de génération IA', false);
      }
    } catch {
      notify('Erreur réseau lors de la génération.', false);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
              toast.ok
                ? 'bg-slate-900 text-white border-sky-500/40'
                : 'bg-red-600 text-white border-red-400'
            }`}
          >
            <CheckCircle2 size={15} className="text-sky-400 shrink-0" />
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              NAY PARFUMS • CONVERSION FUNNELS &amp; COD STUDIO
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200">
              <Sparkles size={11} />
              IA Générative Active
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Meta &amp; TikTok COD
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900">
            Landing Pages &amp; Tunnels de Conversion
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
            Concevez, prévisualisez et publiez des pages d&apos;atterrissage haute conversion (Formulaire Express COD, Packs Duo/VIP, WhatsApp).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/creatives"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
          >
            <Film size={14} className="text-[#0ea5e9]" />
            <span>Studio Créatifs Pubs</span>
          </Link>

          <Link
            href="/admin/landing-pages/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
          >
            <Plus size={14} />
            <span>Créer Manuellement</span>
          </Link>

          <button
            type="button"
            onClick={() => openAiStudioWithBlueprint()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white font-semibold text-xs transition-all shadow-md shadow-sky-500/20 cursor-pointer"
          >
            <Wand2 size={14} />
            <span>Générer avec l&apos;IA</span>
          </button>
        </div>
      </div>

      {/* 4 BENTO KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nay-stagger">
        {/* Hero Card */}
        <div className="nay-hero-shine rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] text-white shadow-lg shadow-sky-500/20 flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-100">
              TUNNELS CONFIGURÉS
            </span>
            <Layers size={15} className="text-white/90" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tabular-nums">{pages.length}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 border border-white/25">
              {activePagesCount} en ligne
            </span>
          </div>
          <p className="text-[11px] text-sky-100 mt-2">
            Prêtes pour campagnes Meta, TikTok &amp; Snapchat
          </p>
        </div>

        {/* Active */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              PAGES ACTIVES
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Zap size={14} />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-emerald-600 tabular-nums">
            {activePagesCount}
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 nay-progress-fill"
                style={{ width: `${Math.max(4, activeRatio)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">{activeRatio}% du parc publié</p>
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              BROUILLONS STUDIO
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock size={14} />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-slate-900 tabular-nums">
            {draftPagesCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">En attente de validation finale</p>
        </div>

        {/* Estimated COD Conversion */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              CONV. EXPRESS COD
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-[#0ea5e9]">
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-extrabold text-[#0284c7] tabular-nums">
            6.8%
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Formulaire COD Maroc + Packs Duo/VIP
          </p>
        </div>
      </div>

      {/* NEW CREATIVE FEATURE: 1-CLICK CONVERSION BLUEPRINTS GALLERY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 nay-enter">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0ea5e9]">
              MODÈLES DE TUNNELS HAUTE CONVERSION
            </span>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
              Blueprints 1-Clic (Génération &amp; Prévisualisation Mobile Instantanée)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => openAiStudioWithBlueprint()}
            className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            Ouvrir Studio Complet <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {BLUEPRINTS.map((bp) => (
            <button
              key={bp.id}
              type="button"
              onClick={() => openAiStudioWithBlueprint(bp)}
              className="group text-left p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-[#0ea5e9] transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${bp.accent} text-white flex items-center justify-center shadow-xs`}
                  >
                    {bp.id === 'flash' ? (
                      <Flame size={15} />
                    ) : bp.id === 'gift' ? (
                      <Gift size={15} />
                    ) : bp.id === 'skincare' ? (
                      <Sparkles size={15} />
                    ) : (
                      <Crown size={15} />
                    )}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                    {bp.tag}
                  </span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#0284c7] transition-colors">
                  {bp.title}
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{bp.desc}</p>
              </div>
              <div className="text-[11px] font-bold text-[#0284c7] flex items-center gap-1 pt-2 border-t border-slate-200/70">
                <Wand2 size={11} />
                <span>Lancer avec IA →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Rechercher par titre, slug (/promo/...) ou badge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0ea5e9]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(
            [
              { id: 'all', label: `Toutes (${pages.length})` },
              { id: 'active', label: `En Ligne (${activePagesCount})` },
              { id: 'draft', label: `Brouillons (${draftPagesCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST OR EMPTY STATE */}
      {filteredPages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center mx-auto">
            <Wand2 size={26} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Aucune Landing Page trouvée
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Choisissez un Blueprint ci-dessus ou ouvrez le Studio IA pour générer votre première page d&apos;atterrissage COD avec packs Solo/Duo/VIP en moins de 30 secondes.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => openAiStudioWithBlueprint(BLUEPRINTS[0])}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white font-semibold text-xs shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Générer ma 1ère Page avec l&apos;IA</span>
            </button>
            <Link
              href="/admin/landing-pages/new"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Créer Manuellement
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 nay-stagger">
          {filteredPages.map((page) => {
            const isCopied = copiedSlug === page.slug;
            return (
              <div
                key={page.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs nay-card-lift flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    {page.heroImage ? (
                      <img
                        src={page.heroImage}
                        alt={page.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-300">
                        <Layers size={38} />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(page)}
                      disabled={loadingAction === `status-${page.id}`}
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md cursor-pointer ${
                        page.status === 'active'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {page.status === 'active' ? '● En Ligne' : '○ Brouillon'}
                    </button>

                    {page.deadline && (
                      <div className="absolute top-3 right-3 bg-slate-950/75 backdrop-blur-md text-sky-300 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Clock size={11} />
                        <span>Flash</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    {page.badgeText && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7] bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full inline-block mb-2">
                        {page.badgeText}
                      </span>
                    )}

                    <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2 mb-1.5">
                      {page.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {page.subtitle}
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-mono text-slate-600">
                      <span className="truncate max-w-[200px]">/promo/{page.slug}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(page.slug)}
                        className="text-slate-400 hover:text-[#0284c7] p-1 transition-colors cursor-pointer"
                        title="Copier le lien public"
                      >
                        {isCopied ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/promo/${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0284c7] hover:border-sky-300 transition-colors"
                      title="Ouvrir la page en direct"
                    >
                      <Eye size={15} />
                    </a>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Découvrez cette offre Maison NAY Parfums : ${
                          typeof window !== 'undefined'
                            ? window.location.origin
                            : 'https://nayparfum.ma'
                        }/promo/${page.slug}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
                      title="Partager sur WhatsApp"
                    >
                      <Share2 size={15} />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(page)}
                      disabled={loadingAction === `dup-${page.id}`}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0284c7] hover:border-sky-300 transition-colors cursor-pointer"
                      title="Dupliquer"
                    >
                      <Copy size={15} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(page.id)}
                      disabled={loadingAction === `del-${page.id}`}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>

                    <Link
                      href={`/admin/landing-pages/${page.id}`}
                      className="bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-opacity shadow-xs"
                    >
                      <Edit size={13} />
                      <span>Éditer</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DUAL-PANE AI FUNNEL GENERATOR STUDIO MODAL */}
      <AnimatePresence>
        {isAiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsAiModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center shadow-sm">
                    <Wand2 size={19} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Studio IA Générateur de Funnels NAY
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configurez votre offre à gauche et prévisualisez le tunnel mobile COD en direct à droite.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dual Pane Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* Left 7 Cols: Configuration */}
                <div className="lg:col-span-7 p-6 space-y-5 overflow-y-auto">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      1. Source du Produit
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setProductMode('catalog')}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                          productMode === 'catalog'
                            ? 'border-[#0ea5e9] bg-sky-50/70 text-[#0284c7] ring-1 ring-[#0ea5e9]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Parfum / Produit Boutique ({catalogProducts.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductMode('custom')}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                          productMode === 'custom'
                            ? 'border-[#0ea5e9] bg-sky-50/70 text-[#0284c7] ring-1 ring-[#0ea5e9]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Nouveau Produit Sur-Mesure
                      </button>
                    </div>
                  </div>

                  {productMode === 'catalog' ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Sélectionner le Parfum
                        </label>
                        <input
                          type="text"
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          placeholder="Filtrer..."
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 w-40"
                        />
                      </div>
                      <select
                        value={aiSelectedCatalogSlug}
                        onChange={(e) => setAiSelectedCatalogSlug(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-white text-slate-900"
                      >
                        {filteredCatalog.map((p) => (
                          <option key={p.slug} value={p.slug}>
                            {p.name} ({p.brandLabel}) — {p.price} MAD
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Nom du Produit
                        </label>
                        <input
                          type="text"
                          value={aiCustomName}
                          onChange={(e) => setAiCustomName(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white font-semibold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Catégorie
                          </label>
                          <input
                            type="text"
                            value={aiCustomCategory}
                            onChange={(e) => setAiCustomCategory(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Marque
                          </label>
                          <input
                            type="text"
                            value={aiCustomBrand}
                            onChange={(e) => setAiCustomBrand(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Prix Normal (MAD)
                          </label>
                          <input
                            type="number"
                            value={aiCustomPrice}
                            onChange={(e) => setAiCustomPrice(Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Prix Promo (MAD)
                          </label>
                          <input
                            type="number"
                            value={aiCustomPromoPrice}
                            onChange={(e) => setAiCustomPromoPrice(Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white font-bold text-[#0284c7]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Marketing Angle */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      2. Angle Psychologique (Meta / TikTok Ads)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ANGLES.map((angle) => {
                        const active = aiMarketingAngle === angle.id;
                        return (
                          <button
                            key={angle.id}
                            type="button"
                            onClick={() => setAiMarketingAngle(angle.id)}
                            className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                              active
                                ? 'border-[#0ea5e9] bg-sky-50/70 ring-1 ring-[#0ea5e9]'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-900">{angle.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{angle.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Theme & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Palette Visuelle Tunnel
                      </label>
                      <select
                        value={aiTheme}
                        onChange={(e) => setAiTheme(e.target.value as FunnelTheme)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white"
                      >
                        <option value="electric-blue">NAY Electric Blue &amp; Glass</option>
                        <option value="luxury-gold">Maison NAY Or &amp; Obsidienne</option>
                        <option value="beauty-rose">Éclat Cosmétique Rose</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Numéro WhatsApp COD
                      </label>
                      <input
                        type="text"
                        value={aiWhatsapp}
                        onChange={(e) => setAiWhatsapp(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Right 5 Cols: Real-Time Mobile Wireframe Preview */}
                <div className="lg:col-span-5 p-6 bg-slate-50/80 flex flex-col justify-between items-center">
                  <div className="w-full flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Smartphone size={13} className="text-[#0ea5e9]" />
                      Aperçu Mobile Live
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[#0284c7]">
                      COD Express 24h
                    </span>
                  </div>

                  {/* Smartphone Bezel */}
                  <div className="w-full max-w-[300px] rounded-[28px] border-4 border-slate-900 bg-white shadow-xl overflow-hidden text-left">
                    {/* Urgency Top Ribbon */}
                    <div
                      className={`px-3 py-1.5 text-center text-[9px] font-extrabold text-white tracking-wider uppercase ${
                        aiTheme === 'luxury-gold'
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500'
                          : aiTheme === 'beauty-rose'
                          ? 'bg-gradient-to-r from-rose-600 to-pink-500'
                          : 'bg-gradient-to-r from-[#0ea5e9] to-[#0284c7]'
                      }`}
                    >
                      {livePreview.copy.badge}
                    </div>

                    {/* Hero Visual + Copy */}
                    <div className="p-3.5 space-y-2.5">
                      <div className="h-32 w-full rounded-xl bg-slate-100 overflow-hidden relative flex items-center justify-center">
                        {livePreview.image ? (
                          <img
                            src={livePreview.image}
                            alt={livePreview.prodName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Sparkles className="text-[#0ea5e9]" size={26} />
                        )}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/80 text-white text-[10px] font-extrabold">
                          {formatMAD(livePreview.promoPrice)}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 leading-tight line-clamp-2">
                          {livePreview.copy.h1}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                          {livePreview.copy.sub}
                        </p>
                      </div>

                      {/* Bundles Wireframe */}
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-700">1x Flacon Solo</span>
                          <span className="font-extrabold text-slate-900">
                            {formatMAD(livePreview.promoPrice)}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg border-2 border-[#0ea5e9] bg-sky-50/70 flex items-center justify-between text-[10px]">
                          <div>
                            <span className="font-extrabold text-[#0284c7]">Pack Duo (2x)</span>
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-[#0ea5e9] text-white text-[8px] font-bold">
                              POPULAIRE
                            </span>
                          </div>
                          <span className="font-extrabold text-slate-900">
                            {formatMAD(livePreview.duoPrice)}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-700">Pack VIP (3x)</span>
                          <span className="font-extrabold text-slate-900">
                            {formatMAD(livePreview.trioPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Trust Bar + CTA */}
                      <div className="flex items-center justify-around py-1 text-[9px] font-semibold text-slate-500 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Truck size={10} className="text-[#0ea5e9]" /> 24h Maroc
                        </span>
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={10} className="text-emerald-600" /> COD Vérifié
                        </span>
                      </div>

                      <div className="w-full py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-center text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                        Commander Cash à la Livraison →
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-white">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Génère automatiquement le storytelling, 3 packs, avis marocains vérifiés et FAQ COD.
                </span>
                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={aiGenerating}
                    onClick={handleGenerateAiLandingPage}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-sky-500/20 disabled:opacity-60 cursor-pointer"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Génération IA en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Générer &amp; Publier en Ligne</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
