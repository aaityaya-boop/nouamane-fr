'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminNotifier from '@/components/AdminNotifier';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import AdminPwaManager from '@/components/AdminPwaManager';
import { AdminThemeProvider, useAdminTheme } from '@/context/AdminThemeContext';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed, design } = useAdminTheme();
  const pathname = usePathname();
  const isRight = design.sidebarPosition === 'right';
  const mainSideMargin = design.sidebarHidden
    ? 'lg:ml-0 lg:mr-0'
    : isRight
    ? isSidebarCollapsed
      ? 'lg:mr-[80px] lg:ml-0'
      : 'lg:mr-[calc(var(--admin-sidebar-w,278px)+12px)] lg:ml-0'
    : isSidebarCollapsed
    ? 'lg:ml-[80px]'
    : 'lg:ml-[calc(var(--admin-sidebar-w,278px)+12px)]';

  const hasAtmosphericOrbs =
    design.cardStyle === 'real_glass' ||
    design.cardStyle === 'frosted_crystal' ||
    design.cardStyle === 'prism_edge' ||
    design.cardStyle === 'tinted_smoke' ||
    design.cardStyle === 'liquid' ||
    design.backgroundEffect === 'bokeh_orbs' ||
    design.backgroundEffect === 'crystal_caustics' ||
    design.backgroundEffect === 'nebula_mesh' ||
    design.backgroundEffect === 'prismatic_rays' ||
    design.backgroundEffect === 'silk_waves';

  return (
    <MotionConfig reducedMotion="user">
      <div className="admin-shell-bg text-slate-900 dark:text-zinc-100 antialiased flex flex-col lg:flex-row min-h-screen w-full overflow-x-clip transition-colors duration-150 relative bg-slate-50 dark:bg-[#18181c]">
        {/* Real Optical Glass SVG Displacement & Refraction Filters */}
        <svg aria-hidden="true" className="pointer-events-none fixed w-0 h-0 overflow-hidden" width="0" height="0">
          <defs>
            <filter id="nay-optical-glass" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.009 0.011" numOctaves="2" seed="7" result="noise" />
              <feGaussianBlur in="noise" stdDeviation="2.5" result="smoothNoise" />
              <feDisplacementMap in="SourceGraphic" in2="smoothNoise" scale="11" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="nay-prism-crystal" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.018 0.022" numOctaves="2" seed="14" result="prismNoise" />
              <feDisplacementMap in="SourceGraphic" in2="prismNoise" scale="6" xChannelSelector="B" yChannelSelector="R" />
            </filter>
          </defs>
        </svg>

        {/* Optical Ambient Depth Orbs behind Real Glass panes */}
        {hasAtmosphericOrbs && design.backgroundEffect !== 'solid' && (
          <div aria-hidden="true" className="nay-optical-ambient pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <span
              className="nay-ambient-orb nay-orb-1"
              style={{ backgroundColor: design.accentColor || '#0ea5e9' }}
            />
            <span className="nay-ambient-orb nay-orb-2" />
            <span className="nay-ambient-orb nay-orb-3" />
          </div>
        )}

        <AdminSidebar />
        <main className={`flex-1 min-w-0 pt-0 lg:pt-3.5 ${mainSideMargin} px-3.5 sm:px-4 lg:px-5 ${isRight ? 'lg:pl-6' : 'lg:pr-6'} ${design.taskbarShowOnDesktop && design.taskbarStyle !== 'none' ? 'pb-28 lg:pb-24' : 'pb-28 lg:pb-8'} flex flex-col min-h-[100dvh] lg:min-h-screen relative z-10 transition-[margin,padding] duration-200 ease-out`}>
          <AdminHeader />
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 max-w-full q-page"
          >
            {children}
          </motion.div>
        </main>
        <AdminNotifier />
        <AdminMobileBottomBar />
        <AdminPwaManager />
      </div>
    </MotionConfig>
  );
}

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
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AdminThemeProvider>
  );
}
