'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  PackageSearch, 
  Users, 
  Settings, 
  LogOut,
  ExternalLink, 
  Mail, 
  LayoutTemplate, 
  Bookmark, 
  Archive, 
  MessageSquare, 
  Ticket, 
  BookOpen, 
  UserCheck, 
  TrendingUp, 
  Sparkles, 
  Gift, 
  Menu, 
  X, 
  Star, 
  Activity,
  User,
  ShieldCheck,
  CheckSquare,
  History,
  Bell,
  Film,
  Banknote,
  Package,
  Layers,
  ChevronRight,
  Globe,
  Bot,
  HeartPulse,
  PieChart
} from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { href: '/admin', label: 'Tableau de bord', icon: <LayoutDashboard size={16} />, permission: 'dashboard.view' },
  { href: '/admin/orders', label: 'Commandes', icon: <ShoppingBag size={16} />, permission: 'orders.view' },
  { href: '/admin/products', label: 'Testeurs', icon: <PackageSearch size={16} />, permission: 'products.view' },
  { href: '/admin/coffrets', label: 'Coffrets Cadeaux', icon: <Gift size={16} />, permission: 'products.view' },
  { href: '/admin/parfums-originaux', label: 'Parfums Originaux', icon: <Sparkles size={16} />, permission: 'products.view' },
  { href: '/admin/master-copier', label: 'Master Copy', icon: <Sparkles size={16} />, permission: 'products.edit' },
  { href: '/admin/inventory', label: 'Inventaire & Stock', icon: <Archive size={16} />, permission: 'inventory.view' },
  { href: '/admin/brands', label: 'Marques de Luxe', icon: <Bookmark size={16} />, permission: 'products.view' },
  { href: '/admin/finance', label: 'Finance & CA Net', icon: <TrendingUp size={16} />, permission: 'finance.view_revenue' },
  { href: '/admin/finance?tab=EXPENSES', label: 'Charges & Dépenses', icon: <Banknote size={16} />, permission: 'finance.view_costs' },
];

const TEAM_ITEMS: MenuItem[] = [
  { href: '/admin/team', label: 'Gestion Équipe & Salaires', icon: <ShieldCheck size={16} />, permission: 'team.view' },
  { href: '/admin/team/roles', label: 'Annuaire des Rôles', icon: <Users size={16} />, permission: 'team.view' },
  { href: '/admin/tasks', label: 'Missions & Tâches', icon: <CheckSquare size={16} />, permission: 'tasks.view' },
  { href: '/admin/chat', label: 'NAY Chat', icon: <MessageSquare size={16} /> },
  { href: '/admin/notifications', label: 'Centre Notifications', icon: <Bell size={16} /> },
  { href: '/admin/activity', label: 'Journal d\'Activité', icon: <History size={16} />, permission: 'activity.view_all' },
];

const CRM_ITEMS: MenuItem[] = [
  { href: '/admin/customers', label: 'Tous les Clients', icon: <Users size={16} />, permission: 'customers.view' },
  { href: '/admin/customers/vip', label: 'Clients VIP & Fidélité', icon: <Star size={16} />, permission: 'customers.view_vip' },
  { href: '/admin/customers/segments', label: 'Segmentation Clients', icon: <PieChart size={16} />, permission: 'customers.view' },
  { href: '/admin/customers/at-risk', label: 'Clients à Risque', icon: <UserCheck size={16} />, permission: 'customers.view' },
  { href: '/admin/reviews', label: 'Avis & Témoignages', icon: <MessageSquare size={16} />, permission: 'reviews.view' },
];

const MARKETING_ITEMS: MenuItem[] = [
  { href: '/admin/ads', label: 'Gestionnaire Pubs (Meta, TikTok)', icon: <TrendingUp size={16} />, permission: 'marketing.view_analytics' },
  { href: '/admin/creatives', label: 'Créatifs Pubs (Ads UGC)', icon: <Film size={16} />, permission: 'marketing.manage_creatives' },
  { href: '/admin/marketing', label: 'Marketing & Rétention', icon: <TrendingUp size={16} />, permission: 'marketing.view' },
  { href: '/admin/marketing/campaigns', label: 'Campagnes & SMS', icon: <Mail size={16} />, permission: 'marketing.manage_campaigns' },
  { href: '/admin/marketing/live-carts', label: 'Paniers en direct (Live)', icon: <Activity size={16} />, permission: 'marketing.view_analytics' },
  { href: '/admin/landing-pages', label: 'Landing Pages', icon: <LayoutTemplate size={16} />, permission: 'marketing.manage_landing_pages' },
  { href: '/admin/promos', label: 'Codes Promo', icon: <Ticket size={16} />, permission: 'marketing.manage_promotions' },
  { href: '/admin/affiliates', label: 'Ambassadeurs', icon: <UserCheck size={16} />, permission: 'marketing.manage_affiliates' },
  { href: '/admin/analytics', label: 'Audience & Trafic', icon: <TrendingUp size={16} />, permission: 'marketing.view_analytics' },
  { href: '/admin/seo', label: 'Moteur SEO Maroc', icon: <Globe size={16} />, permission: 'marketing.manage_seo' },
  { href: '/admin/seo/ai', label: 'Visibilité IA Engine', icon: <Bot size={16} />, permission: 'marketing.manage_seo' },
  { href: '/admin/newsletter', label: 'Newsletter', icon: <Mail size={16} />, permission: 'marketing.manage_newsletter' },
  { href: '/admin/blog', label: 'Blog & Articles SEO', icon: <BookOpen size={16} />, permission: 'marketing.manage_seo' },
];

