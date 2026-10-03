'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Save, Trash2, ArrowLeft, Image as ImageIcon, Sparkles, Wand2, Eye,
  CheckCircle2, AlertCircle, Search, ExternalLink, Globe, Tag,
  Smartphone, Monitor, RefreshCw, Zap, BookOpen, ShoppingBag, X,
  Clock, BarChart2, Check, Plus, Sliders, ChevronDown, Layers, FileText,
  HelpCircle, ArrowRight
} from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// Curated Moroccan Luxury Perfume Cover Presets
const PRESET_COVERS = [
  {
    title: 'Flacon Or & Sillage Précieux',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80',
    category: 'Luxe & Soirée'
  },
  {
    title: 'Oud Boisé & Ambre Sombre',
    url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1200&q=80',
    category: 'Oriental & Oud'
  },
  {
    title: 'Brume & Élégance Moderne',
    url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1200&q=80',
    category: 'Guide Sillage'
  },
  {
    title: 'Bois Précieux & Écorce Cèdre',
    url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=1200&q=80',
    category: 'Boisé & Notes'
  },
  {
    title: 'Bouquet Floral & Rose de Dadès',
    url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=80',
    category: 'Floral & Féminin'
  },
  {
    title: 'Fraîcheur Marine & Agrumes',
    url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=1200&q=80',
    category: 'Été & Frais'
  },
  {
    title: 'Pack Découverte NAY Parfums',
    url: '/images/category/pack-decouverte-luxe.jpg',
    category: 'Coffrets & Packs'
  }
];

// 1-Click Editorial Template Prompts & Structures
const EDITORIAL_TEMPLATES = [
  {
    id: 'top5-men',
    title: 'Top 5 Parfums Homme Longue Tenue au Maroc',
    category: 'Guides',
    focusKeyword: 'parfum homme longue tenue maroc',
    topic: 'Top 5 des Parfums Homme avec la meilleure tenue et sillage au Maroc',
    description: 'Guide d\'achat comparatif des 5 fragrances masculines les plus performantes sous le climat marocain.'
  },
  {
    id: 'testers-guide',
    title: 'Guide Testeurs 100ml Authentiques : Qualité & Économies',
    category: 'Conseils',
    focusKeyword: 'testeur parfum original maroc',
    topic: 'Tout ce qu\'il faut savoir sur les testeurs de parfums authentiques 100ml au Maroc',
    description: 'Article pédagogique expliquant la différence entre flacon retail et testeur original certifié.'
  },
  {
    id: 'oud-oriental',
    title: 'L\'Art de l\'Oud & des Sillages Orientaux au Maroc',
    category: 'Tendances',
    focusKeyword: 'parfum oud oriental maroc',
    topic: 'Les secrets des parfums orientaux, ambre noble et oud pour les grandes occasions',
    description: 'Plongée dans la culture olfactive orientale et les accords boisés irrésistibles.'
  },
  {
    id: 'women-wedding',
    title: 'Les Meilleurs Parfums Féminins pour Mariages & Cérémonies',
    category: 'Guides',
    focusKeyword: 'parfum femme mariage maroc',
    topic: 'Quels parfums féminins porter pour un mariage ou une cérémonie au Maroc',
    description: 'Sélection raffinée de sillages floraux, sucrés et gourmands à fort sillage.'
  },
  {
    id: 'summer-fresh',
    title: 'Parfums Frais d\'Été : Tenue et Légèreté sous la Chaleur',
    category: 'Conseils',
    focusKeyword: 'parfum ete frais maroc',
    topic: 'Les meilleures fragrances hespéridées et aquatiques pour l\'été marocain',
    description: 'Conseils pratiques et sélection de notes marines et d\'agrumes résistantes à la chaleur.'
  }
];

