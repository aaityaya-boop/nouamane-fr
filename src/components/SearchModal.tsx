'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search as SearchIcon, ArrowRight, Sparkles, TrendingUp, Compass } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Product, formatMAD } from '@/lib/products';
import { useDictionary } from '@/context/DictionaryContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  'Dior Sauvage',
  'Bleu de Chanel',
  'Baccarat Rouge',
  'Libre YSL',
  'Creed Aventus',
  'Testeurs de Luxe',
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  const dict = useDictionary();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.products) {
          const parsed = data.products.map((p: any) => ({
            ...p,
            images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
          }));
          setResults(parsed);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 250);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <div className="absolute top-6 right-6 sm:top-8 sm:right-8 rtl:right-auto rtl:left-6 rtl:sm:left-8 z-10">
            <button
              onClick={onClose}
              className="p-3 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1A1A1A] rounded-full transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Fermer la recherche"
            >
              <X size={22} />
            </button>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
            {/* Search Input Box */}
            <div className="relative border-b-2 border-[#1A1A1A] pb-3 sm:pb-5">
              <SearchIcon size={32} className="absolute left-0 rtl:left-auto rtl:right-0 top-1/2 -translate-y-1/2 text-[#0ea5e9]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={dict.searchModal?.placeholder || "Rechercher un parfum, une marque..."}
                className="w-full bg-transparent text-2xl sm:text-4xl md:text-5xl heading-font text-[#1A1A1A] placeholder:text-[#999] pl-12 sm:pl-14 rtl:pl-0 rtl:pr-12 rtl:sm:pr-14 pr-10 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-0 rtl:right-auto rtl:left-0 top-1/2 -translate-y-1/2 p-2 text-[#888] hover:text-[#1A1A1A]"
                  aria-label="Effacer le texte"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="mt-8 sm:mt-12">
              {/* Popular Searches & Discovery (shown when input is empty) */}
              {!query.trim() && (
                <div className="space-y-8 animate-fadeIn">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-[#888] mb-3">
                      <TrendingUp size={14} className="text-[#0ea5e9]" />
                      <span>Recherches fréquentes</span>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {POPULAR_SEARCHES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQuery(item)}
                          className="px-4 py-2 rounded-full border border-[#e0ddd4] bg-white text-[13px] font-medium text-[#1A1A1A] hover:border-[#0ea5e9] hover:text-[#0ea5e9] hover:bg-[#f8fafc] transition shadow-2xs"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-[#888] mb-3">
                      <Compass size={14} className="text-[#0ea5e9]" />
                      <span>Collections populaires</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <Link
                        href={`/${locale}/shop/men`}
                        onClick={onClose}
                        className="p-3.5 rounded-xl border border-[#e0ddd4] bg-white hover:border-[#0ea5e9] hover:bg-[#f8fafc] transition text-center group"
                      >
                        <div className="text-[13px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9]">
                          Parfums Homme
                        </div>
                        <div className="text-[11px] text-[#888] mt-0.5">Sillage & Caractère</div>
                      </Link>
                      <Link
                        href={`/${locale}/shop/women`}
                        onClick={onClose}
                        className="p-3.5 rounded-xl border border-[#e0ddd4] bg-white hover:border-[#0ea5e9] hover:bg-[#f8fafc] transition text-center group"
                      >
                        <div className="text-[13px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9]">
                          Parfums Femme
                        </div>
                        <div className="text-[11px] text-[#888] mt-0.5">Élégance & Délicatesse</div>
                      </Link>
                      <Link
                        href={`/${locale}/testeurs`}
                        onClick={onClose}
                        className="p-3.5 rounded-xl border border-[#e0ddd4] bg-white hover:border-[#0ea5e9] hover:bg-[#f8fafc] transition text-center group"
                      >
                        <div className="text-[13px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9]">
                          Testeurs de Luxe
                        </div>
                        <div className="text-[11px] text-[#888] mt-0.5">Mêmes Notes · 299 MAD</div>
                      </Link>
                      <Link
                        href={`/${locale}/shop/coffrets`}
                        onClick={onClose}
                        className="p-3.5 rounded-xl border border-[#e0ddd4] bg-white hover:border-[#0ea5e9] hover:bg-[#f8fafc] transition text-center group"
                      >
                        <div className="text-[13px] font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9]">
                          Coffrets Cadeaux
                        </div>
                        <div className="text-[11px] text-[#888] mt-0.5">Packs Exclusifs</div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center gap-3 py-8 text-[14px] text-[#666]">
                  <div className="w-5 h-5 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
                  <span>{dict.searchModal?.loading || "Recherche des meilleures fragrances..."}</span>
                </div>
              )}
              
              {/* Empty Results State */}
              {!isLoading && query.trim().length > 0 && results.length === 0 && (
                <div className="py-12 text-center bg-[#fafaf7] rounded-2xl border border-[#e0ddd4] p-8">
                  <div className="text-[16px] sm:text-[18px] font-semibold text-[#1A1A1A] mb-2">
                    {dict.searchModal?.noResults || "Aucune fragrance trouvée pour"} &ldquo;{query}&rdquo;
                  </div>
                  <p className="text-[13px] text-[#888] max-w-md mx-auto mb-6">
                    Essayez de vérifier l&apos;orthographe, ou explorez l&apos;ensemble de nos collections.
                  </p>
                  <Link
                    href={`/${locale}/shop`}
                    onClick={onClose}
                    className="btn-blue px-6 py-2.5 rounded-xl text-[13px] font-bold inline-block"
                  >
                    Voir toute la boutique
                  </Link>
                </div>
              )}

              {/* Live Results Grid */}
              {!isLoading && results.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#888] mb-3">
                    {results.length} {results.length > 1 ? 'résultats trouvés' : 'résultat trouvé'}
                  </div>

                  <div className="grid gap-2.5 sm:gap-3">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/${locale}/product/${product.slug}`}
                        onClick={onClose}
                        className="group flex items-center gap-3.5 sm:gap-4 p-3 sm:p-3.5 rounded-2xl bg-white hover:bg-[#f8fafc] border border-[#e0ddd4] hover:border-[#0ea5e9] transition-all shadow-2xs"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-16 h-20 sm:w-20 sm:h-24 bg-[#f8fafc] rounded-xl overflow-hidden border border-[#eeece5] shrink-0">
                          {product.images[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              sizes="80px"
                              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0ea5e9] truncate mb-0.5">
                            {product.brandLabel || product.brand} {product.isTester ? '· Testeur' : ''}
                          </div>
                          <h3 className="heading-font text-base sm:text-lg font-bold text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors truncate">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[14px] font-bold text-[#1A1A1A]">
                              {formatMAD(product.price)}
                            </span>
                            <span className="text-[11px] text-[#888]">
                              · {product.sizes?.[0]?.label || 'Format standard'}
                            </span>
                          </div>
                        </div>

                        {/* Arrow CTA */}
                        <div className="w-9 h-9 rounded-full bg-[#f1f5f9] group-hover:bg-[#0ea5e9] group-hover:text-white flex items-center justify-center text-[#666] transition shrink-0 rtl:rotate-180">
                          <ArrowRight size={16} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
