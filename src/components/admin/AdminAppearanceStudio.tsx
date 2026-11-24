'use client';

import React, { useState } from 'react';
import {
  BookmarkPlus,
  Check,
  CheckCircle2,
  Code2,
  Download,
  Droplets,
  EyeOff,
  Layout,
  Loader2,
  Minus,
  Moon,
  Palette,
  PanelLeft,
  PanelRight,
  PanelTop,
  Plus,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  Type,
  Upload,
  UserCheck,
  Wrench,
} from 'lucide-react';
import {
  ADMIN_ACCENT_SWATCHES,
  ADMIN_STYLE_PRESETS,
  AdminBackgroundEffect,
  AdminBorderStrength,
  AdminCardStyle,
  AdminChartPalette,
  AdminContentWidth,
  AdminDensityStyle,
  AdminDesignConfig,
  AdminFontChoice,
  AdminHeadbarStyle,
  AdminHeadingStyle,
  AdminPillStyle,
  AdminRadiusStyle,
  AdminShadowLevel,
  AdminSidebarPosition,
  AdminSidebarShape,
  AdminSidebarTone,
  AdminTableStyle,
  AdminTaskbarPosition,
  AdminTaskbarStyle,
  useAdminTheme,
} from '@/context/AdminThemeContext';
import {
  PAIRED_COMPLETE_RECIPES,
  type PairedRecipeCategory,
  resolvePairedRecipePatch,
} from './appearanceRecipes';

type StudioTab = 'themes' | 'chrome' | 'ux' | 'comfort' | 'custom';

