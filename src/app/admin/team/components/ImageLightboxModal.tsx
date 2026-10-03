'use client';

import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

export default function ImageLightboxModal({
  imageUrl,
  title,
  onClose,
}: {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between text-white pb-3 px-2">
          <span className="text-xs sm:text-sm font-semibold truncate text-slate-200">
            {title || 'Aperçu du document'}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs flex items-center gap-1.5"
              title="Ouvrir en plein écran"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Plein écran</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all cursor-pointer"
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="rounded-2xl overflow-hidden bg-slate-900/50 border border-white/10 shadow-2xl flex items-center justify-center max-h-[80vh]">
          <img
            src={imageUrl}
            alt={title || 'Justificatif / Photo'}
            className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}
