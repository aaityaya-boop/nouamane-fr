'use client';

import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, Plus, ExternalLink, Sparkles, Package, Gift, AlertCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export interface SiblingEditions {
  tester: { id: number; slug: string; price: number; stock: number; inStock: boolean; name: string } | null;
  original: { id: number; slug: string; price: number; stock: number; inStock: boolean; name: string } | null;
  masterCopy: { id: number; slug: string; price: number; stock: number; inStock: boolean; name: string } | null;
  coffret: { id: number; slug: string; price: number; stock: number; inStock: boolean; name: string } | null;
}

export interface NewSectionDraft {
  enabled: boolean;
  price: number;
  stock: number;
}

interface CatalogSectionsCardProps {
  currentProductId?: number;
  currentProductName: string;
  currentBrand?: string;
  currentSection: 'tester' | 'original' | 'master-copier' | 'coffrets';
  currentPrice: number;
  currentStock: number;
  onPriceChange?: (price: number) => void;
  onStockChange?: (stock: number) => void;
  // External pending activations to save along with the form
  pendingSections: {
    original: NewSectionDraft;
    masterCopy: NewSectionDraft;
    tester: NewSectionDraft;
    coffret: NewSectionDraft;
  };
  setPendingSections: React.Dispatch<React.SetStateAction<{
    original: NewSectionDraft;
    masterCopy: NewSectionDraft;
    tester: NewSectionDraft;
    coffret: NewSectionDraft;
  }>>;
  onSiblingCreated?: () => void;
}

