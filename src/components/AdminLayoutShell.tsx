'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminNotifier from '@/components/AdminNotifier';
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
      </AdminThemeProvider>
    );
  }

  return (
    <AdminThemeProvider>
      <div className="admin-shell-bg relative text-[#1A1A1A] antialiased flex flex-col lg:flex-row min-h-screen w-full transition-colors duration-200">
        {/* Top ambient horizon accent line */}
        <div className="admin-top-horizon-glow pointer-events-none fixed top-0 left-0 right-0 h-[2px] z-50" />

        {/* Ambient Top Glow Diffusion (Sky Blue in Light / Deep Sapphire Blue in Dark) */}
        <div className="admin-ambient-glow pointer-events-none fixed top-0 left-0 right-0 h-[520px] overflow-hidden z-0" aria-hidden="true">
          <div className="admin-glow-orb absolute -top-[240px] left-1/2 -translate-x-1/2 w-[900px] sm:w-[1400px] h-[600px] rounded-full blur-[110px] transition-all duration-300" />
        </div>

        <AdminSidebar />
        <main className="flex-1 pt-20 lg:pt-4 lg:ml-[260px] p-4 lg:p-8 w-full overflow-x-hidden flex flex-col min-h-screen relative z-10">
          <AdminHeader />
          <div className="flex-1">
            {children}
          </div>
        </main>
        <AdminNotifier />
      </div>
    </AdminThemeProvider>
  );
}
