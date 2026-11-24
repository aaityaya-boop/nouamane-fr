'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BarDataPoint {
  label: string;
  value: number;
  dateStr: string;
  cashflow: number;
  inflow: number;
}

export default function CashFlowBarChart({
  totalAmount = '540,323.45 MAD',
  monthlyData,
}: {
  totalAmount?: string;
  monthlyData?: BarDataPoint[];
}) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const defaultMonthly: BarDataPoint[] = [
    { label: 'Jan', value: 24000, dateStr: '15 Jan, 2026', cashflow: 24000, inflow: 18200 },
    { label: 'Fév', value: 28500, dateStr: '20 Fév, 2026', cashflow: 28500, inflow: 21400 },
    { label: 'Mar', value: 46800, dateStr: '23 Mar, 2026', cashflow: 46800, inflow: 34700 }, // Peak / Active
    { label: 'Avr', value: 31200, dateStr: '12 Avr, 2026', cashflow: 31200, inflow: 22800 },
    { label: 'Mai', value: 37500, dateStr: '18 Mai, 2026', cashflow: 37500, inflow: 29100 },
    { label: 'Juin', value: 29000, dateStr: '25 Juin, 2026', cashflow: 29000, inflow: 20500 },
    { label: 'Juil', value: 33400, dateStr: '04 Juil, 2026', cashflow: 33400, inflow: 24800 },
  ];

  const defaultYearly: BarDataPoint[] = [
    { label: '2021', value: 18000, dateStr: 'Année 2021', cashflow: 180000, inflow: 120000 },
    { label: '2022', value: 26000, dateStr: 'Année 2022', cashflow: 260000, inflow: 185000 },
    { label: '2023', value: 34000, dateStr: 'Année 2023', cashflow: 340000, inflow: 250000 },
    { label: '2024', value: 42000, dateStr: 'Année 2024', cashflow: 420000, inflow: 310000 },
    { label: '2025', value: 48500, dateStr: 'Année 2025', cashflow: 485000, inflow: 370000 }, // Active
    { label: '2026', value: 41000, dateStr: 'Année 2026 (En cours)', cashflow: 540323, inflow: 415000 },
  ];

  const activeData = period === 'monthly' ? (monthlyData || defaultMonthly) : defaultYearly;
  const [selectedIndex, setSelectedIndex] = useState<number>(2); // Default to March (index 2)

  const selectedItem = activeData[selectedIndex] || activeData[0];
  const maxValue = 50000;

  return (
    <div className="bg-white dark:bg-[#14151f] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.4)] flex flex-col justify-between transition-all">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Flux Financier (Cash Flow)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {totalAmount}
          </div>
        </div>

        {/* Segmented Pill Selector - Matching Screenshot */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#10111a] border border-slate-200/80 dark:border-white/[0.06] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setPeriod('monthly');
              setSelectedIndex(2);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'monthly'
                ? 'bg-white dark:bg-[#1f202e] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod('yearly');
              setSelectedIndex(4);
            }}
            style={
              period === 'yearly'
                ? { backgroundColor: 'var(--admin-accent, #0ea5e9)' }
                : undefined
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'yearly'
                ? 'text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Annuel
          </button>
        </div>
      </div>

      {/* Modern Bar Chart Container */}
      <div className="relative pt-12 pb-2">
        {/* Floating Tooltip Card with Spring Horizontal Glide */}
        <motion.div
          animate={{
            left: `${Math.min(Math.max((selectedIndex / (activeData.length - 1)) * 100, 15), 75)}%`,
          }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="absolute top-0 z-20 pointer-events-none"
          style={{
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-slate-900/95 dark:bg-[#1a1b26]/95 backdrop-blur-xl border border-slate-700/60 dark:border-white/15 rounded-xl px-3.5 py-2 shadow-xl text-white text-[11px] space-y-0.5 whitespace-nowrap min-w-[130px]">
            <div className="font-semibold text-slate-300 dark:text-slate-400 text-[10px] pb-1 border-b border-white/10">
              {selectedItem.dateStr}
            </div>
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <span className="text-slate-400">Cashflow:</span>
              <span className="font-bold text-white tabular-nums">{selectedItem.cashflow.toLocaleString('fr-FR')} MAD</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Bénéfice:</span>
              <span className="font-bold text-emerald-400 tabular-nums">+{selectedItem.inflow.toLocaleString('fr-FR')} MAD</span>
            </div>
          </div>
        </motion.div>

        {/* Y-Axis Grid Lines & Background */}
        <div className="h-44 w-full flex flex-col justify-between absolute inset-x-0 bottom-7 pointer-events-none opacity-40">
          <div className="border-b border-dashed border-slate-200 dark:border-white/5 w-full"></div>
          <div className="border-b border-dashed border-slate-200 dark:border-white/5 w-full"></div>
          <div className="border-b border-dashed border-slate-200 dark:border-white/5 w-full"></div>
          <div className="border-b border-dashed border-slate-200 dark:border-white/5 w-full"></div>
          <div className="border-b border-slate-200 dark:border-white/10 w-full"></div>
        </div>

        {/* Bars Grid */}
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 relative z-10 px-2 sm:px-4">
          {activeData.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const heightPercent = Math.min(Math.max((item.value / maxValue) * 100, 15), 100);

            return (
              <div
                key={item.label}
                onClick={() => setSelectedIndex(idx)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Animated Motion Bar */}
                <div className="w-full max-w-[36px] sm:max-w-[42px] relative flex flex-col justify-end items-center h-full">
                  <motion.div
                    initial={{ height: '0%', opacity: 0.4 }}
                    animate={{ height: `${heightPercent}%`, opacity: 1 }}
                    transition={{ duration: 0.65, delay: idx * 0.055, ease: [0.22, 1, 0.36, 1] }}
                    style={
                      isSelected
                        ? { backgroundColor: 'var(--admin-accent, #0ea5e9)' }
                        : undefined
                    }
                    className={`w-full rounded-t-xl transition-colors duration-200 relative ${
                      isSelected
                        ? 'shadow-sm'
                        : 'bg-slate-200/90 dark:bg-[#202230] hover:bg-slate-300 dark:hover:bg-[#2a2c3e]'
                    }`}
                  >
                    {/* Crisp Top Cap Marker on Selected Bar */}
                    {isSelected && (
                      <div
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 shadow-xs flex items-center justify-center"
                        style={{ borderColor: 'var(--admin-accent, #0ea5e9)' }}
                      >
                        <span
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: 'var(--admin-accent, #0ea5e9)' }}
                        />
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* X-Axis Label */}
                <span className={`text-[11px] font-semibold mt-2.5 transition-colors ${
                  isSelected 
                    ? 'text-[#0ea5e9] dark:text-[#38bdf8] font-bold' 
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
