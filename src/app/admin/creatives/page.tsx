'use client';
import { upload } from '@vercel/blob/client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  UploadCloud,
  Plus,
  Search,
  Flame,
  Play,
  Copy,
  Check,
  Download,
  Trash2,
  Edit3,
  Sparkles,
  Film,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wand2,
  Clapperboard,
  Layers,
  Award,
} from 'lucide-react';
import { PRODUCTS } from '@/lib/products';

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

interface GeneratedCreativePack {
  title: string;
  hooks: string[];
  storyboard: Array<{ time: string; scene: string; action: string }>;
  poster: {
    topBadge: string;
    headline: string;
    subline: string;
    priceText: string;
    comparePriceText: string;
    ctaText: string;
  };
  adCopy: string;
  tags: string;
}

type PosterTheme = 'electric' | 'obsidian' | 'pearl';

const PLATFORMS = [
  { id: 'META', label: 'Meta (IG / FB)', color: 'bg-sky-50 text-[#0284c7] border-sky-200' },
  { id: 'TIKTOK', label: 'TikTok Ads', color: 'bg-slate-900 text-white border-slate-700' },
  { id: 'SNAPCHAT', label: 'Snapchat Ads', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'GOOGLE', label: 'Google / YouTube', color: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'INFLUENCE', label: 'Influence & UGC', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

const CATEGORIES = [
  { id: 'UGC', label: 'Vidéo UGC / Créateur' },
  { id: 'UNBOXING', label: 'Unboxing & Déballage' },
  { id: 'PRODUCT_SHOT', label: 'Packshot / Affiche Studio' },
  { id: 'HOOK', label: 'Hook Accrocheur (3s)' },
  { id: 'TESTIMONIAL', label: 'Avis & Témoignage Client' },
  { id: 'PROMO', label: 'Offre Promo / Coffret' },
];

const STATUSES = [
  { id: 'WINNER', label: 'Winner', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'TESTING', label: 'En Test', badge: 'bg-sky-50 text-[#0284c7] border-sky-200' },
  { id: 'ACTIVE', label: 'Actif', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'PAUSED', label: 'En Pause', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  { id: 'ARCHIVED', label: 'Archivé', badge: 'bg-slate-50 text-slate-400 border-slate-200' },
];

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

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

  // Upload / Edit Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditingCreative, setIsEditingCreative] = useState<CreativeItem | null>(null);
  const [selectedPreviewCreative, setSelectedPreviewCreative] = useState<CreativeItem | null>(null);

  // Upload Form State
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
  const [toast, setToast] = useState<string | null>(null);

  // AI Creative Generation Studio State
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [aiProductSlug, setAiProductSlug] = useState(PRODUCTS[0]?.slug || '');
  const [aiPlatform, setAiPlatform] = useState<'META' | 'TIKTOK' | 'SNAPCHAT' | 'GOOGLE' | 'INFLUENCE'>('META');
  const [aiRatio, setAiRatio] = useState<'9:16' | '4:5' | '1:1'>('9:16');
  const [aiAngle, setAiAngle] = useState<'HOOK_CHOC' | 'LUXURY_STORY' | 'TESTER_VS_BOUTIQUE' | 'OFFRE_DUO' | 'COD_MAROC'>('HOOK_CHOC');
  const [aiCategory, setAiCategory] = useState('PRODUCT_SHOT');
  const [aiPosterTheme, setAiPosterTheme] = useState<PosterTheme>('electric');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSavingPoster, setAiSavingPoster] = useState(false);
  const [aiProductMeta, setAiProductMeta] = useState<{
    productName: string;
    brand: string;
    price: number;
    originalPrice: number;
    imageUrl: string;
  } | null>(null);
  const [generatedPack, setGeneratedPack] = useState<GeneratedCreativePack | null>(null);
  const [editableHeadline, setEditableHeadline] = useState('');
  const [editableBadge, setEditableBadge] = useState('');
  const [editableSubline, setEditableSubline] = useState('');
  const [editableAdCopy, setEditableAdCopy] = useState('');
  const [selectedHookIdx, setSelectedHookIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadCreatives = useCallback(
    async (showLoading = true) => {
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
    },
    [filterPlatform, filterCategory, filterStatus, filterMediaType, searchQuery]
  );

  useEffect(() => {
    loadCreatives(true);
  }, [loadCreatives]);

  // Draw live creative poster on Canvas whenever generatedPack or theme/edits change
  const renderPosterCanvas = useCallback(
    async (allowExternalImage = true) => {
      const canvas = canvasRef.current;
      if (!canvas || !generatedPack || !aiProductMeta) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const width = 1080;
      const height = aiRatio === '9:16' ? 1920 : aiRatio === '4:5' ? 1350 : 1080;
      canvas.width = width;
      canvas.height = height;

      // 1. Luxury Background Gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (aiPosterTheme === 'electric') {
        grad.addColorStop(0, '#041224');
        grad.addColorStop(0.55, '#072442');
        grad.addColorStop(1, '#0c4a6e');
      } else if (aiPosterTheme === 'obsidian') {
        grad.addColorStop(0, '#09090b');
        grad.addColorStop(0.6, '#18181b');
        grad.addColorStop(1, '#272013');
      } else {
        grad.addColorStop(0, '#f8fafc');
        grad.addColorStop(0.6, '#e0f2fe');
        grad.addColorStop(1, '#bae6fd');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient Glow Orbs
      const orb = ctx.createRadialGradient(
        width * 0.5,
        height * 0.42,
        40,
        width * 0.5,
        height * 0.42,
        width * 0.65
      );
      if (aiPosterTheme === 'obsidian') {
        orb.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
        orb.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        orb.addColorStop(0, 'rgba(14, 165, 233, 0.36)');
        orb.addColorStop(1, 'rgba(14, 165, 233, 0)');
      }
      ctx.fillStyle = orb;
      ctx.fillRect(0, 0, width, height);

      const isLightTheme = aiPosterTheme === 'pearl';
      const primaryText = isLightTheme ? '#0f172a' : '#ffffff';
      const secondaryText = isLightTheme ? '#334155' : '#bae6fd';
      const accentHex =
        aiPosterTheme === 'obsidian' ? '#f59e0b' : '#0ea5e9';

      // 2. Top Brand Kicker & Badge
      ctx.textAlign = 'center';
      ctx.fillStyle = accentHex;
      ctx.font = '800 28px Inter, sans-serif';
      ctx.fillText('MAISON NAY PARFUMS • MAROC', width / 2, 110);

      // Badge Pill
      const badgeText = (editableBadge || generatedPack.poster.topBadge).toUpperCase();
      ctx.font = '800 26px Inter, sans-serif';
      const badgeW = Math.min(width - 140, ctx.measureText(badgeText).width + 76);
      ctx.fillStyle = accentHex;
      ctx.beginPath();
      ctx.roundRect((width - badgeW) / 2, 145, badgeW, 56, 28);
      ctx.fill();
      ctx.fillStyle = aiPosterTheme === 'obsidian' ? '#09090b' : '#ffffff';
      ctx.fillText(badgeText, width / 2, 182);

      // 3. Center Product Card Frame
      const cardW = aiRatio === '1:1' ? 420 : 540;
      const cardH = aiRatio === '9:16' ? 620 : aiRatio === '4:5' ? 480 : 360;
      const cardX = (width - cardW) / 2;
      const cardY = aiRatio === '9:16' ? 260 : 230;

      ctx.save();
      ctx.fillStyle = isLightTheme ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = isLightTheme ? 'rgba(14,165,233,0.35)' : 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 42);
      ctx.fill();
      ctx.stroke();

      let imageDrawn = false;
      if (allowExternalImage && aiProductMeta.imageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image load error'));
            img.src = aiProductMeta.imageUrl;
          });
          ctx.beginPath();
          ctx.roundRect(cardX + 18, cardY + 18, cardW - 36, cardH - 36, 30);
          ctx.clip();
          const scale = Math.max((cardW - 36) / img.width, (cardH - 36) / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          ctx.drawImage(
            img,
            cardX + 18 + (cardW - 36 - drawW) / 2,
            cardY + 18 + (cardH - 36 - drawH) / 2,
            drawW,
            drawH
          );
          imageDrawn = true;
        } catch {
          imageDrawn = false;
        }
      }

      if (!imageDrawn) {
        // Luxury geometric bottle monogram fallback (taint-safe)
        ctx.fillStyle = accentHex;
        ctx.font = '900 120px Inter, sans-serif';
        ctx.fillText('NAY', width / 2, cardY + cardH / 2 + 25);
        ctx.font = '700 26px Inter, sans-serif';
        ctx.fillStyle = secondaryText;
        ctx.fillText(aiProductMeta.brand.toUpperCase(), width / 2, cardY + cardH / 2 + 80);
      }
      ctx.restore();

      // 4. Headline & Hook Text
      const textStartY = cardY + cardH + (aiRatio === '9:16' ? 95 : 65);
      ctx.fillStyle = primaryText;
      ctx.font = aiRatio === '1:1' ? '900 44px Inter, sans-serif' : '900 56px Inter, sans-serif';
      const headLines = wrapCanvasText(
        ctx,
        editableHeadline || generatedPack.poster.headline,
        width - 140
      ).slice(0, 3);
      let cursorY = textStartY;
      for (const line of headLines) {
        ctx.fillText(line, width / 2, cursorY);
        cursorY += aiRatio === '1:1' ? 52 : 66;
      }

      ctx.fillStyle = secondaryText;
      ctx.font = '600 30px Inter, sans-serif';
      const subLines = wrapCanvasText(
        ctx,
        editableSubline || generatedPack.poster.subline,
        width - 160
      ).slice(0, 2);
      for (const line of subLines) {
        ctx.fillText(line, width / 2, cursorY + 10);
        cursorY += 40;
      }

      // 5. Price Burst & COD CTA Button
      const priceY = height - (aiRatio === '9:16' ? 300 : 185);
      ctx.font = '900 64px Inter, sans-serif';
      ctx.fillStyle = accentHex;
      ctx.fillText(generatedPack.poster.priceText, width / 2, priceY);

      if (generatedPack.poster.comparePriceText) {
        ctx.font = '700 28px Inter, sans-serif';
        ctx.fillStyle = isLightTheme ? '#64748b' : '#94a3b8';
        ctx.fillText(`au lieu de ${generatedPack.poster.comparePriceText}`, width / 2, priceY + 46);
      }

      // Bottom CTA bar
      const ctaW = width - 160;
      const ctaH = 88;
      const ctaY = height - 155;
      ctx.fillStyle = accentHex;
      ctx.beginPath();
      ctx.roundRect(80, ctaY, ctaW, ctaH, 44);
      ctx.fill();
      ctx.fillStyle = aiPosterTheme === 'obsidian' ? '#09090b' : '#ffffff';
      ctx.font = '900 30px Inter, sans-serif';
      ctx.fillText(generatedPack.poster.ctaText, width / 2, ctaY + 55);

      return true;
    },
    [
      generatedPack,
      aiProductMeta,
      aiRatio,
      aiPosterTheme,
      editableBadge,
      editableHeadline,
      editableSubline,
    ]
  );

  useEffect(() => {
    if (isAiStudioOpen && generatedPack && aiProductMeta) {
      renderPosterCanvas(true);
    }
  }, [isAiStudioOpen, generatedPack, aiProductMeta, renderPosterCanvas]);

  const handleGenerateAiCreative = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/admin/creatives/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: aiProductSlug,
          platform: aiPlatform,
          aspectRatio: aiRatio,
          angle: aiAngle,
          category: aiCategory,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.creative) {
        setAiProductMeta(data.product);
        setGeneratedPack(data.creative);
        setEditableBadge(data.creative.poster.topBadge);
        setEditableHeadline(data.creative.poster.headline);
        setEditableSubline(data.creative.poster.subline);
        setEditableAdCopy(data.creative.adCopy);
        setSelectedHookIdx(0);
      } else {
        showToast(data.error || 'Erreur lors de la génération IA');
      }
    } catch {
      showToast('Erreur réseau lors de la génération IA');
    } finally {
      setAiLoading(false);
    }
  };

  const getSafePosterDataUrl = async (): Promise<string | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try {
      return canvas.toDataURL('image/png');
    } catch {
      await renderPosterCanvas(false);
      return canvas.toDataURL('image/png');
    }
  };

  const handleDownloadPoster = async () => {
    const dataUrl = await getSafePosterDataUrl();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `nay-creative-${aiPlatform.toLowerCase()}-${Date.now()}.png`;
    a.click();
    showToast('Affiche publicitaire PNG téléchargée !');
  };

  const handleSaveGeneratedCreative = async () => {
    if (!generatedPack || !aiProductMeta) return;
    setAiSavingPoster(true);
    try {
      const dataUrl = await getSafePosterDataUrl();
      if (!dataUrl) throw new Error('Canvas indisponible');

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl,
          filename: `nay-ai-creative-${Date.now()}.png`,
          mimeType: 'image/png',
        }),
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(uploadJson.error || 'Erreur téléversement affiche PNG');
      }

      const saveRes = await fetch('/api/admin/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedPack.title,
          description: `Généré par Studio IA NAY (${aiAngle})`,
          mediaUrl: uploadJson.url,
          mediaType: 'IMAGE',
          platform: aiPlatform,
          aspectRatio: aiRatio,
          category: aiCategory,
          status: 'TESTING',
          adCopy: editableAdCopy,
          productSlug: aiProductSlug,
          productName: aiProductMeta.productName,
          tags: generatedPack.tags,
        }),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok || !saveJson.success) {
        throw new Error(saveJson.error || 'Erreur sauvegarde créatif');
      }

      setIsAiStudioOpen(false);
      showToast('Créatif généré, visuel PNG exporté et ajouté à votre Ads Hub !');
      loadCreatives(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur sauvegarde créatif');
    } finally {
      setAiSavingPoster(false);
    }
  };

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

  const handleToggleWinner = async (item: CreativeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = item.status === 'WINNER' ? 'ACTIVE' : 'WINNER';
    try {
      const res = await fetch(`/api/admin/creatives/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setCreatives((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, status: nextStatus } : c))
        );
        showToast(
          nextStatus === 'WINNER' ? 'Créatif promu Winner !' : 'Statut Winner retiré.'
        );
        loadCreatives(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploadingFile(true);
    setUploadProgress(0);
    setUploadError(null);

    const safeBaseName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeName = safeBaseName || `creative_${Date.now()}`;

    let uploadedUrl = '';
    let lastErrorMessage = '';

    try {
      const newBlob = await upload(safeName, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload-client',
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(percentage)),
      });
      if (newBlob?.url) uploadedUrl = newBlob.url;
    } catch (clientErr: unknown) {
      lastErrorMessage =
        clientErr instanceof Error ? clientErr.message : 'Erreur téléversement direct';
    }

    if (!uploadedUrl && file.size <= 4.5 * 1024 * 1024) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data?.url) uploadedUrl = data.url;
          else if (data?.error) lastErrorMessage = data.error;
        }
      } catch (serverErr: unknown) {
        if (!lastErrorMessage) {
          lastErrorMessage = serverErr instanceof Error ? serverErr.message : '';
        }
      }
    }

    if (uploadedUrl) {
      setFormMediaUrl(uploadedUrl);
      const isVid =
        file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name);
      setFormMediaType(isVid ? 'VIDEO' : 'IMAGE');
      if (!formTitle) setFormTitle(file.name.replace(/\.[^/.]+$/, ''));
    } else {
      setUploadError(
        lastErrorMessage || 'Échec du téléversement : vérifiez votre connexion ou réduisez le fichier.'
      );
    }

    setIsUploadingFile(false);
  };

  const handleSaveCreative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setUploadError('Veuillez saisir un titre pour le créatif.');
      return;
    }
    if (!formMediaUrl.trim()) {
      setUploadError('Veuillez téléverser un fichier média.');
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
      const url = isEditingCreative
        ? `/api/admin/creatives/${isEditingCreative.id}`
        : '/api/admin/creatives';
      const res = await fetch(url, {
        method: isEditingCreative ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsUploadModalOpen(false);
        showToast(isEditingCreative ? 'Créatif mis à jour !' : 'Créatif ajouté !');
        loadCreatives(false);
      } else {
        setUploadError(data.error || "Erreur lors de l'enregistrement.");
      }
    } catch {
      setUploadError('Erreur réseau lors de la sauvegarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCreative = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce créatif ?')) return;
    setCreatives((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/admin/creatives/${id}`, { method: 'DELETE' });
    loadCreatives(false);
  };

  const copyMediaUrl = (url: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('Lien média copié !');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: CreativeItem['status']) => {
    const s = STATUSES.find((item) => item.id === status);
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          s?.badge || 'bg-slate-100 text-slate-700'
        }`}
      >
        {status === 'WINNER' && <Flame size={10} className="text-amber-600" />}
        <span>{s?.label || status}</span>
      </span>
    );
  };

  const getPlatformBadge = (platform: string) => {
    const p = PLATFORMS.find((item) => item.id === platform);
    return (
      <span
        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
          p?.color || 'bg-slate-100 text-slate-700'
        }`}
      >
        {p?.label || platform}
      </span>
    );
  };

  const winnerRate =
    stats && stats.total > 0 ? Math.round((stats.winners / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white border border-sky-500/40 shadow-xl text-xs font-semibold"
          >
            <CheckCircle2 size={14} className="text-sky-400" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              NAY PARFUMS • CREATIVE &amp; UGC STUDIO
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200">
              <Wand2 size={11} />
              Génération IA &amp; Visuels HD
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              TikTok • Reels • Meta
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900">
            Créatifs Publicitaires &amp; Studio Génération
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
            Générez des visuels publicitaires HD + scripts Hooks 3s par IA ou centralisez vos Reels UGC &amp; vidéos gagnantes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/landing-pages"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
          >
            <Layers size={14} className="text-[#0ea5e9]" />
            <span>Landing Pages</span>
          </Link>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
          >
            <UploadCloud size={14} />
            <span>Importer Média</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAiStudioOpen(true);
              if (!generatedPack) {
                setTimeout(() => handleGenerateAiCreative(), 50);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:opacity-95 text-white font-semibold text-xs transition-all shadow-md shadow-sky-500/20 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Studio Génération IA</span>
          </button>
        </div>
      </div>

      {/* 4 BENTO KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 nay-stagger">
        <div className="nay-hero-shine rounded-2xl p-5 bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#0369a1] text-white shadow-lg shadow-sky-500/20 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-100">
              BIBLIOTHÈQUE CRÉATIFS
            </span>
            <Film size={15} className="text-white/90" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tabular-nums">{stats?.total ?? '—'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 border border-white/25">
              {stats?.active ?? 0} actifs
            </span>
          </div>
          <p className="text-[11px] text-sky-100 mt-1.5">
            {stats?.videos ?? 0} vidéos • {stats?.images ?? 0} visuels studio
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              CRÉATIFS WINNERS
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Flame size={14} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 tabular-nums">
            {stats?.winners ?? 0}
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 nay-progress-fill"
                style={{ width: `${Math.max(4, winnerRate)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">{winnerRate}% taux de créatifs gagnants</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              EN PHASE DE TEST
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-[#0ea5e9]">
              <Clapperboard size={14} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#0284c7] tabular-nums">
            {stats?.testing ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Hooks &amp; formats A/B en rotation</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs nay-card-lift flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              VIDÉOS REELS &amp; TIKTOK
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Video size={14} />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tabular-nums">
            {stats?.videos ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Format vertical 9:16 haute rétention</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 w-full flex-1">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un créatif, produit..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="ALL">Toutes les plateformes</option>
            <option value="META">Meta (Instagram / FB)</option>
            <option value="TIKTOK">TikTok Ads</option>
            <option value="SNAPCHAT">Snapchat Ads</option>
            <option value="GOOGLE">Google / YouTube</option>
            <option value="INFLUENCE">Influence &amp; UGC</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="WINNER">Winners</option>
            <option value="TESTING">En Test</option>
            <option value="ACTIVE">Actifs</option>
            <option value="PAUSED">En Pause</option>
            <option value="ARCHIVED">Archivés</option>
          </select>

          <select
            value={filterMediaType}
            onChange={(e) => setFilterMediaType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="ALL">Tous les formats</option>
            <option value="VIDEO">Vidéos uniquement</option>
            <option value="IMAGE">Affiches / Photos</option>
          </select>
        </div>
      </div>

      {/* CREATIVES GRID */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Chargement du Studio Créatifs...</span>
        </div>
      ) : creatives.length === 0 ? (
        <div className="py-16 px-6 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
            <Wand2 size={26} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Aucun créatif publicitaire enregistré
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Lancez le Studio Génération IA pour produire instantanément une affiche pub HD + 3 Hooks 3s + un storyboard TikTok/Reels, ou importez vos vidéos.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsAiStudioOpen(true);
                setTimeout(() => handleGenerateAiCreative(), 50);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Générer mon 1er Créatif avec IA</span>
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Importer un Média</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 nay-stagger">
          {creatives.map((item) => {
            const isVideo = item.mediaType === 'VIDEO';
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-2xs nay-card-lift flex flex-col group ${
                  item.status === 'WINNER'
                    ? 'border-amber-300 ring-1 ring-amber-200/70'
                    : 'border-slate-200'
                }`}
              >
                <div
                  onClick={() => setSelectedPreviewCreative(item)}
                  className="relative aspect-[9/14] bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center"
                >
                  {isVideo ? (
                    <video
                      src={item.mediaUrl}
                      controls={false}
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />

                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10">
                    <div className="flex flex-wrap items-center gap-1">
                      {getStatusBadge(item.status)}
                      {getPlatformBadge(item.platform)}
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono font-bold text-white">
                      {item.aspectRatio || '9:16'}
                    </span>
                  </div>

                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-11 h-11 rounded-full bg-white/30 backdrop-blur-xs text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#0ea5e9] transition-all">
                        <Play size={16} className="ml-0.5 fill-white" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                    <div className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mb-0.5">
                      {CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                    </div>
                    <h4 className="font-bold text-xs leading-snug line-clamp-2 text-white">
                      {item.title}
                    </h4>
                  </div>
                </div>

                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between text-xs">
                  <div className="space-y-1.5">
                    {item.productName && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 truncate">
                        <Sparkles size={11} className="shrink-0 text-[#0ea5e9]" />
                        <span>{item.productName}</span>
                      </div>
                    )}
                    {item.adCopy && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-slate-600 text-[11px] line-clamp-2 italic leading-relaxed">
                        &quot;{item.adCopy}&quot;
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-slate-400">
                    <button
                      type="button"
                      onClick={(e) => handleToggleWinner(item, e)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        item.status === 'WINNER'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-amber-700'
                      }`}
                    >
                      <Award size={11} />
                      <span>{item.status === 'WINNER' ? 'Winner ✓' : 'Promouvoir'}</span>
                    </button>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => copyMediaUrl(item.mediaUrl, item.id, e)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0284c7] rounded-lg transition-colors cursor-pointer"
                        title="Copier le lien média"
                      >
                        {copiedId === item.id ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>

                      <a
                        href={item.mediaUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0284c7] rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <Download size={13} />
                      </a>

                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                        title="Modifier"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => deleteCreative(item.id, e)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
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

      {/* AI CREATIVE & POSTER GENERATION STUDIO MODAL */}
      <AnimatePresence>
        {isAiStudioOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsAiStudioOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center shadow-sm">
                    <Sparkles size={19} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Studio Génération IA : Visuel Pub HD + Hooks &amp; Storyboard
                    </h3>
                    <p className="text-xs text-slate-500">
                      Créez une affiche publicitaire prête pour Meta/TikTok Ads et exportez-la directement dans votre bibliothèque.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiStudioOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* Left 6 Cols: Brief & Script + Hooks */}
                <div className="lg:col-span-6 p-6 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Parfum NAY à Promouvoir
                      </label>
                      <select
                        value={aiProductSlug}
                        onChange={(e) => setAiProductSlug(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        {PRODUCTS.map((p) => (
                          <option key={p.slug} value={p.slug}>
                            {p.name} ({p.price} MAD)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Plateforme &amp; Format
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={aiPlatform}
                          onChange={(e) => setAiPlatform(e.target.value as any)}
                          className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                        >
                          <option value="META">Meta Reels/IG</option>
                          <option value="TIKTOK">TikTok Ads</option>
                          <option value="SNAPCHAT">Snapchat</option>
                        </select>
                        <select
                          value={aiRatio}
                          onChange={(e) => setAiRatio(e.target.value as any)}
                          className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                        >
                          <option value="9:16">9:16 Story</option>
                          <option value="4:5">4:5 Feed</option>
                          <option value="1:1">1:1 Carré</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Angle Créatif
                      </label>
                      <select
                        value={aiAngle}
                        onChange={(e) => setAiAngle(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="HOOK_CHOC">Hook Choc 3s (Anti-Prix Boutique)</option>
                        <option value="LUXURY_STORY">Storytelling Haute Parfumerie</option>
                        <option value="TESTER_VS_BOUTIQUE">Testeur Certifié vs Boutique</option>
                        <option value="OFFRE_DUO">Pack Duo &amp; Coffret Cadeau</option>
                        <option value="COD_MAROC">Zéro Risque : COD Vérifié Maroc</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                        Direction Artistique Affiche
                      </label>
                      <select
                        value={aiPosterTheme}
                        onChange={(e) => setAiPosterTheme(e.target.value as PosterTheme)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="electric">NAY Electric Blue &amp; Glass</option>
                        <option value="obsidian">Obsidienne &amp; Or Luxe</option>
                        <option value="pearl">Alabaster Clair Éditorial</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleGenerateAiCreative}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Génération des Hooks, Script &amp; Visuel...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={14} />
                        <span>Générer / Régénérer Pack Créatif IA</span>
                      </>
                    )}
                  </button>

                  {generatedPack && (
                    <div className="space-y-4 pt-2 border-t border-slate-200">
                      {/* 3 Viral Hooks */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                          3 Hooks Viraux 3 Secondes (Cliquez pour appliquer)
                        </label>
                        <div className="space-y-1.5">
                          {generatedPack.hooks.map((hk, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedHookIdx(idx);
                                setEditableSubline(hk);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                                selectedHookIdx === idx
                                  ? 'border-[#0ea5e9] bg-sky-50/70 font-semibold text-slate-900'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                              }`}
                            >
                              <span className="font-bold text-[#0284c7] mr-1.5">Hook #{idx + 1}:</span>
                              {hk}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Editable Poster Overlays & Ad Copy */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Badge Affiche
                          </label>
                          <input
                            type="text"
                            value={editableBadge}
                            onChange={(e) => setEditableBadge(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Titre Affiche
                          </label>
                          <input
                            type="text"
                            value={editableHeadline}
                            onChange={(e) => setEditableHeadline(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Ad Copy Primaire (Prêt Meta / TikTok)
                        </label>
                        <textarea
                          rows={4}
                          value={editableAdCopy}
                          onChange={(e) => setEditableAdCopy(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800"
                        />
                      </div>

                      {/* Storyboard */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                          Storyboard Vidéo UGC (25s)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {generatedPack.storyboard.map((sc, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]"
                            >
                              <div className="font-bold text-[#0284c7]">
                                {sc.time} • {sc.scene}
                              </div>
                              <p className="text-slate-600 mt-0.5 leading-snug">{sc.action}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right 6 Cols: Live HD Canvas Visual Preview */}
                <div className="lg:col-span-6 p-6 bg-slate-50/70 flex flex-col items-center justify-between gap-4">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Rendu Affiche Publicitaire HD ({aiRatio})
                    </span>
                    {generatedPack && (
                      <button
                        type="button"
                        onClick={handleDownloadPoster}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#0ea5e9] cursor-pointer"
                      >
                        <Download size={12} /> Télécharger PNG
                      </button>
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-center w-full">
                    {generatedPack ? (
                      <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 max-h-[520px] flex items-center justify-center">
                        <canvas
                          ref={canvasRef}
                          className="max-h-[520px] w-auto h-auto block"
                        />
                      </div>
                    ) : (
                      <div className="w-[290px] h-[460px] rounded-2xl border border-dashed border-sky-300 bg-gradient-to-br from-sky-50 to-white flex flex-col items-center justify-center text-center p-6 gap-3">
                        {aiLoading ? (
                          <>
                            <Loader2 size={28} className="animate-spin text-[#0ea5e9]" />
                            <p className="text-xs font-bold text-slate-800">
                              Création de votre affiche HD &amp; Hooks 3s...
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Composition visuelle {aiRatio} pour {aiPlatform}
                            </p>
                          </>
                        ) : (
                          <>
                            <Sparkles size={26} className="text-[#0ea5e9]" />
                            <p className="text-xs font-bold text-slate-800">
                              Aperçu Affiche Publicitaire HD
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Cliquez sur Générer pour composer l&apos;affiche et le script.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-full flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAiStudioOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Fermer
                    </button>
                    <button
                      type="button"
                      disabled={!generatedPack || aiSavingPoster}
                      onClick={handleSaveGeneratedCreative}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {aiSavingPoster ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Export &amp; Sauvegarde...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Enregistrer Visuel + Script dans Ads Hub</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPLOAD & EDIT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0ea5e9] border border-sky-200 flex items-center justify-center">
                  <UploadCloud size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isEditingCreative ? 'Modifier le créatif' : 'Importer un créatif publicitaire'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vidéos TikTok, Reels Instagram, UGC et visuels jusqu&apos;à 150 Mo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCreative} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-12 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
                        {formMediaType === 'VIDEO' ? (
                          <video src={formMediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={formMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] mb-1 border border-emerald-200">
                          <CheckCircle2 size={10} /> Fichier prêt ({formMediaType})
                        </span>
                        <p className="text-slate-600 text-xs truncate max-w-xs">{formMediaUrl}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Remplacer
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingFile && fileInputRef.current?.click()}
                    className="p-6 rounded-2xl border border-dashed border-slate-300 hover:border-[#0ea5e9] bg-slate-50/70 flex flex-col items-center justify-center text-center cursor-pointer"
                  >
                    {isUploadingFile ? (
                      <div className="flex flex-col items-center gap-2 py-3 w-full max-w-xs mx-auto">
                        <Loader2 size={24} className="animate-spin text-[#0ea5e9]" />
                        <span className="text-xs font-semibold text-slate-700">
                          Téléversement... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0ea5e9] flex items-center justify-center mb-2">
                          <UploadCloud size={20} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Cliquez pour téléverser vidéo ou photo
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          MP4, MOV, PNG, JPG jusqu&apos;à 150 Mo
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Titre du Créatif *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Reel Hook Baccarat Rouge"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Produit Associé
                  </label>
                  <input
                    type="text"
                    value={formProductName}
                    onChange={(e) => setFormProductName(e.target.value)}
                    placeholder="Ex: Dior Sauvage..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="META">Meta (IG / FB)</option>
                  <option value="TIKTOK">TikTok Ads</option>
                  <option value="SNAPCHAT">Snapchat Ads</option>
                  <option value="GOOGLE">Google / YouTube</option>
                  <option value="INFLUENCE">Influence &amp; UGC</option>
                </select>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="TESTING">En Test</option>
                  <option value="WINNER">Winner</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="PAUSED">En Pause</option>
                  <option value="ARCHIVED">Archivé</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ad Copy &amp; Hook
                </label>
                <textarea
                  rows={3}
                  value={formAdCopy}
                  onChange={(e) => setFormAdCopy(e.target.value)}
                  placeholder="Accroche (Hook 3s), texte principal..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingFile}
                  className="px-4 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting
                    ? 'Enregistrement...'
                    : isEditingCreative
                    ? 'Mettre à jour'
                    : 'Ajouter Créatif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {selectedPreviewCreative && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewCreative(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] border border-slate-200"
          >
            <div className="flex-1 bg-slate-950 flex items-center justify-center relative min-h-[350px]">
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

            <div className="w-full md:w-80 p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 bg-white">
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  {getStatusBadge(selectedPreviewCreative.status)}
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewCreative(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {selectedPreviewCreative.title}
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Par {selectedPreviewCreative.creatorName}
                  </p>
                </div>

                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plateforme :</span>
                    <span className="font-bold text-slate-800">
                      {selectedPreviewCreative.platform}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type :</span>
                    <span className="font-semibold text-slate-700">
                      {selectedPreviewCreative.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Format :</span>
                    <span className="font-mono text-slate-700">
                      {selectedPreviewCreative.aspectRatio}
                    </span>
                  </div>
                </div>

                {selectedPreviewCreative.adCopy && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                      Ad Copy / Hook
                    </span>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-slate-700 text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                      {selectedPreviewCreative.adCopy}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    copyMediaUrl(selectedPreviewCreative.mediaUrl, selectedPreviewCreative.id)
                  }
                  className="w-full py-2.5 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Copy size={13} />
                  <span>
                    {copiedId === selectedPreviewCreative.id
                      ? 'Lien copié !'
                      : 'Copier le lien direct'}
                  </span>
                </button>

                <a
                  href={selectedPreviewCreative.mediaUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5"
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
