'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  TrendingUp,
  BarChart3,
  Users,
  Palette,
  Search,
  Sun,
  Moon,
  PanelLeft,
  Menu,
  Plus,
  X,
  Package,
  Headphones,
  MessageSquare,
  Globe2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAdminTheme } from '@/context/AdminThemeContext';

export default function AdminMobileBottomBar() {
  const pathname = usePathname();
  const { design, theme, toggleTheme, toggleSidebar, updateDesign, isSidebarCollapsed } = useAdminTheme();
  const [mobileHubOpen, setMobileHubOpen] = useState(false);

  if (pathname === '/admin/login') return null;

  const sidebarOffset = design.sidebarHidden
    ? '0px'
    : isSidebarCollapsed
    ? '80px'
    : 'calc(var(--admin-sidebar-w, 278px) + 12px)';
  const sbLeft = design.sidebarPosition === 'right' ? '0px' : sidebarOffset;
  const sbRight = design.sidebarPosition === 'right' ? sidebarOffset : '0px';

  const handleOpenMenu = () => {
    setMobileHubOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nay_open_admin_drawer'));
    }
  };

  const handleOpenSearch = () => {
    setMobileHubOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
      );
    }
  };

  const handleDesktopSidebarToggle = () => {
    if (design.sidebarHidden) {
      updateDesign({ sidebarHidden: false });
    } else {
      toggleSidebar();
    }
  };

  const isDashboardActive = pathname === '/admin';
  const isOrdersActive = pathname.startsWith('/admin/orders');
  const isCatalogActive =
    pathname.startsWith('/admin/products') ||
    pathname.startsWith('/admin/inventory') ||
    pathname.startsWith('/admin/coffrets') ||
    pathname.startsWith('/admin/parfums-originaux') ||
    pathname.startsWith('/admin/master-copier');
  const isFinanceActive = pathname.startsWith('/admin/finance');
  const isAnalyticsActive = pathname.startsWith('/admin/analytics');
  const isCustomersActive = pathname.startsWith('/admin/customers');
  const isAppearanceActive = pathname.startsWith('/admin/appearance');

  const coreItems = [
    { href: '/admin', label: 'Accueil', active: isDashboardActive, icon: LayoutDashboard, desktopOnly: false },
    { href: '/admin/orders', label: 'Commandes', active: isOrdersActive, icon: ShoppingBag, desktopOnly: false },
    { href: '/admin/products', label: 'Catalogue', active: isCatalogActive, icon: Boxes, desktopOnly: false },
    { href: '/admin/analytics', label: 'Analytics', active: isAnalyticsActive, icon: BarChart3, desktopOnly: true },
    { href: '/admin/customers', label: 'Clients', active: isCustomersActive, icon: Users, desktopOnly: true },
    { href: '/admin/finance', label: 'Finance', active: isFinanceActive, icon: TrendingUp, desktopOnly: true },
    { href: '/admin/appearance', label: 'Studio', active: isAppearanceActive, icon: Palette, desktopOnly: true },
  ];

  const showDesktopTaskbar = design.taskbarShowOnDesktop && design.taskbarStyle !== 'none';
  const isAccentBar = design.taskbarStyle === 'accent_bar';
  const isDarkIsland =
    design.taskbarStyle === 'dynamic_island' ||
    design.taskbarStyle === 'obsidian_bar' ||
    design.taskbarStyle === 'neon_pulse';

  const compact = design.taskbarCompact;
  const showLabels = design.taskbarShowLabels !== false;
  const accentColor = design.accentColor || '#0ea5e9';

  return (
    <>
      {/* ── PHONE QUICK CONTROL BOTTOM SHEET (< 1024px) ── */}
      <AnimatePresence>
        {mobileHubOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
              onClick={() => setMobileHubOpen(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 390, damping: 34 }}
              className="relative z-10 rounded-t-[28px] bg-white/98 dark:bg-[#0b1120]/98 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/10 shadow-[0_-18px_50px_rgba(0,0,0,0.35)] px-4 pt-3 pb-6 space-y-4 max-h-[82dvh] overflow-y-auto"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              {/* Native Sheet Drag Handle */}
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    Hub Mobile NAY
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Raccourcis &amp; Contrôles
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileHubOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-200 cursor-pointer"
                  aria-label="Fermer le hub mobile"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search + Theme Instant Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenSearch}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-left active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <span
                    className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Search size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Rechercher</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Parfum, #NF...</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-left active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0">
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Apparence instant.</div>
                  </div>
                </button>
              </div>

              {/* Mobile Quick App Tiles */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { href: '/admin/orders?tab=UNCONFIRMED', label: 'À Confirmer', icon: ShoppingBag, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/12 border-amber-500/25' },
                  { href: '/admin/finance', label: 'Finance', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/12 border-emerald-500/25' },
                  { href: '/admin/inventory', label: 'Stocks', icon: Package, color: 'text-sky-600 dark:text-sky-400 bg-sky-500/12 border-sky-500/25' },
                  { href: '/admin/customers', label: 'Clients CRM', icon: Users, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/12 border-indigo-500/25' },
                  { href: '/admin/sav', label: 'SAV Retours', icon: Headphones, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/12 border-rose-500/25' },
                  { href: '/admin/chat', label: 'Messages', icon: MessageSquare, color: 'text-teal-600 dark:text-teal-400 bg-teal-500/12 border-teal-500/25' },
                  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, color: 'text-violet-600 dark:text-violet-400 bg-violet-500/12 border-violet-500/25' },
                  { href: '/admin/appearance', label: 'Design', icon: Palette, color: 'text-pink-600 dark:text-pink-400 bg-pink-500/12 border-pink-500/25' },
                  { href: '/', label: 'Vitrine', icon: Globe2, color: 'text-slate-700 dark:text-slate-200 bg-slate-500/12 border-slate-500/25', external: true },
                ].map((tile) => {
                  const TileIcon = tile.icon;
                  return (
                    <Link
                      key={tile.href}
                      href={tile.href}
                      target={tile.external ? '_blank' : undefined}
                      onClick={() => setMobileHubOpen(false)}
                      className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/75 dark:border-white/[0.08] active:scale-95 transition-transform text-center"
                    >
                      <span className={`w-9 h-9 rounded-xl border flex items-center justify-center ${tile.color}`}>
                        <TileIcon size={16} />
                      </span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-full">
                        {tile.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Open Full Navigation Drawer Link */}
              <button
                type="button"
                onClick={handleOpenMenu}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={14} />
                  <span>Explorer tous les modules Admin</span>
                </span>
                <ChevronRight size={15} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM DOCK (PHONE FLOATING CAPSULE DOCK + OPTIONAL DESKTOP TASKBAR) ── */}
      <nav
        aria-label="Barre des tâches et navigation rapide"
        className={`admin-mobile-taskbar nay-bottom-taskbar ${
          showDesktopTaskbar ? 'flex' : 'flex lg:hidden'
        } fixed bottom-2.5 inset-x-3 lg:bottom-0 lg:inset-x-0 z-40 rounded-[22px] lg:rounded-none bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-2xl border border-slate-900/[0.1] lg:border-x-0 lg:border-b-0 lg:border-t dark:border-white/[0.12] shadow-[0_12px_36px_rgba(15,23,42,0.14)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.65)] px-2 pt-1.5 pb-1.5 transition-all duration-200`}
        style={{
          paddingBottom: 'max(0.45rem, env(safe-area-inset-bottom))',
          '--nay-sb-left': sbLeft,
          '--nay-sb-right': sbRight,
        } as React.CSSProperties}
      >
        <div className="nay-taskbar-inner flex items-center justify-around lg:justify-center gap-0.5 lg:gap-1 max-w-lg lg:max-w-none mx-auto w-full">
          {/* Mobile: First 2 primary tabs (Accueil, Commandes) */}
          {coreItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const activeColor = isAccentBar
              ? '#ffffff'
              : isDarkIsland
              ? 'var(--admin-accent, #38bdf8)'
              : 'var(--admin-accent, #0ea5e9)';
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                style={item.active ? { color: activeColor } : undefined}
                className={`nay-taskbar-item relative flex flex-col items-center justify-center ${
                  compact ? 'min-h-[42px] py-1 lg:px-2.5' : 'min-h-[48px] lg:min-h-[44px] py-1 lg:px-3'
                } flex-1 lg:flex-initial rounded-2xl lg:rounded-xl transition-all duration-150 ${
                  item.active
                    ? 'font-semibold bg-slate-900/[0.05] dark:bg-white/[0.1]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.05]'
                }`}
              >
                {item.active && (
                  <span
                    className="hidden lg:block absolute bottom-0.5 w-6 h-[2.5px] rounded-full"
                    style={{ backgroundColor: activeColor }}
                  />
                )}
                <Icon size={compact ? 17 : 19} strokeWidth={item.active ? 2.25 : 1.75} />
                {showLabels && (
                  <span className="nay-taskbar-label text-[10px] mt-0.5 tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Mobile Center Floating Action Hub Button */}
          <button
            type="button"
            onClick={() => setMobileHubOpen((prev) => !prev)}
            className="lg:hidden relative -mt-5 w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0 cursor-pointer border-2 border-white dark:border-[#0b1120]"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, #0284c7 100%)`,
              boxShadow: `0 8px 22px -4px ${accentColor}66`,
            }}
            aria-label="Ouvrir le hub d'actions rapides mobile"
          >
            <Plus
              size={22}
              strokeWidth={2.5}
              className={`transition-transform duration-200 ${mobileHubOpen ? 'rotate-45' : ''}`}
            />
          </button>

          {/* Remaining core tabs (Catalogue on both; Analytics, Clients, Finance, Studio on desktop) */}
          {coreItems.slice(2).map((item) => {
            const Icon = item.icon;
            const activeColor = isAccentBar
              ? '#ffffff'
              : isDarkIsland
              ? 'var(--admin-accent, #38bdf8)'
              : 'var(--admin-accent, #0ea5e9)';
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                style={item.active ? { color: activeColor } : undefined}
                className={`nay-taskbar-item relative ${
                  item.desktopOnly ? 'hidden lg:flex' : 'flex'
                } flex-col items-center justify-center ${
                  compact ? 'min-h-[42px] py-1 lg:px-2.5' : 'min-h-[48px] lg:min-h-[44px] py-1 lg:px-3'
                } flex-1 lg:flex-initial rounded-2xl lg:rounded-xl transition-all duration-150 ${
                  item.active
                    ? 'font-semibold bg-slate-900/[0.05] dark:bg-white/[0.1]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.05]'
                }`}
              >
                {item.active && (
                  <span
                    className="hidden lg:block absolute bottom-0.5 w-6 h-[2.5px] rounded-full"
                    style={{ backgroundColor: activeColor }}
                  />
                )}
                <Icon size={compact ? 17 : 19} strokeWidth={item.active ? 2.25 : 1.75} />
                {showLabels && (
                  <span className="nay-taskbar-label text-[10px] mt-0.5 tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Desktop utility separator + quick tools */}
          <span
            aria-hidden="true"
            className="hidden lg:block h-5 w-px bg-slate-900/12 dark:bg-white/15 mx-1"
          />

          <button
            type="button"
            onClick={handleOpenSearch}
            title="Recherche rapide (Ctrl+K)"
            className={`nay-taskbar-item hidden lg:flex flex-col items-center justify-center ${
              compact ? 'min-h-[38px] py-1 px-2.5' : 'min-h-[44px] py-1 px-3'
            } rounded-xl transition-all duration-150 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.05] cursor-pointer active:scale-95`}
          >
            <Search size={compact ? 16 : 18} strokeWidth={1.8} />
            {showLabels && (
              <span className="nay-taskbar-label text-[10px] mt-0.5 tracking-tight whitespace-nowrap">
                Ctrl+K
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
            className={`nay-taskbar-item hidden lg:flex flex-col items-center justify-center ${
              compact ? 'min-h-[38px] py-1 px-2.5' : 'min-h-[44px] py-1 px-3'
            } rounded-xl transition-all duration-150 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.05] cursor-pointer active:scale-95`}
          >
            {theme === 'dark' ? (
              <Sun size={compact ? 16 : 18} strokeWidth={1.8} />
            ) : (
              <Moon size={compact ? 16 : 18} strokeWidth={1.8} />
            )}
            {showLabels && (
              <span className="nay-taskbar-label text-[10px] mt-0.5 tracking-tight whitespace-nowrap">
                {theme === 'dark' ? 'Clair' : 'Sombre'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleDesktopSidebarToggle}
            title="Basculer la barre latérale"
            className={`nay-taskbar-item hidden lg:flex flex-col items-center justify-center ${
              compact ? 'min-h-[38px] py-1 px-2.5' : 'min-h-[44px] py-1 px-3'
            } rounded-xl transition-all duration-150 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.05] cursor-pointer active:scale-95`}
          >
            <PanelLeft size={compact ? 16 : 18} strokeWidth={1.8} />
            {showLabels && (
              <span className="nay-taskbar-label text-[10px] mt-0.5 tracking-tight whitespace-nowrap">
                Barre
              </span>
            )}
          </button>

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={handleOpenMenu}
            className={`nay-taskbar-item flex lg:hidden flex-col items-center justify-center ${
              compact ? 'min-h-[42px] py-1' : 'min-h-[48px] py-1'
            } flex-1 rounded-2xl transition-colors duration-150 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-95`}
            aria-label="Ouvrir le menu complet"
          >
            <Menu size={compact ? 17 : 19} strokeWidth={1.85} />
            {showLabels && (
              <span className="nay-taskbar-label text-[10px] mt-0.5 tracking-tight font-medium">
                Menu
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
