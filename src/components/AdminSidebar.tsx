'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BarChart3,
  ShoppingBag, 
  Headphones,
  FlaskConical,
  Gift, 
  Package,
  Copy,
  Boxes,
  Handshake,
  Receipt,
  Crown,
  TrendingUp,
  Wallet,
  UserCog,
  BadgeCheck,
  ListTodo,
  Lightbulb,
  AlertCircle,
  MessageCircle,
  Bell,
  History,
  MessageSquare,
  Users,
  Star,
  PieChart,
  ShieldAlert,
  MessageSquareHeart,
  SlidersHorizontal,
  Megaphone,
  Film,
  Target,
  Send,
  Activity,
  LayoutTemplate,
  Ticket,
  Award,
  Globe,
  Mail,
  BookOpen,
  Inbox,
  MessageSquareText,
  Store,
  HeartPulse,
  User,
  Settings,
  Search,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  ChevronLeft,
  X,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Palette
} from 'lucide-react';
import { useAdminTheme } from '@/context/AdminThemeContext';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  badge?: string | number;
}

const GENERAL_ITEMS: MenuItem[] = [
  { href: '/admin', label: 'Tableau de bord', icon: <LayoutDashboard size={18} strokeWidth={1.8} />, permission: 'dashboard.view' },
  { href: '/admin/analytics', label: 'Analytics & Performance', icon: <BarChart3 size={18} strokeWidth={1.8} />, permission: 'dashboard.view', badge: 'Live' },
  { href: '/admin/orders', label: 'Commandes', icon: <ShoppingBag size={18} strokeWidth={1.8} />, permission: 'orders.view', badge: 12 },
  { href: '/admin/sav', label: 'SAV & Réclamations', icon: <Headphones size={18} strokeWidth={1.8} />, permission: 'orders.view' },
];

const CATALOGUE_ITEMS: MenuItem[] = [
  { href: '/admin/products', label: 'Testeurs', icon: <FlaskConical size={18} strokeWidth={1.8} />, permission: 'products.view' },
  { href: '/admin/coffrets', label: 'Coffrets Cadeaux', icon: <Gift size={18} strokeWidth={1.8} />, permission: 'products.view' },
  { href: '/admin/parfums-originaux', label: 'Parfums Originaux', icon: <Package size={18} strokeWidth={1.8} />, permission: 'products.view' },
  { href: '/admin/master-copier', label: 'Master Copy', icon: <Copy size={18} strokeWidth={1.8} />, permission: 'products.edit' },
  { href: '/admin/inventory', label: 'Inventaire & Stock', icon: <Boxes size={18} strokeWidth={1.8} />, permission: 'inventory.view' },
  { href: '/admin/suppliers', label: 'Fournisseurs & Achats', icon: <Handshake size={18} strokeWidth={1.8} />, permission: 'inventory.view' },
];

const FINANCE_ITEMS: MenuItem[] = [
  { href: '/admin/bills', label: 'Factures à Payer', icon: <Receipt size={18} strokeWidth={1.8} /> },
  { href: '/admin/brands', label: 'Marques de Luxe', icon: <Crown size={18} strokeWidth={1.8} />, permission: 'products.view' },
  { href: '/admin/finance', label: 'Finance & CA Net', icon: <TrendingUp size={18} strokeWidth={1.8} />, permission: 'finance.view_revenue' },
  { href: '/admin/finance?tab=EXPENSES', label: 'Charges & Dépenses', icon: <Wallet size={18} strokeWidth={1.8} />, permission: 'finance.view_costs' },
];

const CRM_ITEMS: MenuItem[] = [
  { href: '/admin/conseiller', label: 'Conseiller Clientèle', icon: <MessageSquare size={18} strokeWidth={1.8} />, permission: 'customers.view' },
  { href: '/admin/customers', label: 'Tous les Clients', icon: <Users size={18} strokeWidth={1.8} />, permission: 'customers.view' },
  { href: '/admin/customers/vip', label: 'Clients VIP & Fidélité', icon: <Star size={18} strokeWidth={1.8} />, permission: 'customers.view_vip' },
  { href: '/admin/customers/segments', label: 'Segmentation Clients', icon: <PieChart size={18} strokeWidth={1.8} />, permission: 'customers.view' },
  { href: '/admin/customers/at-risk', label: 'Clients à Risque', icon: <ShieldAlert size={18} strokeWidth={1.8} />, permission: 'customers.view' },
  { href: '/admin/reviews', label: 'Avis & Témoignages', icon: <MessageSquareHeart size={18} strokeWidth={1.8} />, permission: 'reviews.view' },
];

