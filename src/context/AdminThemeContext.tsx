'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

type Theme = 'light' | 'dark';

export type AdminStylePreset =
  | 'liquid_glass'
  | 'vision_aero'
  | 'atelier'
  | 'obsidian_gold'
  | 'ivory'
  | 'graphite'
  | 'emerald'
  | 'cobalt'
  | 'rose_quartz'
  | 'midnight_steel'
  | 'sandstone'
  | 'lavender_mist'
  | 'oceanic_neon'
  | 'champagne_silk'
  | 'arctic_sunset'
  | 'carbon_matrix'
  | 'velvet_burgundy'
  | 'cypress_olive'
  | 'azure_riviera'
  | 'saffron_amber'
  | 'plum_noir'
  | 'monaco_cream'
  | 'nordic_frost'
  | 'cyber_violet'
  | 'crystal_refraction'
  | 'prism_aurora'
  | 'obsidian_mercury'
  | 'smoked_quartz'
  | 'amber_cognac'
  | 'sapphire_mirror';

export type AdminFontChoice =
  | 'inter'
  | 'jakarta'
  | 'manrope'
  | 'dm_sans'
  | 'serif'
  | 'cormorant'
  | 'mono'
  | 'system';

export type AdminCardStyle =
  | 'real_glass'
  | 'frosted_crystal'
  | 'prism_edge'
  | 'tinted_smoke'
  | 'liquid'
  | 'glass'
  | 'elevated'
  | 'bordered'
  | 'flat'
  | 'neumorphic_soft';
export type AdminRadiusStyle = 'sharp' | 'balanced' | 'pill';
export type AdminDensityStyle = 'compact' | 'comfortable' | 'spacious';
export type AdminSidebarTone =
  | 'auto'
  | 'liquid_glass'
  | 'translucent'
  | 'obsidian'
  | 'midnight_blue'
  | 'tinted'
  | 'accent_solid'
  | 'minimal_border'
  | 'espresso_lux'
  | 'forest_velvet'
  | 'burgundy_atelier'
  | 'frosted_iris'
  | 'graphite_rail'
  | 'linen_paper';
export type AdminSidebarShape = 'floating' | 'docked' | 'pill_nav' | 'inset_frame' | 'icon_dock';
export type AdminSidebarPosition = 'left' | 'right';
export type AdminContentWidth = 'standard' | 'wide' | 'full';
export type AdminHeadbarStyle =
  | 'floating'
  | 'liquid_glass'
  | 'docked'
  | 'obsidian'
  | 'accent_band'
  | 'capsule_split'
  | 'compact_slim'
  | 'minimal'
  | 'translucent_frosted'
  | 'gradient_aurora'
  | 'double_decker'
  | 'monochrome_ink'
  | 'glass_pill_center'
  | 'bordered_architect';
export type AdminTaskbarStyle =
  | 'floating_dock'
  | 'windows_bar'
  | 'dynamic_island'
  | 'glass_shelf'
  | 'capsule_split'
  | 'obsidian_bar'
  | 'accent_bar'
  | 'minimal_line'
  | 'ribbon_tab'
  | 'neon_pulse'
  | 'compact_pills'
  | 'none';
export type AdminTaskbarPosition = 'bottom' | 'bottom_raised';
export type AdminBackgroundEffect =
  | 'aurora'
  | 'crystal_caustics'
  | 'bokeh_orbs'
  | 'silk_waves'
  | 'prismatic_rays'
  | 'nebula_mesh'
  | 'editorial_grain'
  | 'grid'
  | 'dots'
  | 'solid';
export type AdminPillStyle = 'rounded' | 'square' | 'capsule';
export type AdminTableStyle = 'clean' | 'striped' | 'cards';
export type AdminChartPalette = 'default' | 'monochrome' | 'luxury_gold' | 'emerald_pro';
export type AdminBorderStrength = 'none' | 'subtle' | 'crisp' | 'bold';
export type AdminShadowLevel = 'flat' | 'soft' | 'elevated' | 'dramatic';
export type AdminHeadingStyle = 'normal' | 'uppercase' | 'editorial';