export default function BlogForm({
  initialData,
  dbProducts = []
}: {
  initialData?: any;
  dbProducts?: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // AI Generator Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategory, setAiCategory] = useState('Guides');
  const [aiTone, setAiTone] = useState('Luxe & Raffiné');
  const [aiKeyword, setAiKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // Catalog Gallery Modal State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // SERP Preview Device Toggle
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Active Tab for Editor Studio
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'marketing'>('content');

  // Focus Keyword for live SEO scoring
  const [focusKeyword, setFocusKeyword] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    slug: initialData?.slug || '',
    title: initialData?.title || '',
    excerpt: initialData?.excerpt || '',
    content: initialData?.content || '',
    coverImage: initialData?.coverImage || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80',
    author: initialData?.author || 'NAY Parfums',
    status: initialData?.status || 'draft',
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    category: initialData?.category || 'Guides',
    tags: initialData?.tags ? (typeof initialData.tags === 'string' && initialData.tags.startsWith('[') ? JSON.parse(initialData.tags).join(', ') : initialData.tags) : 'parfum maroc, luxe, longue tenue',
    ctaText: initialData?.ctaText || 'Découvrir nos parfums de luxe',
    ctaLink: initialData?.ctaLink || '/shop',
    relatedProductSlugs: initialData?.relatedProductSlugs ? (typeof initialData.relatedProductSlugs === 'string' && initialData.relatedProductSlugs.startsWith('[') ? JSON.parse(initialData.relatedProductSlugs) : []) : []
  });

  // Product Search inside sidebar
  const [productSearch, setProductSearch] = useState('');

  // Helper to extract clean text from HTML content for word count & keyword density
  const plainTextContent = useMemo(() => {
    if (!formData.content) return '';
    return formData.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }, [formData.content]);

  // Word count and reading time
  const wordCount = useMemo(() => {
    if (!plainTextContent) return 0;
    return plainTextContent.split(/\s+/).filter((w: string) => w.length > 0).length;
  }, [plainTextContent]);

  const readingTimeMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  // Dynamic SEO Audit & Scoring (0 - 100)
  const seoAudit = useMemo(() => {
    let score = 0;
    const checks: { label: string; passed: boolean; tip: string; points: number }[] = [];

    // 1. Title Length
    const titleLen = formData.title.trim().length;
    const hasGoodTitle = titleLen >= 30 && titleLen <= 70;
    checks.push({
      label: 'Titre de l\'article optimisé (30-70 car.)',
      passed: hasGoodTitle,
      tip: titleLen === 0 ? 'Ajoutez un titre accrocheur' : titleLen < 30 ? 'Titre un peu court pour Google' : titleLen > 70 ? 'Titre trop long (>70 car.)' : 'Longueur de titre idéale',
      points: 15
    });
    if (hasGoodTitle) score += 15;
    else if (titleLen > 15) score += 8;

    // 2. Word Count Check
    const hasEnoughWords = wordCount >= 350;
    checks.push({
      label: 'Richesse du contenu (min. 350 mots)',
      passed: hasEnoughWords,
      tip: wordCount === 0 ? 'Rédigez le contenu de l\'article' : wordCount < 350 ? `Actuellement ${wordCount} mots (recommandé: 350-1000 mots)` : `${wordCount} mots — Excellent pour le référencement`,
      points: 20
    });
    if (wordCount >= 600) score += 20;
    else if (wordCount >= 350) score += 15;
    else if (wordCount >= 150) score += 8;

    // 3. Headings Structure (H2 / H3)
    const hasH2 = /<h2/i.test(formData.content);
    const hasH3 = /<h3/i.test(formData.content);
    const hasGoodHeadings = hasH2;
    checks.push({
      label: 'Structure en sous-titres (Balises H2 / H3)',
      passed: hasGoodHeadings,
      tip: hasH2 ? (hasH3 ? 'Structure hiérarchique H2 et H3 parfaite' : 'Balises H2 présentes (vous pouvez ajouter des H3)') : 'Ajoutez des sous-titres H2 pour aérer la lecture',
      points: 15
    });
    if (hasH2 && hasH3) score += 15;
    else if (hasH2) score += 10;

    // 4. Meta Description Length
    const metaDesc = formData.metaDescription || formData.excerpt;
    const metaLen = metaDesc.trim().length;
    const hasGoodMeta = metaLen >= 110 && metaLen <= 165;
    checks.push({
      label: 'Méta Description Google (110-165 car.)',
      passed: hasGoodMeta,
      tip: metaLen === 0 ? 'Renseignez un extrait ou une méta description' : metaLen < 110 ? `Court (${metaLen} car.) — Visez 120-155 car.` : metaLen > 165 ? `Trop long (${metaLen} car.) — Risque d'être tronqué par Google` : 'Longueur méta description idéale',
      points: 15
    });
    if (hasGoodMeta) score += 15;
    else if (metaLen > 50) score += 8;

    // 5. Focus Keyword Check (if provided)
    const kw = focusKeyword.trim().toLowerCase();
    if (kw.length > 2) {
      const inTitle = formData.title.toLowerCase().includes(kw);
      const inContent = plainTextContent.toLowerCase().includes(kw);
      const inMeta = (formData.metaDescription || formData.excerpt).toLowerCase().includes(kw);
      
      const kwOccurrences = (plainTextContent.toLowerCase().match(new RegExp(kw, 'g')) || []).length;
      const density = wordCount > 0 ? ((kwOccurrences * kw.split(' ').length) / wordCount) * 100 : 0;

      const kwPassed = inTitle && inContent;
      checks.push({
        label: `Mot-clé "${kw}" placé stratégiquement`,
        passed: kwPassed,
        tip: !inTitle ? 'Insérez le mot-clé dans le titre' : !inContent ? 'Mentionnez le mot-clé dans le corps du texte' : `Densité: ${density.toFixed(1)}% (${kwOccurrences} fois) — ${inMeta ? 'Présent dans les métas' : 'Pensez à l\'ajouter dans la méta description'}`,
        points: 15
      });
      if (inTitle && inContent && inMeta) score += 15;
      else if (inTitle || inContent) score += 8;
    } else {
      // Automatic keyword detection
      checks.push({
        label: 'Mot-clé cible défini',
        passed: false,
        tip: 'Entrez un mot-clé principal ci-dessous pour analyser sa densité',
        points: 15
      });
    }

    // 6. Cover Image & Media
    const hasCover = Boolean(formData.coverImage && formData.coverImage.length > 5);
    checks.push({
      label: 'Image de couverture haute résolution',
      passed: hasCover,
      tip: hasCover ? 'Image de couverture configurée' : 'Sélectionnez une image de couverture pour le partage social',
      points: 10
    });
    if (hasCover) score += 10;

    // 7. Products Mentioned & CTA (Commercial Intent)
    const hasProducts = formData.relatedProductSlugs.length > 0;
    const hasCta = Boolean(formData.ctaText && formData.ctaLink);
    checks.push({
      label: 'Liaison Catalogue & Bouton d\'Action (CTA)',
      passed: hasProducts || hasCta,
      tip: hasProducts ? `${formData.relatedProductSlugs.length} parfum(s) lié(s) pour la conversion` : 'Liez au moins 1 parfum de votre catalogue pour booster vos ventes',
      points: 10
    });
    if (hasProducts && hasCta) score += 10;
    else if (hasProducts || hasCta) score += 5;

    // Normalize score to 100
    const finalScore = Math.min(100, Math.max(0, score));

    return {
      score: finalScore,
      grade: finalScore >= 85 ? 'A+' : finalScore >= 70 ? 'A' : finalScore >= 50 ? 'B' : finalScore >= 30 ? 'C' : 'D',
      color: finalScore >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : finalScore >= 60 ? 'text-sky-600 bg-sky-50 border-sky-200' : finalScore >= 40 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200',
      checks
    };
  }, [formData, wordCount, plainTextContent, focusKeyword]);

  // Auto-generate slug when title changes (if user hasn't typed a custom slug)
  const handleTitleChange = (newTitle: string) => {
    setFormData(prev => {
      const isAutoSlug = !initialData && (!prev.slug || prev.slug === generateSlug(prev.title));
      return {
        ...prev,
        title: newTitle,
        slug: isAutoSlug ? generateSlug(newTitle) : prev.slug
      };
    });
  };

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  // Handle Form Submit
  const handleSubmit = async (e?: React.FormEvent, customStatus?: 'draft' | 'published') => {
    if (e) e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    const statusToSave = customStatus || formData.status;

    const url = initialData?.id 
      ? `/api/admin/blog/${initialData.id}` 
      : '/api/admin/blog';
      
    const method = initialData?.id ? 'PUT' : 'POST';

    // Parse tags into JSON array
    const tagsArray = formData.tags
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    const dataToSend = {
      ...formData,
      status: statusToSave,
      tags: JSON.stringify(tagsArray),
      relatedProductSlugs: JSON.stringify(formData.relatedProductSlugs)
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setFormData(prev => ({ ...prev, status: statusToSave }));
        setTimeout(() => {
          router.push('/admin/blog');
          router.refresh();
        }, 800);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Erreur lors de l'enregistrement de l'article");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm('Voulez-vous vraiment supprimer cet article de blog ?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${initialData.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/blog');
        router.refresh();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Toggle product selection
  const toggleProduct = (slug: string) => {
    setFormData(prev => {
      const current = prev.relatedProductSlugs;
      if (current.includes(slug)) {
        return { ...prev, relatedProductSlugs: current.filter((s: string) => s !== slug) };
      } else {
        return { ...prev, relatedProductSlugs: [...current, slug] };
      }
    });
  };

  // AI Generator Trigger
  const handleGenerateWithAi = async () => {
    if (!aiTopic.trim()) {
      setAiError('Veuillez entrer un sujet ou sélectionner un modèle.');
      return;
    }

    setIsGenerating(true);
    setAiError('');

    try {
      const res = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          category: aiCategory,
          tone: aiTone,
          focusKeyword: aiKeyword || aiTopic
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la génération');
      }

      const generated = json.data;

      setFormData(prev => ({
        ...prev,
        title: generated.title || prev.title,
        slug: generated.slug || prev.slug,
        excerpt: generated.excerpt || prev.excerpt,
        content: generated.content || prev.content,
        metaTitle: generated.metaTitle || prev.metaTitle,
        metaDescription: generated.metaDescription || prev.metaDescription,
        category: generated.category || prev.category,
        tags: Array.isArray(generated.tags) ? generated.tags.join(', ') : prev.tags,
        ctaText: generated.ctaText || prev.ctaText,
        ctaLink: generated.ctaLink || prev.ctaLink,
        relatedProductSlugs: generated.matchedProductSlugs?.length > 0 ? generated.matchedProductSlugs : prev.relatedProductSlugs
      }));

      if (aiKeyword) {
        setFocusKeyword(aiKeyword);
      }

      setIsAiModalOpen(false);
    } catch (err: any) {
      setAiError(err.message || 'Impossible de générer l\'article.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply template
  const applyTemplate = (tpl: typeof EDITORIAL_TEMPLATES[0]) => {
    setAiTopic(tpl.topic);
    setAiCategory(tpl.category);
    setAiKeyword(tpl.focusKeyword);
  };

  // Filter products for sidebar search
  const filteredProducts = useMemo(() => {
    if (!productSearch) return dbProducts;
    const q = productSearch.toLowerCase();
    return dbProducts.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.brandLabel?.toLowerCase().includes(q) || 
      p.slug?.toLowerCase().includes(q)
    );
  }, [dbProducts, productSearch]);

  // Filter products for catalog image picker modal
  const catalogModalProducts = useMemo(() => {
    if (!catalogSearch) return dbProducts;
    const q = catalogSearch.toLowerCase();
    return dbProducts.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.brandLabel?.toLowerCase().includes(q)
    );
  }, [dbProducts, catalogSearch]);

  // Google SERP Title & Description Preview Values
  const googleTitle = formData.metaTitle || formData.title || 'Titre de l\'article — NAY Parfums Maroc';
  const googleDesc = formData.metaDescription || formData.excerpt || 'Découvrez notre guide exclusif sur la haute parfumerie au Maroc. Conseils, sillages et livraison rapide 24h/48h.';

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* TOP COMMAND BAR */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3.5 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700/60 shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {initialData?.id ? "Modifier l'article" : 'Studio de Rédaction & SEO Blog'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                formData.status === 'published' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {formData.status === 'published' ? '● En Ligne' : '○ Brouillon'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {wordCount} mots · ~{readingTimeMinutes} min de lecture · Score SEO: {seoAudit.score}/100
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* AI Generator Trigger */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles size={15} className="animate-pulse text-amber-300" />
            <span>Générer avec l'IA</span>
          </button>

          {/* Live Preview Button */}
          {formData.slug && (
            <a
              href={`/fr/blog/${formData.slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 flex items-center gap-1.5 transition-colors"
            >
              <Eye size={14} className="text-sky-400" />
              <span>Aperçu</span>
            </a>
          )}

          {/* Delete (if existing) */}
          {initialData?.id && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Supprimer l'article"
            >
              <Trash2 size={17} />
            </button>
          )}

          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSubmit(undefined, 'draft')}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all disabled:opacity-50"
          >
            Enregistrer Brouillon
          </button>

          {/* Publish Main Button */}
          <button
            type="button"
            onClick={() => handleSubmit(undefined, 'published')}
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : saveSuccess ? (
              <Check size={15} />
            ) : (
              <Save size={15} />
            )}
            <span>{saveSuccess ? 'Enregistré !' : formData.status === 'published' ? 'Mettre à jour' : 'Publier en Direct'}</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* LEFT / CENTER COLUMN: MAIN CONTENT & EDITORIAL STUDIO (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* NAVIGATION TABS */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'content'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText size={15} />
              <span>Rédaction & Contenu</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'seo'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Globe size={15} />
              <span>Optimisation SEO & SERP</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${seoAudit.color}`}>
                {seoAudit.score}/100
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('marketing')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'marketing'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag size={15} />
              <span>Conversion & Produits ({formData.relatedProductSlugs.length})</span>
            </button>
          </div>

          {/* TAB 1: CONTENT & WRITING */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Main Article Header Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Titre de l'Article
                    </label>
                    <span className={`text-[11px] font-semibold ${
                      formData.title.length >= 30 && formData.title.length <= 70 ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {formData.title.length} / 70 car.
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Ex: Top 5 des Parfums Homme Longue Tenue au Maroc (Guide 2025)"
                    className="w-full text-lg sm:text-xl font-bold text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Extrait / Chapeau (Accroche Visuelle)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {formData.excerpt.length} car.
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.excerpt}
                    onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Un résumé séduisant qui donne envie aux visiteurs de lire l'article complet..."
                    className="w-full text-sm text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Rich WYSIWYG Editor */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Corps de l'Article (Éditeur Riche)
                    </label>
                    <p className="text-xs text-slate-500">
                      Utilisez des titres H2/H3 et des listes à puces pour structurer votre contenu.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={13} />
                      IA Assist
                    </button>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={val => setFormData({ ...formData, content: val })}
                    className="min-h-[420px] bg-white text-slate-900"
                    modules={{
                      toolbar: [
                        [{ header: [2, 3, 4, false] }],
                        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image', 'clean']
                      ]
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 px-1">
                  <span>{wordCount} mots</span>
                  <span>~{readingTimeMinutes} min de temps de lecture</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEO OPTIMIZATION & SERP SIMULATOR */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {/* Google.ma SERP Preview Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Globe size={16} className="text-sky-500" />
                      Simulateur Google.ma (Résultat de Recherche)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Aperçu fidèle de la façon dont votre article apparaît sur Google Maroc.
                    </p>
                  </div>
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSerpDevice('desktop')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        serpDevice === 'desktop' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Monitor size={14} /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerpDevice('mobile')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        serpDevice === 'mobile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone size={14} /> Mobile
                    </button>
                  </div>
                </div>

                {/* Google Snippet Visual Component */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  serpDevice === 'mobile' 
                    ? 'max-w-md mx-auto bg-white shadow-md border-slate-200' 
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-sm">
                      N
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-slate-800 leading-none">NAY Parfums Maroc</span>
                      <span className="text-[11px] text-slate-500 leading-normal">https://nayparfum.ma › fr › blog › {formData.slug || 'slug'}</span>
                    </div>
                  </div>

                  <h4 className="text-[18px] text-[#1a0dab] font-medium hover:underline cursor-pointer leading-snug line-clamp-2 mt-1">
                    {googleTitle}
                  </h4>

                  <p className="text-[13px] text-[#4d5156] line-clamp-2 mt-1 leading-relaxed">
                    {googleDesc}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-3 text-[11px] text-slate-500">
                    <span>Auteur: {formData.author || 'NAY Parfums'}</span>
                    <span>·</span>
                    <span>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* SEO Meta Fields */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-slate-900">Balises Méta Personnalisées</h3>
                
                {/* Meta Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Méta Titre (Google Title Tag)
                    </label>
                    <span className={`text-xs font-semibold ${
                      (formData.metaTitle || formData.title).length >= 45 && (formData.metaTitle || formData.title).length <= 60 
                        ? 'text-emerald-600' 
                        : 'text-amber-600'
                    }`}>
                      {(formData.metaTitle || formData.title).length} / 60 car.
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={e => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="Laissez vide pour utiliser le titre de l'article"
                    className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Recommandé : 45 à 60 caractères pour ne pas être tronqué dans les résultats Google.
                  </p>
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Méta Description
                    </label>
                    <span className={`text-xs font-semibold ${
                      (formData.metaDescription || formData.excerpt).length >= 120 && (formData.metaDescription || formData.excerpt).length <= 160 
                        ? 'text-emerald-600' 
                        : 'text-amber-600'
                    }`}>
                      {(formData.metaDescription || formData.excerpt).length} / 160 car.
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.metaDescription}
                    onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="Laissez vide pour utiliser l'extrait de l'article"
                    className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Recommandé : 120 à 155 caractères avec un appel à l'action clair.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MARKETING, CALL TO ACTION & PRODUCTS */}
          {activeTab === 'marketing' && (
            <div className="space-y-6">
              {/* Call To Action Banner Builder */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Bouton d'Appel à l'Action (CTA)</h3>
                    <p className="text-xs text-slate-500">
                      Encadré attractif placé à la fin de l'article pour convertir les lecteurs en acheteurs.
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                      Texte du Bouton
                    </label>
                    <input
                      type="text"
                      value={formData.ctaText}
                      onChange={e => setFormData({ ...formData, ctaText: e.target.value })}
                      placeholder="ex: Découvrir nos Parfums Homme"
                      className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                      Lien de Destination (URL)
                    </label>
                    <input
                      type="text"
                      value={formData.ctaLink}
                      onChange={e => setFormData({ ...formData, ctaLink: e.target.value })}
                      placeholder="ex: /shop/men ou /shop"
                      className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Quick Link Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs text-slate-500">Raccourcis :</span>
                  {[
                    { label: 'Boutique Complète', url: '/shop' },
                    { label: 'Parfums Homme', url: '/shop/men' },
                    { label: 'Parfums Femme', url: '/shop/women' },
                    { label: 'Coffrets Cadeaux', url: '/shop/category/coffrets' }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, ctaLink: p.url, ctaText: formData.ctaText || `Découvrir ${p.label}` })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Live CTA Preview */}
                <div className="mt-4 p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/20 text-center">
                  <h4 className="text-base font-bold text-slate-900 mb-1">
                    Prêt à trouver votre signature olfactive ?
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mb-4">
                    Explorez notre collection exclusive et profitez de la livraison express partout au Maroc.
                  </p>
                  <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20">
                    {formData.ctaText || 'Découvrir la Collection'} <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SEO QUALITY GAUGE, SETTINGS & CATALOG LINKER (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* REAL-TIME SEO AUDIT & QUALITY SCORE GAUGE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Score de Qualité SEO</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${seoAudit.color}`}>
                Grade {seoAudit.grade} · {seoAudit.score}/100
              </span>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full transition-all duration-500 ${
                  seoAudit.score >= 80 ? 'bg-emerald-500' : seoAudit.score >= 60 ? 'bg-sky-500' : seoAudit.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${seoAudit.score}%` }}
              />
            </div>

            {/* Focus Keyword Input for Live Tracking */}
            <div className="mb-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Mot-clé Principal Cible (Google.ma)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={focusKeyword}
                  onChange={e => setFocusKeyword(e.target.value)}
                  placeholder="ex: parfum homme maroc"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
                {focusKeyword && (
                  <button
                    type="button"
                    onClick={() => setFocusKeyword('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Checklist of SEO items */}
            <div className="space-y-2.5 border-t border-slate-100 pt-3">
              {seoAudit.checks.map((c, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  {c.passed ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className={`font-semibold ${c.passed ? 'text-slate-800' : 'text-slate-700'}`}>
                      {c.label}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-snug">{c.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ARTICLE METADATA & PUBLISHING SETTINGS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders size={16} className="text-sky-600" />
              Paramètres de Publication
            </h3>

            {/* URL Slug */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 block">
                URL de l'Article (Slug)
              </label>
              <div className="flex items-center text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
                <span className="text-slate-400">/blog/</span>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  placeholder="top-5-parfums"
                  className="w-full bg-transparent text-slate-900 font-medium focus:outline-none ml-1"
                />
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 block">
                Catégorie Éditoriale
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="Guides">Guides d'Achat</option>
                <option value="Conseils">Conseils & Astuces Sillage</option>
                <option value="Tendances">Tendances & Nouveautés</option>
                <option value="Général">Général & Découvertes</option>
                <option value="Coffrets">Coffrets & Idées Cadeaux</option>
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 block">
                Auteur Référent
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={e => setFormData({ ...formData, author: e.target.value })}
                placeholder="NAY Parfums"
                className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 block">
                Mots-clés & Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="parfum maroc, oud, longue tenue"
                className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">Séparés par des virgules</p>
            </div>
          </div>

          {/* COVER IMAGE STUDIO */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon size={16} className="text-sky-600" />
                Image de Couverture
              </h3>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(true)}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                + Depuis Catalogue
              </button>
            </div>

            {/* Image Preview */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
              {formData.coverImage ? (
                <img
                  src={formData.coverImage}
                  alt="Aperçu couverture"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon size={32} className="mb-2" />
                  <span className="text-xs">Aucune image sélectionnée</span>
                </div>
              )}
            </div>

            {/* Cover URL Input */}
            <input
              type="text"
              value={formData.coverImage}
              onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />

            {/* Quick Luxury Presets */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Sélections Prédéfinies Haute Qualité :
              </p>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COVERS.slice(0, 4).map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: p.url })}
                    className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                      formData.coverImage === p.url ? 'ring-2 ring-sky-500 border-transparent' : 'border-slate-200 hover:opacity-80'
                    }`}
                    title={p.title}
                  >
                    <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PARFUMS MENTIONNÉS (PRODUCT LINKER) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-sky-600" />
                  Parfums Mentionnés ({formData.relatedProductSlugs.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Affichés à la fin de l'article pour inciter à l'achat direct.
                </p>
              </div>
            </div>

            {/* Search filter for products */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Chercher un parfum..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            {/* Product Selector Scroll List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              {filteredProducts.map(p => {
                const isSelected = formData.relatedProductSlugs.includes(p.slug);
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => toggleProduct(p.slug)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-sky-500/40 bg-sky-500/5 text-slate-900'
                        : 'border-slate-100 hover:border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider truncate">
                        {p.brandLabel || p.brandId || 'NAY'}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isSelected ? '✓' : '+'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI GENERATOR MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Sparkles size={20} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Générateur d'Article IA (Gemini Maroc)</h3>
                  <p className="text-xs text-slate-500">Créez un article hautement optimisé pour Google.ma en 1 clic</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* 1-Click Editorial Presets */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                1-Clic : Thématiques Populaires au Maroc
              </label>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {EDITORIAL_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={`text-left p-3 rounded-2xl border text-xs transition-all ${
                      aiTopic === tpl.topic 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20' 
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{tpl.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Sujet ou Titre de l'Article
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="Ex: Les 5 Meilleurs Parfums Boisés & Cuir pour Homme au Maroc"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Mot-clé SEO Principal (Google.ma)
                  </label>
                  <input
                    type="text"
                    value={aiKeyword}
                    onChange={e => setAiKeyword(e.target.value)}
                    placeholder="Ex: parfum homme longue tenue maroc"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Ton Rédactionnel
                  </label>
                  <select
                    value={aiTone}
                    onChange={e => setAiTone(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="Luxe & Raffiné">Luxe & Raffiné</option>
                    <option value="Guide Expert & Comparatif">Guide Expert & Comparatif</option>
                    <option value="Storytelling & Émotion">Storytelling & Émotion</option>
                    <option value="Direct & Vente Commerciale">Direct & Vente Commerciale</option>
                  </select>
                </div>
              </div>

              {aiError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{aiError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateWithAi}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Rédaction en cours par l'IA...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    <span>Générer l'Article Complet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATALOG IMAGE PICKER MODAL */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Choisir une Photo du Catalogue</h3>
                <p className="text-xs text-slate-500">Sélectionnez la photo d'un parfum parmi vos {dbProducts.length} produits</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="Filtrer par nom de parfum ou marque..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Product Images Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
              {catalogModalProducts.map((p, idx) => {
                let imgUrl = '';
                if (p.images) {
                  if (Array.isArray(p.images)) imgUrl = p.images[0];
                  else if (typeof p.images === 'string' && p.images.startsWith('[')) {
                    try { imgUrl = JSON.parse(p.images)[0]; } catch {}
                  } else if (typeof p.images === 'string') {
                    imgUrl = p.images;
                  }
                }
                if (!imgUrl) return null;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, coverImage: imgUrl });
                      setIsCatalogModalOpen(false);
                    }}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 hover:border-sky-500 hover:shadow-lg transition-all p-2 bg-slate-50 flex flex-col items-center justify-between"
                  >
                    <div className="relative w-full h-24 rounded-lg overflow-hidden">
                      <img src={imgUrl} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="text-[11px] font-bold text-slate-800 text-center truncate w-full mt-1">
                      {p.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
