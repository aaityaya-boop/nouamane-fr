'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  User, 
  ShieldCheck, 
  History, 
  LogOut, 
  ExternalLink, 
  ChevronDown, 
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
  Moon
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

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useAdminTheme();

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTimeCasablanca, setCurrentTimeCasablanca] = useState('');

  // Live Clock in official Africa/Casablanca Moroccan time (GMT+1 / UTC+1)
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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Hide header on login page
  if (pathname === '/admin/login') return null;

  // Fetch Current Admin Profile
  useEffect(() => {
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      isMounted = false;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch Notifications & Polling
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=7');
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
    const interval = setInterval(fetchNotifications, 10000); // 10s backup poll

    return () => {
      window.removeEventListener('nay_new_notification', handleRealtimeNotif);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

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

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingBag size={14} className="text-emerald-500" />;
      case 'STOCK':
        return <AlertTriangle size={14} className="text-amber-500" />;
      case 'TASK':
        return <CheckSquare size={14} className="text-sky-500" />;
      case 'MESSAGE':
        return <MessageSquare size={14} className="text-purple-500" />;
      default:
        return <Info size={14} className="text-slate-400" />;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getPageContextLabel = (path: string) => {
    if (path === '/admin') return 'Tableau de Bord Global';
    if (path.startsWith('/admin/orders')) return 'Gestion des Commandes';
    if (path.startsWith('/admin/products')) return 'Catalogue des Testeurs (199)';
    if (path.startsWith('/admin/coffrets')) return 'Coffrets Cadeaux';
    if (path.startsWith('/admin/parfums-originaux')) return 'Parfums Originaux';
    if (path.startsWith('/admin/master-copier')) return 'Master Copy 1:1';
    if (path.startsWith('/admin/inventory')) return 'Inventaire & Stocks';
    if (path.startsWith('/admin/suppliers')) return 'Gestion des Fournisseurs & Approvisionnements';
    if (path.startsWith('/admin/brands')) return 'Marques de Luxe';
    if (path.startsWith('/admin/team/suggestions')) return 'Boîte à Idées & Suggestions';
    if (path.startsWith('/admin/team/reclamations')) return 'Réclamations & Signalements RH';
    if (path.startsWith('/admin/team/roles')) return 'Matrice des 26 Rôles';
    if (path.startsWith('/admin/team')) return 'Équipe, Salaires & RBAC';
    if (path.startsWith('/admin/tasks')) return 'Missions & Tâches (Kanban)';
    if (path.startsWith('/admin/chat')) return 'NAY Chat Interne';
    if (path.startsWith('/admin/notifications')) return 'Centre de Notifications';
    if (path.startsWith('/admin/activity')) return 'Journal d\'Activité & Audit';
    if (path.startsWith('/admin/customers/vip')) return 'Clients VIP & Fidélité';
    if (path.startsWith('/admin/customers/segments')) return 'Segmentation Clients';
    if (path.startsWith('/admin/customers/at-risk')) return 'Clients à Risque';
    if (path.startsWith('/admin/customers')) return 'Fichier Clients & CRM';
    if (path.startsWith('/admin/reviews')) return 'Avis & Témoignages';
    if (path.startsWith('/admin/creatives')) return 'Créatifs Publicitaires (Ads UGC)';
    if (path.startsWith('/admin/marketing/campaigns')) return 'Campagnes SMS & Emailing';
    if (path.startsWith('/admin/marketing/live-carts')) return 'Paniers en Direct (Live)';
    if (path.startsWith('/admin/marketing')) return 'Marketing & Rétention';
    if (path.startsWith('/admin/landing-pages')) return 'Landing Pages Promos';
    if (path.startsWith('/admin/promos')) return 'Codes Promo & Réductions';
    if (path.startsWith('/admin/affiliates')) return 'Ambassadeurs & Influenceurs';
    if (path.startsWith('/admin/analytics')) return 'Audience & Trafic';
    if (path.startsWith('/admin/seo/ai')) return 'Command Center Visibilité IA';
    if (path.startsWith('/admin/seo')) return 'Moteur SEO Maroc';
    if (path.startsWith('/admin/newsletter')) return 'Abonnés Newsletter';
    if (path.startsWith('/admin/blog')) return 'Blog & Rédaction SEO';
    if (path.startsWith('/admin/messages')) return 'Messages Clients';
    if (path.startsWith('/admin/vitrine')) return 'Configuration Vitrine';
    if (path.startsWith('/admin/system/health')) return 'Santé Système & APIs';
    if (path.startsWith('/admin/system/deployment')) return 'Checklist Déploiement';
    if (path.startsWith('/admin/profile')) return 'Mon Profil & Sécurité';
    if (path.startsWith('/admin/settings')) return 'Paramètres Boutique';
    return 'Administration NAY';
  };

  return (
    <header className="admin-header w-full bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_-2px_rgba(14,165,233,0.06),0_1px_3px_rgba(0,0,0,0.03)] px-4 lg:px-8 py-3 mb-6 rounded-2xl flex items-center justify-between transition-all">
      {/* Left: Breadcrumb / Active Route Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:inline">
            Admin /
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
            {getPageContextLabel(pathname)}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-200/80">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-[#0ea5e9] bg-white/90 hover:bg-sky-50 px-2.5 py-1 rounded-lg border border-slate-200/80 hover:border-sky-200 transition-all shadow-2xs"
            title="Ouvrir la boutique publique dans un nouvel onglet"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>nayparfum.ma</span>
            <ExternalLink size={11} className="text-slate-400" />
          </Link>

          {/* Live Casablanca Clock */}
          <div 
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs"
            title="Heure officielle du Maroc (Casablanca)"
          >
            <Clock size={12} className="text-[#0ea5e9]" />
            <span className="text-slate-400 font-medium">Casablanca :</span>
            <span className="font-mono font-bold text-slate-800">{currentTimeCasablanca || '--:--:--'}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Theme Switcher, Chat, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto">
        {/* DARK / LIGHT THEME TOGGLE BUTTON */}
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-slate-100/80 transition-all relative flex items-center justify-center cursor-pointer border border-transparent hover:border-slate-200/80"
          title={isDark ? "Basculer en Mode Clair (☀️)" : "Basculer en Mode Sombre (🌙)"}
          aria-label="Changer de thème d'affichage"
        >
          {isDark ? (
            <Sun size={18} className="text-amber-400" />
          ) : (
            <Moon size={18} className="text-slate-600 hover:text-indigo-600 transition-colors" />
          )}
        </button>

        {/* TEAM CHAT QUICK BUTTON */}
        <Link
          href="/admin/chat"
          className="p-2 rounded-xl text-slate-500 hover:text-[#0ea5e9] hover:bg-slate-100/80 transition-colors relative flex items-center justify-center cursor-pointer border border-transparent hover:border-slate-200/80"
          title="Messagerie d'équipe (NAY Chat)"
        >
          <MessageSquare size={18} />
        </Link>

        {/* NOTIFICATIONS BELL & FLYOUT */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-[#0ea5e9] hover:bg-slate-100/80 transition-colors relative flex items-center justify-center cursor-pointer border border-transparent hover:border-slate-200/80"
            aria-label="Centre de notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION FLYOUT DROPDOWN */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
              {/* Flyout Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-[#0ea5e9]" />
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Notifications & Alertes
                  </h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                      {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] font-semibold text-[#0ea5e9] hover:text-sky-700 cursor-pointer flex items-center gap-1"
                  >
                    <Check size={12} />
                    <span>Tout lire</span>
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <Bell size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Aucune notification pour l'instant</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tout est à jour sur votre boutique</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-xs ${
                        !notif.isRead ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        {getNotifIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className={`font-bold truncate ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#0ea5e9] shrink-0" />
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {getRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Flyout Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-center">
                <Link
                  href="/admin/notifications"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs font-bold text-[#0ea5e9] hover:text-sky-700 block transition-colors"
                >
                  Voir tout le centre de notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Connected Personal Owner Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100/80 border border-transparent hover:border-slate-200/80 transition-all focus:outline-none cursor-pointer"
            aria-label="Menu profil administrateur"
          >
            {/* Avatar Pill */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white overflow-hidden">
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

            {/* User Info */}
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {isLoading ? 'Chargement...' : currentUser?.name || 'Administrateur'}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#0284c7] leading-tight">
                {currentUser?.isOwner ? 'Propriétaire NAY' : (currentUser?.role || 'Membre')}
              </div>
            </div>

            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-slate-700' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profile Card Header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-sky-500/20 overflow-hidden shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400 font-medium">Statut compte</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={11} />
                    Actif
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="py-1">
                <Link
                  href="/admin/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0ea5e9] transition-colors"
                >
                  <User size={15} />
                  <span>Mon Compte & Profil</span>
                </Link>

                <Link
                  href="/admin/chat"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0ea5e9] transition-colors"
                >
                  <MessageSquare size={15} className="text-[#0ea5e9]" />
                  <span>Messagerie d'Équipe (NAY Chat)</span>
                </Link>

                <Link
                  href="/admin/notifications"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0ea5e9] transition-colors"
                >
                  <Bell size={15} className="text-amber-500" />
                  <span>Centre de Notifications</span>
                </Link>

                <Link
                  href="/admin/tasks"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0ea5e9] transition-colors"
                >
                  <CheckSquare size={15} className="text-emerald-500" />
                  <span>Missions & Tâches</span>
                </Link>

                <Link
                  href="/admin/activity"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0ea5e9] transition-colors"
                >
                  <History size={15} className="text-purple-500" />
                  <span>Journal d'Activité Global</span>
                </Link>

                <Link
                  href="/admin/profile?tab=security"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0ea5e9] transition-colors"
                >
                  <ShieldCheck size={15} />
                  <span>Sécurité & Mon Mot de Passe</span>
                </Link>
              </div>

              {/* Footer / Logout */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
