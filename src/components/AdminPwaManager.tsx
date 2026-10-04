'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff, X, Bell } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AdminPwaManager() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // 1. Service Worker Registration & Update Detection
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let isReloading = false;

    // Avoid infinite reload loops on controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!isReloading) {
        isReloading = true;
        window.location.reload();
      }
    });

    // Register service worker specifically for admin
    navigator.serviceWorker
      .register('/admin-sw.js', { scope: '/admin' })
      .then((registration) => {
        // If a worker is already waiting, prompt for update
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setHasUpdate(true);
        }

        // Listen for new updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setHasUpdate(true);
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[NAY Admin PWA] Service Worker registration failed:', err);
      });

    // Listen for custom logout event to clear caches
    const handleLogout = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ADMIN_CACHE' });
      }
    };
    window.addEventListener('nay_admin_logout', handleLogout);

    return () => {
      window.removeEventListener('nay_admin_logout', handleLogout);
    };
  }, []);

  // 2. Installability Handling (beforeinstallprompt)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user previously dismissed install banner in this session
    const dismissed = sessionStorage.getItem('nay_admin_pwa_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
      // Broadcast installability so other components (Header/Sidebar) can show install option
      window.dispatchEvent(new CustomEvent('nay_pwa_can_install', { detail: { installable: true } }));
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      console.log('[NAY Admin PWA] Application installée avec succès');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen to manual install requests triggered from Header/Sidebar
    const handleTriggerInstall = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstallable(false);
          setDeferredPrompt(null);
          setShowInstallBanner(false);
        }
      }
    };
    window.addEventListener('nay_pwa_trigger_install', handleTriggerInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('nay_pwa_trigger_install', handleTriggerInstall);
    };
  }, [deferredPrompt, isDismissed]);

  // 3. Online/Offline Status Tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Handle user clicking "Mettre à jour"
  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  // Handle user clicking "Installer"
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nay_admin_pwa_dismissed', 'true');
    }
  };

  return (
    <>
      {/* A. Offline Banner Notice */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-200">
          <WifiOff size={15} className="shrink-0" />
          <span>Connexion internet indisponible. Reconnectez-vous pour accéder aux données à jour.</span>
        </div>
      )}

      {/* B. Update Available Toast (Requirement 5) */}
      {hasUpdate && (
        <aside 
          aria-label="Mise à jour disponible"
          className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-white dark:bg-[#0c1424] border border-sky-200 dark:border-sky-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200 text-slate-900 dark:text-white"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0ea5e9] flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-800">
              <RefreshCw size={18} className="animate-spin duration-1000" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold leading-snug">
                Mise à jour disponible
              </h2>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Une nouvelle version de NAY Admin est disponible.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleUpdate}
                  className="px-3 py-1.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Mettre à jour</span>
                </button>
                <button
                  onClick={() => setHasUpdate(false)}
                  className="px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* C. Non-intrusive Mobile/Desktop Install Banner (Requirement 4) */}
      {showInstallBanner && isInstallable && !hasUpdate && (
        <aside 
          aria-label="Installer l'application"
          className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-white/95 dark:bg-[#0c1424]/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-2 duration-200 text-slate-900 dark:text-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 p-2 overflow-hidden">
              <img
                src="/images/nay/nay-logo-blue.png"
                alt="NAY Admin"
                className="w-full h-full object-contain filter invert contrast-200"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold truncate">
                Installer NAY Admin
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Accès direct depuis votre écran d'accueil
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} />
                <span>Installer</span>
              </button>
              <button
                onClick={handleDismissBanner}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