const MARKETING_ITEMS: MenuItem[] = [
  { href: '/admin/scent-match', label: 'Recommandations Parfums', icon: <SlidersHorizontal size={18} strokeWidth={1.8} /> },
  { href: '/admin/ads', label: 'Gestionnaire Pubs (Ads)', icon: <Megaphone size={18} strokeWidth={1.8} />, permission: 'marketing.view_analytics' },
  { href: '/admin/creatives', label: 'Créatifs Pubs (UGC)', icon: <Film size={18} strokeWidth={1.8} />, permission: 'marketing.manage_creatives' },
  { href: '/admin/marketing', label: 'Marketing & Rétention', icon: <Target size={18} strokeWidth={1.8} />, permission: 'marketing.view' },
  { href: '/admin/marketing/campaigns', label: 'Campagnes & SMS', icon: <Send size={18} strokeWidth={1.8} />, permission: 'marketing.manage_campaigns' },
  { href: '/admin/marketing/live-carts', label: 'Paniers en direct', icon: <Activity size={18} strokeWidth={1.8} />, permission: 'marketing.view_analytics' },
  { href: '/admin/landing-pages', label: 'Landing Pages', icon: <LayoutTemplate size={18} strokeWidth={1.8} />, permission: 'marketing.manage_landing_pages' },
  { href: '/admin/promos', label: 'Codes Promo', icon: <Ticket size={18} strokeWidth={1.8} />, permission: 'marketing.manage_promotions' },
  { href: '/admin/affiliates', label: 'Ambassadeurs', icon: <Award size={18} strokeWidth={1.8} />, permission: 'marketing.manage_affiliates' },
  { href: '/admin/seo', label: 'Référencement SEO', icon: <Globe size={18} strokeWidth={1.8} />, permission: 'marketing.manage_seo' },
  { href: '/admin/newsletter', label: 'Newsletter', icon: <Mail size={18} strokeWidth={1.8} />, permission: 'marketing.manage_newsletter' },
  { href: '/admin/blog', label: 'Blog & Articles SEO', icon: <BookOpen size={18} strokeWidth={1.8} />, permission: 'marketing.manage_seo' },
];

const TEAM_ITEMS: MenuItem[] = [
  { href: '/admin/team', label: 'Gestion Équipe & Salaires', icon: <UserCog size={18} strokeWidth={1.8} />, permission: 'team.view' },
  { href: '/admin/team/roles', label: 'Annuaire des Rôles', icon: <BadgeCheck size={18} strokeWidth={1.8} />, permission: 'team.view' },
  { href: '/admin/tasks', label: 'Missions & Tâches', icon: <ListTodo size={18} strokeWidth={1.8} />, permission: 'tasks.view', badge: 4 },
  { href: '/admin/team/suggestions', label: 'Boîte à Idées', icon: <Lightbulb size={18} strokeWidth={1.8} /> },
  { href: '/admin/team/reclamations', label: 'Réclamations RH', icon: <AlertCircle size={18} strokeWidth={1.8} /> },
  { href: '/admin/chat', label: 'NAY Chat', icon: <MessageCircle size={18} strokeWidth={1.8} /> },
  { href: '/admin/notifications', label: 'Centre Notifications', icon: <Bell size={18} strokeWidth={1.8} /> },
  { href: '/admin/activity', label: 'Journal d\'Activité', icon: <History size={18} strokeWidth={1.8} />, permission: 'activity.view_all' },
];

const SYSTEM_ITEMS: MenuItem[] = [
  { href: '/admin/inbox', label: 'Boîte de Réception', icon: <Inbox size={18} strokeWidth={1.8} />, permission: 'messages.view' },
  { href: '/admin/messages', label: 'Messages Formulaire', icon: <MessageSquareText size={18} strokeWidth={1.8} />, permission: 'messages.view' },
  { href: '/admin/vitrine', label: 'Vitrine Recommandée', icon: <Store size={18} strokeWidth={1.8} />, permission: 'products.edit' },
  { href: '/admin/system/health', label: 'Santé & Intégrations', icon: <HeartPulse size={18} strokeWidth={1.8} />, permission: 'settings.view' },
];

// Curated Quick-Access Clusters for Collapsed Micro-Rail Mode (Shopify Standard)
const DOCK_OPERATIONS_ITEMS: MenuItem[] = [
  { href: '/admin', label: 'Tableau de bord', icon: <LayoutDashboard size={18} strokeWidth={1.8} />, permission: 'dashboard.view' },
  { href: '/admin/analytics', label: 'Analytics & Performance', icon: <BarChart3 size={18} strokeWidth={1.8} />, permission: 'dashboard.view', badge: 'Live' },
  { href: '/admin/orders', label: 'Commandes', icon: <ShoppingBag size={18} strokeWidth={1.8} />, permission: 'orders.view', badge: 12 },
  { href: '/admin/sav', label: 'SAV & Réclamations', icon: <Headphones size={18} strokeWidth={1.8} />, permission: 'orders.view' },
  { href: '/admin/products', label: 'Testeurs & Catalogue', icon: <FlaskConical size={18} strokeWidth={1.8} />, permission: 'products.view' },
  { href: '/admin/coffrets', label: 'Coffrets Cadeaux', icon: <Gift size={18} strokeWidth={1.8} />, permission: 'products.view' },
  { href: '/admin/parfums-originaux', label: 'Parfums Originaux', icon: <Package size={18} strokeWidth={1.8} />, permission: 'products.view' },
  { href: '/admin/inventory', label: 'Inventaire & Stocks', icon: <Boxes size={18} strokeWidth={1.8} />, permission: 'inventory.view' },
  { href: '/admin/finance', label: 'Finance & CA Net', icon: <TrendingUp size={18} strokeWidth={1.8} />, permission: 'finance.view_revenue' },
];