export interface AdminDesignConfig {
  stylePreset: AdminStylePreset;
  accentColor: string;
  fontFamily: AdminFontChoice;
  rootFontSizePx: number;
  cardStyle: AdminCardStyle;
  borderRadius: AdminRadiusStyle;
  density: AdminDensityStyle;
  glassBlurPx: number;
  glassOpacityPct: number;
  specularRim: boolean;
  cardHoverLift: boolean;
  sidebarTone: AdminSidebarTone;
  sidebarShape: AdminSidebarShape;
  sidebarPosition: AdminSidebarPosition;
  sidebarHidden: boolean;
  sidebarWidthPx: number;
  sidebarShowSearch: boolean;
  sidebarShowBadges: boolean;
  sidebarShowFooter: boolean;
  headbarStyle: AdminHeadbarStyle;
  headbarHeightPx: number;
  headbarShowClock: boolean;
  headbarShowSearch: boolean;
  headbarShowQuickAdd: boolean;
  headbarShowModuleBadge: boolean;
  taskbarStyle: AdminTaskbarStyle;
  taskbarPosition: AdminTaskbarPosition;
  taskbarShowOnDesktop: boolean;
  taskbarShowLabels: boolean;
  taskbarCompact: boolean;
  backgroundEffect: AdminBackgroundEffect;
  pillStyle: AdminPillStyle;
  tableStyle: AdminTableStyle;
  chartPalette: AdminChartPalette;
  contentWidth: AdminContentWidth;
  highContrast: boolean;
  animationsEnabled: boolean;
  customBgColor: string;
  customCardColor: string;
  customTextColor: string;
  customRadiusPx: number | null;
  borderStrength: AdminBorderStrength;
  shadowLevel: AdminShadowLevel;
  tabularNumbers: boolean;
  headingStyle: AdminHeadingStyle;
}

export interface SavedAppearanceProfile {
  id: string;
  name: string;
  theme: Theme;
  design: AdminDesignConfig;
  createdAt: string;
}

