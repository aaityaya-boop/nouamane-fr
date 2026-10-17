'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { List, Sparkles, ShieldCheck, ArrowRight, ShoppingBag } from 'lucide-react';
import { formatMAD } from '@/lib/products';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface SidebarProduct {
  id: number;
  slug: string;
  name: string;
  brandLabel: string;
  price: number;
  originalPrice?: number | null;
  image?: string;
}

interface ArticleSidebarProps {
  headings: TocItem[];
  locale?: string;
  featuredProduct?: SidebarProduct | null;
}

export default function ArticleSidebar({
  headings = [],
  locale = 'fr',
  featuredProduct = null
}: ArticleSidebarProps) {
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-90px 0px -65% 0px',
        threshold: 0
      }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 90;
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  };

  return (
    <aside className="space-y-8 sticky top-28">
      {/* 1. TABLE OF CONTENTS */}
      {headings.length > 0 && (
        <div className="bg-[#fafaf7] border border-[#e8e8e8] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#e8e8e8]">
            <List size={16} className="text-[#0ea5e9]" />
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1a1a1a]">
              Sommaire
            </h4>
          </div>

          <nav className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
            {headings.map((h) => {
              const isActive = activeHeadingId === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => scrollToHeading(h.id)}
                  className={`block w-full text-left text-[13px] leading-snug transition-all rounded-lg py-1.5 px-2 ${
                    h.level === 3 ? 'ml-3 text-[12px] border-l border-[#e8e8e8] pl-2' : ''
                  } ${
                    isActive
                      ? 'text-[#0ea5e9] font-bold bg-[#0ea5e9]/5'
                      : 'text-[#555] hover:text-[#1a1a1a] hover:bg-black/5'
                  }`}
                >
                  {h.text}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* 2. EDITORIAL PUBLISHER PROFILE */}
      <div className="bg-[#fafaf7] border border-[#e8e8e8] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-sm shadow-md">
            N
          </div>
          <div>
            <div className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1.5">
              <span>NAY Parfums</span>
              <ShieldCheck size={14} className="text-[#0ea5e9]" />
            </div>
            <div className="text-[11px] text-[#888]">Édition & Expertise Parfumerie</div>
          </div>
        </div>
        <p className="text-[12px] text-[#666] leading-relaxed mb-4">
          La Maison NAY Parfums sélectionne et certifie des fragrances de créateurs 100% authentiques avec livraison rapide et paiement à la livraison partout au Maroc.
        </p>
        <Link
          href={`/${locale}/shop`}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] hover:text-[#0284c7] transition-colors"
        >
          <span>Visiter la boutique</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* 3. FEATURED PRODUCT CALLOUT (IF GIVEN) */}
      {featuredProduct && (
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5 shadow-sm">
          <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0ea5e9] mb-3">
            <Sparkles size={12} /> Parfum en vedette
          </div>
          <Link
            href={`/${locale}/product/${featuredProduct.slug}`}
            className="group block"
          >
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#fbfbfa] mb-3 border border-[#f0f0ee]">
              {featuredProduct.image && (
                <Image
                  src={featuredProduct.image}
                  alt={featuredProduct.name}
                  fill
                  sizes="260px"
                  className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                />
              )}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#888] mb-0.5">
              {featuredProduct.brandLabel}
            </div>
            <div className="text-sm font-bold text-[#1a1a1a] group-hover:text-[#0ea5e9] transition-colors truncate mb-2">
              {featuredProduct.name}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#f0f0ee]">
              <span className="text-sm font-bold text-[#1a1a1a]">
                {formatMAD(featuredProduct.price)}
              </span>
              <span className="text-[11px] font-semibold text-[#0ea5e9] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Découvrir <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
