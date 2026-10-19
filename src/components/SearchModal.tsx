'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search as SearchIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Product } from '@/lib/products';
import { useDictionary } from '@/context/DictionaryContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.products) {
          // Parse JSON strings to match frontend Product type
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

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(30px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-white/95 overflow-y-auto"
        >
          <div className="absolute top-8 right-8 rtl:right-auto rtl:left-8">
            <button
              onClick={onClose}
              className="p-3 bg-[#eeece5] hover:bg-[#e0ddd4] text-[#1A1A1A] rounded-full transition-colors backdrop-blur-md"
            >
              <X size={24} />
            </button>
          </div>

          <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
            <div className="relative">
              <SearchIcon size={40} className="absolute left-0 rtl:left-auto rtl:right-0 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={dict.searchModal?.placeholder || "Explorer notre collection..."}
                className="w-full bg-transparent border-b border-[#e0ddd4] focus:border-[#1A1A1A] text-4xl md:text-6xl heading-font text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 pl-16 md:pl-20 rtl:pl-0 rtl:pr-16 rtl:md:pr-20 pb-6 outline-none transition-colors"
              />
            </div>

            <div className="mt-16">
              {isLoading && (
                <div className="text-[14px] text-[#9A9A9A] animate-pulse">
                  {dict.searchModal?.loading || "Chargement de la collection..."}
                </div>
              )}
              
              {!isLoading && query.length > 0 && results.length === 0 && (
                <div className="text-[18px] text-[#6B6B6B]">
                  {dict.searchModal?.noResults || "Aucune fragrance trouvée pour"} "{query}".
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3 max-w-2xl"
                >
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/${locale}/product/${product.slug}`}
                      onClick={onClose}
                      className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-[#f8fafc] border border-transparent hover:border-[#e0ddd4] transition-all duration-300"
                    >
                      {/* Mini Thumbnail */}
                      <div className="relative w-16 h-20 sm:w-20 sm:h-24 bg-white rounded-lg overflow-hidden border border-[#e0ddd4] shadow-sm flex-shrink-0">
                        {product.images[0] && (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="80px"
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        )}
                      </div>
                      
                      {/* Mini Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-[#0ea5e9] mb-1 truncate">
                          {product.brandLabel || product.brand}
                        </div>
                        <h3 className="heading-font text-lg sm:text-xl text-[#1A1A1A] group-hover:text-[#0ea5e9] transition-colors truncate">
                          {product.name}
                        </h3>
                        <div className="text-[13px] font-medium text-[#6B6B6B] mt-1">
                          {product.price} MAD
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      <div className="hidden sm:flex w-8 h-8 rounded-full border border-[#e0ddd4] items-center justify-center text-[#9A9A9A] group-hover:bg-[#0ea5e9] group-hover:text-white group-hover:border-[#0ea5e9] transition-all flex-shrink-0 rtl:rotate-180">
                        <ArrowRight size={14} />
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