export interface AdminPreferenceOwner {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const DEFAULT_ADMIN_DESIGN: AdminDesignConfig = {
  stylePreset: 'atelier',
  accentColor: '#0ea5e9',
  fontFamily: 'inter',
  rootFontSizePx: 16,
  cardStyle: 'glass',
  borderRadius: 'balanced',
  density: 'comfortable',
  glassBlurPx: 24,
  glassOpacityPct: 62,
  specularRim: true,
  cardHoverLift: true,
  sidebarTone: 'auto',
  sidebarShape: 'floating',
  sidebarPosition: 'left',
  sidebarHidden: false,
  sidebarWidthPx: 278,
  sidebarShowSearch: true,
  sidebarShowBadges: true,
  sidebarShowFooter: true,
  headbarStyle: 'floating',
  headbarHeightPx: 54,
  headbarShowClock: true,
  headbarShowSearch: true,
  headbarShowQuickAdd: true,
  headbarShowModuleBadge: true,
  taskbarStyle: 'floating_dock',
  taskbarPosition: 'bottom_raised',
  taskbarShowOnDesktop: false,
  taskbarShowLabels: true,
  taskbarCompact: false,
  backgroundEffect: 'aurora',
  pillStyle: 'rounded',
  tableStyle: 'clean',
  chartPalette: 'default',
  contentWidth: 'wide',
  highContrast: false,
  animationsEnabled: true,
  customBgColor: '',
  customCardColor: '',
  customTextColor: '',
  customRadiusPx: null,
  borderStrength: 'crisp',
  shadowLevel: 'soft',
  tabularNumbers: true,
  headingStyle: 'normal',
};

export const ADMIN_STYLE_PRESETS: Array<{
  id: AdminStylePreset;
  name: string;
  tagline: string;
  lightBg: string;
  darkBg: string;
  defaultAccent: string;
}> = [
  { id: 'liquid_glass', name: 'iOS 27 Liquid Glass', tagline: 'Verre réfracté & halos spatiaux', lightBg: '#f3f5fa', darkBg: '#030816', defaultAccent: '#007AFF' },
  { id: 'vision_aero', name: 'Cupertino Spatial', tagline: 'Titane givré & verre mat', lightBg: '#eef1f6', darkBg: '#090d14', defaultAccent: '#0284c7' },
  { id: 'atelier', name: 'Atelier Arctic', tagline: 'Glace opale & obsidienne', lightBg: '#eef3fb', darkBg: '#060913', defaultAccent: '#0ea5e9' },
  { id: 'obsidian_gold', name: 'Noir & Or Maison', tagline: 'Albâtre chaud & or brossé', lightBg: '#faf7f0', darkBg: '#0c0b09', defaultAccent: '#b45309' },
  { id: 'ivory', name: 'Ivoire Éditorial', tagline: 'Lin champagne & charbon', lightBg: '#f6f3ec', darkBg: '#12100e', defaultAccent: '#a16207' },
  { id: 'graphite', name: 'Graphite Suisse', tagline: 'Titane monochrome précis', lightBg: '#f1f3f5', darkBg: '#0b0c0e', defaultAccent: '#18181b' },
  { id: 'emerald', name: 'Verger & Sauge', tagline: 'Brume botanique & pin', lightBg: '#eef5f1', darkBg: '#07120e', defaultAccent: '#059669' },
  { id: 'cobalt', name: 'Encre & Saphir', tagline: 'Bleu royal & papier vergé', lightBg: '#ecf1fa', darkBg: '#060a18', defaultAccent: '#2563eb' },
  { id: 'rose_quartz', name: 'Quartz & Pivoine', tagline: 'Porcelaine rosée & prune', lightBg: '#faf4f7', darkBg: '#140b12', defaultAccent: '#be185d' },
  { id: 'midnight_steel', name: 'Acier Nordique', tagline: 'Ardoise glacée & cobalt', lightBg: '#edf1f6', darkBg: '#070b14', defaultAccent: '#3b82f6' },
  { id: 'sandstone', name: 'Grès & Terracotta', tagline: 'Sable minéral & terre cuite', lightBg: '#f5efe6', darkBg: '#14100d', defaultAccent: '#c2410c' },
  { id: 'lavender_mist', name: 'Brume Iris & Nuit', tagline: 'Perle irisée & indigo', lightBg: '#f2f2fa', darkBg: '#090915', defaultAccent: '#4f46e5' },
  { id: 'oceanic_neon', name: 'Océan & Lagon', tagline: 'Cristal turquoise & abysse', lightBg: '#e4f4fa', darkBg: '#030d14', defaultAccent: '#0891b2' },
  { id: 'champagne_silk', name: 'Soie Champagne', tagline: 'Satin beige & ombre douce', lightBg: '#f8f4ed', darkBg: '#16120f', defaultAccent: '#92400e' },
  { id: 'arctic_sunset', name: 'Aurore & Corail', tagline: 'Brume rosée & rubis discret', lightBg: '#fdf2f0', darkBg: '#150a0c', defaultAccent: '#e11d48' },
  { id: 'carbon_matrix', name: 'Carbone & Émeraude', tagline: 'Studio fintech haute tenue', lightBg: '#edf4f0', darkBg: '#040a07', defaultAccent: '#10b981' },
  { id: 'velvet_burgundy', name: 'Velours Bordeaux', tagline: 'Cramoisi haute couture & ivoire', lightBg: '#f4eaed', darkBg: '#16080d', defaultAccent: '#9f1239' },
  { id: 'cypress_olive', name: 'Cyprès & Olive', tagline: 'Botanique méditerranéenne & sauge', lightBg: '#eaede6', darkBg: '#0b120c', defaultAccent: '#4d7c0f' },
  { id: 'azure_riviera', name: 'Riviera Azur', tagline: 'Calcaire clair & bleu marin', lightBg: '#e4eef7', darkBg: '#061124', defaultAccent: '#0284c7' },
  { id: 'saffron_amber', name: 'Safran & Ambre', tagline: 'Miel doré & bois d’ébène', lightBg: '#f5ecdc', darkBg: '#150f08', defaultAccent: '#d97706' },
  { id: 'plum_noir', name: 'Prune Impériale', tagline: 'Parme satinée & velours violet', lightBg: '#efeaf6', darkBg: '#110a1c', defaultAccent: '#7c3aed' },
  { id: 'monaco_cream', name: 'Monaco Crème', tagline: 'Pierre blonde & cacao foncé', lightBg: '#f1ece2', darkBg: '#120e0b', defaultAccent: '#78350f' },
  { id: 'nordic_frost', name: 'Glacier Nordique', tagline: 'Givre arctique & pin fjord', lightBg: '#e5edf2', darkBg: '#071016', defaultAccent: '#0f766e' },
  { id: 'cyber_violet', name: 'Studio Prisma', tagline: 'Brume perle & ultraviolet pur', lightBg: '#eceaf7', darkBg: '#080716', defaultAccent: '#6366f1' },
  { id: 'crystal_refraction', name: 'Cristal Optique Pur', tagline: 'Réfraction SVG réelle & bokeh céleste', lightBg: '#dde8f6', darkBg: '#040a16', defaultAccent: '#007AFF' },
  { id: 'prism_aurora', name: 'Prisme Boréal', tagline: 'Dispersion chromatique & halo cristal', lightBg: '#e3ecfa', darkBg: '#060918', defaultAccent: '#6366f1' },
  { id: 'obsidian_mercury', name: 'Mercure & Titane', tagline: 'Verre miroir froid & métal brossé', lightBg: '#e1e5eb', darkBg: '#080a0f', defaultAccent: '#334155' },
  { id: 'smoked_quartz', name: 'Quartz Fumé Atelier', tagline: 'Cristal teinté minéral & bronze', lightBg: '#ebe4e0', darkBg: '#120e0d', defaultAccent: '#92400e' },
  { id: 'amber_cognac', name: 'Cognac & Ambre', tagline: 'Chaleur dorée & verre fumé chaud', lightBg: '#f3e7d8', darkBg: '#160e07', defaultAccent: '#b45309' },
  { id: 'sapphire_mirror', name: 'Miroir Saphir Royal', tagline: 'Reflets cobalt profonds & biseau clair', lightBg: '#dbe7f8', darkBg: '#03091a', defaultAccent: '#1d4ed8' },
];

export const ADMIN_ACCENT_SWATCHES: Array<{ label: string; hex: string }> = [
  { label: 'Apple Sapphire', hex: '#007AFF' },
  { label: 'Céruléen', hex: '#0ea5e9' },
  { label: 'Riviera', hex: '#0284c7' },
  { label: 'Saphir', hex: '#2563eb' },
  { label: 'Obsidienne', hex: '#0f172a' },
  { label: 'Or Brossé', hex: '#b45309' },
  { label: 'Ambre Safran', hex: '#d97706' },
  { label: 'Cacao Atelier', hex: '#78350f' },
  { label: 'Terracotta', hex: '#c2410c' },
  { label: 'Émeraude', hex: '#059669' },
  { label: 'Fjord Sarcelle', hex: '#0f766e' },
  { label: 'Olive Cyprès', hex: '#4d7c0f' },
  { label: 'Indigo Prisma', hex: '#6366f1' },
  { label: 'Prune Royale', hex: '#7c3aed' },
  { label: 'Bordeaux', hex: '#9f1239' },
  { label: 'Pivoine', hex: '#be185d' },
];

export const DESIGN_STORAGE_KEY = 'nay_admin_design_v1';
export const SAVED_PROFILES_STORAGE_KEY = 'nay_admin_saved_profiles_v1';

function darkenHex(hex: string, ratio = 0.14): string {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '#0284c7';
  const r = Math.max(0, Math.round(parseInt(clean.slice(0, 2), 16) * (1 - ratio)));
  const g = Math.max(0, Math.round(parseInt(clean.slice(2, 4), 16) * (1 - ratio)));
  const b = Math.max(0, Math.round(parseInt(clean.slice(4, 6), 16) * (1 - ratio)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return `rgba(14, 165, 233, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function applyDesignToDom(design: AdminDesignConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-admin-style', design.stylePreset);
  root.setAttribute('data-admin-font', design.fontFamily);
  root.setAttribute('data-admin-card', design.cardStyle);
  root.setAttribute('data-admin-radius', design.borderRadius);
  root.setAttribute('data-admin-density', design.density);
  root.setAttribute('data-admin-specular', design.specularRim === false ? 'off' : 'on');
  root.setAttribute('data-admin-hover-lift', design.cardHoverLift === false ? 'off' : 'on');
  root.setAttribute('data-admin-sidebar', design.sidebarTone || 'auto');
  root.setAttribute('data-admin-sidebar-shape', design.sidebarShape || 'floating');
  root.setAttribute('data-admin-sidebar-pos', design.sidebarPosition || 'left');
  root.setAttribute('data-admin-sidebar-hidden', design.sidebarHidden ? 'true' : 'false');
  root.setAttribute('data-admin-headbar', design.headbarStyle || 'floating');
  root.setAttribute('data-admin-taskbar', design.taskbarStyle || 'floating_dock');
  root.setAttribute('data-admin-taskbar-pos', design.taskbarPosition || 'bottom_raised');
  root.setAttribute('data-admin-taskbar-desktop', design.taskbarShowOnDesktop ? 'on' : 'off');
  root.setAttribute('data-admin-taskbar-labels', design.taskbarShowLabels === false ? 'off' : 'on');
  root.setAttribute('data-admin-taskbar-compact', design.taskbarCompact ? 'on' : 'off');
  root.setAttribute('data-admin-bg', design.backgroundEffect || 'aurora');
  root.setAttribute('data-admin-pill', design.pillStyle || 'rounded');
  root.setAttribute('data-admin-table', design.tableStyle || 'clean');
  root.setAttribute('data-admin-chart', design.chartPalette || 'default');
  root.setAttribute('data-admin-width', design.contentWidth || 'wide');
  root.setAttribute('data-admin-contrast', design.highContrast ? 'high' : 'normal');
  root.setAttribute('data-admin-motion', design.animationsEnabled ? 'on' : 'off');
  root.setAttribute('data-admin-sb-badges', design.sidebarShowBadges === false ? 'off' : 'on');
  root.setAttribute('data-admin-border-strength', design.borderStrength || 'crisp');
  root.setAttribute('data-admin-shadow', design.shadowLevel || 'soft');
  root.setAttribute('data-admin-tabular', design.tabularNumbers === false ? 'off' : 'on');
  root.setAttribute('data-admin-heading-style', design.headingStyle || 'normal');

  const isHex = (v: string | undefined) => !!v && /^#[0-9a-fA-F]{6}$/.test(v);
  root.setAttribute('data-admin-custom-bg', isHex(design.customBgColor) ? 'on' : 'off');
  if (isHex(design.customBgColor)) root.style.setProperty('--admin-custom-bg', design.customBgColor);
  else root.style.removeProperty('--admin-custom-bg');

  root.setAttribute('data-admin-custom-card', isHex(design.customCardColor) ? 'on' : 'off');
  if (isHex(design.customCardColor)) root.style.setProperty('--admin-custom-card', design.customCardColor);
  else root.style.removeProperty('--admin-custom-card');

  root.setAttribute('data-admin-custom-text', isHex(design.customTextColor) ? 'on' : 'off');
  if (isHex(design.customTextColor)) root.style.setProperty('--admin-custom-text', design.customTextColor);
  else root.style.removeProperty('--admin-custom-text');

  if (typeof design.customRadiusPx === 'number' && !Number.isNaN(design.customRadiusPx)) {
    const r = Math.min(28, Math.max(0, design.customRadiusPx));
    root.setAttribute('data-admin-custom-radius', 'on');
    root.style.setProperty('--admin-custom-radius', `${r}px`);
  } else {
    root.setAttribute('data-admin-custom-radius', 'off');
    root.style.removeProperty('--admin-custom-radius');
  }

  const sbWidth = Math.min(340, Math.max(220, Number(design.sidebarWidthPx) || 278));
  root.style.setProperty('--admin-sidebar-w', `${sbWidth}px`);

  const hbHeight = Math.min(68, Math.max(42, Number(design.headbarHeightPx) || 54));
  root.style.setProperty('--admin-headbar-h', `${hbHeight}px`);

  const safeAccent = /^#[0-9a-fA-F]{6}$/.test(design.accentColor)
    ? design.accentColor
    : DEFAULT_ADMIN_DESIGN.accentColor;

  root.style.setProperty('--admin-accent', safeAccent);
  root.style.setProperty('--admin-accent-hover', darkenHex(safeAccent, 0.14));
  root.style.setProperty('--admin-accent-soft', hexToRgba(safeAccent, 0.12));
  root.style.setProperty('--admin-accent-tint', hexToRgba(safeAccent, 0.08));
  root.style.setProperty('--admin-accent-ring', hexToRgba(safeAccent, 0.24));

  const blurPx = Math.min(44, Math.max(4, Number(design.glassBlurPx ?? 24)));
  root.style.setProperty('--admin-glass-blur', `${blurPx}px`);

  const opPct = Math.min(95, Math.max(22, Number(design.glassOpacityPct ?? 62)));
  root.style.setProperty('--admin-glass-alpha', (opPct / 100).toFixed(2));
  root.style.setProperty('--admin-glass-alpha-low', Math.max(0.2, (opPct - 12) / 100).toFixed(2));

  const clampedPx = Math.min(19, Math.max(13, Number(design.rootFontSizePx) || 16));
  root.style.setProperty('--admin-root-font-size', `${clampedPx}px`);
  root.style.fontSize = `${clampedPx}px`;
}

interface AdminThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isPrivacyHidden: boolean;
  togglePrivacy: () => void;
  setPrivacyHidden: (hidden: boolean) => void;
  design: AdminDesignConfig;
  updateDesign: (patch: Partial<AdminDesignConfig>) => void;
  resetDesign: () => void;
  savedProfiles: SavedAppearanceProfile[];
  saveCurrentProfile: (name: string) => void;
  applySavedProfile: (id: string) => void;
  deleteSavedProfile: (id: string) => void;
  accountOwner: AdminPreferenceOwner | null;
  syncStatus: 'idle' | 'saving' | 'saved' | 'local';
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(true);
  const [isPrivacyHidden, setIsPrivacyHiddenState] = useState(false);
  const [design, setDesign] = useState<AdminDesignConfig>(DEFAULT_ADMIN_DESIGN);
  const [savedProfiles, setSavedProfiles] = useState<SavedAppearanceProfile[]>([]);
  const [accountOwner, setAccountOwner] = useState<AdminPreferenceOwner | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'local'>('idle');
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUserMutatedRef = useRef<boolean>(false);
  const themeRef = useRef<Theme>('light');
  const designRef = useRef<AdminDesignConfig>(DEFAULT_ADMIN_DESIGN);
  const profilesRef = useRef<SavedAppearanceProfile[]>([]);

  const applyTheme = useCallback((t: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (t === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    }
  }, []);

  const persistPreferencesToServer = useCallback(
    (
      nextTheme: Theme,
      nextDesign: AdminDesignConfig,
      userId?: string,
      nextProfiles?: SavedAppearanceProfile[]
    ) => {
      const profilesToSave = nextProfiles ?? profilesRef.current;
      try {
        localStorage.setItem('nay_admin_theme', nextTheme);
        localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(nextDesign));
        localStorage.setItem(SAVED_PROFILES_STORAGE_KEY, JSON.stringify(profilesToSave));
        if (userId) {
          localStorage.setItem(
            `nay_admin_prefs_user_${userId}`,
            JSON.stringify({ theme: nextTheme, design: nextDesign, savedProfiles: profilesToSave })
          );
        }
      } catch {
        // ignore storage errors
      }

      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      setSyncStatus('saving');
      syncTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/admin/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              theme: nextTheme,
              design: nextDesign,
              savedProfiles: profilesToSave,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            setSyncStatus(json.persistedToDb ? 'saved' : 'local');
          } else {
            setSyncStatus('local');
          }
        } catch {
          setSyncStatus('local');
        }
      }, 280);
    },
    []
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem('nay_admin_theme') as Theme | null;
    const initTheme: Theme = savedTheme === 'dark' ? 'dark' : 'light';
    setThemeState(initTheme);
    themeRef.current = initTheme;
    applyTheme(initTheme);

    const savedSidebar = localStorage.getItem('nay_admin_sidebar_collapsed');
    setIsSidebarCollapsedState(savedSidebar !== 'false');

    const savedPrivacy = localStorage.getItem('nay_admin_privacy_hidden');
    if (savedPrivacy === 'true') {
      setIsPrivacyHiddenState(true);
      document.documentElement.classList.add('nay-privacy-active');
    }

    let initialDesign = DEFAULT_ADMIN_DESIGN;
    try {
      const rawDesign = localStorage.getItem(DESIGN_STORAGE_KEY);
      if (rawDesign) initialDesign = { ...DEFAULT_ADMIN_DESIGN, ...JSON.parse(rawDesign) };
      const rawProfiles = localStorage.getItem(SAVED_PROFILES_STORAGE_KEY);
      if (rawProfiles) {
        const parsedP = JSON.parse(rawProfiles);
        if (Array.isArray(parsedP)) {
          setSavedProfiles(parsedP);
          profilesRef.current = parsedP;
        }
      }
    } catch {
      // ignore parse errors
    }
    setDesign(initialDesign);
    designRef.current = initialDesign;
    applyDesignToDom(initialDesign);

    let cancelled = false;
    fetch('/api/admin/preferences')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.user) return;
        setAccountOwner(data.user);

        if (hasUserMutatedRef.current) return;

        let resolvedPrefs = data.preferences;
        if (!resolvedPrefs) {
          try {
            const perUser = localStorage.getItem(`nay_admin_prefs_user_${data.user.id}`);
            if (perUser) resolvedPrefs = JSON.parse(perUser);
          } catch {
            // ignore
          }
        }

        if (resolvedPrefs) {
          const dbTheme: Theme = resolvedPrefs.theme === 'dark' ? 'dark' : 'light';
          const dbDesign: AdminDesignConfig = {
            ...DEFAULT_ADMIN_DESIGN,
            ...(resolvedPrefs.design || {}),
          };
          const dbProfiles: SavedAppearanceProfile[] = Array.isArray(resolvedPrefs.savedProfiles)
            ? resolvedPrefs.savedProfiles
            : profilesRef.current;

          setThemeState(dbTheme);
          themeRef.current = dbTheme;
          applyTheme(dbTheme);

          setDesign(dbDesign);
          designRef.current = dbDesign;
          applyDesignToDom(dbDesign);

          setSavedProfiles(dbProfiles);
          profilesRef.current = dbProfiles;

          try {
            localStorage.setItem('nay_admin_theme', dbTheme);
            localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(dbDesign));
            localStorage.setItem(SAVED_PROFILES_STORAGE_KEY, JSON.stringify(dbProfiles));
            localStorage.setItem(
              `nay_admin_prefs_user_${data.user.id}`,
              JSON.stringify({ theme: dbTheme, design: dbDesign, savedProfiles: dbProfiles })
            );
          } catch {
            // ignore
          }
          setSyncStatus('saved');
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [applyTheme]);

  const setTheme = (newTheme: Theme) => {
    hasUserMutatedRef.current = true;
    setThemeState(newTheme);
    themeRef.current = newTheme;
    applyTheme(newTheme);
    persistPreferencesToServer(newTheme, designRef.current, accountOwner?.id);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    localStorage.setItem('nay_admin_sidebar_collapsed', String(collapsed));
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const setPrivacyHidden = (hidden: boolean) => {
    setIsPrivacyHiddenState(hidden);
    localStorage.setItem('nay_admin_privacy_hidden', String(hidden));
    if (typeof document !== 'undefined') {
      if (hidden) {
        document.documentElement.classList.add('nay-privacy-active');
      } else {
        document.documentElement.classList.remove('nay-privacy-active');
      }
      window.dispatchEvent(new CustomEvent('nay_privacy_toggle', { detail: { hidden } }));
    }
  };

  const togglePrivacy = () => {
    setPrivacyHidden(!isPrivacyHidden);
  };

  const updateDesign = useCallback(
    (patch: Partial<AdminDesignConfig>) => {
      hasUserMutatedRef.current = true;
      setDesign((prev) => {
        const next = { ...prev, ...patch };
        designRef.current = next;
        applyDesignToDom(next);
        persistPreferencesToServer(themeRef.current, next, accountOwner?.id);
        return next;
      });
    },
    [accountOwner?.id, persistPreferencesToServer]
  );

  const resetDesign = useCallback(() => {
    hasUserMutatedRef.current = true;
    setDesign(DEFAULT_ADMIN_DESIGN);
    designRef.current = DEFAULT_ADMIN_DESIGN;
    applyDesignToDom(DEFAULT_ADMIN_DESIGN);
    setThemeState('light');
    themeRef.current = 'light';
    applyTheme('light');
    persistPreferencesToServer('light', DEFAULT_ADMIN_DESIGN, accountOwner?.id);
  }, [accountOwner?.id, applyTheme, persistPreferencesToServer]);

  const saveCurrentProfile = useCallback(
    (name: string) => {
      const cleanName = name.trim().slice(0, 32);
      if (!cleanName) return;
      const newEntry: SavedAppearanceProfile = {
        id: `prof-${Date.now().toString(36)}`,
        name: cleanName,
        theme: themeRef.current,
        design: { ...designRef.current },
        createdAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...profilesRef.current].slice(0, 6);
      setSavedProfiles(updated);
      profilesRef.current = updated;
      persistPreferencesToServer(themeRef.current, designRef.current, accountOwner?.id, updated);
    },
    [accountOwner?.id, persistPreferencesToServer]
  );

  const applySavedProfile = useCallback(
    (id: string) => {
      hasUserMutatedRef.current = true;
      const found = profilesRef.current.find((p) => p.id === id);
      if (!found) return;
      const nextTheme: Theme = found.theme === 'dark' ? 'dark' : 'light';
      const nextDesign: AdminDesignConfig = { ...DEFAULT_ADMIN_DESIGN, ...found.design };
      setThemeState(nextTheme);
      themeRef.current = nextTheme;
      applyTheme(nextTheme);
      setDesign(nextDesign);
      designRef.current = nextDesign;
      applyDesignToDom(nextDesign);
      persistPreferencesToServer(nextTheme, nextDesign, accountOwner?.id);
    },
    [accountOwner?.id, applyTheme, persistPreferencesToServer]
  );

  const deleteSavedProfile = useCallback(
    (id: string) => {
      const updated = profilesRef.current.filter((p) => p.id !== id);
      setSavedProfiles(updated);
      profilesRef.current = updated;
      persistPreferencesToServer(themeRef.current, designRef.current, accountOwner?.id, updated);
    },
    [accountOwner?.id, persistPreferencesToServer]
  );

  return (
    <AdminThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark: theme === 'dark',
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        isPrivacyHidden,
        togglePrivacy,
        setPrivacyHidden,
        design,
        updateDesign,
        resetDesign,
        savedProfiles,
        saveCurrentProfile,
        applySavedProfile,
        deleteSavedProfile,
        accountOwner,
        syncStatus,
      }}
    >
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (context === undefined) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider');
  }
  return context;
}
