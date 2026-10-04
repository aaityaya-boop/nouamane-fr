'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Laptop,
  Trash2,
  Sparkles,
  ShieldAlert,
  ShoppingBag,
  Package,
  CreditCard,
  ShieldCheck,
  Info,
  Loader2,
  RefreshCw,
  HelpCircle,
  Check,
} from 'lucide-react';

interface DeviceItem {
  id: string;
  deviceName: string;
  userAgent?: string | null;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
  endpointPreview: string;
}

interface PreferencesState {
  orders: boolean;
  stock: boolean;
  finance: boolean;
  security: boolean;
  system: boolean;
}

interface AuthorizedState {
  orders: boolean;
  stock: boolean;
  finance: boolean;
  security: boolean;
  system: boolean;
}

type PushSupportState = 'SUPPORTED' | 'NOT_SUPPORTED' | 'IOS_NEEDS_PWA';
type PermissionStatusState = 'granted' | 'denied' | 'default' | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function AdminPushNotificationSettings() {
  const [supportState, setSupportState] = useState<PushSupportState>('SUPPORTED');
  const [permissionState, setPermissionState] = useState<PermissionStatusState>('default');
  const [isSubscribedOnDevice, setIsSubscribedOnDevice] = useState(false);
  const [currentSubscriptionEndpoint, setCurrentSubscriptionEndpoint] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [preferences, setPreferences] = useState<PreferencesState>({
    orders: true,
    stock: true,
    finance: true,
    security: true,
    system: true,
  });
  const [authorized, setAuthorized] = useState<AuthorizedState>({
    orders: true,
    stock: true,
    finance: true,
    security: true,
    system: true,
  });
  const [testCategory, setTestCategory] = useState<'ORDER' | 'STOCK' | 'FINANCE' | 'SECURITY' | 'SYSTEM'>('ORDER');

  // 1. Detect Support & Subscription State
  const checkStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // Check iOS PWA requirement (iOS requires standalone mode for Web Push)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      if (isIOS && !isStandalone) {
        setSupportState('IOS_NEEDS_PWA');
      } else {
        setSupportState('NOT_SUPPORTED');
      }
      setPermissionState('unsupported');
      setLoading(false);
      return;
    }

    setSupportState('SUPPORTED');
    setPermissionState(Notification.permission as PermissionStatusState);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setIsSubscribedOnDevice(true);
        setCurrentSubscriptionEndpoint(sub.endpoint);
      } else {
        setIsSubscribedOnDevice(false);
        setCurrentSubscriptionEndpoint(null);
      }
    } catch (err) {
      console.warn('[PushSettings] Error inspecting subscription:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Devices and Preferences
  const fetchData = useCallback(async () => {
    try {
      const [devRes, prefRes] = await Promise.all([
        fetch('/api/admin/push/devices'),
        fetch('/api/admin/push/preferences'),
      ]);

      if (devRes.ok) {
        const devData = await devRes.json();
        if (devData.success) {
          setDevices(devData.devices || []);
        }
      }

      if (prefRes.ok) {
        const prefData = await prefRes.json();
        if (prefData.success) {
          if (prefData.preferences) setPreferences(prefData.preferences);
          if (prefData.authorized) setAuthorized(prefData.authorized);
        }
      }
    } catch (err) {
      console.error('[PushSettings] Error loading settings:', err);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    fetchData();
  }, [checkStatus, fetchData]);

  // 3. User-Initiated Subscribe (Explicit Click ONLY)
  const handleSubscribe = async () => {
    setActionLoading(true);
    setFeedbackMessage(null);

    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        throw new Error('Notifications non supportées sur ce navigateur');
      }

      // Step A: Request Permission explicitly
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PermissionStatusState);

      if (permission !== 'granted') {
        setFeedbackMessage({
          type: 'error',
          text: 'Autorisation refusée par le navigateur. Veuillez activer les notifications dans les paramètres de votre appareil.',
        });
        setActionLoading(false);
        return;
      }

      // Step B: Ensure Service Worker is ready
      let reg = await navigator.serviceWorker.getRegistration('/admin');
      if (!reg) {
        reg = await navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin' });
      }
      await navigator.serviceWorker.ready;

      // Step C: Fetch VAPID Public Key from environment or fallback
      const vapidKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        'BDS7OJDbz0_1a1w4bIKog8AKpvgVO8ubnxFHoJ-e9EWMJW9jdTdyTNM5wGdd1UzSB4SY6T02TpGclZhG9kC0ay4';

      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);

      // Step D: Subscribe via PushManager
      const pushSubscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });

      const subJson = pushSubscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('Clés de souscription incomplètes reçues du navigateur');
      }

      // Step E: Save subscription to database
      const saveRes = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
          userAgent: navigator.userAgent,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || 'Erreur lors de l\'enregistrement sur le serveur');
      }

      setIsSubscribedOnDevice(true);
      setCurrentSubscriptionEndpoint(subJson.endpoint);
      setFeedbackMessage({
        type: 'success',
        text: 'Cet appareil recevra désormais les alertes de commandes et de stock en direct !',
      });

      await fetchData();
    } catch (err: any) {
      console.error('[PushSettings] Subscribe error:', err);
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Échec de l\'activation des notifications push.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Unsubscribe this device
  const handleUnsubscribeThisDevice = async () => {
    setActionLoading(true);
    setFeedbackMessage(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/admin/push/unsubscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }

      setIsSubscribedOnDevice(false);
      setCurrentSubscriptionEndpoint(null);
      setFeedbackMessage({
        type: 'info',
        text: 'Notifications push désactivées avec succès sur cet appareil.',
      });

      await fetchData();
    } catch (err: any) {
      console.error('[PushSettings] Unsubscribe error:', err);
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Erreur lors de la désactivation.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Delete specific device from list
  const handleDeleteDevice = async (id: string) => {
    if (!window.confirm('Voulez-vous retirer cet appareil de la liste des notifications ?')) return;

    try {
      const res = await fetch(`/api/admin/push/devices/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDevices((prev) => prev.filter((d) => d.id !== id));
        // Check if deleted device was current device
        checkStatus();
      }
    } catch (err) {
      console.error('Delete device error:', err);
    }
  };

  // 6. Toggle Preference
  const handleTogglePreference = async (key: keyof PreferencesState) => {
    if (!authorized[key]) return;

    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);

    try {
      const res = await fetch('/api/admin/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      });
      if (!res.ok) {
        // Rollback on error
        setPreferences(preferences);
      }
    } catch (err) {
      console.error('Save preference error:', err);
      setPreferences(preferences);
    }
  };

  // 7. Send Real Test Push
  const handleSendTestPush = async () => {
    setTestLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/admin/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: testCategory }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedbackMessage({
          type: 'success',
          text: data.message || 'Notification test envoyée avec succès !',
        });
        fetchData();
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || data.message || 'Erreur lors de l\'envoi du test.',
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Erreur réseau lors du test.',
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Loader2 className="animate-spin text-[#0ea5e9] mr-2" size={20} />
        <span className="text-sm">Vérification de l&apos;état des notifications...</span>
      </div>
    );
  }

  // Derive Status Badge
  const isEnabled = permissionState === 'granted' && isSubscribedOnDevice;
  const isBlocked = permissionState === 'denied';
  const isUnsupported = supportState !== 'SUPPORTED';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm font-medium border animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : feedbackMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
          }`}
        >
          {feedbackMessage.type === 'success' && <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />}
          {feedbackMessage.type === 'error' && <AlertCircle size={18} className="shrink-0 text-rose-500" />}
          {feedbackMessage.type === 'info' && <Info size={18} className="shrink-0 text-sky-500" />}
          <div className="flex-1">{feedbackMessage.text}</div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Card: Device Status & Activation */}
      <div className="bg-white dark:bg-[#0c1424] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                  : isBlocked
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 border-rose-200 dark:border-rose-800'
                  : 'bg-sky-50 dark:bg-sky-950/50 text-[#0ea5e9] border-sky-100 dark:border-sky-900'
              }`}
            >
              {isEnabled ? <BellRing size={22} /> : isBlocked ? <BellOff size={22} /> : <Bell size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Notifications Push Web
                </h3>
                {/* Status Badge */}
                {isEnabled && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Activées
                  </span>
                )}
                {isBlocked && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300">
                    Bloquées par le navigateur
                  </span>
                )}
                {!isEnabled && !isBlocked && !isUnsupported && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Désactivées sur cet appareil
                  </span>
                )}
                {isUnsupported && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                    Non prises en charge
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Recevez instantanément les nouvelles commandes, ruptures de stock et alertes critiques même lorsque l&apos;application est fermée.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:self-center">
            {isEnabled ? (
              <button
                onClick={handleUnsubscribeThisDevice}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                <span>Désactiver sur cet appareil</span>
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={actionLoading || isUnsupported}
                className="px-5 py-2.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                <Bell size={15} />
                <span>Activer les notifications</span>
              </button>
            )}
          </div>
        </div>

        {/* Browser Denied Warning */}
        {isBlocked && (
          <div className="mt-5 p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs sm:text-sm text-rose-900 dark:text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert size={16} className="text-rose-600" />
              <span>Autorisation des notifications bloquée par le navigateur</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Pour recevoir les alertes sur cet appareil, vous devez débloquer les autorisations :
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
              <li>
                <strong>Sur Google Chrome / Android :</strong> Cliquez sur l&apos;icône de cadenas ou de réglages à gauche de la barre d&apos;adresse → &quot;Autorisations du site&quot; → Activez &quot;Notifications&quot;.
              </li>
              <li>
                <strong>Sur iPhone / iOS PWA :</strong> Ouvrez Réglages iOS → Recherchez &quot;NAY Admin&quot; ou &quot;Safari&quot; → &quot;Notifications&quot; → &quot;Autoriser les notifications&quot;.
              </li>
            </ul>
          </div>
        )}

        {/* iPhone iOS PWA Guide if opened in Safari browser instead of standalone PWA */}
        {supportState === 'IOS_NEEDS_PWA' && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Smartphone size={16} className="text-amber-600" />
              <span>Activation requise pour iPhone / iOS (iOS 16.4+)</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Apple exige que le panneau soit installé sur votre écran d&apos;accueil pour recevoir des notifications push :
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
              <li>Appuyez sur le bouton Partager de Safari (icône carré avec flèche vers le haut).</li>
              <li>Sélectionnez <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong>.</li>
              <li>Ouvrez l&apos;icône NAY Admin depuis votre écran d&apos;accueil et cliquez sur &quot;Activer les notifications&quot;.</li>
            </ol>
          </div>
        )}

        {/* Test Notification Section */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles size={15} className="text-[#0ea5e9]" />
              <span>Tester une notification push en direct</span>
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Émet un véritable push VAPID chiffré vers votre appareil pour valider le son, l&apos;icône et la redirection.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={testCategory}
              onChange={(e) => setTestCategory(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
            >
              <option value="ORDER">🛍️ Commande (420 DH)</option>
              <option value="STOCK">⚠️ Alerte Stock (2 restants)</option>
              <option value="FINANCE">💳 Encaissement (1 250 DH)</option>
              <option value="SECURITY">🛡️ Alerte Sécurité</option>
              <option value="SYSTEM">📢 Message Système</option>
            </select>

            <button
              onClick={handleSendTestPush}
              disabled={testLoading || !isEnabled}
              className="px-3.5 py-1.5 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-[#0ea5e9] border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
            >
              {testLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>Envoyer le test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Preferences (RBAC Enforced) */}
      <div className="bg-white dark:bg-[#0c1424] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Catégories d&apos;Alertes Autorisées</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personnalisez les types de notifications que vous souhaitez recevoir sur vos appareils selon vos privilèges.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
          {/* 1. COMMANDES */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800">
                <ShoppingBag size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Commandes</span>
                  {!authorized.orders && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Non autorisé
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nouvelle commande client, annulation de commande, alertes de confirmation
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!authorized.orders}
              onClick={() => handleTogglePreference('orders')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                preferences.orders && authorized.orders ? 'bg-[#0ea5e9]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-xs absolute top-1 ${
                  preferences.orders && authorized.orders ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 2. STOCK */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800">
                <Package size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Inventaire & Stock</span>
                  {!authorized.stock && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Non autorisé
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Stock critique faible (≤ 3 unités), produit en rupture de stock immédiate
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!authorized.stock}
              onClick={() => handleTogglePreference('stock')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                preferences.stock && authorized.stock ? 'bg-[#0ea5e9]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-xs absolute top-1 ${
                  preferences.stock && authorized.stock ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 3. FINANCE */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800">
                <CreditCard size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Finance & Encaissements</span>
                  {!authorized.finance && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Non autorisé
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Paiements reçus, factures et encaissements à valider, remboursements
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!authorized.finance}
              onClick={() => handleTogglePreference('finance')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                preferences.finance && authorized.finance ? 'bg-[#0ea5e9]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-xs absolute top-1 ${
                  preferences.finance && authorized.finance ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 4. SÉCURITÉ */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Sécurité & Authentification</span>
                  {!authorized.security && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Non autorisé
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nouvelles connexions, nouvel appareil connecté, modifications de permissions
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!authorized.security}
              onClick={() => handleTogglePreference('security')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                preferences.security && authorized.security ? 'bg-[#0ea5e9]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-xs absolute top-1 ${
                  preferences.security && authorized.security ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 5. SYSTÈME */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                <Info size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Système & Équipe</span>
                  {!authorized.system && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Non autorisé
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Messages importants des propriétaires, avis clients vérifiés et alertes internes
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!authorized.system}
              onClick={() => handleTogglePreference('system')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                preferences.system && authorized.system ? 'bg-[#0ea5e9]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-xs absolute top-1 ${
                  preferences.system && authorized.system ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Registered Devices List */}
      <div className="bg-white dark:bg-[#0c1424] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Mes Appareils Enregistrés</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-[#0ea5e9] font-bold">
                {devices.length}
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Liste des téléphones et ordinateurs connectés à votre compte administrateur.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Actualiser la liste"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {devices.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
            Aucun appareil actuellement configuré pour ce compte. Cliquez sur &quot;Activer les notifications&quot; ci-dessus pour abonner cet appareil.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
            {devices.map((device) => {
              const isThisDevice =
                currentSubscriptionEndpoint &&
                device.endpointPreview &&
                currentSubscriptionEndpoint.startsWith(device.endpointPreview.slice(0, 20));

              const isPhone = /iPhone|Android|Mobile/i.test(device.userAgent || device.deviceName);

              return (
                <div key={device.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                      {isPhone ? <Smartphone size={18} /> : <Laptop size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {device.deviceName}
                        </span>
                        {isThisDevice && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-[#0ea5e9] border border-sky-200 dark:border-sky-800">
                            Cet appareil
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            device.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {device.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        Ajouté le {new Date(device.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {device.lastUsedAt && ` • Dernière alerte: ${new Date(device.lastUsedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                    title="Supprimer cet appareil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
