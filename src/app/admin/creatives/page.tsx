'use client';
import { upload } from '@vercel/blob/client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Video, 
  Image as ImageIcon, 
  UploadCloud, 
  Plus, 
  Search, 
  Filter, 
  Flame, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  Film, 
  Layers, 
  Eye, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  FileText,
  Volume2,
  VolumeX,
  Maximize2
} from 'lucide-react';

interface CreativeItem {
  id: string;
  title: string;
  description?: string | null;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  thumbnailUrl?: string | null;
  platform: string;
  aspectRatio: string;
  category: string;
  status: 'TESTING' | 'WINNER' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  adCopy?: string | null;
  productSlug?: string | null;
  productName?: string | null;
  creatorName: string;
  tags?: string | null;
  createdAt: string;
  creator?: {
    name: string;
    avatar?: string | null;
  } | null;
}

interface CreativeStats {
  total: number;
  winners: number;
  testing: number;
  active: number;
  videos: number;
  images: number;
}

const PLATFORMS = [
  { id: 'META', label: 'Meta (Instagram / FB)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'TIKTOK', label: 'TikTok Ads', color: 'bg-black text-white border-slate-700' },
  { id: 'SNAPCHAT', label: 'Snapchat Ads', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'GOOGLE', label: 'Google / YouTube', color: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'INFLUENCE', label: 'Influence & UGC', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

const CATEGORIES = [
  { id: 'UGC', label: 'Vidéo UGC / Créateur' },
  { id: 'UNBOXING', label: 'Unboxing & Déballage' },
  { id: 'PRODUCT_SHOT', label: 'Packshot Produit Studio' },
  { id: 'HOOK', label: 'Hook Accrocheur (3s)' },
  { id: 'TESTIMONIAL', label: 'Avis & Témoignage Client' },
  { id: 'PROMO', label: 'Offre Promo / Coffret' },
];

const STATUSES = [
  { id: 'WINNER', label: 'Winner 🔥', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'TESTING', label: 'En Test', badge: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'ACTIVE', label: 'Actif', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'PAUSED', label: 'En Pause', badge: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  { id: 'ARCHIVED', label: 'Archivé', badge: 'bg-neutral-50 text-neutral-400 border-neutral-200' },
];

export default function AdminCreativesPage() {
  const [creatives, setCreatives] = useState<CreativeItem[]>([]);
  const [stats, setStats] = useState<CreativeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterPlatform, setFilterPlatform] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMediaType, setFilterMediaType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditingCreative, setIsEditingCreative] = useState<CreativeItem | null>(null);
  const [selectedPreviewCreative, setSelectedPreviewCreative] = useState<CreativeItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formMediaType, setFormMediaType] = useState<'IMAGE' | 'VIDEO'>('VIDEO');
  const [formPlatform, setFormPlatform] = useState('META');
  const [formAspectRatio, setFormAspectRatio] = useState('9:16');
  const [formCategory, setFormCategory] = useState('UGC');
  const [formStatus, setFormStatus] = useState<CreativeItem['status']>('TESTING');
  const [formAdCopy, setFormAdCopy] = useState('');
  const [formProductName, setFormProductName] = useState('');
  const [formTags, setFormTags] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Creatives
  const loadCreatives = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPlatform !== 'ALL') params.set('platform', filterPlatform);
      if (filterCategory !== 'ALL') params.set('category', filterCategory);
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterMediaType !== 'ALL') params.set('mediaType', filterMediaType);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/creatives?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCreatives(data.creatives || []);
          setStats(data.stats || null);
        }
      }
    } catch (err) {
      console.error('Failed to load creatives:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [filterPlatform, filterCategory, filterStatus, filterMediaType, searchQuery]);

  useEffect(() => {
    loadCreatives(true);
  }, [loadCreatives]);

  // Open Create Modal
  const openCreateModal = () => {
    setIsEditingCreative(null);
    setFormTitle('');
    setFormDescription('');
    setFormMediaUrl('');
    setFormMediaType('VIDEO');
    setFormPlatform('META');
    setFormAspectRatio('9:16');
    setFormCategory('UGC');
    setFormStatus('TESTING');
    setFormAdCopy('');
    setFormProductName('');
    setFormTags('');
    setUploadError(null);
    setIsUploadModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: CreativeItem) => {
    setIsEditingCreative(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormMediaUrl(item.mediaUrl);
    setFormMediaType(item.mediaType);
    setFormPlatform(item.platform);
    setFormAspectRatio(item.aspectRatio || '9:16');
    setFormCategory(item.category);
    setFormStatus(item.status);
    setFormAdCopy(item.adCopy || '');
    setFormProductName(item.productName || '');
    setFormTags(item.tags || '');
    setUploadError(null);
    setIsUploadModalOpen(true);
  };

  // Handle File Upload to S3/Cloudinary/Local API with resilient fallback
  const handleFileUpload = async (file: File) => {
    setIsUploadingFile(true);
    setUploadProgress(0);
    setUploadError(null);

    // Sanitize filename to avoid character encoding issues
    const safeBaseName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeName = safeBaseName || `creative_${Date.now()}`;

    let uploadedUrl = '';
    let lastErrorMessage = '';

    // Strategy 1: Direct Vercel Blob client-side upload (supports up to 150MB with parallel multipart)
    try {
      const newBlob = await upload(safeName, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload-client',
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(Math.round(percentage));
        },
      });
      if (newBlob && newBlob.url) {
        uploadedUrl = newBlob.url;
      }
    } catch (clientErr: any) {
      console.warn('[Direct Blob Upload Warning]:', clientErr?.message || clientErr);
      lastErrorMessage = clientErr?.message || 'Erreur lors du téléversement direct';
    }

    // Strategy 2: Server-side FormData fallback (only for files <= 4.5MB to respect Vercel serverless limit)
    if (!uploadedUrl && file.size <= 4.5 * 1024 * 1024) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            uploadedUrl = data.url;
          } else if (data?.error) {
            lastErrorMessage = data.error;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          lastErrorMessage = errData?.error || `Erreur serveur (${res.status})`;
        }
      } catch (serverErr: any) {
        console.warn('[Server Upload Fallback Failed]:', serverErr?.message || serverErr);
        if (!lastErrorMessage) {
          lastErrorMessage = serverErr?.message || '';
        }
      }
    }

    if (uploadedUrl) {
      setFormMediaUrl(uploadedUrl);
      const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name);
      setFormMediaType(isVid ? 'VIDEO' : 'IMAGE');
      if (!formTitle) {
        setFormTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } else {
      setUploadError(lastErrorMessage || 'Échec du téléversement : vérifiez votre connexion ou réduisez la taille du fichier.');
    }

    setIsUploadingFile(false);
  };

  // Save Creative (Create or Update)
  const handleSaveCreative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setUploadError('Veuillez saisir un titre pour le créatif.');
      return;
    }

    if (!formMediaUrl.trim()) {
      setUploadError('Veuillez téléverser un fichier média (vidéo ou image).');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        mediaUrl: formMediaUrl.trim(),
        mediaType: formMediaType,
        platform: formPlatform,
        aspectRatio: formAspectRatio,
        category: formCategory,
        status: formStatus,
        adCopy: formAdCopy.trim() || null,
        productName: formProductName.trim() || null,
        tags: formTags.trim() || null,
      };

      const url = isEditingCreative ? `/api/admin/creatives/${isEditingCreative.id}` : '/api/admin/creatives';
      const method = isEditingCreative ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsUploadModalOpen(false);
        loadCreatives(false);
      } else {
        setUploadError(data.error || 'Erreur lors de l\'enregistrement.');
      }
    } catch (err) {
      setUploadError('Erreur réseau lors de la sauvegarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Creative
  const deleteCreative = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce créatif publicitaire ?')) return;

    try {
      setCreatives((prev) => prev.filter((c) => c.id !== id));
      await fetch(`/api/admin/creatives/${id}`, { method: 'DELETE' });
      loadCreatives(false);
    } catch (err) {
      console.error('Failed to delete creative:', err);
    }
  };

  // Copy Media URL to Clipboard
  const copyMediaUrl = (url: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Badge Helper
  const getStatusBadge = (status: CreativeItem['status']) => {
    const s = STATUSES.find((item) => item.id === status);
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border ${s?.badge || 'bg-neutral-100 text-neutral-700'}`}>
        {s?.label || status}
      </span>
    );
  };

  // Platform Badge Helper
  const getPlatformBadge = (platform: string) => {
    const p = PLATFORMS.find((item) => item.id === platform);
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider border ${p?.color || 'bg-neutral-100 text-neutral-700'}`}>
        {p?.label || platform}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
              Ads Vault
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Banque de Créatifs
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Film size={22} className="text-neutral-900" />
            <span>Créatifs Publicitaires (Ads Hub)</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Centralisez, téléversez et organisez vos vidéos TikTok, Reels Instagram, UGC et visuels publicitaires.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Ajouter un Créatif</span>
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Total Créatifs Pubs</span>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {stats?.total ?? '—'}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Créatifs Gagnants (Winners)</span>
          <div className="text-2xl font-bold text-amber-600 mt-1 flex items-center gap-1.5">
            <span>{stats?.winners ?? 0}</span>
            <Flame size={16} className="text-amber-500" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">En Phase de Test</span>
          <div className="text-2xl font-bold text-sky-700 mt-1">
            {stats?.testing ?? 0}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium block">Vidéos & Reels (9:16)</span>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {stats?.videos ?? 0}
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un créatif, produit..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Platform Filter */}
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
          >
            <option value="ALL">Toutes les plateformes</option>
            <option value="META">Meta (Instagram / FB)</option>
            <option value="TIKTOK">TikTok Ads</option>
            <option value="SNAPCHAT">Snapchat Ads</option>
            <option value="GOOGLE">Google / YouTube</option>
            <option value="INFLUENCE">Influence & UGC</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="WINNER">Winners 🔥</option>
            <option value="TESTING">En Test</option>
            <option value="ACTIVE">Actifs</option>
            <option value="PAUSED">En Pause</option>
            <option value="ARCHIVED">Archivés</option>
          </select>

          {/* Media Type Filter */}
          <select
            value={filterMediaType}
            onChange={(e) => setFilterMediaType(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
          >
            <option value="ALL">Tous les formats</option>
            <option value="VIDEO">Vidéos uniquement</option>
            <option value="IMAGE">Photos uniquement</option>
          </select>
        </div>
      </div>

      {/* CREATIVES GRID VIEW */}
      {isLoading ? (
        <div className="py-24 text-center text-neutral-400 bg-white rounded-xl border border-neutral-200 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Chargement de la bibliothèque de créatifs...</span>
        </div>
      ) : creatives.length === 0 ? (
        <div className="py-20 text-center text-neutral-500 bg-white rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
            <Film size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Aucun créatif publicitaire trouvé</h3>
            <p className="text-xs text-neutral-500 mt-0.5 max-w-sm">
              Téléversez vos vidéos et photos pour vos campagnes publicitaires.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Ajouter un créatif</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {creatives.map((item) => {
            const isVideo = item.mediaType === 'VIDEO';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border overflow-hidden shadow-2xs hover:border-neutral-300 transition-all flex flex-col group ${
                  item.status === 'WINNER' ? 'border-amber-300 ring-1 ring-amber-100' : 'border-neutral-200'
                }`}
              >
                {/* Media Container / Player */}
                <div 
                  onClick={() => setSelectedPreviewCreative(item)}
                  className="relative aspect-[9/14] bg-neutral-950 overflow-hidden cursor-pointer flex items-center justify-center"
                >
                  {isVideo ? (
                    <video
                      src={item.mediaUrl}
                      controls={false}
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10">
                    <div className="flex items-center gap-1">
                      {getStatusBadge(item.status)}
                      {getPlatformBadge(item.platform)}
                    </div>

                    <span className="px-1.5 py-0.2 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono font-medium text-white">
                      {item.aspectRatio || '9:16'}
                    </span>
                  </div>

                  {/* Center Play Button Overlay for Videos */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-xs text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-neutral-900 transition-all">
                        <Play size={16} className="ml-0.5 fill-white" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Info on media */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white z-10">
                    <div className="text-[10px] font-medium text-neutral-300 uppercase tracking-wider mb-0.5">
                      {CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                    </div>
                    <h4 className="font-semibold text-xs leading-snug line-clamp-2 text-white">
                      {item.title}
                    </h4>
                  </div>
                </div>

                {/* Card Body & Details */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between text-xs">
                  {/* Product & Copy */}
                  <div className="space-y-1.5">
                    {item.productName && (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-800 truncate">
                        <Sparkles size={11} className="shrink-0 text-amber-600" />
                        <span>{item.productName}</span>
                      </div>
                    )}

                    {item.adCopy && (
                      <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-100 text-neutral-600 text-[11px] line-clamp-2 italic leading-relaxed">
                        &quot;{item.adCopy}&quot;
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-neutral-400">
                    <span className="text-[10px] text-neutral-400">
                      Par {item.creatorName}
                    </span>

                    <div className="flex items-center gap-0.5">
                      {/* Copy Media URL */}
                      <button
                        onClick={(e) => copyMediaUrl(item.mediaUrl, item.id, e)}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          copiedId === item.id
                            ? 'bg-emerald-50 text-emerald-600 font-bold'
                            : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                        }`}
                        title="Copier le lien direct du média"
                      >
                        {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>

                      {/* Download */}
                      <a
                        href={item.mediaUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-md transition-colors cursor-pointer"
                        title="Télécharger le fichier original"
                      >
                        <Download size={13} />
                      </a>

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-md transition-colors cursor-pointer"
                        title="Modifier le créatif"
                      >
                        <Edit3 size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => deleteCreative(item.id, e)}
                        className="p-1 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD & EDIT CREATIVE MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-neutral-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  <UploadCloud size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">
                    {isEditingCreative ? 'Modifier le créatif publicitaire' : 'Téléverser un nouveau créatif'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Importez vos vidéos TikTok, Reels, UGC et visuels publicitaires.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCreative} className="space-y-4 text-xs">
              {/* MEDIA UPLOAD DROPZONE */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Fichier Vidéo ou Image *
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/*,image/png,image/jpeg,image/webp,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = '';
                  }}
                />

                {formMediaUrl ? (
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-12 h-16 rounded-md bg-neutral-900 overflow-hidden shrink-0 flex items-center justify-center">
                        {formMediaType === 'VIDEO' ? (
                          <video src={formMediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={formMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] mb-0.5 border border-emerald-200">
                          <CheckCircle2 size={10} />
                          Fichier prêt ({formMediaType})
                        </span>
                        <p className="text-neutral-600 text-xs font-medium truncate max-w-xs">
                          {formMediaUrl}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
                    >
                      Remplacer
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingFile && fileInputRef.current?.click()}
                    className="p-6 rounded-xl border border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    {isUploadingFile ? (
                      <div className="flex flex-col items-center gap-2 py-3 w-full max-w-xs mx-auto">
                        <Loader2 size={24} className="animate-spin text-neutral-900" />
                        <span className="text-xs font-medium text-neutral-700">
                          Téléversement du média en cours... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
                        </span>
                        {uploadProgress > 0 && (
                          <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-neutral-900 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center mb-2">
                          <UploadCloud size={20} />
                        </div>
                        <h4 className="text-xs font-semibold text-neutral-900">
                          Cliquez pour téléverser votre vidéo ou photo
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5 max-w-sm">
                          Vidéos MP4, MOV ou Images PNG, JPG jusqu&apos;à 150 Mo.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Title & Product Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Titre du Créatif *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Reel Hook Testeur Baccarat Rouge 540"
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Produit Associé (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formProductName}
                    onChange={(e) => setFormProductName(e.target.value)}
                    placeholder="Ex: Baccarat Rouge 540..."
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Platform, Category & Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Plateforme Cible
                  </label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
                  >
                    <option value="META">Meta (Instagram / FB)</option>
                    <option value="TIKTOK">TikTok Ads</option>
                    <option value="SNAPCHAT">Snapchat Ads</option>
                    <option value="GOOGLE">Google / YouTube</option>
                    <option value="INFLUENCE">Influence & UGC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Type de Créatif
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Statut de Performance
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
                  >
                    <option value="TESTING">En Test</option>
                    <option value="WINNER">Winner 🔥</option>
                    <option value="ACTIVE">Actif</option>
                    <option value="PAUSED">En Pause</option>
                    <option value="ARCHIVED">Archivé</option>
                  </select>
                </div>
              </div>

              {/* Ad Copy / Hook / Caption Script */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Texte Publicitaire, Hook & Script (Ad Copy)
                </label>
                <textarea
                  rows={3}
                  value={formAdCopy}
                  onChange={(e) => setFormAdCopy(e.target.value)}
                  placeholder="Accroche (Hook 3s), texte principal, offre promo..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingFile}
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Enregistrement...' : isEditingCreative ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL / VIDEO PLAYER */}
      {selectedPreviewCreative && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] border border-neutral-200">
            {/* Media side */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[350px]">
              {selectedPreviewCreative.mediaType === 'VIDEO' ? (
                <video
                  src={selectedPreviewCreative.mediaUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[80vh] w-full object-contain"
                />
              ) : (
                <img
                  src={selectedPreviewCreative.mediaUrl}
                  alt={selectedPreviewCreative.title}
                  className="max-h-[80vh] w-full object-contain"
                />
              )}
            </div>

            {/* Meta side */}
            <div className="w-full md:w-80 p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-neutral-200 bg-white">
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  {getStatusBadge(selectedPreviewCreative.status)}
                  <button
                    onClick={() => setSelectedPreviewCreative(null)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-neutral-900 leading-snug">
                    {selectedPreviewCreative.title}
                  </h3>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Ajouté par {selectedPreviewCreative.creatorName}
                  </p>
                </div>

                <div className="space-y-1.5 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Plateforme:</span>
                    <span className="font-medium text-neutral-800">{selectedPreviewCreative.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Type:</span>
                    <span className="font-medium text-neutral-700">{selectedPreviewCreative.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Format:</span>
                    <span className="font-mono text-neutral-700">{selectedPreviewCreative.aspectRatio}</span>
                  </div>
                  {selectedPreviewCreative.productName && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Produit:</span>
                      <span className="font-medium text-neutral-900 truncate max-w-[130px]">{selectedPreviewCreative.productName}</span>
                    </div>
                  )}
                </div>

                {selectedPreviewCreative.adCopy && (
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-semibold mb-1">Texte / Hook</span>
                    <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 text-neutral-700 text-xs whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                      {selectedPreviewCreative.adCopy}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
                <button
                  onClick={() => copyMediaUrl(selectedPreviewCreative.mediaUrl, selectedPreviewCreative.id)}
                  className="w-full py-2 bg-neutral-900 hover:bg-black text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  <span>{copiedId === selectedPreviewCreative.id ? 'Lien copié !' : 'Copier le lien direct'}</span>
                </button>

                <a
                  href={selectedPreviewCreative.mediaUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>Télécharger</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