export default function CatalogSectionsCard({
  currentProductId,
  currentProductName,
  currentBrand,
  currentSection,
  currentPrice,
  currentStock,
  pendingSections,
  setPendingSections,
  onSiblingCreated,
}: CatalogSectionsCardProps) {
  const [siblings, setSiblings] = useState<SiblingEditions>({
    tester: null,
    original: null,
    masterCopy: null,
    coffret: null,
  });
  const [isLoadingSiblings, setIsLoadingSiblings] = useState(false);
  const [creatingSection, setCreatingSection] = useState<string | null>(null);

  // Fetch sibling editions across catalog
  useEffect(() => {
    if (!currentProductName || currentProductName.trim().length < 3) return;

    let isMounted = true;
    const fetchSiblings = async () => {
      setIsLoadingSiblings(true);
      try {
        const query = new URLSearchParams({
          name: currentProductName,
          ...(currentBrand ? { brand: currentBrand } : {}),
          ...(currentProductId ? { currentId: currentProductId.toString() } : {}),
        });
        const res = await fetch(`/api/admin/products/sections?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSiblings(data);
          }
        }
      } catch (err) {
        console.error('Failed to load sibling editions', err);
      } finally {
        if (isMounted) setIsLoadingSiblings(false);
      }
    };

    fetchSiblings();
    return () => {
      isMounted = false;
    };
  }, [currentProductName, currentBrand, currentProductId]);

  // Instant 1-click duplication
  const handleInstantDuplicate = async (targetSection: 'tester' | 'original' | 'master-copier' | 'coffrets') => {
    if (!currentProductId) {
      alert('Veuillez d\'abord enregistrer ce produit avant de générer une copie instantanée.');
      return;
    }

    const draft =
      targetSection === 'tester' ? pendingSections.tester :
      targetSection === 'original' ? pendingSections.original :
      targetSection === 'master-copier' ? pendingSections.masterCopy :
      pendingSections.coffret;

    setCreatingSection(targetSection);
    try {
      const res = await fetch('/api/admin/products/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceProductId: currentProductId,
          targetSection,
          price: draft.price,
          stock: draft.stock,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la déclinaison');
      }

      alert(data.message || 'Nouvelle déclinaison créée avec succès !');

      // Refresh siblings
      const query = new URLSearchParams({
        name: currentProductName,
        ...(currentBrand ? { brand: currentBrand } : {}),
        currentId: currentProductId.toString(),
      });
      const sibRes = await fetch(`/api/admin/products/sections?${query.toString()}`);
      if (sibRes.ok) {
        setSiblings(await sibRes.json());
      }

      if (onSiblingCreated) onSiblingCreated();
    } catch (err: any) {
      alert(err.message || 'Échec de la duplication');
    } finally {
      setCreatingSection(null);
    }
  };

  const sectionsConfig = [
    {
      id: 'tester' as const,
      name: 'Testeur de Parfum',
      badge: '🧪 Format Testeur',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      description: 'Flacon de démonstration authentique, vendu en boîte neutre ou sans boîte scellée. Tarif accessible.',
      adminUrl: '/admin/products',
      storefrontUrl: '/fr/testeurs',
      isCurrent: currentSection === 'tester',
      existing: siblings.tester,
      draft: pendingSections.tester,
      setDraft: (updater: (prev: NewSectionDraft) => NewSectionDraft) =>
        setPendingSections((prev) => ({ ...prev, tester: updater(prev.tester) })),
      defaultSuggestedPrice: 299,
      defaultSuggestedStock: 10,
    },
    {
      id: 'original' as const,
      name: 'Parfum Original Scellé',
      badge: '👑 100% Original Neuf',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      description: 'Boîte et packaging officiel scellé sous cellophane d\'origine avec code-barres et scellé de garantie. Tarif prestige.',
      adminUrl: '/admin/parfums-originaux',
      storefrontUrl: '/fr/parfums-originaux',
      isCurrent: currentSection === 'original',
      existing: siblings.original,
      draft: pendingSections.original,
      setDraft: (updater: (prev: NewSectionDraft) => NewSectionDraft) =>
        setPendingSections((prev) => ({ ...prev, original: updater(prev.original) })),
      defaultSuggestedPrice: Math.round(currentPrice * 1.5) || 550,
      defaultSuggestedStock: 5,
    },
    {
      id: 'master-copier' as const,
      name: 'Master Copy 1:1',
      badge: '✨ Master Copy Miroir',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      description: 'Finition 1:1 haute fidélité avec packaging complet, flacon gravé et sillage haute tenue. Tarif intermédiaire.',
      adminUrl: '/admin/master-copier',
      storefrontUrl: '/fr/master-copier',
      isCurrent: currentSection === 'master-copier',
      existing: siblings.masterCopy,
      draft: pendingSections.masterCopy,
      setDraft: (updater: (prev: NewSectionDraft) => NewSectionDraft) =>
        setPendingSections((prev) => ({ ...prev, masterCopy: updater(prev.masterCopy) })),
      defaultSuggestedPrice: 350,
      defaultSuggestedStock: 10,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#111827] p-6 sm:p-7 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center shrink-0">
            <Layers size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
              <span>Rayons du Catalogue & Déclinaisons</span>
              <span className="text-[10px] font-normal normal-case text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                Stocks Indépendants
              </span>
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Activez les rayons dans lesquels ce parfum est commercialisé. Chaque rayon dispose de sa propre fiche, de son propre prix et de son propre stock.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {sectionsConfig.map((sec) => {
          const isExisting = Boolean(sec.existing);
          const isCurrentSection = sec.isCurrent;
          const isPending = sec.draft.enabled && !isExisting && !isCurrentSection;

          return (
            <div
              key={sec.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                isCurrentSection
                  ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50/80 dark:bg-neutral-800/40 ring-1 ring-neutral-900/10 dark:ring-white/10'
                  : isExisting
                  ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : isPending
                  ? 'border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300'
              }`}
            >
              {/* Top row */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${sec.badgeColor}`}>
                      {sec.badge}
                    </span>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                      {sec.name}
                    </h4>
                  </div>

                  {/* Switch / Toggle */}
                  {isCurrentSection ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                      Fiche Active
                    </span>
                  ) : isExisting ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} />
                      En ligne
                    </span>
                  ) : (
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={sec.draft.enabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          sec.setDraft((prev) => ({
                            ...prev,
                            enabled: checked,
                            price: prev.price > 0 ? prev.price : sec.defaultSuggestedPrice,
                            stock: prev.stock > 0 ? prev.stock : sec.defaultSuggestedStock,
                          }));
                        }}
                      />
                      <div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900 dark:peer-checked:bg-sky-500"></div>
                    </label>
                  )}
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  {sec.description}
                </p>
              </div>

              {/* Status / Configuration Box */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                {isCurrentSection ? (
                  <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 font-semibold bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
                    <span>Prix : <strong>{currentPrice} MAD</strong></span>
                    <span>Stock : <strong className={currentStock > 0 ? 'text-emerald-600' : 'text-rose-600'}>{currentStock} u.</strong></span>
                  </div>
                ) : isExisting && sec.existing ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 font-semibold bg-white dark:bg-neutral-900 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                      <span>Prix : <strong>{sec.existing.price} MAD</strong></span>
                      <span>Stock : <strong className={sec.existing.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}>{sec.existing.stock} u.</strong></span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <Link
                        href={`${sec.adminUrl}`}
                        target="_blank"
                        className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                      >
                        <span>Ouvrir rayon {sec.name.split(' ')[0]}</span>
                        <ArrowUpRight size={10} />
                      </Link>
                      <Link
                        href={`${sec.storefrontUrl}`}
                        target="_blank"
                        className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>Vitrine</span>
                        <ExternalLink size={9} />
                      </Link>
                    </div>
                  </div>
                ) : isPending ? (
                  <div className="space-y-2 bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-sky-200 dark:border-sky-900/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center justify-between">
                      <span>Paramètres de la nouvelle copie :</span>
                      <span className="text-neutral-400 font-normal">Sera créée à l'enregistrement</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-0.5">Prix (MAD)</label>
                        <input
                          type="number"
                          value={sec.draft.price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            sec.setDraft((prev) => ({ ...prev, price: val }));
                          }}
                          className="w-full bg-[#f8fafc] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md p-1.5 text-xs font-bold text-neutral-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-0.5">Stock initial</label>
                        <input
                          type="number"
                          value={sec.draft.stock}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            sec.setDraft((prev) => ({ ...prev, stock: val }));
                          }}
                          className="w-full bg-[#f8fafc] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md p-1.5 text-xs font-bold text-neutral-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {currentProductId && (
                      <button
                        type="button"
                        disabled={creatingSection === sec.id}
                        onClick={() => handleInstantDuplicate(sec.id)}
                        className="w-full py-1 px-2 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {creatingSection === sec.id ? (
                          <span>Génération de la copie...</span>
                        ) : (
                          <>
                            <Plus size={11} />
                            <span>Créer la copie maintenant (1-Clic)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-neutral-400 p-1">
                    <span>Non commercialisé dans ce rayon</span>
                    <button
                      type="button"
                      onClick={() => {
                        sec.setDraft((prev) => ({
                          ...prev,
                          enabled: true,
                          price: sec.defaultSuggestedPrice,
                          stock: sec.defaultSuggestedStock,
                        }));
                      }}
                      className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus size={11} />
                      <span>Activer</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
