'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Check,
  Copy,
  List,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Clock,
  Sparkles
} from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface ArticleReadingExperienceProps {
  title: string;
  url: string;
  headings?: TocItem[];
  readingTimeMinutes?: number;
}

export default function ArticleReadingExperience({
  title,
  url,
  headings = [],
  readingTimeMinutes = 5
}: ArticleReadingExperienceProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isTocOpenMobile, setIsTocOpenMobile] = useState(false);

  // Scroll Progress calculation
  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mediaQuery.matches;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for Table of Contents active heading
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
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0
      }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} — NAY Parfum\n${url}`)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

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
    setIsTocOpenMobile(false);
  };

  return (
    <>
      {/* 1. TOP READING PROGRESS BAR (Fixed Under Viewport Top) */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] bg-transparent z-[60] pointer-events-none"
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression de lecture"
      >
        <div
          className="h-full bg-gradient-to-r from-[#0ea5e9] via-[#38bdf8] to-[#0284c7] transition-all duration-150 ease-out shadow-[0_1px_8px_rgba(14,165,233,0.5)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. FLOATING / INLINE SOCIAL SHARE BAR */}
      <div className="flex items-center gap-2 py-4 border-y border-[#e8e8e8] my-8">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#888] mr-2 flex items-center gap-1.5">
          <Share2 size={13} className="text-[#0ea5e9]" /> Partager :
        </span>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          type="button"
          aria-label="Copier le lien"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
            copied
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-[#fafaf7] hover:bg-white text-[#1a1a1a] border border-[#e8e8e8] hover:border-[#1a1a1a]/30'
          }`}
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-600" />
              <span>Copié !</span>
            </>
          ) : (
            <>
              <Copy size={13} className="text-[#888]" />
              <span>Copier le lien</span>
            </>
          )}
        </button>

        {/* WhatsApp Share */}
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Partager sur WhatsApp"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-colors"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span>WhatsApp</span>
        </a>

        {/* Facebook Share */}
        <a
          href={facebookShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Partager sur Facebook"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 border border-[#1877F2]/30 transition-colors"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="hidden sm:inline">Facebook</span>
        </a>
      </div>

      {/* 3. MOBILE COLLAPSIBLE TABLE OF CONTENTS */}
      {headings.length > 0 && (
        <div className="lg:hidden mb-10 bg-[#fafaf7] border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setIsTocOpenMobile(!isTocOpenMobile)}
            className="w-full px-5 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <List size={16} className="text-[#0ea5e9]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                Sommaire de l'article ({headings.length})
              </span>
            </div>
            {isTocOpenMobile ? (
              <ChevronUp size={16} className="text-[#888]" />
            ) : (
              <ChevronDown size={16} className="text-[#888]" />
            )}
          </button>

          {isTocOpenMobile && (
            <nav className="px-5 pb-5 pt-1 border-t border-[#e8e8e8]/60 space-y-2">
              {headings.map((h) => {
                const isActive = activeHeadingId === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => scrollToHeading(h.id)}
                    className={`block w-full text-left text-xs transition-colors py-1 ${
                      h.level === 3 ? 'pl-4 text-[#666]' : 'font-medium'
                    } ${
                      isActive
                        ? 'text-[#0ea5e9] font-bold'
                        : 'text-[#444] hover:text-[#1a1a1a]'
                    }`}
                  >
                    {h.text}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Desktop Sticky Sidebar Table of Contents
 */
export function DesktopTableOfContents({
  headings = [],
  activeHeadingId,
  onHeadingClick
}: {
  headings: TocItem[];
  activeHeadingId?: string;
  onHeadingClick: (id: string) => void;
}) {
  if (!headings.length) return null;

  return (
    <div className="sticky top-28 bg-[#fafaf7] border border-[#e8e8e8] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#e8e8e8]">
        <List size={16} className="text-[#0ea5e9]" />
        <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1a1a1a]">
          Sommaire
        </h4>
      </div>

      <nav className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
        {headings.map((h) => {
          const isActive = activeHeadingId === h.id;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onHeadingClick(h.id)}
              className={`block w-full text-left text-[13px] leading-snug transition-all rounded-lg py-1 px-2 ${
                h.level === 3 ? 'ml-3 text-[12px]' : ''
              } ${
                isActive
                  ? 'text-[#0ea5e9] font-bold bg-[#0ea5e9]/5'
                  : 'text-[#666] hover:text-[#1a1a1a] hover:bg-black/5'
              }`}
            >
              {h.text}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
