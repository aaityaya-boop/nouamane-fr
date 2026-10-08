'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Gift, Sparkles, Check, Search, X, ChevronRight } from 'lucide-react';
import { useCart, FreeGiftSelection } from '@/context/CartContext';

interface FreeGiftSelectorProps {
  compact?: boolean;
}

export default function FreeGiftSelector({ compact = false }: FreeGiftSelectorProps) {
  const { appliedPromo, appliedDeal, selectedFreeGift, setSelectedFreeGift, availableTesterGifts } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // 🔒 Non-cumulative: If a promo code is applied, all free gift offers are disabled
  if (appliedPromo) return null;

  // Check if deal includes a gift
  const hasGiftUnlocked = Boolean(appliedDeal?.freeGiftName || (appliedDeal?.availableGifts && appliedDeal.availableGifts.length > 0));

  // Extract clean image url helper
  const getGiftImage = (images: any): string => {
    if (!images) return '/images/nay/nay-logo-blue.png';
    if (Array.isArray(images)) return images[0] || '/images/nay/nay-logo-blue.png';
    if (typeof images === 'string') {
      try {
        if (images.startsWith('[')) {
          const parsed = JSON.parse(images);
          return Array.isArray(parsed) && parsed[0] ? parsed[0] : images;
        }
      } catch {
        return images;
      }
      return images;
    }
    return '/images/nay/nay-logo-blue.png';
  };

  // Filtered available tester samples
  const filteredSamples = useMemo(() => {
    if (!availableTesterGifts || availableTesterGifts.length === 0) return [];
    if (!search.trim()) return availableTesterGifts;
    const q = search.toLowerCase();
    return availableTesterGifts.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.brandLabel && s.brandLabel.toLowerCase().includes(q))
    );
  }, [availableTesterGifts, search]);

  // Auto-select first in-stock sample if none selected yet
  React.useEffect(() => {
    if (hasGiftUnlocked && !selectedFreeGift && availableTesterGifts && availableTesterGifts.length > 0) {
      const first = availableTesterGifts[0];
      setSelectedFreeGift({
        id: first.id,
        name: first.name,
        brandLabel: first.brandLabel,
        image: getGiftImage(first.images),
        slug: first.slug,
      });
    }
  }, [hasGiftUnlocked, selectedFreeGift, availableTesterGifts, setSelectedFreeGift]);

  if (!hasGiftUnlocked) return null;

  // Handle gift selection
  const handleSelectGift = (sample: any) => {
    setSelectedFreeGift({
      id: sample.id,
      name: sample.name,
      brandLabel: sample.brandLabel,
      image: getGiftImage(sample.images),
      slug: sample.slug,
    });
    setModalOpen(false);
  };

  return (
    <>
      <div className={`rounded-2xl border transition-all ${
        compact 
          ? 'bg-sky-50/70 border-sky-200 p-3' 
          : 'bg-gradient-to-br from-sky-50/80 via-white to-sky-50/40 border-sky-200 p-4 shadow-2xs'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#0ea5e9] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Gift size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#0ea5e9]">
                  Cadeau Offert Débloqué
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                  0 DH
                </span>
              </div>
              
              {selectedFreeGift ? (
                <div className="text-xs font-bold text-neutral-900 truncate mt-0.5">
                  Échantillon : {selectedFreeGift.name}
                </div>
              ) : (
                <div className="text-xs font-bold text-neutral-900 truncate mt-0.5">
                  {appliedDeal?.freeGiftName || 'Échantillon Testeur 5ml de Luxe'}
                </div>
              )}
            </div>
          </div>

          {availableTesterGifts && availableTesterGifts.length > 0 && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-sky-50 border border-sky-300 text-[#0ea5e9] text-[11px] font-bold rounded-xl transition-all shadow-2xs flex-shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>{selectedFreeGift ? 'Changer' : 'Choisir'}</span>
              <ChevronRight size={12} />
            </button>
          )}
        </div>

        {selectedFreeGift && !compact && (
          <div className="mt-3 pt-3 border-t border-sky-100/80 flex items-center justify-between text-[11px] text-neutral-600">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white border border-neutral-200 overflow-hidden relative flex-shrink-0">
                <Image
                  src={selectedFreeGift.image || '/images/nay/nay-logo-blue.png'}
                  alt={selectedFreeGift.name}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              </div>
              <span className="text-neutral-500">
                {selectedFreeGift.brandLabel || 'Testeur Luxe'} • Miniature 5ml Vaporisateur
              </span>
            </div>
            <span className="text-emerald-700 font-bold">Inclus gratuitement</span>
          </div>
        )}
      </div>

      {/* SAMPLE SELECTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-150 flex items-center justify-between bg-sky-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0ea5e9] text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Choisissez votre Échantillon Offert
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Sélectionnez votre fragrance préférée parmi nos testeurs en stock ({availableTesterGifts.length} disponibles).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-neutral-100 bg-white">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par marque ou parfum (ex: Dior, Chanel, Oud...)"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1 max-h-[55vh]">
              {filteredSamples.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  Aucun échantillon testeur trouvé pour cette recherche.
                </div>
              ) : (
                filteredSamples.map((sample) => {
                  const isCurrent = selectedFreeGift?.id === sample.id;
                  const imgUrl = getGiftImage(sample.images);

                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectGift(sample)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-50 border-[#0ea5e9] ring-1 ring-[#0ea5e9]'
                          : 'bg-white border-neutral-200 hover:bg-neutral-50/80 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden relative flex-shrink-0">
                          <Image
                            src={imgUrl}
                            alt={sample.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-neutral-900 truncate">
                            {sample.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate">
                            {sample.brandLabel || 'Testeur de Luxe'} • Échantillon 5ml
                          </div>
                          <div className="text-[10px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>En Stock</span>
                          </div>
                        </div>
                      </div>

                      <div className="pl-3 flex-shrink-0">
                        {isCurrent ? (
                          <span className="px-2.5 py-1 bg-[#0ea5e9] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-2xs">
                            <Check size={12} />
                            <span>Sélectionné</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-neutral-100 hover:bg-sky-100 text-neutral-700 hover:text-[#0ea5e9] text-[11px] font-bold rounded-lg transition-colors">
                            Choisir
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-neutral-150 bg-neutral-50/70 flex justify-between items-center text-xs">
              <span className="text-[11px] text-neutral-500">
                {selectedFreeGift ? `Sélectionné : ${selectedFreeGift.name}` : 'Sélectionnez un échantillon'}
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
