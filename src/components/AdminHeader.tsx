'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  ShieldCheck, 
  History, 
  LogOut, 
  ExternalLink, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Bell,
  MessageSquare,
  Package,
  ShoppingBag,
  CheckSquare,
  AlertTriangle,
  Info,
  Check,
  X,
  Clock,
  Sun,
  Moon,
  Search,
  Command,
  Plus,
  Sparkles,
  BarChart3,
  Boxes,
  Users,
  Coins,
  Settings,
  HelpCircle,
  Download,
  Share2,
  Radio,
  ArrowRight,
  Globe2,
  Home,
  Palette,
  PanelLeftOpen,
  Menu
} from 'lucide-react';
import { useAdminTheme } from '@/context/AdminThemeContext';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isOwner?: boolean;
  avatar?: string | null;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

const WORKSPACE_COMMANDS = [
  { label: 'Tableau de Bord Global', path: '/admin', icon: BarChart3, category: 'Pilotage', shortcut: 'D' },
  { label: 'Commandes & Suivi Logistique', path: '/admin/orders', icon: ShoppingBag, category: 'Ventes', badge: 'Direct' },
  { label: 'Catalogue des Parfums & Testeurs', path: '/admin/products', icon: Package, category: 'Catalogue' },
  { label: 'Inventaire & Alertes de Stock', path: '/admin/inventory', icon: Boxes, category: 'Catalogue' },
  { label: 'Finance, Marges & Trésorerie NAY', path: '/admin/finance', icon: Coins, category: 'Finance', badge: 'Fintech' },
  { label: 'Gestionnaire Publicités (Meta Ads)', path: '/admin/ads', icon: Sparkles, category: 'Marketing', badge: 'Live' },
  { label: 'Marketing & Rétention Client', path: '/admin/marketing', icon: Share2, category: 'Marketing' },
  { label: 'Landing Pages & Studio Créatif AI', path: '/admin/landing-pages', icon: Globe2, category: 'Croissance' },
  { label: 'Blog & Rédaction SEO IA', path: '/admin/blog', icon: BarChart3, category: 'SEO' },
  { label: 'Fichier Clients & CRM', path: '/admin/customers', icon: Users, category: 'Clients' },
  { label: 'Équipe, Paie & Gouvernance', path: '/admin/team', icon: ShieldCheck, category: 'RH' },
  { label: 'Missions & Tâches Kanban', path: '/admin/tasks', icon: CheckSquare, category: 'Équipe' },
  { label: 'NAY Connect (Messagerie)', path: '/admin/chat', icon: MessageSquare, category: 'Équipe' },
  { label: 'Santé Système & Statuts APIs', path: '/admin/system/health', icon: Radio, category: 'Système' },
  { label: 'Journal d\'Activité & Audit', path: '/admin/activity', icon: History, category: 'Sécurité' },
  { label: 'Mon Apparence & Studio Design', path: '/admin/appearance', icon: Palette, category: 'Personnel' },
  { label: 'Paramètres Généraux de la Boutique', path: '/admin/settings', icon: Settings, category: 'Système' },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, isDark, design, updateDesign } = useAdminTheme();

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentTimeCasablanca, setCurrentTimeCasablanca] = useState('');
  const [canInstall, setCanInstall] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  // Listen for PWA installability
  useEffect(() => {
    const handleCanInstall = () => setCanInstall(true);
    window.addEventListener('nay_pwa_can_install', handleCanInstall);
    return () => window.removeEventListener('nay_pwa_can_install', handleCanInstall);
  }, []);

  // Global Command Palette Shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  // Focus palette input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => paletteInputRef.current?.focus(), 80);
    } else {
      setPaletteQuery('');
    }
  }, [isCommandPaletteOpen]);

  // Live Clock in official Africa/Casablanca Moroccan time (GMT+1)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
      const moroccoDate = new Date(utcMs + (3600 * 1000));
      
      const hours = String(moroccoDate.getHours()).padStart(2, '0');
      const minutes = String(moroccoDate.getMinutes()).padStart(2, '0');
      const seconds = String(moroccoDate.getSeconds()).padStart(2, '0');
      setCurrentTimeCasablanca(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD' | 'SECURITY' | 'ORDER'>('ALL');

  // Fetch Current Admin Profile
  useEffect(() => {
    if (pathname === '/admin/login') return;
    let isMounted = true;
    async function fetchMe() {
      try {
        const res = await fetch('/api/admin/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setCurrentUser(data.user);
          }
        }
      } catch (err) {
        console.error('Failed to load admin profile in header:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchMe();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setIsQuickAddOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      isMounted = false;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pathname]);

  // Fetch Notifications & Polling
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=20');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications in header:', err);
    }
  }, []);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    fetchNotifications();

    const handleRealtimeNotif = (e: any) => {
      const newNotif = e.detail;
      if (newNotif && newNotif.id) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev.slice(0, 6)];
        });
        setUnreadCount((prev) => prev + 1);
      }
    };

    window.addEventListener('nay_new_notification', handleRealtimeNotif);
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      window.removeEventListener('nay_new_notification', handleRealtimeNotif);
      clearInterval(interval);
    };
  }, [fetchNotifications, pathname]);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nay_admin_logout'));
      }
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/admin/login';
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    setIsNotifOpen(false);
    if (!notif.isRead) {
      fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
      }).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (notifFilter === 'UNREAD') return !n.isRead;
      if (notifFilter === 'ORDER') return n.type === 'ORDER' || n.title.toLowerCase().includes('commande');
      if (notifFilter === 'SECURITY') return n.type === 'SECURITY' || n.title.toLowerCase().includes('connexion') || n.title.toLowerCase().includes('sécurité');
      return true;
    });
  }, [notifications, notifFilter]);

  const filteredCommands = useMemo(() => {
    if (!paletteQuery.trim()) return WORKSPACE_COMMANDS;
    const q = paletteQuery.toLowerCase().trim();
    return WORKSPACE_COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.path.toLowerCase().includes(q)
    );
  }, [paletteQuery]);

  const getPageContextLabel = (path: string) => {
    if (path === '/admin') return 'Tableau de Bord';
    if (path.startsWith('/admin/orders')) return 'Commandes & Expéditions';
    if (path.startsWith('/admin/products')) return 'Catalogue Testeurs';
    if (path.startsWith('/admin/coffrets')) return 'Coffrets Cadeaux';
    if (path.startsWith('/admin/parfums-originaux')) return 'Parfums Originaux';
    if (path.startsWith('/admin/master-copier')) return 'Master Copy 1:1';
    if (path.startsWith('/admin/inventory')) return 'Inventaire & Stocks';
    if (path.startsWith('/admin/suppliers')) return 'Fournisseurs & Achats';
    if (path.startsWith('/admin/brands')) return 'Marques de Luxe';
    if (path.startsWith('/admin/bills') || path.startsWith('/admin/expenses')) return 'Factures & Charges';
    if (path.startsWith('/admin/ads')) return 'Meta Ads & Dépenses';
    if (path.startsWith('/admin/marketing')) return 'Marketing & Rétention';
    if (path.startsWith('/admin/landing-pages')) return 'Landing Pages & Créas';
    if (path.startsWith('/admin/promos')) return 'Codes Promo & Offres';
    if (path.startsWith('/admin/affiliates')) return 'Ambassadeurs & Affiliés';
    if (path.startsWith('/admin/seo')) return 'Référencement SEO';
    if (path.startsWith('/admin/blog')) return 'Blog & Articles IA';
    if (path.startsWith('/admin/team')) return 'Équipe, Paie & Rôles';
    if (path.startsWith('/admin/tasks')) return 'Missions & Kanban';
    if (path.startsWith('/admin/chat')) return 'NAY Connect Hub';
    if (path.startsWith('/admin/notifications')) return 'Notifications';
    if (path.startsWith('/admin/activity')) return "Journal d'Activité";
    if (path.startsWith('/admin/customers')) return 'Clients & CRM';
    if (path.startsWith('/admin/analytics')) return 'Audience & Trafic';
    if (path.startsWith('/admin/finance')) return 'Finance & Trésorerie';
    if (path.startsWith('/admin/system/health')) return 'Santé Système';
    if (path.startsWith('/admin/appearance')) return 'Apparence & Design';
    if (path.startsWith('/admin/profile')) return 'Profil & Sécurité';
    if (path.startsWith('/admin/settings')) return 'Paramètres Boutique';
    return 'Console Exécutive';
  };

  const getMobileShortLabel = (path: string) => {
    if (path === '/admin') return 'Accueil';
    if (path.startsWith('/admin/orders')) return 'Commandes';
    if (path.startsWith('/admin/products')) return 'Testeurs';
    if (path.startsWith('/admin/coffrets')) return 'Coffrets';
    if (path.startsWith('/admin/parfums-originaux')) return 'Parfums';
    if (path.startsWith('/admin/master-copier')) return 'Master Copy';
    if (path.startsWith('/admin/inventory')) return 'Stocks';
    if (path.startsWith('/admin/suppliers')) return 'Fournisseurs';
    if (path.startsWith('/admin/brands')) return 'Marques';
    if (path.startsWith('/admin/bills') || path.startsWith('/admin/expenses')) return 'Factures';
    if (path.startsWith('/admin/ads')) return 'Ads & ROAS';
    if (path.startsWith('/admin/marketing')) return 'Marketing';
    if (path.startsWith('/admin/customers')) return 'Clients';
    if (path.startsWith('/admin/analytics')) return 'Analytics';
    if (path.startsWith('/admin/finance')) return 'Finance';
    if (path.startsWith('/admin/tasks')) return 'Missions';
    if (path.startsWith('/admin/team')) return 'Équipe';
    if (path.startsWith('/admin/chat')) return 'Messages';
    if (path.startsWith('/admin/appearance')) return 'Apparence';
    if (path.startsWith('/admin/profile')) return 'Profil';
    if (path.startsWith('/admin/settings')) return 'Paramètres';
    if (path.startsWith('/admin/conseiller')) return 'Conseiller';
    if (path.startsWith('/admin/sav')) return 'SAV';
    if (path.startsWith('/admin/notifications')) return 'Notifications';
    if (path.startsWith('/admin/activity')) return 'Activité';
    if (path.startsWith('/admin/vitrine')) return 'Vitrine';
    if (path.startsWith('/admin/system')) return 'Système';
    return 'Console';
  };

  // Hide header on login page (after all React hooks)
  if (pathname === '/admin/login') return null;

  return (
    <>
      {/* ── EDGE-TO-EDGE MOBILE BAR + FLOATING DESKTOP SPATIAL TASKBAR ── */}
      <header
        style={{
          ...(design.headbarStyle !== 'compact_slim' && design.headbarHeightPx
            ? { height: `${design.headbarHeightPx}px` }
            : {}),
          ...(design.headbarStyle !== 'minimal' && design.headbarStyle !== 'capsule_split'
            ? {
                backdropFilter: `blur(${design.glassBlurPx ?? 24}px) saturate(210%)`,
                WebkitBackdropFilter: `blur(${design.glassBlurPx ?? 24}px) saturate(210%)`,
              }
            : {}),
        }}
        className="nay-taskbar-2027 sticky top-0 lg:top-3 z-40 -mx-3.5 sm:-mx-4 lg:mx-0 w-[calc(100%+1.75rem)] sm:w-[calc(100%+2rem)] lg:w-full mb-4 lg:mb-5 rounded-none lg:rounded-2xl bg-white/92 dark:bg-[#0a0f1d]/92 backdrop-blur-2xl border-b border-slate-900/[0.08] lg:border dark:border-white/[0.09] px-3.5 sm:px-5 lg:px-4 h-14 lg:h-[54px] flex items-center justify-between gap-2 sm:gap-3 select-none transition-all"
      >
        {/* ── ZONE 1 (LEFT): NAVIGATION CONTROLS & ACTIVE MODULE CONTEXT ── */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 lg:flex-initial lg:shrink-0">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('nay_open_admin_drawer'));
              }
            }}
            className="lg:hidden w-9 h-9 rounded-xl bg-slate-900/[0.05] dark:bg-white/[0.08] border border-slate-900/[0.08] dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 cursor-pointer active:scale-95 transition-transform"
            aria-label="Ouvrir le menu complet"
          >
            <Menu size={17} />
          </button>
          {/* Mobile Brand & Clean Short Title */}
          <Link
            href="/admin"
            className="lg:hidden flex items-center gap-2 min-w-0"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900/[0.04] dark:bg-white/[0.06] border border-slate-900/[0.08] dark:border-white/10 flex items-center justify-center p-1.5 shrink-0">
              <Image src="/images/nay/nay-emblem.png" alt="NAY" width={18} height={18} className="object-contain" priority />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>Maison NAY</span>
              </div>
              <div className="text-[14px] font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                {getMobileShortLabel(pathname)}
              </div>
            </div>
          </Link>

          {design.sidebarHidden && (
            <button
              type="button"
              onClick={() => updateDesign({ sidebarHidden: false })}
              className="hidden lg:flex w-8 h-8 rounded-full bg-[#f1f4f9] hover:bg-[#e5eaf2] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Réafficher la barre latérale"
              aria-label="Réafficher la barre latérale"
            >
              <PanelLeftOpen size={14} />
            </button>
          )}
          {/* Desktop Sculpted History & Home Pill */}
          <div className="hidden lg:flex items-center gap-0.5 p-0.5 rounded-full bg-[#f1f4f9] dark:bg-white/[0.04] border border-slate-200/90 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 shrink-0">
            <Link
              href="/admin"
              className="w-7 h-7 rounded-full hover:bg-white dark:hover:bg-white/[0.08] hover:text-[#0ea5e9] dark:hover:text-[#38bdf8] flex items-center justify-center transition-colors"
              title="Tableau de Bord Principal"
              aria-label="Tableau de Bord Principal"
            >
              <Home size={13.5} strokeWidth={2} />
            </Link>
            <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <button
              type="button"
              onClick={() => router.back()}
              className="hidden sm:flex w-7 h-7 rounded-full hover:bg-white dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white items-center justify-center transition-colors cursor-pointer"
              title="Page précédente"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => router.forward()}
              className="hidden sm:flex w-7 h-7 rounded-full hover:bg-white dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white items-center justify-center transition-colors cursor-pointer"
              title="Page suivante"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Active Workspace Module */}
          {design.headbarShowModuleBadge !== false && (
            <>
              <span className="hidden lg:inline text-slate-300 dark:text-slate-700 text-xs font-light">/</span>
              <div className="hidden lg:flex items-center gap-2 text-xs shrink-0">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f172a] dark:bg-white/[0.08] border border-slate-900 dark:border-white/15 text-white font-bold text-[11.5px] truncate max-w-[185px] shadow-xs">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                    style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
                  />
                  <span className="truncate">{getPageContextLabel(pathname)}</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── ZONE 2 (CENTER): SCULPTED FLOATING COMMAND CAPSULE (Ctrl+K) ── */}
        {design.headbarShowSearch !== false && (
          <div className="flex-1 min-w-[140px] max-w-md hidden md:block">
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full h-9 flex items-center justify-between pl-3.5 pr-1.5 rounded-full bg-[#e5ebf3] hover:bg-[#dce4ef] dark:bg-[#060a14]/70 dark:hover:bg-[#0c1428] border border-slate-300/80 dark:border-slate-800 hover:border-slate-400/80 dark:hover:border-sky-500/40 text-xs text-slate-700 dark:text-slate-400 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 truncate">
                <Search size={13.5} className="text-slate-500 dark:text-slate-400 group-hover:text-[#0ea5e9] transition-colors shrink-0" />
                <span className="truncate font-medium">Lancer une commande, chercher un parfum...</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <kbd className="px-2 py-0.5 rounded-full bg-[#0f172a] dark:bg-slate-800/90 border border-slate-800 dark:border-slate-700 text-[9.5px] font-mono font-bold text-white dark:text-slate-300 shadow-2xs">
                  Ctrl+K
                </kbd>
              </div>
            </button>
          </div>
        )}

        {/* ── ZONE 3 (RIGHT): CASABLANCA PULSE, UNIFIED UTILITY DOCK & OPERATOR CAPSULE ── */}
        <div className="flex items-center gap-1 sm:gap-2.5 ml-auto shrink-0">
          {/* Mobile Search */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="md:hidden w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
            title="Rechercher (Ctrl+K)"
          >
            <Search size={14} />
          </button>

          {/* Clean Bare Telemetry Clock */}
          {design.headbarShowClock !== false && (
            <div className="hidden xl:flex items-center gap-1.5 pr-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-sans uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                Casablanca
              </span>
              <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                {currentTimeCasablanca || '--:--:--'}
              </span>
            </div>
          )}

          {/* Unified Floating Utility Pill */}
          <div className="flex items-center gap-0.5 p-1 rounded-full bg-[#f1f4f9] dark:bg-white/[0.04] border border-slate-200/90 dark:border-slate-800/80">
            {/* Quick Add (+) - Desktop only to keep mobile header uncluttered */}
            {design.headbarShowQuickAdd !== false && (
              <div className="relative hidden lg:block" ref={quickAddRef}>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isQuickAddOpen
                    ? 'bg-[#0ea5e9] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-[#0ea5e9]'
                }`}
                title="Création rapide"
                aria-label="Création rapide"
              >
                <Plus size={14} strokeWidth={2.5} className={isQuickAddOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
              </button>

              <AnimatePresence>
                {isQuickAddOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className="origin-top-right fixed inset-x-3 top-[68px] sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2.5 sm:w-56 bg-white/96 dark:bg-[#0c101c]/96 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 py-1.5 z-50"
                  >
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                      Actions Rapides Poste
                    </div>
                    <Link
                      href="/admin/orders"
                      onClick={() => setIsQuickAddOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-white/[0.06] hover:text-[#0ea5e9] transition-colors"
                    >
                      <ShoppingBag size={14} className="text-[#0ea5e9]" />
                      <span>Nouvelle Commande</span>
                    </Link>
                    <Link
                      href="/admin/products"
                      onClick={() => setIsQuickAddOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-white/[0.06] hover:text-[#0ea5e9] transition-colors"
                    >
                      <Package size={14} className="text-[#0ea5e9]" />
                      <span>Nouveau Parfum / Testeur</span>
                    </Link>
                    <Link
                      href="/admin/tasks"
                      onClick={() => setIsQuickAddOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-white/[0.06] hover:text-[#0ea5e9] transition-colors"
                    >
                      <CheckSquare size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Créer une Mission</span>
                    </Link>
                    <Link
                      href="/admin/chat"
                      onClick={() => setIsQuickAddOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-white/[0.06] hover:text-[#0ea5e9] transition-colors"
                    >
                      <MessageSquare size={14} className="text-slate-500 dark:text-slate-400" />
                      <span>Message d&apos;Équipe</span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            )}

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`w-7 h-7 rounded-full relative flex items-center justify-center transition-all cursor-pointer ${
                  isNotifOpen
                    ? 'bg-[#0ea5e9] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-[#0ea5e9]'
                }`}
                aria-label="Centre de notifications"
                title="Notifications & Alertes"
              >
                <Bell size={14} />
                {unreadCount > 0 && (
                  <>
                    <span className="lg:hidden absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0c1220]" />
                    <span className="hidden lg:flex absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-rose-500 text-white text-[8.5px] font-black rounded-full items-center justify-center px-0.5 shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
                    className="origin-top-right fixed inset-x-3 top-[68px] sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2.5 sm:w-[420px] sm:max-w-[420px] bg-white/96 dark:bg-[#0c101c]/96 backdrop-blur-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-[100] overflow-hidden flex flex-col"
                  >
                    <div className="p-3.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-[#111728]">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-[#0ea5e9]" />
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                          Notifications
                        </h4>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] font-bold text-[#0ea5e9] dark:text-[#38bdf8] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Check size={12} />
                          <span>Tout lire</span>
                        </button>
                      )}
                    </div>

                    <div className="px-3 py-2 bg-slate-50/80 dark:bg-[#0a0e1a] border-b border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setNotifFilter('ALL')}
                        className={`px-2.5 py-0.5 rounded-lg font-bold text-xs ${
                          notifFilter === 'ALL'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-white/5'
                        }`}
                      >
                        Toutes ({notifications.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifFilter('UNREAD')}
                        className={`px-2.5 py-0.5 rounded-lg font-bold text-xs ${
                          notifFilter === 'UNREAD'
                            ? 'bg-rose-500 text-white'
                            : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-white/5'
                        }`}
                      >
                        Non lues ({unreadCount})
                      </button>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                      {filteredNotifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          Aucune notification.
                        </div>
                      ) : (
                        filteredNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer flex items-start gap-2.5 ${
                              !notif.isRead ? 'bg-sky-500/[0.04] dark:bg-sky-500/[0.06]' : ''
                            }`}
                          >
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#0ea5e9]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {notif.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 border-t border-slate-100 dark:border-white/5 text-center bg-slate-50 dark:bg-[#0a0e1a]">
                      <Link
                        href="/admin/notifications"
                        onClick={() => setIsNotifOpen(false)}
                        className="text-xs font-bold text-[#0ea5e9] dark:text-[#38bdf8] hover:underline"
                      >
                        Ouvrir toutes les notifications &rarr;
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              type="button"
              className="w-7 h-7 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-400 transition-all flex items-center justify-center cursor-pointer"
              title={isDark ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
              aria-label="Changer de thème"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.16 }}
                  className="flex items-center justify-center"
                >
                  {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Studio Apparence 1-Clic */}
            <Link
              href="/admin/appearance"
              className={`hidden md:flex w-7 h-7 rounded-full transition-all items-center justify-center ${
                pathname.startsWith('/admin/appearance')
                  ? 'bg-white dark:bg-white/15 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
              }`}
              style={pathname.startsWith('/admin/appearance') ? { color: design.accentColor } : undefined}
              title="Atelier Apparence & Design (24 Thèmes, 14 Headbars, 12 Taskbars)"
              aria-label="Ouvrir l'atelier d'apparence"
            >
              <Palette size={13.5} />
            </Link>

            {/* Vitrine Ghost Chip */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 transition-all shrink-0"
              title="Ouvrir la vitrine publique"
            >
              <Globe2 size={13} className="text-[#0ea5e9]" />
              <span>Vitrine</span>
            </Link>
          </div>

          {/* Operator Profile Capsule */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 pl-0.5 pr-1 sm:pl-1 sm:pr-2.5 py-1 rounded-full hover:bg-slate-100/90 dark:hover:bg-white/[0.06] border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700 transition-all focus:outline-none cursor-pointer"
              aria-label="Menu profil administrateur"
            >
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center text-xs font-bold overflow-hidden ring-2 ring-[#0ea5e9]/30">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{getInitials(currentUser?.name)}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-[#0a0f1d]" />
              </div>

              <div className="text-left hidden lg:block leading-none">
                <div className="text-[11.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
                  {isLoading ? '...' : currentUser?.name?.split(' ').slice(0, 2).join(' ') || 'Ayoub Ait'}
                </div>
                <div className="text-[9px] uppercase font-bold tracking-wider text-[#0ea5e9] dark:text-[#38bdf8] leading-tight mt-0.5">
                  {currentUser?.isOwner ? 'Propriétaire' : currentUser?.role || 'Opérateur'}
                </div>
              </div>

              <ChevronDown
                size={12}
                className={`hidden sm:block text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-slate-700 dark:text-slate-200' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="origin-top-right fixed inset-x-3 top-[68px] sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2.5 sm:w-64 bg-white/96 dark:bg-[#0c101c]/96 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 py-1.5 z-50"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentUser?.name || 'Ayoub Ait Yahya'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {currentUser?.email || 'ayoub@nayparfum.ma'}
                    </p>
                    <span className="inline-flex items-center gap-1 font-semibold text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md mt-2">
                      <CheckCircle2 size={10} />
                      Opérateur Vérifié
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/admin/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
                    >
                      <User size={14} className="text-[#0ea5e9]" />
                      <span>Mon Profil Exécutif</span>
                    </Link>

                    <Link
                      href="/admin/appearance"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
                    >
                      <Palette size={14} className="text-[#0284c7] dark:text-[#38bdf8]" />
                      <span>Mon Apparence &amp; Design</span>
                    </Link>

                    <Link
                      href="/admin/activity"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
                    >
                      <History size={14} className="text-[#0ea5e9]" />
                      <span>Journal d&apos;Audit Postes</span>
                    </Link>

                    <Link
                      href="/admin/profile?tab=security"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
                    >
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span>Sécurité &amp; 2FA</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-white/5">
                    {canInstall && (
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('nay_pwa_trigger_install'));
                          }
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#0ea5e9] hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Installer Console Desktop</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Verrouiller / Se Déconnecter</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── WORKSTATION COMMAND PALETTE MODAL (Ctrl+K) ── */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-slate-900/50 dark:bg-black/75 backdrop-blur-md flex items-start justify-center p-4 sm:pt-20"
            onClick={() => setIsCommandPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-xl bg-white dark:bg-[#0c101c] rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.85)] border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Input Bar */}
            <div className="p-3.5 border-b border-slate-100 dark:border-white/10 flex items-center gap-3 bg-slate-50/50 dark:bg-[#111728]/50">
              <Search size={18} className="text-[#0ea5e9] shrink-0" />
              <input
                ref={paletteInputRef}
                type="text"
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Taper une destination ou une commande..."
                className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
              <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                ESC
              </kbd>
            </div>

            {/* Quick Suggestions List */}
            <div className="max-h-[360px] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-white/[0.04]">
              {filteredCommands.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Aucun résultat trouvé pour « {paletteQuery} »
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsCommandPaletteOpen(false);
                        router.push(cmd.path);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors">
                          <Icon size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0ea5e9] dark:group-hover:text-[#38bdf8] transition-colors">
                            {cmd.label}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {cmd.path}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {cmd.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-[#0ea5e9] dark:text-[#38bdf8] border border-sky-500/20">
                            {cmd.badge}
                          </span>
                        )}
                        <span className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Palette Footer Help */}
            <div className="p-2.5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0a0e1a] flex items-center justify-between text-[11px] text-slate-400">
              <span>Maison NAY Parfums • Poste de Commande</span>
              <span>Navigation clavier instantanée</span>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
