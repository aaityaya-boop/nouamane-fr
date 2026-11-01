'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, Trash2 } from 'lucide-react';
import { useComparison } from '@/context/ComparisonContext';

export default function ComparisonTray() {
  const {
    comparedProducts,
    removeFromCompare,
    clearCompare,
    openModal,
    toastMessage,
    clearToast,
  } = useComparison();

  if (comparedProducts.length === 0 && !toastMessage) return null;

  return (
    <>
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] text-white text-[12px] font-medium px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <span>{toastMessage}</span>
            <button
              onClick={clearToast}
              className="text-[#9A9A9A] hover:text-white transition"
              aria-label="Fermer l'alerte"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Comparison Tray */}
      <AnimatePresence>
        {comparedProducts.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl bg-white/95 backdrop-blur-md border border-[#e0ddd4] shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-4"
          >
            {/* Left: Product Thumbnails */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center -space-x-2 sm:space-x-1.5 overflow-hidden">
                {comparedProducts.map((p) => (
                  <div
                    key={p.slug}
                    className="relative group w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#f8fafc] border border-[#e0ddd4] overflow-hidden shrink-0"
                    title={p.name}
                  >
                    <Image
                      src={p.images[0] || '/placeholder.jpg'}
                      alt={p.name}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCompare(p.slug)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      aria-label={`Retirer ${p.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-left min-w-0">
                <div className="text-[11px] sm:text-[12px] font-bold text-[#1A1A1A] truncate">
                  Comparateur
                </div>
                <div className="text-[10px] text-[#6B6B6B]">
                  {comparedProducts.length}/3 sélectionnés
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={clearCompare}
                className="p-2 sm:px-2.5 sm:py-2 text-[#9A9A9A] hover:text-red-600 hover:bg-red-50 rounded-xl transition text-[11px] font-medium flex items-center gap-1"
                title="Vider la sélection"
                aria-label="Vider la sélection"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Vider</span>
              </button>

              <button
                type="button"
                onClick={openModal}
                className="btn-blue px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-[12px] font-bold tracking-wide flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95"
                aria-label={`Comparer les parfums (${comparedProducts.length})`}
              >
                <ArrowRightLeft size={14} />
                <span>Comparer ({comparedProducts.length})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