const SYSTEM_ITEMS: MenuItem[] = [
  { href: '/admin/messages', label: 'Messages Formulaire', icon: <MessageSquare size={16} />, permission: 'messages.view' },
  { href: '/admin/vitrine', label: 'Vitrine Recommandée', icon: <Sparkles size={16} />, permission: 'products.edit' },
  { href: '/admin/system/health', label: 'Santé & Intégrations', icon: <HeartPulse size={16} />, permission: 'settings.view' },
  { href: '/admin/profile', label: 'Mon Compte & Sécurité', icon: <User size={16} /> },
  { href: '/admin/settings', label: 'Paramètres Boutique', icon: <Settings size={16} />, permission: 'settings.view' },
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
  const [user, setUser] = useState<AdminUser | null>(null);

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
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/admin/login';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NA';
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

  const renderLinks = (items: MenuItem[]) => {
    const visibleItems = items.filter(isItemVisible);
    if (visibleItems.length === 0) return null;

    return visibleItems.map((item) => {
      const isExactOrSub = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href.split('?')[0]}/`));
      const isActive = item.href.includes('?') ? `${pathname}${typeof window !== 'undefined' ? window.location.search : ''}` === item.href : isExactOrSub;
      
      return (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          onClick={() => setIsOpen(false)}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
            isActive 
              ? 'bg-sky-50 text-[#1D9BF0] font-semibold border border-sky-100/90 shadow-2xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`shrink-0 transition-colors ${isActive ? 'text-[#1D9BF0]' : 'text-slate-400 group-hover:text-slate-700'}`}>
              {item.icon}
            </div>
            <span className="truncate">{item.label}</span>
          </div>

          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D9BF0] shrink-0" />
          )}
        </Link>
      );
    });
  };

  const hasGeneralItems = MENU_ITEMS.some(isItemVisible);
  const hasTeamItems = TEAM_ITEMS.some(isItemVisible);
  const hasCrmItems = CRM_ITEMS.some(isItemVisible);
  const hasMarketingItems = MARKETING_ITEMS.some(isItemVisible);
  const hasSystemItems = SYSTEM_ITEMS.some(isItemVisible);

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white text-slate-900 flex items-center justify-between px-4 z-40 border-b border-slate-200/80 shadow-xs">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-sky-200 p-1 flex items-center justify-center shadow-2xs">
            <Image 
              src="/images/nay/nay-logo-blue.png" 
              alt="NAY" 
              width={22} 
              height={22}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 tracking-wider">NAY PARFUMS</div>
            <div className="text-[10px] text-slate-400 font-medium">Administration</div>
          </div>
        </Link>
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/30 z-40 backdrop-blur-xs" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside className={`w-[260px] bg-white border-r border-slate-200/80 h-screen flex flex-col fixed left-0 top-0 z-50 text-slate-700 transition-transform duration-200 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} lg:translate-x-0`}>
        
        {/* Brand Top Header */}
        <div className="p-4 pb-3 flex justify-between items-center border-b border-slate-100 bg-gradient-to-b from-sky-50/30 to-white">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-white border border-sky-200 p-1.5 flex items-center justify-center shadow-2xs group-hover:border-[#1D9BF0] transition-colors">
              <Image 
                src="/images/nay/nay-logo-blue.png" 
                alt="NAY Logo" 
                width={26} 
                height={26}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-slate-900 group-hover:text-[#1D9BF0] transition-colors">
                NAY PARFUMS
              </div>
              <div className="text-[10px] text-slate-600 font-medium">
                Maison de Luxe
              </div>
            </div>
          </Link>

          {isOpen && (
            <button 
              onClick={() => setIsOpen(false)} 
              className="lg:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
          {hasGeneralItems && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 px-3">
                Général
              </div>
              <div className="space-y-0.5">
                {renderLinks(MENU_ITEMS)}
              </div>
            </div>
          )}

          {hasTeamItems && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 px-3 flex items-center justify-between">
                <span>Équipe & Rôles</span>
              </div>
              <div className="space-y-0.5">
                {renderLinks(TEAM_ITEMS)}
              </div>
            </div>
          )}

          {hasCrmItems && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 px-3">
                Clients & CRM
              </div>
              <div className="space-y-0.5">
                {renderLinks(CRM_ITEMS)}
              </div>
            </div>
          )}

          {hasMarketingItems && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 px-3">
                Marketing & Ventes
              </div>
              <div className="space-y-0.5">
                {renderLinks(MARKETING_ITEMS)}
              </div>
            </div>
          )}

          {hasSystemItems && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 px-3">
                Système
              </div>
              <div className="space-y-0.5">
                {renderLinks(SYSTEM_ITEMS)}
              </div>
            </div>
          )}
        </nav>

        {/* Current Connected User Footer Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 mt-auto space-y-2">
          {/* User Profile Card */}
          <Link
            href="/admin/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded-xl bg-white hover:bg-slate-100/80 border border-slate-200/90 shadow-2xs transition-all group"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200 text-[#0284c7] flex items-center justify-center text-xs font-bold">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{getInitials(user?.name)}</span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-[#1D9BF0] transition-colors">
                {user?.name || 'Administrateur'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#0284c7] bg-sky-100/70 border border-sky-200/60 px-1.5 py-0.2 rounded">
                  {user?.isOwner ? 'Propriétaire' : (user?.role || 'Membre')}
                </span>
              </div>
            </div>
          </Link>

          {/* Quick Action Links */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <Link 
              href="/" 
              target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
              title="Voir la boutique publique"
            >
              <ExternalLink size={12} className="text-slate-400" />
              <span>Boutique</span>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
              title="Déconnexion sécurisée"
            >
              <LogOut size={12} />
              <span>Quitter</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
