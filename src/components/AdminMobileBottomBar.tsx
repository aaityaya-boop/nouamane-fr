'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Truck, 
  MessageSquare, 
  Menu 
} from 'lucide-react';

export default function AdminMobileBottomBar() {
  const pathname = usePathname();

  // Hide on login page
  if (pathname === '/admin/login') return null;

  const handleOpenMenu = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nay_open_admin_drawer'));
    }
  };

  const isDashboardActive = pathname === '/admin';
  const isOrdersActive = pathname.startsWith('/admin/orders');
  const isSuppliersActive = pathname.startsWith('/admin/suppliers') || pathname.startsWith('/admin/inventory');
  const isChatActive = pathname.startsWith('/admin/chat');

  return (
    <nav 
      aria-label="Navigation mobile rapide"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.7)] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Dashboard Tab */}
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px] ${
            isDashboardActive
              ? 'text-[#0ea5e9] dark:text-sky-400 font-bold scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <LayoutDashboard size={20} strokeWidth={isDashboardActive ? 2.5 : 2} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Accueil</span>
          {isDashboardActive && (
            <span className="w-1 h-1 rounded-full bg-[#0ea5e9] dark:bg-sky-400 mt-0.5" />
          )}
        </Link>

        {/* 2. Orders Tab */}
        <Link
          href="/admin/orders"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px] relative ${
            isOrdersActive
              ? 'text-[#0ea5e9] dark:text-sky-400 font-bold scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <ShoppingBag size={20} strokeWidth={isOrdersActive ? 2.5 : 2} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Commandes</span>
          {isOrdersActive && (
            <span className="w-1 h-1 rounded-full bg-[#0ea5e9] dark:bg-sky-400 mt-0.5" />
          )}
        </Link>

        {/* 3. Achats / Fournisseurs Tab */}
        <Link
          href="/admin/suppliers"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px] ${
            isSuppliersActive
              ? 'text-[#0ea5e9] dark:text-sky-400 font-bold scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <Truck size={20} strokeWidth={isSuppliersActive ? 2.5 : 2} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Achats</span>
          {isSuppliersActive && (
            <span className="w-1 h-1 rounded-full bg-[#0ea5e9] dark:bg-sky-400 mt-0.5" />
          )}
        </Link>

        {/* 4. Chat Tab */}
        <Link
          href="/admin/chat"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px] ${
            isChatActive
              ? 'text-[#0ea5e9] dark:text-sky-400 font-bold scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <MessageSquare size={20} strokeWidth={isChatActive ? 2.5 : 2} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Chat</span>
          {isChatActive && (
            <span className="w-1 h-1 rounded-full bg-[#0ea5e9] dark:bg-sky-400 mt-0.5" />
          )}
        </Link>

        {/* 5. Full Menu Drawer Trigger */}
        <button
          type="button"
          onClick={handleOpenMenu}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-95"
          aria-label="Ouvrir le menu complet"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Menu size={16} strokeWidth={2.2} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Menu</span>
        </button>
      </div>
    </nav>
  );
}