const DOCK_GROWTH_ITEMS: MenuItem[] = [
  { href: '/admin/conseiller', label: 'Conseiller Clientèle', icon: <MessageSquare size={18} strokeWidth={1.8} />, permission: 'customers.view' },
  { href: '/admin/customers', label: 'Clients & CRM', icon: <Users size={18} strokeWidth={1.8} />, permission: 'customers.view' },
  { href: '/admin/customers/vip', label: 'Clients VIP', icon: <Star size={18} strokeWidth={1.8} />, permission: 'customers.view_vip' },
  { href: '/admin/reviews', label: 'Avis Clients', icon: <MessageSquareHeart size={18} strokeWidth={1.8} />, permission: 'reviews.view' },
  { href: '/admin/scent-match', label: 'Recommandations Parfums', icon: <SlidersHorizontal size={18} strokeWidth={1.8} /> },
  { href: '/admin/ads', label: 'Gestionnaire Pubs Ads', icon: <Megaphone size={18} strokeWidth={1.8} />, permission: 'marketing.view_analytics' },
  { href: '/admin/marketing/live-carts', label: 'Paniers en direct', icon: <Activity size={18} strokeWidth={1.8} />, permission: 'marketing.view_analytics' },
  { href: '/admin/promos', label: 'Codes Promo', icon: <Ticket size={18} strokeWidth={1.8} />, permission: 'marketing.manage_promotions' },
  { href: '/admin/affiliates', label: 'Ambassadeurs', icon: <Award size={18} strokeWidth={1.8} />, permission: 'marketing.manage_affiliates' },
  { href: '/admin/seo', label: 'Référencement SEO', icon: <Globe size={18} strokeWidth={1.8} />, permission: 'marketing.manage_seo' },
];

