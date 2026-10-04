'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  ShoppingBag, 
  AlertTriangle, 
  CheckSquare, 
  MessageSquare, 
  Info, 
  Check, 
  Trash2, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  Clock, 
  Sparkles,
  Filter,
  CheckCircle2,
  Package,
  ArrowRight
} from 'lucide-react';
import AdminPushNotificationSettings from '@/components/admin/AdminPushNotificationSettings';


interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  metadata?: string | null;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mainTab, setMainTab] = useState<'feed' | 'push'>('feed');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'push') {
        setMainTab('push');
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (activeTab === 'UNREAD') {
        params.set('unreadOnly', 'true');
      } else if (activeTab !== 'ALL') {
        params.set('type', activeTab);
      }

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetchNotifications();

    const handleRealtimeNotif = (e: any) => {
      const newNotif = e.detail;
      if (newNotif && newNotif.id) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      }
    };

    window.addEventListener('nay_new_notification', handleRealtimeNotif);
    const interval = setInterval(fetchNotifications, 10000); // 10s auto-refresh

    return () => {
      window.removeEventListener('nay_new_notification', handleRealtimeNotif);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const triggerTestNotification = async (type = 'ORDER') => {
    setIsTesting(true);
    try {
      await fetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
    } catch (err) {
      console.error('Test notification error:', err);
    } finally {
      setIsTesting(false);
    }
  };

  const markAllAsRead = async () => {
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
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const markSingleAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const deleteSingle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const clearAllRead = async () => {
    if (!window.confirm('Voulez-vous supprimer toutes les notifications déjà lues ?')) return;
    try {
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearRead: true }),
      });
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  const handleRowClick = (notif: NotificationItem) => {
    if (!notif.isRead) {
      fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
      }).catch(() => {});
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingBag size={18} className="text-emerald-500" />;
      case 'STOCK':
        return <AlertTriangle size={18} className="text-amber-500" />;
      case 'TASK':
        return <CheckSquare size={18} className="text-sky-500" />;
      case 'MESSAGE':
        return <MessageSquare size={18} className="text-purple-500" />;
      default:
        return <Info size={18} className="text-slate-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ORDER':
        return 'Commande';
      case 'STOCK':
        return 'Alerte Stock';
      case 'TASK':
        return 'Mission / Tâche';
      case 'MESSAGE':
        return 'Message Équipe';
      default:
        return 'Système';
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
              Centre d&apos;Alertes
            </span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-medium bg-rose-50 px-2 py-0.2 rounded-full border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Bell size={22} className="text-neutral-900" />
            <span>Notifications du Projet</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Restez informés en temps réel de l&apos;état des stocks, des nouvelles commandes et des missions de l&apos;équipe.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => triggerTestNotification('ORDER')}
            disabled={isTesting}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Envoyer une fausse commande test pour écouter le son et voir l'alerte en direct"
          >
            <Sparkles size={13} className="text-emerald-600" />
            <span>{isTesting ? 'Émission...' : 'Tester Commande en Direct (Son + Pop-up)'}</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Check size={13} />
              <span>Tout marquer comme lu</span>
            </button>
          )}

          <button
            onClick={() => fetchNotifications()}
            className="p-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Actualiser"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main View Switcher: Live Feed vs Push & Devices */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
        <button
          onClick={() => setMainTab('feed')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
            mainTab === 'feed'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Bell size={16} />
          <span>Flux d&apos;alertes en direct</span>
        </button>

        <button
          onClick={() => setMainTab('push')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
            mainTab === 'push'
              ? 'bg-[#0ea5e9] text-white shadow-md shadow-sky-500/20'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Sparkles size={16} />
          <span>Notifications Push & Appareils PWA</span>
        </button>
      </div>

      {mainTab === 'push' ? (
        <AdminPushNotificationSettings />
      ) : (
        <>
          {/* Tabs & Filter Bar */}
          <div className="space-y-3">
            {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'Toutes', count: notifications.length },
            { id: 'UNREAD', label: 'Non lues', count: unreadCount },
            { id: 'ORDER', label: 'Commandes' },
            { id: 'STOCK', label: 'Alertes Stock' },
            { id: 'TASK', label: 'Missions' },
            { id: 'MESSAGE', label: 'Messages' },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-neutral-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium ${
                    isSelected ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans les notifications..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={clearAllRead}
              className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Effacer les lues</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-neutral-400 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Chargement des notifications...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 border border-neutral-200">
              <Bell size={20} />
            </div>
            <p className="text-xs font-semibold text-neutral-800">Aucune notification à afficher</p>
            <p className="text-[11px] text-neutral-400 max-w-sm">
              Vous recevrez ici des alertes instantanées pour les commandes, les ruptures de stock et les missions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleRowClick(notif)}
                className={`p-3.5 sm:p-4 flex items-start sm:items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors cursor-pointer group ${
                  !notif.isRead ? 'bg-neutral-50/40' : ''
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {getNotifIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-200">
                        {getTypeLabel(notif.type)}
                      </span>
                      <h4 className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-neutral-900 font-bold' : 'text-neutral-800'}`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-400">
                      <Clock size={10} />
                      <span>{getRelativeTime(notif.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {notif.link && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-neutral-700 group-hover:text-neutral-950 transition-colors">
                      <span>Voir</span>
                      <ArrowRight size={12} />
                    </span>
                  )}

                  {!notif.isRead && (
                    <button
                      onClick={(e) => markSingleAsRead(notif.id, e)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                      title="Marquer comme lu"
                    >
                      <Check size={14} />
                    </button>
                  )}

                  <button
                    onClick={(e) => deleteSingle(notif.id, e)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