const FONT_OPTIONS: Array<{
  id: AdminFontChoice;
  label: string;
  spec: string;
  previewFont: string;
}> = [
  { id: 'inter', label: 'Inter Précision', spec: 'Sans-serif SaaS', previewFont: 'var(--font-admin), sans-serif' },
  { id: 'jakarta', label: 'Plus Jakarta Sans', spec: 'Géométrique moderne', previewFont: 'var(--font-admin-jakarta), sans-serif' },
  { id: 'manrope', label: 'Manrope Studio', spec: 'Architectural épuré', previewFont: 'var(--font-admin-manrope), sans-serif' },
  { id: 'dm_sans', label: 'DM Sans', spec: 'Minimalisme digital', previewFont: 'var(--font-admin-dm), sans-serif' },
  { id: 'serif', label: 'Playfair Display', spec: 'Éditorial haute couture', previewFont: 'var(--font-admin-serif), Georgia, serif' },
  { id: 'cormorant', label: 'Cormorant Garamond', spec: 'Luxe classique Maison', previewFont: 'var(--font-admin-cormorant), Georgia, serif' },
  { id: 'mono', label: 'JetBrains Mono', spec: 'Tabulaire technique', previewFont: 'var(--font-admin-mono), monospace' },
  { id: 'system', label: 'Système Natif', spec: 'SF Pro / Segoe UI', previewFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
];

const SIZE_STEPS: Array<{ label: string; px: number }> = [
  { label: 'Compact', px: 14 },
  { label: 'Standard', px: 16 },
  { label: 'Confort', px: 17 },
  { label: 'Grand', px: 18 },
];

const BLUR_STEPS: Array<{ label: string; px: number }> = [
  { label: 'Léger', px: 10 },
  { label: 'Équilibré', px: 20 },
  { label: 'Liquide iOS', px: 28 },
  { label: 'Profond', px: 38 },
];

const OPACITY_STEPS: Array<{ label: string; pct: number }> = [
  { label: 'Cristal Léger', pct: 38 },
  { label: 'Porcelaine iOS', pct: 62 },
  { label: 'Givré Doux', pct: 74 },
  { label: 'Mat Satiné', pct: 86 },
];

const HEADBAR_OPTIONS: Array<{
  id: AdminHeadbarStyle;
  label: string;
  desc: string;
  pillText: string;
  previewKind: 'glass' | 'floating' | 'split' | 'docked' | 'dark' | 'accent' | 'slim' | 'minimal' | 'aurora' | 'double' | 'ink' | 'centerpill' | 'architect';
}> = [
  { id: 'liquid_glass', label: 'Liquid Glass iOS 27', desc: 'Verre réfracté, flou élevé & reflet spéculaire', pillText: 'Verre', previewKind: 'glass' },
  { id: 'floating', label: 'Capsule Flottante', desc: 'Barre suspendue avec bordure givrée douce', pillText: 'Flottant', previewKind: 'floating' },
  { id: 'capsule_split', label: 'Capsules Séparées', desc: 'En-tête léger transparent avec îlots détachés', pillText: 'Îlots', previewKind: 'split' },
  { id: 'translucent_frosted', label: 'Cristal Givré Doux', desc: 'Verre laiteux haute transparence & aura fine', pillText: 'Givré', previewKind: 'glass' },
  { id: 'glass_pill_center', label: 'Pilule Verre Centrée', desc: 'En-tête panoramique centré en pilule macOS', pillText: 'Centré', previewKind: 'centerpill' },
  { id: 'gradient_aurora', label: 'Dégradé Aurore Accent', desc: 'Bandeau lumineux tricolore teinté par votre accent', pillText: 'Aurore', previewKind: 'aurora' },
  { id: 'double_decker', label: 'Double Filet Signature', desc: 'Barre structurée avec soulignement accentué 3px', pillText: 'Double', previewKind: 'double' },
  { id: 'docked', label: 'Ancrée Pleine Largeur', desc: 'Bord à bord rectiligne façon bureau classique', pillText: 'Ancré', previewKind: 'docked' },
  { id: 'obsidian', label: 'Obsidienne Foncée', desc: 'Bandeau sombre à fort contraste permanent', pillText: 'Sombre', previewKind: 'dark' },
  { id: 'accent_band', label: 'Bandeau Couleur Accent', desc: 'Barre pleine teintée par votre couleur signature', pillText: 'Signature', previewKind: 'accent' },
  { id: 'monochrome_ink', label: 'Encre Éditoriale', desc: 'Papier ivoire ou noir pur avec filet encre net', pillText: 'Éditorial', previewKind: 'ink' },
  { id: 'bordered_architect', label: 'Cadre Architecte Brut', desc: 'Trait épais structuré avec ombre décalée nette', pillText: 'Brutaliste', previewKind: 'architect' },
  { id: 'compact_slim', label: 'Barre Fine Compacte', desc: 'Hauteur réduite pour maximiser la zone utile', pillText: 'Slim', previewKind: 'slim' },
  { id: 'minimal', label: 'Ligne Minimaliste', desc: 'Surface transparente et filet inférieur discret', pillText: 'Épuré', previewKind: 'minimal' },
];

const SIDEBAR_TONE_OPTIONS: Array<{
  id: AdminSidebarTone;
  label: string;
  desc: string;
  swatch: string;
}> = [
  { id: 'liquid_glass', label: 'Liquid Glass iOS 27', desc: 'Cristal translucide avec réfraction & halo lumineux', swatch: 'linear-gradient(135deg,#e0f2fe,#ffffff)' },
  { id: 'translucent', label: 'Verre Givré Fluide', desc: 'Voile léger laissant filtrer les nuances du fond', swatch: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)' },
  { id: 'auto', label: 'Adaptative au Thème', desc: 'Suit harmonieusement le mode clair ou sombre actif', swatch: '#ffffff' },
  { id: 'obsidian', label: 'Noir Obsidienne', desc: 'Rail sombre luxe, icônes contrastées en permanence', swatch: '#0b1322' },
  { id: 'midnight_blue', label: 'Bleu Nuit Profond', desc: 'Bleu marine velouté inspiré des studios horlogers', swatch: '#0f1d40' },
  { id: 'espresso_lux', label: 'Expresso & Bois Noir', desc: 'Brun torréfié chaleureux pour maisons de parfum', swatch: '#2a1d17' },
  { id: 'forest_velvet', label: 'Velours Forêt Pin', desc: 'Vert botanique profond & reflets émeraude subtils', swatch: '#0d2b20' },
  { id: 'burgundy_atelier', label: 'Bordeaux Couture', desc: 'Lie-de-vin couture inspiré de la haute parfumerie', swatch: '#2e0f1c' },
  { id: 'frosted_iris', label: 'Iris Givré Satiné', desc: 'Lavande cristalline douce en clair comme en nuit', swatch: 'linear-gradient(135deg,#e0e7ff,#f3e8ff)' },
  { id: 'graphite_rail', label: 'Graphite Carbone', desc: 'Gris anthracite industriel ultra-lisible', swatch: '#181a1f' },
  { id: 'linen_paper', label: 'Lin Naturel Papier', desc: 'Teinte parchemin chaud façon catalogue éditorial', swatch: '#f7f3ea' },
  { id: 'tinted', label: 'Voile Teinté Accent', desc: 'Légère teinte pastel issue de la couleur accent', swatch: 'linear-gradient(135deg,#bae6fd,#f8fafc)' },
  { id: 'accent_solid', label: 'Bloc Couleur Accent', desc: 'Colonne affirmée habillée de la couleur signature', swatch: '#0ea5e9' },
  { id: 'minimal_border', label: 'Cadre Transparent', desc: 'Fond quasi invisible souligné par un filet pur', swatch: 'transparent' },
];

const SIDEBAR_SHAPE_OPTIONS: Array<{
  id: AdminSidebarShape;
  label: string;
  desc: string;
}> = [
  { id: 'floating', label: 'Îlot Flottant', desc: 'Détaché des bords avec ombres douces' },
  { id: 'docked', label: 'Ancré Au Bord', desc: 'Collé plein cadre du haut au bas' },
  { id: 'pill_nav', label: 'Navigation Pilule', desc: 'Coins ultra-arrondis façon dock iOS' },
  { id: 'inset_frame', label: 'Cadre Encastré', desc: 'Marges uniformes avec liseré intérieur' },
  { id: 'icon_dock', label: 'Capsule Dock', desc: 'Silhouette capsule surélevée détachée' },
];

const TASKBAR_STYLE_OPTIONS: Array<{
  id: AdminTaskbarStyle;
  label: string;
  desc: string;
  badge: string;
  previewBg: string;
  isDarkPreview?: boolean;
}> = [
  { id: 'floating_dock', label: 'Dock Flottant macOS', desc: 'Capsule vitrée centrée en bas avec ombres profondes', badge: 'Populaire', previewBg: 'rgba(255,255,255,0.88)' },
  { id: 'windows_bar', label: 'Taskbar Pleine Largeur', desc: 'Barre bureau classique ancrée bord-à-bord', badge: 'Bureau', previewBg: '#f8fafc' },
  { id: 'dynamic_island', label: 'Dynamic Island Noir', desc: 'Pilule sombre haute précision centrée façon Apple', badge: 'Îlot', previewBg: '#0b1120', isDarkPreview: true },
  { id: 'glass_shelf', label: 'Étagère Verre iOS', desc: 'Tablette translucide spéculaire sur toute la base', badge: 'Glass', previewBg: 'linear-gradient(180deg,#ffffff,#e2e8f0)' },
  { id: 'capsule_split', label: 'Double Capsule', desc: 'Groupe d’icônes isolées en pilule transparente', badge: 'Aéré', previewBg: 'rgba(241,245,249,0.92)' },
  { id: 'obsidian_bar', label: 'Barre Obsidienne', desc: 'Socle sombre permanent à contraste optimal', badge: 'Nuit', previewBg: '#0f172a', isDarkPreview: true },
  { id: 'accent_bar', label: 'Bande Signature Accent', desc: 'Barre colorée teintée par votre couleur accent', badge: 'Marque', previewBg: 'linear-gradient(135deg,#0ea5e9,#0284c7)', isDarkPreview: true },
  { id: 'minimal_line', label: 'Filet Minimaliste', desc: 'Surface transparente et ligne supérieure ultra-fine', badge: 'Pur', previewBg: 'transparent' },
  { id: 'ribbon_tab', label: 'Ruban Ligne Accent', desc: 'Barre sobre couronnée d’un trait signature 2px', badge: 'Éditorial', previewBg: '#ffffff' },
  { id: 'neon_pulse', label: 'Dock Halo Néon', desc: 'Capsule sombre encadrée d’un liseré lumineux accent', badge: 'Studio', previewBg: '#090d18', isDarkPreview: true },
  { id: 'compact_pills', label: 'Pilules Tactiles', desc: 'Boutons arrondis individuels pour prise en main rapide', badge: 'Tactile', previewBg: '#f1f5f9' },
  { id: 'none', label: 'Désactivée (Masquée)', desc: 'Libère le bas d’écran — menu dans le Headbar mobile', badge: 'Off', previewBg: 'transparent' },
];

const CARD_STYLE_OPTIONS: Array<{
  id: AdminCardStyle;
  label: string;
  desc: string;
  badge?: string;
}> = [
  { id: 'real_glass', label: 'Verre Réel Optique', desc: 'Réfraction SVG, biseaux Fresnel & brillance courbe', badge: 'Optique' },
  { id: 'frosted_crystal', label: 'Cristal Dépoli', desc: 'Verre satiné dépoli à flou élevé & liseré blanc', badge: 'Satiné' },
  { id: 'prism_edge', label: 'Prisme Iridescent', desc: 'Dispersion optique cyan-indigo-rose sur cristal', badge: 'Prisme' },
  { id: 'tinted_smoke', label: 'Verre Fumé Chrome', desc: 'Verre architectural fumé haute lisibilité', badge: 'Fumé' },
  { id: 'liquid', label: 'Verre Liquide iOS', desc: 'Transparence, flou & reflets spéculaires' },
  { id: 'glass', label: 'Cristal Givré Doux', desc: 'Fond translucide équilibré' },
  { id: 'elevated', label: 'Élévation Douce', desc: 'Cartes blanches sur ombre diffuse' },
  { id: 'neumorphic_soft', label: 'Relief Sculpté Doux', desc: 'Volume tactile 3D par double ombrage' },
  { id: 'bordered', label: 'Trait Architecte', desc: 'Bordure nette sans effet de flou' },
  { id: 'flat', label: 'Mat Uni', desc: 'Surface plane ultra-lisible' },
];

const CHART_PALETTE_OPTIONS: Array<{
  id: AdminChartPalette;
  label: string;
  colors: [string, string, string];
}> = [
  { id: 'default', label: 'Multi-Spectre', colors: ['#0ea5e9', '#10b981', '#8b5cf6'] },
  { id: 'luxury_gold', label: 'Or & Bronze', colors: ['#b45309', '#d97706', '#78350f'] },
  { id: 'emerald_pro', label: 'Sauge & Pin', colors: ['#059669', '#14b8a6', '#065f46'] },
  { id: 'monochrome', label: 'Titane Gris', colors: ['#18181b', '#64748b', '#cbd5e1'] },
];

function StudioToggleRow({
  title,
  description,
  checked,
  accentColor,
  onToggle,
}: {
  title: string;
  description?: string;
  checked: boolean;
  accentColor: string;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-900 dark:text-white">{title}</div>
        {description && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
          checked ? '' : 'bg-slate-300 dark:bg-white/20'
        }`}
        style={checked ? { backgroundColor: accentColor } : undefined}
      >
        <span
          className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform mt-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function FreeColorOverrideCard({
  label,
  value,
  fallback,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (hex: string) => void;
  onClear: () => void;
}) {
  const isSet = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-900 dark:text-white">{label}</span>
        {isSet && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10.5px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
          >
            Auto
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isSet ? value : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-transparent cursor-pointer p-0.5 shrink-0"
        />
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 uppercase">
          {isSet ? value : 'Auto (Thème)'}
        </span>
      </div>
    </div>
  );
}

export default function AdminAppearanceStudio() {
  const {
    theme,
    setTheme,
    design,
    updateDesign,
    resetDesign,
    savedProfiles,
    saveCurrentProfile,
    applySavedProfile,
    deleteSavedProfile,
    isSidebarCollapsed,
    setSidebarCollapsed,
    isPrivacyHidden,
    setPrivacyHidden,
    accountOwner,
    syncStatus,
  } = useAdminTheme();

  const [activeTab, setActiveTab] = useState<StudioTab>('themes');
  const [recipeCategory, setRecipeCategory] = useState<PairedRecipeCategory>('all');
  const [newProfileName, setNewProfileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [rawJsonDraft, setRawJsonDraft] = useState<string>(() => JSON.stringify(design, null, 2));

  const flashStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2600);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    saveCurrentProfile(newProfileName);
    flashStatus(`Profil « ${newProfileName.trim()} » sauvegardé`);
    setNewProfileName('');
  };

  const handleExport = () => {
    const payload = JSON.stringify({ theme, design }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nay-theme-${(accountOwner?.name || 'employe').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('Profil exporté');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (parsed.theme === 'light' || parsed.theme === 'dark') {
          setTheme(parsed.theme);
        }
        if (parsed.design && typeof parsed.design === 'object') {
          updateDesign(parsed.design as Partial<AdminDesignConfig>);
        }
        flashStatus('Profil appliqué');
      } catch {
        setImportError('Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyRawJson = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(rawJsonDraft);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setImportError('Le JSON doit être un objet de configuration valide.');
        return;
      }
      updateDesign(parsed as Partial<AdminDesignConfig>);
      flashStatus('Modifications JSON appliquées');
    } catch {
      setImportError('Syntaxe JSON invalide.');
    }
  };

  const activePresetObj =
    ADMIN_STYLE_PRESETS.find((p) => p.id === design.stylePreset) || ADMIN_STYLE_PRESETS[0];
  const activeFontObj = FONT_OPTIONS.find((f) => f.id === design.fontFamily) || FONT_OPTIONS[0];
  const activePaletteObj =
    CHART_PALETTE_OPTIONS.find((c) => c.id === design.chartPalette) || CHART_PALETTE_OPTIONS[0];

  const previewRadiusPx =
    typeof design.customRadiusPx === 'number'
      ? `${design.customRadiusPx}px`
      : design.borderRadius === 'sharp'
      ? '6px'
      : design.borderRadius === 'pill'
      ? '20px'
      : '12px';
  const previewBtnRadius =
    design.pillStyle === 'square' ? '5px' : design.pillStyle === 'capsule' ? '9999px' : '9px';

  const glassAlpha = Math.max(0.22, Math.min(0.95, (design.glassOpacityPct ?? 62) / 100));
  const isGlassSurface =
    design.cardStyle === 'real_glass' ||
    design.cardStyle === 'frosted_crystal' ||
    design.cardStyle === 'prism_edge' ||
    design.cardStyle === 'tinted_smoke' ||
    design.cardStyle === 'liquid' ||
    design.cardStyle === 'glass';
  const isLiquidChrome =
    design.headbarStyle === 'liquid_glass' ||
    design.headbarStyle === 'translucent_frosted' ||
    design.sidebarTone === 'liquid_glass' ||
    design.sidebarTone === 'translucent' ||
    isGlassSurface ||
    design.stylePreset === 'liquid_glass' ||
    design.stylePreset === 'crystal_refraction';

  const previewSidebarBg =
    design.sidebarTone === 'accent_solid'
      ? design.accentColor
      : design.sidebarTone === 'obsidian'
      ? 'rgba(11, 19, 34, 0.94)'
      : design.sidebarTone === 'midnight_blue'
      ? 'rgba(15, 29, 64, 0.92)'
      : design.sidebarTone === 'espresso_lux'
      ? '#2a1d17'
      : design.sidebarTone === 'forest_velvet'
      ? '#0d2b20'
      : design.sidebarTone === 'burgundy_atelier'
      ? '#2e0f1c'
      : design.sidebarTone === 'graphite_rail'
      ? '#181a1f'
      : design.sidebarTone === 'linen_paper'
      ? theme === 'dark'
        ? '#1b1916'
        : '#f7f3ea'
      : design.sidebarTone === 'frosted_iris'
      ? theme === 'dark'
        ? 'rgba(23, 20, 48, 0.84)'
        : 'rgba(238, 242, 255, 0.88)'
      : design.sidebarTone === 'minimal_border'
      ? 'transparent'
      : design.sidebarTone === 'liquid_glass' || design.sidebarTone === 'translucent'
      ? theme === 'dark'
        ? `rgba(14, 24, 48, ${Math.min(0.74, glassAlpha)})`
        : `rgba(255, 255, 255, ${Math.min(0.86, Math.max(0.6, glassAlpha))})`
      : theme === 'dark'
      ? 'rgba(12, 19, 34, 0.88)'
      : 'rgba(255, 255, 255, 0.92)';

  const previewHeadbarBg =
    design.headbarStyle === 'obsidian'
      ? '#0b1322'
      : design.headbarStyle === 'accent_band' || design.headbarStyle === 'gradient_aurora'
      ? design.accentColor
      : design.headbarStyle === 'minimal' || design.headbarStyle === 'capsule_split'
      ? 'transparent'
      : design.headbarStyle === 'monochrome_ink'
      ? theme === 'dark'
        ? '#0b0c0e'
        : '#faf8f3'
      : design.headbarStyle === 'liquid_glass' ||
        design.headbarStyle === 'translucent_frosted' ||
        design.headbarStyle === 'glass_pill_center' ||
        design.stylePreset === 'liquid_glass'
      ? theme === 'dark'
        ? `rgba(14, 24, 48, ${Math.min(0.72, glassAlpha)})`
        : `rgba(255, 255, 255, ${Math.min(0.84, Math.max(0.6, glassAlpha))})`
      : theme === 'dark'
      ? '#11192c'
      : '#ffffff';

  const previewHeadbarTextDarkBg =
    design.headbarStyle === 'obsidian' ||
    design.headbarStyle === 'accent_band' ||
    design.headbarStyle === 'gradient_aurora' ||
    theme === 'dark';

  const previewCanvasBg = design.customBgColor
    ? design.customBgColor
    : theme === 'dark'
    ? activePresetObj.darkBg
    : activePresetObj.lightBg;

  const previewCardFill = design.customCardColor
    ? design.customCardColor
    : design.cardStyle === 'tinted_smoke'
    ? theme === 'dark'
      ? 'rgba(12,16,24,0.72)'
      : 'rgba(214,222,232,0.70)'
    : isGlassSurface
    ? theme === 'dark'
      ? `rgba(17,27,50,${Math.min(0.58, glassAlpha)})`
      : `rgba(255,255,255,${Math.min(0.76, Math.max(0.46, glassAlpha))})`
    : design.cardStyle === 'neumorphic_soft'
    ? theme === 'dark'
      ? '#101726'
      : '#edf1f7'
    : theme === 'dark'
    ? '#11192c'
    : '#ffffff';

  return (
    <div className="space-y-5">
      {/* Personal Employee Sync Banner */}
      <div className="bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl px-5 py-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
            <UserCheck size={15} />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              Atelier Visuel Complet — {accountOwner?.name || 'Session Active'}
            </span>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              30 thèmes × 2 modes (60), 26 décors × 2 modes (52), Verre Réel Optique (SVG + Fresnel), 14 Headbars, 14 Sidebars &amp; 12 Taskbars.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold shrink-0">
          {syncStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Loader2 size={12} className="animate-spin" />
              Synchronisation...
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08] px-2.5 py-1 rounded-md border border-emerald-500/20">
              <CheckCircle2 size={12} />
              Synchronisé au compte
            </span>
          )}
          {syncStatus === 'local' && (
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 rounded-md">
              Mémorisé localement
            </span>
          )}
        </div>
      </div>

      {importError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-600 dark:text-rose-400">
          {importError}
        </div>
      )}

      {/* 5-Section Studio Navigator */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-[#0c1322] border border-slate-200/80 dark:border-white/[0.08] overflow-x-auto scrollbar-none">
        {(
          [
            { id: 'themes', label: '30 Thèmes & 28 Décors', icon: Palette },
            { id: 'chrome', label: 'Headbars, Sidebars & Taskbars', icon: PanelTop },
            { id: 'ux', label: 'Verre Réel, Effets & Polices', icon: Type },
            { id: 'comfort', label: 'Confort & Mise en Page', icon: Sliders },
            { id: 'custom', label: 'Sur-Mesure & Éditeur Libre', icon: Wrench },
          ] as Array<{ id: StudioTab; label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }>
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'custom') {
                  setRawJsonDraft(JSON.stringify(design, null, 2));
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-white dark:bg-[#1a2540] text-slate-900 dark:text-white shadow-xs border border-slate-200/70 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={14} style={active ? { color: design.accentColor } : undefined} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 8 COLS: ARCHITECTURAL DESIGN INSPECTOR */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-2xs divide-y divide-slate-100 dark:divide-white/[0.07]">
          {/* ================= TAB 1: THEMES, LIQUID GLASS & COLORS ================= */}
          {activeTab === 'themes' && (
            <>
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Sparkles size={15} style={{ color: design.accentColor }} />
                      {PAIRED_COMPLETE_RECIPES.length} Designs Complets × 2 Modes (Clair &amp; Sombre)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Chaque design dispose de sa version Mode Clair et de sa version Mode Sombre calibrées sur mesure.
                    </p>
                  </div>
                  <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.07] text-slate-700 dark:text-slate-200 shrink-0">
                    {PAIRED_COMPLETE_RECIPES.filter((r) => recipeCategory === 'all' || r.category === recipeCategory).length} × 2 ={' '}
                    {PAIRED_COMPLETE_RECIPES.filter((r) => recipeCategory === 'all' || r.category === recipeCategory).length * 2} looks
                  </span>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      { id: 'all', label: `Tous (${PAIRED_COMPLETE_RECIPES.length} × 2)` },
                      { id: 'glass', label: 'Verre Réel & Liquid' },
                      { id: 'luxury', label: 'Haute Parfumerie' },
                      { id: 'modern', label: 'Moderne & Dock' },
                      { id: 'compact', label: 'Bureau & Compact' },
                    ] as Array<{ id: PairedRecipeCategory; label: string }>
                  ).map((cat) => {
                    const activeCat = recipeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setRecipeCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                          activeCat
                            ? 'text-white border-transparent shadow-2xs'
                            : 'border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                        }`}
                        style={activeCat ? { backgroundColor: design.accentColor } : undefined}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {PAIRED_COMPLETE_RECIPES.filter(
                    (rec) => recipeCategory === 'all' || rec.category === recipeCategory
                  ).map((rec) => {
                    const lightPatch = resolvePairedRecipePatch(rec, 'light');
                    const darkPatch = resolvePairedRecipePatch(rec, 'dark');
                    const isLightMatch =
                      theme === 'light' &&
                      design.stylePreset === lightPatch.stylePreset &&
                      (lightPatch.headbarStyle ? design.headbarStyle === lightPatch.headbarStyle : true) &&
                      (lightPatch.sidebarTone ? design.sidebarTone === lightPatch.sidebarTone : true) &&
                      (lightPatch.cardStyle ? design.cardStyle === lightPatch.cardStyle : true);
                    const isDarkMatch =
                      theme === 'dark' &&
                      design.stylePreset === darkPatch.stylePreset &&
                      (darkPatch.headbarStyle ? design.headbarStyle === darkPatch.headbarStyle : true) &&
                      (darkPatch.sidebarTone ? design.sidebarTone === darkPatch.sidebarTone : true) &&
                      (darkPatch.cardStyle ? design.cardStyle === darkPatch.cardStyle : true);
                    const isAnyMatch = isLightMatch || isDarkMatch;
                    return (
                      <div
                        key={rec.id}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                          isAnyMatch
                            ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.03] dark:bg-sky-400/[0.06] ring-1 ring-slate-900/10 dark:ring-sky-400/20'
                            : 'border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {rec.name}
                            </span>
                            {/* Split Day | Night Preview Chip */}
                            <div
                              className="w-10 h-4 rounded-full border border-slate-300/60 dark:border-white/20 overflow-hidden flex relative shrink-0"
                              title="Aperçu Mode Clair | Mode Sombre"
                            >
                              <span className="w-1/2 h-full" style={{ backgroundColor: rec.lightSwatch[0] }} />
                              <span className="w-1/2 h-full" style={{ backgroundColor: rec.darkSwatch[0] }} />
                              <span
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/80 shadow-2xs"
                                style={{ backgroundColor: rec.lightSwatch[1] }}
                              />
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                            {rec.desc}
                          </div>
                        </div>

                        {/* Dual 1-Click Mode Buttons: Light Mode & Dark Mode */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setTheme('light');
                              updateDesign(lightPatch);
                              flashStatus(`« ${rec.name} » activé en Mode Clair`);
                            }}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              isLightMatch
                                ? 'text-white border-transparent shadow-2xs'
                                : 'bg-slate-50 hover:bg-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200'
                            }`}
                            style={isLightMatch ? { backgroundColor: design.accentColor } : undefined}
                          >
                            <Sun size={11.5} />
                            <span>Clair</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTheme('dark');
                              updateDesign(darkPatch);
                              flashStatus(`« ${rec.name} » activé en Mode Sombre`);
                            }}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              isDarkMatch
                                ? 'text-white border-transparent shadow-2xs'
                                : 'bg-slate-900/[0.04] hover:bg-slate-900 hover:text-white dark:bg-[#090e1a] dark:hover:bg-[#131c34] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200'
                            }`}
                            style={isDarkMatch ? { backgroundColor: design.accentColor } : undefined}
                          >
                            <Moon size={11.5} />
                            <span>Sombre</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Luminosité de Session
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mode jour ou mode nuit pour votre propre espace de travail.
                  </p>
                </div>

                <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Sun size={13.5} />
                    <span>Clair</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-[#1a2540] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Moon size={13.5} />
                    <span>Sombre</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Collection des {ADMIN_STYLE_PRESETS.length} Univers Visuels (Clair &amp; Sombre)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Chaque univers inclut un aperçu divisé Jour/Nuit et des boutons directs Clair / Sombre (60 variations).
                    </p>
                  </div>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200">
                    {ADMIN_STYLE_PRESETS.length} × 2 modes
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ADMIN_STYLE_PRESETS.map((preset) => {
                    const selected = design.stylePreset === preset.id;
                    const applyPresetMode = (targetMode: 'light' | 'dark') => {
                      setTheme(targetMode);
                      updateDesign({
                        stylePreset: preset.id,
                        accentColor: preset.defaultAccent,
                        customBgColor: '',
                        ...(preset.id === 'liquid_glass'
                          ? {
                              cardStyle: 'liquid',
                              glassBlurPx: 28,
                              glassOpacityPct: targetMode === 'dark' ? 48 : 62,
                              headbarStyle: 'liquid_glass',
                              sidebarTone: 'liquid_glass',
                              specularRim: true,
                            }
                          : preset.id === 'crystal_refraction'
                          ? {
                              cardStyle: 'real_glass',
                              glassBlurPx: 18,
                              glassOpacityPct: targetMode === 'dark' ? 44 : 54,
                              specularRim: true,
                            }
                          : {}),
                      });
                      flashStatus(
                        `Univers « ${preset.name} » (${targetMode === 'light' ? 'Clair' : 'Sombre'})`
                      );
                    };

                    return (
                      <div
                        key={preset.id}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                          selected
                            ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.03] dark:bg-sky-400/[0.06] ring-1 ring-slate-900/10 dark:ring-sky-400/20'
                            : 'border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Split Day | Night Preset Swatch */}
                          <div className="w-10 h-9 rounded-lg border border-black/10 dark:border-white/15 flex items-center justify-center shrink-0 shadow-2xs relative overflow-hidden">
                            <span className="w-1/2 h-full" style={{ backgroundColor: preset.lightBg }} />
                            <span className="w-1/2 h-full" style={{ backgroundColor: preset.darkBg }} />
                            <span
                              className="absolute w-3.5 h-3.5 rounded-full border border-white/80 shadow-xs"
                              style={{ backgroundColor: preset.defaultAccent }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {preset.name}
                              </span>
                              {selected && (
                                <Check size={12.5} className="text-slate-900 dark:text-sky-400 shrink-0" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                              {preset.tagline}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => applyPresetMode('light')}
                            className={`flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[10.5px] font-semibold border transition-all cursor-pointer ${
                              selected && theme === 'light'
                                ? 'text-white border-transparent'
                                : 'bg-slate-50 hover:bg-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200'
                            }`}
                            style={
                              selected && theme === 'light'
                                ? { backgroundColor: preset.defaultAccent }
                                : undefined
                            }
                          >
                            <Sun size={10.5} />
                            <span>Clair</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPresetMode('dark')}
                            className={`flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[10.5px] font-semibold border transition-all cursor-pointer ${
                              selected && theme === 'dark'
                                ? 'text-white border-transparent'
                                : 'bg-slate-900/[0.04] hover:bg-slate-900 hover:text-white dark:bg-[#090e1a] dark:hover:bg-[#131c34] border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200'
                            }`}
                            style={
                              selected && theme === 'dark'
                                ? { backgroundColor: preset.defaultAccent }
                                : undefined
                            }
                          >
                            <Moon size={10.5} />
                            <span>Sombre</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Couleur d&apos;Accentuation Personnelle
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Boutons d&apos;action, navigation active, bandeau accent et courbes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Libre :
                    </label>
                    <input
                      type="color"
                      aria-label="Couleur d'accent personnalisée"
                      value={design.accentColor}
                      onChange={(e) => updateDesign({ accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-transparent cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase">
                      {design.accentColor}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ADMIN_ACCENT_SWATCHES.map((swatch) => {
                    const active = design.accentColor.toLowerCase() === swatch.hex.toLowerCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => updateDesign({ accentColor: swatch.hex })}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'border-slate-900 dark:border-white bg-slate-900/[0.04] dark:bg-white/[0.08] text-slate-900 dark:text-white'
                            : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: swatch.hex }} />
                        <span>{swatch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 2: HEADBAR & SIDEBAR CUSTOMIZATION ================= */}
          {activeTab === 'chrome' && (
            <>
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-500/[0.05] via-transparent to-indigo-500/[0.05]">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Droplets size={15} style={{ color: design.accentColor }} />
                    Verre Liquide Instantané sur En-tête &amp; Barre Latérale
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Active le cristal blanc porcelaine (Clair) ou obsidienne spatiale (Sombre) avec flou {design.glassBlurPx}px.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateDesign({
                      stylePreset: 'liquid_glass',
                      headbarStyle: 'liquid_glass',
                      sidebarTone: 'liquid_glass',
                      cardStyle: 'liquid',
                      sidebarHidden: false,
                      glassBlurPx: 28,
                      glassOpacityPct: theme === 'dark' ? 48 : 62,
                      specularRim: true,
                    });
                    flashStatus('Liquid Glass appliqué au Headbar et à la Sidebar');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer shrink-0 transition-transform active:scale-95"
                  style={{ backgroundColor: design.accentColor }}
                >
                  Activer Liquid Glass Global
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <PanelTop size={15} style={{ color: design.accentColor }} />
                      Architecture du Headbar (14 Styles &amp; Hauteur)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Choisissez la structure, la hauteur exacte et les modules visibles dans la barre supérieure.
                    </p>
                  </div>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200">
                    14 designs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {HEADBAR_OPTIONS.map((hb) => {
                    const active = design.headbarStyle === hb.id;
                    return (
                      <button
                        key={hb.id}
                        type="button"
                        onClick={() => updateDesign({ headbarStyle: hb.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          active
                            ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.03] dark:bg-sky-400/[0.06] ring-1 ring-slate-900/10'
                            : 'border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300'
                        }`}
                      >
                        <div>
                          {/* Miniature structural schematic strip */}
                          <div className="h-5 w-full rounded-md bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08] p-1 flex items-center justify-between mb-2">
                            <div
                              className={`h-full flex items-center justify-between px-1.5 ${
                                hb.previewKind === 'centerpill'
                                  ? 'w-4/5 mx-auto rounded-full'
                                  : hb.previewKind === 'split'
                                  ? 'w-full bg-transparent px-0'
                                  : hb.previewKind === 'docked' || hb.previewKind === 'architect'
                                  ? 'w-full rounded-[2px]'
                                  : 'w-full rounded'
                              }`}
                              style={{
                                background:
                                  hb.previewKind === 'dark'
                                    ? '#0b1322'
                                    : hb.previewKind === 'accent' || hb.previewKind === 'aurora'
                                    ? design.accentColor
                                    : hb.previewKind === 'minimal' || hb.previewKind === 'split'
                                    ? 'transparent'
                                    : hb.previewKind === 'ink'
                                    ? '#faf8f3'
                                    : 'rgba(255,255,255,0.85)',
                                borderBottom:
                                  hb.previewKind === 'double'
                                    ? `2px solid ${design.accentColor}`
                                    : hb.previewKind === 'minimal'
                                    ? '1px solid rgba(148,163,184,0.45)'
                                    : undefined,
                                border:
                                  hb.previewKind === 'architect' ? '1.5px solid #0f172a' : undefined,
                              }}
                            >
                              <span
                                className="w-4 h-1 rounded-full"
                                style={{
                                  backgroundColor:
                                    hb.previewKind === 'dark' ||
                                    hb.previewKind === 'accent' ||
                                    hb.previewKind === 'aurora'
                                      ? '#ffffff'
                                      : '#64748b',
                                }}
                              />
                              <span
                                className="w-2.5 h-1.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    hb.previewKind === 'accent' || hb.previewKind === 'aurora'
                                      ? '#ffffff'
                                      : design.accentColor,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {hb.label}
                            </span>
                            <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
                              {hb.pillText}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                            {hb.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Hauteur du Headbar
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {design.headbarHeightPx ?? 54}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={44}
                    max={68}
                    step={2}
                    value={design.headbarHeightPx ?? 54}
                    onChange={(e) => updateDesign({ headbarHeightPx: Number(e.target.value) })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: design.accentColor }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <StudioToggleRow
                    title="Barre de recherche ⌘K"
                    description="Raccourci recherche rapide dans le Headbar"
                    checked={design.headbarShowSearch}
                    accentColor={design.accentColor}
                    onToggle={() => updateDesign({ headbarShowSearch: !design.headbarShowSearch })}
                  />
                  <StudioToggleRow
                    title="Horloge & Date en direct"
                    description="Afficher l'heure et le jour dans l'en-tête"
                    checked={design.headbarShowClock}
                    accentColor={design.accentColor}
                    onToggle={() => updateDesign({ headbarShowClock: !design.headbarShowClock })}
                  />
                  <StudioToggleRow
                    title="Bouton Création Rapide (+)"
                    description="Accès direct commande, produit ou client"
                    checked={design.headbarShowQuickAdd}
                    accentColor={design.accentColor}
                    onToggle={() => updateDesign({ headbarShowQuickAdd: !design.headbarShowQuickAdd })}
                  />
                  <StudioToggleRow
                    title="Badge du module actif"
                    description="Pastille indiquant la section courante à gauche"
                    checked={design.headbarShowModuleBadge}
                    accentColor={design.accentColor}
                    onToggle={() =>
                      updateDesign({ headbarShowModuleBadge: !design.headbarShowModuleBadge })
                    }
                  />
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <PanelLeft size={15} style={{ color: design.accentColor }} />
                      Matière, Dimensions &amp; Position de la Sidebar
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      14 matières visuelles, 5 silhouettes, largeur sur-mesure, côté d&apos;ancrage et éléments affichés.
                    </p>
                  </div>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200">
                    14 × 5 styles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {SIDEBAR_TONE_OPTIONS.map((sb) => {
                    const active = design.sidebarTone === sb.id;
                    return (
                      <button
                        key={sb.id}
                        type="button"
                        onClick={() => updateDesign({ sidebarTone: sb.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.03] dark:bg-sky-400/[0.06] ring-1 ring-slate-900/10'
                            : 'border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full border border-slate-400/40 shrink-0"
                              style={{
                                background: sb.id === 'accent_solid' ? design.accentColor : sb.swatch,
                              }}
                            />
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {sb.label}
                            </span>
                          </div>
                          {active && (
                            <Check size={12} className="text-slate-900 dark:text-sky-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          {sb.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Largeur de la Sidebar Dépliée
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {design.sidebarWidthPx ?? 278}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={230}
                    max={330}
                    step={4}
                    value={design.sidebarWidthPx ?? 278}
                    onChange={(e) => updateDesign({ sidebarWidthPx: Number(e.target.value) })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: design.accentColor }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Forme de la Sidebar (5 Silhouettes)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SIDEBAR_SHAPE_OPTIONS.map((sh) => {
                        const active = design.sidebarShape === sh.id;
                        return (
                          <button
                            key={sh.id}
                            type="button"
                            onClick={() => updateDesign({ sidebarShape: sh.id })}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              active
                                ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.03] dark:bg-sky-400/[0.06]'
                                : 'border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300'
                            }`}
                          >
                            <div className="text-[11.5px] font-bold text-slate-900 dark:text-white">
                              {sh.label}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {sh.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Côté de l&apos;écran (Gauche / Droite)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { id: 'left', label: 'À Gauche', icon: PanelLeft },
                          { id: 'right', label: 'À Droite', icon: PanelRight },
                        ] as Array<{ id: AdminSidebarPosition; label: string; icon: React.ComponentType<{ size?: number }> }>
                      ).map((pos) => {
                        const PosIcon = pos.icon;
                        const active = design.sidebarPosition === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => updateDesign({ sidebarPosition: pos.id })}
                            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              active
                                ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                                : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <PosIcon size={14} />
                            <span>{pos.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <StudioToggleRow
                    title="Mode Compact (Icônes)"
                    description="Réduire le menu latéral à une fine colonne d'icônes"
                    checked={isSidebarCollapsed}
                    accentColor={design.accentColor}
                    onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
                  />
                  <StudioToggleRow
                    title="Masquer sur Bureau (Focus)"
                    description="Libérer 100% de la largeur — navigation via ⌘K"
                    checked={design.sidebarHidden}
                    accentColor={design.accentColor}
                    onToggle={() => updateDesign({ sidebarHidden: !design.sidebarHidden })}
                  />
                  <StudioToggleRow
                    title="Barre de Filtre Rapide (⌘F)"
                    description="Champ de recherche intégré en haut de la Sidebar"
                    checked={design.sidebarShowSearch !== false}
                    accentColor={design.accentColor}
                    onToggle={() => updateDesign({ sidebarShowSearch: design.sidebarShowSearch === false })}
                  />
                  <StudioToggleRow
                    title="Pastilles & Badges Modules"
                    description="Afficher les compteurs (Live, commandes en attente)"
                    checked={design.sidebarShowBadges !== false}
                    accentColor={design.accentColor}
                    onToggle={() => updateDesign({ sidebarShowBadges: design.sidebarShowBadges === false })}
                  />
                  <StudioToggleRow
                    title="Carte Profil en Pied de Rail"
                    description="Afficher votre badge collaborateur en bas du menu"
                    checked={design.sidebarShowFooter !== false}
                    accentColor={design.accentColor}
                    onToggle={() => updateDesign({ sidebarShowFooter: design.sidebarShowFooter === false })}
                  />
                </div>
              </div>

              {/* ── SECTION 3 OF CHROME TAB: 12 TASKBAR & BOTTOM DOCK ARCHITECTURES ── */}
              <div className="p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Layout size={15} style={{ color: design.accentColor }} />
                      Taskbar &amp; Dock Inférieur (12 Designs Mobile &amp; Bureau)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Personnalisez la barre rapide en bas d&apos;écran : dock flottant macOS, Dynamic Island, Taskbar Windows 11 ou néon.
                    </p>
                  </div>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200">
                    12 docks
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {TASKBAR_STYLE_OPTIONS.map((tb) => {
                    const active = (design.taskbarStyle || 'floating_dock') === tb.id;
                    return (
                      <button
                        key={tb.id}
                        type="button"
                        onClick={() => updateDesign({ taskbarStyle: tb.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          active
                            ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.03] dark:bg-sky-400/[0.06] ring-1 ring-slate-900/10'
                            : 'border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300'
                        }`}
                      >
                        <div>
                          {/* Mini Taskbar Wireframe Preview */}
                          <div className="h-7 w-full rounded-md bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08] flex items-end justify-center p-1 mb-2">
                            {tb.id === 'none' ? (
                              <span className="text-[9px] font-mono text-slate-400 self-center">
                                Masquée
                              </span>
                            ) : (
                              <div
                                className={`flex items-center justify-center gap-1.5 px-2 transition-all ${
                                  tb.id === 'floating_dock' ||
                                  tb.id === 'dynamic_island' ||
                                  tb.id === 'neon_pulse'
                                    ? 'h-3.5 w-3/4 rounded-full'
                                    : tb.id === 'capsule_split'
                                    ? 'h-3.5 w-4/5 rounded-full'
                                    : 'h-3.5 w-full rounded-sm'
                                }`}
                                style={{
                                  background: tb.id === 'accent_bar' ? design.accentColor : tb.previewBg,
                                  borderTop:
                                    tb.id === 'ribbon_tab'
                                      ? `2px solid ${design.accentColor}`
                                      : tb.id === 'minimal_line'
                                      ? '1px solid rgba(148,163,184,0.5)'
                                      : undefined,
                                  border:
                                    tb.id === 'neon_pulse'
                                      ? `1.5px solid ${design.accentColor}`
                                      : '1px solid rgba(148,163,184,0.28)',
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: tb.id === 'accent_bar' ? '#ffffff' : design.accentColor }}
                                />
                                <span
                                  className="w-1.5 h-1.5 rounded-full opacity-55"
                                  style={{ backgroundColor: tb.isDarkPreview ? '#e2e8f0' : '#64748b' }}
                                />
                                <span
                                  className="w-1.5 h-1.5 rounded-full opacity-55"
                                  style={{ backgroundColor: tb.isDarkPreview ? '#e2e8f0' : '#64748b' }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {tb.label}
                            </span>
                            <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
                              {tb.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                            {tb.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <StudioToggleRow
                    title="Activer la Taskbar sur Bureau (PC/Mac)"
                    description="Affiche le dock rapide complet en bas même sur grand écran"
                    checked={Boolean(design.taskbarShowOnDesktop)}
                    accentColor={design.accentColor}
                    onToggle={() =>
                      updateDesign({ taskbarShowOnDesktop: !design.taskbarShowOnDesktop })
                    }
                  />
                  <StudioToggleRow
                    title="Afficher les Libellés sous Icônes"
                    description="Texte explicatif sous chaque raccourci du dock"
                    checked={design.taskbarShowLabels !== false}
                    accentColor={design.accentColor}
                    onToggle={() =>
                      updateDesign({ taskbarShowLabels: design.taskbarShowLabels === false })
                    }
                  />
                  <StudioToggleRow
                    title="Format Dock Compact"
                    description="Hauteur réduite pour libérer davantage d'espace vertical"
                    checked={Boolean(design.taskbarCompact)}
                    accentColor={design.accentColor}
                    onToggle={() => updateDesign({ taskbarCompact: !design.taskbarCompact })}
                  />

                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Ancrage Vertical
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Collé au bord ou surélevé
                      </div>
                    </div>
                    <div className="inline-flex p-1 rounded-lg bg-slate-200/70 dark:bg-white/[0.08] shrink-0">
                      {(
                        [
                          { id: 'bottom', label: 'Collé' },
                          { id: 'bottom_raised', label: 'Surélevé' },
                        ] as Array<{ id: AdminTaskbarPosition; label: string }>
                      ).map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => updateDesign({ taskbarPosition: pos.id })}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                            (design.taskbarPosition || 'bottom_raised') === pos.id
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 3: FONTS, LIQUID GLASS OPTICS & UI/UX ================= */}
          {activeTab === 'ux' && (
            <>
              <div className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Droplets size={15} style={{ color: design.accentColor }} />
                      Optique Verre Réel (Réfraction SVG, Flou &amp; Transparence)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ajustez finement la réfraction optique, les reflets Fresnel et la translucidité des surfaces.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateDesign({
                        stylePreset: 'crystal_refraction',
                        cardStyle: 'real_glass',
                        headbarStyle: 'translucent_frosted',
                        sidebarTone: 'liquid_glass',
                        backgroundEffect: 'bokeh_orbs',
                        glassBlurPx: 18,
                        glassOpacityPct: theme === 'dark' ? 44 : 54,
                        specularRim: true,
                      });
                      flashStatus('Verre Réel Optique (SVG) activé');
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer shrink-0 transition-transform active:scale-95"
                    style={{ backgroundColor: design.accentColor }}
                  >
                    Activer Verre Réel SVG
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Intensité du Flou (backdrop-blur)
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {design.glassBlurPx}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={44}
                    step={2}
                    value={design.glassBlurPx}
                    onChange={(e) => updateDesign({ glassBlurPx: Number(e.target.value) })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: design.accentColor }}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {BLUR_STEPS.map((st) => {
                      const active = Math.abs(design.glassBlurPx - st.px) <= 2;
                      return (
                        <button
                          key={st.px}
                          type="button"
                          onClick={() => updateDesign({ glassBlurPx: st.px })}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                            active
                              ? 'border-slate-900 dark:border-sky-400 bg-white dark:bg-[#1a2540] text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {st.label} ({st.px}px)
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Transparence du Verre (Opacité Surface)
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {design.glassOpacityPct ?? 62}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={22}
                    max={92}
                    step={2}
                    value={design.glassOpacityPct ?? 62}
                    onChange={(e) => updateDesign({ glassOpacityPct: Number(e.target.value) })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: design.accentColor }}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {OPACITY_STEPS.map((st) => {
                      const active = Math.abs((design.glassOpacityPct ?? 62) - st.pct) <= 3;
                      return (
                        <button
                          key={st.pct}
                          type="button"
                          onClick={() => updateDesign({ glassOpacityPct: st.pct })}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                            active
                              ? 'border-slate-900 dark:border-sky-400 bg-white dark:bg-[#1a2540] text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {st.label} ({st.pct}%)
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StudioToggleRow
                    title="Reflet Spéculaire iOS 27"
                    description="Liseré lumineux interne sur le contour du verre"
                    checked={design.specularRim !== false}
                    accentColor={design.accentColor}
                    onToggle={() => updateDesign({ specularRim: !design.specularRim })}
                  />
                  <StudioToggleRow
                    title="Élévation des Cartes au Survol"
                    description="Micro-soulèvement fluide au passage de la souris"
                    checked={design.cardHoverLift !== false}
                    accentColor={design.accentColor}
                    onToggle={() => updateDesign({ cardHoverLift: !design.cardHoverLift })}
                  />
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Famille Typographique (8 Polices Studio)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Inter, Plus Jakarta Sans, Manrope, DM Sans, Playfair Display, Cormorant, JetBrains Mono ou Système.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FONT_OPTIONS.map((font) => {
                    const active = design.fontFamily === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => updateDesign({ fontFamily: font.id })}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.03] dark:bg-sky-400/[0.06] ring-1 ring-slate-900/10'
                            : 'border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div
                            className="text-sm font-bold text-slate-900 dark:text-white truncate"
                            style={{ fontFamily: font.previewFont }}
                          >
                            {font.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {font.spec}
                          </div>
                        </div>
                        <span
                          className="text-lg font-bold text-slate-700 dark:text-slate-300 shrink-0 ml-2"
                          style={{ fontFamily: font.previewFont }}
                        >
                          Aa
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      10 Finitions de Cartes &amp; Verre Réel
                    </div>
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                      10 styles
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                    {CARD_STYLE_OPTIONS.map((cs) => {
                      const active = design.cardStyle === cs.id;
                      return (
                        <button
                          key={cs.id}
                          type="button"
                          onClick={() => updateDesign({ cardStyle: cs.id })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            active
                              ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.03] dark:bg-sky-400/[0.06] ring-1 ring-slate-900/10'
                              : 'border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {cs.label}
                            </span>
                            {cs.badge && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                                style={{ backgroundColor: design.accentColor }}
                              >
                                {cs.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                            {cs.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="md:col-span-7 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Effets &amp; Lumières de Fond (10 Styles)
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">Idéal sous Verre Réel</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'aurora', label: 'Halo Aurora' },
                          { id: 'crystal_caustics', label: 'Caustiques Eau' },
                          { id: 'bokeh_orbs', label: 'Orbes Bokeh' },
                          { id: 'silk_waves', label: 'Ondes de Soie' },
                          { id: 'prismatic_rays', label: 'Rayons Prisme' },
                          { id: 'nebula_mesh', label: 'Nébuleuse Polaire' },
                          { id: 'editorial_grain', label: 'Grain Fine Art' },
                          { id: 'grid', label: 'Grille Architecte' },
                          { id: 'dots', label: 'Points Fins' },
                          { id: 'solid', label: 'Fond Pur' },
                        ] as Array<{ id: AdminBackgroundEffect; label: string }>
                      ).map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => updateDesign({ backgroundEffect: bg.id })}
                          className={`py-2 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer truncate ${
                            design.backgroundEffect === bg.id
                              ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                              : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Palette des Graphiques
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {CHART_PALETTE_OPTIONS.map((cp) => {
                        const active = design.chartPalette === cp.id;
                        return (
                          <button
                            key={cp.id}
                            type="button"
                            onClick={() => updateDesign({ chartPalette: cp.id })}
                            className={`flex items-center justify-between gap-2 py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                              active
                                ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                                : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <span className="truncate">{cp.label}</span>
                            <span className="flex items-center gap-0.5 shrink-0">
                              {cp.colors.map((c) => (
                                <span
                                  key={c}
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Arrondi des Cartes
                    </div>
                    <div className="flex gap-1.5">
                      {(
                        [
                          { id: 'sharp', label: 'Vif' },
                          { id: 'balanced', label: 'Équilibré' },
                          { id: 'pill', label: 'Organique' },
                        ] as Array<{ id: AdminRadiusStyle; label: string }>
                      ).map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => updateDesign({ borderRadius: r.id, customRadiusPx: null })}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                            design.borderRadius === r.id && design.customRadiusPx == null
                              ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                              : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Forme des Boutons
                    </div>
                    <div className="flex gap-1.5">
                      {(
                        [
                          { id: 'square', label: 'Carré' },
                          { id: 'rounded', label: 'Doux' },
                          { id: 'capsule', label: 'Pilule' },
                        ] as Array<{ id: AdminPillStyle; label: string }>
                      ).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => updateDesign({ pillStyle: p.id })}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                            design.pillStyle === p.id
                              ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                              : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Style des Tableaux
                    </div>
                    <div className="flex gap-1.5">
                      {(
                        [
                          { id: 'clean', label: 'Épuré' },
                          { id: 'striped', label: 'Zébré' },
                          { id: 'cards', label: 'Détaché' },
                        ] as Array<{ id: AdminTableStyle; label: string }>
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => updateDesign({ tableStyle: t.id })}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                            design.tableStyle === t.id
                              ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                              : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 4: COMFORT, SCALE & LAYOUT ================= */}
          {activeTab === 'comfort' && (
            <>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Échelle Globale du Texte ({design.rootFontSizePx}px)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Redimensionne proportionnellement toute l&apos;interface pour votre confort visuel.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateDesign({ rootFontSizePx: Math.max(13, design.rootFontSizePx - 1) })}
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] cursor-pointer"
                      aria-label="Réduire la taille"
                    >
                      <Minus size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDesign({ rootFontSizePx: Math.min(19, design.rootFontSizePx + 1) })}
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] cursor-pointer"
                      aria-label="Augmenter la taille"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SIZE_STEPS.map((st) => {
                    const active = design.rootFontSizePx === st.px;
                    return (
                      <button
                        key={st.px}
                        type="button"
                        onClick={() => updateDesign({ rootFontSizePx: st.px })}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                            : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {st.label} · {st.px}px
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Layout size={13} />
                    Densité d&apos;Espacement
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'compact', label: 'Dense' },
                        { id: 'comfortable', label: 'Standard' },
                        { id: 'spacious', label: 'Aéré' },
                      ] as Array<{ id: AdminDensityStyle; label: string }>
                    ).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => updateDesign({ density: d.id })}
                        className={`py-2 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                          design.density === d.id
                            ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                            : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Largeur de Lecture
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'standard', label: 'Centrée' },
                        { id: 'wide', label: 'Large' },
                        { id: 'full', label: 'Plein Écran' },
                      ] as Array<{ id: AdminContentWidth; label: string }>
                    ).map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => updateDesign({ contentWidth: w.id })}
                        className={`py-2 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                          design.contentWidth === w.id
                            ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                            : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <StudioToggleRow
                  title="Contraste Élevé (Accessibilité)"
                  description="Bordures nettes et lisibilité accrue du texte"
                  checked={design.highContrast}
                  accentColor={design.accentColor}
                  onToggle={() => updateDesign({ highContrast: !design.highContrast })}
                />
                <StudioToggleRow
                  title="Animations & Transitions Fluides"
                  description="Mouvements doux et transitions de navigation"
                  checked={design.animationsEnabled}
                  accentColor={design.accentColor}
                  onToggle={() => updateDesign({ animationsEnabled: !design.animationsEnabled })}
                />
                <StudioToggleRow
                  title="Masquer les Montants Financiers (Confidentialité)"
                  description="Flouter les chiffres d'affaires en présence de clients"
                  checked={isPrivacyHidden}
                  accentColor={design.accentColor}
                  onToggle={() => setPrivacyHidden(!isPrivacyHidden)}
                />
              </div>
            </>
          )}

          {/* ================= TAB 5: FREE ARCHITECTURAL BUILDER ("MODIFY EVERYTHING") ================= */}
          {activeTab === 'custom' && (
            <>
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Wrench size={15} style={{ color: design.accentColor }} />
                    Constructeur Libre — Couleurs Exactes de l&apos;Interface
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Remplacez librement la couleur de fond, des cartes et du texte indépendamment de tout thème.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FreeColorOverrideCard
                    label="Couleur de Fond Global"
                    value={design.customBgColor}
                    fallback={theme === 'dark' ? activePresetObj.darkBg : activePresetObj.lightBg}
                    onChange={(hex) => updateDesign({ customBgColor: hex })}
                    onClear={() => updateDesign({ customBgColor: '' })}
                  />
                  <FreeColorOverrideCard
                    label="Surface des Cartes"
                    value={design.customCardColor}
                    fallback={theme === 'dark' ? '#11192c' : '#ffffff'}
                    onChange={(hex) => updateDesign({ customCardColor: hex })}
                    onClear={() => updateDesign({ customCardColor: '' })}
                  />
                  <FreeColorOverrideCard
                    label="Couleur du Texte"
                    value={design.customTextColor}
                    fallback={theme === 'dark' ? '#f8fafc' : '#0f172a'}
                    onChange={(hex) => updateDesign({ customTextColor: hex })}
                    onClear={() => updateDesign({ customTextColor: '' })}
                  />
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Arrondi Exact des Coins (Curseur en pixels)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {typeof design.customRadiusPx === 'number' ? `${design.customRadiusPx}px` : 'Auto'}
                      </span>
                      {typeof design.customRadiusPx === 'number' && (
                        <button
                          type="button"
                          onClick={() => updateDesign({ customRadiusPx: null })}
                          className="text-[10.5px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                        >
                          Auto
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={28}
                    step={2}
                    value={typeof design.customRadiusPx === 'number' ? design.customRadiusPx : 12}
                    onChange={(e) => updateDesign({ customRadiusPx: Number(e.target.value) })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: design.accentColor }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Épaisseur des Bordures
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'none', label: 'Sans' },
                          { id: 'subtle', label: 'Subtil' },
                          { id: 'crisp', label: 'Net' },
                          { id: 'bold', label: 'Marqué' },
                        ] as Array<{ id: AdminBorderStrength; label: string }>
                      ).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => updateDesign({ borderStrength: b.id })}
                          className={`py-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                            (design.borderStrength || 'crisp') === b.id
                              ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                              : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Profondeur des Ombres
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'flat', label: 'Plat' },
                          { id: 'soft', label: 'Doux' },
                          { id: 'elevated', label: 'Élevé' },
                          { id: 'dramatic', label: 'Profond' },
                        ] as Array<{ id: AdminShadowLevel; label: string }>
                      ).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => updateDesign({ shadowLevel: s.id })}
                          className={`py-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                            (design.shadowLevel || 'soft') === s.id
                              ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                              : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Style des Titres
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {(
                        [
                          { id: 'normal', label: 'Standard' },
                          { id: 'uppercase', label: 'Majuscules Studio' },
                          { id: 'editorial', label: 'Éditorial Serif' },
                        ] as Array<{ id: AdminHeadingStyle; label: string }>
                      ).map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => updateDesign({ headingStyle: h.id })}
                          className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer text-left ${
                            (design.headingStyle || 'normal') === h.id
                              ? 'border-slate-900 dark:border-sky-400 bg-slate-900/[0.04] dark:bg-sky-400/[0.08] text-slate-900 dark:text-white'
                              : 'border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <StudioToggleRow
                  title="Chiffres Tabulaires Alignés (tabular-nums)"
                  description="Garde toutes les colonnes de montants et statistiques parfaitement alignées"
                  checked={design.tabularNumbers !== false}
                  accentColor={design.accentColor}
                  onToggle={() => updateDesign({ tabularNumbers: design.tabularNumbers === false })}
                />
              </div>

              <div className="p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Code2 size={15} style={{ color: design.accentColor }} />
                      Éditeur JSON Configuration Complète
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Inspectez ou modifiez manuellement n&apos;importe quelle variable de votre thème.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRawJsonDraft(JSON.stringify(design, null, 2));
                        flashStatus('JSON actualisé depuis votre session');
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] cursor-pointer"
                    >
                      Synchroniser
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyRawJson}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white cursor-pointer"
                      style={{ backgroundColor: design.accentColor }}
                    >
                      Appliquer le JSON
                    </button>
                  </div>
                </div>
                <textarea
                  rows={10}
                  value={rawJsonDraft}
                  onChange={(e) => setRawJsonDraft(e.target.value)}
                  spellCheck={false}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-950 text-sky-300 font-mono text-[11.5px] leading-relaxed focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        {/* RIGHT 4 COLS: LIVE SHELL PREVIEW & PERSONAL SAVED PROFILES */}
        <div className="lg:col-span-4 space-y-4 sticky top-20">
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.07]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Aperçu Console en Direct
              </span>
              {statusMessage ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {statusMessage}
                </span>
              ) : (
                <span className="text-[10.5px] font-mono text-slate-400">
                  {design.glassBlurPx}px · {design.glassOpacityPct ?? 62}%
                </span>
              )}
            </div>

            <div
              className={`p-3 border border-slate-200/80 dark:border-white/10 flex gap-2.5 overflow-hidden relative ${
                design.sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'
              }`}
              style={{
                borderRadius: previewRadiusPx,
                backgroundColor: previewCanvasBg,
                fontFamily: activeFontObj.previewFont,
                color: design.customTextColor || undefined,
              }}
            >
              <span
                className="pointer-events-none absolute -top-6 -left-4 w-24 h-24 rounded-full blur-xl opacity-25"
                style={{ backgroundColor: design.accentColor }}
              />
              <span className="pointer-events-none absolute top-2 right-6 w-20 h-20 rounded-full blur-xl opacity-20 bg-indigo-400" />

              {!design.sidebarHidden && (
                <div
                  className="relative z-10 w-9 p-1.5 flex flex-col items-center justify-between shrink-0 border transition-all"
                  style={{
                    borderRadius:
                      design.sidebarShape === 'docked'
                        ? '4px'
                        : design.sidebarShape === 'pill_nav' || design.sidebarShape === 'icon_dock'
                        ? '9999px'
                        : design.sidebarShape === 'inset_frame'
                        ? '14px'
                        : '10px',
                    backgroundColor: previewSidebarBg,
                    backdropFilter: isLiquidChrome ? `blur(${Math.min(20, design.glassBlurPx)}px) saturate(200%)` : undefined,
                    borderColor: isLiquidChrome
                      ? theme === 'dark'
                        ? 'rgba(255,255,255,0.22)'
                        : 'rgba(15,23,42,0.08)'
                      : 'rgba(148,163,184,0.25)',
                  }}
                >
                  <div className="space-y-1.5 flex flex-col items-center">
                    <span
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor:
                          design.sidebarTone === 'accent_solid' ? '#ffffff' : design.accentColor,
                      }}
                    />
                    <span className="w-3.5 h-1 rounded-full bg-current opacity-35" />
                    <span className="w-3.5 h-1 rounded-full bg-current opacity-25" />
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-current opacity-30" />
                </div>
              )}

              <div className="relative z-10 flex-1 min-w-0 space-y-2.5">
                <div
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 border transition-all"
                  style={{
                    borderRadius:
                      design.headbarStyle === 'docked' || design.headbarStyle === 'minimal'
                        ? '3px'
                        : previewRadiusPx,
                    backgroundColor: previewHeadbarBg,
                    backdropFilter:
                      design.headbarStyle === 'liquid_glass' || isLiquidChrome
                        ? `blur(${Math.min(20, design.glassBlurPx)}px) saturate(200%)`
                        : undefined,
                    borderColor: isLiquidChrome
                      ? theme === 'dark'
                        ? 'rgba(255,255,255,0.22)'
                        : 'rgba(15,23,42,0.08)'
                      : 'rgba(148,163,184,0.24)',
                    color: previewHeadbarTextDarkBg ? '#f8fafc' : '#0f172a',
                  }}
                >
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold opacity-80 truncate">
                    {design.headbarShowSearch && <Search size={9} />}
                    <span>{design.headbarShowModuleBadge ? 'Console' : 'Nay'}</span>
                    {design.headbarShowClock && (
                      <span className="opacity-65 font-mono text-[8.5px]">18:05</span>
                    )}
                  </span>
                  {design.headbarShowQuickAdd && (
                    <span
                      className="px-2 py-0.5 text-[9px] font-bold shrink-0"
                      style={{
                        backgroundColor:
                          design.headbarStyle === 'accent_band' ? '#ffffff' : design.accentColor,
                        color: design.headbarStyle === 'accent_band' ? design.accentColor : '#ffffff',
                        borderRadius: previewBtnRadius,
                      }}
                    >
                      + Action
                    </span>
                  )}
                </div>

                <div
                  className="p-3 border space-y-2 transition-all"
                  style={{
                    borderRadius: previewRadiusPx,
                    backgroundColor: previewCardFill,
                    backdropFilter: isGlassSurface
                      ? design.cardStyle === 'real_glass'
                        ? `url(#nay-optical-glass) blur(${Math.min(20, design.glassBlurPx)}px) saturate(210%)`
                        : `blur(${Math.min(24, design.glassBlurPx)}px) saturate(195%)`
                      : undefined,
                    borderColor:
                      design.cardStyle === 'prism_edge'
                        ? 'rgba(99, 102, 241, 0.42)'
                        : design.cardStyle === 'real_glass' || design.cardStyle === 'frosted_crystal'
                        ? theme === 'dark'
                          ? 'rgba(255,255,255,0.28)'
                          : 'rgba(255,255,255,0.92)'
                        : design.specularRim && isLiquidChrome
                        ? theme === 'dark'
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(15,23,42,0.08)'
                        : 'rgba(148,163,184,0.22)',
                    boxShadow:
                      design.cardStyle === 'real_glass'
                        ? theme === 'dark'
                          ? 'inset 0 1.5px 1px rgba(255,255,255,0.34), 0 12px 26px -10px rgba(0,0,0,0.75)'
                          : 'inset 0 1.5px 1px rgba(255,255,255,0.96), 0 12px 24px -10px rgba(15,23,42,0.16)'
                        : design.cardStyle === 'prism_edge'
                        ? 'inset 1.5px 0 0 rgba(56,189,248,0.45), inset -1.5px 0 0 rgba(236,72,153,0.3)'
                        : design.cardStyle === 'neumorphic_soft'
                        ? theme === 'dark'
                          ? '5px 5px 12px rgba(0,0,0,0.6), -4px -4px 10px rgba(255,255,255,0.03)'
                          : '5px 5px 12px rgba(15,23,42,0.08), -5px -5px 12px rgba(255,255,255,0.92)'
                        : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-60">
                      Chiffre d&apos;Affaires
                    </span>
                    <span className="text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                      +18.4%
                    </span>
                  </div>
                  <div className="text-lg font-extrabold tabular-nums">
                    {isPrivacyHidden ? (
                      <span className="inline-flex items-center gap-1 text-xs opacity-60">
                        <EyeOff size={12} /> Masqué
                      </span>
                    ) : (
                      '27.822 MAD'
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    {activePaletteObj.colors.map((c, idx) => (
                      <div key={c} className="h-1.5 rounded-full overflow-hidden bg-slate-200/40 dark:bg-white/10">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${90 - idx * 18}%`,
                            backgroundColor: idx === 0 ? design.accentColor : c,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Mini Taskbar / Dock Preview */}
                {design.taskbarStyle !== 'none' && (
                  <div className="pt-1 flex justify-center">
                    <div
                      className={`px-3 py-1 flex items-center justify-around gap-2 transition-all border ${
                        design.taskbarStyle === 'windows_bar' ||
                        design.taskbarStyle === 'obsidian_bar' ||
                        design.taskbarStyle === 'accent_bar' ||
                        design.taskbarStyle === 'ribbon_tab' ||
                        design.taskbarStyle === 'minimal_line'
                          ? 'w-full rounded-lg'
                          : 'w-4/5 rounded-full'
                      }`}
                      style={{
                        background:
                          design.taskbarStyle === 'dynamic_island' ||
                          design.taskbarStyle === 'obsidian_bar' ||
                          design.taskbarStyle === 'neon_pulse'
                            ? '#0b1120'
                            : design.taskbarStyle === 'accent_bar'
                            ? design.accentColor
                            : design.taskbarStyle === 'minimal_line'
                            ? 'transparent'
                            : theme === 'dark'
                            ? 'rgba(15,23,42,0.88)'
                            : 'rgba(255,255,255,0.90)',
                        borderColor:
                          design.taskbarStyle === 'neon_pulse'
                            ? design.accentColor
                            : 'rgba(148,163,184,0.28)',
                        borderTopWidth: design.taskbarStyle === 'ribbon_tab' ? '2px' : undefined,
                        borderTopColor: design.taskbarStyle === 'ribbon_tab' ? design.accentColor : undefined,
                      }}
                    >
                      {[0, 1, 2, 3].map((dot) => (
                        <span
                          key={dot}
                          className="w-2 h-2 rounded-full transition-colors"
                          style={{
                            backgroundColor:
                              dot === 0
                                ? design.taskbarStyle === 'accent_bar'
                                  ? '#ffffff'
                                  : design.accentColor
                                : design.taskbarStyle === 'accent_bar'
                                ? 'rgba(255,255,255,0.6)'
                                : 'rgba(148,163,184,0.5)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.07] space-y-2.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mes Favoris Personnels
              </div>

              <form onSubmit={handleSaveProfile} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Nom (ex: Mon iOS 27)"
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <BookmarkPlus size={12} />
                  <span>Sauver</span>
                </button>
              </form>

              {savedProfiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {savedProfiles.map((prof) => (
                    <div
                      key={prof.id}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-[11px]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          applySavedProfile(prof.id);
                          flashStatus(`« ${prof.name} » chargé`);
                        }}
                        className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 hover:underline cursor-pointer"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: prof.design.accentColor }}
                        />
                        <span>{prof.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedProfile(prof.id)}
                        aria-label={`Supprimer ${prof.name}`}
                        className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors">
                  <Upload size={11.5} />
                  <span>Importer</span>
                  <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                >
                  <Download size={11.5} />
                  <span>Exporter</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetDesign();
                  flashStatus('Défaut restauré');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/[0.06] cursor-pointer transition-colors"
              >
                <RotateCcw size={11.5} />
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