const DOCK_SYSTEM_ITEMS: MenuItem[] = [
  { href: '/admin/tasks', label: 'Missions & Tâches', icon: <ListTodo size={18} strokeWidth={1.8} />, permission: 'tasks.view', badge: 4 },
  { href: '/admin/chat', label: 'NAY Chat', icon: <MessageCircle size={18} strokeWidth={1.8} /> },
  { href: '/admin/activity', label: 'Journal d\'Activité', icon: <History size={18} strokeWidth={1.8} />, permission: 'activity.view_all' },
  { href: '/admin/inbox', label: 'Boîte de Réception', icon: <Inbox size={18} strokeWidth={1.8} />, permission: 'messages.view' },
  { href: '/admin/system/health', label: 'Santé & Intégrations', icon: <HeartPulse size={18} strokeWidth={1.8} />, permission: 'settings.view' },
];

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  effectivePermissions?: string[];
  isOwner?: boolean;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    label: string;
    badge?: string | number;
    top: number;
  } | null>(null);
  const [activePillar, setActivePillar] = useState<'EXEC' | 'CATALOG' | 'FINANCE' | 'GROWTH' | 'TEAM'>('EXEC');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const { toggleTheme, isDark, isSidebarCollapsed, toggleSidebar, setSidebarCollapsed, design } = useAdminTheme();

  // Auto-close drawer, clear tooltip, and sync active spine pillar on route change
  useEffect(() => {
    setIsOpen(false);
    setHoveredTooltip(null);
    if (
      pathname.startsWith('/admin/products') ||
      pathname.startsWith('/admin/coffrets') ||
      pathname.startsWith('/admin/parfums-originaux') ||
      pathname.startsWith('/admin/master-copier') ||
      pathname.startsWith('/admin/inventory') ||
      pathname.startsWith('/admin/suppliers')
    ) {
      setActivePillar('CATALOG');
    } else if (
      pathname.startsWith('/admin/bills') ||
      pathname.startsWith('/admin/brands') ||
      pathname.startsWith('/admin/finance')
    ) {
      setActivePillar('FINANCE');
    } else if (
      pathname.startsWith('/admin/conseiller') ||
      pathname.startsWith('/admin/customers') ||
      pathname.startsWith('/admin/reviews') ||
      pathname.startsWith('/admin/scent-match') ||
      pathname.startsWith('/admin/ads') ||
      pathname.startsWith('/admin/creatives') ||
      pathname.startsWith('/admin/marketing') ||
      pathname.startsWith('/admin/landing-pages') ||
      pathname.startsWith('/admin/promos') ||
      pathname.startsWith('/admin/affiliates') ||
      pathname.startsWith('/admin/seo') ||
      pathname.startsWith('/admin/newsletter') ||
      pathname.startsWith('/admin/blog')
    ) {
      setActivePillar('GROWTH');
    } else if (
      pathname.startsWith('/admin/team') ||
      pathname.startsWith('/admin/tasks') ||
      pathname.startsWith('/admin/chat') ||
      pathname.startsWith('/admin/notifications') ||
      pathname.startsWith('/admin/activity')
    ) {
      setActivePillar('TEAM');
    } else {
      setActivePillar('EXEC');
    }
  }, [pathname]);

  const handleTooltipEnter = (
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>,
    label: string,
    badge?: string | number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      badge,
      top: rect.top + rect.height / 2,
    });
  };

  const handleTooltipLeave = () => {
    setHoveredTooltip(null);
  };

  const handleExpandAndSearch = () => {
    setHoveredTooltip(null);
    setSidebarCollapsed(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 160);
  };

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  // Listen for global drawer open/close events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    window.addEventListener('nay_open_admin_drawer', handleOpen);
    window.addEventListener('nay_close_admin_drawer', handleClose);
    return () => {
      window.removeEventListener('nay_open_admin_drawer', handleOpen);
      window.removeEventListener('nay_close_admin_drawer', handleClose);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const res = await fetch('/api/admin/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Failed to load user in sidebar:', err);
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hide sidebar on login page
  if (pathname === '/admin/login') return null;

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

  const getInitials = (name?: string) => {
    if (!name) return 'AY';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Check if item is permitted for current user
  const isItemVisible = (item: MenuItem) => {
    if (!user) return true;
    if (user.isOwner) return true;
    if (!item.permission) return true;
    return (user.effectivePermissions || []).includes(item.permission);
  };

  const matchesSearch = (item: MenuItem) => {
    if (!searchQuery.trim()) return true;
    return item.label.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const allMenuBaseHrefs = [
    ...GENERAL_ITEMS,
    ...CATALOGUE_ITEMS,
    ...FINANCE_ITEMS,
    ...CRM_ITEMS,
    ...MARKETING_ITEMS,
    ...TEAM_ITEMS,
    ...SYSTEM_ITEMS,
  ].map((i) => i.href.split('?')[0]);

  // Render navigation links with bespoke NAY micro-dock & expanded Shopify styling
  const renderLinks = (items: MenuItem[], isCollapsedMode: boolean) => {
    const visibleItems = items.filter(isItemVisible).filter(matchesSearch);
    if (visibleItems.length === 0) return null;

    return visibleItems.map((item) => {
      const baseHref = item.href.split('?')[0];
      const hasMoreSpecificSibling = allMenuBaseHrefs.some(
        (h) => h !== baseHref && h.startsWith(`${baseHref}/`) && (pathname === h || pathname.startsWith(`${h}/`))
      );
      const isExactOrSub =
        pathname === baseHref ||
        (baseHref !== '/admin' && pathname.startsWith(`${baseHref}/`) && !hasMoreSpecificSibling);
      const isActive = item.href.includes('?') ? false : isExactOrSub;

      if (isCollapsedMode) {
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            onClick={() => {
              setIsOpen(false);
              handleTooltipLeave();
            }}
            onMouseEnter={(e) => handleTooltipEnter(e, item.label, item.badge)}
            onMouseLeave={handleTooltipLeave}
            onFocus={(e) => handleTooltipEnter(e, item.label, item.badge)}
            onBlur={handleTooltipLeave}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            className={`w-10 h-10 rounded-[13px] flex items-center justify-center relative mx-auto my-0.5 transition-all duration-150 group ${
              isActive
                ? 'text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-[#0284c7] dark:hover:text-white hover:bg-sky-50/90 dark:hover:bg-white/[0.06]'
            }`}
          >
            {isActive && (
              <>
                <motion.span
                  layoutId="nay-sidebar-dock-pill"
                  transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                  className="absolute inset-0 rounded-[13px] bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] shadow-[0_6px_16px_-3px_rgba(14,165,233,0.48),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  aria-hidden="true"
                />
                <motion.span
                  layoutId="nay-sidebar-dock-bar"
                  transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                  className="absolute -left-[12px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#0ea5e9] shadow-[0_0_10px_rgba(14,165,233,0.85)]"
                  aria-hidden="true"
                />
              </>
            )}

            <div className="shrink-0 flex items-center justify-center relative z-10 transition-transform duration-150 group-hover:scale-110">
              {item.icon}
            </div>

            {design.sidebarShowBadges !== false && item.badge && (
              <span
                className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ${
                  isActive ? 'ring-[#0284c7]' : 'ring-white dark:ring-[#0a0f1d]'
                } ${
                  item.badge === 'Live' ? 'bg-emerald-400 animate-pulse' : isActive ? 'bg-white' : 'bg-[#0ea5e9]'
                }`}
                aria-hidden="true"
              />
            )}
          </Link>
        );
      }

      return (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          onClick={() => setIsOpen(false)}
          aria-current={isActive ? 'page' : undefined}
          className={`flex items-center justify-between px-2.5 py-[7.5px] rounded-xl text-[12.5px] relative transition-all duration-150 group ${
            isActive
              ? 'text-slate-950 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.04] font-medium'
          }`}
        >
          {isActive && (
            <>
              <motion.span
                layoutId="nay-sidebar-expanded-pill"
                transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                className="absolute inset-0 rounded-xl border"
                style={{
                  backgroundColor: 'var(--admin-accent-soft, rgba(14, 165, 233, 0.12))',
                  borderColor: 'var(--admin-accent-ring, rgba(14, 165, 233, 0.28))',
                }}
                aria-hidden="true"
              />
              <motion.span
                layoutId="nay-sidebar-expanded-bar"
                transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full z-10"
                style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
                aria-hidden="true"
              />
            </>
          )}

          <div className="flex items-center gap-2.5 min-w-0 relative z-10">
            <div
              className={`shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                isActive
                  ? 'text-[#0284c7] dark:text-[#38bdf8]'
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-[#0ea5e9] dark:group-hover:text-sky-400'
              }`}
            >
              {item.icon}
            </div>
            <span className="truncate">{item.label}</span>
          </div>

          {design.sidebarShowBadges !== false && item.badge && (
            <span
              className={`shrink-0 relative z-10 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                item.badge === 'Live'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : isActive
                  ? 'bg-[#0ea5e9] text-white'
                  : 'bg-sky-500/12 text-[#0284c7] dark:text-[#38bdf8] border border-sky-500/25'
              }`}
            >
              {item.badge}
            </span>
          )}
        </Link>
      );
    });
  };

  const hasGeneralItems = GENERAL_ITEMS.some(isItemVisible) && GENERAL_ITEMS.some(matchesSearch);
  const hasCatalogueItems = CATALOGUE_ITEMS.some(isItemVisible) && CATALOGUE_ITEMS.some(matchesSearch);
  const hasFinanceItems = FINANCE_ITEMS.some(isItemVisible) && FINANCE_ITEMS.some(matchesSearch);
  const hasCrmItems = CRM_ITEMS.some(isItemVisible) && CRM_ITEMS.some(matchesSearch);
  const hasMarketingItems = MARKETING_ITEMS.some(isItemVisible) && MARKETING_ITEMS.some(matchesSearch);
  const hasTeamItems = TEAM_ITEMS.some(isItemVisible) && TEAM_ITEMS.some(matchesSearch);
  const hasSystemItems = SYSTEM_ITEMS.some(isItemVisible) && SYSTEM_ITEMS.some(matchesSearch);

  // In desktop, collapse state determines layout. In mobile drawer, always show expanded mode.
  const isCollapsed = isSidebarCollapsed && !isOpen;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Dual-Rail Architectural Studio Sidebar */}
      <aside
        onMouseLeave={handleTooltipLeave}
        style={
          design.sidebarTone !== 'minimal_border'
            ? {
                backdropFilter: `blur(${design.glassBlurPx ?? 24}px) saturate(210%)`,
                WebkitBackdropFilter: `blur(${design.glassBlurPx ?? 24}px) saturate(210%)`,
              }
            : undefined
        }
        className={`admin-sidebar backdrop-blur-2xl ${
          isCollapsed ? 'lg:w-[68px]' : 'lg:w-[var(--admin-sidebar-w,278px)]'
        } w-[min(320px,88vw)] h-[100dvh] lg:h-[calc(100vh-1.5rem)] rounded-r-3xl lg:rounded-none flex fixed top-0 bottom-0 ${
          design.sidebarPosition === 'right'
            ? 'left-0 lg:left-auto lg:right-3'
            : 'left-0 lg:left-3'
        } lg:top-3 lg:bottom-3 z-[60] lg:z-40 select-none overflow-hidden transition-[width,transform] duration-200 ease-out ${
          isOpen ? 'translate-x-0 is-open' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {isCollapsed ? (
          /* ── COLLAPSED MAGNETIC RAIL (68px) ── */
          <div className="w-full h-full flex flex-col relative">
            <div className="px-2 pt-3 pb-2.5 flex flex-col items-center gap-2 relative z-10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleTooltipLeave();
                  toggleSidebar();
                }}
                onMouseEnter={(e) => handleTooltipEnter(e, 'NAY PARFUMS • Ouvrir le Studio')}
                onMouseLeave={handleTooltipLeave}
                className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-sky-50 to-white dark:from-[#0e1a32] dark:to-[#081020] border border-sky-200/80 dark:border-sky-400/30 shadow-xs hover:scale-105 transition-transform cursor-pointer relative flex items-center justify-center p-1.5"
                aria-label="Agrandir la barre latérale"
              >
                <Image src="/images/nay/nay-emblem.png" alt="NAY" width={21} height={21} className="object-contain" priority />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0f1d]" />
              </button>

              <button
                type="button"
                onClick={handleExpandAndSearch}
                onMouseEnter={(e) => handleTooltipEnter(e, 'Rechercher un module')}
                onMouseLeave={handleTooltipLeave}
                className="w-10 h-8 rounded-xl text-slate-400 hover:text-[#0284c7] dark:hover:text-white hover:bg-sky-50 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Rechercher dans le menu"
              >
                <Search size={15} strokeWidth={1.9} />
              </button>
            </div>

            <div className="mx-3 h-px bg-sky-200/50 dark:bg-white/[0.07] shrink-0" />

            <nav
              onScroll={handleTooltipLeave}
              className="flex-1 px-2 py-2.5 overflow-y-auto overflow-x-hidden shopify-nav-scrollbar min-h-0"
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="w-full space-y-0.5">{renderLinks(DOCK_OPERATIONS_ITEMS, true)}</div>
                <div className="w-5 h-px bg-sky-200/70 dark:bg-white/10 mx-auto my-2" />
                <div className="w-full space-y-0.5">{renderLinks(DOCK_GROWTH_ITEMS, true)}</div>
                <div className="w-5 h-px bg-sky-200/70 dark:bg-white/10 mx-auto my-2" />
                <div className="w-full space-y-0.5">{renderLinks(DOCK_SYSTEM_ITEMS, true)}</div>
              </div>
            </nav>

            <div className="mx-3 h-px bg-sky-200/50 dark:bg-white/[0.07] shrink-0" />

            <div className="p-2 py-2.5 flex flex-col items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleTooltipLeave();
                  toggleSidebar();
                }}
                onMouseEnter={(e) => handleTooltipEnter(e, 'Ouvrir Dual-Rail Studio')}
                onMouseLeave={handleTooltipLeave}
                className="w-9 h-9 rounded-xl hover:bg-sky-50 dark:hover:bg-white/[0.07] text-slate-400 hover:text-[#0284c7] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Déplier la navigation"
              >
                <PanelLeft size={16} strokeWidth={1.8} />
              </button>
              <Link
                href="/admin/settings"
                onClick={() => {
                  setIsOpen(false);
                  handleTooltipLeave();
                }}
                onMouseEnter={(e) => handleTooltipEnter(e, 'Paramètres')}
                onMouseLeave={handleTooltipLeave}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  pathname === '/admin/settings'
                    ? 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white'
                    : 'text-slate-400 hover:text-[#0284c7] dark:hover:text-white hover:bg-sky-50 dark:hover:bg-white/[0.07]'
                }`}
                aria-label="Paramètres"
              >
                <Settings size={16} strokeWidth={1.8} />
              </Link>
              <Link
                href="/"
                target="_blank"
                onMouseEnter={(e) => handleTooltipEnter(e, 'Boutique en ligne')}
                onMouseLeave={handleTooltipLeave}
                className="w-9 h-9 rounded-xl hover:bg-sky-50 dark:hover:bg-white/[0.07] text-slate-400 hover:text-[#0ea5e9] flex items-center justify-center transition-colors"
                aria-label="Boutique en ligne"
              >
                <Store size={16} strokeWidth={1.8} />
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                onMouseEnter={(e) => handleTooltipEnter(e, isDark ? 'Mode Clair' : 'Mode Sombre')}
                onMouseLeave={handleTooltipLeave}
                className="w-9 h-9 rounded-xl hover:bg-sky-50 dark:hover:bg-white/[0.07] text-slate-400 hover:text-amber-500 flex items-center justify-center transition-colors cursor-pointer"
                aria-label={isDark ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
              >
                {isDark ? <Sun size={15} strokeWidth={1.8} className="text-amber-400" /> : <Moon size={15} strokeWidth={1.8} />}
              </button>
              <Link
                href="/admin/appearance"
                onClick={() => {
                  setIsOpen(false);
                  handleTooltipLeave();
                }}
                onMouseEnter={(e) => handleTooltipEnter(e, 'Mon Apparence & Design')}
                onMouseLeave={handleTooltipLeave}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  pathname === '/admin/appearance'
                    ? 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white'
                    : 'text-slate-400 hover:text-[#0284c7] dark:hover:text-white hover:bg-sky-50 dark:hover:bg-white/[0.07]'
                }`}
                aria-label="Mon Apparence"
              >
                <Palette size={15.5} strokeWidth={1.8} />
              </Link>
              <Link
                href="/admin/profile"
                onClick={() => {
                  setIsOpen(false);
                  handleTooltipLeave();
                }}
                onMouseEnter={(e) => handleTooltipEnter(e, user?.name || 'Mon Profil')}
                onMouseLeave={handleTooltipLeave}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center text-xs font-bold hover:scale-105 transition-transform shadow-xs relative my-1 ring-2 ring-sky-200 dark:ring-white/15"
                aria-label="Mon Profil"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{getInitials(user?.name)}</span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0a0f1d] rounded-full" />
              </Link>
              <button
                onClick={handleLogout}
                onMouseEnter={(e) => handleTooltipEnter(e, 'Déconnexion')}
                onMouseLeave={handleTooltipLeave}
                className="w-9 h-8 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Déconnexion"
              >
                <LogOut size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ) : (
          /* ── EXPANDED DUAL-RAIL ARCHITECTURAL STUDIO (278px = 54px Left Spine + 224px Studio Panel) ── */
          <div className="flex w-full h-full">
            {/* LEFT SPINE (54px): High-Contrast Architectural Ink Rail */}
            <div className="nay-sidebar-spine w-[54px] shrink-0 h-full bg-[#0b1120] dark:bg-[#050914]/95 border-r border-slate-900 dark:border-white/[0.06] flex flex-col items-center py-3 justify-between transition-colors duration-200">
              <div className="flex flex-col items-center gap-2.5 w-full">
                {/* NAY Crystal Emblem */}
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  onMouseEnter={(e) => handleTooltipEnter(e, 'Maison NAY Parfums')}
                  onMouseLeave={handleTooltipLeave}
                  className="w-9 h-9 rounded-xl bg-white/10 dark:bg-[#0d162a] border border-white/15 dark:border-sky-400/30 shadow-xs hover:scale-105 transition-transform flex items-center justify-center p-1.5 relative"
                >
                  <Image src="/images/nay/nay-emblem.png" alt="NAY" width={19} height={19} className="object-contain" priority />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-[1.5px] border-[#0b1120] dark:border-[#050914]" />
                </Link>

                <div className="w-6 h-px bg-white/10" />

                {/* 5 Spine Pillars */}
                <div className="flex flex-col items-center gap-1.5 w-full px-1.5">
                  {(
                    [
                      { id: 'EXEC', label: 'Pilotage Exécutif', icon: <LayoutDashboard size={17} strokeWidth={1.9} />, badge: 12 },
                      { id: 'CATALOG', label: 'Catalogue & Stock', icon: <FlaskConical size={17} strokeWidth={1.9} /> },
                      { id: 'FINANCE', label: 'Finance & Luxe', icon: <TrendingUp size={17} strokeWidth={1.9} /> },
                      { id: 'GROWTH', label: 'Clients, CRM & Ads', icon: <Megaphone size={17} strokeWidth={1.9} /> },
                      { id: 'TEAM', label: 'Équipe & RH', icon: <Users size={17} strokeWidth={1.9} />, badge: 4 },
                    ] as const
                  ).map((spine) => {
                    const isSelected = activePillar === spine.id && !searchQuery.trim();
                    return (
                      <button
                        key={spine.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setActivePillar(spine.id);
                        }}
                        onMouseEnter={(e) => handleTooltipEnter(e, spine.label, 'badge' in spine ? spine.badge : undefined)}
                        onMouseLeave={handleTooltipLeave}
                        aria-label={spine.label}
                        className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center relative transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="nay-spine-active-pill"
                            transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                            className="absolute inset-0 rounded-xl"
                            style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
                            aria-hidden="true"
                          />
                        )}
                        <span className="relative z-10">{spine.icon}</span>
                        {'badge' in spine && spine.badge && !isSelected && (
                          <span
                            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Spine Global Controls */}
              <div className="flex flex-col items-center gap-1 w-full px-1.5">
                <div className="w-6 h-px bg-white/10 mb-1" />

                <Link
                  href="/"
                  target="_blank"
                  onMouseEnter={(e) => handleTooltipEnter(e, 'Vitrine Boutique')}
                  onMouseLeave={handleTooltipLeave}
                  className="w-8.5 h-8.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                  aria-label="Vitrine Boutique"
                >
                  <Store size={15.5} strokeWidth={1.8} />
                </Link>

                <button
                  type="button"
                  onClick={toggleTheme}
                  onMouseEnter={(e) => handleTooltipEnter(e, isDark ? 'Mode Clair' : 'Mode Sombre')}
                  onMouseLeave={handleTooltipLeave}
                  className="w-8.5 h-8.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label={isDark ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
                >
                  {isDark ? <Sun size={15} strokeWidth={1.8} className="text-amber-400" /> : <Moon size={15} strokeWidth={1.8} />}
                </button>

                <Link
                  href="/admin/appearance"
                  onClick={() => setIsOpen(false)}
                  onMouseEnter={(e) => handleTooltipEnter(e, 'Mon Apparence & Design')}
                  onMouseLeave={handleTooltipLeave}
                  className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-colors ${
                    pathname === '/admin/appearance'
                      ? 'bg-[#0ea5e9] text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                  aria-label="Mon Apparence"
                >
                  <Palette size={15.5} strokeWidth={1.8} />
                </Link>

                <Link
                  href="/admin/settings"
                  onClick={() => setIsOpen(false)}
                  onMouseEnter={(e) => handleTooltipEnter(e, 'Paramètres Boutique')}
                  onMouseLeave={handleTooltipLeave}
                  className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-colors ${
                    pathname === '/admin/settings'
                      ? 'bg-[#0ea5e9] text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                  aria-label="Paramètres"
                >
                  <Settings size={15.5} strokeWidth={1.8} />
                </Link>

                <button
                  onClick={handleLogout}
                  onMouseEnter={(e) => handleTooltipEnter(e, 'Déconnexion')}
                  onMouseLeave={handleTooltipLeave}
                  className="w-8.5 h-8.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Déconnexion"
                >
                  <LogOut size={15} strokeWidth={1.8} />
                </button>
              </div>
            </div>

            {/* RIGHT CURATED STUDIO PANEL (224px) */}
            <div className="flex-1 min-w-0 h-full flex flex-col">
              {/* Studio Header Card */}
              <div className="px-3 pt-3 pb-2.5 space-y-2.5 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-[#0284c7] dark:text-[#38bdf8]">
                      NAY PARFUMS
                    </div>
                    <h2 className="text-[13.5px] font-black tracking-tight text-slate-900 dark:text-white truncate mt-0.5">
                      {searchQuery.trim()
                        ? 'Résultats Recherche'
                        : activePillar === 'EXEC'
                        ? 'Pilotage Exécutif'
                        : activePillar === 'CATALOG'
                        ? 'Catalogue & Stock'
                        : activePillar === 'FINANCE'
                        ? 'Finance & Luxe'
                        : activePillar === 'GROWTH'
                        ? 'Clients & Croissance'
                        : 'Équipe & Maison'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      className="hidden lg:flex w-7 h-7 rounded-lg hover:bg-sky-50 dark:hover:bg-white/[0.07] text-slate-400 hover:text-[#0284c7] dark:hover:text-white items-center justify-center transition-colors cursor-pointer"
                      title="Réduire en rail icônes"
                      aria-label="Réduire la barre latérale"
                    >
                      <PanelLeftClose size={14.5} strokeWidth={1.9} />
                    </button>

                    {isOpen && (
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                        aria-label="Fermer le menu"
                      >
                        <X size={15} strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Whisper Global Search */}
                {design.sidebarShowSearch !== false && (
                  <div className="relative flex items-center">
                    <Search size={12.5} strokeWidth={2} className="absolute left-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrer tout..."
                      className="w-full h-8 pl-7.5 pr-6 rounded-xl bg-sky-50/60 dark:bg-white/[0.04] border border-sky-200/60 dark:border-white/[0.08] focus:border-[#0ea5e9] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.08] focus:outline-none text-[11.5px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        aria-label="Effacer la recherche"
                      >
                        <X size={12} />
                      </button>
                    ) : (
                      <kbd className="absolute right-2 text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
                        ⌘F
                      </kbd>
                    )}
                  </div>
                )}
              </div>

              <div className="mx-3 h-px bg-sky-200/50 dark:bg-white/[0.06] shrink-0" />

              {/* Curated Links for Active Pillar (or All Search Results) */}
              <nav
                onScroll={handleTooltipLeave}
                className="flex-1 px-2.5 py-2.5 overflow-y-auto overflow-x-hidden shopify-nav-scrollbar min-h-0 space-y-4"
              >
                {[
                  { key: 'general', pillar: 'EXEC', label: 'Principal', items: GENERAL_ITEMS, visible: hasGeneralItems },
                  { key: 'system', pillar: 'EXEC', label: 'Canaux & Système', items: SYSTEM_ITEMS, visible: hasSystemItems },
                  { key: 'catalogue', pillar: 'CATALOG', label: 'Flacons & Inventaire', items: CATALOGUE_ITEMS, visible: hasCatalogueItems },
                  { key: 'finance', pillar: 'FINANCE', label: 'Trésorerie & Marques', items: FINANCE_ITEMS, visible: hasFinanceItems },
                  { key: 'crm', pillar: 'GROWTH', label: 'Clients & CRM', items: CRM_ITEMS, visible: hasCrmItems },
                  { key: 'marketing', pillar: 'GROWTH', label: 'Marketing & SEO', items: MARKETING_ITEMS, visible: hasMarketingItems },
                  { key: 'team', pillar: 'TEAM', label: 'Équipe & Missions', items: TEAM_ITEMS, visible: hasTeamItems },
                ].map((group) => {
                  if (!group.visible) return null;
                  if (!searchQuery.trim() && group.pillar !== activePillar) {
                    return null;
                  }
                  return (
                    <div key={group.key}>
                      <div className="flex items-center gap-2 px-2 pb-1.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 shrink-0">
                          {group.label}
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-sky-200/70 dark:from-white/[0.08] to-transparent" />
                      </div>
                      <div className="space-y-0.5">{renderLinks(group.items, false)}</div>
                    </div>
                  );
                })}
              </nav>

              {/* Bottom Operator Profile Card */}
              {design.sidebarShowFooter !== false && (
                <>
                  <div className="mx-3 h-px bg-sky-200/50 dark:bg-white/[0.06] shrink-0" />
                  <div className="p-2.5 shrink-0">
                    <Link
                      href="/admin/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl bg-sky-50/70 dark:bg-white/[0.04] hover:bg-sky-100/70 dark:hover:bg-white/[0.08] border border-sky-200/60 dark:border-white/[0.07] transition-colors min-w-0 group"
                    >
                      <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white flex items-center justify-center text-[10.5px] font-bold shrink-0 relative ring-2 ring-sky-200/80 dark:ring-sky-500/25">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span>{getInitials(user?.name)}</span>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-white dark:border-[#0a0f1d] rounded-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate group-hover:text-[#0284c7] dark:group-hover:text-[#38bdf8] transition-colors">
                          {user?.name || 'AYOUB AIT YAHYA'}
                        </p>
                        <p className="text-[9px] uppercase font-bold tracking-wider text-[#0284c7] dark:text-[#38bdf8] leading-none mt-0.5">
                          {user?.isOwner ? 'Propriétaire' : (user?.role || 'Admin')}
                        </p>
                      </div>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Portal-like Fixed Floating Tooltip (Zero Clipping & Spring Motion) */}
      <AnimatePresence>
        {hoveredTooltip && (
          <motion.div
            key={hoveredTooltip.label}
            role="tooltip"
            initial={{ opacity: 0, x: -6, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -4, scale: 0.96 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            style={{ top: hoveredTooltip.top }}
            className={`hidden lg:flex fixed ${
              design.sidebarPosition === 'right'
                ? isCollapsed
                  ? 'right-[88px]'
                  : 'right-[74px]'
                : isCollapsed
                ? 'left-[88px]'
                : 'left-[74px]'
            } -translate-y-1/2 z-[70] pointer-events-none items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 backdrop-blur-md text-xs font-semibold shadow-[0_8px_24px_rgba(15,23,42,0.25)] border border-white/10 dark:border-slate-200/80 whitespace-nowrap`}
          >
            <span>{hoveredTooltip.label}</span>
            {hoveredTooltip.badge !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none ${
                  hoveredTooltip.badge === 'Live'
                    ? 'bg-emerald-500/20 text-emerald-300 dark:bg-emerald-100 dark:text-emerald-700'
                    : 'bg-sky-500/25 text-sky-200 dark:bg-sky-100 dark:text-sky-700'
                }`}
              >
                {hoveredTooltip.badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
