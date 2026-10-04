'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminNotifier from '@/components/AdminNotifier';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import AdminPwaManager from '@/components/AdminPwaManager';
import { AdminThemeProvider } from '@/context/AdminThemeContext';

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <AdminThemeProvider>
        <div className="w-full min-h-screen bg-white text-slate-900 overflow-x-hidden">
          {children}
        </div>
        <AdminPwaManager />
      </AdminThemeProvider>
    );
  }

  return (
    <AdminThemeProvider>
      <div className="admin-shell-bg text-[#1A1A1A] antialiased flex flex-col lg:flex-row min-h-screen w-full max-w-full overflow-x-hidden transition-colors duration-200 relative">
        {/* Subtle, creative top accent line */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-300 via-sky-500 to-sky-300 dark:from-blue-700 dark:via-sky-500 dark:to-blue-700 z-30" />
        <AdminSidebar />
        <main className="flex-1 pt-16 sm:pt-20 lg:pt-4 lg:ml-[260px] p-3 sm:p-4 lg:p-8 pb-24 lg:pb-8 w-full max-w-full overflow-x-hidden flex flex-col min-h-screen relative z-10">
          <AdminHeader />
          <div className="flex-1 max-w-full">
            {children}
          </div>
        </main>
        <AdminNotifier />
        <AdminMobileBottomBar />
        <AdminPwaManager />
      </div>
    </AdminThemeProvider>
  );
}
